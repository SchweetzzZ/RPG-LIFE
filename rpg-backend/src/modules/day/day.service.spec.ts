import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DayService } from './day.service';
import { DayCloseDocument } from './schema/day-close.schema';
import { ProfileService } from '../profile/profile.service';
import { EnergyService, DayEnergy } from '../energy/energy.service';
import { VaultService } from '../vault/vault.service';
import { RewardService } from '../economy/reward.service';
import { ProgressService } from '../progress/progress.service';
import { ActivityLevel, BiologicalSex, PrimaryGoal } from '../profile/schema/profile.schema';
import { CoinReason } from '../economy/schema/coin-entry.schema';
import { toUserDate } from '../common/utils/user-date';

const TZ = 'America/Sao_Paulo';
const userId = new Types.ObjectId().toHexString();

function energy(overrides: Partial<DayEnergy> = {}): DayEnergy {
    return {
        bmr: 1780, baseKcal: 2136, workoutKcal: 0, workoutsCount: 0, steps: 0, stepsKcal: 0,
        activeKcal: 0, targetKcal: 2000, consumedKcal: 1500, foodLogsCount: 3,
        macros: { proteinGrams: 0, carbGrams: 0, fatGrams: 0 },
        ...overrides,
    };
}

/** DayService com dependencias falsas em memoria. */
function setup(dayEnergy: DayEnergy = energy()) {
    const today = toUserDate(TZ);
    const closes: Array<Record<string, unknown> & { date: string }> = [];

    const dayCloseModel = {
        findOne: (f: { date: string }) => ({ exec: () => Promise.resolve(closes.find((c) => c.date === f.date) ?? null) }),
        create: (doc: Record<string, unknown> & { date: string }) => {
            if (closes.some((c) => c.date === doc.date)) {
                return Promise.reject(Object.assign(new Error('E11000'), { code: 11000 }));
            }
            closes.push(doc);
            return Promise.resolve(doc);
        },
        find: () => ({
            select: () => ({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(closes.map((c) => ({ date: c.date }))) }) }) }) }),
        }),
    };

    const cycle = { _id: new Types.ObjectId(), user: new Types.ObjectId(userId), startDate: today, endDate: '2999-12-31' };
    let vaultBalance = 0;

    const profile = {
        getTimezone: jest.fn().mockResolvedValue(TZ),
        getNutritionInput: jest.fn().mockResolvedValue({
            weightKg: 80, heightCm: 180, age: 30, biologicalSex: BiologicalSex.MALE,
            activityLevel: ActivityLevel.SEDENTARY, primaryGoal: PrimaryGoal.MAINTAIN,
        }),
    };
    const energyService = { computeDay: jest.fn().mockResolvedValue(dayEnergy) };
    const vault = {
        getOpenCycle: jest.fn().mockResolvedValue(cycle),
        findCycleForDate: jest.fn().mockResolvedValue(null),
        balance: jest.fn(() => Promise.resolve(vaultBalance)),
        deposit: jest.fn((_c: unknown, _d: string, kcal: number) => { vaultBalance += kcal; return Promise.resolve(); }),
        debitOverflow: jest.fn((_c: unknown, _d: string, kcal: number) => { vaultBalance -= kcal; return Promise.resolve(); }),
    };
    const rewards = { grant: jest.fn().mockResolvedValue({ granted: true, coins: 10, xp: 50, leveledUp: false }) };
    const progress = {
        updateStreak: jest.fn().mockResolvedValue({ previousStreak: 0, currentStreak: 1, bestStreak: 1, lastClosedDate: today }),
        getOrCreate: jest.fn().mockResolvedValue({ currentStreak: 1, bestStreak: 1 }),
    };

    const service = new DayService(
        dayCloseModel as unknown as Model<DayCloseDocument>,
        profile as unknown as ProfileService,
        energyService as unknown as EnergyService,
        vault as unknown as VaultService,
        rewards as unknown as RewardService,
        progress as unknown as ProgressService,
    );
    return { service, today, closes, vault, rewards, setBalance: (v: number) => { vaultBalance = v; } };
}

describe('DayService.closeDay', () => {
    it('fecha o dia: guarda a sobra no cofre e paga +10 uma vez', async () => {
        const { service, vault, rewards } = setup();
        const r = await service.closeDay(userId);

        expect(r.alreadyClosed).toBe(false);
        expect(r.day.status).toBe('closed');
        expect(r.day.savedKcal).toBe(500);
        expect(vault.deposit).toHaveBeenCalledWith(expect.anything(), expect.any(String), 500);
        expect(rewards.grant).toHaveBeenCalledWith(userId, CoinReason.DAY_CLOSE, expect.any(String));
        expect(r.vaultBalanceKcal).toBe(500);
        expect(r.alert).toBeNull();
    });

    it('idempotente: fechar de novo devolve o existente sem pagar em dobro', async () => {
        const { service, vault, rewards } = setup();
        await service.closeDay(userId);
        const again = await service.closeDay(userId);

        expect(again.alreadyClosed).toBe(true);
        expect(again.rewards).toEqual({ coins: 0, xp: 0, leveledUp: false });
        expect(vault.deposit).toHaveBeenCalledTimes(1);
        expect(rewards.grant).toHaveBeenCalledTimes(1);
    });

    it('fechamento simultaneo: o indice unico faz o segundo virar "ja fechado"', async () => {
        const { service, rewards } = setup();
        const [a, b] = await Promise.all([service.closeDay(userId), service.closeDay(userId)]);
        expect([a.alreadyClosed, b.alreadyClosed].sort()).toEqual([false, true]);
        expect(rewards.grant).toHaveBeenCalledTimes(1);
    });

    it('dia acima da meta: debita do cofre (limitado ao saldo) e mostra o alerta neutro, sem perder moeda', async () => {
        const { service, vault, rewards, setBalance } = setup(energy({ consumedKcal: 2600 }));
        setBalance(400);
        const r = await service.closeDay(userId);

        expect(vault.debitOverflow).toHaveBeenCalledWith(expect.anything(), expect.any(String), 400);
        expect(r.vaultBalanceKcal).toBe(0);
        expect(r.day.overflowKcal).toBe(600);
        expect(r.alert).not.toBeNull();
        expect(rewards.grant).toHaveBeenCalledWith(userId, CoinReason.DAY_CLOSE, expect.any(String));
    });

    it('sem refeicao registrada fecha, mas nao rende nada e quebra a sequencia', async () => {
        const { service, closes, vault, rewards } = setup(energy({ foodLogsCount: 0, consumedKcal: 0 }));
        const r = await service.closeDay(userId);

        expect(r.day.status).toBe('closed');
        expect(r.day.savedKcal).toBe(0);
        expect(r.rewards).toEqual({ coins: 0, xp: 0, leveledUp: false });
        expect(r.notice).not.toBeNull();
        expect(vault.deposit).not.toHaveBeenCalled();
        expect(rewards.grant).not.toHaveBeenCalled();
        expect(closes[0].foodLogsCount).toBe(0); // a sequencia ignora esse dia
    });

    it('so hoje ou ontem', async () => {
        const { service } = setup();
        await expect(service.closeDay(userId, '2020-01-01')).rejects.toBeInstanceOf(BadRequestException);
    });
});
