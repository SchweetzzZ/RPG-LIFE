# RPG-LIFE — Plano de Reestruturação do Núcleo

> Documento-guia da próxima etapa. Substitui os planos anteriores (`RPG PLAN`, `mvp_roadmap_RPG`, `plano_monetizacao_rpg_life.md`, `DASHBOARD_EVOLUCAO_TATICA.md`) como referência de prioridade. Esses ficam arquivados, não apagados.

---

## 1. Norte do produto

**"O app que te deixa comer pizza no sábado sem culpa."**

O núcleo é um único ciclo, e tudo que não alimenta esse ciclo sai ou congela:

```
Agendar a refeição livre  →  Guardar kcal todo dia (fechando o dia)  →  Ganhar o ticket com consistência
        ↑                                                                              ↓
Compartilhar a conquista  ←  Registrar a refeição (foto + kcal real)  ←  Resgatar no dia marcado
```

Duas moedas com papéis diferentes:

| | **Cofre de kcal** (permissão) | **Moedas** (mérito) |
|---|---|---|
| O que mede | Física: o que sobrou abaixo da meta *já com déficit* | Consistência: dia fechado, treino, passos, sequência |
| Como entra | Só em dias **fechados** | Ações concluídas |
| Para que serve | Paga as kcal da refeição livre | Paga o "ticket" da refeição livre |

A refeição livre exige **as duas**.

---

## 2. Funcionalidades do MVP

Seis áreas. Tudo gira em volta da refeição livre.

### 2.1 Refeição livre (o centro)
- Agendar refeição livre: nome, data e kcal estimadas ("Rodízio sábado")
- **Montador de refeição:** cada tipo de refeição (rodízio de sushi, pizza, hambúrguer, açaí, churrascaria…) vem com seus itens típicos pré-carregados e contadores +/− (ex.: uramaki × 10, hot roll × 6, temaki × 2). A pessoa monta, o app soma. Atalhos prontos *leve / média / pesada* para quem não quer montar.
- Item avulso no montador e refeição 100% personalizada para o que não estiver no catálogo
- Ver quanto guardar por dia até a data
- Resgatar no dia: gasta kcal do cofre + ticket de moedas
- Registrar o que comeu de verdade (montador de novo + foto opcional). Se comeu menos que o planejado, a sobra volta ao cofre
- Galeria de refeições conquistadas

### 2.2 Dia
- Meta de calorias do dia (sobe com treino e passos)
- **Fechar o dia:** confirma que registrou tudo e deposita a sobra no cofre
- Sequência de dias fechados

### 2.3 Dieta
- Busca de alimentos (TACO + Open Food Facts)
- Leitor de código de barras
- Registro rápido: recentes, favoritos, "repetir refeição de ontem"
- Cadastrar alimento próprio
- Macros do dia (proteína, carboidrato, gordura)

### 2.4 Treino
- Criar e salvar rotinas
- Registrar séries, repetições e carga durante o treino
- Timer de descanso
- Ver a carga da última vez em cada exercício
- Ao concluir: kcal gastas + moedas

### 2.5 Atividade
- Passos automáticos (Health Connect / HealthKit), manual na web
- Meta diária de passos

### 2.6 Perfil e progresso
- Onboarding curto: peso, altura, idade, sexo, rotina, objetivo (perder / manter / ganhar)
- Registro de peso ao longo do tempo
- Nível e XP
- Extrato do cofre de kcal e extrato de moedas

### 2.7 Situação atual de cada área
| Área | Estado no código | Trabalho |
|---|---|---|
| Refeição livre | Só mock no front | **Novo** (principal esforço) |
| Dia | Não existe | **Novo** |
| Dieta | Busca TACO/OFF e registro prontos | Registro rápido |
| Treino | Quase pronto | Trocar recompensa, mostrar última carga |
| Atividade | Passos manuais prontos | Health Connect / HealthKit (Capacitor) |
| Perfil | Biometria pronta | Fuso, histórico de peso, extratos |

### 2.8 Depois do MVP (só se o teste validar)
- Card compartilhável da conquista
- Modo grupo (amigos guardando para o mesmo rodízio)
- Gráfico de evolução de carga por exercício
- Meta calórica adaptativa pela tendência de peso (PRO)
- Registro de comida por foto com IA (PRO)

### 2.9 Catálogo do montador: fontes de dados
Nenhuma API entrega "kcal de um rodízio". O catálogo é **curado uma vez** e gravado no banco, com fonte por item.
| Fonte | Uso | Licença |
|---|---|---|
| USDA FoodData Central | Itens genéricos (sushi, pizza, hambúrguer) | Domínio público, API grátis: **uso comercial ok** |
| Tabelas nutricionais das redes (McDonald's, BK, Subway…) | Itens de redes específicas | Dados públicos das empresas |
| TACO (Unicamp) | Alimentos básicos brasileiros | Conferir termos |
| TBCA (USP/FoRC) | Preparações brasileiras | **CC BY-NC-ND: uso comercial exige autorização** |

Com o tempo, os atalhos leve/média/pesada podem ser recalibrados com o `actualKcal` informado pelos usuários.

---

## 3. O que sai

### Backend
| Item | Ação | Motivo |
|---|---|---|
| `modules/character-classes/` (inteiro) | **Excluir** | Classes não servem ao núcleo. Já nem está registrado no `AppModule`. |
| `modules/quest/` (inteiro) | **Excluir** | Quests genéricas competem com o ciclo principal. |
| `Habit` / `DailyHabitLog` genéricos + enums `HabbitCategory`, `HabbitStatType` | **Excluir** | Estudo/meditação/inteligência fogem do foco. **Manter `StepLog`.** |
| `Character`: `stats`, `hp`, `maxHp`, `gems`, `characterClass`, `equippedSkin`, `waterQuantity`, `vaultBalance`, `coins`, `xpModifiers` | **Remover campos** | Ver item 5.1 (Character vira "Progresso"). |
| `CharacterService.takeDamage` / `heal` / `addToVault` / `addCoins` | **Excluir** | Sem HP, sem punição. Saldo vai para ledgers. |
| `UserProfile`: `coins`, `vaultBalance` | **Remover** | Saldo duplicado (hoje grava em profile **e** character). Vira ledger. |
| `UserProfile`: `stressLevel`, `livesInHotClimate`, `trainsRegularly` | **Remover** | Só serviam à água/ajustes não usados. |
| Fórmula `coins = kcal × 0.25` (workout) e `steps × 0.01` (passos) | **Substituir** | Moeda deixa de ser proporcional a kcal (item 5.2). |

### Frontend
| Item | Ação |
|---|---|
| `components/profile/CharacterSheet.tsx` | Excluir |
| `components/habits/HabitRow.tsx`, `WaterTrackerCard.tsx` | Excluir |
| `routes/habits.tsx` | Reduzir a "Atividade" (só passos) ou fundir no Hub |
| `routes/rewards.tsx`: `initialRewards` mockado e `useState(1650)` | Reescrever ligado à API |
| `ShopRewardBanner.tsx`: `targetReward` default mockado | Substituir pela próxima refeição agendada real |

### Congelado (fora de escopo até validar o núcleo)
Monetização (Hero PRO, battle pass, gemas, skins, temas), foto com IA, heatmap muscular, hidratação, parcerias iFood.

### Documentos
Mover para `docs/arquivo/`: `RPG PLAN`, `mvp_roadmap_RPG`, `plano_monetizacao_rpg_life.md`, `DASHBOARD_EVOLUCAO_TATICA.md`, `ui_screens_specification.md`, `PROMPTS_DELEGACAO_TELAS.md`.
Manter na raiz: `AGENTS.md` (atualizar apontando para este plano), `guia_implementacao_auth.md`, `guia_rate_limit_redis.md`.

---

## 4. A conta corrigida (`energy.service.ts`)

### 4.1 Bugs atuais
1. **Déficit vira comida:** `getDailySummary` aplica 0,80 no TDEE, mas `getWeeklyBudget` usa TDEE cheio → o déficit planejado é contado como "economia".
2. **Não registrar = economizar:** dia sem `FoodLog` gera `savedCalories = TDEE inteiro`.
3. **Dupla contagem:** multiplicador "moderado" (1,55) já inclui exercício + soma kcal de treino/passos por cima. MET usado é bruto (inclui basal).
4. **Fuso horário:** datas via `toISOString()` são UTC → depois das 21h em Brasília o "dia" vira. Fatal para "fechar o dia".

### 4.2 Nova fórmula
```
TMB            = Mifflin-St Jeor (igual hoje)
Base do dia    = TMB × multiplicador de ROTINA (sem treino: sedentário 1,2 / leve 1,375 / em pé o dia todo 1,55)
Ativo do dia   = treino líquido + passos líquidos
   treino      = (MET − 1) × peso × horas
   passos      = só os acima da linha de base (ex.: 4.000) × fator por peso
Meta do dia    = (Base + Ativo) × (1 − déficit%)        // déficit% vem do objetivo: perder 20%, manter 0%, ganhar −10%
Guardado       = dia FECHADO ? min(Meta − Consumido, teto) : 0
teto           = 25% da Meta                             // jejuar não rende mais cofre (segurança + honestidade)
Excedente      = Consumido > Meta ? débito no cofre (linguagem neutra, sem perder moeda/XP)
```
- Onboarding: a pergunta de atividade passa a ser sobre a **rotina sem contar treino**.
- Todas as datas calculadas no fuso do usuário (`timezone` no perfil, default `America/Sao_Paulo`).

---

## 5. O que entra

### 5.1 Modelos novos

**`DayClose`** — o ritual diário
```ts
{ user, date /* YYYY-MM-DD no fuso do usuário */, targetKcal, consumedKcal, activeKcal,
  savedKcal, closedAt }
// índice único (user, date)
```

**`VaultEntry`** — ledger do cofre de kcal (saldo = soma)
```ts
{ user, date, kcal /* + depósito, − débito/resgate */, type: 'day_close'|'overflow'|'redeem'|'expire',
  refId? }
```

**`CoinEntry`** — ledger de moedas (fonte única; remove a duplicação profile/character)
```ts
{ user, amount, reason: 'day_close'|'workout'|'steps_goal'|'streak_7'|'ticket', refId?, createdAt }
```

**`FreeMealTemplate`** — catálogo do montador (curado, global)
```ts
{ slug /* "rodizio-sushi" */, name, category, icon,
  items: [{ key, name /* "Uramaki" */, unit /* "peça" */, kcalPerUnit, defaultQty, source }],
  presets: { light: number, medium: number, heavy: number } /* kcal */ }
```

**`FreeMeal`** — a refeição livre agendada (o coração do app)
```ts
{ user, template? /* ref FreeMealTemplate; vazio = personalizada */, title /* "Rodízio com a galera" */,
  scheduledFor /* data */,
  plannedItems: [{ name, unit, kcalPerUnit, qty }], estimatedKcal,
  actualItems?: [{ name, unit, kcalPerUnit, qty }], actualKcal?,
  ticketCost /* moedas */, status: 'planned'|'ready'|'redeemed'|'cancelled',
  photoUrl?, redeemedAt? }
// itens copiados (snapshot) para o histórico não mudar se o catálogo for recalibrado
```

**`Character` → `Progress`** (enxuto)
```ts
{ user, level, currentXp, nextLevelXp, currentStreak, bestStreak, lastClosedDate }
```

**`StepLog`** — adicionar `source: 'health_connect'|'healthkit'|'manual'`.

### 5.2 Tabela de moedas (valores iniciais, ajustar no teste)
| Ação | Moedas |
|---|---|
| Fechar o dia | +10 |
| Treino concluído | +20 |
| Meta de passos batida | +10 |
| Sequência de 7 dias fechados | +50 |
| **Ticket de refeição livre** | **−100** (≈ 1 semana consistente) |

### 5.3 Endpoints novos
| Método | Rota | Função |
|---|---|---|
| `POST` | `/day/close` | Fecha o dia: calcula meta, grava `DayClose`, deposita no cofre, dá moedas, atualiza sequência |
| `GET` | `/day/:date` | Estado do dia (aberto/fechado, meta, consumido, previsão de guardado) |
| `GET` | `/vault` | Saldo do cofre + extrato |
| `GET` | `/coins` | Saldo de moedas + extrato |
| `GET` | `/free-meal-templates` | Catálogo do montador (itens + atalhos) |
| `POST` | `/free-meals` | Agendar refeição livre |
| `GET` | `/free-meals/next` | Próxima agendada + **quanto guardar por dia até lá** |
| `POST` | `/free-meals/:id/redeem` | Resgatar (débito de kcal + ticket; aceita `actualKcal` e foto) |
| `DELETE` | `/free-meals/:id` | Cancelar |

### 5.4 Telas
- **Hub:** a próxima refeição livre domina a tela ("Rodízio sábado — guarde 360 kcal/dia, faltam 3 dias"), com botão **Fechar o dia**.
- **Refeições livres** (substitui `rewards.tsx`): agendar, acompanhar, resgatar, galeria de conquistas.
- **Dieta:** registro rápido: recentes, favoritos, "repetir refeição de ontem", código de barras.
- **Treino:** mantém o atual (já é bom), só troca a recompensa.
- **Perfil:** perfil físico + objetivo + fuso.

---

## 6. Passos: decisão

**Não construir pedômetro próprio.** Ler dos agregadores de saúde do sistema:
- **Android → Health Connect** (junta dados do celular, Samsung Health, Google Fit, relógios Xiaomi/Garmin etc.)
- **iOS → HealthKit**

Para isso o app precisa de casca nativa: **Capacitor** sobre o front atual (Vite + React + TanStack). Isso reaproveita 100% do que existe e evita reescrever em React Native.

Na web os passos continuam manuais e ficam marcados como `source: 'manual'`.

---

## 7. Fases

### Fase 0 — Limpeza (≈ 1 semana)
- [ ] Mover docs antigos para `docs/arquivo/`, atualizar `AGENTS.md`
- [ ] Excluir `character-classes`, `quest`, `Habit` genérico, campos de RPG do `Character`/`Profile`
- [ ] Remover componentes de front listados no item 3
- [ ] Datas no fuso do usuário (helper único `toUserDate(date, tz)`)
- [ ] `npm run build` (back) e `npm run lint` (front) verdes, `schema.ts` regenerado

### Fase 1 — Núcleo honesto (≈ 1–2 semanas)
- [ ] Nova fórmula do item 4 em `EnergyService`
- [ ] `DayClose`, `VaultEntry`, `CoinEntry`, `Progress` + `POST /day/close`
- [ ] `FreeMealTemplate` + seed do catálogo inicial (30–50 refeições, com fonte por item)
- [ ] `FreeMeal` + endpoints de agendar, próxima e resgatar (com montador)
- [ ] Hub e tela de Refeições Livres ligados à API (zero mock)
- [ ] Testes unitários da fórmula (dia não fechado = 0, teto de 25%, excedente debita)

### Fase 2 — Atrito zero (≈ 1–2 semanas)
- [ ] Capacitor + Health Connect/HealthKit para passos
- [ ] Registro rápido de comida (recentes, favoritos, repetir ontem)
- [ ] Onboarding em ≤ 2 minutos terminando em "agende sua primeira refeição livre"

### Fase 3 — Teste real (4 semanas, 10–20 pessoas)
Métricas:
- % que **fecha o dia ≥ 5×/semana**
- % que **resgata ≥ 1 refeição livre**
- % ainda ativo na **semana 4**

### Fase 4 — Crescimento (depois do teste)
- Card compartilhável pós-resgate ("Conquistei essa pizza: 3 treinos, 48 mil passos, 1.600 kcal guardadas")
- Modo grupo: amigos guardando para o mesmo rodízio
- Só então: plano PRO (TDEE adaptativo por tendência de peso, foto com IA) e canal com nutricionistas/personais

---

## 8. Decisões em aberto

> Atualizado em 10/10/2026: as decisões 1 a 3 foram tomadas e estão na seção 4 do `PLANO_PROXIMOS_LOTES.md`, que vence este texto (cofre semanal que zera no dia da refeição livre, excedente desconta do cofre com alerta neutro, compra da refeição livre só com kcal e moedas suficientes, moedas zeram junto com o cofre). O `VaultEntry` com `expire` e validade de 14 dias foi substituído por `Cycle` + `cycle_reset`.

1. **Cofre expira?** Sugestão: kcal guardadas valem por 14 dias, para não acumular "crédito" de mês passado.
2. **Excedente debita do cofre?** Sugestão: sim, com linguagem neutra ("ajuste do dia"), sem perder moedas ou sequência.
3. **Resgatar sem saldo suficiente?** Sugestão: permitir (a vida é do usuário), mostrando o número honesto.
4. **Manter nível/XP?** Sugestão: manter, simples, como medidor de longo prazo.
5. **Nome do produto:** "RPG-LIFE" ainda faz sentido se o RPG sair do centro?
