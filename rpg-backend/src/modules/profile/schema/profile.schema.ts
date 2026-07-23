import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { User } from "src/modules/user/schema/user-schema"

export type UserProfileDocument = UserProfile & Document

export enum ActivityLevel {
    SEDENTARY = 'sedentary',
    LIGHT = 'light',
    MODERATE = 'moderate',
    ACTIVE = 'active',
    VERY_ACTIVE = 'very_active',
}

export enum PrimaryGoal {
    LOSE_WEIGHT = 'lose_weight',
    MAINTAIN = 'maintain',
    GAIN_MUSCLE = 'gain_muscle',
}

@Schema({ timestamps: true, collection: "user_profile" })
export class UserProfile {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
    user: Types.ObjectId

    @Prop({ default: null })
    weightKg: number

    @Prop({ default: null })
    heightCm: number

    @Prop({ default: null })
    age: number

    @Prop({ type: String, enum: ['male', 'female', 'other'], default: null })
    biologicalSex: string

    @Prop({ type: String, enum: ActivityLevel, default: null })
    activityLevel: ActivityLevel

    @Prop({ type: String, enum: PrimaryGoal, default: null })
    primaryGoal: PrimaryGoal

    @Prop({ min: 0, max: 10, default: 5 })
    stressLevel: number

    @Prop({ default: false })
    trainsRegularly: boolean

    @Prop({ default: false })
    livesInHotClimate: boolean
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile)