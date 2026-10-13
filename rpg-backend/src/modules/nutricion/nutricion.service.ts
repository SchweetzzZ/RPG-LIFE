import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose";
import { Taco, TacoDocument } from "./schema/tacoLod-dto";
import { Model, Types } from "mongoose";
import { FoodResultDto } from "./dto/food-dto";
import { FoodLog, FoodLogDocument } from "./schema/food-Log-schema";
import { CreateFoodLogDto } from "./dto/nutrition-dto"
import { ProfileService } from "../profile/profile.service";
import { toUserDate } from "../common/utils/user-date";
import { NotFoundException } from "@nestjs/common";
import { escapeRegex, normalizeSearch } from "./search-key";

@Injectable()
export class NutritionService {
    constructor(
        @InjectModel(Taco.name)
        private readonly tacoModel: Model<TacoDocument>,
        @InjectModel(FoodLog.name)
        private readonly foodLogModel: Model<FoodLogDocument>,
        private readonly profileService: ProfileService,
    ) { }

    async logFood(userId: string, data: CreateFoodLogDto) {
        const todayStr = data.date || toUserDate(await this.profileService.getTimezone(userId));

        const foodLog = await this.foodLogModel.create({
            user: new Types.ObjectId(userId),
            ...data,
            date: todayStr,
        });

        return foodLog;
    }

    // 2. Busca o resumo de macros consumidos na data especificada (ou hoje)
    async getDailySummary(userId: string, date?: string) {
        const targetDate = date || toUserDate(await this.profileService.getTimezone(userId));

        const logs = await this.foodLogModel.find({
            user: new Types.ObjectId(userId),
            date: targetDate,
        }).lean().exec();

        // Soma dos nutrientes no dia
        const totals = logs.reduce(
            (acc, item) => {
                acc.calories += item.calories;
                acc.proteinGrams += item.proteinGrams;
                acc.carbGrams += item.carbGrams;
                acc.fatGrams += item.fatGrams;
                return acc;
            },
            { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
        );

        return {
            date: targetDate,
            totals,
            logs, // Lista detalhada de cada refeição do dia
        };
    }

    async deleteFoodLog(userId: string, logId: string) {
        const deleted = await this.foodLogModel.findOneAndDelete({
            _id: logId,
            user: new Types.ObjectId(userId),
        });

        if (!deleted) {
            throw new NotFoundException('Registro de alimento não encontrado');
        }

        return { message: 'Item removido do diário alimentar com sucesso' };
    }

    /** TACO e Open Food Facts em paralelo. Se uma fonte falhar, a outra ainda responde. */
    async searchFoods(query: string): Promise<FoodResultDto[]> {
        const [taco, off] = await Promise.all([this.searchTaco(query), this.searchOpenFoodFacts(query)]);
        return [...taco, ...off];
    }

    private async searchTaco(query: string): Promise<FoodResultDto[]> {
        // Cada palavra precisa aparecer (em qualquer ordem), sem diferenciar acento nem maiuscula
        const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return [];

        const items = await this.tacoModel
            .find({
                $or: [
                    { $and: tokens.map((token) => ({ searchKey: { $regex: escapeRegex(token) } })) },
                    // Documentos antigos, sem searchKey
                    { searchKey: { $exists: false }, description: { $regex: escapeRegex(query.trim()), $options: 'i' } },
                ],
            })
            .limit(40)
            .lean()
            .exec();

        // Nome mais curto primeiro: "Frango, peito, grelhado" antes de "Empada de frango, pre-cozida, assada"
        return items
            .sort((a, b) => a.description.length - b.description.length)
            .slice(0, 10)
            .map((item) => ({
                id: String(item._id),
                name: item.description,
                source: 'TACO' as const,
                servingSizeGrams: 100,
                nutrientsPer100g: {
                    calories: item.energyKcal,
                    protein: item.protein,
                    carbs: item.carbohydrates,
                    fat: item.lipids,
                    fiber: item.fiber,
                },
            }));
    }

    private async searchOpenFoodFacts(query: string): Promise<FoodResultDto[]> {
        try {
            const url =
                `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
                `&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,brands,nutriments`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'LifeRPGApp - Web/Backend - Version 1.0' },
                signal: AbortSignal.timeout(8000),
            });
            if (!response.ok) {
                console.error(`Open Food Facts respondeu ${response.status} na busca por "${query}"`);
                return [];
            }

            const data: any = await response.json();
            if (!data || !Array.isArray(data.products)) return [];

            return data.products
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
                }))
                .filter((f: FoodResultDto) => f.nutrientsPer100g.calories > 0);
        } catch (error: any) {
            console.error('Erro ao consultar Open Food Facts:', error.message);
            return [];
        }
    }

    async searchByBarcode(barcode: string): Promise<FoodResultDto | null> {
        try {
            const url = `https://br.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'LifeRPGApp - Web/Backend - Version 1.0' },
            });

            const data: any = await response.json();

            if (data && data.product && data.status === 1) {
                const p = data.product;
                return {
                    id: p.code || barcode,
                    name: p.product_name || 'Produto sem nome',
                    brand: p.brands,
                    source: 'OPEN_FOOD_FACTS' as const,
                    barcode: p.code || barcode,
                    servingSizeGrams: 100,
                    nutrientsPer100g: {
                        calories: p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || 0,
                        protein: p.nutriments?.proteins_100g || 0,
                        carbs: p.nutriments?.carbohydrates_100g || 0,
                        fat: p.nutriments?.fat_100g || 0,
                        fiber: p.nutriments?.fiber_100g || 0,
                    },
                };
            }
        } catch (error: any) {
            console.error('Erro ao consultar Open Food Facts por código de barras:', error.message);
        }

        return null;
    }
}