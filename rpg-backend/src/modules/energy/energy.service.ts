import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { WorkoutLog, WorkoutLogDocument } from "../workout/schemas/workout-log";
import { StepLog, StepLogDocument } from "../activity/schema/step-log-schema";
import { FoodLog, FoodLogDocument } from "../nutricion/schema/food-Log-schema";
import { CalculateNutritionInput } from "../profile/dto/profile-dto";
import {
    calculateBaseKcal,
    calculateBmr,
    calculateDailyTargetKcal,
    calculateStepsNetKcal,
} from "./energy-math";

export interface DayEnergy {
    bmr: number;
    baseKcal: number;
    workoutKcal: number;
    workoutsCount: number;
    steps: number;
    stepsKcal: number;
    activeKcal: number;
    targetKcal: number;
    consumedKcal: number;
    foodLogsCount: number;
    macros: { proteinGrams: number; carbGrams: number; fatGrams: number };
}

/**
 * Le os registros de um dia (treinos, passos, comida) e aplica a formula de energy-math.ts.
 * A matematica fica nas funcoes puras; aqui so o acesso ao banco.
 */
@Injectable()
export class EnergyService {
    constructor(
        @InjectModel(WorkoutLog.name) private readonly workoutLogModel: Model<WorkoutLogDocument>,
        @InjectModel(StepLog.name) private readonly stepLogModel: Model<StepLogDocument>,
        @InjectModel(FoodLog.name) private readonly foodLogModel: Model<FoodLogDocument>,
    ) { }

    async computeDay(userId: string, date: string, body: CalculateNutritionInput): Promise<DayEnergy> {
        const user = new Types.ObjectId(userId);
        const [workouts, stepLog, foodLogs] = await Promise.all([
            this.workoutLogModel.find({ user, date }).select('caloriesBurned').lean().exec(),
            this.stepLogModel.findOne({ user, date }).select('steps').lean().exec(),
            this.foodLogModel.find({ user, date }).select('calories proteinGrams carbGrams fatGrams').lean().exec(),
        ]);

        const bmr = calculateBmr(body);
        const baseKcal = calculateBaseKcal(bmr, body.activityLevel);

        // caloriesBurned do treino ja e liquido: (MET - 1) x peso x horas (gravado em /workout/session)
        const workoutKcal = workouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
        // Passos recalculados com o peso atual (so o que passa de 4.000 conta)
        const steps = stepLog?.steps ?? 0;
        const stepsKcal = calculateStepsNetKcal(steps, body.weightKg);
        const activeKcal = workoutKcal + stepsKcal;

        const targetKcal = calculateDailyTargetKcal(baseKcal, activeKcal, body.primaryGoal);

        const sum = (field: 'calories' | 'proteinGrams' | 'carbGrams' | 'fatGrams') =>
            Math.round(foodLogs.reduce((acc, f) => acc + (f[field] || 0), 0));

        return {
            bmr,
            baseKcal,
            workoutKcal,
            workoutsCount: workouts.length,
            steps,
            stepsKcal,
            activeKcal,
            targetKcal,
            consumedKcal: sum('calories'),
            foodLogsCount: foodLogs.length,
            macros: {
                proteinGrams: sum('proteinGrams'),
                carbGrams: sum('carbGrams'),
                fatGrams: sum('fatGrams'),
            },
        };
    }
}
