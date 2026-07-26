import React, { useState, useEffect } from 'react';
import { WorkoutRoutine, Exercise, ExerciseSet } from '../../types';
import {
  Timer,
  CheckCircle2,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Dumbbell,
  Clock,
  ArrowLeft,
  Award,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface ActiveWorkoutProps {
  routine: WorkoutRoutine;
  onFinishWorkout: (completedRoutine: WorkoutRoutine, durationMinutes: number) => void;
  onCancel: () => void;
}

export const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({
  routine,
  onFinishWorkout,
  onCancel,
}) => {
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine>(routine);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [presetRestTime, setPresetRestTime] = useState<number>(60);

  // Elapsed Workout Time Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestTimerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            soundFx.playTimerBeep();
            setIsRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimerSeconds]);

  // Start Rest Timer
  const startRestTimer = (seconds: number) => {
    setPresetRestTime(seconds);
    setRestTimerSeconds(seconds);
    setIsRestTimerActive(true);
  };

  // Toggle Set Completion
  const handleToggleSet = (exerciseId: string, setId: string) => {
    soundFx.playSetCheck();

    setActiveRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const newCompleted = !s.completed;
            if (newCompleted) {
              // Trigger rest timer automatically on checking a set!
              startRestTimer(presetRestTime);
            }
            return { ...s, completed: newCompleted };
          }),
        };
      }),
    }));
  };

  // Update Weight or Reps
  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: 'weightKg' | 'reps',
    val: number
  ) => {
    setActiveRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, [field]: val };
          }),
        };
      }),
    }));
  };

  // Add Set to Exercise
  const handleAddSet = (exerciseId: string) => {
    setActiveRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: `s_${Date.now()}_${Math.random()}`,
          setNumber: ex.sets.length + 1,
          weightKg: lastSet ? lastSet.weightKg : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }),
    }));
  };

  // Calculate Total Completed Sets & Total Volume (kg)
  let totalSets = 0;
  let completedSets = 0;
  let totalVolumeKg = 0;

  activeRoutine.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      totalSets++;
      if (s.completed) {
        completedSets++;
        totalVolumeKg += s.weightKg * s.reps;
      }
    });
  });

  const handleFinish = () => {
    soundFx.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    onFinishWorkout(activeRoutine, minutes);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner: Active Workout Title & Timer */}
      <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-xl shadow-cyan-950/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Cancelar Treino"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  SESSÃO ATIVA DE MUSCULAÇÃO
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-100">{activeRoutine.title}</h2>
            </div>
          </div>

          {/* Timers & Volume Badge */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm font-bold text-slate-200">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm font-bold text-amber-300">
                {totalVolumeKg} kg
              </span>
            </div>
          </div>
        </div>

        {/* Rest Timer Widget Floating/Integrated */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">Descanso entre Séries:</span>
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg border ${
                isRestTimerActive
                  ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isRestTimerActive ? formatTime(restTimerSeconds) : 'Pausado'}
            </span>
          </div>

          {/* Quick Preset Timer Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            {[30, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => startRestTimer(sec)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  presetRestTime === sec && isRestTimerActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-cyan-700'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {activeRoutine.exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-100">
                  {exercise.name}
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                {exercise.category}
              </span>
            </div>

            {/* Sets Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-black uppercase text-slate-500 px-2">
                <span className="col-span-2">Série</span>
                <span className="col-span-4 text-center">Carga (kg)</span>
                <span className="col-span-4 text-center">Reps</span>
                <span className="col-span-2 text-right">Status</span>
              </div>

              {exercise.sets.map((setItem) => (
                <div
                  key={setItem.id}
                  className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-xl border transition ${
                    setItem.completed
                      ? 'bg-emerald-950/20 border-emerald-900/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <span className="col-span-2 font-mono text-xs font-bold text-slate-400">
                    #{setItem.setNumber}
                  </span>

                  {/* Weight Input */}
                  <div className="col-span-4 flex items-center justify-center gap-1">
                    <input
                      type="number"
                      value={setItem.weightKg}
                      onChange={(e) =>
                        handleUpdateSet(
                          exercise.id,
                          setItem.id,
                          'weightKg',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500">kg</span>
                  </div>

                  {/* Reps Input */}
                  <div className="col-span-4 flex items-center justify-center gap-1">
                    <input
                      type="number"
                      value={setItem.reps}
                      onChange={(e) =>
                        handleUpdateSet(
                          exercise.id,
                          setItem.id,
                          'reps',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500">reps</span>
                  </div>

                  {/* Complete Checkbox */}
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => handleToggleSet(exercise.id, setItem.id)}
                      className={`p-1.5 rounded-xl border transition ${
                        setItem.completed
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Set Button */}
            <button
              onClick={() => handleAddSet(exercise.id)}
              className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Série
            </button>
          </div>
        ))}
      </div>

      {/* Finish Workout Bottom Action Bar */}
      <div className="p-4 bg-slate-900/95 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-100 text-sm">Concluir Sessão de Treino</h4>
          <p className="text-xs text-slate-400">
            Séries concluídas: {completedSets} / {totalSets} | Recompensa estimada:{' '}
            <span className="text-amber-400 font-bold">+180 FORÇA XP e +60 Coins</span>
          </p>
        </div>

        <button
          onClick={handleFinish}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          <Award className="w-5 h-5" />
          Finalizar Treino & Ganhar XP
        </button>
      </div>
    </div>
  );
};
