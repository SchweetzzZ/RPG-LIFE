// Tabela de recompensas (PLANO_PROXIMOS_LOTES.md, secao 6.4 e decisao 8).
// Moedas zeram a cada ciclo; o XP vem das mesmas acoes e nunca zera.
// XP = 5x as moedas (ajustavel aqui, num lugar so).

import { CoinReason } from './schema/coin-entry.schema';
import { FreeMealScope } from '../free-meal/schema/free-meal.schema';

export type RewardAction =
    | CoinReason.DAY_CLOSE
    | CoinReason.WORKOUT
    | CoinReason.STEPS_GOAL
    | CoinReason.STREAK_7;

export const REWARDS: Record<RewardAction, { coins: number; xp: number }> = {
    [CoinReason.DAY_CLOSE]: { coins: 10, xp: 50 },   // 1x por dia, com >= 1 refeicao registrada
    [CoinReason.WORKOUT]: { coins: 20, xp: 100 },    // so o 1o treino do dia
    [CoinReason.STEPS_GOAL]: { coins: 10, xp: 50 },  // 1x por dia, qualquer origem (restricao no Lote 4)
    [CoinReason.STREAK_7]: { coins: 50, xp: 250 },   // a cada multiplo de 7 dias fechados seguidos
};

/**
 * Ticket da refeicao livre (decisoes 3 e 14). Os dois saem do MESMO saldo de moedas da semana.
 * Semana = 100 moedas. Dia = 40 (as moedas de um dia completo: fechar +10, treino +20, passos +10).
 */
export const FREE_MEAL_TICKETS: Record<FreeMealScope, { coins: number; reason: CoinReason }> = {
    [FreeMealScope.WEEK]: { coins: 100, reason: CoinReason.TICKET },
    [FreeMealScope.DAY]: { coins: 40, reason: CoinReason.TICKET_DAY },
};

/** Custo do ticket da refeicao livre da semana (atalho para FREE_MEAL_TICKETS.week). */
export const FREE_MEAL_TICKET_COINS = FREE_MEAL_TICKETS[FreeMealScope.WEEK].coins;
