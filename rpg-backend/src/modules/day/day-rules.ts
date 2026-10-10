// Regras do fechamento do dia (funcoes puras). PLANO_PROXIMOS_LOTES.md, secao 6.3.

import { addDays } from '../common/utils/user-date';

export const CLOSE_BLOCKED = {
    ALREADY_CLOSED: 'Este dia já foi fechado.',
    NOT_CLOSABLE_DATE: 'Só é possível fechar hoje ou ontem.',
} as const;

export const EMPTY_DAY_NOTICE =
    'Dia fechado sem refeições registradas: não guarda kcal no cofre, não rende moedas e quebra a sequência.';

export const PAST_CYCLE_NOTICE =
    'Este dia era da semana anterior, que já foi encerrada: o fechamento conta para a sequência, mas não mexe no cofre nem rende moedas.';

/** So da para fechar HOJE ou ONTEM (datas no fuso do usuario). */
export function isClosableDate(date: string, today: string): boolean {
    return date === today || date === addDays(today, -1);
}

/**
 * Motivo pelo qual o dia nao pode ser fechado agora, ou null se pode.
 * Fechar sem refeicao registrada e permitido: so nao rende nada e quebra a sequencia.
 */
export function closeBlockedReason(input: {
    alreadyClosed: boolean;
    date: string;
    today: string;
}): string | null {
    if (input.alreadyClosed) return CLOSE_BLOCKED.ALREADY_CLOSED;
    if (!isClosableDate(input.date, input.today)) return CLOSE_BLOCKED.NOT_CLOSABLE_DATE;
    return null;
}
