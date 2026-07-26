import React, { useState } from 'react';
import { Quest } from '../../types';
import {
  CheckCircle2,
  Flame,
  Dumbbell,
  Brain,
  Heart,
  Target,
  Coins,
  Sparkles,
  Calendar,
  AlertOctagon,
  Trash2,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface QuestCardProps {
  quest: Quest;
  onToggleComplete: (questId: string) => void;
  onDeleteQuest: (questId: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onToggleComplete,
  onDeleteQuest,
}) => {
  const [isFloaterActive, setIsFloaterActive] = useState(false);

  const attributeIcon = {
    strength: <Dumbbell className="w-3.5 h-3.5 text-rose-400" />,
    intelligence: <Brain className="w-3.5 h-3.5 text-cyan-400" />,
    vitality: <Heart className="w-3.5 h-3.5 text-emerald-400" />,
    focus: <Target className="w-3.5 h-3.5 text-purple-400" />,
  }[quest.attributeReward];

  const difficultyBadge = {
    Fácil: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    Média: 'bg-blue-950 text-blue-300 border-blue-800',
    Difícil: 'bg-purple-950 text-purple-300 border-purple-800',
    Épica: 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse',
  }[quest.difficulty];

  const handleCheck = () => {
    if (!quest.completed) {
      soundFx.playQuestComplete();
      setIsFloaterActive(true);
      setTimeout(() => setIsFloaterActive(false), 1200);
    }
    onToggleComplete(quest.id);
  };

  return (
    <div
      className={`relative bg-slate-900/80 border transition-all duration-300 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 group ${
        quest.completed
          ? 'border-emerald-900/40 bg-slate-950/60 opacity-75'
          : quest.category === 'penalty'
          ? 'border-rose-500/70 shadow-rose-950/40 bg-gradient-to-r from-rose-950/30 to-slate-900'
          : 'border-slate-800 hover:border-cyan-800'
      }`}
    >
      {/* Floating Rewards animation on check */}
      {isFloaterActive && (
        <div className="absolute -top-6 right-6 pointer-events-none animate-bounce font-mono font-black text-xs text-amber-300 bg-slate-950 px-2 py-1 rounded-xl border border-amber-500 shadow-xl z-30 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          +{quest.xpReward} XP | +{quest.coinReward} Coins!
        </div>
      )}

      {/* Main Quest Content */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={handleCheck}
          className={`p-2 rounded-xl border transition-all duration-200 mt-0.5 shrink-0 ${
            quest.completed
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-500 border-slate-700 hover:border-cyan-500 hover:text-cyan-400'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${difficultyBadge}`}
            >
              {quest.difficulty}
            </span>

            {/* Streak Counter for Dailies */}
            {quest.category === 'daily' && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded-md">
                <Flame className="w-3 h-3 fill-amber-400" />
                {quest.streak}d
              </span>
            )}

            {/* Category Badge */}
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              {attributeIcon}
              <span className="capitalize">{quest.attributeReward}</span>
            </span>

            {quest.dueDate && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                {quest.dueDate}
              </span>
            )}
          </div>

          <h4
            className={`font-bold text-sm text-slate-100 truncate ${
              quest.completed ? 'line-through text-slate-500' : ''
            }`}
          >
            {quest.title}
          </h4>

          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{quest.description}</p>
        </div>
      </div>

      {/* Rewards & Delete Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="block font-mono text-xs font-black text-cyan-400">
            +{quest.xpReward} XP
          </span>
          <span className="flex items-center justify-end gap-1 font-mono text-[11px] font-bold text-amber-400">
            <Coins className="w-3 h-3" />
            +{quest.coinReward}
          </span>
        </div>

        <button
          onClick={() => onDeleteQuest(quest.id)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-950 transition opacity-0 group-hover:opacity-100"
          title="Excluir Missão"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
