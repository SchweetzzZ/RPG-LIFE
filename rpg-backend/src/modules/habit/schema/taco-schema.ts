import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"

export type TacoDocument = Taco & Document

@Schema({ timestamps: true, collection: "taco" })
export class Taco {

    @Prop({ requiresd: true, index: true })
    descripction: string

    @Prop({ required: true })
    category: string

    @Prop({ default: 0 })
    energyKcal: number

    @Prop({ default: 0 })
    protein: number

    @Prop({ default: 0 })
    carbohydrates: number

    @Prop({ default: 0 })
    lipids: number

    @Prop({ default: 0 })
    fiber: number
}
export const TacoFoodSchema = SchemaFactory.createForClass(Taco)