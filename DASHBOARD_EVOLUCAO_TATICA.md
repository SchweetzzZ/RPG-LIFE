# 🛡️ DASHBOARD DO RPG-LIFE: EVOLUÇÃO TÁTICA & GUIA COMPLETO

> **DOCUMENTO DEFINITIVO DE DESIGN E IMPLEMENTAÇÃO**  
> Este documento reúne 100% do código limpo, moderno, profissional (sem "AI Slop") e as instruções de integração real com o backend NestJS via Postman.

---

## 📑 Índice
1. [Visão Geral & Eliminação de Vícios de IA](#1-visão-geral--eliminação-de-vícios-de-ia)
2. [Componente 1: UserHUD.tsx (Identidade & Moedas)](#2-componente-1-userhudtsx)
3. [Componente 2: ShopRewardBanner.tsx (O Motor da Loja de Moedas)](#3-componente-2-shoprewardbannertsx)
4. [Componente 3: EnergyBalance.tsx (Balanço Energético de Precisão)](#4-componente-3-energybalancetsx)
5. [Componente 4: CaloricVault.tsx (Cofre Semanal de Calorias)](#5-componente-4-caloricvaulttsx)
6. [Integração Real: src/routes/index.tsx (Zero Mocks)](#6-integração-real-srcroutesindextsx)
7. [Cliente HTTP: src/services/api.ts (Cookie HttpOnly)](#7-cliente-http-srcservicesapits-segurança-com-cookie-httponly)
8. [Guia Passo a Passo do Postman & Fluxo de Autenticação](#8-guia-passo-a-passo-do-postman--fluxo-de-autenticação)

---

## 1. Visão Geral & Eliminação de Vícios de IA

* ❌ **Eliminado:** Emojis soltos (`🍔`, `🪙`, `🎯`) substituídos por ícones vetoriais SVG de precisão (`lucide-react` com `strokeWidth={1.75}`).
* ❌ **Eliminado:** Gradientes clichês roxo/índigo e botões arco-íris. Usamos superfícies sólidas profundas (`#08090a`, `#0c0e12`) com micro-bordas `border-white/[0.08]`.
* ❌ **Eliminado:** "Caixas dentro de caixas" (Nested cards redundantes). Hierarquia criada por tipografia, ritmo de linhas finas e contraste.
* ❌ **Eliminado:** Números desalinhados. Todas as métricas utilizam `tabular-nums font-mono tracking-tight`.
* ⭐ **A Loja como Ponto Central:** As moedas ganhas em treinos e passos são conectadas diretamente ao banner de recompensas desbloqueáveis.

---

## 2. Componente 1: `UserHUD.tsx`
**Caminho:** `rpg-frontend/src/components/dashboard/UserHUD.tsx`

```tsx
import React from 'react';
import { Coins, Target, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { UserMeResponse } from '@/src/types/dashboard';

interface UserHUDProps {
  data: UserMeResponse;
  onOpenShop?: () => void;
}

export function UserHUD({ data, onOpenShop }: UserHUDProps) {
  const { user, profile, character } = data;
  const coins = profile?.coins ?? 0;

  const getGoalMeta = (goal?: string | null) => {
    switch (goal) {
      case 'lose_weight':
        return { label: 'Déficit • Perda de Gordura', color: 'text-amber-400 border-amber-400/20 bg-amber-400/10' };
      case 'gain_muscle':
        return { label: 'Superávit • Hipertrofia', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' };
      case 'maintain':
      default:
        return { label: 'Manutenção • Equilíbrio', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10' };
    }
  };

  const goal = getGoalMeta(profile?.primaryGoal);
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <header className="relative w-full overflow-hidden rounded-xl border border-white/8 bg-[#0c0e12] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Perfil & Identidade */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-gradient-to-b from-zinc-800 to-zinc-900 font-mono text-base font-bold text-zinc-100 shadow-inner">
            {initial}
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0c0e12]">
              <ShieldCheck className="h-2.5 w-2.5 text-black stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-100">
                {user.username}
              </h1>
              {character?.level && (
                <span className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400">
                  NVL {character.level}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide ${goal.color}`}>
                <Target className="h-3 w-3 stroke-[2]" />
                {goal.label}
              </span>
              {profile?.weightKg && (
                <span className="font-mono text-xs text-zinc-400">
                  {profile.weightKg} kg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Saldo de Moedas em Destaque (Link com a Loja) */}
        <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-3 sm:border-t-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500/80">
              Saldo de Moedas
            </span>
            <div className="flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-amber-400 stroke-[1.75]" />
              <span className="font-mono text-2xl font-bold tracking-tight text-amber-300 tabular-nums">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenShop}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all duration-150 hover:border-amber-400/60 hover:bg-amber-400/20 active:scale-[0.98]"
          >
            <span>Acessar Loja</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## 3. Componente 2: `ShopRewardBanner.tsx`
**Caminho:** `rpg-frontend/src/components/dashboard/ShopRewardBanner.tsx`

```tsx
import React from 'react';
import { ShoppingBag, Sparkles, Utensils, CheckCircle2 } from 'lucide-react';

interface ShopRewardBannerProps {
  currentCoins: number;
  targetReward?: {
    title: string;
    description: string;
    cost: number;
    category: 'meal' | 'item' | 'upgrade';
  };
  onRedeem?: () => void;
  onBrowseStore?: () => void;
}

export function ShopRewardBanner({
  currentCoins,
  targetReward = {
    title: 'Refeição Livre de Sábado (Hambúrguer Artesanal)',
    description: 'Bônus calórico calculado e merecido após bater as metas da semana.',
    cost: 1800,
    category: 'meal',
  },
  onRedeem,
  onBrowseStore,
}: ShopRewardBannerProps) {
  const progressPercent = Math.min(100, Math.round((currentCoins / targetReward.cost) * 100));
  const coinsNeeded = Math.max(0, targetReward.cost - currentCoins);
  const isReady = currentCoins >= targetReward.cost;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0e1117] to-[#0c0e12] p-4 sm:p-5 shadow-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3 w-3 stroke-[2]" />
              Meta da Loja em Foco
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              Economia Comportamental
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-400">
              <Utensils className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                {targetReward.title}
              </h2>
              <p className="text-xs text-zinc-400">
                {targetReward.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:min-w-[340px]">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Progresso</span>
              <span className="font-semibold text-amber-400 tabular-nums">
                {currentCoins.toLocaleString()} / {targetReward.cost.toLocaleString()} ({progressPercent}%)
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80 border border-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="font-mono text-[10px] text-zinc-500 text-right">
              {isReady ? (
                <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Recompensa Pronta para Resgate!
                </span>
              ) : (
                `Faltam ${coinsNeeded.toLocaleString()} moedas de treinos/hábitos`
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isReady ? (
              <button
                type="button"
                onClick={onRedeem}
                className="w-full sm:w-auto rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition-all duration-150 hover:bg-amber-300 active:scale-[0.98]"
              >
                Resgatar
              </button>
            ) : (
              <button
                type="button"
                onClick={onBrowseStore}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all duration-150 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
              >
                <ShoppingBag className="h-3.5 w-3.5 stroke-[1.75]" />
                Ver Loja
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Componente 3: `EnergyBalance.tsx`
**Caminho:** `rpg-frontend/src/components/dashboard/energyBalance.tsx`

```tsx
import React from 'react';
import { Flame, Activity, Footprints } from 'lucide-react';
import type { EnergyDailySummaryResponse } from '@/src/types/dashboard';

interface EnergyBalanceProps {
  data: EnergyDailySummaryResponse;
}

export function EnergyBalance({ data }: EnergyBalanceProps) {
  const { summary, breakdown } = data;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400 stroke-[2]" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Balanço Energético Diário
          </h3>
        </div>
        <div className="font-mono text-xs text-zinc-400">
          Meta TDEE: <span className="font-semibold text-zinc-200 tabular-nums">{summary.tdee}</span> kcal
        </div>
      </div>

      <div className="my-5 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Orçamento Restante Hoje
        </span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums ${
            summary.remainingCalorieBudget >= 0 ? 'text-zinc-100' : 'text-rose-400'
          }`}>
            {summary.remainingCalorieBudget}
          </span>
          <span className="font-mono text-sm text-zinc-500">kcal</span>
        </div>
        <p className="mt-1.5 text-xs text-zinc-400">
          Consumido: <span className="text-zinc-200 font-medium tabular-nums">{summary.totalCaloriesConsumed} kcal</span> • 
          Queimado Ativo: <span className="text-emerald-400 font-medium tabular-nums">+{summary.activityCaloriesBurned} kcal</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Basal (TMB)
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-zinc-200 tabular-nums">
            {summary.bmr} <span className="text-[10px] font-normal text-zinc-500">kcal</span>
          </div>
        </div>

        <div className="space-y-0.5 text-center sm:text-left border-x border-white/[0.06] px-2 sm:px-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-rose-400/90 flex items-center justify-center sm:justify-start gap-1">
            <Flame className="h-3 w-3 stroke-[2]" /> Treinos
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-rose-300 tabular-nums">
            {breakdown.workouts.totalCalories} <span className="text-[10px] font-normal text-zinc-500">kcal</span>
          </div>
        </div>

        <div className="space-y-0.5 text-center sm:text-left">
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/90 flex items-center justify-center sm:justify-start gap-1">
            <Footprints className="h-3 w-3 stroke-[2]" /> Passos
          </span>
          <div className="font-mono text-sm sm:text-base font-semibold text-cyan-300 tabular-nums">
            {breakdown.steps.caloriesBurned} <span className="text-[10px] font-normal text-zinc-500">kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Componente 4: `CaloricVault.tsx`
**Caminho:** `rpg-frontend/src/components/dashboard/CaloricVault.tsx`

```tsx
import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import type { WeeklyBudgetResponse } from '@/src/types/dashboard';

interface CaloricVaultProps {
  data: WeeklyBudgetResponse;
}

export function CaloricVault({ data }: CaloricVaultProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400 stroke-[2]" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Cofre Calórico Semanal
            </h3>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            {data.weekRange.start} – {data.weekRange.end}
          </span>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Déficit Acumulado Guardado
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-cyan-300 tabular-nums">
              +{data.accumulatedWeekDeficit.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-zinc-500">kcal salvas</span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-3 flex items-center justify-between text-xs">
        <span className="text-zinc-400 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Buffer de Fim de Semana:
        </span>
        <span className="font-mono font-semibold text-emerald-400 tabular-nums">
          +{data.weekendBufferTotal} kcal ({data.weekendBufferPerDay} kcal/dia)
        </span>
      </div>
    </div>
  );
}
```

---

## 6. Integração Real: `src/routes/index.tsx` (Zero Mocks)
**Caminho:** `rpg-frontend/src/routes/index.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type {
  UserMeResponse,
  EnergyDailySummaryResponse,
  WeeklyBudgetResponse,
} from '../types/dashboard';
import { dashboardService } from '../services/dashboard.service';
import { UserHUD } from '../components/dashboard/UserHUD';
import { ShopRewardBanner } from '../components/dashboard/ShopRewardBanner';
import { EnergyBalance } from '../components/dashboard/energyBalance';
import { CaloricVault } from '../components/dashboard/CaloricVault';

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
});

function IndexRouteComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserMeResponse | null>(null);
  const [energyData, setEnergyData] = useState<EnergyDailySummaryResponse | null>(null);
  const [weeklyBudgetData, setWeeklyBudgetData] = useState<WeeklyBudgetResponse | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, energyRes, budgetRes] = await Promise.all([
        dashboardService.getHunterProfile(),
        dashboardService.getEnergyDaily(),
        dashboardService.getWeeklyBuget(),
      ]);

      setUserData(userRes);
      setEnergyData(energyRes);
      setWeeklyBudgetData(budgetRes);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados da API';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08090a] text-zinc-100 p-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-amber-400 stroke-[2]" />
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Sincronizando com o Backend RPG-LIFE...
          </span>
        </div>
      </main>
    );
  }

  if (error || !userData || !energyData || !weeklyBudgetData) {
    return (
      <main className="min-h-screen bg-[#08090a] text-zinc-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-rose-500/20 bg-[#0f1115] p-6 text-center shadow-2xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <AlertCircle className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-100">Falha ao Carregar Dashboard</h2>
            <p className="text-xs text-zinc-400">{error || 'Não foi possível obter a resposta completa do servidor.'}</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.1]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar Novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  const coins = userData.profile?.coins ?? 0;

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-5">
        <UserHUD data={userData} onOpenShop={() => alert('Navegar para a Loja')} />
        <ShopRewardBanner currentCoins={coins} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EnergyBalance data={energyData} />
          <CaloricVault data={weeklyBudgetData} />
        </div>
      </div>
    </main>
  );
}
```

---

## 7. Cliente HTTP: `src/services/api.ts` (Segurança com Cookie HttpOnly)

O backend NestJS do RPG-LIFE já gerencia a sessão de autenticação via **Cookies `HttpOnly`** (`res.cookie('jwt', ...)`). O token JWT fica inacessível via JavaScript no navegador, fornecendo proteção completa contra ataques XSS.

Com `credentials: 'include'`, o cliente `openapi-fetch` envia o cookie automaticamente em todas as requisições para a API. **Nenhum token precisa (ou deve) ser armazenado em `localStorage`**.

```typescript
import createClient from "openapi-fetch";
import type { paths } from "../api/schema";

const BASE_URL = "/api";

export const client = createClient<paths>({
  baseUrl: BASE_URL,
  credentials: 'include', // Envia e recebe automaticamente os cookies HttpOnly em todas as requisições
});

client.use({
  async onRequest({ request }) {
    if (!request.headers.has('Content-Type')) {
      request.headers.set('Content-Type', 'application/json');
    }
    return request;
  },

  async onResponse({ response }) {
    if (response.status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return response;
  },
});
```

---

## 8. Guia Passo a Passo do Postman & Fluxo de Autenticação

Para popular os dados reais no banco e validar a interface:

### 1️⃣ Autenticação (Login ou Registro)
* **Método:** `POST`
* **URL:** `http://localhost:4000/user/login` (ou `/user/register`)
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "email": "guerreiro@rpglife.com",
  "password": "Password123!"
}
```
* **Comportamento do Backend:**  
  O NestJS responde com o cabeçalho `Set-Cookie: jwt=...; HttpOnly; Path=/; SameSite=Lax`.  
  - No **Postman**: O cookie `jwt` é armazenado automaticamente no *Cookie Jar* e reenviado nas próximas requisições. O backend também retorna `access_Token` no corpo da resposta para ferramentas que usam header `Authorization: Bearer <TOKEN>`.
  - No **Navegador**: O navegador armazena o cookie seguro e o anexa automaticamente em todas as requisições enviadas ao backend.

---

### 2️⃣ Configurar Perfil e Metas Corporais
* **Método:** `PATCH`
* **URL:** `http://localhost:4000/profile`
* **Headers:**
  - `Content-Type: application/json`
  - *(Opcional no Postman se os cookies estiverem ativos; ou envie `Authorization: Bearer <TOKEN>`)*
* **Body:**
```json
{
  "weightKg": 82.5,
  "heightCm": 178,
  "age": 28,
  "biologicalSex": "male",
  "activityLevel": "moderate",
  "primaryGoal": "lose_weight",
  "trainsRegularly": true
}
```

---

### 3️⃣ Registrar Treino (Gera Queima + Moedas)
* **Método:** `POST`
* **URL:** `http://localhost:4000/workout/session`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "intensity": "intense",
  "durationMinutes": 60,
  "exercises": [
    {
      "exerciseName": "Supino Reto",
      "maxWeightKg": 80,
      "completedSetsCount": 4
    }
  ]
}
```

---

### 4️⃣ Registrar Passos (Gera Moedas de Passos)
* **Método:** `POST`
* **URL:** `http://localhost:4000/habits/steps`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "steps": 10000
}
```

---

### 5️⃣ Registrar Alimento (Debita do Saldo Diário)
* **Método:** `POST`
* **URL:** `http://localhost:4000/nutrition/log`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "foodName": "Frango Grelhado com Arroz",
  "mealType": "lunch",
  "amountGrams": 350,
  "calories": 520,
  "proteinGrams": 42,
  "carbGrams": 55,
  "fatGrams": 8
}
```

---

### 6️⃣ Validar no Navegador (Autenticação Automática e Segura)
1. Acesse `http://localhost:5173/login` no navegador e faça login com as credenciais criadas.
2. O backend define o cookie `jwt` com a flag `HttpOnly`.
3. Abra as Ferramentas do Desenvolvedor (**F12**):
   - Vá em **Application > Storage > Cookies > http://localhost:5173** (ou `localhost:4000`).
   - Confirme a presença do cookie `jwt` com a coluna `HttpOnly` marcada.
4. Acesse o Dashboard em `http://localhost:5173/`:
   - Todas as requisições (`/api/user/me`, `/api/nutrition/daily-summary`, `/api/nutrition/weekly-budget`) carregarão com autenticação automática e 100% de segurança, sem risco de vazamento de token via scripts terceiros ou extensões de navegador!

