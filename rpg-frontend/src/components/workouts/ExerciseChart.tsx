import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { workoutService } from '../../services/workout.service';
import { errorMessage } from '../../services/http';
import type { Progression } from '../../types/workout';
import {
  METRICS,
  PERIODS,
  buildSeries,
  type ProgressionMetric,
  type ProgressionPeriod,
} from './progression-series';

const formatDate = (iso: string) => iso.split('-').reverse().join('/');
const formatShort = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');
const formatValue = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
/** "30 kg × 10" quando a métrica traz as repetições (carga máxima); senão só "30 kg". */
const formatPoint = (value: number, reps?: number) =>
  reps ? `${formatValue(value)} kg × ${reps}` : `${formatValue(value)} kg`;
/** Fonte dos números no SVG do gráfico; mesmo ajuste de tamanho da classe .font-num (index.css). */
const numFontStyle = { fontFamily: 'var(--font-num)', fontSizeAdjust: 'cap-height 0.67' };

const chipClass = (active: boolean) =>
  `min-h-[44px] flex-1 rounded-lg border-2 px-2 text-xs font-semibold transition-colors ${
    active ? 'border-action bg-raised text-action' : 'border-line bg-surface text-ink-dim hover:border-ink-faint'
  }`;

/** Gráfico de evolução de um exercício: alterna a métrica e o período; um ponto por dia (o melhor). */
export function ExerciseChart({ name }: { name: string }) {
  const [progression, setProgression] = useState<Progression | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [metric, setMetric] = useState<ProgressionMetric>('maxWeight');
  const [period, setPeriod] = useState<ProgressionPeriod>('all');

  useEffect(() => {
    let cancelled = false;
    setProgression(null);
    setFailed(null);
    workoutService
      .progression(name)
      .then((p) => {
        if (!cancelled) setProgression(p);
      })
      .catch((err) => {
        if (!cancelled) setFailed(errorMessage(err instanceof Error ? err : null, 'Não foi possível carregar a evolução.'));
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  const series = useMemo(
    () => (progression ? buildSeries(progression.history, metric, period) : []),
    [progression, metric, period],
  );

  if (failed) {
    return (
      <p role="alert" className="text-sm text-danger">
        {failed}
      </p>
    );
  }
  if (!progression) return <p className="text-sm text-ink-dim">Carregando evolução...</p>;
  if (progression.history.length === 0) {
    return (
      <p className="text-sm text-ink-dim">
        Ainda sem treinos registrados deste exercício. Registre um para ver a evolução.
      </p>
    );
  }

  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? '';
  const repsByDate = new Map(series.map((p) => [p.date, p.reps]));
  const bestMaxWeightKg = progression.history.reduce((best, h) => Math.max(best, h.maxWeightKg), 0);
  const first = series[0];
  const last = series[series.length - 1];
  const delta = series.length > 1 ? Math.round((last.value - first.value) * 100) / 100 : null;

  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-ink-faint">Maior carga</span>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-num text-4xl text-action">{formatValue(bestMaxWeightKg)} kg</span>
          <span className="text-xs text-ink-faint">{progression.totalSessions} treinos</span>
        </div>
      </div>

      <div className="flex gap-2" role="group" aria-label="Métrica do gráfico">
        {METRICS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMetric(m.value)}
            aria-pressed={metric === m.value}
            className={chipClass(metric === m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            aria-pressed={period === p.value}
            className={chipClass(period === p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {series.length === 0 ? (
        <p className="text-sm text-ink-dim">Nenhum treino neste período. Escolha um período maior.</p>
      ) : (
        <>
          <p className="text-sm text-ink-dim">
            {delta === null
              ? `Só um treino até agora (${formatDate(last.date)}): ${formatPoint(last.value, last.reps)}.`
              : delta === 0
                ? `${metricLabel} igual ao início do período.`
                : `${metricLabel} ${delta > 0 ? 'subiu' : 'caiu'} ${formatValue(Math.abs(delta))} kg no período.`}
          </p>
          <div className="h-52 w-full" role="img" aria-label={`Gráfico de ${metricLabel} de ${name}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShort}
                  stroke="var(--color-line)"
                  tick={{ fill: 'var(--color-ink-faint)', fontSize: 12, style: numFontStyle }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  width={44}
                  stroke="var(--color-line)"
                  tick={{ fill: 'var(--color-ink-faint)', fontSize: 12, style: numFontStyle }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={formatValue}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--color-ink-faint)' }}
                  contentStyle={{
                    background: 'var(--color-raised)',
                    border: '2px solid var(--color-line)',
                    borderRadius: 8,
                    color: 'var(--color-ink)',
                    fontSize: 12,
                    ...numFontStyle,
                  }}
                  labelStyle={{ color: 'var(--color-ink-dim)' }}
                  itemStyle={{ color: 'var(--color-ink)' }}
                  labelFormatter={(label) => formatDate(String(label))}
                  formatter={(value, _name, item) => [
                    formatPoint(Number(value), repsByDate.get(String(item.payload?.date))),
                    metricLabel,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-action)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-action)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--color-action)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <details className="text-xs text-ink-faint">
            <summary className="flex min-h-[44px] cursor-pointer items-center">Ver valores em lista</summary>
            <ul className="space-y-1 pb-1">
              {[...series].reverse().map((p) => (
                <li key={p.date} className="flex justify-between gap-2">
                  <span>{formatDate(p.date)}</span>
                  <span className="font-num text-base text-ink-dim">{formatPoint(p.value, p.reps)}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
