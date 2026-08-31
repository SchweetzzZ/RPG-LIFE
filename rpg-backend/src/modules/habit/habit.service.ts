import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Habit, habitDocument, DailyHabitStatus } from "./schema/habit-schema";
import { CharacterService } from "../character/character.service";
import { ProfileService } from "../profile/profile.service";

@Injectable()
export class HabitService {
    constructor(
        @InjectModel(Habit.name) private readonly habitModel: Model<habitDocument>,
        @InjectModel(DailyHabitStatus.name) private readonly habitStatusModel: Model<DailyHabitStatus>,
        private readonly characterService: CharacterService,
        private readonly profileService: ProfileService,
    ) { }

    async createHabit(userId: string, data: Partial<Habit>): Promise<Habit> {
        const newHabit = await this.habitModel.create({
            ...data,
            user: new Types.ObjectId(userId),
        });
        return newHabit;
    }

    async getUserHabits(userId: string): Promise<Habit[]> {
        return this.habitModel.find({ user: userId }).exec();
    }

    async updateHabit(userId: string, habitId: string, data: Partial<Habit>): Promise<Habit> {
        const updated = await this.habitModel.findOneAndUpdate(
            { _id: habitId, user: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        );
        if (!updated) {
            throw new NotFoundException("Quest/Hábito não encontrado");
        }
        return updated;
    }

    // Excluir Hábito/Quest
    async deleteHabit(userId: string, habitId: string): Promise<{ message: string }> {
        const result = await this.habitModel.deleteOne({
            _id: habitId,
            user: new Types.ObjectId(userId),
        });
        if (result.deletedCount === 0) {
            throw new NotFoundException("Quest/Hábito não encontrado");
        }
        return { message: "Quest removida com sucesso" };
    }

    async logProgress(userId: string, habitId: string, progressAmount: number) {
        const habit = await this.habitModel.findOne({ _id: habitId, user: userId });
        if (!habit) {
            throw new NotFoundException("Habit not found");
        }

        const todayStr = new Date().toISOString().split("T")[0];

        let statusLog = await this.habitStatusModel.findOne({
            user: userId,
            habit: habitId,
            date: todayStr,
        });

        if (!statusLog) {
            statusLog = await this.habitStatusModel.create({
                user: userId,
                habit: habitId,
                date: todayStr,
                currentProgress: 0,
                isCompleted: false,
            });
        }

        statusLog.currentProgress += progressAmount;
        const target = habit.goal?.targetValue || 1;

        let rewardResult: Awaited<ReturnType<typeof this.characterService.addXpAndCoin>> | null = null;

        if (statusLog.currentProgress >= target && !statusLog.isCompleted) {
            statusLog.isCompleted = true;
            habit.currentStreak += 1;
            await habit.save();

            // Atribui recompensas ao personagem!
            rewardResult = await this.characterService.addXpAndCoin(userId, {
                xpGained: habit.xpReward,
                coinsGained: habit.coinsReward,
                category: 'habit',
                statBonus: habit.targetStat ? { stat: habit.targetStat as any, amount: 1 } : undefined,
            });
        }

        await statusLog.save();
        return {
            habit,
            statusLog,
            rpgReward: rewardResult ? {
                xpGained: rewardResult.xpGained,
                coinsGained: habit.coinsReward,
                multiplierApplied: rewardResult.multiplierApplied,
                leveledUp: rewardResult.leveledUp
            } : null
        };
    }
}