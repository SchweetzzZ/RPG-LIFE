import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CycleDocument = Cycle & Document;

export enum CycleStatus {
    OPEN = 'open',
    CLOSED = 'closed',
}

// Ciclo do cofre e das moedas: a semana fixa de segunda a domingo. No maximo 1 aberto por usuario.
@Schema({ timestamps: true, collection: 'cycles' })
export class Cycle {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    startDate: string; // segunda-feira (YYYY-MM-DD no fuso do usuario)

    @Prop({ required: true })
    endDate: string; // domingo

    // Refeicao livre agendada neste ciclo (o modelo FreeMeal chega no Lote 3)
    @Prop({ type: Types.ObjectId, required: false, default: null })
    freeMeal: Types.ObjectId | null;

    @Prop({ type: String, enum: CycleStatus, default: CycleStatus.OPEN })
    status: CycleStatus;

    @Prop({ type: Date, required: false, default: null })
    closedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

export const CycleSchema = SchemaFactory.createForClass(Cycle);
// So 1 ciclo aberto por usuario (vale tambem para requisicoes simultaneas)
CycleSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { status: CycleStatus.OPEN } });
CycleSchema.index({ user: 1, startDate: -1 });
