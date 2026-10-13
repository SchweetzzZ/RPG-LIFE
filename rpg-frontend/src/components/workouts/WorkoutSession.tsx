import { useEffect, useState } from 'react';
import { Check, Clock, Eraser, LineChart, Plus, Trash2, X, Trophy } from 'lucide-react';
import { RestTimerFloating } from './RestTimerFloating';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExerciseDeleteConfirm } from './ExerciseDeleteConfirm';
import { ExerciseChartSheet } from './ExerciseChartSheet';
import { ExercisePicker, type PickedExercise } from './ExercisePicker';
import { compareSet, describeDiff } from './set-compare';
import {
  blankSet,
  buildLogInput,
  buildSessionExercises,
  countRegisteredSets,
  findPerformance,
  nameKey,
  toTechnique,
  uid,
  type SessionExercise,
} from './session';
import { workoutService } from '../../services/workout.service';
import { errorMessage } from '../../services/http';
import { SET_TECHNIQUES } from '../../types/workout';
import type { ExerciseCatalogItem, ExercisePerformance, LogSessionResult, Routine, SetTechnique } from '../../types/workout';

interface WorkoutSessionProps {
  /** null = treino avulso (sem rotina). */
  routine: Routine | null;
  performance: ExercisePerformance[];
  /** Exercícios existentes, para o seletor. */
  catalog: ExerciseCatalogItem[];
  /** Recarrega os dados da tela depois de apagar um exercício. */
  onCatalogChanged: () => Promise<void>;
  /** true: cronômetro + descanso entre séries. false: só anotar carga × repetições. */
  withTimer: boolean;
  onSaved: (result: LogSessionResult) => void;
  onCancel: () => void;
}

const formatElapsed = (sec: number) => {
  const mins = Math.floor(sec / 60);
  return `${String(mins).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
};

const formatDate = (iso: string) => iso.split('-').reverse().join('/');

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-ink-dim';
const inputClass =
  'h-11 w-full rounded-lg border-2 border-line bg-raised text-center font-pixel text-base text-ink placeholder:font-sans placeholder:text-xs placeholder:text-ink-faint focus:border-action focus:outline-none';
const iconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-danger';

export function WorkoutSession({ routine, performance, catalog, onCatalogChanged, withTimer, onSaved, onCancel }: WorkoutSessionProps) {
  const [exercises, setExercises] = useState<SessionExercise[]>(() => buildSessionExercises(routine, performance));
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState<{ id: number; seconds: number } | null>(null);
  const [durationInput, setDurationInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [chartName, setChartName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!withTimer) return;
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [withTimer]);

  const registeredSets = countRegisteredSets(exercises);

  function updateExercise(key: string, change: (ex: SessionExercise) => SessionExercise) {
    setExercises((prev) => prev.map((ex) => (ex.key === key ? change(ex) : ex)));
  }

  function updateSet(
    exKey: string,
    setKey: string,
    patch: Partial<{ weightKg: number; reps: number; technique: SetTechnique; done: boolean }>,
  ) {
    updateExercise(exKey, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)),
    }));
  }

  function toggleDone(exKey: string, setKey: string, restSeconds: number, done: boolean) {
    updateSet(exKey, setKey, { done: !done });
    if (withTimer && !done) setRest({ id: Date.now(), seconds: restSeconds });
  }

  function addSet(exKey: string) {
    updateExercise(exKey, (ex) => ({ ...ex, sets: [...ex.sets, blankSet(ex.sets[ex.sets.length - 1])] }));
  }

  function removeSet(exKey: string, setKey: string) {
    updateExercise(exKey, (ex) => ({ ...ex, sets: ex.sets.filter((s) => s.key !== setKey) }));
  }

  function removeExercise(exKey: string) {
    setExercises((prev) => prev.filter((ex) => ex.key !== exKey));
  }

  /** Existente entra com a última carga pré-preenchida; nome novo entra com uma série vazia. */
  function addExercise(picked: PickedExercise) {
    const sets =
      picked.lastSets.length > 0
        ? picked.lastSets.map((s) => ({
            ...blankSet(),
            weightKg: s.weightKg,
            reps: s.reps,
            technique: toTechnique(s.technique),
            restSeconds: s.restSeconds ?? 90,
          }))
        : [blankSet()];
    setExercises((prev) => [
      ...prev,
      { key: uid(), name: picked.name, originalName: picked.existing ? picked.name : null, sets },
    ]);
  }

  async function deleteExercise(ex: SessionExercise) {
    if (ex.originalName === null) return;
    setDeletingKey(ex.key);
    setError(null);
    try {
      await workoutService.deleteExercise(ex.originalName);
      removeExercise(ex.key);
      setConfirmingKey(null);
      await onCatalogChanged();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível apagar o exercício'));
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleSave() {
    setError(null);
    const duration = withTimer ? Math.max(1, Math.round(seconds / 60)) : Number(durationInput);
    const input = buildLogInput({
      routine,
      exercises,
      durationMinutes: duration > 0 ? duration : undefined,
      date: !withTimer && dateInput ? dateInput : undefined,
    });
    if (input.exercises.length === 0) {
      setError('Registre ao menos um exercício com uma série.');
      return;
    }
    setSaving(true);
    try {
      // Nomes alterados: renomeia antes de gravar (o histórico acompanha); 409 interrompe sem salvar nada.
      for (const ex of exercises) {
        const to = ex.name.trim();
        if (ex.originalName !== null && to !== '' && to !== ex.originalName) {
          await workoutService.renameExercise(ex.originalName, to);
        }
      }
      onSaved(await workoutService.logSession(input));
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível registrar o treino'));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg pb-36 text-ink">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-surface px-3 py-2">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 md:max-w-2xl">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink-dim hover:text-ink"
              aria-label="Fechar sem salvar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-pixel text-lg text-ink">{routine?.title ?? 'Treino avulso'}</h2>
              {withTimer ? (
                <div className="flex items-center gap-1.5 text-xs text-xp">
                  <Clock className="h-4 w-4" />
                  <span className="font-pixel text-base">{formatElapsed(seconds)}</span>
                </div>
              ) : (
                <span className="text-xs text-ink-faint">Registro manual, sem cronômetro</span>
              )}
            </div>
          </div>

          <Button className="!w-auto shrink-0" onClick={handleSave} disabled={saving || registeredSets === 0}>
            <Check className="h-4 w-4" />
            <span>{saving ? 'Salvando...' : 'Salvar treino'}</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-3 pt-3 md:max-w-2xl">
        {error && (
          <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!withTimer && (
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className={labelClass}>Duração (min)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="estimada"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Data</span>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className={`${inputClass} font-sans`}
                />
              </label>
            </div>
          </Card>
        )}

        {exercises.map((exercise, exIndex) => {
          const last = findPerformance(performance, exercise.name);
          // Comparação usa a última carga do catálogo, pelo nome com que o exercício existe (não o que está sendo digitado).
          const catalogKey = nameKey(exercise.originalName ?? exercise.name);
          const lastSets = catalog.find((c) => nameKey(c.name) === catalogKey)?.lastSets ?? [];
          let workIndex = -1;
          return (
            <Card key={exercise.key}>
              <div className="flex items-start justify-between gap-2 border-b-2 border-line pb-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised font-pixel text-base text-ink-dim">
                      {exIndex + 1}
                    </span>
                    <input
                      value={exercise.name}
                      onChange={(e) => updateExercise(exercise.key, (cur) => ({ ...cur, name: e.target.value }))}
                      className="h-11 min-w-0 flex-1 rounded-lg border-2 border-transparent bg-transparent px-1 font-pixel text-lg text-ink hover:border-line focus:border-action focus:bg-raised focus:outline-none"
                      aria-label="Nome do exercício"
                    />
                    <button
                      type="button"
                      onClick={() => setChartName(exercise.originalName ?? exercise.name.trim())}
                      disabled={exercise.originalName === null && exercise.name.trim() === ''}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink-dim hover:text-action disabled:opacity-40"
                      aria-label={`Ver evolução de ${exercise.name}`}
                    >
                      <LineChart className="h-4 w-4" />
                    </button>
                  </div>
                  {last && last.sets.length > 0 && (
                    <p className="text-xs text-ink-faint">
                      Última vez ({formatDate(last.date)}):{' '}
                      {last.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.key)}
                  className={iconBtn}
                  aria-label={`Remover ${exercise.name} do treino`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {exercise.originalName !== null && (
                <div className="mt-2">
                  {confirmingKey === exercise.key ? (
                    <ExerciseDeleteConfirm
                      name={exercise.originalName}
                      busy={deletingKey === exercise.key}
                      onConfirm={() => void deleteExercise(exercise)}
                      onCancel={() => setConfirmingKey(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingKey(exercise.key)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-xs font-medium text-ink-faint hover:text-danger"
                    >
                      <Eraser className="h-4 w-4" />
                      Apagar exercício e histórico
                    </button>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-2">
                {exercise.sets.map((set, setIdx) => {
                  const isRecord =
                    !!last && set.technique !== 'warmup' && set.weightKg > last.personalBestKg && last.personalBestKg > 0;
                  if (set.technique !== 'warmup') workIndex += 1;
                  const diff = compareSet(set, workIndex, lastSets);
                  return (
                    <div
                      key={set.key}
                      className={`space-y-2 rounded-lg border-2 p-2.5 ${
                        set.done ? 'border-action bg-raised' : 'border-line bg-raised'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-center font-pixel text-base text-ink-dim">{setIdx + 1}</span>
                        <select
                          value={set.technique}
                          onChange={(e) => {
                            const picked = SET_TECHNIQUES.find((t) => t.value === e.target.value);
                            if (picked) updateSet(exercise.key, set.key, { technique: picked.value });
                          }}
                          className="h-11 min-w-0 flex-1 rounded-lg border-2 border-line bg-surface px-2 text-base text-ink focus:border-action focus:outline-none"
                          aria-label="Tipo da série"
                        >
                          {SET_TECHNIQUES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.short} · {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSet(exercise.key, set.key)}
                          className={iconBtn}
                          aria-label="Remover série"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className={`grid items-end gap-2 ${withTimer ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-2'}`}>
                        <label className="relative block space-y-0.5">
                          <span className="text-xs text-ink-faint">Kg</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={set.weightKg}
                            onChange={(e) =>
                              updateSet(exercise.key, set.key, { weightKg: Math.max(0, Number(e.target.value)) })
                            }
                            className={inputClass}
                          />
                          {isRecord && (
                            <Trophy
                              className="absolute right-1.5 top-6 h-4 w-4 text-coin"
                              aria-label="Novo recorde de carga"
                            />
                          )}
                        </label>
                        <label className="block space-y-0.5">
                          <span className="text-xs text-ink-faint">Reps</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(exercise.key, set.key, { reps: Math.max(0, Math.round(Number(e.target.value))) })
                            }
                            className={inputClass}
                          />
                        </label>
                        {withTimer && (
                          <button
                            type="button"
                            onClick={() => toggleDone(exercise.key, set.key, set.restSeconds, set.done)}
                            aria-pressed={set.done}
                            className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 transition-all active:translate-y-[1px] ${
                              set.done
                                ? 'border-[#0c0a08] bg-action text-[#0c0a08]'
                                : 'border-line bg-surface text-ink-faint hover:border-ink-faint'
                            }`}
                            aria-label="Marcar série como feita e iniciar descanso"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      {diff && (
                        <p className="text-xs text-ink-faint" aria-label="Comparação com a última vez">
                          vs última: {describeDiff(diff)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button variant="secondary" className="mt-3" onClick={() => addSet(exercise.key)}>
                <Plus className="h-4 w-4" />
                <span>Adicionar série</span>
              </Button>
            </Card>
          );
        })}

        <div className="rounded-lg border-2 border-dashed border-line p-3">
          <ExercisePicker catalog={catalog} onPick={addExercise} placeholder="Adicionar exercício..." />
        </div>
      </main>

      {chartName && <ExerciseChartSheet name={chartName} onClose={() => setChartName(null)} />}

      {rest && (
        <RestTimerFloating key={rest.id} initialSeconds={rest.seconds} onClose={() => setRest(null)} />
      )}
    </div>
  );
}
