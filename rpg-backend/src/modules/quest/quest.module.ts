import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { Quest, QuestSchema } from './schemas/quest-schema';
import { CharacterModule } from '../character/character.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Quest.name, schema: QuestSchema },
        ]),
        CharacterModule, // Injetado para dar recompensas de XP/Moedas
        ProfileModule,   // Injetado para ler dados biométricos ao gerar recomendações
    ],
    controllers: [QuestController],
    providers: [QuestService],
    exports: [QuestService],
})
export class QuestModule { }