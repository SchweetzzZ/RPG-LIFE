import { DEFAULT_TIMEZONE, addDays, dayOfWeek, daysBetween, resolveTimezone, toUserDate } from './user-date';

describe('user-date', () => {
    describe('daysBetween', () => {
        it('conta dias de calendario, inclusive na virada do mes', () => {
            expect(daysBetween('2026-10-10', '2026-10-12')).toBe(2);
            expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1);
            expect(daysBetween('2026-10-12', '2026-10-10')).toBe(-2);
            expect(daysBetween('2026-10-10', '2026-10-10')).toBe(0);
        });
    });

    describe('toUserDate', () => {
        it('01:30 UTC ainda e o dia anterior em Sao Paulo', () => {
            const date = new Date('2026-10-06T01:30:00Z');
            expect(toUserDate('America/Sao_Paulo', date)).toBe('2026-10-05');
        });

        it('03:30 UTC ja e o mesmo dia em Sao Paulo', () => {
            const date = new Date('2026-10-06T03:30:00Z');
            expect(toUserDate('America/Sao_Paulo', date)).toBe('2026-10-06');
        });

        it('fuso invalido cai no padrao', () => {
            const date = new Date('2026-10-06T01:30:00Z');
            expect(toUserDate('Nao/Existe', date)).toBe('2026-10-05');
        });

        it('sem fuso usa o padrao', () => {
            const date = new Date('2026-10-06T01:30:00Z');
            expect(toUserDate(undefined, date)).toBe('2026-10-05');
            expect(toUserDate(null, date)).toBe('2026-10-05');
        });
    });

    describe('resolveTimezone', () => {
        it('mantem um fuso IANA valido', () => {
            expect(resolveTimezone('Europe/Lisbon')).toBe('Europe/Lisbon');
        });

        it('fuso invalido, vazio ou nulo cai no padrao', () => {
            expect(resolveTimezone('Nao/Existe')).toBe(DEFAULT_TIMEZONE);
            expect(resolveTimezone('')).toBe(DEFAULT_TIMEZONE);
            expect(resolveTimezone(null)).toBe(DEFAULT_TIMEZONE);
            expect(resolveTimezone(undefined)).toBe(DEFAULT_TIMEZONE);
        });
    });

    describe('addDays', () => {
        it('atravessa o fim do mes', () => {
            expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
        });

        it('atravessa o fim do ano', () => {
            expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
        });

        it('subtrai dias atravessando mes e ano', () => {
            expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
            expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
        });

        it('considera ano bissexto', () => {
            expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
        });
    });

    describe('dayOfWeek', () => {
        it('devolve 0 para domingo e 6 para sabado', () => {
            expect(dayOfWeek('2026-10-04')).toBe(0); // domingo
            expect(dayOfWeek('2026-10-05')).toBe(1); // segunda
            expect(dayOfWeek('2026-10-10')).toBe(6); // sabado
        });
    });
});
