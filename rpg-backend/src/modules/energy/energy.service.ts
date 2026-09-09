import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { WorkoutLog, WorkoutLogDocument } from "../workout/schemas/workout-log";
import { StepLog, StepLogDocument } from "../habit/schema/step-log-schema";
import { FoodLog, FoodLogDocument, MealType } from "../nutricion/schema/food-Log-schema";
import { ProfileService } from "../profile/profile.service";
import { CharacterService } from "../character/character.service";
import { ActivityLevel, PrimaryGoal } from "../profile/schema/profile.schema";

const activityMultipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHT]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
    [ActivityLevel.INTENSE]: 1.725,
    [ActivityLevel.VERY_INTENSE]: 1.9,
};

@Injectable()
export class EnergyService {
    constructor(
        @InjectModel(WorkoutLog.name) private readonly workoutLogModel: Model<WorkoutLogDocument>,
        @InjectModel(StepLog.name) private readonly stepLogModel: Model<StepLogDocument>,
        @InjectModel(FoodLog.name) private readonly foodLogModel: Model<FoodLogDocument>,
        private readonly profileService: ProfileService,
        private readonly characterService: CharacterService,
    ) { }

    private calculateBMR(weightKg: number, heightCm: number, age: number, biologicalSex: string): number {
        const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
        if (biologicalSex?.toLowerCase() === 'female') {
            return Math.round(base - 161);
        }
        return Math.round(base + 5);
    }

    async getDailySummary(userId: string, date?: string) {
        const targetDate = date || new Date().toISOString().split("T")[0];

        // 1. Dados do Perfil e Taxas Metabólicas
        let weightKg = 70;
        let heightCm = 175;
        let age = 25;
        let sex = 'male';
        let activityLevel = ActivityLevel.MODERATE;
        let primaryGoal = PrimaryGoal.MAINTAIN;

        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile) {
                if (profile.weightKg) weightKg = profile.weightKg;
                if (profile.heightCm) heightCm = profile.heightCm;
                if (profile.age) age = profile.age;
                if (profile.biologicalSex) sex = profile.biologicalSex;
                if (profile.activityLevel) activityLevel = profile.activityLevel;
                if (profile.primaryGoal) primaryGoal = profile.primaryGoal;
            }
        } catch { }

        const bmr = this.calculateBMR(weightKg, heightCm, age, sex);
        const multiplier = activityMultipliers[activityLevel] || 1.55;
        let tdee = Math.round(bmr * multiplier);

        if (primaryGoal === PrimaryGoal.LOSE_WEIGHT) {
            tdee = Math.round(tdee * 0.80);
        } else if (primaryGoal === PrimaryGoal.GAIN_MUSCLE) {
            tdee = tdee + 300;
        }

        // 2. Treinos do Dia
        const userObjectId = new Types.ObjectId(userId);
        const workouts = await this.workoutLogModel
            .find({ user: userObjectId, date: targetDate })
            .lean()
            .exec();

        const workoutCalories = workouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
        const workoutCoins = workouts.reduce((acc, w) => acc + (w.coinsGained || 0), 0);

        // 3. Passos do Dia
        const stepLog = await this.stepLogModel
            .findOne({ user: userObjectId, date: targetDate })
            .lean()
            .exec();

        const stepsCount = stepLog?.steps || 0;
        const stepsCalories = stepLog?.caloriesBurned || 0;
        const stepsCoins = stepLog?.coinsEarned || 0;

        // 4. Refeições e Nutrição do Dia
        const foodLogs = await this.foodLogModel
            .find({ user: userObjectId, date: targetDate })
            .lean()
            .exec();

        const mealTotals: Record<MealType, { calories: number; count: number }> = {
            [MealType.BREAKFAST]: { calories: 0, count: 0 },
            [MealType.LUNCH]: { calories: 0, count: 0 },
            [MealType.DINNER]: { calories: 0, count: 0 },
            [MealType.SNACK]: { calories: 0, count: 0 },
        };

        let totalCaloriesConsumed = 0;
        let totalProteinGrams = 0;
        let totalCarbGrams = 0;
        let totalFatGrams = 0;

        foodLogs.forEach((f) => {
            totalCaloriesConsumed += f.calories || 0;
            totalProteinGrams += f.proteinGrams || 0;
            totalCarbGrams += f.carbGrams || 0;
            totalFatGrams += f.fatGrams || 0;

            if (f.mealType && mealTotals[f.mealType]) {
                mealTotals[f.mealType].calories += f.calories || 0;
                mealTotals[f.mealType].count += 1;
            }
        });

        // 5. Cálculos Consolidados
        const activityCaloriesBurned = workoutCalories + stepsCalories;
        const totalBurnedCalories = tdee + activityCaloriesBurned;
        const remainingCalorieBudget = totalBurnedCalories - totalCaloriesConsumed;
        const netCalorieBalance = totalCaloriesConsumed - totalBurnedCalories;
        const totalCoinsEarned = workoutCoins + stepsCoins;

        // Dados do Personagem e Perfil
        const character = await this.characterService.getCharacter(userId).catch(() => null);
        let profileVault = 0;
        try {
            const p = await this.profileService.getProfile(userId);
            profileVault = p.vaultBalance || 0;
        } catch { }

        return {
            date: targetDate,
            summary: {
                bmr,
                tdee,
                activityCaloriesBurned,
                totalBurnedCalories,
                totalCaloriesConsumed,
                remainingCalorieBudget,
                netCalorieBalance,
                totalCoinsEarned,
                characterHp: character?.hp ?? 100,
                maxHp: character?.maxHp ?? 100,
                vaultBalance: profileVault || character?.vaultBalance || 0,
            },
            breakdown: {
                workouts: {
                    totalCalories: workoutCalories,
                    coinsEarned: workoutCoins,
                    count: workouts.length,
                    items: workouts.map((w) => ({
                        routineName: w.routineName,
                        durationMinutes: w.durationMinutes,
                        intensity: w.intensity,
                        caloriesBurned: w.caloriesBurned,
                        coinsGained: w.coinsGained,
                    })),
                },
                steps: {
                    count: stepsCount,
                    caloriesBurned: stepsCalories,
                    coinsEarned: stepsCoins,
                },
                nutrition: {
                    totalCalories: totalCaloriesConsumed,
                    macros: {
                        proteinGrams: totalProteinGrams,
                        carbGrams: totalCarbGrams,
                        fatGrams: totalFatGrams,
                    },
                    byMeal: mealTotals,
                    logsCount: foodLogs.length,
                },
            },
        };
    }

    async getWeeklyBudget(userId: string) {
        const today = new Date();
        const days: string[] = [];

        // Obtém os últimos 7 dias (incluindo hoje)
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            days.push(d.toISOString().split("T")[0]);
        }

        const userObjectId = new Types.ObjectId(userId);

        // Busca logs dos 7 dias
        const foodLogs = await this.foodLogModel.find({
            user: userObjectId,
            date: { $in: days },
        }).lean().exec();

        const workoutLogs = await this.workoutLogModel.find({
            user: userObjectId,
            date: { $in: days },
        }).lean().exec();

        const stepLogs = await this.stepLogModel.find({
            user: userObjectId,
            date: { $in: days },
        }).lean().exec();

        // Obtém TDEE base
        let tdee = 2200;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg && profile?.heightCm && profile?.age) {
                const bmr = this.calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.biologicalSex);
                const mult = activityMultipliers[profile.activityLevel] || 1.55;
                tdee = Math.round(bmr * mult);
            }
        } catch { }

        let accumulatedWeekDeficit = 0; // Calorias economizadas durante a semana
        const dailyRecords = days.map((dateStr) => {
            const dayFoodKcal = foodLogs
                .filter((f) => f.date === dateStr)
                .reduce((acc, f) => acc + (f.calories || 0), 0);

            const dayWorkoutKcal = workoutLogs
                .filter((w) => w.date === dateStr)
                .reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

            const dayStepKcal = stepLogs
                .filter((s) => s.date === dateStr)
                .reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);

            const totalDayBudget = tdee + dayWorkoutKcal + dayStepKcal;
            const dayBalance = totalDayBudget - dayFoodKcal; // positivo = sobrou

            // Se for dia de semana (segunda a sexta), acumula no cofre
            const d = new Date(dateStr + 'T12:00:00Z');
            const dayOfWeek = d.getUTCDay(); // 0 = Dom, 6 = Sab
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

            if (isWeekday && dayBalance > 0) {
                accumulatedWeekDeficit += dayBalance;
            }

            return {
                date: dateStr,
                dayOfWeek,
                isWeekday,
                tdee,
                caloriesBurned: dayWorkoutKcal + dayStepKcal,
                totalBudget: totalDayBudget,
                consumed: dayFoodKcal,
                savedCalories: Math.max(0, dayBalance),
            };
        });

        // Buffer disponível para o fim de semana (dividido entre Sábado e Domingo)
        const weekendBufferTotal = accumulatedWeekDeficit;
        const weekendBufferPerDay = Math.round(weekendBufferTotal / 2);

        const character = await this.characterService.getCharacter(userId).catch(() => null);
        let profileVault = 0;
        try {
            const p = await this.profileService.getProfile(userId);
            profileVault = p.vaultBalance || 0;
        } catch { }

        return {
            weeklyTdeeTarget: tdee * 7,
            accumulatedWeekDeficit,
            weekendBufferTotal,
            weekendBufferPerDay,
            vaultBalance: profileVault || character?.vaultBalance || 0,
            dailyRecords,
            scientificBasis: 'Baseado no princípio de balanço energético cumulativo semanal (Calorie Cycling / Flexible Dieting). A sobra calórica dos dias úteis é transferida para o fim de semana mantendo o mesmo déficit semanal.',
        };
    }
}
