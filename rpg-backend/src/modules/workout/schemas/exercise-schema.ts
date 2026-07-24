import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"

export type exerciseDocument = Exercise & Document

export enum targetMuscularGroup {
    PEITORAL = "peitoral",
    COSTAS = "costas",
    PERNA = "perna",
    BRAÇO = "braço",
    ABDOMEN = "abdômen",
    OMBRO = "ombro"
}

@Schema()
export class Exercise {

    @Prop({ required: true })
    name: string

    @Prop({ required: true, enum: targetMuscularGroup })
    targetMuscularGroup: string

    @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
    createdByUserId?: Types.ObjectId
}
export const ExerciseSchema = SchemaFactory.createForClass(Exercise)