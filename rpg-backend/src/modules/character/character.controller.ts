import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CharacterService } from './character.service';
import { AddXpAndCoinDto } from './dto/character-dto';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('character')
@UseGuards(JwtAuthGuard)
export class CharacterController {
    constructor(private readonly characterService: CharacterService) { }

    // POST /character/xp → Adiciona XP e coins ao personagem
    @Post('xp')
    async addXp(
        @CurrentUser('sub') userId: string,
        @Body() dto: AddXpAndCoinDto,
    ) {
        return this.characterService.addXpAndCoin(userId, dto);
    }
}
