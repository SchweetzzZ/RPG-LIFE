import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WeightLog, WeightLogDocument } from './schema/weight-log.schema';
import { ProfileService } from '../profile/profile.service';
import { UserProfile } from '../profile/schema/profile.schema';
import { toUserDate } from '../common/utils/user-date';
import { WeightMutationResponse, WeightResponse } from './dto/weight-dto';
import { WeightPoint, reachedTarget, roundKg, weekChangeKg, withTrend } from './weight-math';

@Injectable()
export class WeightService {
    constructor(
        @InjectModel(WeightLog.name) private readonly weightLogModel: Model<WeightLogDocument>,
        private readonly profileService: ProfileService,
    ) { }

    /** Todas as pesagens do usuario, da mais antiga para a mais nova (no maximo 1 por dia: lista pequena). */
    async points(userId: string): Promise<WeightPoint[]> {
        const logs = await this.weightLogModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ date: 1 })
            .select('date weightKg')
            .lean()
            .exec();
        return logs.map((l) => ({ date: l.date, weightKg: l.weightKg }));
    }

    /** GET /weight: pesagens do periodo (com a media movel) + resumo de todas as pesagens. */
    async getWeight(userId: string, from?: string, to?: string): Promise<WeightResponse> {
        const today = toUserDate(await this.profileService.getTimezone(userId));
        const [all, profile] = await Promise.all([this.points(userId), this.findProfile(userId)]);

        // A media movel usa as pesagens anteriores ao periodo, entao e calculada antes do filtro
        const end = to ?? today;
        const entries = withTrend(all).filter((e) => (!from || e.date >= from) && e.date <= end);

        const first = all[0] ?? null;
        const latest = all[all.length - 1] ?? null;
        const targetWeightKg = profile?.targetWeightKg ?? null;

        return {
            entries,
            summary: {
                today,
                count: all.length,
                startDate: first?.date ?? null,
                startKg: first?.weightKg ?? null,
                currentDate: latest?.date ?? null,
                currentKg: latest?.weightKg ?? null,
                totalChangeKg: first && latest && all.length > 1 ? roundKg(latest.weightKg - first.weightKg) : null,
                weekChangeKg: weekChangeKg(all, today),
                loggedToday: latest?.date === today,
                targetWeightKg,
                remainingKg: targetWeightKg !== null && latest ? roundKg(Math.abs(latest.weightKg - targetWeightKg)) : null,
                reachedTarget: targetWeightKg !== null && first !== null && latest !== null
                    && reachedTarget(first.weightKg, latest.weightKg, targetWeightKg),
                primaryGoal: profile?.primaryGoal ?? null,
            },
        };
    }

    /**
     * PUT /weight/:date: cria ou substitui o peso do dia. Pode ser um dia passado; dia futuro nao.
     * Se essa passar a ser a pesagem mais recente, o perfil recebe o peso e as metas sao recalculadas.
     */
    async putWeight(userId: string, date: string, weightKg: number): Promise<WeightMutationResponse> {
        const today = toUserDate(await this.profileService.getTimezone(userId));
        if (date > today) {
            throw new BadRequestException('Não dá para registrar o peso de um dia que ainda não chegou');
        }
        const value = roundKg(weightKg);
        await this.weightLogModel.updateOne(
            { user: new Types.ObjectId(userId), date },
            { $set: { weightKg: value } },
            { upsert: true },
        );
        return { date, weightKg: value, ...(await this.syncProfile(userId)) };
    }

    /** DELETE /weight/:date. Se era a mais recente, o perfil volta para a pesagem anterior. */
    async deleteWeight(userId: string, date: string): Promise<WeightMutationResponse> {
        const result = await this.weightLogModel.deleteOne({ user: new Types.ObjectId(userId), date });
        if (result.deletedCount === 0) {
            throw new NotFoundException('Não há peso registrado nesse dia');
        }
        return { date, weightKg: null, ...(await this.syncProfile(userId)) };
    }

    /**
     * O peso do perfil e SEMPRE o da pesagem mais recente. Corrigir um dia antigo nao muda nada
     * (a mais recente continua a mesma). Sem nenhuma pesagem, o perfil fica como esta.
     */
    private async syncProfile(userId: string) {
        const latest = await this.weightLogModel
            .findOne({ user: new Types.ObjectId(userId) })
            .sort({ date: -1 })
            .lean()
            .exec();

        if (!latest) {
            const profile = await this.findProfile(userId);
            return {
                profileWeightKg: profile?.weightKg ?? null,
                profileUpdated: false,
                targetCalories: profile?.targetCalories ?? null,
            };
        }

        const { changed, profile } = await this.profileService.syncWeightFromLog(userId, latest.weightKg);
        return {
            profileWeightKg: profile?.weightKg ?? latest.weightKg,
            profileUpdated: changed,
            targetCalories: profile?.targetCalories ?? null,
        };
    }

    private async findProfile(userId: string): Promise<UserProfile | null> {
        try {
            return await this.profileService.getProfile(userId);
        } catch {
            return null; // ainda sem perfil
        }
    }
}
