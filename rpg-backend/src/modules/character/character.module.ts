import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Character, CharacterSchema } from "./schema/character-schema";
import { CharacterService } from "./character.service";
import { CharacterController } from "./character.controller";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Character.name, schema: CharacterSchema }])
    ],
    controllers: [
        CharacterController
    ],
    providers: [
        CharacterService
    ],
    exports: [
        CharacterService,
        MongooseModule
    ]
})
export class CharacterModule { }