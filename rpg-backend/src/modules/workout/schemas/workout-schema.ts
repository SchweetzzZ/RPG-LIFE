import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { targetMuscularGroup } from "./exercise-schema"

export type workoutDocument = Workout & Document

export interface workoutExercise {
    exerciseId: Types.ObjectId
    exerciseName: string
    targetSets: number
    targetReps: number
}

@Schema({ timestamps: true, collection: "workout" })
export class Workout {
    @Prop({ type: Types.ObjectId, ref: "User", required: true })
    user: Types.ObjectId

    @Prop({ required: true })
    name: string

    @Prop()
    description: string

    @Prop({ required: true, enum: targetMuscularGroup })
    muscleGroup: targetMuscularGroup

    @Prop({ type: Array, default: [] })
    exercises: workoutExercise[]
}
export const workoutSchema = SchemaFactory.createForClass(Workout)