import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Workout, workoutSchema } from "./schemas/workout-schema";
import { WorkoutLog, WorkoutLogSchema } from "./schemas/workout-log";
import { WorkoutService } from "./workout.service";
import { WorkoutController } from "./workout.controller";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Workout.name, schema: workoutSchema },
            { name: WorkoutLog.name, schema: WorkoutLogSchema },
        ])
    ],
    controllers: [WorkoutController],
    providers: [WorkoutService],
    exports: [WorkoutService],
})
export class WorkoutModule { }