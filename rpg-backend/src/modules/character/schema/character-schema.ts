import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { Stats, StatsSchema } from "./stats-schema"
import { User } from "src/modules/user/schema/user-schema"

export * from "./stats-schema"
export type characterDocument = Character & Document

@Schema({ timestamps: true, collection: 'character' })
export class Character {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
    user: Types.ObjectId

    @Prop({ required: true, trim: true })
    nickname: string

    // Referência (FK) para a classe do catálogo global
    @Prop({ type: Types.ObjectId, ref: 'CharacterClassSchema', required: false })
    characterClass: Types.ObjectId

    @Prop({ default: 1 })
    level: number

    @Prop({ default: 0 })
    currentXp: number

    @Prop({ default: 100 })
    nextLevelXp: number

    @Prop({ default: 0 })
    coins: number

    @Prop({ default: 0 })
    gems: number

    @Prop({ default: 0 })
    waterQuantity: number

    @Prop({ default: 100 })
    hp: number

    @Prop({ default: 100 })
    maxHp: number

    @Prop({ default: 0 })
    vaultBalance: number

    @Prop({ type: StatsSchema, default: () => ({}) })
    stats: Stats

    @Prop({ type: String, default: 'default_avatar' })
    equippedSkin: string

}

export const CharacterSchema = SchemaFactory.createForClass(Character)