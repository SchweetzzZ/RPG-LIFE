---
name: rpg-frontend-architecture
description: Especificação arquitetural de telas, fluxos de design (benchmark Habitica/MyFitnessPal), integração de API orientada a contratos e design system anti-AI slop para o frontend RPG-LIFE.
---

# ⚔️ RPG-LIFE Frontend Architecture & Design Specification

Este documento é a especificação oficial e diretriz operacional para a construção de todo o ecossistema de front-end do **RPG-LIFE**. Ele unifica a ergonomia e precisão biométrica de aplicativos de alta performance (*MyFitnessPal*, *MacroFactor*, *Hevy*) com a psicologia de gamificação comportamental do *Habitica*, sem cair em clichês infantis ou vícios de código gerado por IA (*AI Slop*).

---

## 1. Princípios Imutáveis de Arquitetura

1. **Backend Imutável & Pré-estabelecido:**
   - O backend NestJS é a fonte de verdade absoluta. Não serão criadas rotas mockadas ou bancos fakes em `localStorage`.
   - Autenticação 100% baseada em **Cookies HttpOnly** (`jwt`), transmitidos automaticamente pelo navegador com `credentials: 'include'`.
   - Toda rota autenticada utiliza `@CurrentUser('sub') userId` e guards JWT.

2. **Tipagem Estrita (Zero Any / Zero Unknown):**
   - Consumo exclusivo via `client` do `openapi-fetch` gerado a partir do contrato OpenAPI (`rpg-frontend/src/api/schema.ts`).
   - Todos os inputs de formulário e outputs de queries devem derivar de `components['schemas']`.
   - Nenhuma chamada de API pode ter `as any` ou cast forçado.

3. **Design System "Tactical Kinetic HUD" (Anti-AI Slop):**
   - **Zero Emojis:** Ícones vetoriais SVG de precisão (`lucide-react` com `stroke-[1.5px]` ou `stroke-[1.75px]`).
   - **Zero Gradientes Genéricos:** Sem roxo/índigo artificial. Fundo obsidiana profundo (`#08090a`), superfícies sólidas (`#0c0e12`, `#14171d`) e bordas cirúrgicas de 1px translúcido (`border-white/[0.08]`).
   - **Tipografia Técnica:** Valores numéricos em `tabular-nums font-mono tracking-tight`, rótulos em micro-tipografia mono (`text-[10px] font-mono uppercase tracking-widest text-zinc-500`).
   - **Alta Densidade de Informação:** Layout compacto e ergonômico, inspirado em cockpits de software de alta performance (Linear, Raycast, Garmin).

---

## 2. Benchmarks Estruturais: Extração dos Padrões de Mercado

### 🎮 A. Habitica (Psicologia de Hábitos & Economia de Recompensas)
* **O que extraímos:**
  - **Classificação em 3 Categorias de Ação:**
    - *Hábitos (Habits):* Ações repetíveis com contador de frequência (ex: beber 500ml de água, evitar refrigerante).
    - *Diárias (Dailies / Quests):* Missões com prazo diário e streaks cumulativos (ex: bater meta de passos, treinar).
    - *Tarefas (To-Dos):* Tarefas únicas com prazo pontual.
  - **Avatar & Estatísticas RPG:** Barra superior contínua com Level, Barra de XP, HP (vida que pune a inconsistência) e Moedas de ouro.
  - **Loja de Recompensas Personalizadas (Custom Rewards):** O usuário pode criar suas próprias recompensas da vida real com custo em moedas (ex: "Sessão de Videogame", "Pedir Hamburguer").
* **O que modernizamos no RPG-LIFE:**
  - Em vez de gráficos 8-bit retrô pixelados, usamos a estética de hardware militar moderno e relógios biométricos (*Tactical HUD*).
  - As moedas e os hábitos são matematicamente atrelados a **calorias reais**, balanço energético e desempenho de treino na academia.

---

### 🥗 B. MyFitnessPal & MacroFactor (Balanço Energético & Diário de Macros)
* **O que extraímos:**
  - **Balanço Energético Rápido:** Fórmula visível em 1 segundo: `Meta Calórica - Alimentos + Exercício = Restante`.
  - **Divisão de Macronutrientes por Metas:** Proteína, Carboidrato e Gordura em gramas e barras de progresso proporcionais com limites dinâmicos.
  - **Refeições Divididas por Janelas Temporais:** Café da Manhã, Almoço, Jantar e Snacks/Lanches.
  - **Busca Instantânea e Scanner de Código de Barras (EAN):** Redução drástica da fricção ao registrar alimentos com catálogo Open Food Facts / TACO.
* **O que modernizamos no RPG-LIFE:**
  - Eliminação da culpa: calorias economizadas ao longo da semana vão para o **Cofre Calórico Semanal (Caloric Vault)**, criando um buffer matemático para o fim de semana.
  - Cada registro de refeição dentro da meta gera moedas de disciplina para gastar na loja.

---

### 🏋️ C. Hevy & Strong (Ergonomia de Treino na Academia)
* **O que extraímos:**
  - **Card de Séries Funcional:** Tabela de séries com tipo (*Aquecimento*, *Normal*, *Falha*, *Drop-set*), Carga em kg, Repetições e checkbox de conclusão com feedback tátil.
  - **Rest Timer Flutuante:** Cronômetro regressivo após cada série com botões rápidos de `+30s` sem sair da tela.
  - **Histórico e 1RM:** Estimativa de progressão de carga por exercício ao longo do tempo.
* **O que modernizamos no RPG-LIFE:**
  - Conclusão do treino calcula calorias gastas via METs no backend, concedendo moedas instantâneas e abastecendo o cofre de calorias do usuário.

---

## 3. Mapeamento Exaustivo de Telas & Endpoints Conectados

```
                                    ┌───────────────────────┐
                                    │  /login (Auth Flow)   │
                                    └───────────┬───────────┘
                                                │ (Cookie HttpOnly)
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             BOTTOM NAVIGATION (App Shell)                                   │
├─────────────────┬─────────────────┬──────────────────┬──────────────────┬───────────────────┤
│ [⚡ Hub / Home] │ [🏋️ Workouts]   │ [🥗 Nutrition]   │ [📜 Quests/Hab]  │ [🍔 Cheat Store]  │
│       `/`       │   `/workouts`   │   `/nutrition`   │    `/habits`     │    `/rewards`     │
└─────────────────┴─────────────────┴──────────────────┴──────────────────┴───────────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    │  /profile (Biometria) │
                                    └───────────────────────┘
```

---

### 📱 Tela 0: Autenticação & Onboarding (`/login`)
- **Objetivo:** Acesso seguro com visual Dark Obsidian minimalista, alternância fluida entre "Entrar" e "Criar Conta de Caçador".
- **Endpoints Conectados:**
  - `POST /user/login` (Body: `LoginUserDto`, seta cookie `jwt` HttpOnly)
  - `POST /user/register` (Body: `RegisterUserDto`, criação atômica de usuário e perfil)
- **Componentes Chave:**
  - `AuthForm.tsx` (Tabs Entrar/Cadastrar, validação client-side com feedback de erro em tempo real).
  - Indicador de segurança militar/criptográfica.

---

### 📱 Tela 1: Dashboard Tático / Central de Comando (`/`)
- **Objetivo:** Visão panorâmica do status do caçador, balanço calórico diário e acesso rápido ao loop de valor (Treino + Dieta = Moedas na Loja).
- **Endpoints Conectados:**
  - `GET /user/me` (Dados de identidade, moedas, peso, meta e atributos do personagem)
  - `GET /energy/daily-summary` (TMB, GET, queima em treinos, queima em passos, calorias consumidas e saldo)
  - `GET /energy/weekly-budget` (Cofre semanal e buffer acumulado para o fim de semana)
- **Componentes Chave:**
  - `UserHUD.tsx`: Avatar, Level, XP, Meta corporal ativa e Saldo de Moedas em destaque com atalho direto à Loja.
  - `ShopRewardBanner.tsx`: Vitrine da próxima recompensa gastronômica selecionada e % de moedas acumuladas.
  - `EnergyBalance.tsx`: Barra de progresso do balanço energético diário com decomposição detalhada (TMB + Atividade vs. Consumo).
  - `CaloricVault.tsx`: Visualizador do cofre calórico semanal, mostrando os dias da semana e o buffer para o sábado/domingo.

---

### 📱 Tela 2: Treinos & Sobrecarga Progressiva (`/workouts`)
- **Objetivo:** Ergonomia máxima durante a musculação; criação de rotinas, histórico de sessões e execução com rest timer.
- **Endpoints Conectados:**
  - `GET /workout` (Rotinas do usuário)
  - `POST /workout` (Criar nova rotina personalizada)
  - `GET /workout/:id` e `PUT /workout/:id` (Detalhes e edição de rotina)
  - `DELETE /workout/:id` (Exclusão de rotina)
  - `POST /workout/session` ou `POST /workout/logs` (Salva a sessão executada e credita moedas/calorias)
  - `GET /workout/logs/user` (Histórico de treinos anteriores)
  - `GET /workout/progression/:exerciseName` (Evolução de carga/1RM por exercício)
  - `POST /workout/check-missed` (Auditoria de treinos pendentes)
- **Componentes Chave:**
  - `RoutineCard.tsx`: Cartão com resumo dos grupos musculares e botão "Iniciar Sessão".
  - `ActiveWorkoutSession.tsx`: Modo de treino ativo com séries (aquecimento/normal/falha), cargas e reps.
  - `RestTimerFloating.tsx`: Timer flutuante de descanso com presets de 60s, 90s, 120s e som sutil.
  - `ProgressionChart.tsx`: Gráfico linear da sobrecarga progressiva ao longo das semanas.

---

### 📱 Tela 3: Diário Nutricional & Balanço de Macros (`/nutrition`)
- **Objetivo:** Registro ágil de alimentos consumidos no dia, controle de macronutrientes (Proteína, Carboidrato, Gordura) e busca por código de barras.
- **Endpoints Conectados:**
  - `GET /nutrition/getDailySummary` (Resumo de refeições do dia e totais consumidos)
  - `POST /nutrition/log` (Registro de alimento em uma das refeições: Café, Almoço, Jantar, Lanches)
  - `DELETE /nutrition/log/:id` (Remoção de item registrado)
  - `GET /nutrition/search` (Busca textual rápida no banco de alimentos)
  - `GET /nutrition/barcode/:barcode` (Consulta instantânea de EAN via Open Food Facts)
- **Componentes Chave:**
  - `MacroRings.tsx`: Anéis ou barras compactas com gramas consumidas vs. metas diárias calculadas.
  - `MealSection.tsx`: Seções sanfonadas por refeição com calorias parciais e lista de itens adicionados.
  - `FoodSearchModal.tsx`: Modal com input de busca rápida, lista de sugestões com macros discriminados e botão para leitor de código de barras.
  - `BarcodeScannerSheet.tsx`: Integração com câmera/leitor para leitura instantânea de código de barras de embalagens.

---

### 📱 Tela 4: Hábitos & Quests do Caçador (`/habits`)
- **Objetivo:** Monitoramento das rotinas diárias não-musculares que constroem a consistência e regeneram os atributos RPG do avatar (Vitalidade, Foco, Inteligência).
- **Endpoints Conectados:**
  - `GET /habits` (Lista de hábitos diários do usuário e streaks atuais)
  - `POST /habits` (Criação de novo hábito com categoria e atributo-alvo)
  - `POST /habits/:id/checkin` (Check-in ou progresso de quantidade do hábito)
  - `PATCH /habits/:id` e `DELETE /habits/:id` (Edição/exclusão de hábito)
  - `GET /habits/steps/today` e `POST /habits/steps` (Consulta e log de passos diários)
  - `GET /habits/steps/recommendation` (Meta recomendada de passos)
  - `GET /quests` e `POST /quests/:id/complete` (Missões ativas com prazos e recompensas)
- **Componentes Chave:**
  - `WaterTrackerCard.tsx`: Widget de copos/garrafas de água com meta automática calculada pelo peso (`peso * 35ml`).
  - `StepsProgressCard.tsx`: Visualizador de passos diários conectados à geração de moedas e queima calórica.
  - `HabitItemRow.tsx`: Linha densa de hábito com checkbox tátil, streak de dias seguidos e tag do atributo RPG (`+Vitality`, `+Focus`).
  - `QuestList.tsx`: Missões especiais semanais ou diárias com badges de XP e Moedas.

---

### 📱 Tela 5: Loja de Refeições Livres / The Vault Market (`/rewards`)
- **Objetivo:** O clímax do loop comportamental. O usuário gasta suas moedas acumuladas para autorizar refeições livres (Cheat Meals) calculadas, descontando o excedente do Cofre Semanal sem comprometer o déficit.
- **Endpoints Conectados:**
  - `GET /user/me` (Saldo de moedas disponíveis)
  - `GET /energy/weekly-budget` (Saldo disponível no cofre calórico semanal)
  - *Fluxo de resgate*: deduz moedas do perfil e compensa no cofre calórico.
- **Componentes Chave:**
  - `VaultBalanceSummary.tsx`: Exibição sinérgica: Moedas Disponíveis + Saldo Calórico no Cofre de Fim de Semana.
  - `CheatMealCard.tsx`: Card de refeição livre (ex: Pizza Artesanal, Burger Duplo, Rodízio) com custo em moedas, estimativa calórica e botão de resgate condicional (habilitado apenas com moedas suficientes).
  - `CustomRewardModal.tsx`: Permite ao usuário cadastrar seus próprios pratos favoritos ou recompensas pessoais da vida real.

---

### 📱 Tela 6: Perfil do Caçador & Metas Biométricas (`/profile`)
- **Objetivo:** Ajuste fino dos parâmetros biológicos que regem o motor de cálculo da dieta e visualização da ficha de atributos do personagem.
- **Endpoints Conectados:**
  - `GET /profile` e `PATCH /profile` (Peso, altura, idade, sexo biológico, nível de atividade e meta primária)
  - `GET /profile/recommendations` (Recomendações automáticas de calorias e macros)
  - `PATCH /profile/nutrition` (Recálculo da dieta)
  - `POST /user/logout` (Encerra a sessão limpando os cookies)
- **Componentes Chave:**
  - `BiometricsForm.tsx`: Campos numéricos compactos para peso atual, altura e nível de atividade física.
  - `PrimaryGoalSelector.tsx`: Seleção tática entre Déficit (-400 kcal), Hipertrofia (+300 kcal) ou Manutenção.
  - `CharacterSheet.tsx`: Visualizador de atributos RPG do caçador (Força, Vitalidade, Agilidade, Disciplina, HP Atual / Max HP).

---

## 4. Design Tokens & Cores Semânticas (Tailwind)

```css
/* Paleta Dark Obsidian */
--bg-base: #08090a;
--bg-surface: #0c0e12;
--bg-surface-elevated: #14171d;
--border-subtle: rgba(255, 255, 255, 0.08);
--border-focus: rgba(255, 255, 255, 0.20);

/* Cores Semânticas de Domínio */
--color-coins: #f59e0b;     /* Amber: Moedas, Loja de Recompensas, Economia */
--color-workout: #f43f5e;   /* Rose: Treinos, Frequência Cardíaca, Sobrecarga */
--color-nutrition: #10b981; /* Emerald: Nutrição, Macros, Recuperação */
--color-vault: #06b6d4;     /* Cyan: Cofre Calórico Semanal, Buffer de Fim de Semana */
--color-stats: #8b5cf6;     /* Violet/Slate: Atributos de Personagem (RPG) */
```

---

## 5. Checklist de Verificação de Telas (Critérios de Aceite)

- [ ] Toda tela consome 100% dos dados da API real via `client` do `openapi-fetch` sem `as any`.
- [ ] Todo número de métrica usa `tabular-nums` e `font-mono`.
- [ ] Nenhuma cor de gradiente clichê roxo/arco-íris é utilizada em botões ou cards.
- [ ] O Rest Timer e a sessão de treino funcionam sem perder o estado caso o usuário mude de aba.
- [ ] O leitor de código de barras e a busca de alimentos trazem macros reais calculados.
- [ ] O resgate de recompensas na loja valida se o usuário possui saldo de moedas suficiente.
- [ ] O comando `npm run lint` (`tsc --noEmit`) no diretório `rpg-frontend` passa com **zero erros**.
