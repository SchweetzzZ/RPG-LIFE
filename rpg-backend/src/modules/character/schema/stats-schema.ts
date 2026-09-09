import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class Stats {
    @Prop({ default: 1 })
    strength: number;

    @Prop({ default: 1 })
    intelligence: number;

    @Prop({ default: 1 })
    vitality: number;

    @Prop({ default: 1 })
    focus: number;
}

export const StatsSchema = SchemaFactory.createForClass(Stats);
