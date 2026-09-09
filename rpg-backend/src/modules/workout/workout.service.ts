import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workout, workoutDocument } from "./schemas/workout-schema";
import { WorkoutLog, WorkoutLogDocument } from "./schemas/workout-log";
import { Model, Types } from "mongoose";
import { CreateWorkoutDto, UpdateWorkoutDto, LogWorkoutDto } from "./dto/workout-dto";
import { CharacterService } from "../character/character.service";
import { ProfileService } from "../profile/profile.service";

@Injectable()
export class WorkoutService {
    constructor(
        @InjectModel(Workout.name) private readonly workoutModel: Model<workoutDocument>,
        @InjectModel(WorkoutLog.name) private readonly workoutLogModel: Model<WorkoutLogDocument>,
        private readonly characterService: CharacterService,
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

    async logWorkoutSession(userId: string, data: LogWorkoutDto) {
        let weightKg = 70;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg) weightKg = profile.weightKg;
        } catch { }

        // MET por intensidade
        let met = 3.5;
        if (data.intensity === 'intense') met = 6.0;
        else if (data.intensity === 'cycling_running') met = 7.5;

        // Fórmula: MET * Peso * (Duração / 60)
        const duration = data.durationMinutes || 45;
        const caloriesBurned = Math.round(met * weightKg * (duration / 60));
        const coinsEarned = Math.round(caloriesBurned * 0.25);
        const xpEarned = 200;

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

        const targetDate = data.date || new Date().toISOString().split('T')[0];

        const log = await this.workoutLogModel.create({
            user: new Types.ObjectId(userId),
            routineId: data.routineId,
            routineName: data.routineName,
            durationMinutes: duration,
            intensity: data.intensity,
            caloriesBurned,
            totalVolumeKg,
            totalSets,
            xpGained: xpEarned,
            coinsGained: coinsEarned,
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

        // Credita moedas no perfil do usuário
        await this.profileService.addCoins(userId, coinsEarned);

        let rpgResult = { xpGained: xpEarned, leveledUp: false };
        try {
            rpgResult = await this.characterService.addXpAndCoin(userId, {
                xpGained: xpEarned,
                coinsGained: coinsEarned,
                category: 'workout',
                statBonus: { stat: 'strength', amount: 1 },
            });
        } catch { }

        return {
            workoutLog: log,
            caloriesBurned,
            coinsEarned,
            xpEarned: rpgResult.xpGained,
            leveledUp: rpgResult.leveledUp,
        };
    }

    async getProgression(userId: string, exerciseName: string) {
        const logs = await this.workoutLogModel
            .find({
                user: new Types.ObjectId(userId),
                'exercises.exerciseName': { $regex: new RegExp(`^${exerciseName}$`, 'i') },
            })
            .sort({ completedAt: 1 })
            .lean()
            .exec();

        const history = logs.map((log) => {
            const exercise = log.exercises?.find(
                (e: any) => e.exerciseName?.toLowerCase() === exerciseName.toLowerCase()
            );

            let exerciseVolume = 0;
            if (exercise?.sets) {
                exercise.sets.forEach((s: any) => {
                    exerciseVolume += (s.weightKg || 0) * (s.reps || 0);
                });
            }

            return {
                date: log.date || (log.completedAt ? new Date(log.completedAt).toISOString().split('T')[0] : ''),
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

    async checkMissedWorkouts(userId: string) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDayOfWeek = yesterday.getDay(); // 0-6
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Verifica se o usuário tem rotinas agendadas para o dia de ontem
        const scheduledWorkouts = await this.workoutModel.find({
            user: new Types.ObjectId(userId),
            scheduledDays: yesterdayDayOfWeek,
        });

        if (scheduledWorkouts.length === 0) {
            return { missed: false, scheduled: false, message: 'Nenhum treino agendado para o dia anterior.' };
        }

        // Verifica se houve treino concluído ontem
        const hadLogYesterday = await this.workoutLogModel.exists({
            user: new Types.ObjectId(userId),
            date: yesterdayStr,
        });

        if (!hadLogYesterday) {
            // Aplica dano de -30 HP
            await this.characterService.takeDamage(userId, 30);
            return {
                missed: true,
                scheduled: true,
                hpPenalty: 30,
                message: 'Você faltou ao treino agendado de ontem e perdeu 30 HP!',
            };
        }

        return { missed: false, scheduled: true, message: 'Treino agendado cumprido com sucesso!' };
    }
}
