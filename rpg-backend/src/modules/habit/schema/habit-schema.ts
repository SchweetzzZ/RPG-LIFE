import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { User } from "src/modules/user/schema/user-schema"
import { stringFormat } from "zod"

export type habitDocument = Habit & Document

export enum HabbitCategory {
    WATER = 'water',
    NUTRITION = 'nutrition',
    STUDY = 'study',
    CUSTOM = 'custom'
}

export enum HabbitStatType {
    STRENGTH = 'strength',
    INTELLIGENCE = 'intelligence',
    VITALITY = 'vitality',
    FOCUS = 'focus'
}

export enum HabitType {
    DAILY = 'daily',
    TODO = 'todo',
    PENALTY = 'penalty'
}

@Schema({ timestamps: true, collection: 'habit' })
export class Habit {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    user: Types.ObjectId

    @Prop({ required: true, trim: true })
    title: string

    @Prop({ type: String, enum: HabbitCategory, default: HabbitCategory.CUSTOM })
    category: HabbitCategory

    @Prop({ type: String, enum: HabitType, default: HabitType.DAILY })
    type: HabitType

    @Prop({ default: 0 })
    gemsReward: number

    @Prop({ type: String, enum: HabbitStatType, required: false })
    targetStat?: HabbitStatType

    @Prop({ default: 50 })
    xpReward: number

    @Prop({ default: 10 })
    coinsReward: number

    @Prop({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' })
    difficult?: string

    @Prop({ type: Object })
    goal: {
        targetValue: number,
        unit: string
    }

    @Prop({ default: true })
    isDaily: boolean

    @Prop({ type: [Number], default: [0, 1, 2, 3, 4, 5, 6] })
    frequencyDays: number[]

    @Prop({ default: 0 })
    currentStreak: number
}

@Schema({ timestamps: true, collection: 'dailyHabitStatus' })
export class DailyHabitStatus {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    user: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: Habit.name, required: true })
    habit: Types.ObjectId

    @Prop({ required: true })
    date: string

    @Prop({ default: 0 })
    currentProgress: number

    @Prop({ default: false })
    isCompleted: boolean
}

export const HabbitSchema = SchemaFactory.createForClass(Habit)
export const DailyHabitStatusSchema = SchemaFactory.createForClass(DailyHabitStatus)