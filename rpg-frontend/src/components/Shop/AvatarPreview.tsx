import React from 'react';
import { Shield, Sparkles, Flame, Zap, Award } from 'lucide-react';

interface AvatarPreviewProps {
  skinId: string;
  borderId: string;
  title: string;
  rank: string;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  skinId,
  borderId,
  title,
  rank,
  level,
  size = 'lg',
}) => {
  // Dimensions based on size
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  }[size];

  // Skin configurations
  const getSkinDetails = () => {
    switch (skinId) {
      case 'skin_shadow_monarch':
        return {
          name: 'Monarca das Sombras',
          bgGradient: 'from-purple-950 via-slate-950 to-indigo-950',
          auraColor: 'shadow-[0_0_30px_rgba(147,51,234,0.7)]',
          borderColor: 'border-purple-500/80',
          silhouetteColor: '#A855F7',
          glowEffect: 'bg-purple-600/30',
          icon: Flame,
          particleColor: 'text-purple-400',
        };
      case 'skin_cyber_hunter':
        return {
          name: 'Guerreiro Ciberpunk',
          bgGradient: 'from-cyan-950 via-slate-950 to-blue-950',
          auraColor: 'shadow-[0_0_30px_rgba(6,182,212,0.7)]',
          borderColor: 'border-cyan-400',
          silhouetteColor: '#06B6D4',
          glowEffect: 'bg-cyan-500/30',
          icon: Zap,
          particleColor: 'text-cyan-300',
        };
      case 'skin_golden_knight':
        return {
          name: 'Cavaleiro Dourado',
          bgGradient: 'from-amber-950 via-slate-950 to-yellow-950',
          auraColor: 'shadow-[0_0_35px_rgba(245,158,11,0.8)]',
          borderColor: 'border-amber-400',
          silhouetteColor: '#F59E0B',
          glowEffect: 'bg-amber-500/30',
          icon: Award,
          particleColor: 'text-amber-300',
        };
      default:
        return {
          name: 'Caçador Urbano',
          bgGradient: 'from-blue-950 via-slate-900 to-slate-950',
          auraColor: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
          borderColor: 'border-blue-500/50',
          silhouetteColor: '#3B82F6',
          glowEffect: 'bg-blue-500/20',
          icon: Shield,
          particleColor: 'text-blue-400',
        };
    }
  };

  const skin = getSkinDetails();
  const SkinIcon = skin.icon;

  return (
    <div className="relative flex flex-col items-center">
      {/* Avatar Wrapper with Glow */}
      <div
        className={`relative ${sizeClasses} rounded-2xl bg-gradient-to-b ${skin.bgGradient} p-1 ${skin.borderColor} border-2 ${skin.auraColor} transition-all duration-500 overflow-hidden flex items-center justify-center group`}
      >
        {/* Ambient Glow Background Effect */}
        <div className={`absolute inset-0 ${skin.glowEffect} blur-xl opacity-60 animate-pulse`} />

        {/* Shadow Monarch / Cyberpunk SVG Character Silhouette */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hood & Shoulder Armor */}
            <path
              d="M50 15 C30 15, 20 30, 20 45 L20 85 C20 85, 35 90, 50 90 C65 90, 80 85, 80 85 L80 45 C80 30, 70 15, 50 15 Z"
              fill="url(#bodyGradient)"
              opacity="0.9"
            />
            {/* Visor / Glowing Eyes */}
            <path
              d="M38 42 L62 42 L58 46 L42 46 Z"
              fill={skin.silhouetteColor}
              className="animate-pulse"
            />
            <circle cx="42" cy="44" r="2" fill="#FFFFFF" />
            <circle cx="58" cy="44" r="2" fill="#FFFFFF" />

            {/* Armor Core Crest */}
            <polygon
              points="50,55 58,68 50,75 42,68"
              fill={skin.silhouetteColor}
              opacity="0.8"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="bodyGradient" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E293B" />
                <stop offset="1" stopColor="#0F172A" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/40" />
        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-white/40" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-white/40" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/40" />

        {/* Skin Icon Floating Badge */}
        <div className="absolute top-2 right-2 bg-slate-950/80 p-1 rounded-lg border border-slate-700/80">
          <SkinIcon className={`w-3.5 h-3.5 ${skin.particleColor}`} />
        </div>
      </div>

      {/* Level Tag Overlay */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200">
          Nível {level}
        </span>
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
          Rank {rank}
        </span>
      </div>
    </div>
  );
};
