import { DayClose } from './schema/day-close.schema';
import { DayStateResponse } from './dto/day-dto';
import { DayEnergy } from '../energy/energy.service';
import { DayVaultResult } from '../energy/energy-math';

interface DayStateInput {
    date: string;
    today: string;
    /** Registros atuais do dia (recalculados agora). */
    energy: DayEnergy;
    /** Fechamento gravado, se o dia ja foi fechado. */
    closed: DayClose | null;
    /** Previsao do cofre se o dia fosse fechado agora (usada so com o dia aberto). */
    preview: DayVaultResult;
    closeBlockedReason: string | null;
}

/**
 * Dia fechado: os numeros de kcal sao os gravados no fechamento (a fotografia do dia).
 * Dia aberto: os numeros atuais e a previsao do que iria para o cofre.
 */
export function toDayStateResponse({ date, today, energy, closed, preview, closeBlockedReason }: DayStateInput): DayStateResponse {
    const kcal = closed
        ? {
            bmr: closed.bmr,
            baseKcal: closed.baseKcal,
            workoutKcal: closed.workoutKcal,
            stepsKcal: closed.stepsKcal,
            activeKcal: closed.activeKcal,
            targetKcal: closed.targetKcal,
            consumedKcal: closed.consumedKcal,
            savedKcal: closed.savedKcal,
            overflowKcal: closed.overflowKcal,
            vaultDebitKcal: closed.vaultDebitKcal,
        }
        : {
            bmr: energy.bmr,
            baseKcal: energy.baseKcal,
            workoutKcal: energy.workoutKcal,
            stepsKcal: energy.stepsKcal,
            activeKcal: energy.activeKcal,
            targetKcal: energy.targetKcal,
            consumedKcal: energy.consumedKcal,
            savedKcal: preview.savedKcal,
            overflowKcal: preview.overflowKcal,
            vaultDebitKcal: preview.debitKcal,
        };

    return {
        date,
        today,
        status: closed ? 'closed' : 'open',
        canClose: closeBlockedReason === null,
        closeBlockedReason,
        ...kcal,
        steps: energy.steps,
        remainingKcal: kcal.targetKcal - kcal.consumedKcal,
        foodLogsCount: energy.foodLogsCount,
        macros: energy.macros,
        closedAt: closed ? closed.closedAt.toISOString() : null,
    };
}
