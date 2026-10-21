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
  { label: 'Diário', to: '/nutrition', icon: UtensilsCrossed },
];

const hubItem: NavItem = { label: 'Hub', to: '/', icon: Activity };

const rightItems: NavItem[] = [
  { label: 'Passos', to: '/activity', icon: Footprints },
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
      className="group relative flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1.5 text-center"
    >
      <div
        className={`relative flex h-8 w-10 items-center justify-center rounded-md border-2 transition-colors duration-100 ${
          active ? 'border-line bg-raised text-ink' : 'border-transparent text-ink-faint group-hover:text-ink-dim'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
        {item.badge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-[3px] border-2 border-surface bg-danger px-0.5 font-num text-xs leading-none text-ink">
            {item.badge}
          </span>
        )}
      </div>

      <span className={`max-w-full truncate font-pixel text-[11px] leading-none ${active ? 'text-ink' : 'text-ink-faint group-hover:text-ink-dim'}`}>
        {item.label}
      </span>

      {/* Marcador de aba ativa: um bloco de pixel, sem brilho. */}
      {active && <span className="absolute bottom-0 h-1 w-4 rounded-[1px] bg-action" aria-hidden />}
    </Link>
  );
}

/** Botão central do Hub: um botão "físico" (mesma sombra dura do botão primário), saindo acima da barra. */
function HubLink({ active }: { active: boolean }) {
  const Icon = hubItem.icon;
  return (
    <Link
      to={hubItem.to}
      aria-current={active ? 'page' : undefined}
      aria-label={hubItem.label}
      className="group relative flex min-h-[54px] w-[72px] shrink-0 flex-col items-center justify-end gap-1 pb-1.5"
    >
      <div
        className={`-mt-7 flex h-[52px] w-[52px] items-center justify-center rounded-lg border-2 border-[#0c0a08] shadow-[0_4px_0_0_#0c0a08] transition-transform duration-75 group-active:translate-y-[2px] group-active:shadow-[0_2px_0_0_#0c0a08] ${
          active ? 'bg-action text-[#0c0a08]' : 'bg-raised text-action group-hover:brightness-110'
        }`}
      >
        <Icon className="h-6 w-6" strokeWidth={2.25} />
      </div>
      <span className={`font-pixel text-[11px] leading-none ${active ? 'text-ink' : 'text-ink-faint'}`}>{hubItem.label}</span>
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-lg border-2 border-line bg-surface px-1 shadow-[0_4px_0_0_#0c0a08,0_-8px_24px_rgba(12,10,8,0.6)] md:max-w-lg">
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
