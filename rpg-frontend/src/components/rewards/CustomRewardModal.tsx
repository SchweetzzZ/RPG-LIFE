import React, { useState } from 'react';
import { X, Plus, Coins, Flame } from 'lucide-react';
import type { RewardItem } from './CheatMealCard';

interface CustomRewardModalProps {
  onAddReward: (reward: RewardItem) => void;
  onClose: () => void;
}

export function CustomRewardModal({ onAddReward, onClose }: CustomRewardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coinCost, setCoinCost] = useState(1200);
  const [estimatedCalories, setEstimatedCalories] = useState(900);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddReward({
      id: `custom_${Date.now()}`,
      name,
      description: description || 'Refeição livre personalizada cadastrada pelo caçador.',
      category: 'custom',
      coinCost,
      estimatedCalories,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-white/[0.1] bg-[#0c0e12] p-5 shadow-2xl space-y-4">
        {/* Barra de Arraste Mobile */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-700 sm:hidden" />

        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-100">
            Cadastrar Comida Favorita
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Nome da Refeição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pizza Quatro Queijos, Açaí Completo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Descrição Curta (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: 4 fatias com borda recheada no sábado à noite"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Coins className="h-3 w-3" />
                Custo (Moedas)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                step={50}
                value={coinCost}
                onChange={(e) => setCoinCost(Number(e.target.value))}
                className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-sm font-bold text-zinc-100 focus:border-amber-400/60 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Calorias Aprox.
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={200}
                step={50}
                value={estimatedCalories}
                onChange={(e) => setEstimatedCalories(Number(e.target.value))}
                className="w-full h-11 rounded-xl border border-white/[0.1] bg-[#08090a] px-3 font-mono text-sm font-bold text-zinc-100 focus:border-rose-400/60 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Salvar no Cardápio da Loja</span>
          </button>
        </form>
      </div>
    </div>
  );
}
