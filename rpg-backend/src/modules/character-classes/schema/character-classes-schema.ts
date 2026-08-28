import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document, Types } from "mongoose"
import { Character } from "src/modules/character/schema/character-schema"

export class CharacterClassesDocument extends Document {

}

@Schema({ timestamps: true, collection: 'character-classes' })
export class CharacterClassesSchema {

    @Prop({ type: Types.ObjectId, required: true })
    id: Types.ObjectId

    @Prop({ type: Types.ObjectId, required: true, ref: Character.name })
    characterId: Types.ObjectId

    @Prop({ required: true })
    name: string

    @Prop()
    description: string

    @Prop()
    price: number

    @Prop()
    isActive: boolean

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

}

export const CharacterClassesSchemaFactory = SchemaFactory.createForClass(CharacterClassesSchema)