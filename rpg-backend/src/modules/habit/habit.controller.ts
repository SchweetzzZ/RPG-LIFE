import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { HabitService } from './habit.service';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Habit } from './schema/habit-schema';
import { LogStepsDto } from './dto/step-dto';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitController {
    constructor(private readonly habitService: HabitService) { }

    @Get()
    async getUserHabits(@CurrentUser('sub') userId: string) {
        return this.habitService.getUserHabits(userId);
    }

    @Post()
    async createHabit(
        @CurrentUser('sub') userId: string,
        @Body() dto: Partial<Habit>,
    ) {
        return this.habitService.createHabit(userId, dto);
    }

    @Post(':id/checkin')
    async logProgress(
        @CurrentUser('sub') userId: string,
        @Param('id') habitId: string,
        @Body('progressAmount') progressAmount = 1,
    ) {
        return this.habitService.logProgress(userId, habitId, progressAmount);
    }

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

    @Post('steps')
    async logSteps(
        @CurrentUser('sub') userId: string,
        @Body() dto: LogStepsDto,
    ) {
        return this.habitService.logSteps(userId, dto.steps, dto.date);
    }

    @Get('steps/today')
    async getTodaySteps(
        @CurrentUser('sub') userId: string,
        @Query('date') date?: string,
    ) {
        return this.habitService.getSteps(userId, date);
    }

    @Get('steps/recommendation')
    async getStepsRecommendation(
        @CurrentUser('sub') userId: string,
    ) {
        return this.habitService.getRecommendedSteps(userId);
    }
}
