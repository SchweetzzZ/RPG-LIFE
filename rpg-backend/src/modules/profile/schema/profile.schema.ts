import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { User } from "src/modules/user/schema/user-schema"
import { DEFAULT_TIMEZONE } from "../../common/utils/user-date"

export type UserProfileDocument = UserProfile & Document

export enum ActivityLevel {
    SEDENTARY = 'sedentary',
    LIGHT = 'light',
    MODERATE = 'moderate',
    INTENSE = 'intense',
    VERY_INTENSE = 'very_intense',
}

// Sexo usado na formula de gasto calorico (Mifflin-St Jeor so tem estas duas versoes).
// Nao e identidade de genero: se um dia o app perguntar genero, sera outro campo, fora da conta.
export enum BiologicalSex {
    MALE = 'male',
    FEMALE = 'female',
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

    @Prop({ type: String, enum: BiologicalSex, default: null })
    biologicalSex: BiologicalSex

    @Prop({ type: String, enum: ActivityLevel, default: null })
    activityLevel: ActivityLevel

    @Prop({ type: String, enum: PrimaryGoal, default: null })
    primaryGoal: PrimaryGoal

    // Fuso IANA do usuario: define qual e o "dia" dele (treino, refeicao, passos)
    @Prop({ type: String, default: DEFAULT_TIMEZONE })
    timezone: string

    @Prop({ default: null })
    targetCalories: number

    @Prop({ default: null })
    targetProteinGrams: number

    @Prop({ default: null })
    targetCarbGrams: number

    @Prop({ default: null })
    targetFatGrams: number
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile)