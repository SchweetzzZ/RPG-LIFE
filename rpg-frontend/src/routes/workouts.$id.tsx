import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, NotebookPen, Play, Trash2 } from 'lucide-react';
import { RoutineEditor, type ExerciseRename } from '../components/workouts/RoutineEditor';
import { WorkoutSession } from '../components/workouts/WorkoutSession';
import { SessionResultBanner } from '../components/workouts/SessionResultBanner';
import { Button } from '../components/ui/Button';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useResource } from '../hooks/useResource';
import { workoutService } from '../services/workout.service';
import { errorMessage } from '../services/http';
import type { ExerciseCatalogItem, ExercisePerformance, LogSessionResult, Routine, UpdateRoutineInput } from '../types/workout';

export const Route = createFileRoute('/workouts/$id')({
  component: RoutineDetailComponent,
});

interface RoutineDetail {
  routine: Routine;
  performance: ExercisePerformance[];
  catalog: ExerciseCatalogItem[];
}

function RoutineDetailComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<RoutineDetail>(async () => {
    const [routine, performance, catalog] = await Promise.all([
      workoutService.getRoutine(id),
      workoutService.lastPerformance(),
      workoutService.listExercises(),
    ]);
    return { routine, performance, catalog };
  });
  const [session, setSession] = useState<{ withTimer: boolean } | null>(null);
  const [result, setResult] = useState<LogSessionResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Muda quando renomeações parciais exigem recarregar o editor com os nomes do servidor.
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSave(input: UpdateRoutineInput, renames: ExerciseRename[]) {
    setSaving(true);
    setSaved(false);
    setActionError(null);
    let renamed = 0;
    try {
      // Renomeia antes do PUT: o histórico acompanha o nome; se bater (409), nada é salvo.
      for (const r of renames) {
        await workoutService.renameExercise(r.from, r.to);
        renamed += 1;
      }
      await workoutService.updateRoutine(id, input);
      await reload();
      setSaved(true);
    } catch (err) {
      const message = errorMessage(err instanceof Error ? err : null, 'Não foi possível salvar a rotina');
      if (renamed > 0) {
        // Parte dos nomes já mudou no servidor: recarrega para o editor refletir isso.
        setActionError(`${message}. ${renamed} exercício(s) já foram renomeados; confira os nomes e salve de novo.`);
        setEditorEpoch((n) => n + 1);
        await reload();
      } else {
        setActionError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remover esta rotina? O histórico de treinos é mantido.')) return;
    setActionError(null);
    try {
      await workoutService.deleteRoutine(id);
      navigate({ to: '/workouts' });
    } catch (err) {
      setActionError(errorMessage(err instanceof Error ? err : null, 'Não foi possível remover a rotina'));
    }
  }

  async function handleDeleteExercise(name: string) {
    await workoutService.deleteExercise(name);
    await reload();
  }

  async function handleLogged(logged: LogSessionResult) {
    setSession(null);
    setResult(logged);
    await reload();
  }

  return (
    <main className="min-h-screen bg-bg px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <header className="flex items-center justify-between gap-3">
          <Link
            to="/workouts"
            className="inline-flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-medium text-ink-dim hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Treinos
          </Link>
          {data && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-dim hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
              Remover rotina
            </button>
          )}
        </header>

        {result && <SessionResultBanner result={result} onClose={() => setResult(null)} />}
        {loading && !data && <LoadingBlock label="Carregando rotina..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}
        {actionError && (
          <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
            {actionError}
          </p>
        )}
        {saved && !actionError && (
          <p role="status" className="rounded-lg border-2 border-action bg-surface p-3 text-sm text-action">
            Rotina salva.
          </p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setSession({ withTimer: false })}>
                <NotebookPen className="h-4 w-4" />
                Registrar cargas
              </Button>
              <Button variant="secondary" onClick={() => setSession({ withTimer: true })}>
                <Play className="h-4 w-4" />
                Com cronômetro
              </Button>
            </div>

            <RoutineEditor
              key={`${data.routine.updatedAt ?? data.routine.id}-${editorEpoch}`}
              routine={data.routine}
              saving={saving}
              catalog={data.catalog}
              onSave={(input, renames) => void handleSave(input, renames)}
              onDeleteExercise={handleDeleteExercise}
            />
          </>
        )}
      </div>

      {session && data && (
        <WorkoutSession
          routine={data.routine}
          performance={data.performance}
          catalog={data.catalog}
          onCatalogChanged={reload}
          withTimer={session.withTimer}
          onSaved={(logged) => void handleLogged(logged)}
          onCancel={() => setSession(null)}
        />
      )}
    </main>
  );
}
