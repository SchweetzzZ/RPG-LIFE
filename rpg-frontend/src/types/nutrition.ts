import type { components } from "../api/schema"

export type FoodLog = components["schemas"]["FoodLogResponseDto"]
export type DailySummary = components["schemas"]["DailySummaryResponseDto"]
export type CreateFoodLogInput = components["schemas"]["CreateFoodLogDto"]
export type MealType = FoodLog["mealType"]
