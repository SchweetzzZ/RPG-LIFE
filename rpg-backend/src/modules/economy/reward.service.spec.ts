import { Model, Types } from 'mongoose';
import { CoinService } from './economy.service';
import { RewardService } from './reward.service';
import { ProgressService } from '../progress/progress.service';
import { CoinEntryDocument, CoinReason } from './schema/coin-entry.schema';

type Entry = { user: Types.ObjectId; amount: number; reason: CoinReason; refId?: string };

/** Model falso em memoria que imita o indice unico (user, reason, refId). */
function fakeCoinModel() {
    const entries: Entry[] = [];
    const same = (a: Entry, f: Partial<Entry>) =>
        String(a.user) === String(f.user) && a.reason === f.reason && a.refId === f.refId;
    const model = {
        entries,
        findOne: (filter: Partial<Entry>) => {
            const found = entries.find((e) => same(e, filter)) ?? null;
            const query = { exec: () => Promise.resolve(found), orFail: () => ({ exec: () => Promise.resolve(found) }) };
            return query;
        },
        create: (doc: Entry) => {
            if (doc.refId !== undefined && entries.some((e) => same(e, doc))) {
                return Promise.reject(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));
            }
            entries.push(doc);
            return Promise.resolve(doc);
        },
    };
    return model;
}

describe('moedas idempotentes', () => {
    const userId = new Types.ObjectId().toHexString();

    function setup() {
        const model = fakeCoinModel();
        const coins = new CoinService(model as unknown as Model<CoinEntryDocument>);
        const addXp = jest.fn().mockResolvedValue({ leveledUp: false });
        const progress = { addXp } as unknown as ProgressService;
        return { model, coins, addXp, rewards: new RewardService(coins, progress) };
    }

    it('moeda de treino so 1x por dia (e o XP junto)', async () => {
        const { model, rewards, addXp } = setup();

        const first = await rewards.grant(userId, CoinReason.WORKOUT, '2026-10-10');
        const second = await rewards.grant(userId, CoinReason.WORKOUT, '2026-10-10');
        const nextDay = await rewards.grant(userId, CoinReason.WORKOUT, '2026-10-11');

        expect(first).toEqual({ granted: true, coins: 20, xp: 100, leveledUp: false });
        expect(second).toEqual({ granted: false, coins: 0, xp: 0, leveledUp: false });
        expect(nextDay.granted).toBe(true);
        expect(model.entries).toHaveLength(2);
        expect(addXp).toHaveBeenCalledTimes(2);
    });

    it('chamadas simultaneas: o indice unico barra a segunda', async () => {
        const { model, coins } = setup();
        // as duas leem "nao existe" antes de qualquer uma gravar
        const results = await Promise.all([
            coins.addOnce(userId, 10, CoinReason.DAY_CLOSE, '2026-10-10'),
            coins.addOnce(userId, 10, CoinReason.DAY_CLOSE, '2026-10-10'),
        ]);
        expect(results.filter((r) => r.created)).toHaveLength(1);
        expect(model.entries).toHaveLength(1);
    });
});
