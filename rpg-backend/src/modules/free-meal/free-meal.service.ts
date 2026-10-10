import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    FreeMeal,
    FreeMealCancelReason,
    FreeMealDocument,
    FreeMealScope,
    FreeMealStatus,
} from './schema/free-meal.schema';
import { FreeMealItem, FreeMealItemSourceKind } from './schema/free-meal-item.schema';
import { FreeMealTemplate, FreeMealTemplateDocument } from './schema/free-meal-template.schema';
import {
    CreateFreeMealInput,
    FreeMealItemInput,
    FreeMealPlanResponse,
    FreeMealResponse,
    FreeMealTemplateResponse,
    NextFreeMealResponse,
    RedeemFreeMealResponse,
} from './dto/free-meal-dto';
import { toFreeMealResponse, toFreeMealTemplateResponse } from './free-meal.mapper';
import {
    accumulatedKcal,
    checkBuy,
    ClosedDayInfo,
    compareByScheduled,
    cycleDaysBefore,
    dayAvailableKcal,
    exceededNotice,
    FREE_MEAL_LIMITS,
    itemsKcal,
    MAX_ACTIVE_FREE_MEALS_PER_SCOPE,
    missingCycleDays,
    perDayKcal,
    postponeAdvice,
    projectVaultKcal,
    redeemAmounts,
    redeemedDayUsage,
    resolveTemplateQuantities,
    savingDaysLeft,
    scopeTotals,
} from './free-meal-math';
import { ProfileService } from '../profile/profile.service';
import { VaultService } from '../vault/vault.service';
import { CycleDocument } from '../vault/schema/cycle.schema';
import { cycleDaysLeft } from '../vault/cycle-math';
import { CoinService } from '../economy/economy.service';
import { FREE_MEAL_TICKETS } from '../economy/rewards';
import { EnergyService } from '../energy/energy.service';
import { DayService } from '../day/day.service';
import { addDays, toUserDate } from '../common/utils/user-date';

const ACTIVE_STATUSES = [FreeMealStatus.PLANNED, FreeMealStatus.READY];

/**
 * Saldos lidos uma vez por requisicao.
 * `todaySurplusKcal` so e lido quando ha refeicao do dia: e a sobra de hoje (Meta - Consumido) JA
 * descontada do que as `day` resgatadas hoje usaram.
 */
interface Balances {
    vaultBalanceKcal: number;
    coinBalance: number;
    todaySurplusKcal: number | null;
}

@Injectable()
export class FreeMealService {
    constructor(
        @InjectModel(FreeMeal.name) private readonly freeMealModel: Model<FreeMealDocument>,
        @InjectModel(FreeMealTemplate.name) private readonly templateModel: Model<FreeMealTemplateDocument>,
        private readonly profileService: ProfileService,
        private readonly vaultService: VaultService,
        private readonly coinService: CoinService,
        private readonly energyService: EnergyService,
        private readonly dayService: DayService,
    ) { }

    // ── Catalogo ─────────────────────────────────────────────────────────────

    async listTemplates(): Promise<FreeMealTemplateResponse[]> {
        const templates = await this.templateModel.find().sort({ category: 1, name: 1 }).exec();
        return templates.map(toFreeMealTemplateResponse);
    }

    // ── Agendar ──────────────────────────────────────────────────────────────

    /** POST /free-meals: agenda dentro do ciclo aberto (semana de hoje ate domingo). */
    async create(userId: string, dto: CreateFreeMealInput): Promise<FreeMealResponse> {
        const { today, cycle } = await this.openContext(userId);

        // Data: 'day' so hoje; 'week' entre hoje e o domingo do ciclo
        const scheduledFor = dto.scheduledFor ?? today;
        if (dto.scope === FreeMealScope.DAY && scheduledFor !== today) {
            throw new BadRequestException('A refeição livre do dia só pode ser agendada para hoje.');
        }
        if (dto.scope === FreeMealScope.WEEK && (scheduledFor < today || scheduledFor > cycle.endDate)) {
            throw new BadRequestException(
                `Agende a refeição livre da semana entre hoje (${today}) e domingo (${cycle.endDate}).`,
            );
        }

        // Itens: template (atalho e/ou quantidades) + avulsos
        let title = dto.title;
        let template: FreeMealTemplateDocument | null = null;
        const items: FreeMealItem[] = [];
        if (dto.templateSlug) {
            template = await this.templateModel.findOne({ slug: dto.templateSlug }).exec();
            if (!template) {
                throw new NotFoundException('Refeição do catálogo não encontrada.');
            }
            const { quantities, unknownKeys } = resolveTemplateQuantities(
                template.items,
                template.presets,
                dto.preset,
                dto.quantities,
            );
            if (unknownKeys.length > 0) {
                throw new BadRequestException(`Itens que não existem nesta refeição: ${unknownKeys.join(', ')}`);
            }
            for (const item of template.items) {
                const qty = quantities[item.key] ?? 0;
                if (qty <= 0) continue;
                items.push({
                    key: item.key,
                    name: item.name,
                    unit: item.unit,
                    kcalPerUnit: item.kcalPerUnit,
                    qty,
                    source: {
                        kind: FreeMealItemSourceKind.CATALOG,
                        refId: template.slug,
                        name: item.source.name,
                        url: item.source.url,
                        accessedAt: item.source.accessedAt,
                    },
                });
            }
            title = title ?? template.name;
        }
        items.push(...(dto.extraItems ?? []).map(toItemSnapshot));

        if (items.length === 0) {
            throw new BadRequestException('A refeição precisa de pelo menos um item com quantidade maior que zero.');
        }
        if (items.length > FREE_MEAL_LIMITS.MAX_ITEMS) {
            throw new BadRequestException(`No máximo ${FREE_MEAL_LIMITS.MAX_ITEMS} itens por refeição.`);
        }
        const estimatedKcal = itemsKcal(items);
        if (estimatedKcal <= 0 || estimatedKcal > FREE_MEAL_LIMITS.MAX_MEAL_KCAL) {
            throw new BadRequestException(`O total estimado deve ficar entre 1 e ${FREE_MEAL_LIMITS.MAX_MEAL_KCAL} kcal.`);
        }

        // Limite de sanidade (nao e vaga): no maximo N ativas por escopo. Checagem simples; pedidos
        // simultaneos podem passar do limite por poucas unidades, sem consequencia (agendar nao cobra nada).
        const activeCount = await this.freeMealModel.countDocuments({
            user: new Types.ObjectId(userId),
            scope: dto.scope,
            status: { $in: ACTIVE_STATUSES },
        });
        if (activeCount >= MAX_ACTIVE_FREE_MEALS_PER_SCOPE) {
            throw new BadRequestException(
                `Você já tem ${MAX_ACTIVE_FREE_MEALS_PER_SCOPE} refeições livres ${dto.scope === FreeMealScope.WEEK ? 'da semana' : 'do dia'} ativas. Resgate ou cancele alguma para agendar outra.`,
            );
        }

        // Saldos antes de gravar (a do dia precisa do perfil completo: falha aqui, sem deixar refeicao orfa)
        const balances = await this.balances(userId, cycle, today, dto.scope === FreeMealScope.DAY);

        // Agendar so planeja: nada e cobrado nem reservado ate o resgate
        const ticket = FREE_MEAL_TICKETS[dto.scope];
        const meal = await this.freeMealModel.create({
            user: new Types.ObjectId(userId),
            scope: dto.scope,
            template: template?._id ?? null,
            templateSlug: template?.slug ?? null,
            title: title ?? 'Refeição livre',
            scheduledFor,
            plannedItems: items,
            estimatedKcal,
            ticketCost: ticket.coins,
            cycle: cycle._id,
            status: FreeMealStatus.PLANNED,
        });

        await this.syncStatus(meal, balances);
        return toFreeMealResponse(meal);
    }

    // ── Proxima refeicao ─────────────────────────────────────────────────────

    /**
     * GET /free-meals/next: listas `week` e `day` das refeicoes ativas, ordenadas por `scheduledFor` e
     * depois por criacao (a PRIMEIRA de cada lista domina o Hub), mais `totals` por escopo.
     * Cada Plan tem `ready`/`canBuy` proprios, calculados individualmente contra o saldo ATUAL: se o cofre
     * cobre cada uma sozinha mas nao todas juntas, todas aparecem prontas; depois do resgate de uma, as
     * outras sao recalculadas na proxima leitura.
     */
    async next(userId: string): Promise<NextFreeMealResponse> {
        const { today, cycle } = await this.openContext(userId);
        const user = new Types.ObjectId(userId);

        const [week, day] = await Promise.all([
            this.freeMealModel
                .find({ user, cycle: cycle._id, scope: FreeMealScope.WEEK, status: { $in: ACTIVE_STATUSES } })
                .exec(),
            this.freeMealModel
                .find({ user, scope: FreeMealScope.DAY, scheduledFor: today, status: { $in: ACTIVE_STATUSES } })
                .exec(),
        ]);
        week.sort(compareByScheduled);
        day.sort(compareByScheduled);
        const balances = await this.balances(userId, cycle, today, day.length > 0);
        const dayAvailable = balances.todaySurplusKcal ?? 0;

        return {
            today,
            cycle: {
                id: String(cycle._id),
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                daysLeft: cycleDaysLeft(cycle.endDate, today),
            },
            vaultBalanceKcal: balances.vaultBalanceKcal,
            coinBalance: balances.coinBalance,
            week: await this.weekPlans(userId, week, cycle, today, balances),
            day: await this.dayPlans(day, balances),
            totals: {
                week: scopeTotals({
                    estimated: week.map((m) => m.estimatedKcal),
                    tickets: week.map((m) => m.ticketCost),
                    availableKcal: balances.vaultBalanceKcal,
                    coinBalance: balances.coinBalance,
                }),
                day: scopeTotals({
                    estimated: day.map((m) => m.estimatedKcal),
                    tickets: day.map((m) => m.ticketCost),
                    availableKcal: dayAvailable,
                    coinBalance: balances.coinBalance,
                }),
            },
        };
    }

    /**
     * Plans da semana. Individual: neededKcal/ready/canBuy contra o cofre atual.
     * Acumulado (ordem da lista): accumulatedEstimatedKcal = estimado desta + das anteriores;
     * accumulatedNeededKcal = max(0, acumulado - cofre). perDayKcal, projectedKcal e recommendPostpone
     * usam o ACUMULADO (na 1a da lista ele e igual ao individual).
     */
    private async weekPlans(
        userId: string,
        meals: FreeMealDocument[],
        cycle: CycleDocument,
        today: string,
        balances: Balances,
    ): Promise<FreeMealPlanResponse[]> {
        if (meals.length === 0) return [];

        // Dias do ciclo ate ontem: estao todos fechados (com refeicao registrada)?
        const expected = cycleDaysBefore(cycle.startDate, today);
        const closes: ClosedDayInfo[] = expected.length === 0
            ? []
            : (await this.dayService.closesBetween(userId, cycle.startDate, addDays(today, -1))).map((c) => ({
                date: c.date,
                counts: c.foodLogsCount > 0,
                netVaultKcal: c.vaultApplied ? c.savedKcal - c.vaultDebitKcal : 0,
            }));
        const missingDays = missingCycleDays(expected, closes);
        const acc = accumulatedKcal(meals.map((m) => m.estimatedKcal), balances.vaultBalanceKcal);

        const plans: FreeMealPlanResponse[] = [];
        for (const [index, meal] of meals.entries()) {
            const check = await this.syncStatus(meal, balances);
            const daysLeft = savingDaysLeft(today, meal.scheduledFor);
            const projectedKcal = projectVaultKcal({
                balanceKcal: balances.vaultBalanceKcal,
                closes,
                missingDays: missingDays.length,
                daysLeft,
            });
            plans.push({
                meal: toFreeMealResponse(meal),
                availableKcal: balances.vaultBalanceKcal,
                neededKcal: check.missingKcal,
                neededCoins: check.missingCoins,
                ready: check.ready,
                canBuy: check.canBuy,
                accumulatedEstimatedKcal: acc[index].accumulated,
                accumulatedNeededKcal: acc[index].needed,
                daysLeft,
                perDayKcal: perDayKcal(acc[index].needed, daysLeft),
                projectedKcal,
                ...postponeAdvice({
                    ready: acc[index].needed === 0,
                    missingDays: missingDays.length,
                    projectedKcal,
                    estimatedKcal: acc[index].accumulated,
                }),
                missingDays,
            });
        }
        return plans;
    }

    /** Plans do dia: cada uma contra a sobra de hoje ja descontada das `day` resgatadas hoje. */
    private async dayPlans(meals: FreeMealDocument[], balances: Balances): Promise<FreeMealPlanResponse[]> {
        const available = balances.todaySurplusKcal ?? 0;
        const acc = accumulatedKcal(meals.map((m) => m.estimatedKcal), available);

        const plans: FreeMealPlanResponse[] = [];
        for (const [index, meal] of meals.entries()) {
            const check = await this.syncStatus(meal, balances);
            plans.push({
                meal: toFreeMealResponse(meal),
                availableKcal: available,
                neededKcal: check.missingKcal,
                neededCoins: check.missingCoins,
                ready: check.ready,
                canBuy: check.canBuy,
                accumulatedEstimatedKcal: acc[index].accumulated,
                accumulatedNeededKcal: acc[index].needed,
                daysLeft: 0,
                perDayKcal: check.missingKcal > 0 ? null : 0,
                projectedKcal: null,
                recommendPostpone: false,
                postponeCode: null,
                postponeReason: null,
                missingDays: [],
            });
        }
        return plans;
    }

    // ── Resgatar ─────────────────────────────────────────────────────────────

    /**
     * POST /free-meals/:id/redeem. Sem transacao (Mongo local standalone):
     *  1. revalida canBuy;
     *  2. troca o status para 'redeemed' numa operacao condicional (so uma chamada vence);
     *  3. grava os debitos idempotentes (refId = id da refeicao): ticket e, na semana, o cofre.
     * Se o passo 3 falhar no meio, chamar de novo cai no ramo "ja resgatada" e completa o que faltou
     * sem cobrar em dobro (indices unicos de coin_entries e vault_entries por refId).
     *
     * canBuy e revalidado contra o saldo ATUAL: o cofre e as moedas ja descontam o que as outras
     * refeicoes resgatadas gastaram (ledger); na `day`, a sobra de hoje desconta as `day` ja resgatadas hoje.
     * Limite conhecido: duas refeicoes DIFERENTES resgatadas EXATAMENTE ao mesmo tempo passam as duas
     * pela revalidacao e podem deixar moedas (ou cofre) abaixo de zero; o cofre e lido com piso em 0.
     * No Atlas (replica set) o resgate pode virar uma transacao.
     */
    async redeem(userId: string, mealId: string, actualInput?: FreeMealItemInput[]): Promise<RedeemFreeMealResponse> {
        const { today, cycle } = await this.openContext(userId);
        const meal = await this.findOwned(userId, mealId);

        if (meal.status === FreeMealStatus.REDEEMED) {
            return this.completeRedeem(userId, meal, cycle, today, true);
        }
        if (meal.status === FreeMealStatus.CANCELLED) {
            throw new BadRequestException(
                meal.cancelReason === FreeMealCancelReason.EXPIRED
                    ? 'Esta refeição livre expirou (o prazo dela terminou sem resgate).'
                    : 'Esta refeição livre foi cancelada.',
            );
        }

        // 1. Revalida as duas metas agora, antes de cobrar
        const balances = await this.balances(userId, cycle, today, meal.scope === FreeMealScope.DAY);
        const check = await this.syncStatus(meal, balances);
        if (!check.canBuy) {
            throw new BadRequestException({
                message: 'Ainda não dá para resgatar: faltam kcal e/ou moedas.',
                details: { missingKcal: check.missingKcal, missingCoins: check.missingCoins },
            });
        }

        const actualItems = actualInput ? actualInput.map(toItemSnapshot) : null;
        const actualKcal = actualItems ? itemsKcal(actualItems) : null;
        const amounts = redeemAmounts(meal.estimatedKcal, actualKcal);

        // 2. Troca de status condicional: so uma chamada simultanea vence
        const claimed = await this.freeMealModel
            .findOneAndUpdate(
                { _id: meal._id, user: meal.user, status: { $in: ACTIVE_STATUSES } },
                {
                    $set: {
                        status: FreeMealStatus.REDEEMED,
                        redeemedAt: new Date(),
                        actualItems: actualItems ?? [],
                        actualKcal,
                        exceededKcal: amounts.exceededKcal,
                        vaultDebitKcal: meal.scope === FreeMealScope.WEEK ? amounts.vaultDebitKcal : 0,
                    },
                },
                { returnDocument: 'after' },
            )
            .exec();

        if (!claimed) {
            // Outra chamada mudou o status no meio do caminho
            const current = await this.findOwned(userId, mealId);
            if (current.status === FreeMealStatus.REDEEMED) {
                return this.completeRedeem(userId, current, cycle, today, true);
            }
            throw new BadRequestException('Esta refeição livre não pode mais ser resgatada.');
        }

        // 3. Debitos idempotentes
        return this.completeRedeem(userId, claimed, cycle, today, false);
    }

    /**
     * Grava (ou confere) os debitos do resgate. Idempotente por refId = id da refeicao.
     * Se o ciclo da refeicao ja foi encerrado (o zeramento ja aconteceu), nao debita nada no
     * ciclo novo: cobrar agora tiraria moedas/kcal da semana seguinte.
     */
    private async completeRedeem(
        userId: string,
        meal: FreeMealDocument,
        openCycle: CycleDocument,
        today: string,
        alreadyRedeemed: boolean,
    ): Promise<RedeemFreeMealResponse> {
        const mealId = String(meal._id);
        const sameCycle = String(meal.cycle) === String(openCycle._id);
        const vaultDebitKcal = meal.scope === FreeMealScope.WEEK ? (meal.vaultDebitKcal ?? 0) : 0;

        if (sameCycle) {
            const { reason } = FREE_MEAL_TICKETS[meal.scope];
            if (meal.ticketCost > 0) {
                await this.coinService.addOnce(userId, -meal.ticketCost, reason, mealId);
            }
            if (vaultDebitKcal > 0) {
                await this.vaultService.debitRedeem(openCycle, today, vaultDebitKcal, mealId);
            }
        }

        const [vaultBalanceKcal, coinBalance] = await Promise.all([
            this.vaultService.balance(String(openCycle._id)),
            this.coinService.balance(userId),
        ]);
        const exceededKcal = meal.exceededKcal ?? 0;

        return {
            meal: toFreeMealResponse(meal),
            alreadyRedeemed,
            coinsDebited: meal.ticketCost,
            vaultDebitKcal,
            exceededKcal,
            vaultBalanceKcal,
            coinBalance,
            notice: exceededNotice(exceededKcal),
        };
    }

    // ── Cancelar ─────────────────────────────────────────────────────────────

    /** DELETE /free-meals/:id: cancela (so se ainda nao foi resgatada). Idempotente. */
    async cancel(userId: string, mealId: string): Promise<FreeMealResponse> {
        await this.openContext(userId);
        const meal = await this.findOwned(userId, mealId);

        if (meal.status === FreeMealStatus.CANCELLED) {
            return toFreeMealResponse(meal);
        }
        if (meal.status === FreeMealStatus.REDEEMED) {
            throw new BadRequestException('Esta refeição livre já foi resgatada e não pode ser cancelada.');
        }

        const cancelled = await this.freeMealModel
            .findOneAndUpdate(
                { _id: meal._id, user: meal.user, status: { $in: ACTIVE_STATUSES } },
                {
                    $set: {
                        status: FreeMealStatus.CANCELLED,
                        cancelReason: FreeMealCancelReason.USER,
                        cancelledAt: new Date(),
                    },
                },
                { returnDocument: 'after' },
            )
            .exec();

        if (!cancelled) {
            const current = await this.findOwned(userId, mealId);
            if (current.status === FreeMealStatus.CANCELLED) return toFreeMealResponse(current);
            throw new BadRequestException('Esta refeição livre já foi resgatada e não pode ser cancelada.');
        }

        return toFreeMealResponse(cancelled);
    }

    // ── Galeria ──────────────────────────────────────────────────────────────

    /** GET /free-meals: galeria de conquistas (resgatadas), mais recentes primeiro. */
    async gallery(userId: string, limit = 50): Promise<FreeMealResponse[]> {
        const meals = await this.freeMealModel
            .find({ user: new Types.ObjectId(userId), status: FreeMealStatus.REDEEMED })
            .sort({ redeemedAt: -1 })
            .limit(limit)
            .exec();
        return meals.map(toFreeMealResponse);
    }

    // ── Apoio ────────────────────────────────────────────────────────────────

    /** Hoje (fuso do usuario), ciclo aberto (fecha o vencido) e expiracao preguicosa das refeicoes. */
    private async openContext(userId: string): Promise<{ today: string; cycle: CycleDocument }> {
        const today = toUserDate(await this.profileService.getTimezone(userId));
        const cycle = await this.vaultService.getOpenCycle(userId, today);
        await this.expireStale(userId, today, cycle._id as Types.ObjectId);
        return { today, cycle };
    }

    /**
     * Sem cron: refeicao da semana de um ciclo que nao e mais o aberto, ou do dia de uma data
     * que ja passou, e nao foi resgatada, vira 'cancelled' com cancelReason 'expired'.
     */
    private async expireStale(userId: string, today: string, openCycleId: Types.ObjectId): Promise<void> {
        await this.freeMealModel.updateMany(
            {
                user: new Types.ObjectId(userId),
                status: { $in: ACTIVE_STATUSES },
                $or: [
                    { scope: FreeMealScope.WEEK, cycle: { $ne: openCycleId } },
                    { scope: FreeMealScope.DAY, scheduledFor: { $lt: today } },
                ],
            },
            {
                $set: {
                    status: FreeMealStatus.CANCELLED,
                    cancelReason: FreeMealCancelReason.EXPIRED,
                    cancelledAt: new Date(),
                },
            },
        );
    }

    private async balances(userId: string, cycle: CycleDocument, today: string, withDay: boolean): Promise<Balances> {
        const [vaultBalanceKcal, coinBalance, todaySurplusKcal] = await Promise.all([
            this.vaultService.balance(String(cycle._id)),
            this.coinService.balance(userId),
            withDay ? this.todaySurplus(userId, today) : Promise.resolve(null),
        ]);
        return { vaultBalanceKcal, coinBalance, todaySurplusKcal };
    }

    /**
     * Sobra de hoje disponivel para refeicoes `day`:
     *   max(0, (Meta do dia - Consumido ate agora) - soma(min(comido, estimado) das day resgatadas hoje)).
     * Meta/Consumido vem da mesma conta do DayService/energy-math. "Resgatada hoje" = day resgatada com
     * scheduledFor = hoje (a day so e agendada para hoje e expira se o dia passa sem resgate), no dia do
     * usuario (toUserDate), sem depender de fuso do servidor.
     */
    private async todaySurplus(userId: string, today: string): Promise<number> {
        const body = await this.profileService.getNutritionInput(userId);
        const [energy, redeemedToday] = await Promise.all([
            this.energyService.computeDay(userId, today, body),
            this.freeMealModel
                .find({
                    user: new Types.ObjectId(userId),
                    scope: FreeMealScope.DAY,
                    status: FreeMealStatus.REDEEMED,
                    scheduledFor: today,
                })
                .select('estimatedKcal actualKcal')
                .lean()
                .exec(),
        ]);
        return dayAvailableKcal(
            energy.targetKcal - energy.consumedKcal,
            redeemedDayUsage(redeemedToday.map((m) => ({ estimatedKcal: m.estimatedKcal, actualKcal: m.actualKcal ?? null }))),
        );
    }

    /**
     * Status calculado de forma preguicosa (como o ciclo): planned <-> ready conforme as kcal
     * disponiveis agora. Grava so se mudou e se a refeicao ainda esta ativa.
     */
    private async syncStatus(meal: FreeMealDocument, balances: Balances) {
        const availableKcal = meal.scope === FreeMealScope.WEEK
            ? balances.vaultBalanceKcal
            : (balances.todaySurplusKcal ?? 0);
        const check = checkBuy({
            availableKcal,
            estimatedKcal: meal.estimatedKcal,
            coinBalance: balances.coinBalance,
            ticketCost: meal.ticketCost,
        });

        const computed = check.ready ? FreeMealStatus.READY : FreeMealStatus.PLANNED;
        if (ACTIVE_STATUSES.includes(meal.status) && meal.status !== computed) {
            const result = await this.freeMealModel.updateOne(
                { _id: meal._id, status: meal.status },
                { $set: { status: computed } },
            );
            if (result.modifiedCount > 0) {
                meal.status = computed;
            }
        }
        return check;
    }

    private async findOwned(userId: string, mealId: string): Promise<FreeMealDocument> {
        const meal = await this.freeMealModel
            .findOne({ _id: new Types.ObjectId(mealId), user: new Types.ObjectId(userId) })
            .exec();
        if (!meal) {
            throw new NotFoundException('Refeição livre não encontrada.');
        }
        return meal;
    }
}

/** Item avulso (ou informado no resgate) vira snapshot. */
function toItemSnapshot(input: FreeMealItemInput): FreeMealItem {
    return {
        key: input.key ?? null,
        name: input.name,
        unit: input.unit,
        kcalPerUnit: input.kcalPerUnit,
        qty: input.qty,
        source: {
            kind: input.source.kind,
            refId: input.source.refId ?? null,
            name: null,
            url: null,
            accessedAt: null,
        },
    };
}
