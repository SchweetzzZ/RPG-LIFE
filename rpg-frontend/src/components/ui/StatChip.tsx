import type { ElementType } from 'react';

type ChipTone = 'coin' | 'xp' | 'kcal';

const TONES: Record<ChipTone, string> = {
  coin: 'text-coin',
  xp: 'text-xp',
  kcal: 'text-kcal',
};

interface StatChipProps {
  icon: ElementType;
  value: string;
  tone: ChipTone;
  label: string;
}

export function StatChip({ icon: Icon, value, tone, label }: StatChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${TONES[tone]}`} aria-label={`${label}: ${value}`} title={label}>
      <Icon className="h-4 w-4" aria-hidden />
      <span className="font-num text-lg leading-none tabular-nums">{value}</span>
    </span>
  );
}
