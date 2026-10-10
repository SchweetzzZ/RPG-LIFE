import { computeStreak, streakBonusesCrossed } from './streak';

const d = (date: string, counts = true) => ({ date, counts });

describe('streak', () => {
    it('sem dias fechados = 0', () => {
        expect(computeStreak([])).toEqual({ currentStreak: 0, lastClosedDate: null });
    });

    it('dias consecutivos somam', () => {
        expect(computeStreak([d('2026-10-08'), d('2026-10-09'), d('2026-10-10')]))
            .toEqual({ currentStreak: 3, lastClosedDate: '2026-10-10' });
    });

    it('falha de um dia reinicia a contagem', () => {
        expect(computeStreak([d('2026-10-06'), d('2026-10-07'), d('2026-10-09'), d('2026-10-10')]).currentStreak).toBe(2);
    });

    it('fechar o mesmo dia de novo nao muda nada', () => {
        expect(computeStreak([d('2026-10-09'), d('2026-10-10'), d('2026-10-10')]).currentStreak).toBe(2);
    });

    it('fechar ontem com atraso reconstitui a sequencia', () => {
        // 07 e 08 fechados, 09 esquecido, 10 fechado -> 1; fechando 09 depois -> 4
        expect(computeStreak([d('2026-10-07'), d('2026-10-08'), d('2026-10-10')]).currentStreak).toBe(1);
        expect(computeStreak([d('2026-10-07'), d('2026-10-08'), d('2026-10-10'), d('2026-10-09')]).currentStreak).toBe(4);
    });

    it('dia fechado sem refeicao quebra a sequencia', () => {
        // 08 e 09 normais, 10 fechado vazio -> 0
        expect(computeStreak([d('2026-10-08'), d('2026-10-09'), d('2026-10-10', false)]).currentStreak).toBe(0);
        // no dia seguinte recomeca do 1
        expect(computeStreak([d('2026-10-08'), d('2026-10-09'), d('2026-10-10', false), d('2026-10-11')]).currentStreak).toBe(1);
    });

    it('atravessa a virada do mes', () => {
        expect(computeStreak([d('2026-09-30'), d('2026-10-01')]).currentStreak).toBe(2);
    });

    it('bonus a cada multiplo de 7', () => {
        expect(streakBonusesCrossed(6, 7)).toBe(1);
        expect(streakBonusesCrossed(7, 8)).toBe(0);
        expect(streakBonusesCrossed(13, 14)).toBe(1);
        expect(streakBonusesCrossed(1, 8)).toBe(1); // reconstituicao que pula o 7
        expect(streakBonusesCrossed(7, 7)).toBe(0); // fechar de novo nao paga
        expect(streakBonusesCrossed(10, 1)).toBe(0);
    });
});
