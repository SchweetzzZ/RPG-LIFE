import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { WorkoutScreen } from '../components/workouts/WorkoutScreen';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useResource } from '../hooks/useResource';
import { workoutService } from '../services/workout.service';
import type { ExerciseCatalogItem, ExercisePerformance, Routine } from '../types/workout';

interface WorkoutSearch {
  /** 1 = abre com o cronômetro ligado ("Com cronômetro" no card). */
  timer?: 1;
}

export const Route = createFileRoute('/workouts/$id')({
  validateSearch: (search: { timer?: number | string }): WorkoutSearch =>
    search.timer === 1 || search.timer === '1' ? { timer: 1 } : {},
  component: WorkoutRouteComponent,
});

interface WorkoutDetail {
  routine: Routine;
  performance: ExercisePerformance[];
  catalog: ExerciseCatalogItem[];
}

function WorkoutRouteComponent() {
  const { id } = Route.useParams();
  const { timer } = Route.useSearch();
  const { data, loading, error, reload } = useResource<WorkoutDetail>(async () => {
    const [routine, performance, catalog] = await Promise.all([
      workoutService.getRoutine(id),
      workoutService.lastPerformance(),
      workoutService.listExercises(),
    ]);
    return { routine, performance, catalog };
  });

  if (data) {
    return (
      <WorkoutScreen
        key={data.routine.id}
        routine={data.routine}
        performance={data.performance}
        catalog={data.catalog}
        onCatalogChanged={reload}
        initialTimer={timer === 1}
      />
    );
  }

  return (
    <main className="min-h-screen bg-bg px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <Link
          to="/workouts"
          className="inline-flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-medium text-ink-dim hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Treinos
        </Link>
        {loading && <LoadingBlock label="Carregando rotina..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}
      </div>
    </main>
  );
}
