import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { QuestType, QuestStatus, CharacterStatType } from '../schemas/quest-schema';

export const CreateQuestSchema = z.object({
    title: z
        .string()
        .min(3, 'O título da quest deve ter no mínimo 3 caracteres')
        .max(100, 'O título não pode exceder 100 caracteres'),

    description: z.string().max(500, 'A descrição não pode exceder 500 caracteres').optional(),

    type: z.nativeEnum(QuestType).default(QuestType.USER_CREATED),

    dueDate: z
        .string()
        .datetime({ message: 'A data limite deve ser uma string ISO8601 válida' })
        .transform((val) => new Date(val))
        .optional(),

    xpReward: z.number().min(0, 'A recompensa de XP não pode ser negativa').default(100),

    coinsReward: z.number().min(0, 'A recompensa de moedas não pode ser negativa').default(20),

    targetStat: z.nativeEnum(CharacterStatType).optional(),

    goal: z
        .object({
            targetValue: z.number().positive('O valor alvo deve ser maior que 0'),
            currentValue: z.number().min(0).default(0),
            unit: z.string().min(1, 'A unidade é obrigatória (ex: páginas, km, capítulos)'),
        })
        .optional(),
});
export const UpdateQuestSchema = CreateQuestSchema.partial().extend({
    status: z.nativeEnum(QuestStatus).optional(),
    isAccepted: z.boolean().optional(),
});

export class UpdateQuestDto extends createZodDto(UpdateQuestSchema) { }

export class CreateQuestDto extends createZodDto(CreateQuestSchema) { }