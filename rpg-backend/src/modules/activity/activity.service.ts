import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { StepLog, StepLogDocument, StepSource } from "./schema/step-log-schema";
import { RewardService, RewardResult } from "../economy/reward.service";
import { CoinReason } from "../economy/schema/coin-entry.schema";
import { REWARDS } from "../economy/rewards";
import { VaultService } from "../vault/vault.service";
import { calculateStepsNetKcal } from "../energy/energy-math";
import { ProfileService } from "../profile/profile.service";
import { ActivityLevel } from "../profile/schema/profile.schema";
import { toUserDate } from "../common/utils/user-date";

@Injectable()
export class ActivityService {
    constructor(
        @InjectModel(StepLog.name) private readonly stepLogModel: Model<StepLogDocument>,
        private readonly rewardService: RewardService,
        private readonly vaultService: VaultService,
        private readonly profileService: ProfileService,
    ) { }

    // Meta diaria de passos pela rotina fora da academia
    async getRecommendedSteps(userId: string): Promise<{ recommendedSteps: number; reasoning: string }> {
        let recommendedSteps = 8000;
        let reasoning = 'Meta diária recomendada de 8.000 passos para manter uma rotina ativa.';

        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.activityLevel === ActivityLevel.SEDENTARY) {
                recommendedSteps = 6000;
                reasoning = 'Para quem trabalha sentado, 6.000 passos é um ótimo ponto de partida sustentável.';
            } else if (profile?.activityLevel === ActivityLevel.MODERATE) {
                recommendedSteps = 10000;
                reasoning = 'Meta de 10.000 passos para quem já se movimenta no trabalho.';
            }
        } catch {
            // Usa os valores padrão se o perfil não estiver configurado
        }

        return { recommendedSteps, reasoning };
    }

    async logSteps(userId: string, steps: number, date?: string, source: StepSource = StepSource.MANUAL) {
        const today = toUserDate(await this.profileService.getTimezone(userId));
        const targetDate = date || today;

        let weightKg = 70;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg) weightKg = profile.weightKg;
        } catch { }

        // Kcal liquidas: so o que passa de 4.000 passos conta (o resto ja esta na rotina do dia)
        const caloriesBurned = calculateStepsNetKcal(steps, weightKg);
        const { recommendedSteps, reasoning } = await this.getRecommendedSteps(userId);

        // +10 moedas (e XP) 1x por dia ao bater a meta; vale qualquer origem por enquanto (Lote 4)
        let reward: RewardResult = { granted: false, coins: 0, xp: 0, leveledUp: false };
        if (steps >= recommendedSteps && await this.vaultService.canEarnOn(userId, targetDate, today)) {
            reward = await this.rewardService.grant(userId, CoinReason.STEPS_GOAL, targetDate);
        }

        const existing = await this.stepLogModel.findOne({
            user: new Types.ObjectId(userId),
            date: targetDate,
        });
        const goalAlreadyPaid = (existing?.coinsEarned ?? 0) > 0;

        const stepLog = await this.stepLogModel.findOneAndUpdate(
            { user: new Types.ObjectId(userId), date: targetDate },
            {
                $set: {
                    steps,
                    caloriesBurned,
                    coinsEarned: reward.granted || goalAlreadyPaid ? REWARDS[CoinReason.STEPS_GOAL].coins : 0,
                    source,
                },
            },
            { upsert: true, new: true }
        );

        return {
            date: targetDate,
            steps: stepLog.steps,
            caloriesBurned: stepLog.caloriesBurned,
            coinsEarned: stepLog.coinsEarned,
            coinsAwardedToday: reward.coins,
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