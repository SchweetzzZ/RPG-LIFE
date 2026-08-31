import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/user/schema/user-schema";

export type QuestDocument = Quest & Document;

export enum QuestType {
    USER_CREATED = 'user_created',
    SYSTEM_RECOMMENDED = 'system_recommended',
}

export enum QuestStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum CharacterStatType {
    STRENGTH = 'strength',
    INTELLIGENCE = 'intelligence',
    VITALITY = 'vitality',
    FOCUS = 'focus',
}

@Schema({ timestamps: true, collection: 'quests' })
export class Quest {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    user: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: false, trim: true })
    description?: string;

    @Prop({ type: String, enum: QuestType, default: QuestType.USER_CREATED })
    type: QuestType;

    @Prop({ type: String, enum: QuestStatus, default: QuestStatus.PENDING })
    status: QuestStatus;

    @Prop({ required: false })
    dueDate?: Date; // Data limite para conclusão

    @Prop({ default: 100 })
    xpReward: number;

    @Prop({ default: 20 })
    coinsReward: number;

    // 🟢 Agora tipado usando o Enum em vez de string genérica:
    @Prop({ type: String, enum: CharacterStatType, required: false })
    targetStat?: CharacterStatType;

    @Prop({ type: Object, required: false })
    goal?: {
        targetValue: number; // Ex: 5 (páginas) ou 1 (livro)
        currentValue: number;
        unit: string; // Ex: 'páginas', 'capítulos', 'dias'
    };

    @Prop({ default: false })
    isAccepted: boolean; // Para Quests sugeridas pelo sistema: o usuário precisa "aceitar" a missão
}

export const QuestSchema = SchemaFactory.createForClass(Quest);