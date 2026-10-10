import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { NutritionService } from "./nutricion.service";
import { JwtAuthGuard } from "../common/guards/jwt-guard";
import {
    CreateFoodLogDto,
    DailySummaryQueryDto,
    DailySummaryResponseDto,
    FoodLogDeletedResponseDto,
    FoodLogResponseDto,
    SearchFoodQueryDto,
} from "./dto/nutrition-dto";
import { FoodResultDto } from "./dto/food-dto";
import { toFoodLogResponse } from "./nutrition.mapper";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags('Nutrition')
@ApiBearerAuth()
@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Post('log')
    @ApiCreatedResponse({ type: FoodLogResponseDto, description: 'Alimento registrado no diario' })
    async createLog(@CurrentUser('sub') userId: string, @Body() dto: CreateFoodLogDto): Promise<FoodLogResponseDto> {
        const log = await this.nutritionService.logFood(userId, dto);
        return toFoodLogResponse(log);
    }

    @Get('getDailySummary')
    @ApiOkResponse({ type: DailySummaryResponseDto, description: 'Totais de macros e registros do dia' })
    async getDailySumaty(@CurrentUser('sub') userId: string, @Query() queryDto: DailySummaryQueryDto): Promise<DailySummaryResponseDto> {
        const summary = await this.nutritionService.getDailySummary(userId, queryDto.date);
        return {
            ...summary,
            logs: summary.logs.map(toFoodLogResponse),
        };
    }

    @Delete('log/:id')
    @ApiOkResponse({ type: FoodLogDeletedResponseDto, description: 'Registro removido' })
    async deleteLog(@CurrentUser('sub') userId: string, @Param('id') logId: string): Promise<FoodLogDeletedResponseDto> {
        return this.nutritionService.deleteFoodLog(userId, logId);
    }

    @Get("search")
    @ApiOkResponse({ type: FoodResultDto, isArray: true, description: 'Alimentos da TACO e do Open Food Facts' })
    async getAllFoods(@Query() queryDto: SearchFoodQueryDto): Promise<FoodResultDto[]> {
        return this.nutritionService.searchFoods(queryDto.q);
    }

    @Get('barcode/:barcode')
    @ApiOkResponse({ type: FoodResultDto, description: 'Produto encontrado pelo codigo de barras' })
    @ApiNotFoundResponse({ description: 'Produto nao encontrado' })
    async getByBarcode(@Param('barcode') barcode: string): Promise<FoodResultDto> {
        const food = await this.nutritionService.searchByBarcode(barcode);
        if (!food) {
            throw new NotFoundException('Produto nao encontrado');
        }
        return food;
    }
}
