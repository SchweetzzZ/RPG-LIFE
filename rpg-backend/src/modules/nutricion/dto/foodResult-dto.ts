import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"

export type FoodResultDocument = FoodResult & Document

@Schema({ timestamps: true, collection: "foodresult" })
export class FoodResult {

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
export const FoodResultSchema = SchemaFactory.createForClass(FoodResult)
FoodResultSchema.index({ description: 'text' })