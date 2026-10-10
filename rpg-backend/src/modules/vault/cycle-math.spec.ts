import { cycleContains, cycleDaysLeft, isCycleExpired, resetAmount, weekWindow } from './cycle-math';

describe('cycle-math (semana fixa de segunda a domingo)', () => {
    it('qualquer dia cai na semana de segunda a domingo', () => {
        const week = { startDate: '2026-10-05', endDate: '2026-10-11' }; // seg 05 .. dom 11
        expect(weekWindow('2026-10-05')).toEqual(week); // segunda
        expect(weekWindow('2026-10-10')).toEqual(week); // sabado
        expect(weekWindow('2026-10-11')).toEqual(week); // domingo
        expect(weekWindow('2026-10-12')).toEqual({ startDate: '2026-10-12', endDate: '2026-10-18' }); // segunda seguinte
    });

    it('atravessa virada de mes e de ano', () => {
        expect(weekWindow('2026-11-01')).toEqual({ startDate: '2026-10-26', endDate: '2026-11-01' }); // domingo
        expect(weekWindow('2027-01-01')).toEqual({ startDate: '2026-12-28', endDate: '2027-01-03' });
    });

    it('o domingo ainda e do ciclo; na segunda ele fecha', () => {
        const { endDate } = weekWindow('2026-10-10');
        expect(isCycleExpired(endDate, '2026-10-11')).toBe(false);
        expect(isCycleExpired(endDate, '2026-10-12')).toBe(true);
    });

    it('fim do ciclo zera cofre e moedas: lancamento negativo igual ao saldo', () => {
        expect(resetAmount(1200)).toBe(-1200); // kcal do cofre
        expect(resetAmount(70)).toBe(-70);     // moedas
        expect(resetAmount(0)).toBe(0);
        expect(resetAmount(-5)).toBe(0);
    });

    it('dias restantes contando hoje', () => {
        expect(cycleDaysLeft('2026-10-11', '2026-10-05')).toBe(7);
        expect(cycleDaysLeft('2026-10-11', '2026-10-11')).toBe(1);
        expect(cycleDaysLeft('2026-10-11', '2026-10-12')).toBe(0);
    });

    it('cycleContains inclui as duas pontas', () => {
        const c = weekWindow('2026-10-10');
        expect(cycleContains(c, '2026-10-04')).toBe(false);
        expect(cycleContains(c, '2026-10-05')).toBe(true);
        expect(cycleContains(c, '2026-10-11')).toBe(true);
        expect(cycleContains(c, '2026-10-12')).toBe(false);
    });
});
