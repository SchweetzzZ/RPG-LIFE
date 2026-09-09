import { Controller, Post, Patch, Delete, Get, Body } from "@nestjs/common";
import { CharacterClassService } from "./character-classes.service";
import { CreateCharacterClassDto, UpdateCharacterClassDto } from "./dto/character-class-validation";

@Controller()
export class CharacterClassesController {
    constructor(
        private readonly characterClassesService: CharacterClassService
    ) { }

    @Post()
    async createCharacterClass(@Body() dto: CreateCharacterClassDto) {
        return this.characterClassesService.createCharacterClass(dto);
    }

    @Patch()
    async updateCharacterClass(@Body() dto: UpdateCharacterClassDto) {
        return this.characterClassesService.updateCharacterClass(dto);
    }

    @Delete()
    async deleteCharacterClass(@Body() dto: UpdateCharacterClassDto) {
        return this.characterClassesService.deleteCharacterClass(dto);
    }

    @Get()
    async getAllCharacterClasses() {
        return this.characterClassesService.getAllCharacterClasses();
    }
}