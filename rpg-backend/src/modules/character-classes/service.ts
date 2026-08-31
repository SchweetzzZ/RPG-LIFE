import { ConflictException, Injectable } from "@nestjs/common";
import { CharacterClassDocument, CharacterClassSchema } from "./schema/character-class-schema";
import { CreateCharacterClassDto } from "./dto/character-class-validation";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class CharacterClassService {
    constructor(
        @InjectModel(CharacterClassSchema.name) private characterClassModel: Model<CharacterClassDocument>
    ) { }

    async onModuleInit() {
        await this.seedClassesIfEmpty()
    }

    async create(data: CreateCharacterClassDto) {
        const exists = await this.characterClassModel.findOne({ name: data.name });
        if (exists) {
            throw new ConflictException(`A classe "${data.name}" já existe!`);
        }

        return this.characterClassModel.create(data);
    }

    async getAll() {
        return this.characterClassModel.find({ isActive: true }).exec()
    }

    private async seedClassesIfEmpty() {
        const count = await this.characterClassModel.countDocuments();
        if (count > 0) return;

        const defaultClasses: CreateCharacterClassDto[] = [
            {
                name: 'Guerreiro',
                description: 'Focado em musculação, hipertrofia e ganho de força física.',
                statsBonus: { strength: 5, intelligence: 1, vitality: 3, focus: 1 },
                xpModifiers: { workoutXpMultiplier: 1.2, studyXpMultiplier: 1.0, healthXpMultiplier: 1.0, habitXpMultiplier: 1.0 },
                price: 0,
                isActive: true
            },
            {
                name: 'Mago',
                description: 'Focado em estudos, aprendizado, leitura e expansão de conhecimento.',
                statsBonus: { strength: 1, intelligence: 5, vitality: 1, focus: 3 },
                xpModifiers: { workoutXpMultiplier: 1.0, studyXpMultiplier: 1.2, healthXpMultiplier: 1.0, habitXpMultiplier: 1.0 },
                price: 0,
                isActive: true
            },
            {
                name: 'Sábio',
                description: 'Focado em saúde biológica, hidratação, qualidade de sono e nutrição.',
                statsBonus: { strength: 1, intelligence: 2, vitality: 5, focus: 2 },
                xpModifiers: { workoutXpMultiplier: 1.0, studyXpMultiplier: 1.0, healthXpMultiplier: 1.2, habitXpMultiplier: 1.0 },
                price: 0,
                isActive: true
            },
            {
                name: 'Caçador',
                description: 'Focado em constância de hábitos, organização e foco em tarefas diárias.',
                statsBonus: { strength: 2, intelligence: 2, vitality: 1, focus: 5 },
                xpModifiers: { workoutXpMultiplier: 1.0, studyXpMultiplier: 1.0, healthXpMultiplier: 1.0, habitXpMultiplier: 1.2 },
                price: 0,
                isActive: true
            },
        ];

        await this.characterClassModel.insertMany(defaultClasses);
    }
}
