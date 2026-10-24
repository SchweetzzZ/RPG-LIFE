import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MealType } from '../schema/food-Log-schema';
import { FoodSource } from '../schema/food-nutrients';
import { NutrientsPer100gSchema } from './food-dto';

// Fonte unica do enum: o schema do Mongo
export { MealType };

// 🟢 DTO 1: Registrar Alimento Consumido
export const CreateFoodLogSchema = z.object({
    foodName: z.string().min(1, 'O nome do alimento é obrigatório'),
    mealType: z.nativeEnum(MealType),
    amountGrams: z.number().positive('A quantidade em gramas deve ser maior que 0'),
    calories: z.number().min(0),
    proteinGrams: z.number().min(0),
    carbGrams: z.number().min(0),
    fatGrams: z.number().min(0),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD')
        .optional(),
    // Origem do alimento (opcional): alimenta recentes e favoritos
    source: z.nativeEnum(FoodSource).optional(),
    sourceId: z.string().optional(),
    brand: z.string().optional(),
    nutrientsPer100g: NutrientsPer100gSchema.optional(),
});

export class CreateFoodLogDto extends createZodDto(CreateFoodLogSchema) { }

// 🟢 DTO 2: Query Params para a Busca de Alimentos (TACO/OFF)
export const SearchFoodQuerySchema = z.object({
    q: z.string().min(2, 'A busca deve ter pelo menos 2 caracteres'),
});

export class SearchFoodQueryDto extends createZodDto(SearchFoodQuerySchema) { }

// 🟢 DTO 3: Query Params para o Resumo Diário
export const DailySummaryQuerySchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD')
        .optional(),
});

export class DailySummaryQueryDto extends createZodDto(DailySummaryQuerySchema) { }

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD');

// 🟢 DTO 4: Copiar uma refeição de outro dia para hoje
export const CopyMealSchema = z.object({
    fromDate: DateSchema,
    mealType: z.nativeEnum(MealType),
    /** Refeição de destino hoje; sem ela, vai para a mesma refeição */
    toMealType: z.nativeEnum(MealType).optional(),
});
export class CopyMealDto extends createZodDto(CopyMealSchema) { }

// 🟢 DTO 5: Salvar uma refeição do diário como refeição pronta
export const CreateSavedMealSchema = z.object({
    name: z.string().trim().min(1, 'Dê um nome para a refeição').max(60),
    fromDate: DateSchema,
    mealType: z.nativeEnum(MealType),
});
export class CreateSavedMealDto extends createZodDto(CreateSavedMealSchema) { }

// 🟢 DTO 6: Registrar uma refeição pronta hoje
export const LogSavedMealSchema = z.object({
    mealType: z.nativeEnum(MealType),
});
export class LogSavedMealDto extends createZodDto(LogSavedMealSchema) { }

// ── Response DTOs ────────────────────────────────────────────────────────────

export const FoodLogResponseSchema = z.object({
    id: z.string(),
    date: z.string(),
    mealType: z.nativeEnum(MealType),
    foodName: z.string(),
    amountGrams: z.number(),
    calories: z.number(),
    proteinGrams: z.number(),
    carbGrams: z.number(),
    fatGrams: z.number(),
    createdAt: z.string().optional(),
});

export const DailySummaryResponseSchema = z.object({
    date: z.string(),
    totals: z.object({
        calories: z.number(),
        proteinGrams: z.number(),
        carbGrams: z.number(),
        fatGrams: z.number(),
    }),
    logs: z.array(FoodLogResponseSchema),
});

export const FoodLogDeletedResponseSchema = z.object({
    message: z.string(),
});

export const CopiedLogsResponseSchema = z.object({
    copied: z.number(),
    logs: z.array(FoodLogResponseSchema),
});

const TotalsSchema = z.object({
    calories: z.number(),
    proteinGrams: z.number(),
    carbGrams: z.number(),
    fatGrams: z.number(),
});

export const SavedMealResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    items: z.array(TotalsSchema.extend({
        foodName: z.string(),
        amountGrams: z.number(),
    })),
    totals: TotalsSchema,
});

export const DeletedResponseSchema = z.object({
    message: z.string(),
});

export type FoodLogResponse = z.infer<typeof FoodLogResponseSchema>;
export type SavedMealResponse = z.infer<typeof SavedMealResponseSchema>;

export class FoodLogResponseDto extends createZodDto(FoodLogResponseSchema) { }
export class DailySummaryResponseDto extends createZodDto(DailySummaryResponseSchema) { }
export class FoodLogDeletedResponseDto extends createZodDto(FoodLogDeletedResponseSchema) { }
export class CopiedLogsResponseDto extends createZodDto(CopiedLogsResponseSchema) { }
export class SavedMealResponseDto extends createZodDto(SavedMealResponseSchema) { }
export class DeletedResponseDto extends createZodDto(DeletedResponseSchema) { }
