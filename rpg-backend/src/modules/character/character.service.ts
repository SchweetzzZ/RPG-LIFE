import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { characterDocument, Character } from "./schema/character-schema";
import { Model } from "mongoose";
import { AddXpAndCoinDto } from "./dto/character-dto";

@Injectable()
export class CharacterService {
    constructor(
        @InjectModel(Character.name) private characterModel: Model<characterDocument>
    ) { }

    async addXpAndCoin(userId: string, data: AddXpAndCoinDto) {
        const character = await this.characterModel.findOne({
            user: userId
        })

        if (!character) {
            throw new BadRequestException('Character not found')
        }

        character.currentXp += data.xpGained
        character.coins += data.coinsGained

        while (character.currentXp >= character.nextLevelXp) {
            character.currentXp -= character.nextLevelXp
            character.level += 1
            character.nextLevelXp = Math.floor(character.nextLevelXp * 1.5)
        }

        if (data.statBonus) {
            character.stats[data.statBonus.stat] = (character.stats[data.statBonus.stat] || 0) + data.statBonus.amount;
        }

        return await character.save();
    }
}