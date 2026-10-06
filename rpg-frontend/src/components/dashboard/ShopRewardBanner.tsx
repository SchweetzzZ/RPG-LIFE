import React from 'react';
import { Sparkles, Utensils, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface ShopRewardBannerProps {
  currentCoins: number;
  targetReward?: {
    title: string;
    description: string;
    cost: number;
    category: 'meal' | 'item' | 'upgrade';
  };
  onRedeem?: () => void;
}

export function ShopRewardBanner({
  currentCoins,
  targetReward = {
    title: 'Hambúrguer Artesanal Smash Duplo',
    description: 'Refeição livre calculada e merecida após bater as metas da semana.',
    cost: 1400,
    category: 'meal',
  },
  onRedeem,
}: ShopRewardBannerProps) {
  const progressPercent = Math.min(100, Math.round((currentCoins / targetReward.cost) * 100));
  const coinsNeeded = Math.max(0, targetReward.cost - currentCoins);
  const isReady = currentCoins >= targetReward.cost;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0e1117] to-[#0c0e12] p-4 sm:p-5 shadow-xl">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-500/5 blur-2xl" />

      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3 w-3 stroke-[2]" />
              Meta da Loja em Foco
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              Cheat Meal Sem Culpa
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-400">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                {targetReward.title}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-1">
                {targetReward.description}
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Resgate ou Progresso */}
        <div className="flex flex-col sm:items-end gap-2 border-t border-white/[0.06] pt-3 sm:border-t-0 sm:pt-0">
          <div className="flex items-baseline justify-between sm:justify-end gap-2">
            <span className="font-mono text-xs text-zinc-400">
              <span className="font-bold text-amber-300">{currentCoins.toLocaleString()}</span> / {targetReward.cost.toLocaleString()} moedas
            </span>
            <span className="font-mono text-xs font-semibold text-amber-400">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full sm:w-48 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isReady ? (
            <button
              type="button"
              onClick={onRedeem}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Desbloquear Refeição Livre</span>
            </button>
          ) : (
            <Link
              to="/rewards"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-all"
            >
              <span>Faltam {coinsNeeded} moedas • Ver Loja</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
