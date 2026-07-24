import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserProfile, UserProfileDocument, ActivityLevel, PrimaryGoal } from './schema/profile.schema';
import { UpdateProfileDto } from './dto/profile-dto';
import { CalculateNutritionInput, CalculateNutritionUpdate } from '../habit/dto/habit-dto';

export interface HabitRecommendation {
    category: string;
    suggestedTarget: number;
    unit: string;
    reasoning: string;
    xpReward: number;
    targetStat: string;
}

const activityMultipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHT]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
    [ActivityLevel.ACTIVE]: 1.725,
    [ActivityLevel.VERY_ACTIVE]: 1.9,
};

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel(UserProfile.name)
        private readonly profileModel: Model<UserProfileDocument>,
    ) { }

    async getProfile(userId: string): Promise<UserProfile> {
        const profile = await this.profileModel.findOne({ user: userId });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        return profile;
    }

    async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserProfile> {
        const updated = await this.profileModel.findOneAndUpdate(
            { user: userId },
            { $set: data },
            { new: true, upsert: true },
        );
        return updated;
    }

    private calculateBMR(weightKg: number, heightCm: number, age: number, biologicalSex: string): number {
        const base = 10 * weightKg + 6.25 * heightCm - 5 * age
        if (biologicalSex.toLowerCase() === "male") {
            return base + 5
        }
        if (biologicalSex.toLowerCase() === "female") {
            return base - 161
        }
        throw new BadRequestException("Biological sex is not valid")
    }

    async calculateNutritionTargets(data: CalculateNutritionInput) {
        const bmr = Math.floor(this.calculateBMR(data.weightKg, data.heightCm, data.age, data.biologicalSex))

        const multiplier = activityMultipliers[data.activityLevel]
        const tdee = Math.floor(bmr * multiplier)

        let targetCalories = tdee
        if (data.primaryGoal === PrimaryGoal.LOSE_WEIGHT) {
            targetCalories = Math.floor(tdee * 0.80)
        } else if (data.primaryGoal === PrimaryGoal.GAIN_MUSCLE) {
            targetCalories = tdee + 300
        }

        const proteinFactor =
            data.primaryGoal === PrimaryGoal.GAIN_MUSCLE ? 2.0 :
                data.primaryGoal === PrimaryGoal.LOSE_WEIGHT ? 2.2 :
                    1.6

        const proteinGrams = Math.floor(proteinFactor * data.weightKg)

        const fatFactor = data.primaryGoal === PrimaryGoal.LOSE_WEIGHT ? 0.7 : 0.9
        const fatGrams = Math.floor(fatFactor * data.weightKg)

        const proteinCalories = proteinGrams * 4
        const fatCalories = fatGrams * 9

        const remainingCalories = targetCalories - (proteinCalories + fatCalories)
        const carbGrams = Math.max(0, Math.floor(remainingCalories / 4))

        return {
            bmr,
            tdee,
            targetCalories,
            proteinGrams,
            carbGrams,
            fatGrams,
        }
    }

    async calculateNutritionByUser(userId: string, data: CalculateNutritionUpdate) {
        const updatedProfile = await this.updateProfile(userId, data as UpdateProfileDto);

        const targets = await this.calculateNutritionTargets({
            weightKg: updatedProfile.weightKg,
            heightCm: updatedProfile.heightCm,
            age: updatedProfile.age,
            biologicalSex: updatedProfile.biologicalSex as 'male' | 'female' | 'other',
            activityLevel: updatedProfile.activityLevel,
            primaryGoal: updatedProfile.primaryGoal,
        })

        return {
            profile: updatedProfile,
            targets,
        }
    }

    async getRecommendations(userId: string): Promise<HabitRecommendation[]> {
        const profile = await this.getProfile(userId);
        const recommendations: HabitRecommendation[] = [];

        // 1. Água 
        let waterMl = profile.weightKg * 35;
        if (profile.trainsRegularly) waterMl += 500;
        if (profile.livesInHotClimate) waterMl += 300;
        waterMl = Math.round(waterMl / 50) * 50;

        recommendations.push({
            category: 'water',
            suggestedTarget: waterMl,
            unit: 'ml',
            reasoning: `Baseado no seu peso de ${profile.weightKg}kg (${profile.weightKg} × 35ml = ${profile.weightKg * 35}ml)${profile.trainsRegularly ? ' + 500ml por treinar' : ''}${profile.livesInHotClimate ? ' + 300ml por clima quente' : ''}.`,
            xpReward: 40,
            targetStat: 'vitality',
        });

        // 2. Sono 
        let sleepMin = 450;
        let sleepMsg = 'Adultos de 26 a 64 anos têm meta recomendada de 7h30 por noite.';
        if (profile.age < 26) {
            sleepMin = 490;
            sleepMsg = 'Jovens até 25 anos têm meta recomendada de 8h10 por noite.';
        } else if (profile.age >= 65) {
            sleepMin = 420;
            sleepMsg = 'Sêniores (65+) têm meta recomendada de 7h por noite.';
        }

        recommendations.push({
            category: 'sleep',
            suggestedTarget: sleepMin,
            unit: 'min',
            reasoning: sleepMsg,
            xpReward: 35,
            targetStat: 'vitality',
        });

        // 3. Meditação 
        let medMin = 10;
        if (profile.stressLevel >= 7) medMin = 20;
        else if (profile.stressLevel >= 4) medMin = 15;

        recommendations.push({
            category: 'meditation',
            suggestedTarget: medMin,
            unit: 'min',
            reasoning: `Com nível de estresse ${profile.stressLevel}/10, recomendamos ${medMin} minutos diários de meditação.`,
            xpReward: 30,
            targetStat: 'focus',
        });

        // 4. Nutrição / Proteína 
        const nutritionTargets = await this.calculateNutritionTargets({
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            age: profile.age,
            biologicalSex: profile.biologicalSex as 'male' | 'female' | 'other',
            activityLevel: profile.activityLevel,
            primaryGoal: profile.primaryGoal,
        });

        recommendations.push({
            category: 'nutrition_protein',
            suggestedTarget: nutritionTargets.proteinGrams,
            unit: 'g',
            reasoning: `Meta diária de proteína recomendada de ${nutritionTargets.proteinGrams}g. Calorias diárias estimadas em ${nutritionTargets.targetCalories} kcal.`,
            xpReward: 50,
            targetStat: profile.primaryGoal === PrimaryGoal.GAIN_MUSCLE ? 'strength' : 'vitality',
        });

        return recommendations;
    }
}
