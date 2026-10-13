import { X } from 'lucide-react';
import { ExerciseChart } from './ExerciseChart';

interface ExerciseChartSheetProps {
  name: string;
  onClose: () => void;
}

/** Bottom sheet com o gráfico de um exercício (acima do registro de treino, que usa z-[60]). */
export function ExerciseChartSheet({ name, onClose }: ExerciseChartSheetProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Evolução de ${name}`}
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-xl border-2 border-line bg-surface p-4 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="min-w-0 truncate font-pixel text-lg text-ink">{name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink-dim hover:text-ink"
            aria-label="Fechar gráfico"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ExerciseChart name={name} />
      </div>
    </div>
  );
}
