import { useState } from 'react';
import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router';
import { Dumbbell, Plus, History, NotebookPen } from 'lucide-react';
import { RoutineCard } from '../components/workouts/RoutineCard';
import { PickRoutineSheet } from '../components/workouts/PickRoutineSheet';
import { SessionResultBanner } from '../components/workouts/SessionResultBanner';
import { ProgressionCard } from '../components/workouts/ProgressionCard';
import { ExerciseHistoryView } from '../components/workouts/ExerciseHistoryView';
import { HistoryList } from '../components/workouts/HistoryList';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/layout/PageHeader';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useWorkoutsData } from '../hooks/useWorkoutsData';
import { workoutService } from '../services/workout.service';
import { errorMessage } from '../services/http';

export const Route = createFileRoute('/workouts/')({
  component: WorkoutsRouteComponent,
});

const HISTORY_VIEWS: { value: 'exercise' | 'workout'; label: string }[] = [
  { value: 'exercise', label: 'Por exercício' },
  { value: 'workout', label: 'Por treino' },
];

function WorkoutsRouteComponent() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWorkoutsData();
  // Resultado do treino salvo, vindo da tela da rotina pelo estado da navegacao
  const result = useRouterState({ select: (s) => s.location.state.workoutResult });
  const [picking, setPicking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyView, setHistoryView] = useState<'exercise' | 'workout'>('workout');
  const [newTitle, setNewTitle] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const today = new Date().getDay();

  async function handleCreate() {
    const title = newTitle?.trim();
    if (!title) return;
    setCreating(true);
    setActionError(null);
    try {
      const routine = await workoutService.createRoutine({
        title,
        description: '',
        estimatedMinutes: 45,
        scheduledDays: [],
        intensity: 'moderate',
        exercises: [],
        completionCount: 0,
      });
      navigate({ to: '/workouts/$id', params: { id: routine.id } });
    } catch (err) {
      setActionError(errorMessage(err instanceof Error ? err : null, 'Não foi possível criar o treino'));
      setCreating(false);
    }
  }

  function closeResult() {
    navigate({ to: '/workouts', replace: true, state: {} });
  }

  return (
    <main className="min-h-screen px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3 md:max-w-3xl">
        {result && <SessionResultBanner result={result} onClose={closeResult} />}

        <PageHeader title="Treino" icon={Dumbbell} />

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setShowHistory((v) => !v)} aria-pressed={showHistory}>
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPicking(true)}
            disabled={!data}
          >
            <NotebookPen className="h-4 w-4" />
            <span>Registrar exercício</span>
          </Button>
          <Button
            variant="secondary"
            className="col-span-2"
            onClick={() => setNewTitle((t) => (t === null ? '' : null))}
          >
            <Plus className="h-4 w-4" />
            <span>Novo treino</span>
          </Button>
        </div>

        {newTitle !== null && (
          <Card label="Novo treino">
            <div className="flex gap-2">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
                aria-label="Nome do treino"
                placeholder="Ex.: Peito, Costas e bíceps, Treino A"
                className="h-11 min-w-0 flex-1 rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none"
              />
              <Button
                className="!w-auto"
                onClick={() => void handleCreate()}
                disabled={creating || !newTitle.trim()}
              >
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </Card>
        )}

        {actionError && (
          <p role="alert" className="rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger">
            {actionError}
          </p>
        )}

        {loading && !data && <LoadingBlock label="Carregando treinos..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && showHistory && (
          <Card label="Histórico">
            <div className="space-y-3">
              <div className="flex gap-2" role="group" aria-label="Visão do histórico">
                {HISTORY_VIEWS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setHistoryView(v.value)}
                    aria-pressed={historyView === v.value}
                    className={`min-h-[44px] flex-1 rounded-lg border-2 px-2 text-xs font-semibold transition-colors ${
                      historyView === v.value
                        ? 'border-action bg-raised text-action'
                        : 'border-line bg-surface text-ink-dim hover:border-ink-faint'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {historyView === 'workout' ? (
                <HistoryList logs={data.logs} />
              ) : (
                <ExerciseHistoryView catalog={data.catalog} />
              )}
            </div>
          </Card>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between px-1 text-xs">
              <h2 className="font-pixel text-[13px] uppercase text-ink-dim">Seus treinos</h2>
              <span className="text-ink-faint">{data.routines.length} {data.routines.length === 1 ? 'cadastrado' : 'cadastrados'}</span>
            </div>

            {data.routines.length === 0 ? (
              <Card>
                <p className="text-sm text-ink-dim">
                  Nenhum treino ainda. Crie um em "Novo treino" e monte os exercícios dele.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.routines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    isToday={routine.scheduledDays.includes(today)}
                  />
                ))}
              </div>
            )}

            <ProgressionCard performance={data.performance} />
          </>
        )}
      </div>

      {picking && data && (
        <PickRoutineSheet routines={data.routines} today={today} onClose={() => setPicking(false)} />
      )}
    </main>
  );
}
