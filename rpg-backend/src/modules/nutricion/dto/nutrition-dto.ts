import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum MealType {
    BREAKFAST = 'breakfast',
    LUNCH = 'lunch',
    DINNER = 'dinner',
    SNACK = 'snack',
}

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