import { Module } from "@nestjs/common";
import { EnergyController } from "./energy.controller";
import { EnergyService } from "./energy.service";
import { ProfileModule } from "../profile/profile.module";
import { WorkoutModule } from "../workout/workout.module";
import { ActivityModule } from "../activity/activity.module";
import { NutritionModule } from "../nutricion/nutricion.module";

@Module({
    imports: [
        ProfileModule,
        WorkoutModule,
        ActivityModule,
        NutritionModule,
    ],
    controllers: [EnergyController],
    providers: [EnergyService],
    exports: [EnergyService],
})
export class EnergyModule { }
