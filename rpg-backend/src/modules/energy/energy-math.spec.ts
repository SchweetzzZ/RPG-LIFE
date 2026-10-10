import {
    calculateBaseKcal,
    calculateBmr,
    calculateDailyTargetKcal,
    calculateDayVault,
    calculateStepsNetKcal,
    calculateWorkoutNetKcal,
} from './energy-math';
import { ActivityLevel, BiologicalSex, PrimaryGoal } from '../profile/schema/profile.schema';

const body = { weightKg: 80, heightCm: 180, age: 30 };

describe('energy-math', () => {
    describe('TMB e Base do dia', () => {
        it('Mifflin-St Jeor: homem e mulher diferem em 166 kcal', () => {
            const male = calculateBmr({ ...body, biologicalSex: BiologicalSex.MALE });
            const female = calculateBmr({ ...body, biologicalSex: BiologicalSex.FEMALE });
            expect(male).toBe(1780); // 800 + 1125 - 150 + 5
            expect(female).toBe(1614);
            expect(male - female).toBe(166);
        });

        it('Base = TMB x rotina sem treino', () => {
            expect(calculateBaseKcal(1780, ActivityLevel.SEDENTARY)).toBe(2136);
            expect(calculateBaseKcal(1780, ActivityLevel.LIGHT)).toBe(2448);
            expect(calculateBaseKcal(1780, ActivityLevel.MODERATE)).toBe(2759);
        });
    });

    describe('Ativo liquido', () => {
        it('treino desconta o basal: (MET - 1) x peso x horas', () => {
            // intenso: (6 - 1) x 80 x 1h = 400 (o MET bruto daria 480)
            expect(calculateWorkoutNetKcal('intense', 80, 60)).toBe(400);
            // moderado 45 min: 2,5 x 80 x 0,75 = 150
            expect(calculateWorkoutNetKcal('moderate', 80, 45)).toBe(150);
        });

        it('passos: so o que passa de 4.000 conta', () => {
            expect(calculateStepsNetKcal(3000, 70)).toBe(0);
            expect(calculateStepsNetKcal(4000, 70)).toBe(0);
            expect(calculateStepsNetKcal(10000, 70)).toBe(240); // 6.000 x 0,04
            expect(calculateStepsNetKcal(10000, 105)).toBe(360); // proporcional ao peso
        });
    });

    describe('Meta do dia', () => {
        it('aplica o deficit do objetivo sobre Base + Ativo', () => {
            expect(calculateDailyTargetKcal(2000, 500, PrimaryGoal.LOSE_WEIGHT)).toBe(2000); // 2500 x 0,8
            expect(calculateDailyTargetKcal(2000, 500, PrimaryGoal.MAINTAIN)).toBe(2500);
            expect(calculateDailyTargetKcal(2000, 500, PrimaryGoal.GAIN_MUSCLE)).toBe(2750); // superavit de 10%
        });

        it('o deficit planejado nao vira "economia": comer a meta exata guarda 0', () => {
            const target = calculateDailyTargetKcal(2500, 0, PrimaryGoal.LOSE_WEIGHT);
            const result = calculateDayVault({
                closed: true, hasFoodLogs: true, targetKcal: target, consumedKcal: target, vaultBalanceKcal: 0,
            });
            expect(result.savedKcal).toBe(0);
        });
    });

    describe('Cofre do dia', () => {
        const base = { targetKcal: 2000, consumedKcal: 1500, vaultBalanceKcal: 0 };

        it('dia aberto rende 0', () => {
            expect(calculateDayVault({ ...base, closed: false, hasFoodLogs: true }))
                .toEqual({ savedKcal: 0, overflowKcal: 0, debitKcal: 0 });
        });

        it('dia fechado sem comida registrada rende 0 (nao registrar nao e economizar)', () => {
            expect(calculateDayVault({ ...base, closed: true, hasFoodLogs: false, consumedKcal: 0 }))
                .toEqual({ savedKcal: 0, overflowKcal: 0, debitKcal: 0 });
        });

        it('dia fechado guarda tudo o que sobrou da meta, sem teto', () => {
            expect(calculateDayVault({ ...base, closed: true, hasFoodLogs: true }).savedKcal).toBe(500);
            expect(calculateDayVault({ ...base, closed: true, hasFoodLogs: true, consumedKcal: 200 }).savedKcal).toBe(1800);
        });

        it('excedente debita do cofre', () => {
            const r = calculateDayVault({ closed: true, hasFoodLogs: true, targetKcal: 2000, consumedKcal: 2300, vaultBalanceKcal: 1000 });
            expect(r).toEqual({ savedKcal: 0, overflowKcal: 300, debitKcal: 300 });
        });

        it('excedente nunca deixa o cofre negativo', () => {
            const r = calculateDayVault({ closed: true, hasFoodLogs: true, targetKcal: 2000, consumedKcal: 3000, vaultBalanceKcal: 400 });
            expect(r).toEqual({ savedKcal: 0, overflowKcal: 1000, debitKcal: 400 });

            const empty = calculateDayVault({ closed: true, hasFoodLogs: true, targetKcal: 2000, consumedKcal: 3000, vaultBalanceKcal: 0 });
            expect(empty.debitKcal).toBe(0);
        });
    });
});
