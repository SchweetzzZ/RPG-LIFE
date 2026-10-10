import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FreeMealItem, FreeMealItemSchema } from './free-meal-item.schema';

export type FreeMealDocument = FreeMeal & Document;

export enum FreeMealScope {
    WEEK = 'week', // paga com o cofre da semana + 100 moedas
    DAY = 'day',   // paga com a sobra da meta de hoje (descontadas as day ja resgatadas hoje) + 40 moedas
}

export enum FreeMealStatus {
    PLANNED = 'planned',     // agendada, ainda sem kcal suficientes
    READY = 'ready',         // kcal suficientes (cofre ou sobra do dia); calculado de forma preguicosa
    REDEEMED = 'redeemed',   // resgatada: entra na galeria de conquistas
    CANCELLED = 'cancelled', // cancelada pelo usuario ou expirada (ver cancelReason)
}

export enum FreeMealCancelReason {
    USER = 'user',       // DELETE /free-meals/:id
    EXPIRED = 'expired', // ciclo (semana) ou dia acabou sem resgate
}

// Refeicao livre agendada (PLANO_PROXIMOS_LOTES.md, secoes 7.2 e 7.5).
@Schema({ timestamps: true, collection: 'free_meals' })
export class FreeMeal {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: String, enum: FreeMealScope, required: true })
    scope: FreeMealScope;

    // Template de origem (null = refeicao totalmente personalizada)
    @Prop({ type: Types.ObjectId, ref: 'FreeMealTemplate', required: false, default: null })
    template: Types.ObjectId | null;

    @Prop({ type: String, required: false, default: null })
    templateSlug: string | null;

    @Prop({ required: true, trim: true })
    title: string;

    // Dia agendado (YYYY-MM-DD no fuso do usuario), dentro do ciclo
    @Prop({ required: true })
    scheduledFor: string;

    @Prop({ type: [FreeMealItemSchema], default: [] })
    plannedItems: FreeMealItem[];

    @Prop({ type: Number, required: true, min: 1 })
    estimatedKcal: number;

    // O que foi comido de fato (informado no resgate; vazio = igual ao planejado)
    @Prop({ type: [FreeMealItemSchema], default: [] })
    actualItems: FreeMealItem[];

    @Prop({ type: Number, required: false, default: null })
    actualKcal: number | null;

    // Quanto passou do estimado (so informativo; nada extra e cobrado)
    @Prop({ type: Number, required: false, default: null })
    exceededKcal: number | null;

    // Quanto saiu do cofre no resgate (semana) = min(comido, estimado); dia = 0
    @Prop({ type: Number, required: false, default: null })
    vaultDebitKcal: number | null;

    // Moedas do ticket (copiado na criacao: 100 semana / 40 dia)
    @Prop({ type: Number, required: true, min: 0 })
    ticketCost: number;

    @Prop({ type: Types.ObjectId, ref: 'Cycle', required: true })
    cycle: Types.ObjectId;

    @Prop({ type: String, enum: FreeMealStatus, default: FreeMealStatus.PLANNED })
    status: FreeMealStatus;

    @Prop({ type: String, enum: FreeMealCancelReason, required: false, default: null })
    cancelReason: FreeMealCancelReason | null;

    @Prop({ type: Date, required: false, default: null })
    cancelledAt: Date | null;

    @Prop({ type: Date, required: false, default: null })
    redeemedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

export const FreeMealSchema = SchemaFactory.createForClass(FreeMeal);
// Sem limite de vagas por ciclo/dia: agendar so planeja (nada e cobrado nem reservado ate o resgate).
FreeMealSchema.index({ user: 1, status: 1, redeemedAt: -1 });
FreeMealSchema.index({ user: 1, scope: 1, status: 1, scheduledFor: 1, createdAt: 1 });
FreeMealSchema.index({ user: 1, cycle: 1 });
