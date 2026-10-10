import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DayClose, DayCloseDocument } from './schema/day-close.schema';
import { DayCloseResponse, DayStateResponse } from './dto/day-dto';
import { toDayStateResponse } from './day.mapper';
import { closeBlockedReason, EMPTY_DAY_NOTICE, PAST_CYCLE_NOTICE } from './day-rules';
import { ProfileService } from '../profile/profile.service';
import { EnergyService } from '../energy/energy.service';
import { calculateDayVault, OVERFLOW_ALERT } from '../energy/energy-math';
import { VaultService } from '../vault/vault.service';
import { cycleContains } from '../vault/cycle-math';
import { RewardService, RewardResult } from '../economy/reward.service';
import { CoinReason } from '../economy/schema/coin-entry.schema';
import { ProgressService } from '../progress/progress.service';
import { streakBonusesCrossed } from '../progress/streak';
import { toUserDate } from '../common/utils/user-date';
import { isDuplicateKeyError } from '../common/utils/mongo-errors';

// Quantos dias fechados ler para recalcular a sequencia
const STREAK_LOOKBACK = 400;

const NO_REWARD: RewardResult = { granted: false, coins: 0, xp: 0, leveledUp: false };

@Injectable()
export class DayService {
    constructor(
        @InjectModel(DayClose.name) private readonly dayCloseModel: Model<DayCloseDocument>,
        private readonly profileService: ProfileService,
        private readonly energyService: EnergyService,
        private readonly vaultService: VaultService,
        private readonly rewardService: RewardService,
        private readonly progressService: ProgressService,
    ) { }

    private async today(userId: string): Promise<string> {
        return toUserDate(await this.profileService.getTimezone(userId));
    }

    private findClose(userId: string, date: string) {
        return this.dayCloseModel.findOne({ user: new Types.ObjectId(userId), date }).exec();
    }

    /** GET /day/:date: estado do dia (aberto/fechado, meta, consumido, previsao do cofre). */
    async getDay(userId: string, date: string): Promise<DayStateResponse> {
        const today = await this.today(userId);
        const body = await this.profileService.getNutritionInput(userId);
        const [energy, closed, cycle] = await Promise.all([
            this.energyService.computeDay(userId, date, body),
            this.findClose(userId, date),
            this.vaultService.getOpenCycle(userId, today),
        ]);

        // Previsao: o que aconteceria com o cofre se o dia fosse fechado agora
        const inCycle = cycleContains(cycle, date);
        const balance = inCycle ? await this.vaultService.balance(String(cycle._id)) : 0;
        const preview = calculateDayVault({
            closed: true,
            hasFoodLogs: energy.foodLogsCount > 0,
            targetKcal: energy.targetKcal,
            consumedKcal: energy.consumedKcal,
            vaultBalanceKcal: balance,
        });

        return toDayStateResponse({
            date,
            today,
            energy,
            closed,
            preview,
            closeBlockedReason: closeBlockedReason({
                alreadyClosed: closed !== null,
                date,
                today,
            }),
        });
    }

    /**
     * POST /day/close: fecha hoje ou ontem.
     * Idempotente: fechar de novo devolve o fechamento existente sem pagar nada.
     */
    async closeDay(userId: string, dateInput?: string): Promise<DayCloseResponse> {
        const today = await this.today(userId);
        const date = dateInput ?? today;

        const existing = await this.findClose(userId, date);
        if (existing) {
            return this.alreadyClosedResponse(userId, date, today);
        }

        const body = await this.profileService.getNutritionInput(userId);
        const energy = await this.energyService.computeDay(userId, date, body);

        const blocked = closeBlockedReason({ alreadyClosed: false, date, today });
        if (blocked) {
            throw new BadRequestException(blocked);
        }

        // Sem refeicao registrada o dia fecha, mas nao rende nada e quebra a sequencia
        const hasFoodLogs = energy.foodLogsCount > 0;

        // Fechamento preguicoso do ciclo vencido acontece aqui
        const openCycle = await this.vaultService.getOpenCycle(userId, today);
        const inCycle = cycleContains(openCycle, date);
        const cycle = inCycle ? openCycle : await this.vaultService.findCycleForDate(userId, date);
        const balanceBefore = inCycle ? await this.vaultService.balance(String(openCycle._id)) : 0;

        const vault = calculateDayVault({
            closed: true,
            hasFoodLogs,
            targetKcal: energy.targetKcal,
            consumedKcal: energy.consumedKcal,
            vaultBalanceKcal: balanceBefore,
        });

        // Grava o fechamento ANTES de pagar: o indice unico (user, date) barra fechamento duplo simultaneo
        try {
            await this.dayCloseModel.create({
                user: new Types.ObjectId(userId),
                date,
                cycle: cycle?._id ?? null,
                bmr: energy.bmr,
                baseKcal: energy.baseKcal,
                workoutKcal: energy.workoutKcal,
                stepsKcal: energy.stepsKcal,
                activeKcal: energy.activeKcal,
                targetKcal: energy.targetKcal,
                consumedKcal: energy.consumedKcal,
                foodLogsCount: energy.foodLogsCount,
                savedKcal: inCycle ? vault.savedKcal : 0,
                overflowKcal: vault.overflowKcal,
                vaultDebitKcal: inCycle ? vault.debitKcal : 0,
                vaultApplied: inCycle,
                closedAt: new Date(),
            });
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                return this.alreadyClosedResponse(userId, date, today);
            }
            throw error;
        }

        // Cofre e moedas: so se o dia e da semana aberta (moedas de semana encerrada ja foram zeradas)
        // e se houve refeicao registrada
        let dayReward = NO_REWARD;
        if (inCycle && hasFoodLogs) {
            await this.vaultService.deposit(openCycle, date, vault.savedKcal);
            await this.vaultService.debitOverflow(openCycle, date, vault.debitKcal);
            dayReward = await this.rewardService.grant(userId, CoinReason.DAY_CLOSE, date);
        }

        // Sequencia (recalculada a partir dos dias fechados) e bonus a cada 7 dias
        const streak = await this.updateStreak(userId);
        let streakReward = NO_REWARD;
        if (inCycle && streak.lastClosedDate && streakBonusesCrossed(streak.previousStreak, streak.currentStreak) > 0) {
            streakReward = await this.rewardService.grant(userId, CoinReason.STREAK_7, streak.lastClosedDate);
        }

        return {
            day: await this.getDay(userId, date),
            alreadyClosed: false,
            rewards: {
                coins: dayReward.coins + streakReward.coins,
                xp: dayReward.xp + streakReward.xp,
                leveledUp: dayReward.leveledUp || streakReward.leveledUp,
            },
            streak: { current: streak.currentStreak, best: streak.bestStreak },
            vaultBalanceKcal: await this.vaultService.balance(String(openCycle._id)),
            alert: vault.overflowKcal > 0 ? OVERFLOW_ALERT : null,
            notice: !hasFoodLogs ? EMPTY_DAY_NOTICE : inCycle ? null : PAST_CYCLE_NOTICE,
        };
    }

    private async updateStreak(userId: string) {
        const closes = await this.dayCloseModel
            .find({ user: new Types.ObjectId(userId) })
            .select('date foodLogsCount')
            .sort({ date: -1 })
            .limit(STREAK_LOOKBACK)
            .lean()
            .exec();
        return this.progressService.updateStreak(
            userId,
            closes.map((c) => ({ date: c.date, counts: c.foodLogsCount > 0 })),
        );
    }

    private async alreadyClosedResponse(userId: string, date: string, today: string): Promise<DayCloseResponse> {
        const [day, progress, cycle] = await Promise.all([
            this.getDay(userId, date),
            this.progressService.getOrCreate(userId),
            this.vaultService.getOpenCycle(userId, today),
        ]);
        return {
            day,
            alreadyClosed: true,
            rewards: { coins: 0, xp: 0, leveledUp: false },
            streak: { current: progress.currentStreak, best: progress.bestStreak },
            vaultBalanceKcal: await this.vaultService.balance(String(cycle._id)),
            alert: day.overflowKcal > 0 ? OVERFLOW_ALERT : null,
            notice: null,
        };
    }
}
