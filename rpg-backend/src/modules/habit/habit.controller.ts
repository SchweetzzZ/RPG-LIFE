import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { HabitService } from './habit.service';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Habit } from './schema/habit-schema';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitController {
    constructor(private readonly habitService: HabitService) { }

    // GET /habits → Lista todos os hábitos do usuário
    @Get()
    async getUserHabits(@CurrentUser('sub') userId: string) {
        return this.habitService.getUserHabits(userId);
    }

    // POST /habits → Cria um novo hábito
    @Post()
    async createHabit(
        @CurrentUser('sub') userId: string,
        @Body() dto: Partial<Habit>,
    ) {
        return this.habitService.createHabit(userId, dto);
    }

    // POST /habits/:id/checkin → Registra progresso no hábito
    @Post(':id/checkin')
    async logProgress(
        @CurrentUser('sub') userId: string,
        @Param('id') habitId: string,
        @Body('progressAmount') progressAmount = 1,
    ) {
        return this.habitService.logProgress(userId, habitId, progressAmount);
    }

    // 🟢 Novas rotas necessárias para a gestão do Front:
    @Patch(':id')
    async updateHabit(
        @CurrentUser('sub') userId: string,
        @Param('id') habitId: string,
        @Body() body: any,
    ) {
        return this.habitService.updateHabit(userId, habitId, body);
    }

    @Delete(':id')
    async deleteHabit(
        @CurrentUser('sub') userId: string,
        @Param('id') habitId: string,
    ) {
        return this.habitService.deleteHabit(userId, habitId);
    }
}
