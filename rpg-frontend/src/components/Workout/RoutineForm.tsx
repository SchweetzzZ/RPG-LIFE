import React, { useState, useEffect } from 'react';
import { WorkoutRoutine, Exercise, ExerciseSet, AttributeType } from '../../types';
import { Plus, Trash2, Dumbbell, Save, X, Sparkles, Layers, ListPlus } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface RoutineFormProps {
  initialRoutine?: WorkoutRoutine | null;
  onSave: (routine: WorkoutRoutine) => void;
  onCancel: () => void;
}

export const RoutineForm: React.FC<RoutineFormProps> = ({
  initialRoutine,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialRoutine);

  // Core Routine Fields
  const [title, setTitle] = useState(initialRoutine?.title || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [targetMuscles, setTargetMuscles] = useState(
    initialRoutine?.targetMuscleGroups.join(', ') || ''
  );
  const [exercises, setExercises] = useState<Exercise[]>(
    initialRoutine?.exercises || [
      {
        id: `ex_default_1`,
        name: 'Supino Reto com Barra',
        category: 'Peito',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 60, reps: 10, completed: false },
          { id: 's2', setNumber: 2, weightKg: 70, reps: 8, completed: false },
          { id: 's3', setNumber: 3, weightKg: 80, reps: 6, completed: false },
        ],
      },
    ]
  );

  // New Exercise Sub-form state
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<Exercise['category']>('Peito');
  const [newExSetsCount, setNewExSetsCount] = useState<number>(3);
  const [newExWeight, setNewExWeight] = useState<number>(20);
  const [newExReps, setNewExReps] = useState<number>(10);

  // Quick Preset Categories
  const categoriesList: Exercise['category'][] = [
    'Peito',
    'Costas',
    'Pernas',
    'Ombros',
    'Braços',
    'Abdômen',
    'Cardio',
  ];

  // Add Exercise to List
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const generatedSets: ExerciseSet[] = Array.from({ length: newExSetsCount }, (_, index) => ({
      id: `set_${Date.now()}_${index + 1}`,
      setNumber: index + 1,
      weightKg: Number(newExWeight) || 0,
      reps: Number(newExReps) || 10,
      completed: false,
    }));

    const newExercise: Exercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newExName.trim(),
      category: newExCategory,
      primaryAttribute: newExCategory === 'Cardio' ? 'vitality' : 'strength',
      sets: generatedSets,
    };

    setExercises((prev) => [...prev, newExercise]);

    // Reset exercise subform fields
    setNewExName('');
    setNewExWeight(20);
    setNewExReps(10);
    soundFx.playCoin();
  };

  // Remove Exercise from Routine
  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  // Update set inside an exercise
  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: 'weightKg' | 'reps',
    value: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: Math.max(0, value),
        };
        return { ...ex, sets: updatedSets };
      })
    );
  };

  // Add Set to existing exercise in list
  const handleAddSetToExercise = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSetNumber = ex.sets.length + 1;
        const newSet: ExerciseSet = {
          id: `set_${Date.now()}_${newSetNumber}`,
          setNumber: newSetNumber,
          weightKg: lastSet ? lastSet.weightKg : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  // Remove Set from existing exercise
  const handleRemoveSetFromExercise = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId || ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.slice(0, -1) };
      })
    );
  };

  // Form Submit Handler
  const handleSubmitRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const muscleArray = targetMuscles
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const routineToSave: WorkoutRoutine = {
      id: initialRoutine ? initialRoutine.id : `routine_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Ficha personalizada do Caçador.',
      estimatedMinutes: Math.max(30, exercises.length * 10),
      targetMuscleGroups: muscleArray.length > 0 ? muscleArray : ['Geral'],
      completionCount: initialRoutine ? initialRoutine.completionCount : 0,
      lastCompletedDate: initialRoutine?.lastCompletedDate,
      exercises:
        exercises.length > 0
          ? exercises
          : [
              {
                id: `ex_fallback_${Date.now()}`,
                name: 'Exercício Livre',
                category: 'Geral' as Exercise['category'],
                primaryAttribute: 'strength',
                sets: [
                  { id: 's1', setNumber: 1, weightKg: 10, reps: 10, completed: false },
                  { id: 's2', setNumber: 2, weightKg: 10, reps: 10, completed: false },
                  { id: 's3', setNumber: 3, weightKg: 10, reps: 10, completed: false },
                ],
              },
            ],
    };

    soundFx.playQuestComplete();
    onSave(routineToSave);
  };

  return (
    <form
      onSubmit={handleSubmitRoutine}
      className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden animate-fadeIn"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-950 border border-rose-800 rounded-xl text-rose-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
              {isEditing ? 'SISTEMA DE EDIÇÃO' : 'NOVA FICHA DO CAÇADOR'}
            </span>
            <h3 className="text-base font-black text-slate-100">
              {isEditing ? `Editar: ${initialRoutine?.title}` : 'Criar Nova Ficha de Treino'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 rounded-xl border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Basic Routine Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Nome da Ficha <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Treino A - Peito, Tríceps e Ombros"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Grupos Musculares <span className="text-slate-500 font-normal">(separados por vírgula)</span>
          </label>
          <input
            type="text"
            value={targetMuscles}
            onChange={(e) => setTargetMuscles(e.target.value)}
            placeholder="ex: Peito, Tríceps, Deltoides"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Descrição / Foco do Treino
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ex: Foco em hipertrofia de peitorais com progressão de carga e descanso de 90s"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Added Exercises List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            Exercícios da Ficha ({exercises.length})
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            Configure cargas e séries para cada movimento
          </span>
        </div>

        {exercises.length === 0 ? (
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center text-xs text-slate-500 italic">
            Nenhum exercício adicionado ainda. Adicione o primeiro no formulário abaixo!
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
            {exercises.map((ex, exIndex) => (
              <div
                key={ex.id}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 relative group hover:border-rose-900/60 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                      #{exIndex + 1}
                    </span>
                    <span className="text-xs font-extrabold text-slate-100">{ex.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {ex.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(ex.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                    title="Remover Exercício"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Grid inside exercise */}
                <div className="bg-slate-900/60 rounded-xl p-2.5 space-y-2 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Série</span>
                    <span>Carga (kg)</span>
                    <span>Repetições</span>
                  </div>

                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800/60"
                    >
                      <span className="text-xs font-mono font-bold text-rose-400 px-2">
                        Série {set.setNumber}
                      </span>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={set.weightKg}
                          onChange={(e) =>
                            handleUpdateSet(
                              ex.id,
                              setIdx,
                              'weightKg',
                              Number(e.target.value)
                            )
                          }
                          className="w-16 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-center font-mono font-bold text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[10px] text-slate-500">kg</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) =>
                            handleUpdateSet(ex.id, setIdx, 'reps', Number(e.target.value))
                          }
                          className="w-16 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-center font-mono font-bold text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[10px] text-slate-500">reps</span>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleAddSetToExercise(ex.id)}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      + Adicionar Série
                    </button>
                    {ex.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSetFromExercise(ex.id)}
                        className="text-slate-500 hover:text-rose-400 text-[10px]"
                      >
                        - Remover última série
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Exercise Subform */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ListPlus className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">
            Adicionar Novo Exercício à Ficha
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Nome do Exercício
            </label>
            <input
              type="text"
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              placeholder="ex: Leg Press 45º, Puxada Alta, Tríceps Pulley..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Categoria / Grupo
            </label>
            <select
              value={newExCategory}
              onChange={(e) => setNewExCategory(e.target.value as Exercise['category'])}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Séries Iniciais
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={newExSetsCount}
              onChange={(e) => setNewExSetsCount(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Carga Padrão (kg)
            </label>
            <input
              type="number"
              value={newExWeight}
              onChange={(e) => setNewExWeight(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Reps Alvo
            </label>
            <input
              type="number"
              value={newExReps}
              onChange={(e) => setNewExReps(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddExercise}
          disabled={!newExName.trim()}
          className="w-full py-2.5 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-800/80 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-4 h-4 text-rose-400" />
          Incluir Exercício na Ficha
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!title.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-slate-100 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isEditing ? 'Salvar Alterações da Ficha' : 'Criar Ficha Completa'}
        </button>
      </div>
    </form>
  );
};
