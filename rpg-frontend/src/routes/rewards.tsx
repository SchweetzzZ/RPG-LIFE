import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ShoppingBag, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { VaultBalanceSummary } from '../components/rewards/VaultBalanceSummary';
import { CheatMealCard, type RewardItem } from '../components/rewards/CheatMealCard';
import { CustomRewardModal } from '../components/rewards/CustomRewardModal';

export const Route = createFileRoute('/rewards')({
  component: RewardsRouteComponent,
});

const initialRewards: RewardItem[] = [
  {
    id: 'r1',
    name: 'Hambúrguer Artesanal Smash Duplo com Fritas',
    description: 'Pão brioche, 2 burgers 120g, queijo cheddar derretido e batata rústica crocante.',
    category: 'burger',
    coinCost: 1400,
    estimatedCalories: 1100,
  },
  {
    id: 'r2',
    name: 'Pizza Inteira Artesanal 4 Fatias',
    description: 'Massa fermentação natural, molho de tomate rústico e borda recheada.',
    category: 'pizza',
    coinCost: 2000,
    estimatedCalories: 1600,
  },
  {
    id: 'r3',
    name: 'Açaí Completo 500ml no Capricho',
    description: 'Açaí puro batido com banana, granola artesanal, leite condensado e morangos frescos.',
    category: 'sweet',
    coinCost: 850,
    estimatedCalories: 750,
  },
  {
    id: 'r4',
    name: 'Combinado de Sushi & Sashimi (20 peças)',
    description: 'Sashimi de salmão fresco, uramakis especiais e niguiris maçaricados.',
    category: 'japanese',
    coinCost: 1800,
    estimatedCalories: 950,
  },
];

function RewardsRouteComponent() {
  const [userCoins, setUserCoins] = useState(1650);
  const [rewards, setRewards] = useState<RewardItem[]>(initialRewards);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successRedeem, setSuccessRedeem] = useState<RewardItem | null>(null);

  const handleRedeem = (reward: RewardItem) => {
    if (userCoins < reward.coinCost) return;
    setUserCoins((prev) => prev - reward.coinCost);
    setSuccessRedeem(reward);
  };

  const handleAddReward = (newReward: RewardItem) => {
    setRewards((prev) => [newReward, ...prev]);
  };

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-5">
        {/* Banner de Celebração do Resgate */}
        {successRedeem && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="h-3 w-3" />
                Refeição Livre Liberada!
              </span>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                {successRedeem.name}
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                -{successRedeem.coinCost} moedas • Abatido matematicamente do seu cofre semanal. Aproveite 100% sem culpa!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessRedeem(null)}
              className="rounded-lg border border-white/[0.1] px-3 py-1.5 font-mono text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fechar
            </button>
          </div>
        )}

        {/* 1. Painel do Saldo & Cofre */}
        <VaultBalanceSummary
          coins={userCoins}
          vaultCalories={1200}
          weekendPerDay={600}
        />

        {/* 2. Vitrine de Cheat Meals */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Vitrine de Recompensas
              </h2>
              <span className="font-mono text-[11px] text-zinc-500">
                Gaste com disciplina e mérito
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 font-mono text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] transition-all min-h-[40px]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Cadastrar Prato</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {rewards.map((reward) => (
              <CheatMealCard
                key={reward.id}
                reward={reward}
                userCoins={userCoins}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Modal para adicionar prato personalizado */}
      {isModalOpen && (
        <CustomRewardModal
          onAddReward={handleAddReward}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}
