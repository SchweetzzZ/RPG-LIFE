# 📱 RPG-LIFE: Guia Definitivo de Prompts para Delegação de Sub-Agentes (Mobile-First)

Este documento contém os **prompts exatos e auto-contidos** para serem entregues a cada sub-agente. Cada prompt foi formulado com a premissa obrigatória de **Mobile-First Real**: a interface deve ser perfeita para ser operada com **uma única mão na academia ou na rua** (Thumb Zone), adaptando-se de forma limpa quando visualizada no Desktop.

---

## 📐 Diretrizes Globais de Ergonomia Mobile-First (Obrigatórias em Todos os Agentes)

1. **Thumb Zone (Alcance do Polegar):**
   - Ações principais (concluir série, registrar água, confirmar refeição livre) devem ficar na **metade inferior da tela**.
   - A navegação principal é uma **Bottom Navigation Bar** fixa com altura de 64px + suporte a Safe Area de iOS/Android (`pb-[env(safe-area-inset-bottom)]`).
   - Todo conteúdo rolável deve possuir `pb-24` ou `pb-28` para que o último item nunca fique escondido atrás da Bottom Bar.

2. **Touch Targets (Área de Toque Confortável):**
   - Nenhum botão ou checkbox interativo pode ter menos de `44px x 44px` (padrão Apple Human Interface & Google Material).
   - Espaçamento de no mínimo `8px` entre botões adjacentes para evitar toques acidentais em dedos suados durante o treino.

3. **Bottom Sheets em vez de Modais Centrais:**
   - Em celulares, formulários rápidos (adicionar alimento, registrar passos, ver histórico) **NUNCA** abrem como caixas pop-up no centro da tela. Eles sobem suavemente da borda inferior (*Slide-up Bottom Sheet*) com cantos superiores arredondados (`rounded-t-2xl`) e barra de arraste (*drag handle*).

4. **Inputs Numéricos Adequados:**
   - Todo campo de peso, calorias, carga e reps deve conter `inputMode="decimal"` ou `inputMode="numeric"` e `type="text"` ou `type="number"`, com tamanho de fonte de pelo menos `16px` (`text-base`) para evitar o zoom involuntário do Safari no iPhone.

5. **Anti-AI Slop & Estética Obsidian:**
   - Fundo base `#08090a`, superfícies `#0c0e12`, bordas `border-white/[0.08]`.
   - Zero emojis soltos (`lucide-react` exclusivo). Zero gradientes roxo/índigo genéricos. Números sempre em `tabular-nums font-mono`.

---

## 🤖 PROMPT DO AGENTE 0: App Shell & Bottom Navigation Tática

```markdown
Você é um Especialista em Mobile UI/UX Engineering focado em aplicações móveis táticas e ergonômicas.

OBJETIVO:
Criar o App Shell global e a Bottom Navigation Bar móvel para o RPG-LIFE em:
- 'rpg-frontend/src/components/layout/BottomNav.tsx'
- Atualizar 'rpg-frontend/src/routes/__root.tsx'

REQUISITOS MOBILE-FIRST:
1. Barra fixa no rodapé da viewport ('fixed bottom-0 left-0 right-0 z-50').
2. Efeito de vidro escuro fosco ('bg-[#08090a]/90 backdrop-blur-lg border-t border-white/[0.08]').
3. 5 itens de navegação com área de toque generosa (min-h-[56px]), distribuídos uniformemente:
   - [⚡ Hub] -> Rota '/' (Ícone: Activity ou Zap)
   - [🏋️ Treino] -> Rota '/workouts' (Ícone: Dumbbell)
   - [🥗 Nutrição] -> Rota '/nutrition' (Ícone: Apple ou UtensilsCrossed)
   - [📜 Hábitos] -> Rota '/habits' (Ícone: CheckSquare ou Flame)
   - [🍔 Loja] -> Rota '/rewards' (Ícone: ShoppingBag ou Sparkles)
4. Indicador de aba ativa:
   - Ícone e texto em cor de destaque semântico ou 'text-amber-400'/'text-zinc-100' com um sutil ponto brilhante de 4px na parte superior ('bg-amber-400 shadow-[0_0_8px_#f59e0b]').
   - Abas inativas em 'text-zinc-500 hover:text-zinc-300'.
5. Micro-tipografia do rótulo: 'text-[10px] font-mono tracking-tight uppercase'.
6. Responsividade no Desktop:
   - Centralizar a barra no rodapé com 'max-w-md mx-auto md:max-w-lg md:rounded-t-2xl md:border-x'.
7. Validação: Apenas componentes visuais React + Tailwind, com navegação via TanStack Router (<Link to="..." />).
```

---

## 🤖 PROMPT DO AGENTE 1: Treinos & Sobrecarga Progressiva (`/workouts`)

```markdown
Você é um Principal Frontend Engineer especializado em apps de musculação de alta ergonomia (benchmark: Hevy e Strong).

OBJETIVO:
Construir a casca visual da Tela de Treinos do RPG-LIFE em:
- 'rpg-frontend/src/routes/workouts.tsx'
- 'rpg-frontend/src/components/workouts/RoutineCard.tsx'
- 'rpg-frontend/src/components/workouts/ActiveWorkoutSession.tsx'
- 'rpg-frontend/src/components/workouts/RestTimerFloating.tsx'

REQUISITOS MOBILE-FIRST (USO COM UMA MÃO NA ACADEMIA):
1. 'RoutineCard.tsx':
   - Card compacto do treino de hoje (ex: 'Treino A: Peito e Tríceps').
   - Tag de grupos musculares, estimativa de duração ('~50 min') e calorias/moedas estimadas ('+380 kcal • +38 Moedas').
   - Botão de ação primária destacado na base do card: 'Iniciar Treino' ('h-12 w-full rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-bold flex items-center justify-center gap-2').
2. 'ActiveWorkoutSession.tsx' (Modo de Treino Ativo):
   - Header fixo com nome do treino, tempo corrido ('00:32:15') e botão 'Finalizar Treino' ('bg-emerald-500/20 text-emerald-400 border border-emerald-500/30').
   - Lista vertical de exercícios (ex: 'Supino Reto', 'Desenvolvimento Halteres').
   - Tabela de séries ultra-compacta para mobile:
     * Colunas: SET (1, 2, 3), TIPO (Aquecimento / Normal / Falha com pills coloridas), KG, REPS, CHECKBOX.
     * Checkbox tátil grande ('h-10 w-10 rounded-lg') que muda para verde esmeralda ('bg-emerald-500 text-black') com animação ao toque.
     * Inputs numéricos com 'inputMode="decimal"' e 'text-center font-mono font-bold text-base'.
3. 'RestTimerFloating.tsx' (Timer Flutuante de Descanso):
   - Barra flutuante fixada acima da Bottom Nav ('bottom-20 left-4 right-4 max-w-md mx-auto').
   - Contagem regressiva ('01:30') em 'tabular-nums font-mono font-extrabold text-xl text-rose-400'.
   - Botões táteis rápidos: '+30s' e 'Pular Descanso'.
4. Paleta de acento obrigatória: Kinetic Rose ('#f43f5e' / 'rose-400').
5. Criar com dados mockados em props. Zero erros de TypeScript ('tsc --noEmit').
```

---

## 🤖 PROMPT DO AGENTE 2: Diário Nutricional & Balanço de Macros (`/nutrition`)

```markdown
Você é um Especialista em UI/UX para Nutrição Esportiva (benchmark: MacroFactor e MyFitnessPal).

OBJETIVO:
Construir a casca visual da Tela de Nutrição do RPG-LIFE em:
- 'rpg-frontend/src/routes/nutrition.tsx'
- 'rpg-frontend/src/components/nutrition/EnergyHeader.tsx'
- 'rpg-frontend/src/components/nutrition/MacroRings.tsx'
- 'rpg-frontend/src/components/nutrition/MealSection.tsx'
- 'rpg-frontend/src/components/nutrition/FoodSearchModal.tsx'

REQUISITOS MOBILE-FIRST:
1. 'EnergyHeader.tsx':
   - Painel compacto com a equação calórica do dia:
     'Meta (2.100) - Alimentos (1.450) + Exercício (380) = Restante (1.030 kcal)'.
   - Valores em 'tabular-nums font-mono font-bold'.
2. 'MacroRings.tsx' (Barras de Macronutrientes):
   - Três barras de progresso horizontais compactas e densas:
     * Proteína (Meta: 160g / 180g) -> Acento Azul/Índigo sutil
     * Carboidratos (Meta: 190g / 220g) -> Acento Ciano (#06b6d4)
     * Gorduras (Meta: 48g / 60g) -> Acento Âmbar (#f59e0b)
   - Exibir gramas consumidas, meta e percentual.
3. 'MealSection.tsx' (Refeições por Bloco):
   - Blocos colapsáveis/sanfonados para: Café da Manhã, Almoço, Café da Tarde, Jantar.
   - Cada bloco exibe o total calórico parcial e botão touch '+ Adicionar' ('h-9 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03]').
   - Itens adicionados com nome, porção ('150g'), calorias e botão de excluir.
4. 'FoodSearchModal.tsx' (Bottom Sheet no Mobile):
   - No celular, sobe como gaveta inferior ('rounded-t-2xl').
   - Campo de busca textual com autofocus e botão lateral com ícone de código de barras ('Scan EAN').
   - Lista rápida de alimentos favoritos com calorias e macros discriminados.
5. Paleta de acento obrigatória: Bio Emerald ('#10b981') e Titanium Cyan ('#06b6d4').
6. Componente 100% apresentacional pronto para receber props.
```

---

## 🤖 PROMPT DO AGENTE 3: Hábitos, Passos & Quests do Caçador (`/habits`)

```markdown
Você é um UI Designer & Engineer especializado em gamificação comportamental (benchmark: Habitica).

OBJETIVO:
Construir a casca visual da Tela de Hábitos e Quests do RPG-LIFE em:
- 'rpg-frontend/src/routes/habits.tsx'
- 'rpg-frontend/src/components/habits/WaterTrackerCard.tsx'
- 'rpg-frontend/src/components/habits/StepsProgressCard.tsx'
- 'rpg-frontend/src/components/habits/HabitRow.tsx'

REQUISITOS MOBILE-FIRST:
1. 'WaterTrackerCard.tsx' (Hidratação Dinâmica):
   - Meta calculada pelo peso ('2.800 ml').
   - Barra de progresso circular ou líquida com o percentual atual ('1.750 / 2.800 ml - 62%').
   - Botões de incremento rápido com alcance do polegar: '+250 ml (Copo)', '+500 ml (Garrafa)'.
   - Tag de recompensa RPG: '+Vitality • +15 XP'.
2. 'StepsProgressCard.tsx' (Passos Diários & Queima):
   - Card com número de passos atuais ('7.840 / 10.000 passos').
   - Indicador de calorias gastas via passos ('+235 kcal queimadas') e moedas geradas ('+23 Moedas').
   - Botão rápido para sincronizar/adicionar passos manuais.
3. 'HabitRow.tsx' (Lista de Hábitos Diários):
   - Linha compacta ('min-h-[52px]') com:
     * Checkbox tátil grande no lado esquerdo ('h-8 w-8 rounded-lg border border-white/20').
     * Título do hábito ('Leitura de 15 min', 'Meditação matinal').
     * Badge do atributo RPG ('+Intelligence' em roxo suave, '+Focus' em ciano).
     * Badge de Streak de dias seguidos com ícone de chama ('🔥 12 dias').
4. Acento estrito em Bio Emerald ('#10b981') para consistência e Amber ('#f59e0b') para moedas.
```

---

## 🤖 PROMPT DO AGENTE 4: Loja de Refeições Livres / The Vault Market (`/rewards`)

```markdown
Você é um Especialista em Interfaces de E-commerce e Economia Comportamental Gamificada.

OBJETIVO:
Construir a casca visual da Loja de Refeições Livres (Cheat Meals) do RPG-LIFE em:
- 'rpg-frontend/src/routes/rewards.tsx'
- 'rpg-frontend/src/components/rewards/VaultBalanceSummary.tsx'
- 'rpg-frontend/src/components/rewards/CheatMealCard.tsx'
- 'rpg-frontend/src/components/rewards/CustomRewardModal.tsx'

REQUISITOS MOBILE-FIRST:
1. 'VaultBalanceSummary.tsx' (Painel do Cofre):
   - Fixado no topo: Saldo de Moedas do Usuário ('🪙 1.650 Moedas') e Saldo Calórico no Cofre de Fim de Semana ('🛡️ +1.400 kcal salvas').
   - Mensagem motivacional tática: '0% Culpa, 100% Mérito. Gaste o que conquistou no treino e na dieta.'
2. 'CheatMealCard.tsx' (Cards de Refeições Desejadas):
   - Cards com visual apetitoso e premium (ex: 'Hambúrguer Artesanal Smash Duplo', 'Pizza Inteira 4 Fatias', 'Açaí Completo 500ml', 'Rodízio de Sushi').
   - Informações:
     * Custo em Moedas ('1.400 Moedas')
     * Custo Calórico estimado ('~1.100 kcal')
     * Barra de progresso para quem ainda não tem moedas suficientes ('80% conquistado • Faltam 280 moedas').
   - Botão de ação ergonômico no polegar:
     * Se saldo suficiente: Botão dourado com brilho sutil 'Desbloquear Refeição Livre' ('bg-amber-400 text-black font-bold h-11 w-full rounded-xl').
     * Se saldo insuficiente: Botão desabilitado com indicador de progresso.
3. 'CustomRewardModal.tsx':
   - Bottom sheet para o usuário cadastrar sua comida favorita e definir quantas moedas ela custará.
4. Acento obrigatório: Forged Amber ('#f59e0b') e Titanium Cyan ('#06b6d4').
```

---

## 🤖 PROMPT DO AGENTE 5: Perfil, Biometria & Ficha do Caçador (`/profile`)

```markdown
Você é um Especialista em UI de Configuração e Ficha de Personagens RPG.

OBJETIVO:
Construir a casca visual da Tela de Perfil e Metas do RPG-LIFE em:
- 'rpg-frontend/src/routes/profile.tsx'
- 'rpg-frontend/src/components/profile/BiometricsForm.tsx'
- 'rpg-frontend/src/components/profile/PrimaryGoalSelector.tsx'
- 'rpg-frontend/src/components/profile/CharacterSheet.tsx'

REQUISITOS MOBILE-FIRST:
1. 'CharacterSheet.tsx' (Ficha RPG do Avatar):
   - Avatar com inicial ou insígnia de classe, Nível atual ('NVL 7') e Barra de XP ('450 / 800 XP').
   - Barra de HP do Caçador ('100 / 100 HP') com penalidades visuais se o usuário faltar treinos.
   - Grid compacto com os 4 Atributos Principais:
     * Força (Strength) - gerada por treinos de musculação
     * Vitalidade (Vitality) - gerada por hidratação e sono
     * Foco (Focus) - gerado por hábitos de trabalho/meditação
     * Disciplina (Discipline) - gerada pela consistência semanal
2. 'PrimaryGoalSelector.tsx' (Seletor Tático de Meta):
   - 3 cartões selecionáveis táteis com toques confortáveis:
     * [Déficit / Queima de Gordura] (-400 kcal/dia)
     * [Superávit / Hipertrofia] (+300 kcal/dia)
     * [Manutenção / Performance] (Normocalórica)
3. 'BiometricsForm.tsx':
   - Campos ergonômicos para Peso atual (kg), Altura (cm), Idade e Nível de Atividade (Sedentário, Moderado, Intenso).
   - Inputs com 'inputMode="decimal"' e botão sticky na base: 'Salvar e Recalcular Dieta'.
4. Botão discreto de 'Encerrar Sessão' (Logout).
```

---

## 🤖 PROMPT DO AGENTE 6: Autenticação & Onboarding Tático (`/login`)

```markdown
Você é um Especialista em Telas de Acesso e Onboarding Mobile-First.

OBJETIVO:
Refinar e polir a tela de Login e Registro do RPG-LIFE em:
- 'rpg-frontend/src/routes/login.tsx'

REQUISITOS MOBILE-FIRST:
1. Layout centrado verticalmente otimizado para celulares ('max-w-sm mx-auto px-4 py-8').
2. Alternância de abas fluida com toque amplo: [Entrar] e [Criar Conta de Caçador].
3. Campos de formulário com altura mínima de 48px ('h-12'), cantos 'rounded-xl', ícones laterais do Lucide ('Mail', 'Lock', 'User') e foco com anel fino 'focus:ring-1 focus:ring-amber-400/50'.
4. Tratamento de mensagens de erro claras sob os inputs sem deslocar o layout abruptamente.
5. Botão de submissão primário de largura total ('w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold tracking-wide').
6. Totalmente integrado ao cookie HttpOnly (credentials: 'include') sem dependência de tokens manuais no localStorage.
```
