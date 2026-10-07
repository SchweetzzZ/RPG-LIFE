import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { User } from "src/modules/user/schema/user-schema"

export type ProgressDocument = Progress & Document

@Schema({ timestamps: true, collection: 'progress' })
export class Progress {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
    user: Types.ObjectId

    @Prop({ default: 1 })
    level: number

    @Prop({ default: 0 })
    currentXp: number

    @Prop({ default: 100 })
    nextLevelXp: number

    @Prop({ default: 0 })
    currentStreak: number

    @Prop({ default: 0 })
    bestStreak: number

    // Ultimo dia (YYYY-MM-DD, no fuso do usuario) em que o dia foi fechado
    @Prop({ type: String, default: null })
    lastClosedDate: string | null

}

export const ProgressSchema = SchemaFactory.createForClass(Progress)
