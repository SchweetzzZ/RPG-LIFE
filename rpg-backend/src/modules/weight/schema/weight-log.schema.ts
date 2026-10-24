import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeightLogDocument = WeightLog & Document;

// Diario de peso (F4): no maximo UM peso por (usuario, dia). Registrar de novo no mesmo dia substitui.
// Dia sem registro nao e erro: o app nunca cobra frequencia.
@Schema({ timestamps: true, collection: 'weight_logs' })
export class WeightLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    date: string; // YYYY-MM-DD no fuso do usuario (toUserDate)

    @Prop({ required: true, min: 20, max: 400 })
    weightKg: number;

    createdAt: Date;
    updatedAt: Date;
}

export const WeightLogSchema = SchemaFactory.createForClass(WeightLog);
WeightLogSchema.index({ user: 1, date: 1 }, { unique: true });
