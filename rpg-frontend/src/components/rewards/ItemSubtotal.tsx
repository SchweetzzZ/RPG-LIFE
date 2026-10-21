import { formatNumber } from '@/src/lib/format';
import { macrosLabel, scaleMacros, type Macros } from '@/src/lib/meal-draft';

interface ItemSubtotalProps {
  kcalPerUnit: number;
  qty: number;
  /** null = item sem macros (só mostra a kcal). */
  macrosPerUnit: Macros | null;
}

/** Subtotal da linha ao lado do stepper: "776 kcal · P 18 · C 70 · G 40". Quebra só entre kcal e macros. */
export function ItemSubtotal({ kcalPerUnit, qty, macrosPerUnit }: ItemSubtotalProps) {
  const active = qty > 0;
  return (
    <p className={`font-num text-sm leading-tight ${active ? 'text-kcal' : 'text-ink-faint'}`}>
      <span className="whitespace-nowrap">{formatNumber(kcalPerUnit * qty)} kcal</span>
      {macrosPerUnit ? (
        <>
          {' '}
          <span className={`whitespace-nowrap ${active ? 'text-ink-dim' : ''}`}>· {macrosLabel(scaleMacros(macrosPerUnit, qty))}</span>
        </>
      ) : (
        active && (
          <>
            {' '}
            <span className="whitespace-nowrap text-ink-faint">· sem macros</span>
          </>
        )
      )}
    </p>
  );
}
