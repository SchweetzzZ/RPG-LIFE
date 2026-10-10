import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { requireNutritionInput } from './nutrition-input';
import { ProfileService } from './profile.service';
import { ActivityLevel, BiologicalSex, PrimaryGoal, UserProfileDocument } from './schema/profile.schema';

const complete = {
    weightKg: 80,
    heightCm: 180,
    age: 30,
    biologicalSex: BiologicalSex.MALE,
    activityLevel: ActivityLevel.SEDENTARY,
    primaryGoal: PrimaryGoal.MAINTAIN,
};

function missingFields(profile: Parameters<typeof requireNutritionInput>[0]): string[] {
    try {
        requireNutritionInput(profile);
        return [];
    } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const body = (error as BadRequestException).getResponse() as { message: string[] };
        return body.message.map((m) => m.split(':')[0]);
    }
}

describe('PATCH /profile/nutrition: entrada do calculo', () => {
    it('perfil completo passa', () => {
        expect(requireNutritionInput(complete)).toEqual(complete);
    });

    it('perfil incompleto = 400 com a lista do que falta', () => {
        expect(missingFields({ ...complete, weightKg: null, age: undefined })).toEqual(['weightKg', 'age']);
    });

    it("sexo fora do enum (ex.: 'other' antigo no banco) conta como nao preenchido", () => {
        expect(missingFields({ ...complete, biologicalSex: 'other' })).toEqual(['biologicalSex']);
    });

    it("rotina antiga fora do enum (ex.: 'intense') conta como nao preenchida", () => {
        expect(missingFields({ ...complete, activityLevel: 'intense' })).toEqual(['activityLevel']);
    });

    it('male e female geram metas diferentes (TMB 166 kcal menor para female)', async () => {
        const service = new ProfileService({} as Model<UserProfileDocument>);
        const male = await service.calculateNutritionTargets(complete);
        const female = await service.calculateNutritionTargets({ ...complete, biologicalSex: BiologicalSex.FEMALE });
        expect(male.bmr - female.bmr).toBe(166);
        expect(male.tdee).toBe(2136);             // 1780 x 1,2
        expect(male.targetCalories).toBe(2136);   // manter: sem deficit
        expect(female.targetCalories).toBeLessThan(male.targetCalories);
    });

    it('perder peso aplica 20% de deficit sobre a Base', async () => {
        const service = new ProfileService({} as Model<UserProfileDocument>);
        const r = await service.calculateNutritionTargets({ ...complete, primaryGoal: PrimaryGoal.LOSE_WEIGHT });
        expect(r.targetCalories).toBe(Math.round(2136 * 0.8));
    });
});
