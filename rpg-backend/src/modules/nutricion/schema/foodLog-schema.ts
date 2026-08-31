import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/user/schema/user-schema";

export type FoodLogDocument = FoodLog & Document;

export enum MealType {
    BREAKFAST = 'breakfast',
    LUNCH = 'lunch',
    DINNER = 'dinner',
    SNACK = 'snack',
}

@Schema({ timestamps: true, collection: 'food_logs' })
export class FoodLog {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    user: Types.ObjectId;

    @Prop({ required: true, index: true })
    date: string; // Formato YYYY-MM-DD

    @Prop({ type: String, enum: MealType, required: true })
    mealType: MealType;

    @Prop({ required: true, trim: true })
    foodName: string;

    @Prop({ required: true, min: 1 })
    amountGrams: number;

    @Prop({ default: 0 })
    calories: number;

    @Prop({ default: 0 })
    proteinGrams: number;

    @Prop({ default: 0 })
    carbGrams: number;

    @Prop({ default: 0 })
    fatGrams: number;
}

export const FoodLogSchema = SchemaFactory.createForClass(FoodLog);