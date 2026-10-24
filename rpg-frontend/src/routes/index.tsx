import { useEffect, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarCheck } from 'lucide-react';
import { PlayerBar } from '../components/dashboard/PlayerBar';
import { TodayCard } from '../components/dashboard/TodayCard';
import { QuestCard } from '../components/dashboard/QuestCard';
import { ProfileIncompleteCard } from '../components/dashboard/ProfileIncompleteCard';
import { WeightCard } from '../components/weight/WeightCard';
import { WeeklySummaryModal } from '../components/summary/WeeklySummaryModal';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useHubData } from '../hooks/useHubData';

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
});

function IndexRouteComponent() {
  const { data, loading, error, reload } = useHubData();
  // Semana (segunda) cujo resumo está aberto
  const [summaryStart, setSummaryStart] = useState<string | null>(null);
  // Abre sozinho uma vez só por carregamento da tela (o servidor guarda que já foi visto)
  const autoOpened = useRef(false);

  useEffect(() => {
    if (data?.weekStatus.pending && !autoOpened.current) {
      autoOpened.current = true;
      setSummaryStart(data.weekStatus.start);
    }
  }, [data]);

  return (
    <main className="min-h-screen px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto grid w-full max-w-md gap-3 md:max-w-3xl md:grid-cols-2 md:items-start md:gap-4">
        {loading && !data && <LoadingBlock label="Carregando seu painel..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && (
          <>
            <div className="md:col-span-2">
              <PlayerBar me={data.me} />
            </div>
            {data.day ? (
              <TodayCard day={data.day} onClosed={reload} />
            ) : (
              <ProfileIncompleteCard missing={data.missingProfile} />
            )}
            <QuestCard next={data.next} vault={data.vault} />
            <WeightCard summary={data.weight} onSaved={reload} />
            {data.weekStatus.hasActivity && (
              <button
                type="button"
                onClick={() => setSummaryStart(data.weekStatus.start)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-medium text-ink-dim underline underline-offset-2 hover:text-ink md:col-span-2"
              >
                <CalendarCheck className="h-4 w-4" />
                Ver semana passada
              </button>
            )}
          </>
        )}
      </div>

      {summaryStart && <WeeklySummaryModal start={summaryStart} onClose={() => setSummaryStart(null)} />}
    </main>
  );
}
