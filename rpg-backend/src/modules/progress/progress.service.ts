import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Progress, ProgressDocument } from "./schema/progress-schema";

@Injectable()
export class ProgressService {
    constructor(
        @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>
    ) { }

    // Devolve o progresso do usuario, criando um (nivel 1) se ainda nao existir.
    async getOrCreate(userId: string): Promise<ProgressDocument> {
        const userObjectId = new Types.ObjectId(userId)
        const existing = await this.progressModel.findOne({ user: userObjectId }).exec()
        if (existing) {
            return existing
        }
        return this.progressModel.create({ user: userObjectId })
    }

    async get(userId: string): Promise<ProgressDocument | null> {
        return this.progressModel.findOne({ user: new Types.ObjectId(userId) }).exec()
    }

    async addXp(userId: string, xp: number) {
        const progress = await this.getOrCreate(userId)

        progress.currentXp += xp

        let leveledUp = false

        while (progress.currentXp >= progress.nextLevelXp) {
            progress.currentXp -= progress.nextLevelXp
            progress.level += 1
            progress.nextLevelXp = Math.floor(progress.nextLevelXp * 1.5)
            leveledUp = true
        }

        const saved = await progress.save()
        return {
            progress: saved,
            xpGained: xp,
            leveledUp,
        }
    }
}
