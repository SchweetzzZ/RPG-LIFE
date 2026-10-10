import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { StepLog, StepLogSchema } from './schema/step-log-schema';
import { ProfileModule } from '../profile/profile.module';
import { EconomyModule } from '../economy/economy.module';
import { VaultModule } from '../vault/vault.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: StepLog.name, schema: StepLogSchema },
        ]),
        ProfileModule,
        EconomyModule,
        VaultModule,
    ],
    controllers: [ActivityController],
    providers: [ActivityService],
    exports: [ActivityService, MongooseModule],
})
export class ActivityModule { }
