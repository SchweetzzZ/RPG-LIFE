import { useState } from 'react';
import { Scale } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { WeightSummary } from '@/src/types/weight';
import { weightService } from '@/src/services/weight.service';
import { formatDay } from '@/src/lib/format';
import { deltaTone, formatDeltaKg, formatKg } from '@/src/lib/weight';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WeightInput } from './WeightInput';

interface WeightCardProps {
  summary: WeightSummary;
  /** Depois de registrar: reler o Hub (a meta de kcal pode ter mudado). */
  onSaved: () => Promise<void>;
}

/** Hub: último peso e atalho para registrar o de hoje. O app nunca cobra frequência. */
export function WeightCard({ summary, onSaved }: WeightCardProps) {
  const [editing, setEditing] = useState(false);
  const { currentKg, currentDate, loggedToday, weekChangeKg, primaryGoal, today } = summary;

  const save = async (weightKg: number) => {
    await weightService.putWeight(today, weightKg);
    setEditing(false);
    await onSaved();
  };

  return (
    <Card label="Peso" icon={Scale} aside={loggedToday ? 'hoje' : undefined} highlight={loggedToday ? 'action' : undefined}>
      <div className="space-y-3">
        {currentKg !== null ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-num text-4xl leading-none text-ink">{formatKg(currentKg, false)}</span>
              <span className="text-sm text-ink-faint">kg</span>
            </div>
            <div className="text-right text-xs text-ink-faint">
              {!loggedToday && currentDate && <p>Última pesagem: {formatDay(currentDate)}</p>}
              {weekChangeKg !== null && (
                <p>
                  Semana:{' '}
                  <span className={`font-num text-base ${deltaTone(weekChangeKg, primaryGoal)}`}>{formatDeltaKg(weekChangeKg)}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-dim">Anote seu peso nos dias em que se pesar e acompanhe a tendência.</p>
        )}

        {editing ? (
          <WeightInput
            autoFocus
            initialKg={loggedToday ? currentKg : null}
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        ) : loggedToday ? (
          <div className="flex items-center justify-between gap-2">
            <Button variant="link" className="!px-0" onClick={() => setEditing(true)}>Corrigir o de hoje</Button>
            <Link to="/profile" hash="peso" className="min-h-[44px] content-center px-2 text-sm font-medium text-ink-dim underline underline-offset-2 hover:text-ink">
              Ver gráfico →
            </Link>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Scale className="h-4 w-4" />
            Registrar peso de hoje
          </Button>
        )}
      </div>
    </Card>
  );
}
