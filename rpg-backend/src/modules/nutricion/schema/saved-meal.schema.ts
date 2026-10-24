import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { FoodNutrients, FoodNutrientsSchema, FoodSource } from "./food-nutrients";

export type SavedMealDocument = SavedMeal & Document;

// Um alimento da refeicao pronta, com os valores ja calculados para a quantidade
@Schema({ _id: false })
export class SavedMealItem {
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

    @Prop({ type: String, enum: FoodSource, required: false })
    source?: FoodSource;

    @Prop({ required: false })
    sourceId?: string;

    @Prop({ required: false })
    brand?: string;

    @Prop({ type: FoodNutrientsSchema, required: false })
    nutrientsPer100g?: FoodNutrients;
}

export const SavedMealItemSchema = SchemaFactory.createForClass(SavedMealItem);

// Refeicao que a pessoa repete (ex.: "Cafe padrao"): registrada de uma vez no diario
@Schema({ timestamps: true, collection: 'saved_meals' })
export class SavedMeal {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ type: [SavedMealItemSchema], default: [] })
    items: SavedMealItem[];
}

export const SavedMealSchema = SchemaFactory.createForClass(SavedMeal);
