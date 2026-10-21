import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Clock, LineChart, MoreHorizontal, Plus, Save, Settings, Trash2, Trophy } from 'lucide-react';
import { RestTimerFloating } from './RestTimerFloating';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { ExerciseChartSheet } from './ExerciseChartSheet';
import { ExerciseMenu } from './ExerciseMenu';
import { SetNumberInput } from './SetNumberInput';
import { ExercisePicker, type PickedExercise } from './ExercisePicker';
import { RoutineSettingsSheet } from './RoutineSettingsSheet';
import { compareSet, describeDiff } from './set-compare';
import { buildRoutineUpdate, hasStructureChange, removeFromRoutine, renameInRoutine } from './routine-sync';
import {
  blankSet,
  buildLogInput,
  buildSessionExercises,
  countRegisteredSets,
  findPerformance,
  nameKey,
  sessionSignature,
  toTechnique,
  uid,
  type SessionExercise,
} from './session';
import { workoutService } from '../../services/workout.service';
import { errorMessage } from '../../services/http';
import { SET_TECHNIQUES } from '../../types/workout';
import type {
  ExerciseCatalogItem,
  ExercisePerformance,
  LogSessionResult,
  Routine,
  SetTechnique,
} from '../../types/workout';

interface WorkoutScreenProps {
  routine: Routine;
  performance: ExercisePerformance[];
  /** Exercícios existentes, para o seletor. */
  catalog: ExerciseCatalogItem[];
  /** Relê catálogo e últimas cargas (depois de apagar ou renomear exercício). */
  onCatalogChanged: () => Promise<void>;
  /** true: abre com o cronômetro ligado (?timer=1). */
  initialTimer: boolean;
}

const formatElapsed = (sec: number) => {
  const mins = Math.floor(sec / 60);
  return `${String(mins).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
};

const formatDate = (iso: string) => iso.split('-').reverse().join('/');

const inputClass =
  'h-11 w-full rounded-lg border-2 border-line bg-raised text-center font-num text-base text-ink placeholder:font-sans placeholder:text-xs placeholder:text-ink-faint focus:border-action focus:outline-none';
const iconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-danger';
const squareBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink-dim hover:text-ink';

/** Tela única da rotina: registra o treino de hoje e, se o usuário quiser, atualiza a rotina. */
export function WorkoutScreen({ routine, performance, catalog, onCatalogChanged, initialTimer }: WorkoutScreenProps) {
  const navigate = useNavigate();
  // Rotina como esta no servidor: base para saber se a estrutura mudou
  const [baseline, setBaseline] = useState<Routine>(routine);
  const [exercises, setExercises] = useState<SessionExercise[]>(() => buildSessionExercises(routine, performance));
  // Copia do que ja esta salvo, para saber se ha mudancas nao salvas
  const [clean, setClean] = useState<SessionExercise[]>(exercises);
  const [timerOn, setTimerOn] = useState(initialTimer);
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState<{ id: number; seconds: number } | null>(null);
  const [durationInput, setDurationInput] = useState('');
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [chartName, setChartName] = useState<string | null>(null);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [askUpdate, setAskUpdate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Treino ja gravado, mas o PUT da rotina falhou
  const [savedResult, setSavedResult] = useState<LogSessionResult | null>(null);

  useEffect(() => {
    if (!timerOn) return;
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [timerOn]);

  const registeredSets = countRegisteredSets(exercises);
  const structureChanged = hasStructureChange(baseline, exercises);
  const dirty = savedResult === null && sessionSignature(exercises) !== sessionSignature(clean);

  // Saida protegida: abrir a tela nao e comecar treino; so pergunta se algo mudou
  const allowLeave = useRef(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const blocker = useBlocker({
    shouldBlockFn: () => !allowLeave.current && dirtyRef.current,
    enableBeforeUnload: () => !allowLeave.current && dirtyRef.current,
    withResolver: true,
  });

  function leave(result: LogSessionResult | null) {
    allowLeave.current = true;
    if (result) {
      navigate({ to: '/workouts', state: { workoutResult: result } });
    } else {
      navigate({ to: '/workouts' });
    }
  }

  function toggleTimer() {
    // Ligar comeca do zero; desligar zera
    setSeconds(0);
    setRest(null);
    setTimerOn((on) => !on);
  }

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
    if (timerOn && !done) setRest({ id: Date.now(), seconds: restSeconds });
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

  function moveExercise(index: number, direction: -1 | 1) {
    setExercises((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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
      {
        key: uid(),
        name: picked.name,
        originalName: picked.existing ? picked.name : null,
        sets,
      },
    ]);
  }

  async function deleteExercise(ex: SessionExercise) {
    const name = ex.originalName;
    if (name === null) return;
    setDeletingKey(ex.key);
    setError(null);
    try {
      await workoutService.deleteExercise(name);
      // O servidor ja tirou o exercicio da rotina: a base e a copia salva acompanham
      const key = nameKey(name);
      removeExercise(ex.key);
      setClean((prev) => prev.filter((cur) => nameKey(cur.originalName ?? cur.name) !== key));
      setBaseline((prev) => removeFromRoutine(prev, name));
      await onCatalogChanged();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível apagar o exercício'));
    } finally {
      setDeletingKey(null);
    }
  }

  /**
   * Nomes alterados: renomeia antes de gravar (o histórico e as rotinas acompanham).
   * 409 interrompe; o que já foi renomeado fica marcado para não repetir.
   */
  async function applyRenames(): Promise<{ exercises: SessionExercise[]; routine: Routine }> {
    const renamed = new Map<string, string>();
    let plan = baseline;
    try {
      for (const ex of exercises) {
        const to = ex.name.trim();
        if (ex.originalName !== null && to !== '' && to !== ex.originalName) {
          await workoutService.renameExercise(ex.originalName, to);
          renamed.set(ex.key, to);
          plan = renameInRoutine(plan, ex.originalName, to);
        }
      }
    } finally {
      if (renamed.size > 0) {
        const withNewNames = (list: SessionExercise[]) =>
          list.map((cur) => {
            const to = renamed.get(cur.key);
            return to === undefined ? cur : { ...cur, originalName: to };
          });
        setExercises(withNewNames);
        setBaseline(plan);
      }
    }
    const synced = exercises.map((cur) => {
      const to = renamed.get(cur.key);
      return to === undefined ? cur : { ...cur, originalName: to };
    });
    return { exercises: synced, routine: plan };
  }

  function handleSaveClick() {
    setError(null);
    setNotice(null);
    if (structureChanged) {
      setAskUpdate(true);
      return;
    }
    void saveWorkout(false);
  }

  async function saveWorkout(updateRoutine: boolean) {
    setAskUpdate(false);
    setError(null);
    setNotice(null);
    const duration = timerOn ? Math.max(1, Math.round(seconds / 60)) : Number(durationInput);
    const durationMinutes = duration > 0 ? duration : undefined;
    if (buildLogInput({ routine: baseline, exercises, durationMinutes }).exercises.length === 0) {
      setError('Registre ao menos um exercício com uma série.');
      return;
    }
    setSaving(true);

    // 1. Renomeacoes (409 interrompe sem gravar nada)
    let synced: { exercises: SessionExercise[]; routine: Routine };
    try {
      synced = await applyRenames();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível renomear o exercício'));
      setSaving(false);
      return;
    }

    // 2. Registro do treino
    let result: LogSessionResult;
    try {
      result = await workoutService.logSession(
        buildLogInput({ routine: synced.routine, exercises: synced.exercises, durationMinutes }),
      );
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível registrar o treino'));
      setSaving(false);
      return;
    }

    // 3. Rotina, se o usuario escolheu atualizar
    if (updateRoutine) {
      try {
        await workoutService.updateRoutine(synced.routine.id, buildRoutineUpdate(synced.routine, synced.exercises));
      } catch {
        setSavedResult(result);
        setError('Treino de hoje registrado, mas os exercícios do treino não foram atualizados.');
        setSaving(false);
        return;
      }
    }

    leave(result);
  }

  /** Grava só a estrutura na rotina (sem registro). Cobre montar uma rotina sem treinar. */
  async function saveRoutineOnly() {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const synced = await applyRenames();
      const updated = await workoutService.updateRoutine(
        synced.routine.id,
        buildRoutineUpdate(synced.routine, synced.exercises),
      );
      if (savedResult) {
        leave(savedResult);
        return;
      }
      // Exercicio novo passa a existir no catalogo com o nome salvo
      const persisted = synced.exercises.map((cur) =>
        cur.originalName === null && cur.name.trim() !== '' ? { ...cur, originalName: cur.name.trim() } : cur,
      );
      setExercises((prev) =>
        prev.map((cur) => {
          const match = persisted.find((p) => p.key === cur.key);
          return match && cur.originalName === null ? { ...cur, originalName: match.originalName } : cur;
        }),
      );
      setBaseline(updated);
      setClean(persisted);
      setNotice('Exercícios do treino salvos.');
      await onCatalogChanged();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível salvar o treino'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen pb-36 text-ink">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-surface px-3 py-2">
        <div className="mx-auto max-w-md space-y-2 md:max-w-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => leave(savedResult)}
              className={squareBtn}
              aria-label="Voltar para os treinos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="min-w-0 flex-1 truncate font-pixel text-lg text-ink">{baseline.title}</h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setHeaderMenu((v) => !v)}
                aria-expanded={headerMenu}
                className={squareBtn}
                aria-label="Mais opções do treino"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {headerMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border-2 border-line bg-surface p-1.5 shadow-[0_4px_0_0_#0c0a08]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setHeaderMenu(false);
                      setSettingsOpen(true);
                    }}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-ink hover:bg-raised"
                  >
                    <Settings className="h-4 w-4 text-ink-dim" />
                    Editar treino
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={timerOn}
              onClick={toggleTimer}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border-2 px-2.5 text-xs font-semibold ${
                timerOn ? 'border-xp text-xp' : 'border-line text-ink-dim hover:border-ink-faint'
              } bg-raised`}
            >
              <span
                className={`relative h-5 w-9 rounded-full border-2 transition-colors ${
                  timerOn ? 'border-xp bg-xp/30' : 'border-line bg-surface'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
                    timerOn ? 'left-[18px] bg-xp' : 'left-0.5 bg-ink-faint'
                  }`}
                />
              </span>
              Cronômetro
            </button>

            {timerOn ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xp" aria-label="Tempo de treino">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-num text-base">{formatElapsed(seconds)}</span>
              </div>
            ) : (
              <label className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="shrink-0 text-xs text-ink-faint">Duração (min)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="estimada"
                  className={`${inputClass} min-w-0`}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2">
            {structureChanged && (
              <Button variant="secondary" onClick={() => void saveRoutineOnly()} disabled={saving}>
                <Save className="h-4 w-4" />
                <span>Salvar sem registrar</span>
              </Button>
            )}
            {savedResult === null && (
              <Button onClick={handleSaveClick} disabled={saving || registeredSets === 0}>
                <Check className="h-4 w-4" />
                <span>{saving ? 'Salvando...' : 'Salvar treino'}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-3 pt-3 md:max-w-2xl">
        {error && (
          <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
            {error}
          </p>
        )}
        {notice && !error && (
          <p role="status" className="rounded-lg border-2 border-action bg-surface p-3 text-sm text-action">
            {notice}
          </p>
        )}
        {savedResult && (
          <Card>
            <div className="space-y-2">
              <p className="text-sm text-ink-dim">
                O treino de hoje já foi registrado. Tente "Salvar sem registrar" de novo ou volte sem atualizar os exercícios do treino.
              </p>
              <Button variant="secondary" onClick={() => leave(savedResult)}>
                Ir para os treinos
              </Button>
            </div>
          </Card>
        )}

        {exercises.length === 0 && (
          <Card>
            <p className="text-sm text-ink-dim">
              Treino vazio. Adicione os exercícios abaixo e use "Salvar sem registrar" para montar sem treinar.
            </p>
          </Card>
        )}

        {exercises.map((exercise, exIndex) => {
          const last = findPerformance(performance, exercise.name);
          // Comparacao usa a ultima carga do catalogo, pelo nome com que o exercicio existe (nao o que esta sendo digitado)
          const catalogKey = nameKey(exercise.originalName ?? exercise.name);
          const lastSets = catalog.find((c) => nameKey(c.name) === catalogKey)?.lastSets ?? [];
          let workIndex = -1;
          return (
            <Card key={exercise.key}>
              <div className="space-y-1 border-b-2 border-line pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised font-num text-base text-ink-dim">
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
                  <ExerciseMenu
                    name={exercise.name}
                    index={exIndex}
                    count={exercises.length}
                    originalName={exercise.originalName}
                    deleting={deletingKey === exercise.key}
                    onMove={(direction) => moveExercise(exIndex, direction)}
                    onDelete={() => void deleteExercise(exercise)}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 text-xs text-ink-faint">
                    {last && last.sets.length > 0 ? (
                      <>
                        Última vez ({formatDate(last.date)}):{' '}
                        {last.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(' · ')}
                      </>
                    ) : (
                      'Primeira vez neste exercício'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise.key)}
                    className={iconBtn}
                    aria-label={`Remover ${exercise.name} do treino de hoje`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

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
                        <span className="w-6 shrink-0 text-center font-num text-base text-ink-dim">{setIdx + 1}</span>
                        <Select
                          className="flex-1"
                          tone="surface"
                          aria-label="Tipo da série"
                          value={set.technique}
                          onChange={(technique) => updateSet(exercise.key, set.key, { technique })}
                          options={SET_TECHNIQUES.map((t) => ({ value: t.value, label: t.label, badge: t.short }))}
                        />
                        <button
                          type="button"
                          onClick={() => removeSet(exercise.key, set.key)}
                          className={iconBtn}
                          aria-label="Remover série"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className={`grid items-end gap-2 ${timerOn ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-2'}`}>
                        <label className="relative block space-y-0.5">
                          <span className="text-xs text-ink-faint">Kg</span>
                          <SetNumberInput
                            decimal
                            value={set.weightKg}
                            onChange={(weightKg) => updateSet(exercise.key, set.key, { weightKg })}
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
                          <SetNumberInput
                            value={set.reps}
                            onChange={(reps) => updateSet(exercise.key, set.key, { reps })}
                            className={inputClass}
                          />
                        </label>
                        {timerOn && (
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

      {settingsOpen && (
        <RoutineSettingsSheet
          routine={baseline}
          onSaved={(updated) => {
            setBaseline(updated);
            setSettingsOpen(false);
            setNotice('Treino atualizado.');
          }}
          onDeleted={() => leave(null)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {askUpdate && (
        <ConfirmSheet
          title="Atualizar o treino com essas mudanças?"
          text="Os exercícios, a ordem e a quantidade de séries de hoje passam a valer nas próximas vezes."
          confirmLabel="Atualizar e salvar"
          cancelLabel="Só registrar hoje"
          onConfirm={() => void saveWorkout(true)}
          onCancel={() => void saveWorkout(false)}
          onDismiss={() => setAskUpdate(false)}
        />
      )}

      {blocker.status === 'blocked' && (
        <ConfirmSheet
          title="Descartar o treino de hoje?"
          text="As mudanças não salvas serão perdidas."
          confirmLabel="Descartar"
          cancelLabel="Continuar aqui"
          danger
          onConfirm={blocker.proceed}
          onCancel={blocker.reset}
          onDismiss={blocker.reset}
        />
      )}

      {rest && <RestTimerFloating key={rest.id} initialSeconds={rest.seconds} onClose={() => setRest(null)} />}
    </div>
  );
}

interface ConfirmSheetProps {
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Tocar fora: fecha sem escolher. */
  onDismiss: () => void;
}

function ConfirmSheet({ title, text, confirmLabel, cancelLabel, danger = false, onConfirm, onCancel, onDismiss }: ConfirmSheetProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 sm:items-center"
      onClick={onDismiss}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-t-xl border-2 border-line bg-surface p-4 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel text-lg text-ink">{title}</h2>
        <p className="text-sm text-ink-dim">{text}</p>
        <div className="grid gap-2">
          <Button
            variant={danger ? 'secondary' : 'primary'}
            className={danger ? '!border-danger/60 !text-danger' : ''}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
