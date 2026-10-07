import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Workout, workoutSchema } from "./schemas/workout-schema";
import { WorkoutLog, WorkoutLogSchema } from "./schemas/workout-log";
import { WorkoutService } from "./workout.service";
import { WorkoutController } from "./workout.controller";
import { ProgressModule } from "../progress/progress.module";
import { EconomyModule } from "../economy/economy.module";
import { ProfileModule } from "../profile/profile.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Workout.name, schema: workoutSchema },
            { name: WorkoutLog.name, schema: WorkoutLogSchema },
        ]),
        ProgressModule,
        EconomyModule,
        ProfileModule,
    ],
    controllers: [WorkoutController],
    providers: [WorkoutService],
    exports: [WorkoutService, MongooseModule],
})
export class WorkoutModule { }