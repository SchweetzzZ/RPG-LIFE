import { createFileRoute } from '@tanstack/react-router';
import { PlayerBar } from '../components/dashboard/PlayerBar';
import { TodayCard } from '../components/dashboard/TodayCard';
import { QuestCard } from '../components/dashboard/QuestCard';
import { ProfileIncompleteCard } from '../components/dashboard/ProfileIncompleteCard';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useHubData } from '../hooks/useHubData';

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
});

function IndexRouteComponent() {
  const { data, loading, error, reload } = useHubData();

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
          </>
        )}
      </div>
    </main>
  );
}
