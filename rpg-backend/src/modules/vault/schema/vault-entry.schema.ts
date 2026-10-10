import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VaultEntryDocument = VaultEntry & Document;

export enum VaultEntryType {
    DAY_CLOSE = 'day_close',     // + o que sobrou da meta num dia fechado
    OVERFLOW = 'overflow',       // - excedente do dia (limitado ao saldo)
    REDEEM = 'redeem',           // - refeicao livre da semana resgatada (refId = id da refeicao)
    CYCLE_RESET = 'cycle_reset', // - o que sobrou no fim do ciclo
}

// Livro-razao do cofre de kcal. Saldo = soma das entradas do ciclo; nunca negativo.
@Schema({ timestamps: true, collection: 'vault_entries' })
export class VaultEntry {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Cycle', required: true })
    cycle: Types.ObjectId;

    // Dia a que a entrada se refere (YYYY-MM-DD no fuso do usuario)
    @Prop({ required: true })
    date: string;

    @Prop({
        type: Number,
        required: true,
        validate: {
            validator: (v: number) => Number.isInteger(v) && v !== 0,
            message: 'kcal deve ser um inteiro diferente de zero',
        },
    })
    kcal: number;

    @Prop({ type: String, enum: VaultEntryType, required: true })
    type: VaultEntryType;

    // Data do dia fechado, id do ciclo ou da refeicao livre: garante que nada e lancado duas vezes
    @Prop({ type: String, required: true })
    refId: string;

    createdAt: Date;
}

export const VaultEntrySchema = SchemaFactory.createForClass(VaultEntry);
VaultEntrySchema.index({ cycle: 1, createdAt: 1 });
VaultEntrySchema.index({ user: 1, type: 1, refId: 1 }, { unique: true });
