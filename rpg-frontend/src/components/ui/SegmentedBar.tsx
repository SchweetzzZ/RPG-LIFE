export type BarTone = 'kcal' | 'coin' | 'xp' | 'action';

const FILLED: Record<BarTone, string> = {
  kcal: 'bg-kcal',
  coin: 'bg-coin',
  xp: 'bg-xp',
  action: 'bg-action',
};

interface SegmentedBarProps {
  value: number;
  max: number;
  segments?: number;
  tone: BarTone;
  label?: string;
}

/** Barra em blocos (estilo HP/XP). Só visual: quem chama passa os números. */
export function SegmentedBar({ value, max, segments = 12, tone, label }: SegmentedBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = value > 0 ? Math.max(1, Math.round(ratio * segments)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className="flex h-3 w-full gap-[2px]"
    >
      {Array.from({ length: segments }, (_, index) => (
        <span key={index} className={`h-full flex-1 rounded-[2px] ${index < filled ? FILLED[tone] : 'bg-raised'}`} />
      ))}
    </div>
  );
}
