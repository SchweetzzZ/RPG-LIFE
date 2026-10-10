import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FreeMeal, FreeMealSchema } from './schema/free-meal.schema';
import { FreeMealTemplate, FreeMealTemplateSchema } from './schema/free-meal-template.schema';
import { FreeMealService } from './free-meal.service';
import { FreeMealController, FreeMealTemplateController } from './free-meal.controller';
import { ProfileModule } from '../profile/profile.module';
import { VaultModule } from '../vault/vault.module';
import { EconomyModule } from '../economy/economy.module';
import { EnergyModule } from '../energy/energy.module';
import { DayModule } from '../day/day.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: FreeMeal.name, schema: FreeMealSchema },
            { name: FreeMealTemplate.name, schema: FreeMealTemplateSchema },
        ]),
        ProfileModule,
        VaultModule,
        EconomyModule,
        EnergyModule,
        DayModule,
    ],
    controllers: [FreeMealTemplateController, FreeMealController],
    providers: [FreeMealService],
    exports: [FreeMealService],
})
export class FreeMealModule { }
