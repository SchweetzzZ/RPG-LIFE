import { Coins, Flame } from 'lucide-react';
import type { UserMeResponse } from '@/src/types/dashboard';
import { formatNumber } from '@/src/lib/format';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';
import { StatChip } from '../ui/StatChip';

interface PlayerBarProps {
  me: UserMeResponse;
}

export function PlayerBar({ me }: PlayerBarProps) {
  const { user, progress, coinBalance } = me;
  const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised font-pixel text-xl font-bold text-zinc-100">
          {initial}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold text-zinc-100">{user.username}</h1>
            {progress && (
              <span className="shrink-0 rounded border-2 border-xp/50 bg-raised px-1.5 py-0.5 font-pixel text-xs font-bold text-xp">
                NV {progress.level}
              </span>
            )}
          </div>
          {progress && (
            <div className="space-y-1">
              <SegmentedBar value={progress.currentXp} max={progress.nextLevelXp} segments={10} tone="xp" label="XP do nível" />
              <p className="text-xs text-zinc-500">
                {formatNumber(progress.currentXp)} / {formatNumber(progress.nextLevelXp)} XP
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatChip icon={Coins} value={formatNumber(coinBalance)} tone="coin" label="Moedas" />
          {progress && <StatChip icon={Flame} value={String(progress.currentStreak)} tone="xp" label="Sequência de dias" />}
        </div>
      </div>
    </Card>
  );
}
