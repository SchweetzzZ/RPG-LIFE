import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DayService } from './day.service';
import { CloseDayDto, DayCloseResponseDto, DayParamDto, DayStateResponseDto } from './dto/day-dto';

@ApiTags('Day')
@ApiBearerAuth()
@Controller('day')
@UseGuards(JwtAuthGuard)
export class DayController {
    constructor(private readonly dayService: DayService) { }

    // 'close' declarado antes de ':date'
    @Post('close')
    @HttpCode(200)
    @ApiOperation({ summary: 'Fecha o dia (hoje ou ontem): guarda kcal no cofre, paga moedas e atualiza a sequência. Idempotente.' })
    @ApiOkResponse({ type: DayCloseResponseDto, description: 'Dia fechado (ou já estava fechado)' })
    async closeDay(
        @CurrentUser('sub') userId: string,
        @Body() dto: CloseDayDto,
    ): Promise<DayCloseResponseDto> {
        return this.dayService.closeDay(userId, dto.date);
    }

    @Get(':date')
    @ApiOperation({ summary: 'Estado do dia: aberto/fechado, meta, consumido e previsão do que iria para o cofre' })
    @ApiOkResponse({ type: DayStateResponseDto, description: 'Estado do dia' })
    async getDay(
        @CurrentUser('sub') userId: string,
        @Param() params: DayParamDto,
    ): Promise<DayStateResponseDto> {
        return this.dayService.getDay(userId, params.date);
    }
}
