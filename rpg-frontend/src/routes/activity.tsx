import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Footprints } from 'lucide-react';
import { StepsProgressCard } from '../components/activity/StepsProgressCard';

export const Route = createFileRoute('/activity')({
  component: ActivityRouteComponent,
});

function ActivityRouteComponent() {
  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-5">
        {/* Header da Tela de Atividade */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-400">
              <Footprints className="h-4 w-4 stroke-[2]" />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100">
              Atividade
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Seus passos do dia viram calorias gastas e moedas.
          </p>
        </header>

        {/* Passos & Movimento (dados ainda mockados; integração com a API vem em lote futuro) */}
        <StepsProgressCard initialSteps={8450} targetSteps={10000} />
      </div>
    </main>
  );
}
