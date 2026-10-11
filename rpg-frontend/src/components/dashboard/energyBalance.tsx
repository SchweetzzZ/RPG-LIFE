import type { DayState } from '@/src/types/day';
import { formatNumber, percent } from '@/src/lib/format';

interface EnergyBalanceProps {
    day: DayState
}

export function EnergyBalance({ day }: EnergyBalanceProps) {
    const over = day.consumedKcal > day.targetKcal
    const progress = percent(day.consumedKcal, day.targetKcal)

    return (
        <div className="w-full flex flex-col gap-4 border border-neutral-800 bg-neutral-900 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-neutral-400 border-b border-neutral-800 pb-2">
                <span className="font-semibold uppercase tracking-wider">Meta de hoje</span>
                <span className="text-cyan-400 font-medium">{formatNumber(day.targetKcal)} kcal</span>
            </div>

            <div className="flex flex-col items-center justify-center py-4 border border-neutral-800 bg-neutral-950 rounded-lg">
                {over ? (
                    <>
                        <span className="text-3xl font-extrabold text-neutral-100 tabular-nums">
                            +{formatNumber(day.consumedKcal - day.targetKcal)}
                        </span>
                        <span className="text-xs text-neutral-400 uppercase mt-1 tracking-wider">kcal acima da meta</span>
                        <span className="text-xs text-neutral-500 mt-2 px-4 text-center">
                            Se foi consciente, tudo bem. Se não foi, vale um controle maior da próxima vez.
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-3xl font-extrabold text-neutral-100 tabular-nums">
                            {formatNumber(day.remainingKcal)}
                        </span>
                        <span className="text-xs text-neutral-400 uppercase mt-1 tracking-wider">kcal restantes</span>
                    </>
                )}
                <div className="mt-3 h-1.5 w-2/3 rounded-full bg-neutral-800 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400/70 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-neutral-500 mt-2">
                    {formatNumber(day.consumedKcal)} consumidas • {day.foodLogsCount} {day.foodLogsCount === 1 ? 'registro' : 'registros'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
                    <div className="text-neutral-400">Base</div>
                    <div className="font-bold text-neutral-200 mt-1">{formatNumber(day.baseKcal)} kcal</div>
                </div>
                <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
                    <div className="text-neutral-400">Treino</div>
                    <div className="font-bold text-neutral-200 mt-1">{formatNumber(day.workoutKcal)} kcal</div>
                </div>
                <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
                    <div className="text-neutral-400">Passos</div>
                    <div className="font-bold text-neutral-200 mt-1">{formatNumber(day.stepsKcal)} kcal</div>
                </div>
            </div>
        </div>
    )
}
