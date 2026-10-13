import { useState } from 'react';
import { ArrowDown, ArrowUp, Eraser, LineChart, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExerciseDeleteConfirm } from './ExerciseDeleteConfirm';
import { ExerciseChartSheet } from './ExerciseChartSheet';
import { ExercisePicker, type PickedExercise } from './ExercisePicker';
import { toTechnique, uid } from './session';
import {
  EXERCISE_CATEGORIES,
  SET_TECHNIQUES,
  WEEK_DAYS,
  toCategory,
  type ExerciseCatalogItem,
  type ExerciseCategory,
  type Routine,
  type SetTechnique,
  type UpdateRoutineInput,
} from '../../types/workout';

interface EditableSet {
  key: string;
  weightKg: number;
  reps: number;
  technique: SetTechnique;
  restSeconds: number;
}

interface EditableExercise {
  key: string;
  name: string;
  /** Nome com que o exercício existe no catálogo; null = adicionado agora. */
  originalName: string | null;
  category: ExerciseCategory;
  sets: EditableSet[];
  notes: string;
}

interface RoutineEditorProps {
  routine: Routine;
  saving: boolean;
  catalog: ExerciseCatalogItem[];
  /** `renames` = exercícios com nome alterado; o chamador renomeia (histórico junto) antes do PUT. */
  onSave: (input: UpdateRoutineInput, renames: ExerciseRename[]) => void;
  /** Apaga o exercício e o histórico dele; lança erro se falhar. */
  onDeleteExercise: (name: string) => Promise<void>;
}

export interface ExerciseRename {
  from: string;
  to: string;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wider text-ink-dim';
const fieldClass =
  'h-11 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none';
const numberClass =
  'h-11 w-full rounded-lg border-2 border-line bg-raised text-center font-pixel text-base text-ink focus:border-action focus:outline-none';
const iconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-30';
const SET_GRID = 'grid grid-cols-[1.25rem_minmax(0,1fr)_4rem_4rem_2.75rem] items-center gap-1.5';

function toEditable(routine: Routine): EditableExercise[] {
  return routine.exercises.map((ex) => ({
    key: uid(),
    name: ex.name,
    originalName: ex.name,
    category: toCategory(ex.category),
    notes: ex.notes ?? '',
    sets: ex.sets.map((s) => ({
      key: uid(),
      weightKg: s.weightKg,
      reps: s.reps,
      technique: s.technique,
      restSeconds: s.restSeconds,
    })),
  }));
}

/** Edita o que a rotina prescreve (exercícios, séries-alvo, dias, intensidade). O que foi feito vai para o histórico. */
export function RoutineEditor({ routine, saving, catalog, onSave, onDeleteExercise }: RoutineEditorProps) {
  const [chartName, setChartName] = useState<string | null>(null);
  const [title, setTitle] = useState(routine.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(routine.estimatedMinutes);
  const [days, setDays] = useState<number[]>(routine.scheduledDays);
  const [exercises, setExercises] = useState<EditableExercise[]>(() => toEditable(routine));
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function patchExercise(key: string, change: (ex: EditableExercise) => EditableExercise) {
    setExercises((prev) => prev.map((ex) => (ex.key === key ? change(ex) : ex)));
  }

  function patchSet(exKey: string, setKey: string, patch: Partial<EditableSet>) {
    patchExercise(exKey, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)),
    }));
  }

  function move(index: number, delta: -1 | 1) {
    setExercises((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /** Exercício existente entra com a última carga como série-alvo; nome novo entra com uma série vazia. */
  function addExercise(picked: PickedExercise) {
    const sets: EditableSet[] =
      picked.lastSets.length > 0
        ? picked.lastSets.map((s) => ({
            key: uid(),
            weightKg: s.weightKg,
            reps: s.reps,
            technique: toTechnique(s.technique),
            restSeconds: s.restSeconds ?? 90,
          }))
        : [{ key: uid(), weightKg: 0, reps: 10, technique: 'normal', restSeconds: 90 }];
    setExercises((prev) => [
      ...prev,
      {
        key: uid(),
        name: picked.name,
        originalName: picked.existing ? picked.name : null,
        category: picked.category ?? 'Peito',
        notes: '',
        sets,
      },
    ]);
  }

  async function deleteExercise(ex: EditableExercise) {
    if (ex.originalName === null) return;
    setDeletingKey(ex.key);
    setDeleteError(null);
    try {
      await onDeleteExercise(ex.originalName);
      setExercises((prev) => prev.filter((cur) => cur.key !== ex.key));
      setConfirmingKey(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Não foi possível apagar o exercício');
    } finally {
      setDeletingKey(null);
    }
  }

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSave() {
    const renames = exercises.flatMap((ex) =>
      ex.originalName !== null && ex.name.trim() !== '' && ex.name.trim() !== ex.originalName
        ? [{ from: ex.originalName, to: ex.name.trim() }]
        : [],
    );
    onSave(
      {
      title: title.trim() || routine.title,
      description: routine.description,
      completionCount: routine.completionCount,
      estimatedMinutes: Math.max(1, Math.round(estimatedMinutes) || 45),
      intensity: routine.intensity,
      scheduledDays: [...days].sort(),
      targetMuscleGroups: routine.targetMuscleGroups,
      exercises: exercises
        .filter((ex) => ex.name.trim() !== '')
        .map((ex) => ({
          name: ex.name.trim(),
          category: ex.category,
          ...(ex.notes.trim() ? { notes: ex.notes.trim() } : {}),
          sets: ex.sets.map((s, idx) => ({
            setNumber: idx + 1,
            weightKg: s.weightKg,
            reps: s.reps,
            technique: s.technique,
            restSeconds: s.restSeconds,
          })),
        })),
      },
      renames,
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className={labelClass}>Nome da rotina</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </label>
          <label className="block space-y-1">
            <span className={labelClass}>Duração (min)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className={numberClass}
            />
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
        </div>
      </Card>

      {exercises.map((ex, idx) => (
        <Card key={ex.key}>
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised font-pixel text-base text-ink-dim">
                {idx + 1}
              </span>
              <input
                value={ex.name}
                onChange={(e) => patchExercise(ex.key, (cur) => ({ ...cur, name: e.target.value }))}
                className={`${fieldClass} min-w-0 flex-1`}
                aria-label="Nome do exercício"
              />
              <button
                type="button"
                onClick={() => setChartName(ex.originalName ?? ex.name.trim())}
                disabled={ex.originalName === null && ex.name.trim() === ''}
                className={`${iconBtn} hover:text-action disabled:opacity-40`}
                aria-label={`Ver evolução de ${ex.name}`}
              >
                <LineChart className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className={iconBtn}
                aria-label="Subir exercício"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === exercises.length - 1}
                className={iconBtn}
                aria-label="Descer exercício"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setExercises((prev) => prev.filter((cur) => cur.key !== ex.key))}
                className={`${iconBtn} hover:text-danger`}
                aria-label="Remover da rotina (o histórico fica)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <select
              value={ex.category}
              onChange={(e) => {
                const picked = EXERCISE_CATEGORIES.find((c) => c === e.target.value);
                if (picked) patchExercise(ex.key, (cur) => ({ ...cur, category: picked }));
              }}
              className={fieldClass}
              aria-label="Categoria"
            >
              {EXERCISE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {ex.originalName !== null &&
              (confirmingKey === ex.key ? (
                <ExerciseDeleteConfirm
                  name={ex.originalName}
                  busy={deletingKey === ex.key}
                  onConfirm={() => void deleteExercise(ex)}
                  onCancel={() => setConfirmingKey(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmingKey(ex.key);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-xs font-medium text-ink-faint hover:text-danger"
                >
                  <Eraser className="h-4 w-4" />
                  Apagar exercício e histórico
                </button>
              ))}

            <div className="space-y-2">
              <div className={`${SET_GRID} text-center text-xs uppercase tracking-wider text-ink-faint`}>
                <span>#</span>
                <span>Tipo</span>
                <span>Kg alvo</span>
                <span>Reps</span>
                <span />
              </div>
              {ex.sets.map((s, sIdx) => (
                <div key={s.key} className={SET_GRID}>
                  <span className="text-center font-pixel text-base text-ink-dim">{sIdx + 1}</span>
                  <select
                    value={s.technique}
                    onChange={(e) => {
                      const picked = SET_TECHNIQUES.find((t) => t.value === e.target.value);
                      if (picked) patchSet(ex.key, s.key, { technique: picked.value });
                    }}
                    className="h-11 min-w-0 rounded-lg border-2 border-line bg-raised px-1 text-base text-ink focus:border-action focus:outline-none"
                    aria-label="Tipo da série"
                  >
                    {SET_TECHNIQUES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={s.weightKg}
                    onChange={(e) => patchSet(ex.key, s.key, { weightKg: Math.max(0, Number(e.target.value)) })}
                    className={numberClass}
                    aria-label="Carga alvo em kg"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={s.reps}
                    onChange={(e) =>
                      patchSet(ex.key, s.key, { reps: Math.max(0, Math.round(Number(e.target.value))) })
                    }
                    className={numberClass}
                    aria-label="Repetições alvo"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchExercise(ex.key, (cur) => ({ ...cur, sets: cur.sets.filter((x) => x.key !== s.key) }))
                    }
                    className={`${iconBtn} hover:text-danger`}
                    aria-label="Remover série"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() =>
                  patchExercise(ex.key, (cur) => {
                    const last = cur.sets[cur.sets.length - 1];
                    return {
                      ...cur,
                      sets: [
                        ...cur.sets,
                        {
                          key: uid(),
                          weightKg: last?.weightKg ?? 0,
                          reps: last?.reps ?? 10,
                          technique: 'normal',
                          restSeconds: last?.restSeconds ?? 90,
                        },
                      ],
                    };
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Adicionar série
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {deleteError && (
        <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
          {deleteError}
        </p>
      )}

      <div className="rounded-lg border-2 border-dashed border-line p-3">
        <ExercisePicker catalog={catalog} onPick={addExercise} />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? 'Salvando...' : 'Salvar rotina'}
      </Button>

      {chartName && <ExerciseChartSheet name={chartName} onClose={() => setChartName(null)} />}
    </div>
  );
}
