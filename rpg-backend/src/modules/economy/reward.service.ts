import { Injectable } from '@nestjs/common';
import { CoinService } from './economy.service';
import { ProgressService } from '../progress/progress.service';
import { REWARDS, RewardAction } from './rewards';

export interface RewardResult {
    /** false = essa acao ja tinha sido paga (mesmo motivo + refId); nada foi creditado agora. */
    granted: boolean;
    coins: number;
    xp: number;
    leveledUp: boolean;
}

/**
 * Paga moedas + XP de uma acao, no maximo uma vez por refId.
 * O XP so e somado quando a moeda e criada agora, assim os dois andam juntos e sao idempotentes.
 */
@Injectable()
export class RewardService {
    constructor(
        private readonly coinService: CoinService,
        private readonly progressService: ProgressService,
    ) { }

    async grant(userId: string, action: RewardAction, refId: string): Promise<RewardResult> {
        const { coins, xp } = REWARDS[action];
        const { created } = await this.coinService.addOnce(userId, coins, action, refId);
        if (!created) {
            return { granted: false, coins: 0, xp: 0, leveledUp: false };
        }
        const { leveledUp } = await this.progressService.addXp(userId, xp);
        return { granted: true, coins, xp, leveledUp };
    }
}
