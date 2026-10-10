import { CLOSE_BLOCKED, closeBlockedReason, isClosableDate } from './day-rules';
import { toUserDate } from '../common/utils/user-date';

describe('day-rules', () => {
    it('so fecha hoje ou ontem', () => {
        expect(isClosableDate('2026-10-10', '2026-10-10')).toBe(true);
        expect(isClosableDate('2026-10-09', '2026-10-10')).toBe(true);
        expect(isClosableDate('2026-10-08', '2026-10-10')).toBe(false);
        expect(isClosableDate('2026-10-11', '2026-10-10')).toBe(false);
    });

    it('22h em Sao Paulo ainda e "hoje" (mesmo ja sendo amanha em UTC)', () => {
        // 2026-10-11T01:00Z = 22h do dia 10 em Sao Paulo
        const today = toUserDate('America/Sao_Paulo', new Date('2026-10-11T01:00:00Z'));
        expect(today).toBe('2026-10-10');
        expect(isClosableDate('2026-10-10', today)).toBe(true);
        expect(isClosableDate('2026-10-11', today)).toBe(false);
    });

    it('motivos de bloqueio', () => {
        const ok = { alreadyClosed: false, date: '2026-10-10', today: '2026-10-10' };
        expect(closeBlockedReason(ok)).toBeNull();
        expect(closeBlockedReason({ ...ok, alreadyClosed: true })).toBe(CLOSE_BLOCKED.ALREADY_CLOSED);
        expect(closeBlockedReason({ ...ok, date: '2026-10-01' })).toBe(CLOSE_BLOCKED.NOT_CLOSABLE_DATE);
    });
});
