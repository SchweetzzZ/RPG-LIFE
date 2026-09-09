import { Module } from "@nestjs/common";
import { EnergyController } from "./energy.controller";
import { EnergyService } from "./energy.service";
import { ProfileModule } from "../profile/profile.module";
import { WorkoutModule } from "../workout/workout.module";
import { HabitModule } from "../habit/habit.module";
import { NutritionModule } from "../nutricion/nutricion.module";
import { CharacterModule } from "../character/character.module";

@Module({
    imports: [
        ProfileModule,
        WorkoutModule,
        HabitModule,
        NutritionModule,
        CharacterModule,
    ],
    controllers: [EnergyController],
    providers: [EnergyService],
    exports: [EnergyService],
})
export class EnergyModule { }
