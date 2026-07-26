import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workout, workoutDocument } from "./schemas/workout-schema";
import { WorkoutLog, WorkoutLogDocument } from "./schemas/workout-log";
import { Model, Types } from "mongoose";
import { CreateWorkoutDto, UpdateWorkoutDto } from "./dto/workout-dto";

@Injectable()
export class WorkoutService {
    constructor(
        @InjectModel(Workout.name) private readonly workoutModel: Model<workoutDocument>,
        @InjectModel(WorkoutLog.name) private readonly workoutLogModel: Model<WorkoutLogDocument>,
    ) { }

    // ── Routine CRUD ─────────────────────────────────────────────────────────

    async createWorkout(userId: string, data: CreateWorkoutDto): Promise<Workout> {
        const { lastCompletedDate, ...rest } = data;
        return this.workoutModel.create({
            user: new Types.ObjectId(userId),
            ...rest,
            ...(lastCompletedDate != null ? { lastCompletedDate } : {}),
        });
    }

    async updateWorkout(userId: string, workoutId: string, data: UpdateWorkoutDto): Promise<Workout> {
        const updated = await this.workoutModel.findOneAndUpdate(
            { _id: workoutId, user: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        );
        if (!updated) {
            throw new NotFoundException("Workout not found or unauthorized");
        }
        return updated;
    }

    async deleteWorkout(userId: string, workoutId: string): Promise<void> {
        const result = await this.workoutModel.deleteOne({
            _id: workoutId,
            user: new Types.ObjectId(userId),
        });
        if (result.deletedCount === 0) {
            throw new NotFoundException("Workout not found or unauthorized");
        }
    }

    async getUserWorkouts(userId: string): Promise<Workout[]> {
        return this.workoutModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async getWorkoutById(workoutId: string): Promise<Workout> {
        const workout = await this.workoutModel.findById(workoutId).lean().exec();
        if (!workout) {
            throw new NotFoundException("Workout not found");
        }
        return workout;
    }

    async getAllWorkouts(): Promise<Workout[]> {
        return this.workoutModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    // ── Workout Log ──────────────────────────────────────────────────────────

    async createWorkoutLog(userId: string, data: {
        routineId?: string;
        routineTitle?: string;
        durationMinutes: number;
        totalVolumeKg: number;
        totalSetsCompleted: number;
        xpEarned: number;
        coinsEarned: number;
        exerciseLogs: { exerciseName: string; maxWeightKg: number; completedSetsCount: number }[];
    }): Promise<WorkoutLog> {
        return this.workoutLogModel.create({
            user: new Types.ObjectId(userId),
            routineId: data.routineId,
            routineName: data.routineTitle || 'Treino',
            durationMinutes: data.durationMinutes ?? 0,
            totalVolumeKg: data.totalVolumeKg ?? 0,
            totalSets: data.totalSetsCompleted ?? 0,
            xpGained: data.xpEarned ?? 0,
            coinsGained: data.coinsEarned ?? 0,
            exercises: data.exerciseLogs ?? [],
        });
    }

    async getUserWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
        return this.workoutLogModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ completedAt: -1 })
            .lean()
            .exec();
    }
}
