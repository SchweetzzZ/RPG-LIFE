import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const EnergyQuerySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD').optional(),
});

export class EnergyQueryDto extends createZodDto(EnergyQuerySchema) {}

export const EnergyDailySummaryResponseSchema = z.object({
    date: z.string(),
    summary: z.object({
        bmr: z.number(),
        tdee: z.number(),
        activityCaloriesBurned: z.number(),
        totalBurnedCalories: z.number(),
        totalCaloriesConsumed: z.number(),
        remainingCalorieBudget: z.number(),
        netCalorieBalance: z.number(),
        totalCoinsEarned: z.number(),
        characterHp: z.number(),
        maxHp: z.number(),
        vaultBalance: z.number(),
    }),
    breakdown: z.object({
        workouts: z.object({
            totalCalories: z.number(),
            coinsEarned: z.number(),
            count: z.number(),
            items: z.array(z.object({
                routineName: z.string().optional(),
                durationMinutes: z.number().optional(),
                intensity: z.string().optional(),
                caloriesBurned: z.number().optional(),
                coinsGained: z.number().optional(),
            })).optional(),
        }),
        steps: z.object({
            count: z.number(),
            caloriesBurned: z.number(),
            coinsEarned: z.number(),
        }),
    }),
});

export class EnergyDailySummaryResponseDto extends createZodDto(EnergyDailySummaryResponseSchema) {}

export const WeeklyBudgetResponseSchema = z.object({
    weekRange: z.object({
        start: z.string(),
        end: z.string(),
    }),
    tdee: z.number(),
    accumulatedWeekDeficit: z.number(),
    weekendBufferTotal: z.number(),
    weekendBufferPerDay: z.number(),
    vaultBalance: z.number(),
    dailyRecords: z.array(z.object({
        date: z.string(),
        dayOfWeek: z.number(),
        isWeekday: z.boolean(),
        tdee: z.number(),
        caloriesBurned: z.number(),
        totalBudget: z.number(),
        consumed: z.number(),
        savedCalories: z.number(),
    })).optional(),
});

export class WeeklyBudgetResponseDto extends createZodDto(WeeklyBudgetResponseSchema) {}
