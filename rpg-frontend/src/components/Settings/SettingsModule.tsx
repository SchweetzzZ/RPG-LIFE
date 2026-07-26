import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Settings2, RotateCcw, Sparkles, User, Shield, Volume2, Save } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface SettingsModuleProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetData: () => void;
  onAddDevResources: () => void;
  onLogout?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  profile,
  onUpdateProfile,
  onResetData,
  onAddDevResources,
  onLogout,
}) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ nickname: nickname.trim() || 'Caçador' });
    soundFx.playQuestComplete();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings2 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-extrabold text-slate-100">Configurações do Caçador</h2>
        </div>

        {/* Profile Nickname Edit */}
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nickname do Caçador
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
            {isSaved && (
              <span className="text-[11px] font-bold text-emerald-400 block mt-1">
                Nickname atualizado com sucesso!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Developer / Testing Utilities */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-extrabold text-slate-100">Recursos de Demonstração & Testes</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Para testar a subida de nível e a compra de cosméticos na loja, utilize as ações rápidas abaixo:
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAddDevResources}
            className="flex-1 py-2.5 px-4 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            +500 XP, +500 Coins, +50 Gems
          </button>

          <button
            onClick={onResetData}
            className="flex-1 py-2.5 px-4 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            Resetar Dados Padrão
          </button>
        </div>

        {onLogout && (
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-rose-400 border border-rose-900/50 rounded-xl font-black text-xs transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Sair do Sistema (Logout)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
