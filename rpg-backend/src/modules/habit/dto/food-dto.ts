import { z } from "zod"
import { createZodDto } from "nestjs-zod"

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