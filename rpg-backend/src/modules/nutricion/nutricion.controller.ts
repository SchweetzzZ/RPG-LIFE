import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { NutritionService } from "./nutricion.service";
import { JwtAuthGuard } from "../common/guards/jwt-guard";
import { DailySummaryQueryDto, SearchFoodQueryDto } from "./dto/nutrition-dto";
import { CreateFoodLogDto } from "./dto/nutrition-dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller('nutrition')
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Post('log')
    @UseGuards(JwtAuthGuard)
    async createLog(@CurrentUser('sub') userId: string, @Body() dto: CreateFoodLogDto) {
        return this.nutritionService.logFood(userId, dto)
    }

    @Get('getDailySummary')
    @UseGuards(JwtAuthGuard)
    async getDailySumaty(@CurrentUser('sub') userId: string, @Query() queryDto: DailySummaryQueryDto) {
        return this.nutritionService.getDailySummary(userId, queryDto.date)
    }

    @Delete('log/:id')
    @UseGuards(JwtAuthGuard)
    async deleteLog(@CurrentUser('sub') userId: string, @Param('id') logId: string) {
        return this.nutritionService.deleteFoodLog(userId, logId)
    }

    @Get("search")
    @UseGuards(JwtAuthGuard)
    async getAllFoods(@Query() queryDto: SearchFoodQueryDto) {
        return this.nutritionService.searchFoods(queryDto.q)
    }

    @Get('barcode/:barcode')
    @UseGuards(JwtAuthGuard)
    async getByBarcode(@Param('barcode') barcode: string) {
        return this.nutritionService.searchByBarcode(barcode);
    }
}