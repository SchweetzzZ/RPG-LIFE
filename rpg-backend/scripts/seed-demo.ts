// Seed de demonstracao: deixa um usuario com cara de "ativo ha semanas", usando todas as features.
//
//   npm run seed:demo                                   (usa jonatas_kp32@hotmail.com)
//   npm run seed:demo -- --email=outro@email.com --weeks=8
//
// ATENCAO: APAGA todo o historico do usuario (diario, dias fechados, cofre, moedas, treinos, passos,
// refeicoes livres, peso, favoritos, refeicoes prontas e rotinas) e recria. Nao toca em outros usuarios.
// Recusa rodar com NODE_ENV=production.
//
// O historico segue as mesmas regras do app (energy-math, cycle-math, streak, rewards):
//  - semanas passadas: ciclos fechados, com o cofre e as moedas zerados no domingo;
//  - semana atual: ciclo aberto, com saldo de cofre e moedas e uma refeicao livre agendada;
//  - hoje: dia aberto, com cafe e almoco registrados, sem treino e sem peso (para testar no app);
//  - sequencia recente de varias semanas (com bonus de 7 dias) e duas falhas no comeco;
//  - peso descendo devagar ate perto da meta; treinos com progressao de carga e recordes.

import 'reflect-metadata';
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { addDays, dayOfWeek, resolveTimezone, toUserDate } from '../src/modules/common/utils/user-date';
import { weekWindow } from '../src/modules/vault/cycle-math';
import { computeStreak, streakBonusesCrossed } from '../src/modules/progress/streak';
import {
    calculateBaseKcal,
    calculateBmr,
    calculateDailyTargetKcal,
    calculateDayVault,
    calculateStepsNetKcal,
    calculateWorkoutNetKcal,
} from '../src/modules/energy/energy-math';
import { ActivityLevel, BiologicalSex, PrimaryGoal } from '../src/modules/profile/schema/profile.schema';
import { ProfileService } from '../src/modules/profile/profile.service';
import { REWARDS, FREE_MEAL_TICKETS } from '../src/modules/economy/rewards';
import { CoinReason } from '../src/modules/economy/schema/coin-entry.schema';
import { FreeMealScope } from '../src/modules/free-meal/schema/free-meal.schema';
import { FREE_MEAL_CATALOG } from '../src/modules/free-meal/seed/free-meal-catalog';
import { estimateDurationMinutes, maxWeight, volumeKg } from '../src/modules/workout/workout-math';

const DEFAULT_EMAIL = 'jonatas_kp32@hotmail.com';
const SEED_TAG = '[seed-demo]';

// ── Pessoa ────────────────────────────────────────────────────────────────────
const BODY = { heightCm: 178, age: 24, biologicalSex: BiologicalSex.MALE };
const ACTIVITY = ActivityLevel.LIGHT;       // meta de passos = 8.000
const GOAL = PrimaryGoal.LOSE_WEIGHT;
const START_WEIGHT_KG = 92.4;
const TARGET_WEIGHT_KG = 84;
const KG_PER_DAY = 0.075;                   // ~0,5 kg por semana
const STEPS_GOAL = 8000;

// ── Utilidades ────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rnd = mulberry32(2026);
const between = (min: number, max: number) => min + rnd() * (max - min);
const round1 = (n: number) => Math.round(n * 10) / 10;
const parseArg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

/** Horario "local" aproximado de um dia (Brasil, UTC-3), para createdAt/completedAt. */
function at(date: string, hour: number, minute = 0): Date {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, hour + 3, minute));
}

// ── Alimentos (TACO) ──────────────────────────────────────────────────────────
interface TacoRow { description: string; energyKcal: number; protein: number; carbohydrates: number; lipids: number }
const tacoFoods = JSON.parse(readFileSync(join(__dirname, '../src/modules/nutricion/seed/taco-foods.json'), 'utf-8')) as TacoRow[];
const TACO = new Map(tacoFoods.map((f) => [f.description, f]));

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Portion = [description: string, grams: number];

const MENUS: Record<MealType, Portion[][]> = {
    breakfast: [
        [['Pão, trigo, francês', 50], ['Ovo, de galinha, inteiro, cozido/10minutos', 100], ['Café, infusão 10%', 150], ['Banana, prata, crua', 80]],
        [['Tapioca, com manteiga', 90], ['Queijo, minas, frescal', 40], ['Café, infusão 10%', 150]],
        [['Aveia, flocos, crua', 40], ['Leite, de vaca, integral', 200], ['Banana, prata, crua', 90]],
    ],
    lunch: [
        [['Arroz, tipo 1, cozido', 150], ['Feijão, carioca, cozido', 120], ['Frango, peito, sem pele, grelhado', 130], ['Alface, crespa, crua', 40]],
        [['Arroz, tipo 1, cozido', 140], ['Feijão, carioca, cozido', 100], ['Carne, bovina, patinho, sem gordura, grelhado', 120], ['Brócolis, cozido', 60]],
    ],
    snack: [
        [['Iogurte, natural', 170], ['Aveia, flocos, crua', 20]],
        [['Maçã, Fuji, com casca, crua', 130], ['Queijo, minas, frescal', 30]],
        [['Mamão, Papaia, cru', 150], ['Aveia, flocos, crua', 20]],
    ],
    dinner: [
        [['Batata, doce, cozida', 150], ['Carne, bovina, patinho, sem gordura, grelhado', 120], ['Brócolis, cozido', 80]],
        [['Arroz, tipo 1, cozido', 120], ['Frango, peito, sem pele, grelhado', 130], ['Alface, crespa, crua', 40]],
        [['Pão, trigo, francês', 50], ['Ovo, de galinha, inteiro, cozido/10minutos', 100], ['Queijo, minas, frescal', 30]],
    ],
};
const MEAL_SHARE: Record<MealType, number> = { breakfast: 0.22, lunch: 0.36, snack: 0.12, dinner: 0.30 };

function portionKcal([description, grams]: Portion): number {
    const food = TACO.get(description);
    if (!food) throw new Error(`Alimento nao encontrado na TACO: ${description}`);
    return (food.energyKcal * grams) / 100;
}

// ── Treinos ───────────────────────────────────────────────────────────────────
interface SeedExercise { name: string; startKg: number; stepKg: number; reps: number }
interface SeedRoutine { title: string; weekday: number; intensity: 'moderate' | 'intense'; exercises: SeedExercise[] }

const ROUTINES: SeedRoutine[] = [
    { title: 'Peito e Tríceps', weekday: 1, intensity: 'intense', exercises: [
        { name: 'Supino reto com barra', startKg: 50, stepKg: 2.5, reps: 8 },
        { name: 'Supino inclinado com halteres', startKg: 18, stepKg: 2, reps: 10 },
        { name: 'Tríceps pulley', startKg: 25, stepKg: 5, reps: 12 },
    ] },
    { title: 'Costas e Bíceps', weekday: 3, intensity: 'intense', exercises: [
        { name: 'Puxada frontal', startKg: 45, stepKg: 5, reps: 10 },
        { name: 'Remada curvada com barra', startKg: 40, stepKg: 2.5, reps: 8 },
        { name: 'Rosca direta com barra', startKg: 20, stepKg: 2.5, reps: 10 },
    ] },
    { title: 'Pernas', weekday: 5, intensity: 'intense', exercises: [
        { name: 'Agachamento livre', startKg: 60, stepKg: 5, reps: 8 },
        { name: 'Leg press', startKg: 120, stepKg: 10, reps: 10 },
        { name: 'Cadeira extensora', startKg: 35, stepKg: 5, reps: 12 },
    ] },
];

async function main(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        console.error('seed:demo nao roda em producao.');
        process.exitCode = 1;
        return;
    }
    const email = (parseArg('email') ?? DEFAULT_EMAIL).trim().toLowerCase();
    const weeks = Number(parseArg('weeks') ?? 6);

    dotenv.config({ path: ['.env', '../.env'] });
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI nao definido (.env)');
        process.exitCode = 1;
        return;
    }
    await mongoose.connect(uri);
    const db = mongoose.connection;
    const col = (name: string) => db.collection(name);

    try {
        const userDoc = await col('users').findOne({ email });
        if (!userDoc) {
            console.error(`Usuario ${email} nao encontrado. Crie a conta no app e rode de novo.`);
            process.exitCode = 1;
            return;
        }
        const user = userDoc._id as Types.ObjectId;
        // O ProfileService consulta com o id em texto ({ user: userId }), entao o perfil costuma ter `user` como string
        const profileFilter = { user: { $in: [user, String(user)] } };
        const existingProfile = await col('user_profile').findOne(profileFilter);
        const timezone = resolveTimezone(existingProfile?.timezone as string | undefined);
        const today = toUserDate(timezone);
        const currentWeek = weekWindow(today);
        const start = addDays(currentWeek.startDate, -7 * weeks);
        const totalDays = Math.round((Date.parse(today) - Date.parse(start)) / 86_400_000);

        // ── Limpa o historico do usuario ────────────────────────────────────
        const wipe = ['food_logs', 'day_closes', 'cycles', 'vault_entries', 'coin_entries', 'workout_logs', 'workout',
            'step_logs', 'free_meals', 'weight_logs', 'saved_meals', 'favorite_foods'];
        for (const name of wipe) {
            const { deletedCount } = await col(name).deleteMany({ user });
            if (deletedCount) console.log(`  apagados ${String(deletedCount).padStart(4)} de ${name}`);
        }

        const tacoIds = new Map<string, string>();
        for (const t of await col('taco').find({}, { projection: { description: 1 } }).toArray()) {
            tacoIds.set(t.description as string, String(t._id));
        }

        // ── Rotinas ──────────────────────────────────────────────────────────
        const routineIds = new Map<string, Types.ObjectId>();
        for (const r of ROUTINES) {
            const _id = new Types.ObjectId();
            routineIds.set(r.title, _id);
            await col('workout').insertOne({
                _id, user, title: r.title, description: SEED_TAG, estimatedMinutes: 60, scheduledDays: [r.weekday],
                intensity: r.intensity, completionCount: 0, lastCompletedDate: null,
                exercises: r.exercises.map((e) => ({
                    name: e.name,
                    sets: [1, 2, 3].map((n) => ({ setNumber: n, weightKg: e.startKg, reps: e.reps, technique: 'normal', restSeconds: 90 })),
                })),
                createdAt: at(start, 8), updatedAt: at(start, 8),
            });
        }
        const sessionCount = new Map<string, number>();

        // ── Dias sem fechar (as duas falhas do comeco) ──────────────────────
        const missed = new Set([addDays(start, 9), addDays(start, 18)]);

        // ── Estado que atravessa os dias ────────────────────────────────────
        const weightLogs: { date: string; weightKg: number }[] = [];
        let currentWeight = START_WEIGHT_KG;
        const closed: { date: string; counts: boolean }[] = [];
        let cycleId: Types.ObjectId | null = null;
        let vaultBalance = 0;
        let coinBalance = 0;
        let totalXp = 0;
        let previousStreak = 0;
        const counts = { food: 0, closes: 0, workouts: 0, steps: 0, freeMeals: 0, coins: 0 };

        const coin = async (amount: number, reason: CoinReason, refId: string, date: string, hour: number) => {
            await col('coin_entries').insertOne({ user, amount, reason, refId, createdAt: at(date, hour), updatedAt: at(date, hour) });
            coinBalance += amount;
            counts.coins++;
            if (amount > 0 && reason in REWARDS) totalXp += REWARDS[reason as keyof typeof REWARDS].xp;
        };
        const vault = async (kcal: number, type: string, refId: string, date: string, hour: number) => {
            if (kcal === 0 || !cycleId) return;
            await col('vault_entries').insertOne({ user, cycle: cycleId, date, kcal, type, refId, createdAt: at(date, hour), updatedAt: at(date, hour) });
            vaultBalance += kcal;
        };

        for (let i = 0; i <= totalDays; i++) {
            const date = addDays(start, i);
            const weekday = dayOfWeek(date);
            const isToday = date === today;

            // Segunda: abre o ciclo da semana (passadas ja nascem fechadas)
            if (weekday === 1 || i === 0) {
                const w = weekWindow(date);
                cycleId = new Types.ObjectId();
                const isPast = w.endDate < today;
                await col('cycles').insertOne({
                    _id: cycleId, user, startDate: w.startDate, endDate: w.endDate,
                    status: isPast ? 'closed' : 'open', closedAt: isPast ? at(addDays(w.endDate, 1), 0, 5) : null,
                    createdAt: at(w.startDate, 0, 1), updatedAt: at(w.startDate, 0, 1),
                });
                vaultBalance = 0;
                coinBalance = 0;
            }

            // Peso: tendencia de queda com oscilacao diaria; pesa ~4x por semana (hoje nao)
            const trueWeight = START_WEIGHT_KG - KG_PER_DAY * i + between(-0.35, 0.35);
            if (!isToday && (i === 0 || rnd() < 0.55)) {
                currentWeight = round1(trueWeight);
                weightLogs.push({ date, weightKg: currentWeight });
            }
            const body = { ...BODY, weightKg: currentWeight };
            const bmr = calculateBmr(body);
            const baseKcal = calculateBaseKcal(bmr, ACTIVITY);

            // Treino do dia (nao treina nos dias que falhou nem hoje)
            let workoutKcal = 0;
            const routine = ROUTINES.find((r) => r.weekday === weekday);
            const skipWorkout = missed.has(date) || isToday || rnd() < 0.08;
            if (routine && !skipWorkout) {
                const n = sessionCount.get(routine.title) ?? 0;
                sessionCount.set(routine.title, n + 1);
                let totalSets = 0;
                let totalVolume = 0;
                const exercises = routine.exercises.map((e) => {
                    const weight = e.startKg + Math.floor(n / 2) * e.stepKg;
                    const sets = [
                        { setNumber: 1, weightKg: Math.round(weight * 0.5), reps: 12, technique: 'warmup' },
                        ...[2, 3, 4].map((s) => ({ setNumber: s, weightKg: weight, reps: Math.max(5, e.reps - (s - 2) - Math.floor(rnd() * 2)), technique: 'normal' })),
                    ];
                    totalSets += sets.length;
                    totalVolume += volumeKg(sets);
                    return { exerciseName: e.name, maxWeightKg: maxWeight(sets), completedSetsCount: sets.length, sets };
                });
                const duration = estimateDurationMinutes(totalSets);
                workoutKcal = calculateWorkoutNetKcal(routine.intensity, currentWeight, duration);
                await col('workout_logs').insertOne({
                    user, routineId: String(routineIds.get(routine.title)), routineName: routine.title, durationMinutes: duration,
                    intensity: routine.intensity, caloriesBurned: workoutKcal, totalVolumeKg: totalVolume, totalSets,
                    xpGained: REWARDS[CoinReason.WORKOUT].xp, coinsGained: REWARDS[CoinReason.WORKOUT].coins,
                    date, exercises, completedAt: at(date, 19), createdAt: at(date, 19), updatedAt: at(date, 19),
                });
                await col('workout').updateOne({ _id: routineIds.get(routine.title) }, { $inc: { completionCount: 1 }, $set: { lastCompletedDate: date } });
                await coin(REWARDS[CoinReason.WORKOUT].coins, CoinReason.WORKOUT, date, date, 19);
                counts.workouts++;
            }

            // Passos
            const steps = isToday ? 3200 : Math.round(between(5200, 11800));
            const stepsKcal = calculateStepsNetKcal(steps, currentWeight);
            const stepsGoal = !isToday && steps >= STEPS_GOAL;
            await col('step_logs').insertOne({
                user, date, steps, caloriesBurned: stepsKcal, coinsEarned: stepsGoal ? REWARDS[CoinReason.STEPS_GOAL].coins : 0,
                source: 'manual', createdAt: at(date, 21), updatedAt: at(date, 21),
            });
            if (stepsGoal) await coin(REWARDS[CoinReason.STEPS_GOAL].coins, CoinReason.STEPS_GOAL, date, date, 21);
            counts.steps++;

            const targetKcal = calculateDailyTargetKcal(baseKcal, workoutKcal + stepsKcal, GOAL);

            // Diario: dia normal fica um pouco abaixo da meta; de vez em quando passa (excedente)
            if (missed.has(date)) continue; // nao registrou nada nem fechou
            const overflowDay = !isToday && i % 9 === 4;
            const factor = overflowDay ? between(1.07, 1.14) : between(0.84, 0.97);
            const meals: MealType[] = isToday ? ['breakfast', 'lunch'] : ['breakfast', 'lunch', 'snack', 'dinner'];
            let consumed = 0;
            let foodLogsCount = 0;
            for (const mealType of meals) {
                const options = MENUS[mealType];
                const menu = options[(i + mealType.length) % options.length];
                const menuKcal = menu.reduce((s, p) => s + portionKcal(p), 0);
                const scale = (targetKcal * factor * MEAL_SHARE[mealType]) / menuKcal;
                for (const [description, grams] of menu) {
                    const food = TACO.get(description)!;
                    const amount = Math.max(5, Math.round((grams * scale) / 5) * 5);
                    const k = amount / 100;
                    const sourceId = tacoIds.get(description);
                    const kcal = Math.round(food.energyKcal * k);
                    consumed += kcal;
                    await col('food_logs').insertOne({
                        user, date, mealType, foodName: description, amountGrams: amount,
                        calories: kcal, proteinGrams: round1(food.protein * k), carbGrams: round1(food.carbohydrates * k), fatGrams: round1(food.lipids * k),
                        ...(sourceId
                            ? { source: 'TACO', sourceId, nutrientsPer100g: { calories: food.energyKcal, protein: food.protein, carbs: food.carbohydrates, fat: food.lipids } }
                            : { source: 'DIARY' }),
                        createdAt: at(date, { breakfast: 8, lunch: 12, snack: 16, dinner: 20 }[mealType]),
                        updatedAt: at(date, { breakfast: 8, lunch: 12, snack: 16, dinner: 20 }[mealType]),
                    });
                    counts.food++;
                    foodLogsCount++;
                }
            }
            if (isToday) continue; // hoje fica aberto

            // Fechamento do dia (mesma conta do POST /day/close)
            const dv = calculateDayVault({ closed: true, hasFoodLogs: true, targetKcal, consumedKcal: consumed, vaultBalanceKcal: vaultBalance });
            await col('day_closes').insertOne({
                user, date, cycle: cycleId, bmr, baseKcal, workoutKcal, stepsKcal, activeKcal: workoutKcal + stepsKcal, targetKcal,
                consumedKcal: consumed, foodLogsCount, savedKcal: dv.savedKcal, overflowKcal: dv.overflowKcal, vaultDebitKcal: dv.debitKcal,
                vaultApplied: true, closedAt: at(date, 22), createdAt: at(date, 22), updatedAt: at(date, 22),
            });
            await vault(dv.savedKcal, 'day_close', date, date, 22);
            await vault(-dv.debitKcal, 'overflow', date, date, 22);
            await coin(REWARDS[CoinReason.DAY_CLOSE].coins, CoinReason.DAY_CLOSE, date, date, 22);
            counts.closes++;

            closed.push({ date, counts: true });
            const { currentStreak } = computeStreak(closed);
            if (streakBonusesCrossed(previousStreak, currentStreak) > 0) {
                await coin(REWARDS[CoinReason.STREAK_7].coins, CoinReason.STREAK_7, date, date, 22);
            }
            previousStreak = currentStreak;

            // Sabado das semanas passadas: resgata a refeicao livre da semana, se o cofre e as moedas cobrem
            const w = weekWindow(date);
            if (weekday === 6 && w.endDate < today) {
                const template = FREE_MEAL_CATALOG[counts.freeMeals % FREE_MEAL_CATALOG.length];
                const preset = vaultBalance >= 1600 ? template.presets.medium : template.presets.light;
                const items = template.items
                    .filter((it) => (preset[it.key] ?? 0) > 0)
                    .map((it) => ({
                        key: it.key, name: it.name, unit: it.unit, kcalPerUnit: it.kcalPerUnit, qty: preset[it.key],
                        source: { kind: 'catalog', refId: template.slug, name: it.source.name, url: it.source.url, accessedAt: it.source.accessedAt },
                    }));
                const estimated = Math.round(items.reduce((s, it) => s + it.kcalPerUnit * it.qty, 0));
                const ticket = FREE_MEAL_TICKETS[FreeMealScope.WEEK];
                if (vaultBalance >= estimated && coinBalance >= ticket.coins) {
                    const mealId = new Types.ObjectId();
                    const templateDoc = await col('free_meal_templates').findOne({ slug: template.slug }, { projection: { _id: 1 } });
                    await col('free_meals').insertOne({
                        _id: mealId, user, scope: FreeMealScope.WEEK, template: templateDoc?._id ?? null, templateSlug: template.slug,
                        title: template.name, scheduledFor: date, plannedItems: items, estimatedKcal: estimated,
                        actualItems: [], actualKcal: estimated, exceededKcal: 0, vaultDebitKcal: estimated,
                        ticketCost: ticket.coins, cycle: cycleId, status: 'redeemed', cancelReason: null, cancelledAt: null,
                        redeemedAt: at(date, 21), createdAt: at(w.startDate, 9), updatedAt: at(date, 21),
                    });
                    await vault(-estimated, 'redeem', String(mealId), date, 21);
                    await coin(-ticket.coins, ticket.reason, String(mealId), date, 21);
                    counts.freeMeals++;
                }
            }

            // Domingo de semana passada: fim do ciclo zera o que sobrou do cofre e das moedas
            if (weekday === 0 && date < today && cycleId) {
                const resetAt = addDays(date, 1);
                if (vaultBalance > 0) await vault(-vaultBalance, 'cycle_reset', String(cycleId), date, 23);
                if (coinBalance > 0) await coin(-coinBalance, CoinReason.CYCLE_RESET, String(cycleId), resetAt, 0);
            }
        }

        // ── Semana atual: refeicao livre agendada para domingo ──────────────
        const nextTemplate = FREE_MEAL_CATALOG.find((m) => m.slug === 'hamburguer-artesanal') ?? FREE_MEAL_CATALOG[0];
        const plannedItems = nextTemplate.items
            .filter((it) => (nextTemplate.presets.medium[it.key] ?? 0) > 0)
            .map((it) => ({
                key: it.key, name: it.name, unit: it.unit, kcalPerUnit: it.kcalPerUnit, qty: nextTemplate.presets.medium[it.key],
                source: { kind: 'catalog', refId: nextTemplate.slug, name: it.source.name, url: it.source.url, accessedAt: it.source.accessedAt },
            }));
        const nextTemplateDoc = await col('free_meal_templates').findOne({ slug: nextTemplate.slug }, { projection: { _id: 1 } });
        await col('free_meals').insertOne({
            user, scope: FreeMealScope.WEEK, template: nextTemplateDoc?._id ?? null, templateSlug: nextTemplate.slug,
            title: nextTemplate.name, scheduledFor: currentWeek.endDate, plannedItems,
            estimatedKcal: Math.round(plannedItems.reduce((s, it) => s + it.kcalPerUnit * it.qty, 0)),
            actualItems: [], actualKcal: null, exceededKcal: null, vaultDebitKcal: null,
            ticketCost: FREE_MEAL_TICKETS[FreeMealScope.WEEK].coins, cycle: cycleId, status: 'planned',
            cancelReason: null, cancelledAt: null, redeemedAt: null, createdAt: at(currentWeek.startDate, 9), updatedAt: at(currentWeek.startDate, 9),
        });

        // ── Peso ────────────────────────────────────────────────────────────
        await col('weight_logs').insertMany(weightLogs.map((w) => ({ user, ...w, createdAt: at(w.date, 7), updatedAt: at(w.date, 7) })));

        // ── Favoritos e refeicoes prontas ───────────────────────────────────
        for (const description of ['Frango, peito, sem pele, grelhado', 'Arroz, tipo 1, cozido', 'Banana, prata, crua']) {
            const food = TACO.get(description)!;
            await col('favorite_foods').insertOne({
                user, source: 'TACO', sourceId: tacoIds.get(description) ?? description, name: description,
                nutrientsPer100g: { calories: food.energyKcal, protein: food.protein, carbs: food.carbohydrates, fat: food.lipids },
                servingSizeGrams: 100, createdAt: at(start, 12), updatedAt: at(start, 12),
            });
        }
        const savedMeal = (name: string, menu: Portion[]) => ({
            user, name, createdAt: at(start, 12), updatedAt: at(start, 12),
            items: menu.map(([description, grams]) => {
                const food = TACO.get(description)!;
                const k = grams / 100;
                const sourceId = tacoIds.get(description);
                return {
                    foodName: description, amountGrams: grams, calories: Math.round(food.energyKcal * k),
                    proteinGrams: round1(food.protein * k), carbGrams: round1(food.carbohydrates * k), fatGrams: round1(food.lipids * k),
                    ...(sourceId ? { source: 'TACO', sourceId, nutrientsPer100g: { calories: food.energyKcal, protein: food.protein, carbs: food.carbohydrates, fat: food.lipids } } : { source: 'DIARY' }),
                };
            }),
        });
        await col('saved_meals').insertMany([
            savedMeal('Café padrão', MENUS.breakfast[0]),
            savedMeal('Almoço fit', MENUS.lunch[0]),
        ]);

        // ── Perfil (peso = pesagem mais recente) e metas ────────────────────
        const latestWeight = weightLogs[weightLogs.length - 1].weightKg;
        const nutrition = { ...BODY, weightKg: latestWeight, activityLevel: ACTIVITY, primaryGoal: GOAL };
        const targets = await new ProfileService(null as never, null as never).calculateNutritionTargets(nutrition);
        const profileUpdate = {
            $set: {
                ...nutrition, timezone, targetWeightKg: TARGET_WEIGHT_KG, targetReachedAt: null,
                targetCalories: targets.targetCalories, targetProteinGrams: targets.proteinGrams,
                targetCarbGrams: targets.carbGrams, targetFatGrams: targets.fatGrams, updatedAt: new Date(),
            },
        };
        if (existingProfile) {
            await col('user_profile').updateMany(profileFilter, profileUpdate);
        } else {
            await col('user_profile').insertOne({ user: String(user), ...profileUpdate.$set, createdAt: new Date() });
        }

        // ── Progresso: nivel pelo XP total (mesma curva do ProgressService.addXp) ──
        let level = 1;
        let nextLevelXp = 100;
        let currentXp = totalXp;
        while (currentXp >= nextLevelXp) {
            currentXp -= nextLevelXp;
            level += 1;
            nextLevelXp = Math.floor(nextLevelXp * 1.5);
        }
        const streak = computeStreak(closed);
        const bestStreak = (() => {
            let best = 0; let run = 0; let prev: string | null = null;
            for (const c of closed) {
                run = prev && addDays(prev, 1) === c.date ? run + 1 : 1;
                best = Math.max(best, run); prev = c.date;
            }
            return best;
        })();
        await col('progress').updateOne({ user }, {
            $set: {
                level, currentXp, nextLevelXp, currentStreak: streak.currentStreak, bestStreak,
                lastClosedDate: streak.lastClosedDate, lastWeeklySummarySeen: null, updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
        }, { upsert: true });

        console.log(`\nPronto para ${email} (${start} -> ${today}, fuso ${timezone}):`);
        console.log(`  ${counts.closes} dias fechados, sequencia atual ${streak.currentStreak} (melhor ${bestStreak})`);
        console.log(`  ${counts.workouts} treinos, ${counts.food} alimentos registrados, ${counts.steps} dias de passos`);
        console.log(`  ${weightLogs.length} pesagens: ${START_WEIGHT_KG} -> ${latestWeight} kg (meta ${TARGET_WEIGHT_KG} kg)`);
        console.log(`  ${counts.freeMeals} refeicoes livres resgatadas + 1 agendada para ${currentWeek.endDate}`);
        console.log(`  semana atual: cofre ${vaultBalance} kcal, ${coinBalance} moedas | nivel ${level} (${currentXp}/${nextLevelXp} XP)`);
        console.log(`  metas: ${targets.targetCalories} kcal, P ${targets.proteinGrams} g, C ${targets.carbGrams} g, G ${targets.fatGrams} g`);
        console.log('  O resumo da semana passada vai abrir no proximo acesso ao Hub.');
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
