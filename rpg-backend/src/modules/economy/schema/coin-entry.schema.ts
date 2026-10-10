import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/user/schema/user-schema';

export type CoinEntryDocument = CoinEntry & Document;

export enum CoinReason {
    DAY_CLOSE = 'day_close',
    WORKOUT = 'workout',
    STEPS_GOAL = 'steps_goal',
    STREAK_7 = 'streak_7',
    TICKET = 'ticket',
    CYCLE_RESET = 'cycle_reset', // fim do ciclo: zera o saldo que sobrou (decisao 5)
}

// Livro-razao de moedas: o saldo NAO e guardado em lugar nenhum, e a soma das entradas.
// amount > 0 = ganho, amount < 0 = gasto.
@Schema({ timestamps: true, collection: 'coin_entries' })
export class CoinEntry {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    user: Types.ObjectId;

    @Prop({
        type: Number,
        required: true,
        validate: {
            validator: (v: number) => Number.isInteger(v) && v !== 0,
            message: 'amount deve ser um inteiro diferente de zero',
        },
    })
    amount: number;

    @Prop({ type: String, enum: CoinReason, required: true })
    reason: CoinReason;

    @Prop({ type: String, required: false })
    refId?: string;

    createdAt: Date;
}

export const CoinEntrySchema = SchemaFactory.createForClass(CoinEntry);
CoinEntrySchema.index({ user: 1, createdAt: -1 });
// Idempotencia: a mesma acao (motivo + refId, ex.: 'workout' + '2026-10-10') so paga uma vez.
CoinEntrySchema.index(
    { user: 1, reason: 1, refId: 1 },
    { unique: true, partialFilterExpression: { refId: { $exists: true } } },
);
