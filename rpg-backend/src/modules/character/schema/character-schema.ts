import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { User } from "src/modules/user/schema/user-schema"

export type characterDocument = Character & Document

@Schema({ timestamps: true, collection: 'Stats' })
export class Stats {

    @Prop({ required: true })
    name: string

    @Prop({ default: 1 })
    strength: number

    @Prop({ default: 1 })
    inteligence: number

    @Prop({ default: 1 })
    vitality: number

    @Prop({ default: 1 })
    focus: number
}

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
    nextLevelUp: number

    @Prop({ default: 0 })
    coins: number;

    @Prop({ default: 0 })
    gems: number;

    @Prop({ type: Stats, default: () => ({}) })
    stats: Stats;

    @Prop({ type: String, default: 'default_avatar' })
    eqquipedSkin: string
}

export const CharacterSchema = SchemaFactory.createForClass(Character)