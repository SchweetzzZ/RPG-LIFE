import { useId, useState } from 'react';
import { ArrowDown, ArrowUp, Eraser, MoreHorizontal } from 'lucide-react';
import { ExerciseDeleteConfirm } from './ExerciseDeleteConfirm';
import { ChoiceChips } from '../ui/ChoiceChips';
import { EXERCISE_CATEGORIES, type ExerciseCategory } from '../../types/workout';

interface ExerciseMenuProps {
  /** Nome do exercício (para os rótulos). */
  name: string;
  index: number;
  count: number;
  category: ExerciseCategory;
  /** Nome com que o exercício existe no catálogo; null = criado agora (não há histórico para apagar). */
  originalName: string | null;
  deleting: boolean;
  onMove: (direction: -1 | 1) => void;
  onCategory: (category: ExerciseCategory) => void;
  /** Apaga o exercício de todas as rotinas e todo o histórico dele. */
  onDelete: () => void;
}

const itemClass =
  'flex min-h-[44px] w-full items-center gap-2 rounded-lg border-2 border-line bg-raised px-3 text-left text-sm font-medium text-ink hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40';

/** Menu ⋯ do exercício: ordem, categoria e apagar exercício e histórico. */
export function ExerciseMenu({
  name,
  index,
  count,
  category,
  originalName,
  deleting,
  onMove,
  onCategory,
  onDelete,
}: ExerciseMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirming(false);
        }}
        aria-expanded={open}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 bg-raised hover:text-ink ${
          open ? 'border-action text-action' : 'border-line text-ink-dim'
        }`}
        aria-label={`Mais opções de ${name}`}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open && (
        <div className="basis-full space-y-2 rounded-lg border-2 border-line bg-surface p-2" role="menu">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              className={itemClass}
            >
              <ArrowUp className="h-4 w-4" />
              Subir
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => onMove(1)}
              disabled={index === count - 1}
              className={itemClass}
            >
              <ArrowDown className="h-4 w-4" />
              Descer
            </button>
          </div>

          <div className="space-y-1">
            <span id={`${menuId}-cat`} className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Categoria
            </span>
            <ChoiceChips
              aria-labelledby={`${menuId}-cat`}
              value={category}
              options={EXERCISE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              onChange={onCategory}
            />
          </div>

          {originalName !== null &&
            (confirming ? (
              <ExerciseDeleteConfirm
                name={originalName}
                busy={deleting}
                onConfirm={onDelete}
                onCancel={() => setConfirming(false)}
              />
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className={`${itemClass} text-ink-dim hover:!border-danger/60 hover:text-danger`}
              >
                <Eraser className="h-4 w-4" />
                Apagar exercício e histórico
              </button>
            ))}
        </div>
      )}
    </>
  );
}
