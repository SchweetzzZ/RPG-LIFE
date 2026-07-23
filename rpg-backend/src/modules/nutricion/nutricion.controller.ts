import { Controller, Get } from "@nestjs/common";
import { NutritionService } from "./nutricion.service";

@Controller()
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Get("search")
    async get
}