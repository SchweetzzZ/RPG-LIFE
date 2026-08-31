import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Quest, QuestDocument, QuestStatus, QuestType } from "./schemas/quest-schema";
import { CharacterService } from "../character/character.service";
import { ProfileService } from "../profile/profile.service";
import { CreateQuestDto, UpdateQuestDto } from "./dto/quest-dto";

@Injectable()
export class QuestService {
    constructor(
        @InjectModel(Quest.name) private readonly questModel: Model<QuestDocument>,
        private readonly characterService: CharacterService,
        private readonly profileService: ProfileService,
    ) { }

    // 1. Criar Quest própria usando o DTO do Zod
    async createUserQuest(userId: string, dto: CreateQuestDto): Promise<Quest> {
        return this.questModel.create({
            ...dto,
            user: new Types.ObjectId(userId),
            type: dto.type || QuestType.USER_CREATED,
            isAccepted: true,
        });
    }

    // 2. Editar/Atualizar Quest usando o DTO do Zod
    async updateQuest(userId: string, questId: string, dto: UpdateQuestDto): Promise<Quest> {
        const updated = await this.questModel.findOneAndUpdate(
            { _id: questId, user: new Types.ObjectId(userId) },
            { $set: dto },
            { new: true }
        );

        if (!updated) {
            throw new NotFoundException("Quest não encontrada");
        }

        return updated;
    }

    // 3. Concluir Quest e dar Recompensas
    async completeQuest(userId: string, questId: string) {
        const quest = await this.questModel.findOne({
            _id: questId,
            user: new Types.ObjectId(userId),
        });

        if (!quest) {
            throw new NotFoundException("Quest não encontrada");
        }

        if (quest.status === QuestStatus.COMPLETED) {
            return { quest, rpgReward: null };
        }

        quest.status = QuestStatus.COMPLETED;
        await quest.save();

        const rpgReward = await this.characterService.addXpAndCoin(userId, {
            xpGained: quest.xpReward,
            coinsGained: quest.coinsReward,
            category: 'habit',
            statBonus: quest.targetStat ? { stat: quest.targetStat, amount: 1 } : undefined,
        });

        return {
            quest,
            rpgReward: {
                xpGained: rpgReward.xpGained,
                coinsGained: quest.coinsReward,
                leveledUp: rpgReward.leveledUp,
            },
        };
    }

    // 4. Listar Quests
    async getUserQuests(userId: string): Promise<Quest[]> {
        return this.questModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    // 5. Deletar Quest
    async deleteQuest(userId: string, questId: string): Promise<{ message: string }> {
        const result = await this.questModel.deleteOne({
            _id: questId,
            user: new Types.ObjectId(userId),
        });

        if (result.deletedCount === 0) {
            throw new NotFoundException("Quest não encontrada");
        }

        return { message: "Quest removida com sucesso" };
    }
}