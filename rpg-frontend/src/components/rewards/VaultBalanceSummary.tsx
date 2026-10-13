import { Info } from 'lucide-react';
import type { NextFreeMeals } from '@/src/types/free-meal';
import { formatDay, formatNumber, pluralize } from '@/src/lib/format';
import { Card } from '../ui/Card';

interface VaultBalanceSummaryProps {
  next: NextFreeMeals;
}

export function VaultBalanceSummary({ next }: VaultBalanceSummaryProps) {
  const { cycle, vaultBalanceKcal, coinBalance } = next;

  return (
    <Card label="Refeições livres" aside={`${formatDay(cycle.startDate)} a ${formatDay(cycle.endDate)}`}>
      <div className="space-y-3">
        <p className="text-sm text-ink">Planeje, guarde e coma sem culpa. A refeição só é liberada com cofre e moedas.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border-2 border-line bg-raised p-2.5">
            <p className="text-xs text-ink-faint">Moedas</p>
            <p className="font-pixel text-2xl font-bold leading-tight tabular-nums text-coin">{formatNumber(coinBalance)}</p>
          </div>
          <div className="rounded-lg border-2 border-line bg-raised p-2.5">
            <p className="text-xs text-ink-faint">Cofre</p>
            <p className="font-pixel text-2xl font-bold leading-tight tabular-nums text-kcal">
              {formatNumber(vaultBalanceKcal)} <span className="text-base">kcal</span>
            </p>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {cycle.daysLeft > 0 ? pluralize(cycle.daysLeft, 'dia restante', 'dias restantes') : 'Último dia'}. Cofre e moedas zeram na virada para segunda.
        </p>
      </div>
    </Card>
  );
}
