import React from 'react';
import { Coins, Target, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { UserMeResponse } from '@/src/types/dashboard';

interface UserHUDProps {
    data: UserMeResponse;
    onOpenShop?: () => void;
}

export function UserHUD({ data, onOpenShop }: UserHUDProps) {
    const { user, profile, progress, coinBalance } = data;

    const getGoalMeta = (goal?: string | null) => {
        switch (goal) {
            case 'lose_weight':
                return { label: 'Déficit • Perda de Gordura', color: 'text-amber-400 border-amber-400/20 bg-amber-400/10' };
            case 'gain_muscle':
                return { label: 'Superávit • Hipertrofia', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' };
            case 'maintain':
            default:
                return { label: 'Manutenção • Equilíbrio', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10' };
        }
    };

    const goal = getGoalMeta(profile?.primaryGoal);
    const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

    return (
        <header className="relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Perfil & Identidade */}
                <div className="flex items-center gap-3.5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-gradient-to-b from-zinc-800 to-zinc-900 font-mono text-base font-bold text-zinc-100 shadow-inner">
                        {initial}
                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0c0e12]">
                            <ShieldCheck className="h-2.5 w-2.5 text-black stroke-[2.5]" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold tracking-tight text-zinc-100">
                                {user.username}
                            </h1>
                            {progress?.level && (
                                <span className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400">
                                    NVL {progress.level}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide ${goal.color}`}>
                                <Target className="h-3 w-3 stroke-[2]" />
                                {goal.label}
                            </span>
                            {profile?.weightKg && (
                                <span className="font-mono text-xs text-zinc-400">
                                    {profile.weightKg} kg
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Saldo de Moedas em Destaque (Link com a Loja) */}
                <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-3 sm:border-t-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500/80">
                            Saldo de Moedas
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Coins className="h-5 w-5 text-amber-400 stroke-[1.75]" />
                            <span className="font-mono text-2xl font-bold tracking-tight text-amber-300 tabular-nums">
                                {coinBalance.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenShop}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all duration-150 hover:border-amber-400/60 hover:bg-amber-400/20 active:scale-[0.98]"
                    >
                        <span>Acessar Loja</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                </div>
            </div>
        </header>
    );
}