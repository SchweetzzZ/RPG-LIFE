import type { WorkoutLog } from '../../types/workout';

const formatDate = (iso: string) => iso.split('-').reverse().join('/');

export function HistoryList({ logs }: { logs: WorkoutLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-ink-dim">Nenhum treino registrado ainda.</p>;
  }
  return (
    <ul className="space-y-2">
      {logs.slice(0, 30).map((log) => (
        <li key={log.id} className="rounded-lg border-2 border-line bg-raised p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{log.routineName}</span>
            <span className="shrink-0 font-num text-base text-ink-dim">{formatDate(log.date)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {log.exercises.length} exercícios · {log.totalSets} séries · {Math.round(log.totalVolumeKg)} kg ·{' '}
            {log.durationMinutes} min · {log.caloriesBurned} kcal
            {log.coinsGained > 0 && <span className="text-coin"> · +{log.coinsGained} moedas</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
