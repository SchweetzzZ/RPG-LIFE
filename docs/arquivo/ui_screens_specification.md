# ⚡ RPG-LIFE — Design System & Especificação Visual das Telas

Este documento apresenta a modelagem de alta fidelidade para a interface do **RPG-LIFE**, unindo a ergonomia de aplicativos de alta performance (*Hevy / Strong* para treinos e *MacroFactor* para nutrição calórica) com uma **Economia Comportamental Real**: o usuário ganha moedas com esforço diário (treino, passos, hábitos, consistência calórica) para desbloquear **Refeições Livres (Cheat Meals)** sem culpa!

---

## 🧭 Visão Geral da Arquitetura de Telas

O aplicativo é estruturado em **5 telas principais** acessíveis por uma **Bottom Navigation Bar** fixa com efeito de vidro fosco (*Dark Obsidian Glassmorphism*):

```
┌─────────────────────────────────────────────────────────────┐
│ 🪙 STATUS BAR (Avatar • Meta de Peso • Saúde • Moedas)      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      CONTEÚDO DA ROTA                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [🏠 Hub]   [🏋️ Treino]   [🥗 Dieta]   [🍔 Cheat Store]   [👤 Metas] │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detalhamento das 5 Telas Principais

---

### 1. Tela: **Dashboard / Central de Energia & Moedas (`/`)**
> **Objetivo:** O painel de controle central. Apresenta o saldo de moedas acumulado, a proximidade da próxima refeição livre e o balanço calórico diário em tempo real.

```
┌─────────────────────────────────────────────────────────┐
│ [👤 Avatar]  ARIS                       🎯 PERDA DE PESO│
│ 78.5 kg • Meta: 72.0 kg               🔥 6 Dias Consec. │
│ 🍔 PRÓXIMA REFEIÇÃO LIVRE [████████████░░░] 1.600/2.000 │
│                                       🪙 1.600 Moedas   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               BALANÇO ENERGÉTICO DIÁRIO                 │
│                                                         │
│                   ╭───────────────╮                     │
│                  ╱   2.100 kcal    ╲                    │
│                 │   META DO DIA     │                   │
│                  ╲  (Déficit Ativo)╱                    │
│                   ╰───────────────╯                     │
│                                                         │
│     TMB (BMR)          TREINO              PASSOS       │
│     1.720 kcal       +380 kcal           +290 kcal      │
├──────────────────────────┬──────────────────────────────┤
│ 🟣 COFRE DE CALORIAS     │ 👟 QUEST: 10.000 PASSOS      │
│ [ 🏦 Saldo Acumulado ]   │       ╭───╮                  │
│ Saldo: 1.450 kcal        │      │ 74% │ 7.420 / 10.000  │
│ Liberado p/ Fim de Semana│       ╰───╯ +74 Moedas       │
└──────────────────────────┴──────────────────────────────┘
```

- **Endpoints do Backend Conectados:**
  - `GET /user/me` (Nome, Perfil, Saldo de Moedas, Meta Corporal).
  - `GET /energy/daily-summary` (TMB, Calorias gastas por treino e passos, saldo líquido).
  - `GET /energy/weekly-budget` (Cofre semanal acumulado).
- **Elementos Interativos:**
  - Card da **Próxima Refeição Livre**: Toque direto para abrir a vitrine de recompensas gastronômicas.
  - Card de atalho direto para o treino agendado do dia (+Moedas ao concluir).

---

### 2. Tela: **Treinos & Sobrecarga Progressiva (`/workouts`)**
> **Objetivo:** Execução rápida, ergonomia sem atrito na academia (estilo *Hevy* / *Strong*) e conversão imediata de esforço em calorias queimadas e moedas no bolso.

```
┌─────────────────────────────────────────────────────────┐
│ 🏋️ Treino A: Push - Peito e Tríceps         ⏱️ 34:12    │
│                                      [CONCLUIR TREINO]  │
├─────────────────────────────────────────────────────────┤
│ 🔹 Supino Reto com Barra                                │
│                                                         │
│ SET  TÉCNICA       CARGA (KG)   REPS    STATUS          │
│ 1    [AQUECIMENTO]   40 kg       12     [  ✓  ]         │
│ 2    [NORMAL]        80 kg        8     [  ✓  ]         │
│ 3    [BACK-OFF]      65 kg       12     [  ✓  ]         │
│ 4    [DROP-SET]      50 kg       10     [     ]         │
│                                                         │
│ [+ Adicionar Série]           [📊 Ver Histórico Carga] │
├─────────────────────────────────────────────────────────┤
│ ⏱️ REST TIMER FLUTUANTE                                 │
│ ⏳ Descanso: 01:28                             [+30s]   │
└─────────────────────────────────────────────────────────┘
```

- **Endpoints do Backend Conectados:**
  - `GET /workout` (Rotinas e exercícios cadastrados).
  - `POST /workout/log` (Envia o log da sessão — calcula calorias queimadas via METs e credita moedas automaticamente).
  - `GET /workout/progression/:exerciseName` (Evolução de carga 1RM).
- **Elementos de Destaque:**
  - **Recompensa Imediata ao Finalizar:** *"Treino Concluído! +380 kcal queimadas • +380 Moedas adicionadas ao seu cofre!"*

---

### 3. Tela: **Diário Nutricional & Macros Calculados (`/nutrition`)**
> **Objetivo:** Rastreamento intuitivo de calorias e macros calculados com base na meta de peso escolhida (Mifflin-St Jeor + fórmula de macronutrientes).

```
┌─────────────────────────────────────────────────────────┐
│ 🥗 Diário Nutricional                     [📷 SCANNER] │
│ Hoje: Meta de Perda de Gordura                          │
├─────────────────────────────────────────────────────────┤
│ META: 1.750 / 2.100 kcal (Resta: 350 kcal)              │
│                                                         │
│ PROTEÍNA     [████████████████░░░░] 160g / 180g (Azul)  │
│ CARBOIDRATO  [██████████████░░░░░░] 180g / 220g (Ciano) │
│ GORDURA      [██████████████████░░]  50g /  60g (Laranja│
├─────────────────────────────────────────────────────────┤
│ ☕ CAFÉ DA MANHÃ (480 kcal)                             │
│ • Ovos Mexidos (3 unidades) - 210 kcal                  │
│ • Aveia com Frutas - 180 kcal                           │
│ • Whey Protein (30g) - 120 kcal        [+ Adicionar]    │
├─────────────────────────────────────────────────────────┤
│ 🥩 ALMOÇO (720 kcal)                                    │
│ • Arroz Integral (150g) - 195 kcal                      │
│ • Peito de Frango Grelhado (120g) - 190 kcal            │
│ • Salada Variada com Azeite - 110 kcal [+ Adicionar]    │
└─────────────────────────────────────────────────────────┘
```

- **Endpoints do Backend Conectados:**
  - `GET /nutrition/barcode/:barcode` (Busca em tempo real de produtos via Open Food Facts).
  - Tabela TACO embutida no frontend para busca instantânea.
  - Cálculo automático de macros: Proteína ($2.0\text{g/kg}$), Gordura ($0.9\text{g/kg}$), Carboidrato (restante calórico).

---

### 4. Tela: **Loja de Refeições Livres / Cheat Store (`/rewards`)**
> **Objetivo:** O grande clímax do aplicativo. Aqui o usuário troca as moedas conquistadas por refeições livres sem sentimento de culpa.

```
┌─────────────────────────────────────────────────────────┐
│ 🍔 Cheat Meal Store                      🪙 1.600 Moedas│
│ Gaste o que conquistou. 0% Culpa, 100% Mérito.          │
├─────────────────────────────────────────────────────────┤
│ 🍕 Pizza Inteira Artesanal (4 Fatias)                   │
│ Custo: 2.000 Moedas             [Faltam 400 Moedas]     │
│ [████████████████████░░░░] 80% Conquistado              │
├─────────────────────────────────────────────────────────┤
│ 🍔 Burger Smash Duplo com Fritas                        │
│ Custo: 1.400 Moedas             [🎉 DESBLOQUEAR AGORA]  │
│ Saldo suficiente! Clique para autorizar refeição livre. │
├─────────────────────────────────────────────────────────┤
│ 🍨 Açaí Completo 500ml                                  │
│ Custo: 800 Moedas               [🎉 DESBLOQUEAR AGORA]  │
│ [✓ Comprar & Abater do Cofre]                           │
├─────────────────────────────────────────────────────────┤
│ ➕ [+ Cadastrar Nova Refeição Favorita]                 │
└─────────────────────────────────────────────────────────┘
```

- **Endpoints do Backend Conectados:**
  - `GET /rewards` (Lista de refeições cadastradas com seus custos em moedas).
  - `POST /rewards/redeem` (Debita as moedas, abate o saldo no cofre calórico semanal e registra a refeição comemorativa).
  - `POST /rewards` (Permite ao usuário cadastrar sua comida favorita e definir o custo calórico/moedas).

---

### 5. Tela: **Metas & Composição Corporal (`/profile`)**
> **Objetivo:** Definição da meta de peso corporal e controle dos parâmetros biológicos que regem o motor de cálculo da dieta.

```
┌─────────────────────────────────────────────────────────┐
│ 👤 ARIS                                   Membro Ativo  │
│ 14 Dias Consecutivos Registrando                        │
├─────────────────────────────────────────────────────────┤
│ 🎯 META CORPORAL ATIVA                                  │
│ ( ) Perda de Gordura / Déficit (-400 kcal/dia)          │
│ (*) Ganho de Massa / Superávit (+300 kcal/dia)          │
│ ( ) Manutenção de Peso (Normocalórica)                  │
├─────────────────────────────────────────────────────────┤
│ 📊 DIETA CALCULADA AUTOMATICAMENTE                      │
│ • Calorias Alvo:    2.450 kcal / dia                    │
│ • Proteína Alvo:    160 g  (2.0g/kg)                    │
│ • Carboidrato Alvo: 310 g  (Equilíbrio de Energia)      │
│ • Gordura Alvo:      62 g  (0.8g/kg)                    │
├─────────────────────────────────────────────────────────┤
│ ⚙️ DADOS BIOMÉTRICOS                                    │
│ • Peso: 78.5 kg                  • Altura: 178 cm       │
│ • Idade: 26 anos                 • Sexo: Masculino      │
│ • Nível de Atividade: Moderado (3-5 treinos/semana)     │
│ [ 💾 Salvar & Recalcular Metas ]                        │
└─────────────────────────────────────────────────────────┘
```

- **Endpoints do Backend Conectados:**
  - `PATCH /user/profile` (Atualiza biometria e meta corporal).
  - Recálculo imediato de TMB, GET e divisão de macros sem necessidade de configurações manuais confusas.

---

## 🎨 Paleta de Cores & Design Tokens (Dark Obsidian Glassmorphism)

| Token | Valor CSS | Significado no Produto |
| :--- | :--- | :--- |
| `color-bg-base` | `#0A0D14` | Preto Obsidiana profundo (fundo geral) |
| `color-surface` | `#111622` | Cards e painéis com elevação |
| `color-border` | `#1E2638` | Bordas sutis e divisores |
| `color-coins` | `#F59E0B` (Âmbar) | Moedas, recompensas, cheat store |
| `color-health` | `#10B981` (Esmeralda)| Saúde, consistência, hábitos cumpridos |
| `color-energy` | `#38BDF8` (Ciano) | Calorias, gasto energético e hidratação |
| `color-accent` | `#6366F1` (Índigo) | Botões de ação primária e navegação |
