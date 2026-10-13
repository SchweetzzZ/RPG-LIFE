import { best1Rm, estimate1Rm, estimateDurationMinutes, exerciseKey, maxWeight, volumeKg } from './workout-math';

describe('workout-math', () => {
    it('estima o 1RM por Epley', () => {
        expect(estimate1Rm(100, 1)).toBe(100);
        expect(estimate1Rm(80, 10)).toBe(106.7);
        expect(estimate1Rm(0, 10)).toBe(0);
        expect(estimate1Rm(80, 0)).toBe(0);
    });

    it('ignora aquecimento em volume, carga maxima e 1RM', () => {
        const sets = [
            { weightKg: 100, reps: 15, technique: 'warmup' },
            { weightKg: 60, reps: 10, technique: 'normal' },
        ];
        expect(volumeKg(sets)).toBe(600);
        expect(maxWeight(sets)).toBe(60);
        expect(best1Rm(sets)).toBe(80);
    });

    it('estima a duracao pelas series, entre 10 e 120 min', () => {
        expect(estimateDurationMinutes(2)).toBe(10);
        expect(estimateDurationMinutes(12)).toBe(36);
        expect(estimateDurationMinutes(100)).toBe(120);
    });

    it('normaliza o nome do exercicio', () => {
        expect(exerciseKey('  Tríceps  Corda ')).toBe('triceps corda');
    });
});
