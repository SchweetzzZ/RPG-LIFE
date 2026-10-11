import { createFileRoute } from '@tanstack/react-router';
import { UserHUD } from '../components/dashboard/UserHUD';
import { NextFreeMealHero } from '../components/dashboard/NextFreeMealHero';
import { EnergyBalance } from '../components/dashboard/energyBalance';
import { CaloricVault } from '../components/dashboard/CaloricVault';
import { ProfileIncompleteCard } from '../components/dashboard/ProfileIncompleteCard';
import { CloseDayPanel } from '../components/dashboard/CloseDayPanel';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useHubData } from '../hooks/useHubData';

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
});

function IndexRouteComponent() {
  const { data, loading, error, reload } = useHubData();

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-5">
        {loading && !data && <LoadingBlock label="Carregando seu painel..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}

        {data && (
          <>
            <UserHUD data={data.me} />
            <NextFreeMealHero next={data.next} />
            {data.day ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <EnergyBalance day={data.day} />
                <CaloricVault vault={data.vault} />
              </div>
            ) : (
              <>
                <ProfileIncompleteCard missing={data.missingProfile} />
                <CaloricVault vault={data.vault} />
              </>
            )}
            {data.day && <CloseDayPanel day={data.day} onClosed={reload} />}
          </>
        )}
      </div>
    </main>
  );
}
