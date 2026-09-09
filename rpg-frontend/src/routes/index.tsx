import { createFileRoute } from '@tanstack/react-router';
import App from '../App';
import type { UserMeResponse } from '../types/dashboard';
import { UserHUD } from '../components/dashboard/UserHUD';

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

function IndexRouteComponent() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        <h1 className="text-xl front-bold text-amber-400">
          Preview do Dashboard
        </h1>
        <UserHUD data={mockUserData} />
      </div>
    </main>
  )
}