import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DayClose, DayCloseSchema } from './schema/day-close.schema';
import { FreeMeal, FreeMealSchema } from '../free-meal/schema/free-meal.schema';
import { DayService } from './day.service';
import { DayController } from './day.controller';
import { ProfileModule } from '../profile/profile.module';
import { EnergyModule } from '../energy/energy.module';
import { VaultModule } from '../vault/vault.module';
import { EconomyModule } from '../economy/economy.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
    imports: [
        // FreeMeal direto pelo model (o FreeMealModule ja importa o DayModule)
        MongooseModule.forFeature([
            { name: DayClose.name, schema: DayCloseSchema },
            { name: FreeMeal.name, schema: FreeMealSchema },
        ]),
        ProfileModule,
        EnergyModule,
        VaultModule,
        EconomyModule,
        ProgressModule,
    ],
    controllers: [DayController],
    providers: [DayService],
    exports: [DayService],
})
export class DayModule { }
