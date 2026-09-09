import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LogStepsSchema = z.object({
    steps: z.number().min(0, 'Quantidade de passos deve ser positiva'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
});

export class LogStepsDto extends createZodDto(LogStepsSchema) {}
