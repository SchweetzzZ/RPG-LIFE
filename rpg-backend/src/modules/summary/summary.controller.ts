import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SummaryService } from './summary.service';
import {
    MarkWeekSeenDto,
    MarkWeekSeenResponseDto,
    WeekSummaryQueryDto,
    WeekSummaryResponseDto,
    WeekSummaryStatusResponseDto,
} from './dto/summary-dto';

@ApiTags('Summary')
@ApiBearerAuth()
@Controller('summary')
@UseGuards(JwtAuthGuard)
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) { }

    // 'week/status' e 'week/seen' declarados antes de 'week'
    @Get('week/status')
    @ApiOperation({ summary: 'Se o resumo da semana passada deve aparecer agora (ainda não visto e houve atividade)' })
    @ApiOkResponse({ type: WeekSummaryStatusResponseDto, description: 'Situação do resumo da semana' })
    async getStatus(@CurrentUser('sub') userId: string): Promise<WeekSummaryStatusResponseDto> {
        return this.summaryService.getStatus(userId);
    }

    @Post('week/seen')
    @HttpCode(200)
    @ApiOperation({ summary: 'Marca o resumo da semana (segunda informada) como visto' })
    @ApiOkResponse({ type: MarkWeekSeenResponseDto, description: 'Resumo marcado como visto' })
    async markSeen(
        @CurrentUser('sub') userId: string,
        @Body() dto: MarkWeekSeenDto,
    ): Promise<MarkWeekSeenResponseDto> {
        return this.summaryService.markSeen(userId, dto.start);
    }

    @Get('week')
    @ApiOperation({ summary: 'Resumo da semana (segunda a domingo): dias fechados, cofre, refeição livre, treinos, moedas, sequência e peso' })
    @ApiOkResponse({ type: WeekSummaryResponseDto, description: 'Resumo da semana' })
    async getWeek(
        @CurrentUser('sub') userId: string,
        @Query() query: WeekSummaryQueryDto,
    ): Promise<WeekSummaryResponseDto> {
        return this.summaryService.getWeek(userId, query.start);
    }
}
