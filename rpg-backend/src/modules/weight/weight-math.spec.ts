import { changeBetween, reachedTarget, roundKg, weekChangeKg, withTrend } from './weight-math';

const p = (date: string, weightKg: number) => ({ date, weightKg });

describe('weight-math', () => {
    it('arredonda para uma casa', () => {
        expect(roundKg(92.39999)).toBe(92.4);
    });

    it('tendencia so aparece com 3+ pesagens nos 7 dias', () => {
        const t = withTrend([p('2026-10-01', 90), p('2026-10-03', 89), p('2026-10-05', 88), p('2026-10-20', 87)]);
        expect(t.map((x) => x.trendKg)).toEqual([null, null, 89, null]);
    });

    it('variacao da semana compara com a ultima pesagem ate 7 dias atras', () => {
        const pts = [p('2026-10-10', 93), p('2026-10-16', 92.6), p('2026-10-20', 92.4), p('2026-10-24', 92.2)];
        expect(weekChangeKg(pts, '2026-10-24')).toBe(-0.4); // 92.2 - 92.6 (16/10 e a ultima ate 17/10, hoje - 7)
    });

    it('variacao da semana: sem pesagem recente = null', () => {
        expect(weekChangeKg([p('2026-10-01', 90), p('2026-10-02', 89)], '2026-10-24')).toBeNull();
    });

    it('variacao da semana: so uma pesagem = null', () => {
        expect(weekChangeKg([p('2026-10-24', 90)], '2026-10-24')).toBeNull();
    });

    it('variacao num periodo usa a ultima pesagem antes dele como referencia', () => {
        const pts = [p('2026-10-10', 93), p('2026-10-13', 92.5), p('2026-10-18', 92)];
        expect(changeBetween(pts, '2026-10-12', '2026-10-18')).toBe(-1);
        expect(changeBetween(pts, '2026-10-19', '2026-10-25')).toBeNull();
    });

    it('meta nos dois sentidos', () => {
        expect(reachedTarget(95, 85, 85)).toBe(true);
        expect(reachedTarget(95, 86, 85)).toBe(false);
        expect(reachedTarget(60, 66, 65)).toBe(true);
    });
});
