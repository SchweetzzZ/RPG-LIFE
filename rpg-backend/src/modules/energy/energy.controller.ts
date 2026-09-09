import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { EnergyService } from "./energy.service";
import { JwtAuthGuard } from "../common/guards/jwt-guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
    EnergyQueryDto,
    EnergyDailySummaryResponseDto,
    WeeklyBudgetResponseDto,
} from "./dto/energy-dto";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse } from "@nestjs/swagger";

@ApiTags('Energy')
@ApiBearerAuth()
@Controller('energy')
@UseGuards(JwtAuthGuard)
export class EnergyController {
    constructor(private readonly energyService: EnergyService) { }

    @Get('daily-summary')
    @ApiOperation({ summary: 'Obtém o resumo calórico diário (TMB, GET, Treinos, Passos, Refeições e Saldo)' })
    @ApiOkResponse({
        type: EnergyDailySummaryResponseDto,
        description: 'Resumo calórico e detalhamento por atividade retornado com sucesso',
    })
    async getDailySummary(
        @CurrentUser('sub') userId: string,
        @Query() query: EnergyQueryDto,
    ) {
        return this.energyService.getDailySummary(userId, query.date);
    }

    @Get('weekly-budget')
    @ApiOperation({ summary: 'Obtém o orçamento calórico semanal e o buffer acumulado para o fim de semana (Cofre)' })
    @ApiOkResponse({
        type: WeeklyBudgetResponseDto,
        description: 'Orçamento semanal retornado com sucesso',
    })
    async getWeeklyBudget(@CurrentUser('sub') userId: string) {
        return this.energyService.getWeeklyBudget(userId);
    }
}
