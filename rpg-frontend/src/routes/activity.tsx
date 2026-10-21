import { createFileRoute } from '@tanstack/react-router';
import { Footprints } from 'lucide-react';
import { StepsProgressCard } from '../components/activity/StepsProgressCard';
import { PageHeader } from '../components/layout/PageHeader';

export const Route = createFileRoute('/activity')({
  component: ActivityRouteComponent,
});

function ActivityRouteComponent() {
  return (
    <main className="min-h-screen px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <PageHeader title="Passos" icon={Footprints} />

        {/* Passos & Movimento (dados ainda mockados; integração com a API vem em lote futuro) */}
        <StepsProgressCard initialSteps={8450} targetSteps={10000} />
      </div>
    </main>
  );
}
