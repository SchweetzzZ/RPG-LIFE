// Matematica de energia do dia (funcoes puras, sem banco). Fonte: PLANO_PROXIMOS_LOTES.md, secao 6.2.
//
//   TMB           = Mifflin-St Jeor
//   Base do dia   = TMB x multiplicador da rotina SEM treino (1,2 / 1,375 / 1,55)
//   Ativo liquido = treino + passos
//      treino     = (MET - 1) x peso(kg) x horas        (o "-1" tira o basal, que ja esta na Base)
//      passos     = max(0, passos - 4.000) x 0,04 x (peso / 70)
//   Meta do dia   = (Base + Ativo) x (1 - deficit%)     perder 20% · manter 0% · ganhar -10%
//   Guardado      = dia FECHADO com comida registrada ? max(0, Meta - Consumido) : 0
//   Excedente     = Consumido > Meta ? debita (Consumido - Meta) do cofre, limitado ao saldo : 0

import { ActivityLevel, BiologicalSex, PrimaryGoal } from '../profile/schema/profile.schema';

export const ROUTINE_MULTIPLIERS: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHT]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
};

// Fracao tirada da meta. Negativo = superavit.
export const GOAL_DEFICIT: Record<PrimaryGoal, number> = {
    [PrimaryGoal.LOSE_WEIGHT]: 0.2,
    [PrimaryGoal.MAINTAIN]: 0,
    [PrimaryGoal.GAIN_MUSCLE]: -0.1,
};

export type WorkoutIntensity = 'moderate' | 'intense' | 'cycling_running';

// MET bruto por intensidade (o liquido e MET - 1)
export const WORKOUT_MET: Record<WorkoutIntensity, number> = {
    moderate: 3.5,
    intense: 6.0,
    cycling_running: 7.5,
};

/** Passos que ja estao embutidos na rotina do dia a dia (nao contam como atividade extra). */
export const BASELINE_STEPS = 4000;
const KCAL_PER_STEP_70KG = 0.04;

export interface BodyInput {
    weightKg: number;
    heightCm: number;
    age: number;
    biologicalSex: BiologicalSex;
}

/** Taxa metabolica basal (Mifflin-St Jeor), arredondada. */
export function calculateBmr({ weightKg, heightCm, age, biologicalSex }: BodyInput): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(biologicalSex === BiologicalSex.MALE ? base + 5 : base - 161);
}

/** Gasto do dia sem treino: TMB x rotina fora da academia. */
export function calculateBaseKcal(bmr: number, activityLevel: ActivityLevel): number {
    return Math.round(bmr * ROUTINE_MULTIPLIERS[activityLevel]);
}

/** Kcal liquidas de um treino: (MET - 1) x peso x horas. */
export function calculateWorkoutNetKcal(intensity: WorkoutIntensity, weightKg: number, durationMinutes: number): number {
    const met = WORKOUT_MET[intensity];
    return Math.max(0, Math.round((met - 1) * weightKg * (durationMinutes / 60)));
}

/** Kcal liquidas dos passos: so o que passa de 4.000 passos conta. */
export function calculateStepsNetKcal(steps: number, weightKg: number): number {
    const extraSteps = Math.max(0, steps - BASELINE_STEPS);
    return Math.round(extraSteps * KCAL_PER_STEP_70KG * (weightKg / 70));
}

/** Meta de kcal do dia: (Base + Ativo) x (1 - deficit do objetivo). */
export function calculateDailyTargetKcal(baseKcal: number, activeKcal: number, goal: PrimaryGoal): number {
    return Math.round((baseKcal + activeKcal) * (1 - GOAL_DEFICIT[goal]));
}

export interface DayVaultInput {
    closed: boolean;
    hasFoodLogs: boolean;
    targetKcal: number;
    consumedKcal: number;
    /** Saldo do cofre do ciclo ANTES deste dia. */
    vaultBalanceKcal: number;
}

export interface DayVaultResult {
    /** Quanto vai para o cofre (deposito). */
    savedKcal: number;
    /** Quanto o consumo passou da meta (bruto). */
    overflowKcal: number;
    /** Quanto sai do cofre por causa do excedente (nunca mais do que o saldo). */
    debitKcal: number;
}

/**
 * Movimento do cofre causado por um dia.
 * Dia aberto ou sem comida registrada nao rende nada (nao registrar NAO e economizar).
 * Sem piso nem teto no deposito (decisao 9). O cofre nunca fica negativo (decisao 2).
 */
export function calculateDayVault(input: DayVaultInput): DayVaultResult {
    const { closed, hasFoodLogs, targetKcal, consumedKcal, vaultBalanceKcal } = input;
    if (!closed || !hasFoodLogs) {
        return { savedKcal: 0, overflowKcal: 0, debitKcal: 0 };
    }
    const diff = Math.round(targetKcal - consumedKcal);
    if (diff >= 0) {
        return { savedKcal: diff, overflowKcal: 0, debitKcal: 0 };
    }
    const overflowKcal = -diff;
    const debitKcal = Math.min(overflowKcal, Math.max(0, Math.round(vaultBalanceKcal)));
    return { savedKcal: 0, overflowKcal, debitKcal };
}

/** Alerta neutro do excedente (decisao 2). Sem perda de moeda, XP ou sequencia. */
export const OVERFLOW_ALERT =
    'Você passou da meta hoje. Se foi consciente, tudo bem; se não foi, recomendamos um controle maior da próxima vez.';
