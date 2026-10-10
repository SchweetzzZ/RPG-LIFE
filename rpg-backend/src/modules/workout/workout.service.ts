import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workout, workoutDocument } from "./schemas/workout-schema";
import { WorkoutLog, WorkoutLogDocument } from "./schemas/workout-log";
import { Model, Types } from "mongoose";
import { CreateWorkoutDto, UpdateWorkoutDto, LogWorkoutDto, CreateWorkoutLogInput } from "./dto/workout-dto";
import { RewardService, RewardResult } from "../economy/reward.service";
import { CoinReason } from "../economy/schema/coin-entry.schema";
import { VaultService } from "../vault/vault.service";
import { calculateWorkoutNetKcal } from "../energy/energy-math";
import { ProfileService } from "../profile/profile.service";
import { toUserDate } from "../common/utils/user-date";

@Injectable()
export class WorkoutService {
    constructor(
        @InjectModel(Workout.name) private readonly workoutModel: Model<workoutDocument>,
        @InjectModel(WorkoutLog.name) private readonly workoutLogModel: Model<WorkoutLogDocument>,
        private readonly rewardService: RewardService,
        private readonly vaultService: VaultService,
        private readonly profileService: ProfileService,
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

    async getWorkoutById(userId: string, workoutId: string): Promise<Workout> {
        if (!Types.ObjectId.isValid(workoutId)) {
            throw new NotFoundException("Workout not found");
        }
        // So devolve rotinas do proprio usuario
        const workout = await this.workoutModel
            .findOne({ _id: new Types.ObjectId(workoutId), user: new Types.ObjectId(userId) })
            .lean()
            .exec();
        if (!workout) {
            throw new NotFoundException("Workout not found");
        }
        return workout;
    }

    async getAllWorkouts(): Promise<Workout[]> {
        return this.workoutModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    // ── Workout Log ──────────────────────────────────────────────────────────

    async createWorkoutLog(userId: string, data: CreateWorkoutLogInput): Promise<WorkoutLog> {
        // A data do log e sempre o "hoje" do usuario (fuso do perfil)
        const date = toUserDate(await this.profileService.getTimezone(userId));
        return this.workoutLogModel.create({
            user: new Types.ObjectId(userId),
            date,
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

    async logWorkoutSession(userId: string, data: LogWorkoutDto) {
        let weightKg = 70;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg) weightKg = profile.weightKg;
        } catch { }

        // Kcal liquidas: (MET - 1) x peso x horas (o basal ja esta na Base do dia)
        const duration = data.durationMinutes || 45;
        const caloriesBurned = calculateWorkoutNetKcal(data.intensity, weightKg, duration);

        let totalVolumeKg = 0;
        let totalSets = 0;

        const exercises = (data.exercises || []).map((ex) => {
            let maxWeight = ex.maxWeightKg || 0;
            const completedSets = ex.sets?.length || ex.completedSetsCount || 0;
            totalSets += completedSets;

            if (ex.sets) {
                ex.sets.forEach((s) => {
                    totalVolumeKg += (s.weightKg || 0) * (s.reps || 0);
                    if (s.weightKg > maxWeight) maxWeight = s.weightKg;
                });
            }

            return {
                exerciseName: ex.exerciseName,
                maxWeightKg: maxWeight,
                completedSetsCount: completedSets,
                sets: ex.sets,
            };
        });

        const today = toUserDate(await this.profileService.getTimezone(userId));
        const targetDate = data.date || today;

        const log = await this.workoutLogModel.create({
            user: new Types.ObjectId(userId),
            routineId: data.routineId,
            routineName: data.routineName,
            durationMinutes: duration,
            intensity: data.intensity,
            caloriesBurned,
            totalVolumeKg,
            totalSets,
            xpGained: 0,
            coinsGained: 0,
            date: targetDate,
            exercises,
        });

        // Atualiza a rotina vinculada, se houver
        if (data.routineId && Types.ObjectId.isValid(data.routineId)) {
            await this.workoutModel.updateOne(
                { _id: new Types.ObjectId(data.routineId), user: new Types.ObjectId(userId) },
                {
                    $inc: { completionCount: 1 },
                    $set: { lastCompletedDate: targetDate },
                }
            );
        }

        // +20 moedas (e XP) so no 1o treino do dia, e so se o dia e do ciclo aberto
        let reward: RewardResult = { granted: false, coins: 0, xp: 0, leveledUp: false };
        if (await this.vaultService.canEarnOn(userId, targetDate, today)) {
            reward = await this.rewardService.grant(userId, CoinReason.WORKOUT, targetDate);
        }
        if (reward.granted) {
            log.coinsGained = reward.coins;
            log.xpGained = reward.xp;
            await log.save();
        }

        return {
            workoutLog: log,
            caloriesBurned,
            coinsEarned: reward.coins,
            xpEarned: reward.xp,
            leveledUp: reward.leveledUp,
        };
    }

    async getProgression(userId: string, exerciseName: string) {
        const timezone = await this.profileService.getTimezone(userId);
        // Escapa o nome para nao ser interpretado como expressao regular
        const escapedName = exerciseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const logs = await this.workoutLogModel
            .find({
                user: new Types.ObjectId(userId),
                'exercises.exerciseName': { $regex: new RegExp(`^${escapedName}$`, 'i') },
            })
            .sort({ completedAt: 1 })
            .lean()
            .exec();

        const history = logs.map((log) => {
            const exercise = log.exercises?.find(
                (e) => e.exerciseName?.toLowerCase() === exerciseName.toLowerCase()
            );

            let exerciseVolume = 0;
            if (exercise?.sets) {
                exercise.sets.forEach((s) => {
                    exerciseVolume += (s.weightKg || 0) * (s.reps || 0);
                });
            }

            return {
                date: log.date || (log.completedAt ? toUserDate(timezone, new Date(log.completedAt)) : ''),
                maxWeightKg: exercise?.maxWeightKg || 0,
                completedSetsCount: exercise?.completedSetsCount || 0,
                totalVolumeKg: exerciseVolume,
                sets: exercise?.sets || [],
            };
        });

        return {
            exerciseName,
            totalSessions: history.length,
            history,
        };
    }
}
