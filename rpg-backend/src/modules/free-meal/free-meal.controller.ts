import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FreeMealService } from './free-meal.service';
import {
    CreateFreeMealDto,
    FreeMealIdParamDto,
    FreeMealResponseDto,
    FreeMealTemplateResponseDto,
    NextFreeMealResponseDto,
    RedeemFreeMealDto,
    RedeemFreeMealResponseDto,
} from './dto/free-meal-dto';

@ApiTags('Free meal')
@ApiBearerAuth()
@Controller('free-meal-templates')
@UseGuards(JwtAuthGuard)
export class FreeMealTemplateController {
    constructor(private readonly freeMealService: FreeMealService) { }

    @Get()
    @ApiOperation({ summary: 'Catálogo do montador: refeições típicas com itens, kcal, fonte de cada número e atalhos leve/média/pesada' })
    @ApiOkResponse({ type: FreeMealTemplateResponseDto, isArray: true, description: 'Catálogo de refeições livres' })
    async list(): Promise<FreeMealTemplateResponseDto[]> {
        return this.freeMealService.listTemplates();
    }
}

@ApiTags('Free meal')
@ApiBearerAuth()
@Controller('free-meals')
@UseGuards(JwtAuthGuard)
export class FreeMealController {
    constructor(private readonly freeMealService: FreeMealService) { }

    @Post()
    @ApiOperation({ summary: 'Agenda uma refeição livre (semana: até domingo, 100 moedas; dia: só hoje, 40 moedas)' })
    @ApiCreatedResponse({ type: FreeMealResponseDto, description: 'Refeição livre agendada' })
    async create(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreateFreeMealDto,
    ): Promise<FreeMealResponseDto> {
        return this.freeMealService.create(userId, dto);
    }

    // 'next' declarado antes de ':id'
    @Get('next')
    @ApiOperation({ summary: 'Próxima refeição livre (da semana e do dia): saldos, o que falta, kcal por dia, previsão e sugestão de adiar' })
    @ApiOkResponse({ type: NextFreeMealResponseDto, description: 'Situação das refeições livres ativas' })
    async next(@CurrentUser('sub') userId: string): Promise<NextFreeMealResponseDto> {
        return this.freeMealService.next(userId);
    }

    @Get()
    @ApiOperation({ summary: 'Galeria de conquistas: refeições livres resgatadas, mais recentes primeiro' })
    @ApiOkResponse({ type: FreeMealResponseDto, isArray: true, description: 'Refeições livres resgatadas' })
    async gallery(@CurrentUser('sub') userId: string): Promise<FreeMealResponseDto[]> {
        return this.freeMealService.gallery(userId);
    }

    @Post(':id/redeem')
    @HttpCode(200)
    @ApiOperation({ summary: 'Resgata a refeição livre (exige kcal e moedas). Idempotente: chamar de novo não cobra em dobro.' })
    @ApiOkResponse({ type: RedeemFreeMealResponseDto, description: 'Refeição livre resgatada' })
    async redeem(
        @CurrentUser('sub') userId: string,
        @Param() params: FreeMealIdParamDto,
        @Body() dto: RedeemFreeMealDto,
    ): Promise<RedeemFreeMealResponseDto> {
        return this.freeMealService.redeem(userId, params.id, dto?.actualItems);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancela a refeição livre (só se ainda não foi resgatada)' })
    @ApiOkResponse({ type: FreeMealResponseDto, description: 'Refeição livre cancelada' })
    async cancel(
        @CurrentUser('sub') userId: string,
        @Param() params: FreeMealIdParamDto,
    ): Promise<FreeMealResponseDto> {
        return this.freeMealService.cancel(userId, params.id);
    }
}
