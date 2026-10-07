import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { StepSource } from '../schema/step-log-schema';

export const LogStepsSchema = z.object({
    steps: z.number().min(0, 'Quantidade de passos deve ser positiva'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    source: z.nativeEnum(StepSource).optional().default(StepSource.MANUAL),
});

export class LogStepsDto extends createZodDto(LogStepsSchema) {}

// Response DTOs
export const StepsRecommendationResponseSchema = z.object({
    recommendedSteps: z.number(),
    reasoning: z.string(),
});

export const LogStepsResponseSchema = z.object({
    date: z.string(),
    steps: z.number(),
    caloriesBurned: z.number(),
    coinsEarned: z.number(),
    coinsAwardedToday: z.number(),
    recommendedSteps: z.number(),
    reasoning: z.string(),
});

export const GetStepsResponseSchema = z.object({
    date: z.string(),
    steps: z.number(),
    caloriesBurned: z.number(),
    coinsEarned: z.number(),
    recommendedSteps: z.number(),
    reasoning: z.string(),
});

export class StepsRecommendationResponseDto extends createZodDto(StepsRecommendationResponseSchema) {}
export class LogStepsResponseDto extends createZodDto(LogStepsResponseSchema) {}
export class GetStepsResponseDto extends createZodDto(GetStepsResponseSchema) {}
