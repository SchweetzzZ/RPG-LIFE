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
    <main className="min-h-screen bg-bg p-4 text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-4">
        {loading && !data && <LoadingBlock label="Carregando seu painel..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && (
          <>
            <PlayerBar me={data.me} />
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
