import type { UserMeResponse } from "../types/dashboard";

type MeProfile = NonNullable<UserMeResponse["profile"]>

function isOneOf(values: readonly string[], value: string | null | undefined): boolean {
    return values.some((v) => v === value)
}

/**
 * Nomes (em português) dos campos do perfil físico que faltam para calcular a meta do dia.
 * Espelha `requireNutritionInput` do backend: nulo/ausente, ou valor fora do enum, conta como faltando.
 */
export function missingProfileFields(profile: MeProfile | null | undefined): string[] {
    const missing: string[] = []
    if (profile?.weightKg == null) missing.push('Peso')
    if (profile?.heightCm == null) missing.push('Altura')
    if (profile?.age == null) missing.push('Idade')
    if (!isOneOf(['male', 'female'], profile?.biologicalSex)) missing.push('Sexo usado no cálculo')
    if (!isOneOf(['sedentary', 'light', 'moderate'], profile?.activityLevel)) missing.push('Rotina fora da academia')
    if (!isOneOf(['lose_weight', 'maintain', 'gain_muscle'], profile?.primaryGoal)) missing.push('Objetivo')
    return missing
}
