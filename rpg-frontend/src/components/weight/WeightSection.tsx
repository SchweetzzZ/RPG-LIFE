import { useEffect, useState } from 'react';
import { Flag, Pencil, Scale, Trash2 } from 'lucide-react';
import type { WeightData, WeightEntry } from '@/src/types/weight';
import { weightService } from '@/src/services/weight.service';
import { profileService } from '@/src/services/profile.service';
import { errorMessage } from '@/src/services/http';
import { useResource } from '@/src/hooks/useResource';
import { addDays } from '@/src/lib/day';
import { formatDay } from '@/src/lib/format';
import { deltaTone, formatDeltaKg, formatKg, targetConflict } from '@/src/lib/weight';
import { Card } from '../ui/Card';
import { ErrorBlock } from '../common/StateBlocks';
import { WeightChart } from './WeightChart';
import { WeightInput } from './WeightInput';
import { TargetProgress } from './TargetProgress';
import { TargetConflictNote } from './TargetConflictNote';
import { TargetReachedModal } from './TargetReachedModal';

type Period = '1m' | '3m' | 'all';
const PERIODS: { value: Period; label: string; days: number | null }[] = [
  { value: '1m', label: '1 mês', days: 30 },
  { value: '3m', label: '3 meses', days: 90 },
  { value: 'all', label: 'Tudo', days: null },
];

const chipClass = (active: boolean) =>
  `min-h-[44px] flex-1 rounded-lg border-2 px-2 text-xs font-semibold transition-colors ${
    active ? 'border-action bg-raised text-action' : 'border-line bg-surface text-ink-dim hover:border-ink-faint'
  }`;

interface WeightSectionProps {
  /** Muda quando o formulário do perfil grava um peso: a seção relê o diário. */
  version: number;
  /** Depois de registrar/apagar/mudar a meta: o perfil (peso e metas) pode ter mudado. */
  onProfileChanged: () => Promise<void>;
}

/** Perfil, seção Peso: resumo, peso-meta, gráfico com média móvel, registro e lista das pesagens. */
export function WeightSection({ version, onProfileChanged }: WeightSectionProps) {
  const { data, loading, error, reload } = useResource(() => weightService.getWeight());

  useEffect(() => {
    if (version > 0) void reload();
  }, [version, reload]);

  const afterChange = async () => {
    await Promise.all([reload(), onProfileChanged()]);
  };

  return (
    <div id="peso" className="scroll-mt-3">
      <Card label="Peso" icon={Scale}>
        {loading && !data && <p className="text-sm text-ink-dim">Carregando o diário de peso...</p>}
        {error && <ErrorBlock message={error} onRetry={reload} />}
        {data && <WeightBody data={data} onChanged={afterChange} />}
      </Card>
    </div>
  );
}

function WeightBody({ data, onChanged }: { data: WeightData; onChanged: () => Promise<void> }) {
  const { entries, summary } = data;
  const { today } = summary;
  const [period, setPeriod] = useState<Period>('1m');
  // Dia sendo registrado/editado no formulário (hoje por padrão)
  const [date, setDate] = useState(today);
  const editingEntry = entries.find((e) => e.date === date) ?? null;
  // Editor do peso-meta aberto (aqui para o "Definir nova meta" da comemoração abrir direto)
  const [editingTarget, setEditingTarget] = useState(false);
  const [reached, setReached] = useState<{ targetKg: number; previousCalories: number | null } | null>(null);

  const save = async (weightKg: number) => {
    const result = await weightService.putWeight(date, weightKg);
    setDate(today);
    if (result.targetJustReached && summary.targetWeightKg !== null) {
      setReached({ targetKg: summary.targetWeightKg, previousCalories: result.targetCalories });
    }
    await onChanged();
  };

  const edit = (entryDate: string) => {
    setDate(entryDate);
    document.getElementById('peso-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const days = PERIODS.find((p) => p.value === period)?.days ?? null;
  const from = days === null ? summary.startDate ?? today : addDays(today, -days);
  const visible = entries.filter((e) => e.date >= from);

  return (
    <div className="space-y-4">
      <SummaryBlock data={data} />
      <TargetBlock data={data} editing={editingTarget} setEditing={setEditingTarget} onChanged={onChanged} />

      <div id="peso-form" className="scroll-mt-20 space-y-2 rounded-lg border-2 border-line bg-raised/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{editingEntry ? 'Corrigir pesagem' : 'Registrar pesagem'}</span>
          <label className="flex items-center gap-2 text-xs text-ink-dim">
            Dia
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value && e.target.value <= today ? e.target.value : today)}
              className="h-9 rounded-lg border-2 border-line bg-raised px-2 text-sm text-ink focus:border-action focus:outline-none"
            />
          </label>
        </div>
        <WeightInput
          key={date}
          initialKg={editingEntry?.weightKg ?? null}
          onSubmit={save}
          onCancel={date !== today ? () => setDate(today) : undefined}
          submitLabel={editingEntry ? 'Corrigir' : 'Salvar'}
        />
        <p className="text-xs text-ink-faint">Um peso por dia: registrar de novo no mesmo dia substitui. Não precisa ser todo dia.</p>
      </div>

      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2" role="group" aria-label="Período do gráfico">
            {PERIODS.map((p) => (
              <button key={p.value} type="button" onClick={() => setPeriod(p.value)} aria-pressed={period === p.value} className={chipClass(period === p.value)}>
                {p.label}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="text-sm text-ink-dim">Nenhuma pesagem neste período. Escolha um período maior.</p>
          ) : (
            <WeightChart entries={visible} from={from} to={today} targetKg={summary.targetWeightKg} />
          )}
          <EntryList entries={entries} onEdit={edit} onChanged={onChanged} goal={summary.primaryGoal} />
        </div>
      )}

      {reached && (
        <TargetReachedModal
          targetKg={reached.targetKg}
          goal={summary.primaryGoal}
          previousCalories={reached.previousCalories}
          onClose={(goalChanged) => {
            setReached(null);
            if (goalChanged) void onChanged();
          }}
          onNewTarget={() => {
            setReached(null);
            setEditingTarget(true);
            document.getElementById('peso')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </div>
  );
}

function SummaryBlock({ data }: { data: WeightData }) {
  const { summary } = data;
  const { startKg, currentKg, totalChangeKg, weekChangeKg, primaryGoal, count, startDate, loggedToday } = summary;

  if (currentKg === null) {
    return <p className="text-sm text-ink-dim">Nenhuma pesagem ainda. Anote seu peso nos dias em que se pesar: o último peso atualiza o perfil e as metas de kcal e macros.</p>;
  }
  if (count === 1 || startKg === null || totalChangeKg === null) {
    return (
      <p className="text-sm text-ink">
        Primeira pesagem: <span className="whitespace-nowrap font-num text-lg">{formatKg(currentKg)}</span>
        {startDate && <span className="text-ink-faint"> · {formatDay(startDate)}</span>}
      </p>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-sm text-ink-dim">
        Começou com <span className="whitespace-nowrap font-num text-lg text-ink">{formatKg(startKg)}</span> · {loggedToday ? 'hoje' : 'atual'}{' '}
        <span className="whitespace-nowrap font-num text-lg text-ink">{formatKg(currentKg)}</span> ·{' '}
        <span className={`whitespace-nowrap font-num text-lg ${deltaTone(totalChangeKg, primaryGoal)}`}>{formatDeltaKg(totalChangeKg)}</span>
      </p>
      {weekChangeKg !== null && (
        <p className="text-sm text-ink-dim">
          Últimos 7 dias: <span className={`whitespace-nowrap font-num text-lg ${deltaTone(weekChangeKg, primaryGoal)}`}>{formatDeltaKg(weekChangeKg)}</span>
        </p>
      )}
    </div>
  );
}

interface TargetBlockProps {
  data: WeightData;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  onChanged: () => Promise<void>;
}

function TargetBlock({ data, editing, setEditing, onChanged }: TargetBlockProps) {
  const { summary } = data;
  const { targetWeightKg, reachedTarget, currentKg, primaryGoal } = summary;
  const [error, setError] = useState<string | null>(null);
  // Valor sendo digitado no editor: o aviso de meta incoerente aparece na hora
  const [draftKg, setDraftKg] = useState<number | null>(targetWeightKg);

  const openEditor = () => {
    setDraftKg(targetWeightKg);
    setEditing(true);
  };

  const saveTarget = async (value: number | null) => {
    await profileService.updateProfile({ targetWeightKg: value });
    setEditing(false);
    await onChanged();
  };

  const removeTarget = async () => {
    setError(null);
    try {
      await saveTarget(null);
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível remover a meta'));
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <span className="text-sm text-ink-dim">Peso-meta (opcional)</span>
        <WeightInput
          autoFocus
          initialKg={targetWeightKg}
          onSubmit={saveTarget}
          onCancel={() => setEditing(false)}
          onValueChange={setDraftKg}
        />
        <TargetConflictNote message={targetConflict(currentKg, draftKg, primaryGoal)} />
      </div>
    );
  }

  if (targetWeightKg === null) {
    return (
      <button
        type="button"
        onClick={openEditor}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-dim underline underline-offset-2 hover:text-ink"
      >
        <Flag className="h-4 w-4" />
        Definir peso-meta (opcional)
      </button>
    );
  }

  return (
    <div className="space-y-2 border-t-2 border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Flag className="h-4 w-4 text-coin" />
          Peso-meta
        </p>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={openEditor} className="min-h-[44px] px-2 text-xs text-ink-dim underline underline-offset-2 hover:text-ink">Mudar</button>
          <button type="button" onClick={removeTarget} className="min-h-[44px] px-2 text-xs text-ink-dim underline underline-offset-2 hover:text-ink">Remover</button>
        </div>
      </div>
      <TargetProgress summary={summary} />
      {/* Depois de chegar, "meta abaixo do peso" deixa de ser incoerência: a comemoração já sugere o próximo passo */}
      {!reachedTarget && <TargetConflictNote message={targetConflict(currentKg, targetWeightKg, primaryGoal)} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

interface EntryListProps {
  entries: WeightEntry[];
  goal: WeightData['summary']['primaryGoal'];
  onEdit: (date: string) => void;
  onChanged: () => Promise<void>;
}

function EntryList({ entries, goal, onEdit, onChanged }: EntryListProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const newestFirst = [...entries].reverse();

  const remove = async (date: string) => {
    setBusy(date);
    setError(null);
    try {
      await weightService.deleteWeight(date);
      setConfirming(null);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível apagar o peso'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <details className="group" open={entries.length <= 5}>
      <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-semibold text-ink-dim">
        Pesagens ({entries.length})
      </summary>
      {error && <p role="alert" className="pb-2 text-sm text-danger">{error}</p>}
      <ul className="divide-y-2 divide-line">
        {newestFirst.map((entry, index) => {
          const previous = newestFirst[index + 1];
          const delta = previous ? Math.round((entry.weightKg - previous.weightKg) * 10) / 10 : null;
          return (
            <li key={entry.date} className="flex min-h-[48px] items-center justify-between gap-2 py-1">
              <span className="text-sm text-ink-dim">{formatDay(entry.date)}</span>
              {confirming === entry.date ? (
                <span className="flex items-center gap-1">
                  <span className="text-xs text-ink-dim">Apagar?</span>
                  <button
                    type="button"
                    disabled={busy === entry.date}
                    onClick={() => void remove(entry.date)}
                    className="min-h-[40px] rounded-lg border-2 border-danger/60 px-3 text-xs font-semibold text-danger disabled:opacity-50"
                  >
                    {busy === entry.date ? 'Apagando...' : 'Sim'}
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className="min-h-[40px] rounded-lg border-2 border-line px-3 text-xs text-ink-dim">
                    Não
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="whitespace-nowrap font-num text-lg text-ink">{formatKg(entry.weightKg)}</span>
                  {delta !== null && delta !== 0 && (
                    <span className={`w-14 text-right font-num text-sm ${deltaTone(delta, goal)}`}>{formatDeltaKg(delta)}</span>
                  )}
                  {(delta === null || delta === 0) && <span className="w-14" />}
                  <button type="button" onClick={() => onEdit(entry.date)} aria-label={`Corrigir o peso de ${formatDay(entry.date)}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-faint hover:text-ink">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setConfirming(entry.date)} aria-label={`Apagar o peso de ${formatDay(entry.date)}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-faint hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
