import { Module } from "@nestjs/common";
import { EnergyService } from "./energy.service";
import { WorkoutModule } from "../workout/workout.module";
import { ActivityModule } from "../activity/activity.module";
import { NutritionModule } from "../nutricion/nutricion.module";

// Sem controller: o estado do dia sai por GET /day/:date (modulo day).
@Module({
    imports: [
        WorkoutModule,
        ActivityModule,
        NutritionModule,
    ],
    providers: [EnergyService],
    exports: [EnergyService],
})
export class EnergyModule { }
