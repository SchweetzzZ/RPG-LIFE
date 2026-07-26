import React from 'react';
import { LayoutDashboard, Dumbbell, ScrollText, ShoppingBag, Settings2, Apple, Sparkles } from 'lucide-react';

export type TabType = 'dashboard' | 'workout' | 'nutrition' | 'guidelines' | 'quests' | 'shop' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingQuestsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  pendingQuestsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Status',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'workout' as TabType,
      label: 'Treinos',
      icon: Dumbbell,
      badge: 'GYM',
    },
    {
      id: 'nutrition' as TabType,
      label: 'Nutrição',
      icon: Apple,
      badge: 'TACO',
    },
    {
      id: 'guidelines' as TabType,
      label: 'Diretrizes',
      icon: Sparkles,
      badge: 'SYSTEM',
    },
    {
      id: 'quests' as TabType,
      label: 'Missões',
      icon: ScrollText,
      badge: pendingQuestsCount > 0 ? `${pendingQuestsCount}` : null,
    },
    {
      id: 'shop' as TabType,
      label: 'Loja',
      icon: ShoppingBag,
      badge: 'SKINS',
    },
    {
      id: 'settings' as TabType,
      label: 'Opções',
      icon: Settings2,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (Left side) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950/80 border-r border-slate-800/80 p-4 sticky top-14 h-[calc(100vh-3.5rem)] justify-between">
        <div className="space-y-2">
          <div className="px-3 py-2 text-[11px] font-bold text-cyan-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Sistema de Caçador
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition font-medium text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/60 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.id === 'quests' && pendingQuestsCount > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Nível do Sistema: 1.0</p>
          <p className="text-[11px] text-slate-500">Mantenha a rotina para evoluir status diários.</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-400'
                    }`}
                  />
                  {item.badge && item.id === 'quests' && pendingQuestsCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                      {pendingQuestsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
