import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatNumber } from '@/src/lib/format';
import type { MacroTotals } from '@/src/lib/meal-draft';
import { StackedBar } from '../ui/StackedBar';

/** Com o que o total é comparado: cofre (semana) ou sobra de hoje (dia). */
export interface HudBudget {
  label: string;
  kcal: number;
}

interface MealTotalsHudProps {
  kcal: number;
  macros: MacroTotals;
  /** Sem dado do disponível: mostra só o total, sem barra. */
  budget: HudBudget | null;
  /** Textos explicativos (ficam pequenos abaixo). */
  children?: ReactNode;
}

const MACRO_LABELS = [
  { key: 'protein', short: 'P', name: 'Proteína' },
  { key: 'carbs', short: 'C', name: 'Carbo' },
  { key: 'fat', short: 'G', name: 'Gordura' },
] as const;

/** Gramas de um macro; "—" quando nenhum item da soma tem macros (0 g enganaria). */
function MacroValue({ macros, field }: { macros: MacroTotals; field: 'protein' | 'carbs' | 'fat' }) {
  if (macros.counted === 0) return <span className="text-ink-faint">—</span>;
  return (
    <>
      {formatNumber(macros[field])}
      <span className="text-[0.75em] text-ink-faint"> g</span>
    </>
  );
}

/** P / C / G em gramas (e kcal, opcional) em caixinhas no estilo do jogo. */
export function MacroChips({ macros, kcal }: { macros: MacroTotals; kcal?: number }) {
  return (
    <div className={`grid gap-1.5 ${kcal !== undefined ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {kcal !== undefined && (
        <div className="rounded-lg border-2 border-line bg-raised px-2 py-1 text-center">
          <p className="text-[11px] text-ink-faint">kcal</p>
          <p className="font-num text-lg leading-tight text-kcal">{formatNumber(kcal)}</p>
        </div>
      )}
      {MACRO_LABELS.map(({ key, short, name }) => (
        <div key={key} className="min-w-0 rounded-lg border-2 border-line bg-raised px-1 py-1 text-center" title={name}>
          <p className="truncate text-[11px] text-ink-faint">
            <span className="font-pixel text-ink-dim">{short}</span> {name.toLowerCase()}
          </p>
          <p className="font-num text-lg leading-tight text-ink">
            <MacroValue macros={macros} field={key} />
          </p>
        </div>
      ))}
    </div>
  );
}

/** P / C / G empilhados, compactos, ao lado do total do HUD. */
function MacroStack({ macros }: { macros: MacroTotals }) {
  return (
    <dl className="shrink-0 space-y-0.5 rounded-lg border-2 border-line bg-raised px-2 py-1">
      {MACRO_LABELS.map(({ key, short, name }) => (
        <div key={key} className="flex items-baseline justify-between gap-2" title={name}>
          <dt className="font-pixel text-[11px] leading-none text-ink-dim">{short}</dt>
          <dd className="font-num text-base leading-none text-ink">
            <MacroValue macros={macros} field={key} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** "1 item sem macros": itens digitados à mão (ou fora do catálogo) não entram na soma de P/C/G. */
export function MissingMacrosNote({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <p className="text-[11px] text-ink-faint">
      {count} {count === 1 ? 'item sem macros' : 'itens sem macros'} (não entra na soma de P/C/G)
    </p>
  );
}

interface Delta {
  id: number;
  value: number;
}

/** Selo "+388" / "−388" que aparece ao lado do total a cada mudança e some sozinho. */
function useKcalDelta(kcal: number): Delta | null {
  const previous = useRef(kcal);
  const counter = useRef(0);
  const [delta, setDelta] = useState<Delta | null>(null);

  useEffect(() => {
    const diff = kcal - previous.current;
    previous.current = kcal;
    if (diff === 0) return;
    counter.current += 1;
    setDelta({ id: counter.current, value: diff });
    const timer = window.setTimeout(() => setDelta(null), 1100);
    return () => window.clearTimeout(timer);
  }, [kcal]);

  return delta;
}

/**
 * HUD do total da refeição: kcal grande (muda a cada toque), selo de variação, barra em blocos
 * contra o disponível e P/C/G. Usado no rodapé do montador e do resgate.
 */
export function MealTotalsHud({ kcal, macros, budget, children }: MealTotalsHudProps) {
  const delta = useKcalDelta(kcal);
  const reduceMotion = useReducedMotion();
  const over = budget !== null && kcal > budget.kcal;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-pixel text-[11px] uppercase leading-none text-ink-dim">Total</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-num text-4xl leading-none ${over ? 'text-danger' : 'text-ink'}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {formatNumber(kcal)}
            </span>
            <span className="text-sm text-ink-faint">kcal</span>
            <span className="relative inline-flex h-6 min-w-[3.5rem] items-center">
              <AnimatePresence>
                {delta && (
                  <motion.span
                    key={delta.id}
                    aria-hidden
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`absolute left-0 rounded border-2 px-1 font-num text-base leading-tight ${
                      delta.value > 0 ? 'border-xp/60 bg-xp/15 text-xp' : 'border-action/60 bg-action/15 text-action'
                    }`}
                  >
                    {delta.value > 0 ? '+' : '−'}
                    {formatNumber(Math.abs(delta.value))}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
        </div>
        <MacroStack macros={macros} />
      </div>

      {budget && (
        <div className="space-y-1">
          {/* Azul = parte do total que o disponível cobre; vermelho = o que passa. Acima do limite, a escala vira o total. */}
          <StackedBar
            segments={20}
            max={Math.max(kcal, budget.kcal)}
            parts={[
              { value: Math.min(kcal, Math.max(0, budget.kcal)), tone: 'kcal' },
              { value: Math.max(0, kcal - Math.max(0, budget.kcal)), tone: 'danger' },
            ]}
            label={`Total contra ${budget.label}`}
          />
          <p className="text-xs text-ink-dim">
            {budget.label}: {formatNumber(budget.kcal)} kcal ·{' '}
            {over ? (
              <span className="text-danger">passa {formatNumber(kcal - budget.kcal)}</span>
            ) : (
              <>sobram {formatNumber(budget.kcal - kcal)}</>
            )}
          </p>
        </div>
      )}

      <MissingMacrosNote count={macros.missing} />

      {children && <div className="space-y-0.5 text-[11px] leading-snug text-ink-faint">{children}</div>}
    </div>
  );
}
