import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DayClose, DayCloseSchema } from '../day/schema/day-close.schema';
import { FreeMeal, FreeMealSchema } from '../free-meal/schema/free-meal.schema';
import { WorkoutLog, WorkoutLogSchema } from '../workout/schemas/workout-log';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { ProfileModule } from '../profile/profile.module';
import { ProgressModule } from '../progress/progress.module';
import { VaultModule } from '../vault/vault.module';
import { EconomyModule } from '../economy/economy.module';
import { WeightModule } from '../weight/weight.module';

@Module({
    imports: [
        // So leitura: os models direto, sem importar os modulos de dia, treino e refeicao livre
        MongooseModule.forFeature([
            { name: DayClose.name, schema: DayCloseSchema },
            { name: FreeMeal.name, schema: FreeMealSchema },
            { name: WorkoutLog.name, schema: WorkoutLogSchema },
        ]),
        ProfileModule,
        ProgressModule,
        VaultModule,   // Cycle e VaultEntry
        EconomyModule, // CoinEntry
        WeightModule,
    ],
    controllers: [SummaryController],
    providers: [SummaryService],
})
export class SummaryModule { }
