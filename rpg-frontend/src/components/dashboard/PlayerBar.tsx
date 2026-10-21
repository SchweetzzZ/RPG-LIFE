import { Coins, Flame } from 'lucide-react';
import type { UserMeResponse } from '@/src/types/dashboard';
import { formatNumber } from '@/src/lib/format';
import { Card } from '../ui/Card';
import { SegmentedBar } from '../ui/SegmentedBar';

interface PlayerBarProps {
  me: UserMeResponse;
}

/** A chama "esquenta" com a sequência: apagada, acesa e cheia. */
function streakTone(streak: number): { flame: string; filled: boolean } {
  if (streak >= 7) return { flame: 'text-xp', filled: true };
  if (streak >= 1) return { flame: 'text-xp', filled: false };
  return { flame: 'text-ink-faint', filled: false };
}

export function PlayerBar({ me }: PlayerBarProps) {
  const { user, progress, coinBalance } = me;
  const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
  const xpLeft = progress ? Math.max(0, progress.nextLevelXp - progress.currentXp) : 0;
  const streak = progress ? streakTone(progress.currentStreak) : null;

  return (
    <Card>
      <div className="flex items-center gap-3">
        {/* Retrato com o nível no canto, como em ficha de personagem */}
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-line bg-raised font-pixel text-2xl text-ink shadow-[inset_0_-4px_0_rgba(0,0,0,0.25)]">
            {initial}
          </div>
          {progress && (
            <span
              className="absolute -bottom-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-md border-2 border-[#0c0a08] bg-xp px-1 font-num text-base leading-none text-[#0c0a08] shadow-[0_2px_0_0_#0c0a08]"
              title={`Nível ${progress.level}`}
              aria-label={`Nível ${progress.level}`}
            >
              {progress.level}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="truncate font-pixel text-lg leading-none text-ink">{user.username}</h1>
          {progress && (
            <div className="space-y-1">
              <SegmentedBar value={progress.currentXp} max={progress.nextLevelXp} segments={10} tone="xp" label="XP do nível" />
              <p className="flex justify-between gap-2 text-xs text-ink-faint">
                <span className="tabular-nums">
                  {formatNumber(progress.currentXp)} / {formatNumber(progress.nextLevelXp)} XP
                </span>
                <span className="truncate">faltam {formatNumber(xpLeft)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-1.5">
          <span
            className="inline-flex items-center justify-end gap-1 rounded-md border-2 border-line bg-raised px-1.5 py-0.5 text-coin"
            aria-label={`Moedas: ${formatNumber(coinBalance)}`}
            title="Moedas"
          >
            <Coins className="h-4 w-4" aria-hidden />
            <span className="font-num text-lg leading-none">{formatNumber(coinBalance)}</span>
          </span>
          {progress && streak && (
            <span
              className={`inline-flex items-center justify-end gap-1 rounded-md border-2 border-line bg-raised px-1.5 py-0.5 ${streak.flame}`}
              aria-label={`Sequência: ${progress.currentStreak} dias (melhor ${progress.bestStreak})`}
              title={`Sequência de dias · melhor: ${progress.bestStreak}`}
            >
              <Flame className={`h-4 w-4 ${streak.filled ? 'fill-current' : ''}`} aria-hidden />
              <span className="font-num text-lg leading-none">{progress.currentStreak}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
