import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { characterDocument, Character } from "./schema/character-schema";
import { Model } from "mongoose";
import { AddXpAndCoinDto } from "./dto/character-dto";
import { CharacterClassSchema } from "../character-classes/schema/character-class-schema";

@Injectable()
export class CharacterService {
    constructor(
        @InjectModel(Character.name) private characterModel: Model<characterDocument>
    ) { }

    async addXpAndCoin(userId: string, data: AddXpAndCoinDto) {
        const character = await this.characterModel
            .findOne({ user: userId })
            .populate<{ characterClass: CharacterClassSchema }>('characterClass')
            .exec()

        if (!character) {
            throw new BadRequestException('Personagem não encontrado')
        }

        let multiplier = 1.0

        if (character.characterClass && data.category) {
            const xpModifiers = character.characterClass.xpModifiers
            switch (data.category) {
                case 'workout': multiplier = xpModifiers.workoutXpMultiplier; break;
                case 'study': multiplier = xpModifiers.studyXpMultiplier; break;
                case 'health': multiplier = xpModifiers.healthXpMultiplier; break;
                case 'habit': multiplier = xpModifiers.habitXpMultiplier; break;
            }
        }

        const finalXpGained = Math.round(data.xpGained * multiplier)

        character.currentXp += finalXpGained
        character.coins += data.coinsGained

        let leveledUp = false

        while (character.currentXp >= character.nextLevelXp) {
            character.currentXp -= character.nextLevelXp
            character.level += 1
            character.nextLevelXp = Math.floor(character.nextLevelXp * 1.5)
            leveledUp = true
        }

        if (data.statBonus) {
            const currentStatValue = character.stats[data.statBonus.stat] || 0
            character.stats[data.statBonus.stat] = currentStatValue + data.statBonus.amount
            character.markModified('stats')
        }
        const savedCharacter = await character.save()
        return {
            character: savedCharacter,
            xpGained: finalXpGained,
            multiplierApplied: multiplier,
            leveledUp,
        }
    }

}