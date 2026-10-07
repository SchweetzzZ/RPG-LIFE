import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
    LogStepsDto,
    LogStepsResponseDto,
    GetStepsResponseDto,
    StepsRecommendationResponseDto,
} from './dto/step-dto';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }

    @Post('steps')
    @ApiOkResponse({ type: LogStepsResponseDto, description: 'Passos registrados' })
    async logSteps(
        @CurrentUser('sub') userId: string,
        @Body() dto: LogStepsDto,
    ) {
        return this.activityService.logSteps(userId, dto.steps, dto.date, dto.source);
    }

    @Get('steps/today')
    @ApiOkResponse({ type: GetStepsResponseDto, description: 'Passos do dia (ou da data informada)' })
    async getTodaySteps(
        @CurrentUser('sub') userId: string,
        @Query('date') date?: string,
    ) {
        return this.activityService.getSteps(userId, date);
    }

    @Get('steps/recommendation')
    @ApiOkResponse({ type: StepsRecommendationResponseDto, description: 'Meta diaria de passos recomendada' })
    async getStepsRecommendation(
        @CurrentUser('sub') userId: string,
    ) {
        return this.activityService.getRecommendedSteps(userId);
    }
}
