import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodLog, FoodLogSchema } from './schema/food-Log-schema';
import { Taco, TacoSchema } from './schema/tacoLod-dto';
import { FavoriteFood, FavoriteFoodSchema } from './schema/favorite-food.schema';
import { SavedMeal, SavedMealSchema } from './schema/saved-meal.schema';
import { DayClose, DayCloseSchema } from '../day/schema/day-close.schema';
import { NutritionService } from './nutricion.service';
import { NutritionController } from './nutricion.controller';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: FoodLog.name, schema: FoodLogSchema },
            { name: Taco.name, schema: TacoSchema },
            { name: FavoriteFood.name, schema: FavoriteFoodSchema },
            { name: SavedMeal.name, schema: SavedMealSchema },
            // So leitura: saber se o dia ja foi fechado (o DayModule e o dono da colecao)
            { name: DayClose.name, schema: DayCloseSchema },
        ]),
        ProfileModule,
    ],
    controllers: [NutritionController],
    providers: [NutritionService],
    exports: [NutritionService, MongooseModule],
})
export class NutritionModule { }
