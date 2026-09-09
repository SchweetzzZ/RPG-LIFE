import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose";
import { CharacterClassSchema, CharacterClassSchemaFactory } from "./schema/character-class-schema";
import { CharacterClassesController } from "./character-classes.controller";
import { CharacterClassService } from "./character-classes.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CharacterClassSchema.name, schema: CharacterClassSchemaFactory }
        ])
    ],
    controllers: [CharacterClassesController],
    providers: [CharacterClassService],
    exports: [CharacterClassService, MongooseModule]


})
export class CharacterClassesModule { }