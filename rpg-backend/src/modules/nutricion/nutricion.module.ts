import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodLog, FoodLogSchema } from './schema/food-Log-schema';
import { Taco, TacoSchema } from './schema/tacoLod-dto';
import { NutritionService } from './nutricion.service';
import { NutritionController } from './nutricion.controller';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: FoodLog.name, schema: FoodLogSchema },
            { name: Taco.name, schema: TacoSchema }
        ]),
        ProfileModule,
    ],
    controllers: [NutritionController],
    providers: [NutritionService],
    exports: [NutritionService, MongooseModule],
})
export class NutritionModule { }
