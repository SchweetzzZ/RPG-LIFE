import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MealType } from '../schema/foodLog-schema';

export const CreateFoodLogSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    mealType: z.nativeEnum(MealType),
    foodName: z.string().min(1, 'Nome do alimento é obrigatório'),
    amountGrams: z.number().positive('A quantidade em gramas deve ser maior que 0'),
    calories: z.number().min(0).default(0),
    proteinGrams: z.number().min(0).default(0),
    carbGrams: z.number().min(0).default(0),
    fatGrams: z.number().min(0).default(0),
});

export class CreateFoodLogDto extends createZodDto(CreateFoodLogSchema) { }