// Seed de treinos para testar o grafico de evolucao: `npm run seed:workouts -- --email=voce@email.com`
// Cria 5 rotinas (Peito, Ombro, Costas, Biceps e Triceps, Perna) e ~16 semanas de registros
// em dias diferentes, com progressao de carga realista (sobe, estagna, cai e volta).
// Idempotente: rodar de novo apaga so o que o seed criou (rotinas com SEED_TAG) e recria.
// Nao mexe em moedas/XP (CoinService): os registros entram com xpGained/coinsGained = 0.
//
// Flags:
//   --email=<email>   usuario alvo (se omitido e so existir 1 usuario no banco, usa ele)
//   --weeks=<n>       semanas de historico (padrao 16)
//   --clean           so remove o que o seed criou, sem recriar
//   --dry-run         mostra o plano sem conectar no banco

import 'reflect-metadata';
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { Workout, workoutSchema } from '../schemas/workout-schema';
import { WorkoutLog, WorkoutLogSchema, PerformedSet } from '../schemas/workout-log';
import { best1Rm, estimateDurationMinutes, maxWeight, volumeKg } from '../workout-math';
import { calculateWorkoutNetKcal } from '../../energy/energy-math';
import { addDays, dayOfWeek, toUserDate, DEFAULT_TIMEZONE } from '../../common/utils/user-date';

const SEED_TAG = '[seed-treinos]';
const BODY_WEIGHT_KG = 75;

type Pattern =
    | 'steady'      // sobe 1 degrau a cada ~2 semanas
    | 'fast'        // sobe toda semana (iniciante)
    | 'plateau'     // sobe e trava no meio
    | 'deload'      // sobe, cai numa semana ruim e volta a subir
    | 'regress';    // comeca bem e vai caindo (pra ver o grafico descendo)

interface SeedExercise {
    name: string;
    startKg: number;
    stepKg: number;
    reps: number;   // reps alvo das series validas
    pattern: Pattern;
}

interface SeedRoutine {
    title: string;
    category: 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços';
    muscles: string[];
    weekday: number; // 0 Dom ... 6 Sab
    exercises: SeedExercise[];
}

const ROUTINES: SeedRoutine[] = [
    {
        title: 'Peito', category: 'Peito', muscles: ['peitoral'], weekday: 1,
        exercises: [
            { name: 'Supino reto com barra', startKg: 50, stepKg: 2.5, reps: 8, pattern: 'steady' },
            { name: 'Supino inclinado com halteres', startKg: 20, stepKg: 2, reps: 10, pattern: 'deload' },
            { name: 'Crucifixo na máquina', startKg: 35, stepKg: 5, reps: 12, pattern: 'plateau' },
        ],
    },
    {
        title: 'Costas', category: 'Costas', muscles: ['costas'], weekday: 2,
        exercises: [
            { name: 'Puxada frontal', startKg: 45, stepKg: 5, reps: 10, pattern: 'steady' },
            { name: 'Remada curvada com barra', startKg: 40, stepKg: 2.5, reps: 8, pattern: 'fast' },
            { name: 'Remada baixa', startKg: 50, stepKg: 5, reps: 10, pattern: 'regress' },
        ],
    },
    {
        title: 'Perna', category: 'Pernas', muscles: ['perna'], weekday: 3,
        exercises: [
            { name: 'Agachamento livre', startKg: 60, stepKg: 5, reps: 8, pattern: 'steady' },
            { name: 'Leg press 45', startKg: 120, stepKg: 10, reps: 12, pattern: 'fast' },
            { name: 'Cadeira extensora', startKg: 40, stepKg: 5, reps: 12, pattern: 'deload' },
            { name: 'Mesa flexora', startKg: 30, stepKg: 5, reps: 12, pattern: 'plateau' },
        ],
    },
    {
        title: 'Ombro', category: 'Ombros', muscles: ['ombro'], weekday: 4,
        exercises: [
            { name: 'Desenvolvimento com halteres', startKg: 14, stepKg: 2, reps: 10, pattern: 'steady' },
            { name: 'Elevação lateral', startKg: 8, stepKg: 1, reps: 12, pattern: 'plateau' },
            { name: 'Crucifixo invertido', startKg: 6, stepKg: 1, reps: 12, pattern: 'regress' },
        ],
    },
    {
        title: 'Bíceps e Tríceps', category: 'Braços', muscles: ['braço'], weekday: 5,
        exercises: [
            { name: 'Rosca direta com barra', startKg: 20, stepKg: 2.5, reps: 10, pattern: 'steady' },
            { name: 'Rosca martelo', startKg: 10, stepKg: 2, reps: 10, pattern: 'deload' },
            { name: 'Tríceps pulley', startKg: 25, stepKg: 5, reps: 12, pattern: 'fast' },
            { name: 'Tríceps francês', startKg: 12, stepKg: 2, reps: 10, pattern: 'plateau' },
        ],
    },
];

// PRNG deterministico: o mesmo seed sempre gera o mesmo historico
function mulberry32(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Quantos degraus de carga acima do inicial na sessao `i` (de `total`). */
function stepsAt(pattern: Pattern, i: number, total: number): number {
    switch (pattern) {
        case 'fast': return i;
        case 'steady': return Math.floor(i / 2);
        case 'plateau': return Math.min(Math.floor(i / 2), Math.floor(total / 4));
        case 'deload': {
            const dip = Math.floor(total * 0.6);
            if (i === dip || i === dip + 1) return Math.max(0, Math.floor(i / 2) - 3);
            return Math.floor(i / 2);
        }
        case 'regress': return Math.max(-4, 2 - Math.floor(i / 3));
    }
}

function buildSets(ex: SeedExercise, i: number, total: number, rnd: () => number): PerformedSet[] {
    const weight = Math.max(ex.stepKg, ex.startKg + stepsAt(ex.pattern, i, total) * ex.stepKg);
    // Dupla progressao: as reps oscilam em volta do alvo (-2..+1)
    const baseReps = ex.reps + Math.floor(rnd() * 4) - 2;
    const warmup: PerformedSet = {
        setNumber: 1, weightKg: Math.round(weight * 0.5 * 2) / 2, reps: 12, technique: 'warmup', restSeconds: 60,
    };
    const working: PerformedSet[] = [0, 1, 2].map((k) => ({
        setNumber: k + 2,
        weightKg: weight,
        reps: Math.max(4, baseReps - k), // cansaco: cada serie sai com 1 rep a menos
        technique: 'normal',
        restSeconds: 90,
    }));
    return [warmup, ...working];
}

function parseArg(name: string): string | undefined {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit?.slice(name.length + 3);
}

/** Datas dos treinos: cada rotina no seu dia da semana, nas ultimas `weeks` semanas, antes de hoje. */
function planDates(weeks: number, today: string, rnd: () => number) {
    const start = addDays(today, -weeks * 7);
    const plan: { routine: SeedRoutine; dates: string[] }[] = ROUTINES.map((r) => ({ routine: r, dates: [] }));
    for (let d = start; d < today; d = addDays(d, 1)) {
        for (const p of plan) {
            // ~8% de faltas pra parecer gente de verdade
            if (dayOfWeek(d) === p.routine.weekday && rnd() > 0.08) p.dates.push(d);
        }
    }
    return plan;
}

async function main(): Promise<void> {
    const dryRun = process.argv.includes('--dry-run');
    const cleanOnly = process.argv.includes('--clean');
    const weeks = Number(parseArg('weeks') ?? 16);
    const email = parseArg('email')?.trim().toLowerCase();

    const today = toUserDate(DEFAULT_TIMEZONE);
    const rnd = mulberry32(42);
    const plan = planDates(weeks, today, rnd);

    if (dryRun) {
        for (const { routine, dates } of plan) {
            console.log(`${routine.title.padEnd(18)} ${dates.length} treinos  ${dates[0]} -> ${dates[dates.length - 1]}`);
        }
        console.log('\n--dry-run: nada foi gravado.');
        return;
    }

    dotenv.config({ path: ['.env', '../.env'] });
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI nao definido (.env)');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(uri);
    try {
        const users = mongoose.connection.collection('users');
        const user = email
            ? await users.findOne({ email })
            : (await users.countDocuments()) === 1 ? await users.findOne({}) : null;
        if (!user) {
            console.error(email
                ? `Usuario ${email} nao encontrado.`
                : 'Informe --email=<email> (existe mais de um usuario, ou nenhum).');
            process.exitCode = 1;
            return;
        }
        const userId = user._id as Types.ObjectId;

        const WorkoutModel = mongoose.model(Workout.name, workoutSchema);
        const LogModel = mongoose.model(WorkoutLog.name, WorkoutLogSchema);

        // Limpa o que um seed anterior criou para este usuario
        const old = await WorkoutModel.find({ user: userId, description: SEED_TAG }).select('_id').lean();
        const oldIds = old.map((r) => String(r._id));
        const delLogs = await LogModel.deleteMany({ user: userId, routineId: { $in: oldIds } });
        await WorkoutModel.deleteMany({ user: userId, description: SEED_TAG });
        console.log(`Limpeza: ${oldIds.length} rotinas e ${delLogs.deletedCount} registros antigos do seed removidos.`);
        if (cleanOnly) return;

        let totalLogs = 0;
        for (const { routine, dates } of plan) {
            const created = await WorkoutModel.create({
                user: userId,
                title: routine.title,
                description: SEED_TAG,
                estimatedMinutes: 50,
                targetMuscleGroups: routine.muscles,
                scheduledDays: [routine.weekday],
                intensity: 'moderate',
                exercises: [],
                completionCount: 0,
            });

            let lastSets: Record<string, PerformedSet[]> = {};
            const logs = dates.map((date, i) => {
                const exercises = routine.exercises.map((ex) => {
                    const sets = buildSets(ex, i, dates.length, rnd);
                    lastSets[ex.name] = sets;
                    return { exerciseName: ex.name, maxWeightKg: maxWeight(sets), completedSetsCount: sets.length, sets };
                });
                const allSets = exercises.flatMap((e) => e.sets);
                const duration = estimateDurationMinutes(allSets.length);
                return {
                    user: userId,
                    routineId: String(created._id),
                    routineName: routine.title,
                    durationMinutes: duration,
                    intensity: 'moderate',
                    caloriesBurned: calculateWorkoutNetKcal('moderate', BODY_WEIGHT_KG, duration),
                    totalVolumeKg: volumeKg(allSets),
                    totalSets: allSets.length,
                    xpGained: 0,
                    coinsGained: 0,
                    date,
                    exercises,
                    // 19h em Sao Paulo (22h UTC): o grafico ordena por completedAt
                    completedAt: new Date(`${date}T22:00:00.000Z`),
                };
            });
            await LogModel.insertMany(logs);
            totalLogs += logs.length;

            // A rotina fica com o plano = ultimo desempenho, como se o usuario fosse ajustando
            await WorkoutModel.updateOne({ _id: created._id }, {
                $set: {
                    completionCount: logs.length,
                    lastCompletedDate: dates[dates.length - 1] ?? null,
                    exercises: routine.exercises.map((ex) => ({
                        name: ex.name,
                        category: routine.category,
                        sets: (lastSets[ex.name] ?? []).map((s) => ({ ...s, technique: s.technique ?? 'normal' })),
                    })),
                },
            });

            const first = logs[0]?.exercises[0];
            const last = logs[logs.length - 1]?.exercises[0];
            console.log(
                `${routine.title.padEnd(18)} ${String(logs.length).padStart(2)} registros  ` +
                `${first?.exerciseName}: 1RM ${best1Rm(first?.sets ?? [])} -> ${best1Rm(last?.sets ?? [])} kg`,
            );
            lastSets = {};
        }
        console.log(`\nPronto: ${ROUTINES.length} rotinas e ${totalLogs} registros para ${user.email}.`);
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
