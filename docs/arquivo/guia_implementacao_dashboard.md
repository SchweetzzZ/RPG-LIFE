# 🛡️ Guia de Implementação: Dashboard Tático do RPG-LIFE

> **Diretriz de Design:** Zero "AI Slop" (sem gradientes roxos amadores, sem caixas aninhadas sem sentido, sem emojis como ícones). Padrão visual **Tactical Kinetic HUD** (inspirado no minimalismo de precisão do *Linear* e em interfaces táticas de alta performance).
> **O Motor do Produto:** O usuário treina pesado (**Treinos**), mantém a disciplina alimentar (**Nutrição & Cofre**) e ganha **Moedas**. O objetivo central é gastar essas moedas na **LOJA DE RECOMPENSAS (The Vault Market)** para desbloquear refeições livres (cheat meals), itens e upgrades reais sem culpa.

---

## 1. O Loop de Valor: Treino ➔ Nutrição ➔ Moedas ➔ Loja

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER HUD TÁTICO                                                            │
│  Avatar • Nome • Meta Corporal • Nível • [🪙 1.450 MOEDAS]                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│  METABOLISMO & NUTRIÇÃO          │        │  ESFORÇO & TREINOS               │
│  • Balanço Calórico (Restante)   │        │  • Calorias Ativas Queimadas     │
│  • TMB + TDEE Meta               │        │  • Treinos Concluídos no Dia     │
│  • Cofre Semanal (Buffer FDS)    │        │  • Passos Realizados             │
│  • Meta de Proteína / Macros     │        │  • +Moedas Geradas no Dia        │
└────────────────┬─────────────────┘        └────────────────┬─────────────────┘
                 │                                           │
                 └─────────────────────┬─────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⭐ O NÚCLEO MOTIVACIONAL: LOJA & RECOMPENSAS (THE VAULT MARKET)            │
│  • Próximo Desbloqueio: "Refeição Livre de Sábado" (Hambúrguer Artesanal)   │
│  • Progresso: 1.450 / 2.000 Moedas (72.5%) — Faltam 550 moedas              │
│  • Ações: [Explorar Loja] [Resgatar Recompensa]                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Padrões Visuais Anti-AI Slop (Eliminação de Vícios)

1. **Superfícies em Camadas e Bordas Sutis**:
   - Fundo base da aplicação: `#08090a` (Obsidian escuro profundo).
   - Painéis primários: `#0c0e12` com borda de precisão `border border-white/[0.08]`.
   - Divisões internas: Linhas finas `divide-white/[0.05]` em vez de encaixotar cada número em um novo card cinza (`div soup`).
2. **Ícones Vetoriais Especializados (`lucide-react`)**:
   - Nada de emojis soltos (`🍔`, `🪙`, `🎯`). Usamos `Coins`, `Flame`, `Target`, `ShieldCheck`, `ShoppingBag` com `strokeWidth={1.75}`.
3. **Tipografia de Alta Precisão**:
   - Números de métricas sempre com `tabular-nums font-mono font-semibold tracking-tight`.
   - Rótulos técnicos em micro-mono: `text-[10px] font-mono uppercase tracking-widest text-zinc-500`.
4. **Cores Semânticas Funcionais**:
   - **Moedas & Loja**: Âmbar Dourado (`text-amber-400`, `bg-amber-400/10`, `border-amber-400/20`).
   - **Treinos & Queima**: Rose / Carmesim (`text-rose-400`, `bg-rose-400/10`, `border-rose-400/20`).
   - **Nutrição & Regeneração**: Esmeralda (`text-emerald-400`, `bg-emerald-400/10`, `border-emerald-400/20`).
   - **Cofre & Buffer**: Ciano Tático (`text-cyan-400`, `bg-cyan-400/10`, `border-cyan-400/20`).

---

## 3. Código dos Componentes

### 1. `UserHUD.tsx` (`src/components/dashboard/UserHUD.tsx`)
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
    <header className="relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0e12] p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

### 2. `ShopRewardBanner.tsx` (`src/components/dashboard/ShopRewardBanner.tsx`)
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

### 3. `EnergyBalance.tsx` (`src/components/dashboard/energyBalance.tsx`)
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

### 4. `CaloricVault.tsx` (`src/components/dashboard/CaloricVault.tsx`)
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

## 4. Guia Postman: Rotas e Payloads JSON para Testar sem Mocks

### 1️⃣ Autenticação: Registrar ou Fazer Login
* **Método:** `POST`
* **URL:** `http://localhost:4000/user/login` (ou `/user/register`)
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "email": "guerreiro@rpglife.com",
  "password": "Password123!"
}
```
* **Ação no Postman:** Copie o valor do token recebido em `access_Token`.
* **Nas requisições seguintes:** Adicione o Header:
  `Authorization: Bearer <SEU_TOKEN_AQUI>`

---

### 2️⃣ Configurar Perfil e Metas Corporais
* **Método:** `PATCH`
* **URL:** `http://localhost:4000/profile`
* **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>`
* **Body (raw JSON):**
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

### 3️⃣ Registrar Sessão de Treino (Gera Queima Calórica + Moedas)
O backend calcula o MET com base no seu peso e duração, calcula as calorias gastas e **converte 25% em LifeCoins** automaticamente:
* **Método:** `POST`
* **URL:** `http://localhost:4000/workout/session`
* **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>`
* **Body (raw JSON):**
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

### 4️⃣ Registrar Passos do Dia (Gera Queima + Moedas de Passos)
10.000 passos geram 100 LifeCoins e calorias ativas:
* **Método:** `POST`
* **URL:** `http://localhost:4000/habits/steps`
* **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>`
* **Body (raw JSON):**
```json
{
  "steps": 10000
}
```

---

### 5️⃣ Registrar Alimento Consumido (Alimenta o Balanço Calórico)
* **Método:** `POST`
* **URL:** `http://localhost:4000/nutrition/log`
* **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>`
* **Body (raw JSON):**
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

### 6️⃣ Validar os Endpoints de Leitura do Dashboard
1. **`GET http://localhost:4000/user/me`**: Mostra o perfil e moedas acumuladas.
2. **`GET http://localhost:4000/energy/daily-summary`**: Mostra o saldo calórico diário restante, TMB, TDEE e discriminação de treinos/passos.
3. **`GET http://localhost:4000/energy/weekly-budget`**: Mostra o cofre semanal acumulado e o buffer de final de semana.
