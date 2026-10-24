import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DayClose, DayCloseDocument } from '../day/schema/day-close.schema';
import { Cycle, CycleDocument } from '../vault/schema/cycle.schema';
import { VaultEntry, VaultEntryDocument, VaultEntryType } from '../vault/schema/vault-entry.schema';
import { CoinEntry, CoinEntryDocument } from '../economy/schema/coin-entry.schema';
import { WorkoutLog, WorkoutLogDocument } from '../workout/schemas/workout-log';
import { FreeMeal, FreeMealDocument, FreeMealStatus } from '../free-meal/schema/free-meal.schema';
import { ProfileService } from '../profile/profile.service';
import { ProgressService } from '../progress/progress.service';
import { WeightService } from '../weight/weight.service';
import { addDays, dayOfWeek, daysBetween, toUserDate } from '../common/utils/user-date';
import { weekWindow } from '../vault/cycle-math';
import { changeBetween } from '../weight/weight-math';
import { REWARD_REASONS, sumRewards, weekRecords } from './summary-math';
import { WeekSummaryResponse } from './dto/summary-dto';

/**
 * Resumo da semana (F10): calculado sob demanda a partir do que ja existe
 * (dias fechados, cofre, livro de moedas, treinos e pesagens). Nenhuma colecao nova.
 */
@Injectable()
export class SummaryService {
    constructor(
        @InjectModel(DayClose.name) private readonly dayCloseModel: Model<DayCloseDocument>,
        @InjectModel(Cycle.name) private readonly cycleModel: Model<CycleDocument>,
        @InjectModel(VaultEntry.name) private readonly vaultEntryModel: Model<VaultEntryDocument>,
        @InjectModel(CoinEntry.name) private readonly coinEntryModel: Model<CoinEntryDocument>,
        @InjectModel(WorkoutLog.name) private readonly workoutLogModel: Model<WorkoutLogDocument>,
        @InjectModel(FreeMeal.name) private readonly freeMealModel: Model<FreeMealDocument>,
        private readonly profileService: ProfileService,
        private readonly progressService: ProgressService,
        private readonly weightService: WeightService,
    ) { }

    private async today(userId: string): Promise<string> {
        return toUserDate(await this.profileService.getTimezone(userId));
    }

    /** Segunda-feira da semana passada (a ultima que ja terminou). */
    private lastWeekStart(today: string): string {
        return addDays(weekWindow(today).startDate, -7);
    }

    /** GET /summary/week/status: o Hub mostra o resumo uma vez, na primeira abertura da semana nova. */
    async getStatus(userId: string) {
        const today = await this.today(userId);
        const start = this.lastWeekStart(today);
        const end = addDays(start, 6);
        const user = new Types.ObjectId(userId);

        const [progress, closes, workouts] = await Promise.all([
            this.progressService.get(userId),
            this.dayCloseModel.countDocuments({ user, date: { $gte: start, $lte: end } }),
            this.workoutLogModel.countDocuments({ user, date: { $gte: start, $lte: end } }),
        ]);
        const hasActivity = closes + workouts > 0;
        const seen = progress?.lastWeeklySummarySeen ?? null;
        return { pending: hasActivity && (seen === null || seen < start), start, hasActivity };
    }

    /** POST /summary/week/seen */
    async markSeen(userId: string, start: string) {
        if (dayOfWeek(start) !== 1) {
            throw new BadRequestException('A semana começa na segunda-feira: informe a data de uma segunda');
        }
        const lastWeeklySummarySeen = await this.progressService.markWeeklySummarySeen(userId, start);
        return { lastWeeklySummarySeen };
    }

    /** GET /summary/week?start=: resultado da semana (segunda a domingo, o ciclo do cofre). */
    async getWeek(userId: string, startParam?: string): Promise<WeekSummaryResponse> {
        const today = await this.today(userId);
        const start = startParam ?? this.lastWeekStart(today);
        if (dayOfWeek(start) !== 1) {
            throw new BadRequestException('A semana começa na segunda-feira: informe a data de uma segunda');
        }
        if (start > today) {
            throw new BadRequestException('Essa semana ainda não começou');
        }
        const end = addDays(start, 6);
        const lastLivedDay = end < today ? end : today;
        const user = new Types.ObjectId(userId);
        const range = { $gte: start, $lte: end };

        const [closes, cycle, coinEntries, workoutLogs, freeMeals, progress, weights, profile] = await Promise.all([
            this.dayCloseModel.find({ user, date: range }).select('foodLogsCount').lean().exec(),
            this.cycleModel.findOne({ user, startDate: start }).exec(),
            // Recompensas usam a data da acao como refId (fechar, treino, passos, bonus de 7 dias)
            this.coinEntryModel
                .find({ user, reason: { $in: REWARD_REASONS }, refId: range })
                .select('amount reason')
                .lean()
                .exec(),
            // Treinos ate o fim da semana: os anteriores dao o "melhor valor" para comparar os recordes
            this.workoutLogModel.find({ user, date: { $lte: end } }).select('date exercises').lean().exec(),
            this.freeMealModel
                .find({ user, status: FreeMealStatus.REDEEMED, scheduledFor: range })
                .sort({ scheduledFor: 1 })
                .lean()
                .exec(),
            this.progressService.get(userId),
            this.weightService.points(userId),
            this.profileService.getProfile(userId).catch(() => null),
        ]);

        const vault = { savedKcal: 0, overflowKcal: 0, redeemedKcal: 0, expiredKcal: 0 };
        if (cycle) {
            const entries = await this.vaultEntryModel.find({ cycle: cycle._id }).select('kcal type').lean().exec();
            for (const e of entries) {
                if (e.type === VaultEntryType.DAY_CLOSE) vault.savedKcal += e.kcal;
                if (e.type === VaultEntryType.OVERFLOW) vault.overflowKcal -= e.kcal;
                if (e.type === VaultEntryType.REDEEM) vault.redeemedKcal -= e.kcal;
                if (e.type === VaultEntryType.CYCLE_RESET) vault.expiredKcal -= e.kcal;
            }
        }

        const weekWeights = weights.filter((w) => w.date >= start && w.date <= end);

        return {
            start,
            end,
            today,
            inProgress: today <= end,
            days: {
                closed: closes.length,
                withMeals: closes.filter((c) => c.foodLogsCount > 0).length,
                total: daysBetween(start, lastLivedDay) + 1,
            },
            vault,
            freeMeals: freeMeals.map((m) => ({
                id: String(m._id),
                title: m.title,
                scope: m.scope,
                date: m.scheduledFor,
                kcal: m.actualKcal ?? m.estimatedKcal,
            })),
            workouts: {
                count: workoutLogs.filter((l) => l.date >= start).length,
                records: weekRecords(workoutLogs, start, end),
            },
            rewards: sumRewards(coinEntries),
            streak: {
                current: progress?.currentStreak ?? 0,
                best: progress?.bestStreak ?? 0,
            },
            weight: {
                entries: weekWeights.length,
                changeKg: changeBetween(weights, start, end),
                endKg: weekWeights.length > 0 ? weekWeights[weekWeights.length - 1].weightKg : null,
                primaryGoal: profile?.primaryGoal ?? null,
            },
        };
    }
}
