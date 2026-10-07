import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { StepLog, StepLogDocument, StepSource } from "./schema/step-log-schema";
import { CoinService } from "../economy/economy.service";
import { CoinReason } from "../economy/schema/coin-entry.schema";
import { ProfileService } from "../profile/profile.service";
import { ActivityLevel } from "../profile/schema/profile.schema";
import { toUserDate } from "../common/utils/user-date";

@Injectable()
export class ActivityService {
    constructor(
        @InjectModel(StepLog.name) private readonly stepLogModel: Model<StepLogDocument>,
        private readonly coinService: CoinService,
        private readonly profileService: ProfileService,
    ) { }

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

    async logSteps(userId: string, steps: number, date?: string, source: StepSource = StepSource.MANUAL) {
        const targetDate = date || toUserDate(await this.profileService.getTimezone(userId));

        let weightKg = 70;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg) weightKg = profile.weightKg;
        } catch { }

        // Fórmula aproximada: ~0.04 kcal por passo para 70kg, proporcional ao peso
        const caloriesBurned = Math.round(steps * (weightKg / 70) * 0.04);
        // Formula provisoria (10.000 passos = 100 moedas); a tabela nova de moedas vem no proximo lote.
        const totalCoins = Math.floor(steps * 0.01);

        const existing = await this.stepLogModel.findOne({
            user: new Types.ObjectId(userId),
            date: targetDate,
        });

        const previousCoins = existing?.coinsEarned || 0;
        const coinsDiff = totalCoins - previousCoins;

        if (coinsDiff > 0) {
            await this.coinService.add(userId, coinsDiff, CoinReason.STEPS_GOAL, targetDate);
        }

        const stepLog = await this.stepLogModel.findOneAndUpdate(
            { user: new Types.ObjectId(userId), date: targetDate },
            {
                $set: {
                    steps,
                    caloriesBurned,
                    coinsEarned: totalCoins,
                    source,
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
        const targetDate = date || toUserDate(await this.profileService.getTimezone(userId));
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