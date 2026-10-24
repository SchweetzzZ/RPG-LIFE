import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfile, UserProfileSchema } from './schema/profile.schema';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { WeightLog, WeightLogSchema } from '../weight/schema/weight-log.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserProfile.name, schema: UserProfileSchema },
            // O perfil grava a pesagem de hoje quando o peso e editado no formulario
            { name: WeightLog.name, schema: WeightLogSchema },
        ]),
    ],
    controllers: [ProfileController],
    providers: [ProfileService],
    exports: [ProfileService, MongooseModule],
})
export class ProfileModule { }
