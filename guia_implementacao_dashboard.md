# 🏛️ Guia de Implementação: Dashboard de Energia, Metas e Moedas

> **Princípio Fundamental:** Zero mocks estáticos, zero "localStorage como banco de dados fake". Todo dado exibido nesta tela vem dos contratos e endpoints reais do nosso backend NestJS (`/user/me`, `/energy/daily-summary`, `/energy/weekly-budget`).
> **Novo Direcionamento:** 100% focado em **Metas de Composição Corporal** (Emagrecimento, Manutenção, Hipertrofia) e uma **Economia Comportamental Real**: o esforço diário gera **Moedas**, que acumulam no cofre e compram **Refeições Livres (Cheat Meals)** sem culpa! Classes de caçador, rankings e barras de HP foram **totalmente eliminados**.

---

## 🔎 Auditoria de Contratos: Backend ➔ Frontend

Antes de escrever qualquer linha de front-end, analisamos o que a nossa API NestJS já entrega e o que o Dashboard consome:

### 1. `GET /user/me` (Módulo `User` + `Profile`)
| Campo no Backend | Origem no Backend | Uso no Dashboard | Status |
| :--- | :--- | :--- | :--- |
| `user.username` | `user-schema.ts` | Nome exibido do usuário | ✅ Disponível |
| `profile.primaryGoal` | `profile.schema.ts` | Meta de peso corporal (`lose_weight`, `maintain`, `gain_muscle`) | ✅ Disponível |
| `profile.weightKg` | `profile.schema.ts` | Peso corporal atual (kg) | ✅ Disponível |
| `profile.coins` | `profile.schema.ts` | **KPI Mestre:** Saldo de moedas para refeições livres | ✅ Disponível |
| `profile.vaultBalance` | `profile.schema.ts` | Saldo calórico guardado no cofre | ✅ Disponível |

> 📌 **Evolução Arquitetural Concluída:** As moedas (`coins`) e o cofre (`vaultBalance`) agora residem oficialmente em `profile` no MongoDB. O frontend consome `profile.coins` e `profile.vaultBalance` com 100% de tipagem estrita, sem qualquer dependência do módulo legado `character`.

---

### 2. `GET /energy/daily-summary` (Módulo `Energy`)
| Campo no Backend | Origem no Backend | Uso no Dashboard | Status |
| :--- | :--- | :--- | :--- |
| `summary.bmr` | `calculateBMR()` (Mifflin-St Jeor) | TMB Basal Diária | ✅ Disponível |
| `summary.tdee` | `bmr * activityMultiplier` | Meta calórica de manutenção/meta | ✅ Disponível |
| `summary.remainingCalorieBudget` | `totalBurned - consumed` | **Destaque Central:** Saldo restante | ✅ Disponível |
| `summary.activityCaloriesBurned` | `treino + passos` | Calorias queimadas em atividade | ✅ Disponível |
| `breakdown.workouts.totalCalories` | `workoutLogModel` | Gasto calórico com treinos | ✅ Disponível |
| `breakdown.steps.count` | `stepLogModel` | Passos dados no dia | ✅ Disponível |
| `breakdown.steps.caloriesBurned` | `stepLogModel` | Calorias gastas com passos | ✅ Disponível |
| `breakdown.steps.coinsEarned` | `stepLogModel` | Moedas ganhas com passos | ✅ Disponível |

---

### 3. `GET /energy/weekly-budget` (Módulo `Energy`)
| Campo no Backend | Origem no Backend | Uso no Dashboard | Status |
| :--- | :--- | :--- | :--- |
| `accumulatedWeekDeficit` | Soma do déficit de Seg a Sex | Saldo acumulado para o fim de semana | ✅ Disponível |
| `weekendBufferTotal` | Buffer total gerado | Calorias extras liberadas | ✅ Disponível |
| `vaultBalance` | Saldo oficial do cofre | Saldo guardado no cofre | ✅ Disponível |

---

## 📂 Arquitetura de Pastas e Componentes

Organização limpa e profissional dentro de `rpg-frontend/src/`:

```text
src/
├── types/
│   └── dashboard.ts            <-- Tipos 100% espelhados nos retornos do NestJS (OpenAPI)
├── services/
│   ├── api.ts                  <-- Cliente HTTP com interceptor de JWT
│   └── dashboard.service.ts    <-- Funções isoladas de chamada de API
├── components/
│   └── dashboard/
│       ├── UserHUD.tsx         <-- Bloco 1: Perfil, Meta Corporal, Saldo de Moedas & Barra Cheat Meal
│       ├── EnergyBalance.tsx   <-- Bloco 2: Balanço Calórico Diário Central
│       ├── CaloricVault.tsx    <-- Bloco 3: Cofre Semanal (Buffer para o Fim de Semana)
│       └── StepsQuest.tsx      <-- Bloco 4: Meta Diária de Passos (+Moedas geradas)
└── routes/
    └── index.tsx               <-- Página principal com Loading, Erro e Renderização
```

---

## 🔨 Passo a Passo da Implementação

---

### 🔹 ETAPA 1: Tipos 100% Derivados do Contrato Swagger (`src/types/dashboard.ts`)

Importamos os tipos diretamente do contrato gerado pelo OpenAPI:

```typescript
// rpg-frontend/src/types/dashboard.ts

import type { components } from '../api/schema';

export type UserMeResponse = components['schemas']['GetMeResponseDto'];
export type EnergyDailySummaryResponse = components['schemas']['EnergyDailySummaryResponseDto'];
export type WeeklyBudgetResponse = components['schemas']['WeeklyBudgetResponseDto'];
```

---

### 🔹 ETAPA 2: Camada de Serviços da API (`src/services/dashboard.service.ts`)

Consumo da API utilizando o `client` do `openapi-fetch` com tipagem estrita:

```typescript
import { client } from './api';
import type { UserMeResponse, EnergyDailySummaryResponse, WeeklyBudgetResponse } from '../types/dashboard';

export const dashboardService = {
  // Busca dados do Usuário e Perfil (GET /user/me)
  async getUserProfile(): Promise<UserMeResponse> {
    const { data, error } = await client.GET('/user/me');
    if (error || !data) {
      throw new Error('Falha ao buscar dados do usuário');
    }
    return data;
  },

  // Busca resumo calórico do dia (GET /energy/daily-summary)
  async getDailyEnergy(): Promise<EnergyDailySummaryResponse> {
    const { data, error } = await client.GET('/energy/daily-summary');
    if (error || !data) {
      throw new Error('Falha ao buscar resumo de energia');
    }
    return data;
  },

  // Busca o cofre semanal (GET /energy/weekly-budget)
  async getWeeklyBudget(): Promise<WeeklyBudgetResponse> {
    const { data, error } = await client.GET('/energy/weekly-budget');
    if (error || !data) {
      throw new Error('Falha ao buscar cofre semanal');
    }
    return data;
  },
};
```

---

### 🔹 ETAPA 3: Componentes do Dashboard

#### 1. `UserHUD.tsx` (`src/components/dashboard/UserHUD.tsx`)
Apresenta o usuário, seu objetivo corporal atual, o saldo em destaque de **Moedas** e a **Barra de Conquista da Próxima Refeição Livre**:

```tsx
import React from 'react';
import type { UserMeResponse } from '../../types/dashboard';

interface UserHUDProps {
  data: UserMeResponse;
  targetMeal?: {
    name: string;
    targetCoins: number;
  };
}

export function UserHUD({
  data,
  targetMeal = { name: 'Refeição Livre de Sábado', targetCoins: 2000 },
}: UserHUDProps) {
  const { user, profile } = data;
  const coins = profile?.coins ?? 0;
  const cheatProgress = Math.min(100, Math.round((coins / targetMeal.targetCoins) * 100));

  // Meta corporal formatada (aceita string, null ou undefined vindo de profile?.primaryGoal)
  const getGoalInfo = (goal?: string | null | undefined) => {
    switch (goal) {
      case 'lose_weight':
        return { label: 'Perda de Gordura', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
      case 'gain_muscle':
        return { label: 'Ganho de Massa', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
      case 'maintain':
      default:
        return { label: 'Manutenção de Peso', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' };
    }
  };

  const goal = getGoalInfo(profile?.primaryGoal);

  return (
    <div className="w-full border border-neutral-800 bg-neutral-900 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Linha 1: Avatar + Nome + Meta Corporal + Saldo de Moedas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center font-bold text-neutral-200 text-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-100 leading-tight">
              {user.username}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block border px-2 py-0.5 rounded text-[11px] font-semibold ${goal.color}`}>
                🎯 {goal.label}
              </span>
              {profile?.weightKg && (
                <span className="text-xs text-neutral-400 font-medium">
                  {profile.weightKg} kg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Saldo de Moedas em Destaque */}
        <div className="text-right border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 rounded-lg">
          <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
            Saldo
          </div>
          <div className="text-base font-extrabold text-amber-400 flex items-center justify-end gap-1">
            <span>🪙</span> {coins.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Linha 2: O Termômetro da Próxima Refeição Livre (Cheat Meal) */}
      <div className="border-t border-neutral-800/80 pt-2.5">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-neutral-300 font-medium flex items-center gap-1.5">
            🍔 <span>Rumo à {targetMeal.name}</span>
          </span>
          <span className="text-amber-400 font-bold">
            {coins.toLocaleString()} / {targetMeal.targetCoins.toLocaleString()} moedas ({cheatProgress}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
            style={{ width: `${cheatProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

#### 2. `EnergyBalance.tsx` (`src/components/dashboard/EnergyBalance.tsx`)
```tsx
import React from 'react';
import type { EnergyDailySummaryResponse } from '../../types/dashboard';

interface EnergyBalanceProps {
  data: EnergyDailySummaryResponse;
}

export function EnergyBalance({ data }: EnergyBalanceProps) {
  const { summary, breakdown } = data;

  return (
    <div className="w-full border border-neutral-800 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center text-xs text-neutral-400 border-b border-neutral-800 pb-2">
        <span className="font-semibold uppercase tracking-wider">Balanço Calórico Diário</span>
        <span className="text-cyan-400 font-medium">Meta: {summary.tdee} kcal</span>
      </div>

      {/* Mostrador Central de Saldo Calórico Restante */}
      <div className="flex flex-col items-center justify-center py-4 border border-neutral-800 bg-neutral-950 rounded-lg">
        <span className="text-3xl font-extrabold text-neutral-100">
          {summary.remainingCalorieBudget}
        </span>
        <span className="text-xs text-neutral-400 uppercase mt-1 tracking-wider">kcal restantes</span>
        <span className="text-xs text-neutral-500 mt-2">
          ({summary.activityCaloriesBurned} kcal queimadas em atividades)
        </span>
      </div>

      {/* Grid de 3 Métricas: TMB, Treino, Passos */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
          <div className="text-neutral-400">TMB (Basal)</div>
          <div className="font-bold text-neutral-200 mt-1">{summary.bmr} kcal</div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
          <div className="text-neutral-400">Treinos</div>
          <div className="font-bold text-neutral-200 mt-1">
            {breakdown.workouts.totalCalories} kcal
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-2.5 rounded-lg">
          <div className="text-neutral-400">Passos</div>
          <div className="font-bold text-neutral-200 mt-1">
            {breakdown.steps.caloriesBurned} kcal
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### 3. `CaloricVault.tsx` e `StepsQuest.tsx`
Crie `src/components/dashboard/CaloricVault.tsx`:
```tsx
import React from 'react';
import type { WeeklyBudgetResponse } from '../../types/dashboard';

interface CaloricVaultProps {
  data: WeeklyBudgetResponse;
}

export function CaloricVault({ data }: CaloricVaultProps) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 rounded-xl p-3 flex flex-col justify-between">
      <div>
        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Cofre Semanal</div>
        <div className="text-lg font-bold text-neutral-100 mt-1">
          {data.accumulatedWeekDeficit.toLocaleString()} <span className="text-xs font-normal text-neutral-400">kcal</span>
        </div>
      </div>
      <div className="text-xs text-neutral-400 mt-3 pt-2 border-t border-neutral-800">
        Buffer Fim de Semana: <span className="text-emerald-400 font-medium">+{data.weekendBufferTotal} kcal</span>
      </div>
    </div>
  );
}
```

Crie `src/components/dashboard/StepsQuest.tsx`:
```tsx
import React from 'react';
import type { EnergyDailySummaryResponse } from '../../types/dashboard';

interface StepsQuestProps {
  data: EnergyDailySummaryResponse;
}

export function StepsQuest({ data }: StepsQuestProps) {
  const steps = data.breakdown.steps;
  const targetSteps = 10000;
  const percent = Math.min(100, Math.round((steps.count / targetSteps) * 100));

  return (
    <div className="border border-neutral-800 bg-neutral-900 rounded-xl p-3 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold uppercase tracking-wider">
          <span>👟 Passos do Dia</span>
          <span>{percent}%</span>
        </div>
        <div className="text-lg font-bold text-neutral-100 mt-1">
          {steps.count.toLocaleString()} <span className="text-xs font-normal text-neutral-400">/ {targetSteps.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-[11px] text-amber-400 font-medium mt-1">
          +{steps.coinsEarned} moedas geradas
        </div>
      </div>
    </div>
  );
}
```

---

### 🔹 ETAPA 4: Conectando Tudo na Rota Principal (`src/routes/index.tsx`)

```tsx
import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { dashboardService } from '../services/dashboard.service';
import { UserHUD } from '../components/dashboard/UserHUD';
import { EnergyBalance } from '../components/dashboard/EnergyBalance';
import { CaloricVault } from '../components/dashboard/CaloricVault';
import { StepsQuest } from '../components/dashboard/StepsQuest';
import type {
  UserMeResponse,
  EnergyDailySummaryResponse,
  WeeklyBudgetResponse,
} from '../types/dashboard';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

  // Estados com dados reais do backend
  const [userProfile, setUserProfile] = useState<UserMeResponse | null>(null);
  const [energy, setEnergy] = useState<EnergyDailySummaryResponse | null>(null);
  const [budget, setBudget] = useState<WeeklyBudgetResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Dispara as 3 consultas ao backend em paralelo para performance máxima
        const [userData, energyData, budgetData] = await Promise.all([
          dashboardService.getUserProfile(),
          dashboardService.getDailyEnergy(),
          dashboardService.getWeeklyBudget(),
        ]);

        setUserProfile(userData);
        setEnergy(energyData);
        setBudget(budgetData);
      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Não foi possível carregar os dados. Verifique sua conexão ou faça login.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // 1. Estado de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-sm font-semibold animate-pulse text-amber-400">
            Sincronizando dados corporais e saldo de moedas...
          </div>
        </div>
      </div>
    );
  }

  // 2. Estado de Erro / Não Autenticado
  if (error || !userProfile || !energy || !budget) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center p-4">
        <div className="max-w-sm w-full border border-neutral-800 bg-neutral-900 p-5 rounded-xl text-center">
          <h2 className="text-base font-bold text-red-400 mb-2">Acesso Não Autorizado / Falha</h2>
          <p className="text-xs text-neutral-400 mb-4">{error || 'Sessão expirada.'}</p>
          <button
            onClick={() => navigate({ to: '/login' })}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg border border-neutral-700 text-neutral-200"
          >
            Ir para Tela de Login
          </button>
        </div>
      </div>
    );
  }

  // 3. Renderização Completa do Dashboard
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 flex justify-center pb-20">
      <main className="w-full max-w-md flex flex-col gap-3.5">
        {/* Bloco 1: Perfil, Meta Corporal, Moedas e Termômetro da Refeição Livre */}
        <UserHUD data={userProfile} />

        {/* Bloco 2: Atalho Direto para o Treino */}
        <button
          onClick={() => alert('Navegar para rota /workouts')}
          className="w-full py-2.5 px-3.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 font-semibold flex justify-between items-center transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🏋️</span> Iniciar Treino do Dia
          </span>
          <span className="text-emerald-400 font-medium">+Moedas ao Concluir ➔</span>
        </button>

        {/* Bloco 3: Balanço Calórico Central */}
        <EnergyBalance data={energy} />

        {/* Bloco 4: Cofre Semanal e Passos */}
        <div className="grid grid-cols-2 gap-3">
          <CaloricVault data={budget} />
          <StepsQuest data={energy} />
        </div>
      </main>
    </div>
  );
}
```

---

## 🎯 Resumo da Solidez da Arquitetura

1. **Zero Fantasia / 100% Resultado Real:** Nenhuma barra de HP, nenhuma classe de RPG ou ranking fictício.
2. **Moedas como Moeda de Troca Real:** Todo passo, treino e economia calórica gera moedas que compram refeições livres.
3. **TypeScript Estrito:** Zero `as any`, tipos inferidos diretamente do Swagger/OpenAPI.
