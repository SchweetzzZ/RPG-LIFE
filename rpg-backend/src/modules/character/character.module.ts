import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Character, CharacterSchema } from "./schema/character-schema";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Character.name, schema: CharacterSchema }])
    ],
    exports: [
        MongooseModule
    ]

})

export class CharacterModule { }