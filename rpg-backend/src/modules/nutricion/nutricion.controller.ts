import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { NutritionService } from "./nutricion.service";
import { JwtAuthGuard } from "../common/guards/jwt-guard";
import {
    CopiedLogsResponseDto,
    CopyMealDto,
    CreateFoodLogDto,
    CreateSavedMealDto,
    DailySummaryQueryDto,
    DailySummaryResponseDto,
    DeletedResponseDto,
    FoodLogDeletedResponseDto,
    FoodLogResponseDto,
    LogSavedMealDto,
    SavedMealResponseDto,
    SearchFoodQueryDto,
} from "./dto/nutrition-dto";
import {
    CreateFavoriteFoodDto,
    FavoriteFoodResponseDto,
    FoodResultDto,
    RecentFoodResponseDto,
} from "./dto/food-dto";
import { toFavoriteResponse, toFoodLogResponse, toSavedMealResponse } from "./nutrition.mapper";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags('Nutrition')
@ApiBearerAuth()
@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Post('log')
    @ApiCreatedResponse({ type: FoodLogResponseDto, description: 'Alimento registrado no diario' })
    @ApiBadRequestResponse({ description: 'O dia ja foi fechado' })
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
    @ApiBadRequestResponse({ description: 'O dia ja foi fechado' })
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

    // ── Copiar refeição (F2) ─────────────────────────────────────────────────

    @Post('log/copy')
    @ApiCreatedResponse({ type: CopiedLogsResponseDto, description: 'Itens da refeicao copiados para hoje' })
    @ApiBadRequestResponse({ description: 'Hoje ja foi fechado ou a origem e invalida' })
    @ApiNotFoundResponse({ description: 'A refeicao de origem esta vazia' })
    async copyMeal(@CurrentUser('sub') userId: string, @Body() dto: CopyMealDto): Promise<CopiedLogsResponseDto> {
        const result = await this.nutritionService.copyMeal(userId, dto);
        return { copied: result.copied, logs: result.logs.map(toFoodLogResponse) };
    }

    // ── Recentes e favoritos (F1) ────────────────────────────────────────────

    @Get('recent')
    @ApiOkResponse({ type: RecentFoodResponseDto, isArray: true, description: 'Alimentos mais usados nos ultimos 30 dias' })
    async getRecent(@CurrentUser('sub') userId: string): Promise<RecentFoodResponseDto[]> {
        return this.nutritionService.getRecentFoods(userId);
    }

    @Get('favorites')
    @ApiOkResponse({ type: FavoriteFoodResponseDto, isArray: true, description: 'Alimentos favoritos' })
    async getFavorites(@CurrentUser('sub') userId: string): Promise<FavoriteFoodResponseDto[]> {
        const favorites = await this.nutritionService.getFavorites(userId);
        return favorites.map(toFavoriteResponse);
    }

    @Post('favorites')
    @ApiCreatedResponse({ type: FavoriteFoodResponseDto, description: 'Alimento marcado como favorito' })
    async addFavorite(@CurrentUser('sub') userId: string, @Body() dto: CreateFavoriteFoodDto): Promise<FavoriteFoodResponseDto> {
        return toFavoriteResponse(await this.nutritionService.addFavorite(userId, dto));
    }

    @Delete('favorites/:id')
    @ApiOkResponse({ type: DeletedResponseDto, description: 'Favorito removido' })
    @ApiNotFoundResponse({ description: 'Favorito nao encontrado' })
    async removeFavorite(@CurrentUser('sub') userId: string, @Param('id') favoriteId: string): Promise<DeletedResponseDto> {
        return this.nutritionService.removeFavorite(userId, favoriteId);
    }

    // ── Refeições prontas (F2) ───────────────────────────────────────────────

    @Get('saved-meals')
    @ApiOkResponse({ type: SavedMealResponseDto, isArray: true, description: 'Refeicoes prontas' })
    async getSavedMeals(@CurrentUser('sub') userId: string): Promise<SavedMealResponseDto[]> {
        const meals = await this.nutritionService.getSavedMeals(userId);
        return meals.map(toSavedMealResponse);
    }

    @Post('saved-meals')
    @ApiCreatedResponse({ type: SavedMealResponseDto, description: 'Refeicao do diario salva como refeicao pronta' })
    @ApiBadRequestResponse({ description: 'A refeicao de origem esta vazia' })
    async createSavedMeal(@CurrentUser('sub') userId: string, @Body() dto: CreateSavedMealDto): Promise<SavedMealResponseDto> {
        return toSavedMealResponse(await this.nutritionService.createSavedMeal(userId, dto));
    }

    @Delete('saved-meals/:id')
    @ApiOkResponse({ type: DeletedResponseDto, description: 'Refeicao pronta removida' })
    @ApiNotFoundResponse({ description: 'Refeicao pronta nao encontrada' })
    async deleteSavedMeal(@CurrentUser('sub') userId: string, @Param('id') savedMealId: string): Promise<DeletedResponseDto> {
        return this.nutritionService.deleteSavedMeal(userId, savedMealId);
    }

    @Post('saved-meals/:id/log')
    @ApiCreatedResponse({ type: CopiedLogsResponseDto, description: 'Itens da refeicao pronta registrados hoje' })
    @ApiBadRequestResponse({ description: 'Hoje ja foi fechado' })
    @ApiNotFoundResponse({ description: 'Refeicao pronta nao encontrada' })
    async logSavedMeal(
        @CurrentUser('sub') userId: string,
        @Param('id') savedMealId: string,
        @Body() dto: LogSavedMealDto,
    ): Promise<CopiedLogsResponseDto> {
        const result = await this.nutritionService.logSavedMeal(userId, savedMealId, dto.mealType);
        return { copied: result.copied, logs: result.logs.map(toFoodLogResponse) };
    }
}
