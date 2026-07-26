import React, { useState } from 'react';
import {
  WorkoutRoutine,
  WorkoutLogEntry,
  HistoricalExerciseData,
  UserProfile,
} from '../../types';
import { ActiveWorkout } from './ActiveWorkout';
import { ProgressionChart } from './ProgressionChart';
import { RoutineForm } from './RoutineForm';
import {
  Dumbbell,
  Play,
  Plus,
  TrendingUp,
  History,
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  ListPlus,
  Trash2,
  Pencil,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface WorkoutModuleProps {
  routines: WorkoutRoutine[];
  workoutLogs: WorkoutLogEntry[];
  historicalData: Record<string, HistoricalExerciseData[]>;
  profile: UserProfile;
  onSaveRoutine: (routine: WorkoutRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onFinishWorkoutSession: (
    routine: WorkoutRoutine,
    durationMinutes: number,
    xpEarned: number,
    coinsEarned: number
  ) => void;
}

export const WorkoutModule: React.FC<WorkoutModuleProps> = ({
  routines,
  workoutLogs,
  historicalData,
  profile,
  onSaveRoutine,
  onDeleteRoutine,
  onFinishWorkoutSession,
}) => {
  const [activeTab, setActiveTab] = useState<'routines' | 'progression' | 'history'>('routines');
  const [selectedRoutineForWorkout, setSelectedRoutineForWorkout] = useState<WorkoutRoutine | null>(
    null
  );

  // Routine Creation / Editing State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);

  const handleStartWorkout = (routine: WorkoutRoutine) => {
    soundFx.playCoin();
    setSelectedRoutineForWorkout(routine);
  };

  const handleFinishActiveWorkout = (completedRoutine: WorkoutRoutine, durationMinutes: number) => {
    // Standard XP rewards for Gym Session
    const xpEarned = 180 + completedRoutine.exercises.length * 20;
    const coinsEarned = 60 + completedRoutine.exercises.length * 10;

    onFinishWorkoutSession(completedRoutine, durationMinutes, xpEarned, coinsEarned);
    setSelectedRoutineForWorkout(null);
  };

  const handleOpenCreateForm = () => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const handleSaveRoutineSubmit = (savedRoutine: WorkoutRoutine) => {
    onSaveRoutine(savedRoutine);
    setIsFormOpen(false);
    setEditingRoutine(null);
  };

  // If in active workout mode, show ActiveWorkout screen
  if (selectedRoutineForWorkout) {
    return (
      <ActiveWorkout
        routine={selectedRoutineForWorkout}
        onFinishWorkout={handleFinishActiveWorkout}
        onCancel={() => setSelectedRoutineForWorkout(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Module Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-950 border border-rose-800/80 rounded-xl text-rose-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                Academia & Musculação do Caçador
              </h2>
              <p className="text-xs text-slate-400">
                Aumente sua <span className="text-rose-400 font-bold">Força (Strength)</span> e registre a progressão de carga.
              </p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('routines')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'routines'
                ? 'bg-gradient-to-r from-rose-900 to-rose-700 text-slate-100 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Fichas
          </button>
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'progression'
                ? 'bg-gradient-to-r from-cyan-900 to-cyan-700 text-slate-100 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Cargas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-purple-900 to-purple-700 text-slate-100 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </button>
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'routines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-200">Minhas Fichas de Treino</h3>
            <button
              onClick={handleOpenCreateForm}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              Nova Ficha
            </button>
          </div>

          {/* Create or Edit Routine Form */}
          {isFormOpen && (
            <RoutineForm
              initialRoutine={editingRoutine}
              onSave={handleSaveRoutineSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingRoutine(null);
              }}
            />
          )}

          {/* Routine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-rose-900/80 rounded-2xl p-4 transition-all duration-300 shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-extrabold text-base text-slate-100 group-hover:text-rose-400 transition">
                      {routine.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditForm(routine)}
                        className="text-slate-500 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                        title="Editar Ficha"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRoutine(routine.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                        title="Excluir Ficha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{routine.description}</p>

                  {/* Muscles tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {routine.targetMuscleGroups.map((muscle) => (
                      <span
                        key={muscle}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-rose-300 border border-rose-950"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>

                  {/* Exercise summary list */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1 mb-4">
                    <p className="font-semibold text-slate-300 text-[11px] mb-1">
                      Exercícios inclusos ({routine.exercises.length}):
                    </p>
                    {routine.exercises.slice(0, 3).map((ex) => (
                      <div key={ex.id} className="text-slate-400 text-[11px] flex justify-between">
                        <span>• {ex.name}</span>
                        <span className="font-mono text-slate-500">{ex.sets.length} séries</span>
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <span className="text-[10px] text-cyan-400 font-bold block pt-1">
                        + {routine.exercises.length - 3} mais...
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Start Workout Action */}
                <button
                  onClick={() => handleStartWorkout(routine)}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-100" />
                  Iniciar Treino Ativo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'progression' && <ProgressionChart historicalData={historicalData} />}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-200">Histórico de Treinos Concluídos</h3>
          {workoutLogs.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Nenhum treino registrado ainda. Inicie um treino na aba de Fichas!
            </div>
          ) : (
            <div className="space-y-3">
              {workoutLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold text-rose-400 block">
                      {log.date}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100">{log.routineTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Duração: {log.durationMinutes} min | Volume Total: {log.totalVolumeKg} kg |
                      Séries: {log.totalSetsCompleted}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-800/50">
                      +{log.xpEarned} XP
                    </span>
                    <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-800/50">
                      +{log.coinsEarned} Coins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

