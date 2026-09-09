import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Habit, habitDocument, DailyHabitStatus } from "./schema/habit-schema";
import { StepLog, StepLogDocument } from "./schema/step-log-schema";
import { CharacterService } from "../character/character.service";
import { ProfileService } from "../profile/profile.service";
import { ActivityLevel } from "../profile/schema/profile.schema";

@Injectable()
export class HabitService {
    constructor(
        @InjectModel(Habit.name) private readonly habitModel: Model<habitDocument>,
        @InjectModel(DailyHabitStatus.name) private readonly habitStatusModel: Model<DailyHabitStatus>,
        @InjectModel(StepLog.name) private readonly stepLogModel: Model<StepLogDocument>,
        private readonly characterService: CharacterService,
        private readonly profileService: ProfileService,
    ) { }

    async createHabit(userId: string, data: Partial<Habit>): Promise<Habit> {
        const newHabit = await this.habitModel.create({
            ...data,
            user: new Types.ObjectId(userId),
        });
        return newHabit;
    }

    async getUserHabits(userId: string): Promise<Habit[]> {
        return this.habitModel.find({ user: userId }).exec();
    }

    async updateHabit(userId: string, habitId: string, data: Partial<Habit>): Promise<Habit> {
        const updated = await this.habitModel.findOneAndUpdate(
            { _id: habitId, user: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        );
        if (!updated) {
            throw new NotFoundException("Quest/Hábito não encontrado");
        }
        return updated;
    }

    // Excluir Hábito/Quest
    async deleteHabit(userId: string, habitId: string): Promise<{ message: string }> {
        const result = await this.habitModel.deleteOne({
            _id: habitId,
            user: new Types.ObjectId(userId),
        });
        if (result.deletedCount === 0) {
            throw new NotFoundException("Quest/Hábito não encontrado");
        }
        return { message: "Quest removida com sucesso" };
    }

    async logProgress(userId: string, habitId: string, progressAmount: number) {
        const habit = await this.habitModel.findOne({ _id: habitId, user: userId });
        if (!habit) {
            throw new NotFoundException("Habit not found");
        }

        const todayStr = new Date().toISOString().split("T")[0];

        let statusLog = await this.habitStatusModel.findOne({
            user: userId,
            habit: habitId,
            date: todayStr,
        });

        if (!statusLog) {
            statusLog = await this.habitStatusModel.create({
                user: userId,
                habit: habitId,
                date: todayStr,
                currentProgress: 0,
                isCompleted: false,
            });
        }

        statusLog.currentProgress += progressAmount;
        const target = habit.goal?.targetValue || 1;

        let rewardResult: Awaited<ReturnType<typeof this.characterService.addXpAndCoin>> | null = null;

        if (statusLog.currentProgress >= target && !statusLog.isCompleted) {
            statusLog.isCompleted = true;
            habit.currentStreak += 1;
            await habit.save();

            // Atribui recompensas ao perfil e moedas!
            await this.profileService.addCoins(userId, habit.coinsReward);
            try {
                rewardResult = await this.characterService.addXpAndCoin(userId, {
                    xpGained: habit.xpReward,
                    coinsGained: habit.coinsReward,
                    category: 'habit',
                    statBonus: habit.targetStat ? { stat: habit.targetStat as any, amount: 1 } : undefined,
                });
            } catch { }
        }

        await statusLog.save();
        return {
            habit,
            statusLog,
            rpgReward: rewardResult ? {
                xpGained: rewardResult.xpGained,
                coinsGained: habit.coinsReward,
                multiplierApplied: rewardResult.multiplierApplied,
                leveledUp: rewardResult.leveledUp
            } : null
        };
    }

    async getRecommendedSteps(userId: string): Promise<{ recommendedSteps: number; reasoning: string }> {
        let recommendedSteps = 8000;
        let reasoning = 'Meta diária recomendada de 8.000 passos para manter uma rotina ativa.';

        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.activityLevel === ActivityLevel.SEDENTARY) {
                recommendedSteps = 6000;
                reasoning = 'Para rotinas sedentárias, 6.000 passos é um ótimo ponto de partida sustentável.';
            } else if (profile?.activityLevel === ActivityLevel.MODERATE) {
                recommendedSteps = 10000;
                reasoning = 'Meta de 10.000 passos para estilo de vida moderadamente ativo.';
            } else if (profile?.activityLevel === ActivityLevel.INTENSE || profile?.activityLevel === ActivityLevel.VERY_INTENSE) {
                recommendedSteps = 12000;
                reasoning = 'Meta de 12.000 passos para alta queima calórica e condicionamento.';
            }
        } catch {
            // Usa os valores padrão se o perfil não estiver configurado
        }

        return { recommendedSteps, reasoning };
    }

    async logSteps(userId: string, steps: number, date?: string) {
        const targetDate = date || new Date().toISOString().split("T")[0];

        let weightKg = 70;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg) weightKg = profile.weightKg;
        } catch { }

        // Fórmula aproximada: ~0.04 kcal por passo para 70kg, proporcional ao peso
        const caloriesBurned = Math.round(steps * (weightKg / 70) * 0.04);
        const totalCoins = Math.floor(steps * 0.01); // 10.000 passos = 100 LifeCoins

        const existing = await this.stepLogModel.findOne({
            user: new Types.ObjectId(userId),
            date: targetDate,
        });

        const previousCoins = existing?.coinsEarned || 0;
        const coinsDiff = totalCoins - previousCoins;

        if (coinsDiff > 0) {
            await this.profileService.addCoins(userId, coinsDiff);
            try {
                await this.characterService.addCoins(userId, coinsDiff);
            } catch { }
        }

        const stepLog = await this.stepLogModel.findOneAndUpdate(
            { user: new Types.ObjectId(userId), date: targetDate },
            {
                $set: {
                    steps,
                    caloriesBurned,
                    coinsEarned: totalCoins,
                },
            },
            { upsert: true, new: true }
        );

        const { recommendedSteps, reasoning } = await this.getRecommendedSteps(userId);

        return {
            date: targetDate,
            steps: stepLog.steps,
            caloriesBurned: stepLog.caloriesBurned,
            coinsEarned: stepLog.coinsEarned,
            coinsAwardedToday: Math.max(0, coinsDiff),
            recommendedSteps,
            reasoning,
        };
    }

    async getSteps(userId: string, date?: string) {
        const targetDate = date || new Date().toISOString().split("T")[0];
        const stepLog = await this.stepLogModel.findOne({
            user: new Types.ObjectId(userId),
            date: targetDate,
        });

        const { recommendedSteps, reasoning } = await this.getRecommendedSteps(userId);

        return {
            date: targetDate,
            steps: stepLog?.steps || 0,
            caloriesBurned: stepLog?.caloriesBurned || 0,
            coinsEarned: stepLog?.coinsEarned || 0,
            recommendedSteps,
            reasoning,
        };
    }
}