import { Minus, Plus } from 'lucide-react';
import { MAX_ITEM_QTY, roundQty } from '@/src/lib/meal-draft';

interface QuantityStepperProps {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
  min?: number;
}

export function QuantityStepper({ label, value, step, onChange, min = 0 }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Diminuir ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, roundQty(value - step)))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-zinc-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center font-mono text-sm font-bold tabular-nums text-zinc-100">{value}</span>
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        disabled={value >= MAX_ITEM_QTY}
        onClick={() => onChange(Math.min(MAX_ITEM_QTY, roundQty(value + step)))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-zinc-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
