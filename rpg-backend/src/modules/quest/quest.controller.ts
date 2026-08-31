import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuestService } from './quest.service';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateQuestDto, UpdateQuestDto } from './dto/quest-dto';

@Controller('quests')
@UseGuards(JwtAuthGuard)
export class QuestController {
    constructor(private readonly questService: QuestService) { }

    @Get()
    async getUserQuests(@CurrentUser('sub') userId: string) {
        return this.questService.getUserQuests(userId);
    }

    @Post()
    async createUserQuest(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreateQuestDto, // Validação Zod ativa
    ) {
        return this.questService.createUserQuest(userId, dto);
    }

    @Patch(':id')
    async updateQuest(
        @CurrentUser('sub') userId: string,
        @Param('id') questId: string,
        @Body() dto: UpdateQuestDto, // Validação Zod parcial
    ) {
        return this.questService.updateQuest(userId, questId, dto);
    }

    @Patch(':id/complete')
    async completeQuest(
        @CurrentUser('sub') userId: string,
        @Param('id') questId: string,
    ) {
        return this.questService.completeQuest(userId, questId);
    }

    @Delete(':id')
    async deleteQuest(
        @CurrentUser('sub') userId: string,
        @Param('id') questId: string,
    ) {
        return this.questService.deleteQuest(userId, questId);
    }
}