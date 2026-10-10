// Tabela de recompensas (PLANO_PROXIMOS_LOTES.md, secao 6.4 e decisao 8).
// Moedas zeram a cada ciclo; o XP vem das mesmas acoes e nunca zera.
// XP = 5x as moedas (ajustavel aqui, num lugar so).

import { CoinReason } from './schema/coin-entry.schema';

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

/** Custo do ticket da refeicao livre da semana (decisao 3; usado no Lote 3). */
export const FREE_MEAL_TICKET_COINS = 100;
