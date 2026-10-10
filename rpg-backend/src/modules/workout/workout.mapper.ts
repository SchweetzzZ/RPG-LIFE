import { Workout } from "./schemas/workout-schema";
import { WorkoutLog } from "./schemas/workout-log";
import { WorkoutLogResponse, WorkoutResponse } from "./dto/workout-dto";

// Converte documentos do Mongo no formato publico da API (sem `user`, `_id` vira `id`, datas em ISO)

// Os tipos das classes de schema nao declaram `_id` nem os timestamps, mas o Mongo sempre os devolve
type WithMeta<T> = T & {
    _id?: unknown;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

type Intensity = WorkoutResponse['intensity'];
type SetTechnique = WorkoutResponse['exercises'][number]['sets'][number]['technique'];

const INTENSITIES: readonly Intensity[] = ['moderate', 'intense', 'cycling_running'];
const TECHNIQUES: readonly SetTechnique[] = ['normal', 'back_off_set', 'cluster_set', 'drop_set'];

const toIntensity = (value: string | undefined): Intensity =>
    INTENSITIES.find((i) => i === value) ?? 'moderate';

const toTechnique = (value: string | undefined): SetTechnique =>
    TECHNIQUES.find((t) => t === value) ?? 'normal';

export function toWorkoutResponse(doc: WithMeta<Workout>): WorkoutResponse {
    return {
        id: String(doc._id),
        title: doc.title,
        description: doc.description ?? '',
        estimatedMinutes: doc.estimatedMinutes,
        targetMuscleGroups: [...(doc.targetMuscleGroups ?? [])],
        scheduledDays: [...(doc.scheduledDays ?? [])],
        intensity: toIntensity(doc.intensity),
        exercises: (doc.exercises ?? []).map((ex) => ({
            ...(ex.id ? { id: ex.id } : {}),
            name: ex.name,
            ...(ex.category ? { category: ex.category } : {}),
            sets: (ex.sets ?? []).map((s) => ({
                setNumber: s.setNumber,
                weightKg: s.weightKg,
                reps: s.reps,
                completed: s.completed ?? false,
                ...(s.rpe != null ? { rpe: s.rpe } : {}),
                technique: toTechnique(s.technique),
                restSeconds: s.restSeconds ?? 60,
            })),
            ...(ex.notes ? { notes: ex.notes } : {}),
        })),
        completionCount: doc.completionCount ?? 0,
        lastCompletedDate: doc.lastCompletedDate ?? null,
        ...(doc.createdAt ? { createdAt: new Date(doc.createdAt).toISOString() } : {}),
        ...(doc.updatedAt ? { updatedAt: new Date(doc.updatedAt).toISOString() } : {}),
    };
}

export function toWorkoutLogResponse(doc: WithMeta<WorkoutLog>): WorkoutLogResponse {
    return {
        id: String(doc._id),
        ...(doc.routineId ? { routineId: doc.routineId } : {}),
        routineName: doc.routineName,
        date: doc.date,
        durationMinutes: doc.durationMinutes,
        intensity: toIntensity(doc.intensity),
        caloriesBurned: doc.caloriesBurned,
        totalVolumeKg: doc.totalVolumeKg,
        totalSets: doc.totalSets,
        xpGained: doc.xpGained,
        coinsGained: doc.coinsGained,
        exercises: (doc.exercises ?? []).map((ex) => ({
            exerciseName: ex.exerciseName,
            ...(ex.maxWeightKg != null ? { maxWeightKg: ex.maxWeightKg } : {}),
            ...(ex.completedSetsCount != null ? { completedSetsCount: ex.completedSetsCount } : {}),
            ...(ex.sets ? { sets: ex.sets.map((s) => ({ ...s })) } : {}),
        })),
        completedAt: new Date(doc.completedAt ?? doc.createdAt ?? Date.now()).toISOString(),
    };
}
