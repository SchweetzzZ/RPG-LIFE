import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserProfile, UserProfileDocument, PrimaryGoal } from './schema/profile.schema';
import { UpdateProfileDto, CalculateNutritionInput, CalculateNutritionUpdate } from './dto/profile-dto';
import { resolveTimezone } from '../common/utils/user-date';
import { requireNutritionInput } from './nutrition-input';
import { calculateBaseKcal, calculateBmr, calculateDailyTargetKcal } from '../energy/energy-math';

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

    // Perfil fisico completo para as contas do dia; 400 com o que falta se estiver incompleto
    async getNutritionInput(userId: string): Promise<CalculateNutritionInput> {
        const profile = await this.profileModel.findOne({ user: userId }).lean().exec();
        return requireNutritionInput(profile ?? {});
    }

    async calculateNutritionTargets(data: CalculateNutritionInput) {
        // Mesma formula do fechamento do dia (energy-math.ts), num dia SEM treino nem passos extras:
        // tdee = Base do dia (TMB x rotina fora da academia); meta = Base x (1 - deficit do objetivo)
        const bmr = calculateBmr(data)
        const tdee = calculateBaseKcal(bmr, data.activityLevel)
        const targetCalories = calculateDailyTargetKcal(tdee, 0, data.primaryGoal)

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

        const targets = await this.calculateNutritionTargets(requireNutritionInput(updatedProfile))

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
