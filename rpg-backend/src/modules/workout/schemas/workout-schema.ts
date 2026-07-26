import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type workoutDocument = Workout & Document;

@Schema({ _id: false })
export class ExerciseSet {
    @Prop({ required: true, default: 1 })
    setNumber: number;

    @Prop({ required: true, default: 0 })
    weightKg: number;

    @Prop({ required: true, default: 0 })
    reps: number;

    @Prop({ default: false })
    completed: boolean;

    @Prop({ required: false })
    rpe?: number;
}
export const ExerciseSetSchema = SchemaFactory.createForClass(ExerciseSet);

@Schema({ _id: false })
export class WorkoutExercise {
    @Prop({ required: false })
    id?: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: false, default: 'Peito' })
    category?: string;

    @Prop({ required: false, default: 'strength' })
    primaryAttribute?: string;

    @Prop({ type: [ExerciseSetSchema], default: [] })
    sets: ExerciseSet[];

    @Prop({ required: false })
    notes?: string;
}
export const WorkoutExerciseSchema = SchemaFactory.createForClass(WorkoutExercise);

@Schema({ timestamps: true, collection: "workout" })
export class Workout {
    @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ default: "" })
    description: string;

    @Prop({ default: 45 })
    estimatedMinutes: number;

    @Prop({ type: [String], default: [] })
    targetMuscleGroups: string[];

    @Prop({ type: [WorkoutExerciseSchema], default: [] })
    exercises: WorkoutExercise[];

    @Prop({ default: 0 })
    completionCount: number;

    @Prop({ type: String, default: null })
    lastCompletedDate?: string;
}

export const workoutSchema = SchemaFactory.createForClass(Workout);