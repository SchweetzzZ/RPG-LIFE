import { z } from "zod";
import { FoodLog } from "./schema/food-Log-schema";
import { FoodLogResponse, SavedMealResponse } from "./dto/nutrition-dto";
import { FavoriteFood } from "./schema/favorite-food.schema";
import { SavedMeal } from "./schema/saved-meal.schema";
import { FavoriteFoodResponseSchema } from "./dto/food-dto";

// Os tipos das classes de schema nao declaram `_id` nem os timestamps, mas o Mongo sempre os devolve
type WithMeta<T> = T & {
    _id?: unknown;
    createdAt?: Date | string;
};

export function toFoodLogResponse(doc: WithMeta<FoodLog>): FoodLogResponse {
    return {
        id: String(doc._id),
        date: doc.date,
        mealType: doc.mealType,
        foodName: doc.foodName,
        amountGrams: doc.amountGrams,
        calories: doc.calories,
        proteinGrams: doc.proteinGrams,
        carbGrams: doc.carbGrams,
        fatGrams: doc.fatGrams,
        ...(doc.createdAt ? { createdAt: new Date(doc.createdAt).toISOString() } : {}),
    };
}


export function toFavoriteResponse(doc: WithMeta<FavoriteFood>): z.infer<typeof FavoriteFoodResponseSchema> {
    return {
        favoriteId: String(doc._id),
        id: doc.sourceId,
        name: doc.name,
        source: doc.source,
        ...(doc.brand ? { brand: doc.brand } : {}),
        ...(doc.barcode ? { barcode: doc.barcode } : {}),
        servingSizeGrams: doc.servingSizeGrams,
        nutrientsPer100g: {
            calories: doc.nutrientsPer100g.calories,
            protein: doc.nutrientsPer100g.protein,
            carbs: doc.nutrientsPer100g.carbs,
            fat: doc.nutrientsPer100g.fat,
        },
    };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function toSavedMealResponse(doc: WithMeta<SavedMeal>): SavedMealResponse {
    const items = doc.items.map((i) => ({
        foodName: i.foodName,
        amountGrams: i.amountGrams,
        calories: i.calories,
        proteinGrams: i.proteinGrams,
        carbGrams: i.carbGrams,
        fatGrams: i.fatGrams,
    }));
    const totals = items.reduce(
        (acc, i) => ({
            calories: acc.calories + i.calories,
            proteinGrams: round1(acc.proteinGrams + i.proteinGrams),
            carbGrams: round1(acc.carbGrams + i.carbGrams),
            fatGrams: round1(acc.fatGrams + i.fatGrams),
        }),
        { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 },
    );
    return { id: String(doc._id), name: doc.name, items, totals };
}
