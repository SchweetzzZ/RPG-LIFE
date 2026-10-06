import { createFileRoute } from '@tanstack/react-router';
import App from '../App';
import type {
  UserMeResponse,
  EnergyDailySummaryResponse,
  WeeklyBudgetResponse,
} from '../types/dashboard';
import { UserHUD } from '../components/dashboard/UserHUD';
import { EnergyBalance } from '../components/dashboard/energyBalance';
import { CaloricVault } from '../components/dashboard/CaloricVault';

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
});

const mockUserData: UserMeResponse = {
  user: {
    _id: '1',
    email: 'jogador@rpglife.com',
    username: 'Guerreiro da Silva',
    role: 'admin',
  },
  profile: {
    _id: 'p1',
    coins: 150,
    vaultBalance: 50,
    primaryGoal: 'lose_weight',
    heightCm: 175,
    weightKg: 80,
    age: 28,
    biologicalSex: 'M',
    activityLevel: 'moderate',
  },
  character: {
    _id: 'c1',
    nickname: 'Guerreiro da Silva',
    level: 5,
    currentXp: 350,
    nextLevelXp: 500,
    coins: 150,
    gems: 10,
    hp: 100,
    maxHp: 100,
    vaultBalance: 50,
    stats: {
      strength: 14,
      vitality: 12,
      agility: 10,
      discipline: 15,
    },
  },
};

const mockEnergyData: EnergyDailySummaryResponse = {
  date: new Date().toISOString(),
  summary: {
    bmr: 1780,
    tdee: 2450,
    activityCaloriesBurned: 450,
    totalBurnedCalories: 2230,
    totalCaloriesConsumed: 1800,
    remainingCalorieBudget: 650,
    netCalorieBalance: -430,
    totalCoinsEarned: 25,
    characterHp: 100,
    maxHp: 100,
    vaultBalance: 50,
  },
  breakdown: {
    workouts: {
      totalCalories: 300,
      coinsEarned: 15,
      count: 1,
    },
    steps: {
      count: 8540,
      caloriesBurned: 150,
      coinsEarned: 10,
    },
  },
};

const mockWeeklyBudgetData: WeeklyBudgetResponse = {
  weekRange: {
    start: '08/09',
    end: '14/09',
  },
  tdee: 2450,
  accumulatedWeekDeficit: 1200,
  weekendBufferTotal: 1200,
  weekendBufferPerDay: 600,
  vaultBalance: 50,
  dailyRecords: [
    {
      date: '2026-09-08',
      dayOfWeek: 1,
      isWeekday: true,
      tdee: 2450,
      caloriesBurned: 400,
      totalBudget: 2850,
      consumed: 2550,
      savedCalories: 300,
    },
    {
      date: '2026-09-09',
      dayOfWeek: 2,
      isWeekday: true,
      tdee: 2450,
      caloriesBurned: 350,
      totalBudget: 2800,
      consumed: 2500,
      savedCalories: 300,
    },
    {
      date: '2026-09-10',
      dayOfWeek: 3,
      isWeekday: true,
      tdee: 2450,
      caloriesBurned: 500,
      totalBudget: 2950,
      consumed: 2650,
      savedCalories: 300,
    },
    {
      date: '2026-09-11',
      dayOfWeek: 4,
      isWeekday: true,
      tdee: 2450,
      caloriesBurned: 450,
      totalBudget: 2900,
      consumed: 2600,
      savedCalories: 300,
    },
    {
      date: '2026-09-12',
      dayOfWeek: 5,
      isWeekday: true,
      tdee: 2450,
      caloriesBurned: 0,
      totalBudget: 2450,
      consumed: 2450,
      savedCalories: 0,
    },
    {
      date: '2026-09-13',
      dayOfWeek: 6,
      isWeekday: false,
      tdee: 2450,
      caloriesBurned: 0,
      totalBudget: 3050,
      consumed: 0,
      savedCalories: 0,
    },
    {
      date: '2026-09-14',
      dayOfWeek: 0,
      isWeekday: false,
      tdee: 2450,
      caloriesBurned: 0,
      totalBudget: 3050,
      consumed: 0,
      savedCalories: 0,
    },
  ],
};

import { ShopRewardBanner } from '../components/dashboard/ShopRewardBanner';

function IndexRouteComponent() {
  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-5">
        <UserHUD data={mockUserData} />
        <ShopRewardBanner currentCoins={mockUserData.profile?.coins ?? 150} />
        <EnergyBalance data={mockEnergyData} />
        <CaloricVault data={mockWeeklyBudgetData} />
      </div>
    </main>
  );
}
