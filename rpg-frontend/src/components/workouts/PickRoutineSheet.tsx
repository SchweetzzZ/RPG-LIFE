import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { workoutService } from '../../services/workout.service';
import { errorMessage } from '../../services/http';
import type { Routine } from '../../types/workout';

interface PickRoutineSheetProps {
  routines: Routine[];
  /** Dia da semana de hoje (0 = domingo), para pôr a rotina do dia primeiro. */
  today: number;
  onClose: () => void;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-ink-dim';
const fieldClass =
  'h-11 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none';

/** Todo treino pertence a uma rotina: escolhe uma (a do dia vem primeiro) ou cria a primeira. */
export function PickRoutineSheet({ routines, today, onClose }: PickRoutineSheetProps) {
  const navigate = useNavigate();
  const ordered = [
    ...routines.filter((r) => r.scheduledDays.includes(today)),
    ...routines.filter((r) => !r.scheduledDays.includes(today)),
  ];
  const [selectedId, setSelectedId] = useState(
    () => routines.find((r) => r.scheduledDays.includes(today))?.id ?? '',
  );
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(id: string) {
    navigate({ to: '/workouts/$id', params: { id } });
  }

  async function handleCreate() {
    const name = title.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const routine = await workoutService.createRoutine({
        title: name,
        description: '',
        estimatedMinutes: 45,
        targetMuscleGroups: [],
        scheduledDays: [],
        intensity: 'moderate',
        exercises: [],
        completionCount: 0,
      });
      open(routine.id);
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível criar a rotina'));
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Registrar exercício"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-xl border-2 border-line bg-surface p-4 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-pixel text-lg text-ink">Registrar exercício</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink-dim hover:text-ink"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border-2 border-danger/60 bg-raised p-3 text-sm text-danger">
            {error}
          </p>
        )}

        {ordered.length > 0 ? (
          <>
            <div className="space-y-1">
              <span id="pick-routine-label" className={labelClass}>Em qual rotina?</span>
              <Select
                aria-labelledby="pick-routine-label"
                placeholder="Escolha uma rotina"
                value={selectedId}
                onChange={setSelectedId}
                options={ordered.map((r) => ({
                  value: r.id,
                  label: r.title,
                  tag: r.scheduledDays.includes(today) ? 'treino do dia' : undefined,
                }))}
              />
            </div>
            <Button onClick={() => open(selectedId)} disabled={selectedId === ''}>
              Continuar
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-dim">Crie uma rotina para registrar o treino.</p>
            <label className="block space-y-1">
              <span className={labelClass}>Nome da rotina</span>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
                placeholder="Ex.: Treino A, peito e tríceps"
                className={fieldClass}
              />
            </label>
            <Button onClick={() => void handleCreate()} disabled={creating || !title.trim()}>
              {creating ? 'Criando...' : 'Criar e continuar'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
