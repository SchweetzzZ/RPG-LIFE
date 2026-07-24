import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"

export type workoutDocument = WorkoutLog & Document

export interface PerformedSet {
    setNumber: number
    weigh: number
    reps: number
}

export interface PerformedExercise {
    exerciseId: Types.ObjectId
    exerciseName: string
    sets: PerformedSet[]
}

@Schema({ timestamps: true, collection: "workout_logs" })
export class WorkoutLog {

    @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
    user: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'Workout', required: true })
    routineId: Types.ObjectId

    @Prop({ required: true })
    routineName: string; // "Treino A - Peito & Tríceps"

    @Prop({ required: true })
    durationMinutes: number; // Ex: 48 min

    @Prop({ required: true })
    totalVolumeKg: number; // Soma de todas as séries (Carga x Repetições) -> Ex: 3420 kg

    @Prop({ required: true })
    totalSets: number; // Ex: 10 séries

    @Prop({ required: true })
    xpGained: number; // +240 XP (Conectado ao módulo Character)

    @Prop({ required: true })
    coinsGained: number; // +80 Coins

    @Prop({ type: Array, default: [] })
    exercises: PerformedExercise[]; // Registros detalhados de cada exercício e suas cargas

    @Prop({ default: Date.now, index: true })
    completedAt: Date;
}