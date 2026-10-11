import { ShieldCheck } from 'lucide-react';
import type { Vault } from '@/src/types/vault';
import { formatDay, formatNumber, pluralize } from '@/src/lib/format';

interface CaloricVaultProps {
    vault: Vault
}

export function CaloricVault({ vault }: CaloricVaultProps) {
    const { cycle, balanceKcal, previousCycle } = vault

    return (
        <div className="flex flex-col justify-between border border-neutral-800 bg-neutral-900 rounded-xl p-4">
            <div>
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    Cofre da semana
                </div>
                <div className="text-2xl font-bold text-neutral-100 mt-1 tabular-nums">
                    {formatNumber(balanceKcal)}<span className="text-xs font-normal text-neutral-400"> kcal guardadas</span>
                </div>
            </div>
            <div className="text-xs text-neutral-400 mt-3 pt-2 border-t border-neutral-800 space-y-1">
                <p>
                    Semana de {formatDay(cycle.startDate)} a {formatDay(cycle.endDate)} •{' '}
                    {cycle.daysLeft > 0 ? `${pluralize(cycle.daysLeft, 'dia restante', 'dias restantes')}` : 'último dia'}
                </p>
                <p className="text-neutral-500">O cofre e as moedas zeram na virada para segunda-feira.</p>
                {previousCycle && previousCycle.resetKcal > 0 && (
                    <p className="text-neutral-500">
                        Semana passada: {formatNumber(previousCycle.resetKcal)} kcal não usadas expiraram.
                    </p>
                )}
            </div>
        </div>
    )
}
