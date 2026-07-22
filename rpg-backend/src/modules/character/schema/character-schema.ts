import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { User } from "src/modules/user/schema/user-schema"

export type characterDocument = Character & Document

@Schema({ _id: false })
export class Stats {
    @Prop({ default: 1 })
    strength: number

    @Prop({ default: 1 })
    intelligence: number

    @Prop({ default: 1 })
    vitality: number

    @Prop({ default: 1 })
    focus: number
}

export const StatsSchema = SchemaFactory.createForClass(Stats)

@Schema({ timestamps: true, collection: 'character' })
export class Character {

    @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
    user: Types.ObjectId

    @Prop({ required: true, trim: true })
    nickname: string

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

    @Prop({ type: StatsSchema, default: () => ({}) })
    stats: Stats

    @Prop({ type: String, default: 'default_avatar' })
    equippedSkin: string

}

export const CharacterSchema = SchemaFactory.createForClass(Character)