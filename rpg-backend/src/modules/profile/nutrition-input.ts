import { BadRequestException } from '@nestjs/common';
import { ActivityLevel, BiologicalSex, PrimaryGoal } from './schema/profile.schema';
import { CalculateNutritionInput } from './dto/profile-dto';

export interface ProfileFieldsForNutrition {
    weightKg?: number | null;
    heightCm?: number | null;
    age?: number | null;
    biologicalSex?: string | null;
    activityLevel?: string | null;
    primaryGoal?: string | null;
}

// Valor fora do enum (ex.: um 'other' ou 'intense' antigo no banco) conta como nao preenchido
function inEnum<T extends string>(values: Record<string, T>, value: string | null | undefined): T | undefined {
    return Object.values(values).find((v) => v === value);
}

/**
 * Garante que o perfil fisico tem tudo o que a conta precisa;
 * senao, 400 com a lista do que falta.
 */
export function requireNutritionInput(profile: ProfileFieldsForNutrition): CalculateNutritionInput {
    const { weightKg, heightCm, age } = profile;
    const biologicalSex = inEnum(BiologicalSex, profile.biologicalSex);
    const activityLevel = inEnum(ActivityLevel, profile.activityLevel);
    const primaryGoal = inEnum(PrimaryGoal, profile.primaryGoal);

    if (weightKg == null || heightCm == null || age == null ||
        biologicalSex === undefined || activityLevel === undefined || primaryGoal === undefined) {
        const fields = { weightKg, heightCm, age, biologicalSex, activityLevel, primaryGoal };
        const missing = Object.entries(fields)
            .filter(([, value]) => value === null || value === undefined)
            .map(([field]) => `${field}: obrigatório para calcular as metas`);
        throw new BadRequestException(missing);
    }

    return { weightKg, heightCm, age, biologicalSex, activityLevel, primaryGoal };
}
