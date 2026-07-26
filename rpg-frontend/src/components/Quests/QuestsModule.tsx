import React, { useState } from 'react';
import { Quest, AttributeType } from '../../types';
import { QuestCard } from './QuestCard';
import {
  ScrollText,
  Plus,
  Flame,
  CheckCircle2,
  Calendar,
  AlertOctagon,
  Sparkles,
  Filter,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface QuestsModuleProps {
  quests: Quest[];
  onToggleQuestComplete: (questId: string) => void;
  onCreateQuest: (quest: Quest) => void;
  onDeleteQuest: (questId: string) => void;
}

export const QuestsModule: React.FC<QuestsModuleProps> = ({
  quests,
  onToggleQuestComplete,
  onCreateQuest,
  onDeleteQuest,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'todo' | 'penalty'>('daily');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Quest Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'daily' | 'todo' | 'penalty'>('daily');
  const [attributeReward, setAttributeReward] = useState<AttributeType>('strength');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Média' | 'Difícil' | 'Épica'>('Média');
  const [dueDate, setDueDate] = useState('');

  const filteredQuests = quests.filter((q) => q.category === activeTab);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Determine XP/Coin rewards based on difficulty
    const rewardMap = {
      Fácil: { xp: 50, coins: 20 },
      Média: { xp: 100, coins: 40 },
      Difícil: { xp: 200, coins: 80 },
      Épica: { xp: 350, coins: 150 },
    }[difficulty];

    const newQuest: Quest = {
      id: `q_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Sem descrição adicional.',
      category,
      attributeReward,
      xpReward: rewardMap.xp,
      coinReward: rewardMap.coins,
      difficulty,
      dueDate: dueDate || undefined,
      completed: false,
      streak: 0,
    };

    onCreateQuest(newQuest);
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsModalOpen(false);
    soundFx.playQuestComplete();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Module Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
              Quests & Quadro de Hábitos
            </h2>
            <p className="text-xs text-slate-400">
              Complete missões para evoluir níveis e ganhar moedas da loja.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nova Quest
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'daily'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          Hábitos Diários (Dailies)
        </button>

        <button
          onClick={() => setActiveTab('todo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'todo'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-cyan-400" />
          Metas & To-Dos
        </button>

        <button
          onClick={() => setActiveTab('penalty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'penalty'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/30'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          Desafios de Penalidade
        </button>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filteredQuests.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            Nenhuma missão nesta categoria. Clique em <span className="text-cyan-400">Nova Quest</span> para criar uma!
          </div>
        ) : (
          filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onToggleComplete={onToggleQuestComplete}
              onDeleteQuest={onDeleteQuest}
            />
          ))
        )}
      </div>

      {/* Modal: Create Quest */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl relative">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Criar Nova Quest no Sistema
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Título da Quest</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Estudar 45min de NestJS / TypeScript"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções ou notas da missão..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tipo de Quest</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'daily' | 'todo' | 'penalty')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-semibold"
                  >
                    <option value="daily">Hábito Diário (Daily)</option>
                    <option value="todo">Meta Pontual (To-Do)</option>
                    <option value="penalty">Desafio de Penalidade</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Atributo Concedido</label>
                  <select
                    value={attributeReward}
                    onChange={(e) => setAttributeReward(e.target.value as AttributeType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-semibold"
                  >
                    <option value="strength">Força (Treinos)</option>
                    <option value="intelligence">Inteligência (Estudos)</option>
                    <option value="vitality">Vitalidade (Saúde)</option>
                    <option value="focus">Foco (Trabalho)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as 'Fácil' | 'Média' | 'Difícil' | 'Épica')
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-semibold"
                  >
                    <option value="Fácil">Fácil (+50 XP)</option>
                    <option value="Média">Média (+100 XP)</option>
                    <option value="Difícil">Difícil (+200 XP)</option>
                    <option value="Épica">Épica (+350 XP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Data Limite (opcional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black uppercase rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  Criar Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
