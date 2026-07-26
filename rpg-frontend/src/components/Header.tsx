import React from 'react';
import { UserProfile } from '../types';
import { Volume2, VolumeX, Shield, Zap, Coins, Gem, Droplet, Sparkles, LogOut } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onUpdateProfile,
  isMuted,
  onToggleMute,
  onLogout,
}) => {
  const xpPercentage = Math.min(
    100,
    Math.round((profile.currentXp / profile.nextLevelXp) * 100)
  );

  const handleQuickWater = (amountMl: number) => {
    const newWater = Math.min(profile.dailyWaterGoalMl, profile.waterIntakeMl + amountMl);
    soundFx.playCoin();
    
    // Give +5 Vitality XP per 250ml
    const xpBonus = Math.round((amountMl / 250) * 10);
    let newXp = profile.currentXp + xpBonus;
    
    onUpdateProfile({
      waterIntakeMl: newWater,
      currentXp: newXp,
      attributes: {
        ...profile.attributes,
        vitality: profile.attributes.vitality + 1,
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-cyan-950/80 px-4 py-2.5 shadow-lg shadow-cyan-950/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Nickname, Title, Level & Rank */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-700 to-purple-800 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-bold text-cyan-400 text-sm">
                L{profile.level}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-300">
              {profile.rank}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-100 text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                {profile.nickname}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/60 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-purple-400" />
                  {profile.equippedTitle}
                </span>
              </h1>
            </div>

            {/* XP Progress Bar */}
            <div className="w-36 sm:w-48 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mt-1 relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${xpPercentage}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-slate-200 drop-shadow">
                {profile.currentXp} / {profile.nextLevelXp} XP ({xpPercentage}%)
              </span>
            </div>
          </div>

          {/* Mute button on mobile right */}
          <button
            onClick={onToggleMute}
            className="sm:hidden p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800"
            title={isMuted ? 'Ativar Efeitos Sonoros' : 'Mutar Efeitos Sonoros'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        {/* Right: Wallet & Quick Water Tracker & Sound Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs font-semibold">
          {/* Quick Water Button */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-blue-900/60 rounded-xl px-2.5 py-1 text-blue-300">
            <Droplet className="w-3.5 h-3.5 text-blue-400 fill-blue-500/30 animate-pulse" />
            <span className="font-mono text-[11px]">{profile.waterIntakeMl}ml</span>
            <button
              onClick={() => handleQuickWater(250)}
              className="ml-1 bg-blue-600/30 hover:bg-blue-600/60 text-blue-200 text-[10px] px-1.5 py-0.5 rounded transition font-bold border border-blue-500/40"
              title="Beber 250ml de água"
            >
              +250ml
            </button>
          </div>

          {/* Currencies */}
          <div className="flex items-center gap-2">
            {/* Coins */}
            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-800/50 text-amber-300 px-2.5 py-1 rounded-xl shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{profile.coins}</span>
            </div>

            {/* Gems */}
            <div className="flex items-center gap-1 bg-purple-950/40 border border-purple-800/50 text-purple-300 px-2.5 py-1 rounded-xl shadow-inner">
              <Gem className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono">{profile.gems}</span>
            </div>
          </div>

          {/* Sound FX Toggle (Desktop) */}
          <button
            onClick={onToggleMute}
            className="hidden sm:flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-800 transition"
            title={isMuted ? 'Ativar Efeitos Sonoros' : 'Mutar Efeitos Sonoros'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-slate-900/90 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition font-extrabold text-xs"
              title="Sair da Conta (Logout)"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
