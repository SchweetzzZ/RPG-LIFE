import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workout, workoutDocument } from "./schemas/workout-schema";
import { PerformedSet, WorkoutLog, WorkoutLogDocument } from "./schemas/workout-log";
import { Model, Types } from "mongoose";
import { CreateWorkoutDto, UpdateWorkoutDto, LogWorkoutDto, CreateWorkoutLogInput } from "./dto/workout-dto";
import { RewardService, RewardResult } from "../economy/reward.service";
import { CoinReason } from "../economy/schema/coin-entry.schema";
import { VaultService } from "../vault/vault.service";
import { calculateWorkoutNetKcal } from "../energy/energy-math";
import { ProfileService } from "../profile/profile.service";
import { toUserDate } from "../common/utils/user-date";
import { buildCatalog, removeFromList, renameInList } from "./exercise-catalog";
import { best1Rm, estimateDurationMinutes, exerciseKey, maxWeight, volumeKg } from "./workout-math";

// Quantos treinos recentes entram no "ultimo desempenho" de cada exercicio
const RECENT_LOGS_FOR_PERFORMANCE = 60;

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
        // Registrar o treino ja conta: o app nao tem como provar que a serie foi feita,
        // entao basta ter ao menos 1 exercicio com ao menos 1 serie anotada.
        const registered = (data.exercises ?? []).filter((ex) => (ex.sets?.length ?? 0) > 0);
        if (registered.length === 0) {
            throw new BadRequestException('Registre ao menos um exercício com uma série para salvar o treino');
        }

        let weightKg = 70;
        try {
            const profile = await this.profileService.getProfile(userId);
            if (profile?.weightKg) weightKg = profile.weightKg;
        } catch { }

        let totalVolumeKg = 0;
        let totalSets = 0;

        const exercises = registered.map((ex) => {
            const sets = ex.sets ?? [];
            totalSets += sets.length;
            totalVolumeKg += volumeKg(sets);
            return {
                exerciseName: ex.exerciseName.trim(),
                maxWeightKg: maxWeight(sets),
                completedSetsCount: sets.length,
                sets,
            };
        });

        // Sem cronometro a duracao vem estimada pelas series
        const duration = data.durationMinutes ?? estimateDurationMinutes(totalSets);
        // Kcal liquidas: (MET - 1) x peso x horas (o basal ja esta na Base do dia)
        const caloriesBurned = calculateWorkoutNetKcal(data.intensity, weightKg, duration);

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

    /** Evolucao de um exercicio (nome comparado sem acento e sem diferenca de caixa). */
    async getProgression(userId: string, exerciseName: string) {
        const timezone = await this.profileService.getTimezone(userId);
        const key = exerciseKey(exerciseName);
        const logs = await this.workoutLogModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ completedAt: 1 })
            .lean()
            .exec();

        const history = logs.flatMap((log) => {
            const exercise = log.exercises?.find((e) => exerciseKey(e.exerciseName ?? '') === key);
            if (!exercise) return [];
            const sets = exercise.sets ?? [];
            return [{
                date: log.date || (log.completedAt ? toUserDate(timezone, new Date(log.completedAt)) : ''),
                maxWeightKg: sets.length ? maxWeight(sets) : exercise.maxWeightKg ?? 0,
                completedSetsCount: exercise.completedSetsCount ?? sets.length,
                totalVolumeKg: volumeKg(sets),
                estimated1RmKg: best1Rm(sets),
                sets,
            }];
        });

        return {
            exerciseName,
            totalSessions: history.length,
            bestEstimated1RmKg: history.reduce((best, h) => Math.max(best, h.estimated1RmKg), 0),
            history,
        };
    }

    /** Ultimo desempenho de cada exercicio (treinos recentes), para pre-preencher as cargas. */
    async getLastPerformance(userId: string) {
        const logs = await this.workoutLogModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ completedAt: -1 })
            .limit(RECENT_LOGS_FOR_PERFORMANCE)
            .lean()
            .exec();

        const byExercise = new Map<string, {
            exerciseName: string;
            date: string;
            sets: PerformedSet[];
            personalBestKg: number;
        }>();

        // Do mais recente para o mais antigo: a 1a ocorrencia e a "ultima vez"
        for (const log of logs) {
            for (const ex of log.exercises ?? []) {
                const sets = ex.sets ?? [];
                if (!ex.exerciseName || sets.length === 0) continue;
                const key = exerciseKey(ex.exerciseName);
                const entry = byExercise.get(key);
                const best = maxWeight(sets);
                if (!entry) {
                    byExercise.set(key, { exerciseName: ex.exerciseName, date: log.date, sets, personalBestKg: best });
                } else {
                    entry.personalBestKg = Math.max(entry.personalBestKg, best);
                }
            }
        }

        return [...byExercise.values()].map((e) => ({
            exerciseName: e.exerciseName,
            date: e.date,
            sets: e.sets.map((s) => ({ ...s })),
            maxWeightKg: maxWeight(e.sets),
            estimated1RmKg: best1Rm(e.sets),
            personalBestKg: e.personalBestKg,
        }));
    }

    // ── Catalogo de exercicios ───────────────────────────────────────────────

    /** Exercicios do usuario: rotinas + registros, sem duplicar pela exerciseKey. */
    async getExerciseCatalog(userId: string) {
        const user = new Types.ObjectId(userId);
        const [routines, logs] = await Promise.all([
            this.workoutModel.find({ user }).select('exercises.name exercises.category createdAt').lean().exec(),
            this.workoutLogModel.find({ user }).select('date completedAt exercises').lean().exec(),
        ]);
        return buildCatalog(routines, logs);
    }

    /**
     * Renomeia o exercicio nas rotinas e em todo o historico (continua sendo o mesmo exercicio).
     * Bloqueia (409) se o novo nome ja for outro exercicio do catalogo. Sem replica set nao ha
     * transacao: o historico e atualizado primeiro e as rotinas depois.
     */
    async renameExercise(userId: string, from: string, to: string) {
        const newName = to.trim();
        const fromKey = exerciseKey(from);
        const toKey = exerciseKey(newName);
        const catalog = await this.getExerciseCatalog(userId);

        if (!catalog.some((c) => exerciseKey(c.name) === fromKey)) {
            throw new NotFoundException('Exercício não encontrado');
        }
        if (toKey !== fromKey && catalog.some((c) => exerciseKey(c.name) === toKey)) {
            throw new ConflictException('Já existe um exercício com esse nome');
        }

        const user = new Types.ObjectId(userId);
        const logs = await this.workoutLogModel.find({ user }).select('exercises').lean().exec();
        const logOps = logs.flatMap((log) => {
            const exercises = renameInList(
                log.exercises, from, newName, (e) => e.exerciseName, (e, name) => ({ ...e, exerciseName: name }),
            );
            return exercises ? [{ updateOne: { filter: { _id: log._id }, update: { $set: { exercises } } } }] : [];
        });
        if (logOps.length > 0) await this.workoutLogModel.bulkWrite(logOps);

        const routines = await this.workoutModel.find({ user }).select('exercises').lean().exec();
        const routineOps = routines.flatMap((routine) => {
            const exercises = renameInList(
                routine.exercises, from, newName, (e) => e.name, (e, name) => ({ ...e, name }),
            );
            return exercises ? [{ updateOne: { filter: { _id: routine._id }, update: { $set: { exercises } } } }] : [];
        });
        if (routineOps.length > 0) await this.workoutModel.bulkWrite(routineOps);

        return { name: newName, routinesUpdated: routineOps.length, logsUpdated: logOps.length };
    }

    /**
     * Apaga o exercicio de todas as rotinas e do historico. Os treinos ficam (as kcal do dia
     * dependem deles), mas sem o exercicio; volume e series sao recalculados.
     */
    async deleteExercise(userId: string, name: string) {
        const key = exerciseKey(name);
        const catalog = await this.getExerciseCatalog(userId);
        if (!catalog.some((c) => exerciseKey(c.name) === key)) {
            throw new NotFoundException('Exercício não encontrado');
        }

        const user = new Types.ObjectId(userId);
        const logs = await this.workoutLogModel.find({ user }).select('exercises').lean().exec();
        const logOps = logs.flatMap((log) => {
            const exercises = removeFromList(log.exercises, name, (e) => e.exerciseName);
            if (!exercises) return [];
            const sets = exercises.flatMap((e) => e.sets ?? []);
            return [{
                updateOne: {
                    filter: { _id: log._id },
                    update: { $set: { exercises, totalSets: sets.length, totalVolumeKg: volumeKg(sets) } },
                },
            }];
        });
        if (logOps.length > 0) await this.workoutLogModel.bulkWrite(logOps);

        const routines = await this.workoutModel.find({ user }).select('exercises').lean().exec();
        const routineOps = routines.flatMap((routine) => {
            const exercises = removeFromList(routine.exercises, name, (e) => e.name);
            return exercises ? [{ updateOne: { filter: { _id: routine._id }, update: { $set: { exercises } } } }] : [];
        });
        if (routineOps.length > 0) await this.workoutModel.bulkWrite(routineOps);

        return {
            message: 'Exercício e histórico removidos',
            routinesUpdated: routineOps.length,
            logsUpdated: logOps.length,
        };
    }
}
