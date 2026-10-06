import React from 'react';
import { Coins, ShieldCheck, Sparkles, Lock } from 'lucide-react';

interface VaultBalanceSummaryProps {
  coins: number;
  vaultCalories: number;
  weekendPerDay: number;
}

export function VaultBalanceSummary({
  coins = 1650,
  vaultCalories = 1200,
  weekendPerDay = 600,
}: VaultBalanceSummaryProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0e1117] to-[#0c0e12] p-4 sm:p-6 shadow-2xl space-y-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Identidade da Loja */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3 w-3" />
              The Vault Market
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              Economia Comportamental
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
            Loja de Refeições Livres
          </h2>
          <p className="text-xs text-zinc-400">
            0% Culpa, 100% Mérito. Gaste o que conquistou no treino e na consistência calórica.
          </p>
        </div>

        {/* Saldos em Destaque */}
        <div className="flex items-center gap-4 border-t border-white/[0.06] pt-3 sm:border-t-0 sm:pt-0">
          {/* Moedas */}
          <div className="space-y-0.5">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Seu Saldo
            </span>
            <div className="flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-amber-400 stroke-[1.75]" />
              <span className="font-mono text-2xl font-black text-amber-300 tabular-nums">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cofre de Calorias */}
          <div className="space-y-0.5 pl-4 border-l border-white/[0.08]">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
              Cofre Semanal
            </span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-cyan-400 stroke-[1.75]" />
              <span className="font-mono text-2xl font-black text-cyan-300 tabular-nums">
                +{vaultCalories.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">kcal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 flex items-center justify-between text-xs font-mono">
        <span className="text-zinc-400 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-cyan-400" />
          Buffer Liberado para o Fim de Semana:
        </span>
        <span className="font-bold text-emerald-400">
          +{weekendPerDay} kcal / dia (Sábado e Domingo)
        </span>
      </div>
    </div>
  );
}
