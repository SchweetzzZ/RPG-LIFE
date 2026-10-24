import type { components } from "../api/schema"

type Schemas = components["schemas"]

export type FoodLog = Schemas["FoodLogResponseDto"]
export type DailySummary = Schemas["DailySummaryResponseDto"]
export type CreateFoodLogInput = Schemas["CreateFoodLogDto"]
export type MealType = FoodLog["mealType"]

/** Alimento dos últimos 30 dias, com a última quantidade usada. */
export type RecentFood = Schemas["RecentFoodResponseDto"]
export type FavoriteFood = Schemas["FavoriteFoodResponseDto"]
export type CreateFavoriteInput = Schemas["CreateFavoriteFoodDto"]
export type FoodSource = CreateFavoriteInput["source"]
export type SavedMeal = Schemas["SavedMealResponseDto"]
export type CopiedLogs = Schemas["CopiedLogsResponseDto"]

/**
 * Qualquer alimento que pode ir para o diário: resultado da busca, recente ou favorito.
 * O resultado da busca (FoodResult) cabe aqui, porque a origem dele é um subconjunto.
 */
export interface LoggableFood {
    id: string
    name: string
    source: FoodSource
    brand?: string
    barcode?: string
    servingSizeGrams: number
    nutrientsPer100g: { calories: number; protein: number; carbs: number; fat: number }
}
