import { Controller, Get, Query } from "@nestjs/common";
import { NutritionService } from "./nutricion.service";

@Controller('nutrition')
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Get("search")
    async searchFoods(@Query('query') query: string) {
        return this.nutritionService.searchFoods(query);
    }
}