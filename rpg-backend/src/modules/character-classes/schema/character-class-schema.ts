import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { Stats, StatsSchema } from "src/modules/character/schema/character-schema"

export type CharacterClassDocument = CharacterClassSchema & Document

@Schema({ timestamps: true, collection: 'character-class' })
export class CharacterClassSchema {

    @Prop({ required: true, unique: true, trim: true })
    name: string

    @Prop({ required: false })
    description: string

    @Prop({
        type: {
            workoutXpMultiplier: { type: Number, default: 1.0 }, //Treinos(Força)
            studyXpMultiplier: { type: Number, default: 1.0 }, //Estudos(Inteligência)
            healthXpMultiplier: { type: Number, default: 1.0 }, //Dieta/Água(Vitalidade)
            habitXpMultiplier: { type: Number, default: 1.0 }, //Hábitor(Foco)
        },
        _id: false,
        default: {}
    })
    xpModifiers: {
        workoutXpMultiplier: number,
        studyXpMultiplier: number,
        healthXpMultiplier: number,
        habitXpMultiplier: number,
    }

    @Prop({ type: StatsSchema, default: () => ({}) })
    statsBonus: Stats

    @Prop({ default: 0 })
    price: number

    @Prop({ default: true })
    isActive: boolean

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

}

export const CharacterClassSchemaFactory = SchemaFactory.createForClass(CharacterClassSchema)