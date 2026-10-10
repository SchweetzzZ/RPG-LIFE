import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CoinEntry, CoinEntryDocument, CoinReason } from './schema/coin-entry.schema';
import { isDuplicateKeyError } from '../common/utils/mongo-errors';

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
     * Grava uma entrada no maximo UMA vez por (usuario, motivo, refId).
     * Se ja existe, nao grava de novo e devolve `created: false`.
     * A garantia vem do indice unico parcial em `coin_entries` (vale tambem para chamadas simultaneas).
     */
    async addOnce(
        userId: string,
        amount: number,
        reason: CoinReason,
        refId: string,
    ): Promise<{ entry: CoinEntryDocument; created: boolean }> {
        if (!Number.isInteger(amount) || amount === 0) {
            throw new BadRequestException('A quantidade de moedas deve ser um inteiro diferente de zero');
        }
        const user = new Types.ObjectId(userId);
        const existing = await this.coinEntryModel.findOne({ user, reason, refId }).exec();
        if (existing) {
            return { entry: existing, created: false };
        }
        try {
            const entry = await this.coinEntryModel.create({ user, amount, reason, refId });
            return { entry, created: true };
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                const winner = await this.coinEntryModel.findOne({ user, reason, refId }).orFail().exec();
                return { entry: winner, created: false };
            }
            throw error;
        }
    }

    /**
     * Zera o saldo no fim do ciclo gravando uma entrada negativa (`cycle_reset`).
     * O saldo continua sendo a soma do livro-razao. Idempotente por `cycleId`.
     * Devolve quanto foi zerado (0 se o saldo ja era 0).
     */
    async resetBalance(userId: string, cycleId: string): Promise<number> {
        const current = await this.balance(userId);
        if (current <= 0) {
            return 0;
        }
        const { entry, created } = await this.addOnce(userId, -current, CoinReason.CYCLE_RESET, cycleId);
        return created ? -entry.amount : 0;
    }

    /**
     * Debita moedas (grava uma entrada negativa).
     * ATENCAO: conferir o saldo e gravar a entrada NAO e atomico; duas chamadas simultaneas
     * podem gastar o mesmo saldo. Hoje ninguem usa: o resgate da refeicao livre (Lote 3a) troca o
     * status da refeicao numa operacao condicional e debita com `addOnce` (refId = id da refeicao).
     * Para gastos novos, prefira esse padrao em vez de `spend`.
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
