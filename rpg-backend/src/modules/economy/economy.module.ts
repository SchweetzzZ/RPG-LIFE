import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinEntry, CoinEntrySchema } from './schema/coin-entry.schema';
import { CoinService } from './economy.service';
import { RewardService } from './reward.service';
import { EconomyController } from './economy.controller';
import { ProgressModule } from '../progress/progress.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CoinEntry.name, schema: CoinEntrySchema }]),
        ProgressModule,
    ],
    controllers: [EconomyController],
    providers: [CoinService, RewardService],
    exports: [CoinService, RewardService, MongooseModule],
})
export class EconomyModule { }
