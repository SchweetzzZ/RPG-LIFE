import { FoodLog } from "./schema/food-Log-schema";
import { FoodLogResponse } from "./dto/nutrition-dto";

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
