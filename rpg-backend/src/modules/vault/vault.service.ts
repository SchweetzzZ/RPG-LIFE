import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cycle, CycleDocument, CycleStatus } from './schema/cycle.schema';
import { VaultEntry, VaultEntryDocument, VaultEntryType } from './schema/vault-entry.schema';
import { CoinService } from '../economy/economy.service';
import { isDuplicateKeyError } from '../common/utils/mongo-errors';
import { cycleContains, cycleDaysLeft, isCycleExpired, resetAmount, weekWindow } from './cycle-math';
import { VaultResponseDto } from './dto/vault-dto';
import { toCycleResponse, toVaultEntryResponse } from './vault.mapper';

@Injectable()
export class VaultService {
    constructor(
        @InjectModel(Cycle.name) private readonly cycleModel: Model<CycleDocument>,
        @InjectModel(VaultEntry.name) private readonly vaultEntryModel: Model<VaultEntryDocument>,
        private readonly coinService: CoinService,
    ) { }

    // ── Ciclo ────────────────────────────────────────────────────────────────

    /**
     * Ciclo aberto do usuario em `today` (data no fuso dele).
     * O ciclo e a semana de segunda a domingo. Fechamento preguicoso (sem cron): se o ciclo
     * aberto ja terminou, zera cofre e moedas, fecha e abre o da semana de hoje.
     */
    async getOpenCycle(userId: string, today: string): Promise<CycleDocument> {
        const user = new Types.ObjectId(userId);
        const open = await this.cycleModel.findOne({ user, status: CycleStatus.OPEN }).exec();

        if (open && !isCycleExpired(open.endDate, today)) {
            return open;
        }
        if (open) {
            await this.closeCycle(userId, open);
        }
        return this.openCycle(user, today);
    }

    /**
     * A acao feita em `date` pode render moedas? So se o dia e do ciclo aberto e nao e futuro.
     * (Moedas de um ciclo encerrado ja foram zeradas; paga-las no ciclo novo seria vazamento.)
     */
    async canEarnOn(userId: string, date: string, today: string): Promise<boolean> {
        if (date > today) return false;
        const cycle = await this.getOpenCycle(userId, today);
        return cycleContains(cycle, date);
    }

    /** Ciclo (aberto ou fechado) que contem `date`, se houver. */
    async findCycleForDate(userId: string, date: string): Promise<CycleDocument | null> {
        return this.cycleModel
            .findOne({ user: new Types.ObjectId(userId), startDate: { $lte: date }, endDate: { $gte: date } })
            .sort({ startDate: -1 })
            .exec();
    }

    /** Ultimo ciclo fechado (para o extrato mostrar o que foi zerado). */
    async lastClosedCycle(userId: string): Promise<CycleDocument | null> {
        return this.cycleModel
            .findOne({ user: new Types.ObjectId(userId), status: CycleStatus.CLOSED })
            .sort({ startDate: -1 })
            .exec();
    }

    private async openCycle(user: Types.ObjectId, today: string): Promise<CycleDocument> {
        try {
            return await this.cycleModel.create({ user, ...weekWindow(today) });
        } catch (error) {
            // Outra requisicao abriu o ciclo ao mesmo tempo: usa o dela
            if (isDuplicateKeyError(error)) {
                return this.cycleModel.findOne({ user, status: CycleStatus.OPEN }).orFail().exec();
            }
            throw error;
        }
    }

    /**
     * Fim do ciclo: zera o cofre e as moedas que sobraram e marca como fechado.
     * Os zeramentos vem primeiro e sao idempotentes (refId = id do ciclo), entao uma falha
     * no meio ou duas requisicoes simultaneas nao zeram duas vezes.
     */
    private async closeCycle(userId: string, cycle: CycleDocument): Promise<void> {
        const cycleId = String(cycle._id);

        const amount = resetAmount(await this.balance(cycleId));
        if (amount !== 0) {
            await this.insertOnce({
                user: cycle.user,
                cycle: cycle._id,
                date: cycle.endDate,
                kcal: amount,
                type: VaultEntryType.CYCLE_RESET,
                refId: cycleId,
            });
        }
        await this.coinService.resetBalance(userId, cycleId);

        await this.cycleModel.updateOne(
            { _id: cycle._id, status: CycleStatus.OPEN },
            {
                $set: {
                    status: CycleStatus.CLOSED,
                    closedAt: new Date(),
                },
            },
        );
    }

    // ── Cofre ────────────────────────────────────────────────────────────────

    /** GET /vault: saldo e extrato do ciclo aberto + o que foi zerado no ciclo anterior. */
    async getSummary(userId: string, today: string): Promise<VaultResponseDto> {
        const cycle = await this.getOpenCycle(userId, today);
        const cycleId = String(cycle._id);
        const [balanceKcal, entries, previous] = await Promise.all([
            this.balance(cycleId),
            this.entries(cycleId),
            this.lastClosedCycle(userId),
        ]);

        let previousCycle: VaultResponseDto['previousCycle'] = null;
        if (previous) {
            const reset = await this.vaultEntryModel
                .findOne({ cycle: previous._id, type: VaultEntryType.CYCLE_RESET })
                .exec();
            previousCycle = { ...toCycleResponse(previous), resetKcal: reset ? -reset.kcal : 0 };
        }

        return {
            today,
            cycle: { ...toCycleResponse(cycle), daysLeft: cycleDaysLeft(cycle.endDate, today) },
            balanceKcal,
            entries: entries.map(toVaultEntryResponse),
            previousCycle,
        };
    }

    /** Saldo do cofre = soma das entradas do ciclo. */
    async balance(cycleId: string): Promise<number> {
        const result = await this.vaultEntryModel.aggregate<{ total: number }>([
            { $match: { cycle: new Types.ObjectId(cycleId) } },
            { $group: { _id: null, total: { $sum: '$kcal' } } },
        ]);
        return Math.max(0, result[0]?.total ?? 0);
    }

    /** Extrato do ciclo, mais antigas primeiro. */
    async entries(cycleId: string): Promise<VaultEntryDocument[]> {
        return this.vaultEntryModel
            .find({ cycle: new Types.ObjectId(cycleId) })
            .sort({ createdAt: 1 })
            .exec();
    }

    /** Deposito do dia fechado (refId = data). Nao faz nada se kcal <= 0. */
    async deposit(cycle: CycleDocument, date: string, kcal: number): Promise<void> {
        if (kcal <= 0) return;
        await this.insertOnce({
            user: cycle.user,
            cycle: cycle._id,
            date,
            kcal,
            type: VaultEntryType.DAY_CLOSE,
            refId: date,
        });
    }

    /** Debito do excedente do dia (refId = data). O valor ja vem limitado ao saldo. */
    async debitOverflow(cycle: CycleDocument, date: string, kcal: number): Promise<void> {
        if (kcal <= 0) return;
        await this.insertOnce({
            user: cycle.user,
            cycle: cycle._id,
            date,
            kcal: -kcal,
            type: VaultEntryType.OVERFLOW,
            refId: date,
        });
    }

    /**
     * Debito do resgate da refeicao livre da semana (refId = id da refeicao).
     * Idempotente: chamar de novo (ex.: resgate repetido apos falha no meio) nao debita duas vezes.
     */
    async debitRedeem(cycle: CycleDocument, date: string, kcal: number, freeMealId: string): Promise<void> {
        if (kcal <= 0) return;
        await this.insertOnce({
            user: cycle.user,
            cycle: cycle._id as Types.ObjectId,
            date,
            kcal: -kcal,
            type: VaultEntryType.REDEEM,
            refId: freeMealId,
        });
    }

    private async insertOnce(entry: {
        user: Types.ObjectId;
        cycle: Types.ObjectId;
        date: string;
        kcal: number;
        type: VaultEntryType;
        refId: string;
    }): Promise<void> {
        try {
            await this.vaultEntryModel.create(entry);
        } catch (error) {
            // Ja lancado antes (mesmo tipo + refId): nada a fazer
            if (!isDuplicateKeyError(error)) throw error;
        }
    }
}
