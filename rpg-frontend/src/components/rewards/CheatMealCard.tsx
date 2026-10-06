import React from 'react';
import { Utensils, Coins, Flame, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  category: 'burger' | 'pizza' | 'sweet' | 'japanese' | 'custom';
  coinCost: number;
  estimatedCalories: number;
}

interface CheatMealCardProps {
  reward: RewardItem;
  userCoins: number;
  onRedeem: (reward: RewardItem) => void;
}

export function CheatMealCard({ reward, userCoins, onRedeem }: CheatMealCardProps) {
  const isAffordable = userCoins >= reward.coinCost;
  const progressPercent = Math.min(100, Math.round((userCoins / reward.coinCost) * 100));
  const coinsNeeded = Math.max(0, reward.coinCost - userCoins);

  return (
    <div
      className={`overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isAffordable
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-950/15 via-[#0c0e12] to-[#0c0e12] shadow-xl'
          : 'border-white/[0.08] bg-[#0c0e12] opacity-90'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-400">
              Refeição Livre
            </span>

            {isAffordable && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                Disponível para Resgate
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
            {reward.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2">
            {reward.description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-400">
          <Utensils className="h-5 w-5" />
        </div>
      </div>

      {/* Custo em Moedas & Estimativa Calórica */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
          <Coins className="h-4 w-4 text-amber-400" />
          <span>{reward.coinCost.toLocaleString()} moedas</span>
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <Flame className="h-3.5 w-3.5 text-rose-400" />
          <span>~{reward.estimatedCalories} kcal</span>
        </div>
      </div>

      {/* Barra de Progresso se não for acessível */}
      {!isAffordable && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>Faltam {coinsNeeded} moedas</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-500/60 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Botão de Ação no Polegar */}
      <div className="mt-4">
        {isAffordable ? (
          <button
            type="button"
            onClick={() => onRedeem(reward)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Desbloquear Refeição Livre</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 font-mono text-xs font-semibold text-zinc-500 cursor-not-allowed min-h-[44px]"
          >
            <Lock className="h-3.5 w-3.5 text-zinc-600" />
            <span>Bloqueado (Saldo Insuficiente)</span>
          </button>
        )}
      </div>
    </div>
  );
}
