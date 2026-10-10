import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { ProgressModule } from './modules/progress/progress.module';
import { EconomyModule } from './modules/economy/economy.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ActivityModule } from './modules/activity/activity.module';
import { NutritionModule } from './modules/nutricion/nutricion.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { EnergyModule } from './modules/energy/energy.module';
import { VaultModule } from './modules/vault/vault.module';
import { DayModule } from './modules/day/day.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env']
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ProgressModule,
    EconomyModule,
    ProfileModule,
    ActivityModule,
    NutritionModule,
    WorkoutModule,
    EnergyModule,
    VaultModule,
    DayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
