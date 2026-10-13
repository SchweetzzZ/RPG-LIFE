import { formatNumber } from '@/src/lib/format';
import { Card } from '../ui/Card';
import { SegmentedBar, type BarTone } from '../ui/SegmentedBar';

interface Macro {
  name: string;
  consumed: number;
  /** null quando não há meta (perfil incompleto). */
  target: number | null;
  tone: BarTone;
}

export function MacroRings({ macros }: { macros: Macro[] }) {
  return (
    <Card label="Macros">
      <div className="space-y-3">
        {macros.map((macro) => (
          <div key={macro.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-dim">{macro.name}</span>
              <span className="tabular-nums text-ink">
                {formatNumber(macro.consumed)}
                {macro.target !== null && <span className="text-ink-faint"> / {formatNumber(macro.target)}</span>} g
              </span>
            </div>
            {macro.target !== null && (
              <SegmentedBar value={macro.consumed} max={macro.target} segments={12} tone={macro.tone} label={macro.name} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
