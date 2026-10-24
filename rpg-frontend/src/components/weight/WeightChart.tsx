import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WeightEntry } from '@/src/types/weight';
import { formatKg } from '@/src/lib/weight';

/** Fonte dos números no SVG do gráfico; mesmo ajuste de tamanho da classe .font-num (index.css). */
const numFontStyle = { fontFamily: 'var(--font-num)', fontSizeAdjust: 'cap-height 0.67' };

/** 'YYYY-MM-DD' -> ms (UTC ao meio-dia): o eixo X é o calendário real, sem fuso do navegador. */
export const toTs = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12);
};
const pad = (n: number) => String(n).padStart(2, '0');
const tsShort = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
};
const tsLong = (ts: number) => `${tsShort(ts)}/${new Date(ts).getUTCFullYear()}`;

interface WeightChartProps {
  entries: WeightEntry[];
  /** Início e fim do eixo X ('YYYY-MM-DD'). */
  from: string;
  to: string;
  targetKg: number | null;
}

/** Um ponto por pesagem + linha da média móvel de 7 dias (só onde há 3+ pesagens na janela) + meta pontilhada. */
export function WeightChart({ entries, from, to, targetKg }: WeightChartProps) {
  const data = entries.map((e) => ({ ts: toTs(e.date), weightKg: e.weightKg, trendKg: e.trendKg }));
  const values = entries.map((e) => e.weightKg);
  if (targetKg !== null) values.push(targetKg);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const hasTrend = entries.some((e) => e.trendKg !== null);

  return (
    <div className="space-y-1">
      <div className="h-56 w-full" role="img" aria-label="Gráfico do peso ao longo do tempo">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={[toTs(from), toTs(to)]}
              tickFormatter={tsShort}
              stroke="var(--color-line)"
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 12, style: numFontStyle }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              width={40}
              domain={[min, max]}
              allowDecimals={false}
              stroke="var(--color-line)"
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 12, style: numFontStyle }}
              tickLine={false}
              axisLine={false}
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
              labelFormatter={(label) => tsLong(Number(label))}
              formatter={(value, name) => [formatKg(Number(value)), name === 'trendKg' ? 'Tendência' : 'Peso']}
            />
            {targetKg !== null && (
              <ReferenceLine y={targetKg} stroke="var(--color-coin)" strokeDasharray="6 4" strokeWidth={2} ifOverflow="extendDomain" />
            )}
            {hasTrend && (
              <Line
                type="monotone"
                dataKey="trendKg"
                stroke="var(--color-kcal)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
            <Line
              dataKey="weightKg"
              stroke="transparent"
              dot={{ r: 4, fill: 'var(--color-action)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--color-action)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-action" />Pesagem</span>
        {hasTrend && <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-kcal" />Média de 7 dias</span>}
        {targetKg !== null && <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-coin" />Meta</span>}
      </p>
    </div>
  );
}
