import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Workout, workoutSchema } from "./schemas/workout-schema";
import { WorkoutService } from "./workout.service";
import { WorkoutController } from "./workout.controller";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Workout.name, schema: workoutSchema },
        ])
    ],
    controllers: [WorkoutController],
    providers: [WorkoutService],
    exports: [WorkoutService],
})
export class WorkoutModule { }