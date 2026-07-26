import { Controller, Get, Query } from "@nestjs/common";
import { NutritionService } from "./nutricion.service";
import { FoodResultDto } from "../habit/dto/food-dto";

@Controller()
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Get("search")
    async getAllFoods(@Query('q') query: string): Promise<FoodResultDto[]> {
        if (!query) {
            return []
        }
        return this.nutritionService.searchFoods(query)
    }
}