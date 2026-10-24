import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

/** Origem do alimento. DIARY = montado a partir de um registro antigo, sem origem gravada. */
export enum FoodSource {
    TACO = 'TACO',
    OPEN_FOOD_FACTS = 'OPEN_FOOD_FACTS',
    DIARY = 'DIARY',
}

// Valores por 100 g, compartilhados por food_logs, favorite_foods e saved_meals
@Schema({ _id: false })
export class FoodNutrients {
    @Prop({ required: true, default: 0 })
    calories: number;

    @Prop({ required: true, default: 0 })
    protein: number;

    @Prop({ required: true, default: 0 })
    carbs: number;

    @Prop({ required: true, default: 0 })
    fat: number;
}

export const FoodNutrientsSchema = SchemaFactory.createForClass(FoodNutrients);
