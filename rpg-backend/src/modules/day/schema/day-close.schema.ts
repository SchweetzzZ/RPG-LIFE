import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DayCloseDocument = DayClose & Document;

// Fotografia do dia no momento em que foi fechado. Um por (usuario, dia).
@Schema({ timestamps: true, collection: 'day_closes' })
export class DayClose {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    date: string; // YYYY-MM-DD no fuso do usuario

    // Ciclo ao qual o dia pertence (null se nao havia ciclo para essa data)
    @Prop({ type: Types.ObjectId, ref: 'Cycle', required: false, default: null })
    cycle: Types.ObjectId | null;

    @Prop({ required: true })
    bmr: number;

    @Prop({ required: true })
    baseKcal: number;

    @Prop({ required: true })
    workoutKcal: number;

    @Prop({ required: true })
    stepsKcal: number;

    @Prop({ required: true })
    activeKcal: number;

    @Prop({ required: true })
    targetKcal: number;

    @Prop({ required: true })
    consumedKcal: number;

    // 0 = dia fechado sem refeicao: nao guarda kcal, nao rende moedas e quebra a sequencia
    @Prop({ required: true, default: 0 })
    foodLogsCount: number;

    // O que sobrou da meta e foi para o cofre
    @Prop({ required: true, default: 0 })
    savedKcal: number;

    // Quanto o consumo passou da meta (bruto)
    @Prop({ required: true, default: 0 })
    overflowKcal: number;

    // Quanto saiu do cofre por causa do excedente (limitado ao saldo)
    @Prop({ required: true, default: 0 })
    vaultDebitKcal: number;

    // false = o dia era de um ciclo ja encerrado: nao mexeu no cofre nem pagou moedas
    @Prop({ required: true, default: true })
    vaultApplied: boolean;

    @Prop({ type: Date, required: true })
    closedAt: Date;
}

export const DayCloseSchema = SchemaFactory.createForClass(DayClose);
DayCloseSchema.index({ user: 1, date: 1 }, { unique: true });
