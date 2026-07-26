import React from 'react';
import { UserProfile } from '../../types';
import { Award, Sparkles, Shield, Flame, Zap, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  profile: UserProfile;
  oldLevel: number;
  newLevel: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  profile,
  oldLevel,
  newLevel,
  onClose,
}) => {
  React.useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 border-2 border-cyan-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Badge Icon */}
        <div className="relative z-10 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-1 shadow-2xl flex items-center justify-center animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center text-cyan-400 font-mono text-2xl font-black">
            L{newLevel}
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-1 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-700">
            PROMOÇÃO DO SISTEMA
          </span>
          <h2 className="text-2xl font-black text-slate-100 tracking-wide mt-2">
            VOCÊ SUBIU DE NÍVEL!
          </h2>
          <p className="text-xs text-slate-300">
            Sua disciplina e esforço foram reconhecidos. Todos os status de atributos foram fortalecidos!
          </p>
        </div>

        {/* Stats Upgrade breakdown */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-left text-xs relative z-10">
          <div>
            <span className="text-slate-400 block font-medium">Nível Anterior</span>
            <span className="font-mono text-sm font-bold text-slate-400">Nível {oldLevel}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Novo Nível</span>
            <span className="font-mono text-sm font-black text-cyan-400">Nível {newLevel}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Rank do Caçador</span>
            <span className="font-mono text-sm font-black text-amber-400">Rank {profile.rank}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Bônus de Status</span>
            <span className="font-mono text-sm font-black text-emerald-400">+5 Pts Todos</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/30 transition relative z-10"
        >
          ACEITAR EVOLUÇÃO
        </button>
      </div>
    </div>
  );
};
