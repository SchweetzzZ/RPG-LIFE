import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CoinEntry, CoinEntryDocument, CoinReason } from './schema/coin-entry.schema';

@Injectable()
export class CoinService {
    constructor(
        @InjectModel(CoinEntry.name) private readonly coinEntryModel: Model<CoinEntryDocument>,
    ) { }

    private assertPositiveInteger(amount: number) {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new BadRequestException('A quantidade de moedas deve ser um inteiro maior que zero');
        }
    }

    /** Credita moedas (grava uma entrada positiva). */
    async add(userId: string, amount: number, reason: CoinReason, refId?: string): Promise<CoinEntryDocument> {
        this.assertPositiveInteger(amount);
        return this.coinEntryModel.create({
            user: new Types.ObjectId(userId),
            amount,
            reason,
            ...(refId !== undefined ? { refId } : {}),
        });
    }

    /**
     * Debita moedas (grava uma entrada negativa).
     * ATENCAO: conferir o saldo e gravar a entrada NAO e atomico; duas chamadas simultaneas
     * podem gastar o mesmo saldo. Quando houver resgate real, isto deve virar transacao
     * (ou operacao atomica) no MongoDB.
     */
    async spend(userId: string, amount: number, reason: CoinReason, refId?: string): Promise<CoinEntryDocument> {
        this.assertPositiveInteger(amount);
        const current = await this.balance(userId);
        if (current < amount) {
            throw new BadRequestException('Saldo insuficiente de moedas');
        }
        return this.coinEntryModel.create({
            user: new Types.ObjectId(userId),
            amount: -amount,
            reason,
            ...(refId !== undefined ? { refId } : {}),
        });
    }

    /** Saldo = soma de todas as entradas do usuario. */
    async balance(userId: string): Promise<number> {
        const result = await this.coinEntryModel.aggregate<{ total: number }>([
            { $match: { user: new Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result[0]?.total ?? 0;
    }

    /** Entradas mais recentes primeiro. */
    async history(userId: string, limit = 50): Promise<CoinEntryDocument[]> {
        return this.coinEntryModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
}
