import type { BarTone } from './SegmentedBar';

const FILLED: Record<BarTone, string> = {
  kcal: 'bg-kcal',
  coin: 'bg-coin',
  xp: 'bg-xp',
  action: 'bg-action',
};

export interface StackedPart {
  value: number;
  tone: BarTone;
}

interface StackedBarProps {
  parts: StackedPart[];
  max: number;
  segments?: number;
  label?: string;
}

/** Barra em blocos com várias fatias lado a lado (ex.: já comi + refeição + sobra). Só visual. */
export function StackedBar({ parts, max, segments = 20, label }: StackedBarProps) {
  const cells: (BarTone | null)[] = Array.from({ length: segments }, () => null);
  let used = 0;
  let cursor = 0;
  for (const part of parts) {
    used += Math.max(0, part.value);
    const end = max > 0 ? Math.min(segments, Math.round((used / max) * segments)) : 0;
    // Uma fatia que existe nunca some: ocupa pelo menos um bloco, se ainda houver espaço.
    const to = part.value > 0 ? Math.min(segments, Math.max(end, cursor + 1)) : cursor;
    for (let i = cursor; i < to; i++) cells[i] = part.tone;
    cursor = Math.max(cursor, to);
  }

  return (
    <div role="img" aria-label={label} className="flex h-4 w-full gap-[2px]">
      {cells.map((tone, index) => (
        <span key={index} className={`h-full flex-1 rounded-[2px] ${tone ? FILLED[tone] : 'bg-raised'}`} />
      ))}
    </div>
  );
}
