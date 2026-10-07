import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserProfile, UserProfileDocument, ActivityLevel, PrimaryGoal } from './schema/profile.schema';
import { UpdateProfileDto, CalculateNutritionInput, CalculateNutritionUpdate } from './dto/profile-dto';
import { resolveTimezone } from '../common/utils/user-date';

const activityMultipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHT]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
    [ActivityLevel.INTENSE]: 1.725,
    [ActivityLevel.VERY_INTENSE]: 1.9,
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

    // Fuso do usuario; se ainda nao ha perfil (ou fuso), devolve o padrao. Nunca lanca excecao por falta de perfil.
    async getTimezone(userId: string): Promise<string> {
        const profile = await this.profileModel.findOne({ user: userId }).select('timezone').lean().exec();
        return resolveTimezone(profile?.timezone);
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

        const finalProfile = await this.profileModel.findOneAndUpdate({
            user: userId
        }, {
            $set: {
                targetCalories: targets.targetCalories,
                targetProteinGrams: targets.proteinGrams,
                targetCarbGrams: targets.carbGrams,
                targetFatGrams: targets.fatGrams,
            }
        }, {
            new: true,
        })

        return {
            profile: finalProfile,
            targets,
        }
    }
}
