import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Activity, Dumbbell, UtensilsCrossed, Footprints, ShoppingBag, User } from 'lucide-react';

interface NavItem {
  label: string;
  to: '/' | '/workouts' | '/nutrition' | '/activity' | '/rewards' | '/profile';
  icon: React.ElementType;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Hub', to: '/', icon: Activity },
  { label: 'Treino', to: '/workouts', icon: Dumbbell },
  { label: 'Nutrição', to: '/nutrition', icon: UtensilsCrossed },
  { label: 'Atividade', to: '/activity', icon: Footprints },
  { label: 'Loja', to: '/rewards', icon: ShoppingBag },
  { label: 'Perfil', to: '/profile', icon: User },
];

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Não renderiza BottomNav na tela de login
  if (currentPath.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
      <div className="mx-auto max-w-md md:max-w-lg rounded-2xl border border-white/[0.08] bg-[#08090a]/90 backdrop-blur-xl shadow-2xl px-2 py-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex flex-1 flex-col items-center justify-center py-2 px-1 text-center transition-all duration-150 min-h-[52px]"
              >
                {/* Indicador sutil de aba ativa */}
                {isActive && (
                  <div className="absolute top-0.5 h-1 w-6 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                )}

                <div
                  className={`relative flex items-center justify-center transition-transform duration-150 ${
                    isActive ? 'scale-110 text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-5 w-5 stroke-[1.75]" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`mt-1 font-mono text-[10px] tracking-tight uppercase transition-colors duration-150 ${
                    isActive ? 'font-semibold text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
