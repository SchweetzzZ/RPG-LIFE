import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose";
import { Taco, TacoDocument } from "../habit/schema/taco-schema";
import { Model } from "mongoose";
import { HttpService } from "@nestjs/axios";
import { FoodResult } from "./dto/FoodResult-dto";
import { FoodResultDto } from "../habit/dto/food-dto";
import { firstValueFrom } from "rxjs";

@Injectable()
export class NutritionService {
    constructor(
        @InjectModel(Taco.name)
        private readonly tacoModel: Model<TacoDocument>,
        private readonly httpService: HttpService
    ) { }

    async searchFoods(query: string): Promise<FoodResultDto[]> {
        const results: FoodResultDto[] = []

        const tacoItems = await this.tacoModel.find({ description: { $regex: query, $options: "i" } }).limit(10).exec()

        const formatedTaco: FoodResultDto[] = tacoItems.map((item) => ({
            id: item._id.toString(),
            name: item.description,
            source: 'TACO',
            servingSizeGrams: 100,
            nutrientsPer100g: {
                calories: item.energyKcal,
                protein: item.protein,
                carbs: item.carbohydrates,
                fat: item.lipids,
                fiber: item.fiber,
            },
        }))

        results.push(...formatedTaco)

        try {
            const url = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
                query,
            )}&search_simple=1&action=process&json=1&page_size=10`;

            const { data } = await firstValueFrom(
                this.httpService.get(url, {
                    headers: { 'User-Agent': 'LifeRPGApp - Web/Backend - Version 1.0' }, // Boas práticas exigidas pela OFF
                }),
            );

            if (data && data.products) {
                const offItems: FoodResultDto[] = data.products
                    .filter((p: any) => p.product_name && p.nutriments)
                    .map((p: any) => ({
                        id: p.code || p._id,
                        name: p.product_name,
                        brand: p.brands,
                        source: 'OPEN_FOOD_FACTS' as const,
                        barcode: p.code,
                        servingSizeGrams: 100,
                        nutrientsPer100g: {
                            calories: p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0,
                            protein: p.nutriments.proteins_100g || 0,
                            carbs: p.nutriments.carbohydrates_100g || 0,
                            fat: p.nutriments.fat_100g || 0,
                            fiber: p.nutriments.fiber_100g || 0,
                        },
                    }));

                results.push(...offItems);
            }
        } catch (error) {
            // Se a API externa oscilar ou estiver fora, o app não quebra e entrega os resultados da TACO!
            console.error('Erro ao consultar Open Food Facts:', error.message);
        }

        return results;
    }

}