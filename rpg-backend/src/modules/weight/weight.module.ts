import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeightLog, WeightLogSchema } from './schema/weight-log.schema';
import { WeightService } from './weight.service';
import { WeightController } from './weight.controller';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: WeightLog.name, schema: WeightLogSchema }]),
        ProfileModule,
    ],
    controllers: [WeightController],
    providers: [WeightService],
    exports: [WeightService],
})
export class WeightModule { }
