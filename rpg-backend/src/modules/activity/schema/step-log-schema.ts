import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/user/schema/user-schema";

export type StepLogDocument = StepLog & Document;

// Origem do registro de passos (so guardamos a origem; nao ha anti-fraude/teto ainda)
export enum StepSource {
    MANUAL = 'manual',
    HEALTH_CONNECT = 'health_connect',
    HEALTHKIT = 'healthkit',
}

@Schema({ timestamps: true, collection: 'step_logs' })
export class StepLog {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    user: Types.ObjectId;

    @Prop({ required: true, index: true })
    date: string; // YYYY-MM-DD

    @Prop({ required: true, default: 0 })
    steps: number;

    @Prop({ default: 0 })
    caloriesBurned: number;

    @Prop({ default: 0 })
    coinsEarned: number;

    @Prop({ type: String, enum: StepSource, default: StepSource.MANUAL })
    source: StepSource;
}

export const StepLogSchema = SchemaFactory.createForClass(StepLog);
StepLogSchema.index({ user: 1, date: 1 }, { unique: true });
