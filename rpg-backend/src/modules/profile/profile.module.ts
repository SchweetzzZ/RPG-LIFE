import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfile, UserProfileSchema } from './schema/profile.schema';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: UserProfile.name, schema: UserProfileSchema }]),
    ],
    controllers: [ProfileController],
    providers: [ProfileService],
    exports: [ProfileService, MongooseModule],
})
export class ProfileModule { }
