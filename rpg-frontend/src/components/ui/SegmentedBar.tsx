export type BarTone = 'kcal' | 'coin' | 'xp' | 'action' | 'danger';

const FILLED: Record<BarTone, string> = {
  kcal: 'bg-kcal',
  coin: 'bg-coin',
  xp: 'bg-xp',
  action: 'bg-action',
  danger: 'bg-danger',
};

/** Luz no topo e sombra na base de cada bloco: dá volume de sprite 2D. */
export const SEG_BEVEL = 'shadow-[inset_0_2px_0_rgba(255,255,255,0.28),inset_0_-2px_0_rgba(0,0,0,0.25)]';
const EMPTY = 'bg-raised shadow-[inset_0_2px_0_rgba(0,0,0,0.35)]';

interface SegmentedBarProps {
  value: number;
  max: number;
  segments?: number;
  tone: BarTone;
  label?: string;
  /** Altura: sm (12px, padrão) ou md (16px, barra principal). */
  size?: 'sm' | 'md';
  /** Quando passa do máximo, pinta o excesso em vermelho no fim da barra (ex.: kcal acima da meta). */
  showOverflow?: boolean;
}

/**
 * Barra em blocos (estilo HP/XP). Só visual: quem chama passa os números.
 * Blocos novos entram animados; barra cheia brilha; excesso aparece em vermelho.
 */
export function SegmentedBar({ value, max, segments = 12, tone, label, size = 'sm', showOverflow = false }: SegmentedBarProps) {
  // Máximo zero (ex.: cofre vazio): com showOverflow, tudo que existe é excesso; sem, a barra fica vazia.
  const zeroMax = max <= 0;
  const ratio = zeroMax ? 0 : Math.min(1, Math.max(0, value / max));
  const filled = zeroMax ? (showOverflow && value > 0 ? segments : 0) : value > 0 ? Math.max(1, Math.round(ratio * segments)) : 0;
  const full = filled === segments;

  const overRatio = showOverflow && !zeroMax && value > max ? (value - max) / max : 0;
  const over = zeroMax ? filled : overRatio > 0 ? Math.min(segments, Math.max(1, Math.round(overRatio * segments))) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={`flex w-full gap-[2px] ${size === 'md' ? 'h-4' : 'h-3'}`}
    >
      {Array.from({ length: segments }, (_, index) => {
        const isFilled = index < filled;
        const isOver = index >= segments - over;
        const color = isOver ? 'bg-danger' : isFilled ? FILLED[tone] : '';
        return (
          <span
            // A chave muda quando o bloco acende: só os blocos novos animam.
            key={`${index}-${isFilled ? (isOver ? 'o' : 'f') : 'e'}`}
            className={`h-full flex-1 rounded-[2px] ${isFilled ? `${color} ${SEG_BEVEL} seg-in ${full && !over ? 'seg-full' : ''}` : EMPTY}`}
            style={isFilled ? { animationDelay: `${Math.min(index, 20) * 22}ms` } : undefined}
          />
        );
      })}
    </div>
  );
}
