import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { workoutService } from '../../services/workout.service';
import { errorMessage } from '../../services/http';
import { WEEK_DAYS, type Routine } from '../../types/workout';

interface RoutineSettingsSheetProps {
  routine: Routine;
  onSaved: (routine: Routine) => void;
  onDeleted: () => void;
  onClose: () => void;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-ink-dim';
const fieldClass =
  'h-11 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none';

/** Folha "Editar rotina": nome, dias da semana, duração estimada e remover. Grava só esses campos. */
export function RoutineSettingsSheet({ routine, onSaved, onDeleted, onClose }: RoutineSettingsSheetProps) {
  const [title, setTitle] = useState(routine.title);
  const [days, setDays] = useState<number[]>(routine.scheduledDays);
  const [minutes, setMinutes] = useState(String(routine.estimatedMinutes));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const updated = await workoutService.updateRoutine(routine.id, {
        title: title.trim() || routine.title,
        scheduledDays: [...days].sort(),
        estimatedMinutes: Math.max(1, Math.round(Number(minutes)) || routine.estimatedMinutes),
      });
      onSaved(updated);
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível salvar o treino'));
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await workoutService.deleteRoutine(routine.id);
      onDeleted();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível remover o treino'));
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Editar treino"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-xl border-2 border-line bg-surface p-4 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-pixel text-lg text-ink">Editar treino</h2>
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

        <label className="block space-y-1">
          <span className={labelClass}>Nome do treino</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </label>

        <div className="space-y-1">
          <span className={labelClass}>Dias da semana</span>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_DAYS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={days.includes(day)}
                className={`min-h-[44px] rounded-lg border-2 text-xs font-semibold ${
                  days.includes(day)
                    ? 'border-action bg-raised text-action'
                    : 'border-line bg-raised text-ink-faint hover:border-ink-faint'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1">
          <span className={labelClass}>Duração estimada (min)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className={`${fieldClass} text-center font-num`}
          />
        </label>

        <Button onClick={() => void handleSave()} disabled={busy}>
          {busy && !confirmingDelete ? 'Salvando...' : 'Salvar'}
        </Button>

        <div className="border-t-2 border-line pt-3">
          {confirmingDelete ? (
            <div role="alertdialog" aria-label="Confirmar remoção" className="space-y-2 rounded-lg border-2 border-danger/60 bg-raised p-3">
              <p className="text-sm text-ink">Remover este treino? O histórico é mantido.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  className="!border-danger/60 !text-danger"
                  onClick={() => void handleDelete()}
                  disabled={busy}
                >
                  {busy ? 'Removendo...' : 'Remover'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-ink-dim hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
              Remover treino
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
