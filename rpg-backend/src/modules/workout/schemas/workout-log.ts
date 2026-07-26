import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"

export type WorkoutLogDocument = WorkoutLog & Document

export interface PerformedSet {
    setNumber: number
    weightKg: number
    reps: number
}

export interface PerformedExercise {
    exerciseName: string
    maxWeightKg?: number
    completedSetsCount?: number
    sets?: PerformedSet[]
}

@Schema({ timestamps: true, collection: "workout_logs" })
export class WorkoutLog {

    @Prop({ type: Types.ObjectId, required: true, ref: 'User', index: true })
    user: Types.ObjectId

    @Prop({ type: String, required: false })
    routineId: string

    @Prop({ required: true })
    routineName: string;

    @Prop({ required: true, default: 0 })
    durationMinutes: number;

    @Prop({ required: true, default: 0 })
    totalVolumeKg: number;

    @Prop({ required: true, default: 0 })
    totalSets: number;

    @Prop({ required: true, default: 0 })
    xpGained: number;

    @Prop({ required: true, default: 0 })
    coinsGained: number;

    @Prop({ type: Array, default: [] })
    exercises: PerformedExercise[];

    @Prop({ default: Date.now, index: true })
    completedAt: Date;
}

export const WorkoutLogSchema = SchemaFactory.createForClass(WorkoutLog);