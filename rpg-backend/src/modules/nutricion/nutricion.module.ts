import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Taco, TacoFoodSchema } from '../habit/schema/taco-schema';
import { NutritionService } from './nutricion.service';
import { NutritionController } from './nutricion.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Taco.name, schema: TacoFoodSchema }]),
    ],
    controllers: [NutritionController],
    providers: [NutritionService],
    exports: [NutritionService],
})
export class NutritionModule { }
