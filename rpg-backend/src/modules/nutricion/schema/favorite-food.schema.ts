import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { FoodNutrients, FoodNutrientsSchema, FoodSource } from "./food-nutrients";

export type FavoriteFoodDocument = FavoriteFood & Document;

// Alimento marcado com estrela. Um por (usuario, origem, id na origem).
@Schema({ timestamps: true, collection: 'favorite_foods' })
export class FavoriteFood {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    @Prop({ type: String, enum: FoodSource, required: true })
    source: FoodSource;

    @Prop({ required: true })
    sourceId: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: false })
    brand?: string;

    @Prop({ required: false })
    barcode?: string;

    @Prop({ type: FoodNutrientsSchema, required: true })
    nutrientsPer100g: FoodNutrients;

    // Porcao sugerida ao escolher o favorito
    @Prop({ required: true, default: 100 })
    servingSizeGrams: number;
}

export const FavoriteFoodSchema = SchemaFactory.createForClass(FavoriteFood);
FavoriteFoodSchema.index({ user: 1, source: 1, sourceId: 1 }, { unique: true });
