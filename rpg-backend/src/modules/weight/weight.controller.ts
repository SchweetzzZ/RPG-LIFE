import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeightService } from './weight.service';
import {
    PutWeightDto,
    WeightDateParamDto,
    WeightMutationResponseDto,
    WeightQueryDto,
    WeightResponseDto,
} from './dto/weight-dto';

@ApiTags('Weight')
@ApiBearerAuth()
@Controller('weight')
@UseGuards(JwtAuthGuard)
export class WeightController {
    constructor(private readonly weightService: WeightService) { }

    @Get()
    @ApiOperation({ summary: 'Pesagens do período (com média móvel de 7 dias) e resumo: início, atual, variação e meta' })
    @ApiOkResponse({ type: WeightResponseDto, description: 'Diário de peso' })
    async getWeight(
        @CurrentUser('sub') userId: string,
        @Query() query: WeightQueryDto,
    ): Promise<WeightResponseDto> {
        return this.weightService.getWeight(userId, query.from, query.to);
    }

    @Put(':date')
    @ApiOperation({ summary: 'Cria ou substitui o peso do dia (não aceita dia futuro). Se for o mais recente, atualiza o perfil e as metas.' })
    @ApiOkResponse({ type: WeightMutationResponseDto, description: 'Peso registrado' })
    async putWeight(
        @CurrentUser('sub') userId: string,
        @Param() params: WeightDateParamDto,
        @Body() dto: PutWeightDto,
    ): Promise<WeightMutationResponseDto> {
        return this.weightService.putWeight(userId, params.date, dto.weightKg);
    }

    @Delete(':date')
    @ApiOperation({ summary: 'Apaga o peso do dia. Se era o mais recente, o perfil volta para o anterior.' })
    @ApiOkResponse({ type: WeightMutationResponseDto, description: 'Peso apagado' })
    async deleteWeight(
        @CurrentUser('sub') userId: string,
        @Param() params: WeightDateParamDto,
    ): Promise<WeightMutationResponseDto> {
        return this.weightService.deleteWeight(userId, params.date);
    }
}
