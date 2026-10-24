import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose";
import { Taco, TacoDocument } from "./schema/tacoLod-dto";
import { Model, Types } from "mongoose";
import { CreateFavoriteFoodDto, FoodResultDto } from "./dto/food-dto";
import { FoodLog, FoodLogDocument, MealType } from "./schema/food-Log-schema";
import { CopyMealDto, CreateFoodLogDto, CreateSavedMealDto } from "./dto/nutrition-dto"
import { ProfileService } from "../profile/profile.service";
import { addDays, toUserDate } from "../common/utils/user-date";
import { escapeRegex, normalizeSearch } from "./search-key";
import { DayClose, DayCloseDocument } from "../day/schema/day-close.schema";
import { FavoriteFood, FavoriteFoodDocument } from "./schema/favorite-food.schema";
import { SavedMeal, SavedMealDocument } from "./schema/saved-meal.schema";
import { buildRecentFoods, copyableFields } from "./recent-foods";

/** Janela dos "recentes": o que foi registrado nos ultimos 30 dias. */
const RECENT_WINDOW_DAYS = 30;
const RECENT_LIMIT = 15;
/** Teto de registros lidos para montar os recentes (~4 refeicoes x 4 itens x 30 dias). */
const RECENT_SCAN_LIMIT = 500;

export const CLOSED_DAY_MESSAGE = 'Esse dia já foi fechado. O diário de um dia fechado não pode mudar.';

@Injectable()
export class NutritionService {
    constructor(
        @InjectModel(Taco.name)
        private readonly tacoModel: Model<TacoDocument>,
        @InjectModel(FoodLog.name)
        private readonly foodLogModel: Model<FoodLogDocument>,
        // DayClose direto pelo model (como o DayModule faz com FreeMeal), sem importar o DayModule
        @InjectModel(DayClose.name)
        private readonly dayCloseModel: Model<DayCloseDocument>,
        @InjectModel(FavoriteFood.name)
        private readonly favoriteModel: Model<FavoriteFoodDocument>,
        @InjectModel(SavedMeal.name)
        private readonly savedMealModel: Model<SavedMealDocument>,
        private readonly profileService: ProfileService,
    ) { }

    private async today(userId: string): Promise<string> {
        return toUserDate(await this.profileService.getTimezone(userId));
    }

    /**
     * O fechamento grava o consumo do dia (consumedKcal) e mexe no cofre. Mudar o diario depois
     * deixaria o cofre fora de sincronia, entao registrar e remover em dia fechado e bloqueado.
     */
    private async assertDayOpen(userId: string, date: string): Promise<void> {
        const closed = await this.dayCloseModel.exists({ user: new Types.ObjectId(userId), date });
        if (closed) {
            throw new BadRequestException(CLOSED_DAY_MESSAGE);
        }
    }

    async logFood(userId: string, data: CreateFoodLogDto) {
        const todayStr = data.date || (await this.today(userId));
        await this.assertDayOpen(userId, todayStr);

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
        const filter = Types.ObjectId.isValid(logId)
            ? { _id: new Types.ObjectId(logId), user: new Types.ObjectId(userId) }
            : null;
        const log = filter ? await this.foodLogModel.findOne(filter).select('date').lean().exec() : null;
        if (!filter || !log) {
            throw new NotFoundException('Registro de alimento não encontrado');
        }
        await this.assertDayOpen(userId, log.date);

        await this.foodLogModel.deleteOne(filter).exec();
        return { message: 'Item removido do diário alimentar com sucesso' };
    }

    // ── Copiar refeição (F2) ─────────────────────────────────────────────────

    /** Copia os itens de uma refeição de `fromDate` para hoje (mesma refeição ou `toMealType`). */
    async copyMeal(userId: string, dto: CopyMealDto) {
        const today = await this.today(userId);
        const toMealType = dto.toMealType ?? dto.mealType;
        if (dto.fromDate > today) {
            throw new BadRequestException('Não dá para copiar de um dia que ainda não chegou');
        }
        if (dto.fromDate === today && toMealType === dto.mealType) {
            throw new BadRequestException('Escolha outra refeição ou outro dia para copiar');
        }
        await this.assertDayOpen(userId, today);

        const user = new Types.ObjectId(userId);
        const source = await this.foodLogModel
            .find({ user, date: dto.fromDate, mealType: dto.mealType })
            .sort({ createdAt: 1 })
            .lean()
            .exec();
        if (source.length === 0) {
            throw new NotFoundException('Essa refeição não tem itens para copiar');
        }

        const logs = await this.foodLogModel.insertMany(
            source.map((log) => ({ ...copyableFields(log), user, date: today, mealType: toMealType })),
        );
        return { copied: logs.length, logs };
    }

    // ── Recentes e favoritos (F1) ────────────────────────────────────────────

    async getRecentFoods(userId: string) {
        const today = await this.today(userId);
        const logs = await this.foodLogModel
            .find({ user: new Types.ObjectId(userId), date: { $gte: addDays(today, -RECENT_WINDOW_DAYS), $lte: today } })
            .sort({ date: -1, createdAt: -1 })
            .limit(RECENT_SCAN_LIMIT)
            .lean()
            .exec();
        return buildRecentFoods(logs, RECENT_LIMIT);
    }

    async getFavorites(userId: string) {
        return this.favoriteModel.find({ user: new Types.ObjectId(userId) }).sort({ name: 1 }).lean().exec();
    }

    /** Marca como favorito. Marcar de novo o mesmo alimento so atualiza os dados (idempotente). */
    async addFavorite(userId: string, dto: CreateFavoriteFoodDto) {
        const user = new Types.ObjectId(userId);
        const favorite = await this.favoriteModel
            .findOneAndUpdate(
                { user, source: dto.source, sourceId: dto.id },
                {
                    $set: {
                        name: dto.name,
                        brand: dto.brand,
                        barcode: dto.barcode,
                        nutrientsPer100g: dto.nutrientsPer100g,
                        servingSizeGrams: dto.servingSizeGrams,
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true },
            )
            .lean()
            .exec();
        if (!favorite) {
            throw new NotFoundException('Favorito não encontrado');
        }
        return favorite;
    }

    async removeFavorite(userId: string, favoriteId: string) {
        const deleted = Types.ObjectId.isValid(favoriteId)
            ? await this.favoriteModel.findOneAndDelete({ _id: new Types.ObjectId(favoriteId), user: new Types.ObjectId(userId) }).exec()
            : null;
        if (!deleted) {
            throw new NotFoundException('Favorito não encontrado');
        }
        return { message: 'Favorito removido' };
    }

    // ── Refeições prontas (F2) ───────────────────────────────────────────────

    async getSavedMeals(userId: string) {
        return this.savedMealModel.find({ user: new Types.ObjectId(userId) }).sort({ name: 1 }).lean().exec();
    }

    /** Salva os itens de uma refeição do diário como refeição pronta. */
    async createSavedMeal(userId: string, dto: CreateSavedMealDto) {
        const user = new Types.ObjectId(userId);
        const logs = await this.foodLogModel
            .find({ user, date: dto.fromDate, mealType: dto.mealType })
            .sort({ createdAt: 1 })
            .lean()
            .exec();
        if (logs.length === 0) {
            throw new BadRequestException('Essa refeição está vazia: registre os alimentos antes de salvar');
        }
        const created = await this.savedMealModel.create({ user, name: dto.name, items: logs.map(copyableFields) });
        return created.toObject();
    }

    async deleteSavedMeal(userId: string, savedMealId: string) {
        const deleted = Types.ObjectId.isValid(savedMealId)
            ? await this.savedMealModel.findOneAndDelete({ _id: new Types.ObjectId(savedMealId), user: new Types.ObjectId(userId) }).exec()
            : null;
        if (!deleted) {
            throw new NotFoundException('Refeição pronta não encontrada');
        }
        return { message: 'Refeição pronta removida' };
    }

    /** Registra todos os itens da refeição pronta hoje, na refeição escolhida. */
    async logSavedMeal(userId: string, savedMealId: string, mealType: MealType) {
        const user = new Types.ObjectId(userId);
        const saved = Types.ObjectId.isValid(savedMealId)
            ? await this.savedMealModel.findOne({ _id: new Types.ObjectId(savedMealId), user }).lean().exec()
            : null;
        if (!saved) {
            throw new NotFoundException('Refeição pronta não encontrada');
        }
        const today = await this.today(userId);
        await this.assertDayOpen(userId, today);

        const logs = await this.foodLogModel.insertMany(
            saved.items.map((item) => ({ ...copyableFields(item), user, date: today, mealType })),
        );
        return { copied: logs.length, logs };
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