import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitService } from './habit.service';
import { HabitController } from './habit.controller';
import { Habit, HabbitSchema, DailyHabitStatus, DailyHabitStatusSchema } from './schema/habit-schema';
import { CharacterModule } from '../character/character.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Habit.name, schema: HabbitSchema },
            { name: DailyHabitStatus.name, schema: DailyHabitStatusSchema },
        ]),
        CharacterModule,
        ProfileModule,
    ],
    controllers: [HabitController],
    providers: [HabitService],
    exports: [HabitService],
})
export class HabitModule { }
