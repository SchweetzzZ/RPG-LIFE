import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Activity, Dumbbell, UtensilsCrossed, Footprints, ShoppingBag, User } from 'lucide-react';

interface NavItem {
  label: string;
  to: '/' | '/workouts' | '/nutrition' | '/activity' | '/rewards' | '/profile';
  icon: React.ElementType;
  badge?: string | number;
}

// Hub fica no centro, elevado; as outras abas se dividem dos dois lados
const leftItems: NavItem[] = [
  { label: 'Treino', to: '/workouts', icon: Dumbbell },
  { label: 'Nutrição', to: '/nutrition', icon: UtensilsCrossed },
];

const hubItem: NavItem = { label: 'Hub', to: '/', icon: Activity };

const rightItems: NavItem[] = [
  { label: 'Atividade', to: '/activity', icon: Footprints },
  { label: 'Loja', to: '/rewards', icon: ShoppingBag },
  { label: 'Perfil', to: '/profile', icon: User },
];

function isActivePath(currentPath: string, to: NavItem['to']): boolean {
  return currentPath === to || (to !== '/' && currentPath.startsWith(to));
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className="group relative flex flex-1 flex-col items-center justify-center py-2 px-1 text-center transition-all duration-150 min-h-[52px]"
    >
      {/* Indicador sutil de aba ativa */}
      {active && <div className="absolute top-0.5 h-1 w-6 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />}

      <div
        className={`relative flex items-center justify-center transition-transform duration-150 ${
          active ? 'scale-110 text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
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
          active ? 'font-semibold text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

/** Botao central do Hub: maior e saindo acima da barra, para marcar que e a tela principal. */
function HubLink({ active }: { active: boolean }) {
  const Icon = hubItem.icon;
  return (
    <Link
      to={hubItem.to}
      aria-current={active ? 'page' : undefined}
      aria-label={hubItem.label}
      className="group relative flex w-20 shrink-0 flex-col items-center justify-end pb-2 min-h-[52px]"
    >
      <div
        className={`-mt-6 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 shadow-[0_6px_20px_rgba(0,0,0,0.6)] transition-all duration-150 group-active:translate-y-[1px] ${
          active
            ? 'border-amber-300 bg-amber-400 text-[#08090a] shadow-[0_0_18px_rgba(245,158,11,0.45)]'
            : 'border-amber-400/70 bg-[#1a1612] text-amber-400 group-hover:border-amber-300'
        }`}
      >
        <Icon className="h-6 w-6 stroke-[2]" />
      </div>
      <span
        className={`mt-1 font-mono text-[10px] font-semibold tracking-tight uppercase ${
          active ? 'text-amber-300' : 'text-zinc-300'
        }`}
      >
        {hubItem.label}
      </span>
    </Link>
  );
}

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
        <div className="flex items-end">
          {/* Os dois lados tem a mesma largura para o Hub ficar no centro exato */}
          <div className="flex flex-1 items-center justify-around">
            {leftItems.map((item) => (
              <NavLink key={item.to} item={item} active={isActivePath(currentPath, item.to)} />
            ))}
          </div>
          <HubLink active={isActivePath(currentPath, hubItem.to)} />
          <div className="flex flex-1 items-center justify-around">
            {rightItems.map((item) => (
              <NavLink key={item.to} item={item} active={isActivePath(currentPath, item.to)} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
