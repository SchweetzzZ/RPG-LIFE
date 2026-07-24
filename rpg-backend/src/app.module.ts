import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { CharacterModule } from './modules/character/character.module';
import { ProfileModule } from './modules/profile/profile.module';
import { HabitModule } from './modules/habit/habit.module';
import { NutritionModule } from './modules/nutricion/nutricion.module';
import { WorkoutModule } from './modules/workout/workout.module';

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
    CharacterModule,
    ProfileModule,
    HabitModule,
    NutritionModule,
    WorkoutModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
