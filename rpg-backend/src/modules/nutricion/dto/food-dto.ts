import { z } from "zod"
import { createZodDto } from "nestjs-zod"
import { FoodSource } from "../schema/food-nutrients"

export const NutrientsPer100gSchema = z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
});

export const FoodResultSchema = z.object({
    id: z.string(),
    name: z.string(),
    source: z.enum(['TACO', 'OPEN_FOOD_FACTS']),
    brand: z.string().optional(),
    barcode: z.string().optional(),
    servingSizeGrams: z.number().default(100), // Padrão 100g
    nutrientsPer100g: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        fiber: z.number().optional(),
    }),
});
export class FoodResultDto extends createZodDto(FoodResultSchema) { }

/**
 * Alimento que pode ir para o diario: resultado da busca, recente ou favorito.
 * Igual ao FoodResult, mas a origem tambem aceita DIARY (registro antigo sem origem gravada).
 */
export const LoggableFoodSchema = FoodResultSchema.extend({
    source: z.nativeEnum(FoodSource),
});

// Recente: alimento dos ultimos 30 dias, com a ultima quantidade usada
export const RecentFoodResponseSchema = LoggableFoodSchema.extend({
    lastAmountGrams: z.number(),
    timesLogged: z.number(),
    lastDate: z.string(),
});
export class RecentFoodResponseDto extends createZodDto(RecentFoodResponseSchema) { }

// Favorito: `id` e o do alimento na origem; `favoriteId` e o do registro de favorito
export const FavoriteFoodResponseSchema = LoggableFoodSchema.extend({
    favoriteId: z.string(),
});
export class FavoriteFoodResponseDto extends createZodDto(FavoriteFoodResponseSchema) { }

export const CreateFavoriteFoodSchema = z.object({
    source: z.nativeEnum(FoodSource),
    id: z.string().min(1),
    name: z.string().trim().min(1),
    brand: z.string().optional(),
    barcode: z.string().optional(),
    servingSizeGrams: z.number().positive().default(100),
    nutrientsPer100g: NutrientsPer100gSchema,
});
export class CreateFavoriteFoodDto extends createZodDto(CreateFavoriteFoodSchema) { }
