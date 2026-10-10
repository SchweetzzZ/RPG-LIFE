import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cycle, CycleSchema } from './schema/cycle.schema';
import { VaultEntry, VaultEntrySchema } from './schema/vault-entry.schema';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';
import { EconomyModule } from '../economy/economy.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cycle.name, schema: CycleSchema },
            { name: VaultEntry.name, schema: VaultEntrySchema },
        ]),
        EconomyModule,
        ProfileModule,
    ],
    controllers: [VaultController],
    providers: [VaultService],
    exports: [VaultService, MongooseModule],
})
export class VaultModule { }
