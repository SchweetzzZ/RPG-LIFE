import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinEntry, CoinEntrySchema } from './schema/coin-entry.schema';
import { CoinService } from './economy.service';
import { EconomyController } from './economy.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CoinEntry.name, schema: CoinEntrySchema }]),
    ],
    controllers: [EconomyController],
    providers: [CoinService],
    exports: [CoinService, MongooseModule],
})
export class EconomyModule { }
