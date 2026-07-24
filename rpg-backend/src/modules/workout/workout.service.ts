import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workout, workoutDocument } from "./schemas/workout-schema";
import { Model } from "mongoose";
import { WorkoutDto, WorkoutUpdateDto } from "./dto/workout-dto";

@Injectable()
export class WorkoutService {
    constructor(@InjectModel(Workout.name) private readonly workoutModel: Model<workoutDocument>) { }

    async createWorkout(userId: string, data: WorkoutDto): Promise<Workout> {
        const workout = await this.workoutModel.create({
            user: userId,
            ...data,
        });
        return workout;
    }

    async updateWorkout(userId: string, workoutId: string, data: WorkoutUpdateDto): Promise<Workout> {
        const updated = await this.workoutModel.findOneAndUpdate(
            { _id: workoutId, user: userId },
            { $set: data },
            { new: true }
        );
        if (!updated) {
            throw new NotFoundException("Workout not found or unauthorized");
        }
        return updated;
    }

    async deleteWorkout(userId: string, workoutId: string): Promise<void> {
        const result = await this.workoutModel.deleteOne({ _id: workoutId, user: userId });
        if (result.deletedCount === 0) {
            throw new NotFoundException("Workout not found or unauthorized");
        }
    }

    async getUserWorkouts(userId: string): Promise<Workout[]> {
        return this.workoutModel.find({ user: userId }).sort({ createdAt: -1 });
    }

    async getWorkoutById(workoutId: string): Promise<Workout> {
        const workout = await this.workoutModel.findById(workoutId);
        if (!workout) {
            throw new NotFoundException("Workout not found");
        }
        return workout;
    }

    async getAllWorkouts(): Promise<Workout[]> {
        return this.workoutModel.find().sort({ createdAt: -1 });
    }
}
