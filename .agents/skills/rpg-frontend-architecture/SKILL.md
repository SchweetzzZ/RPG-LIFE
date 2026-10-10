---
name: rpg-frontend-architecture
description: Especificação arquitetural das telas do RPG-LIFE (núcleo pós-reestruturação), integração de API orientada a contratos e design system anti-AI slop para o frontend.
---

# RPG-LIFE — Arquitetura e especificação do frontend

Este documento orienta a construção das telas do **RPG-LIFE**. A fonte de verdade de produto e prioridades é `PLANO_REESTRUTURACAO.md` (visão e fórmulas) junto com `PLANO_PROXIMOS_LOTES.md` (ordem de execução). Em caso de conflito, eles vencem este arquivo.

**O produto em uma frase:** "o app que te deixa comer pizza no sábado sem culpa."
O ciclo central: agendar uma refeição livre → guardar kcal todo dia fechando o dia → ganhar o ticket com consistência → resgatar no dia marcado → registrar o que comeu de fato.

Duas moedas com papéis diferentes, e a refeição livre exige as duas:

| | Cofre de kcal (permissão) | Moedas (mérito) |
|---|---|---|
| Mede | O que sobrou abaixo da meta, já com déficit | Consistência (dia fechado, treino, passos, sequência) |
| Entra | Só em dia **fechado** | Ações concluídas |
| Paga | As kcal da refeição livre | O "ticket" da refeição livre |

**Fora do produto (não recriar nem referenciar):** HP, atributos (força, inteligência…), classes de personagem, ficha de personagem, hábitos genéricos, quests, água, loja de recompensas definidas pelo usuário, gemas/skins/battle pass. Moeda só vem de esforço real: nada de comprar moeda nem de recompensa criada pelo usuário.

---

## 1. Princípios de arquitetura

1. **Backend é a fonte de verdade**
   - Nenhuma tela usa mock, dado fixo ou `localStorage` como banco fake.
   - Autenticação por **cookie HttpOnly** (`jwt`), enviado com `credentials: 'include'`.
   - Se a tela precisa de um dado que a API não tem, primeiro estende-se o DTO/endpoint no backend, depois regenera-se o `schema.ts`.

2. **Tipagem estrita (zero `any`, zero `unknown`, zero cast forçado)**
   - Toda chamada passa pelo `client` do `openapi-fetch` alimentado por `rpg-frontend/src/api/schema.ts`.
   - Tipos de formulário e de resposta derivam de `components['schemas']`.
   - `schema.ts` é **gerado**, não editado à mão: `npx openapi-typescript http://localhost:4000/api/json -o src/api/schema.ts` com o backend rodando.

3. **Datas e fuso**
   - O "dia" do usuário é calculado no backend com o fuso do perfil. O frontend não deriva datas com `toISOString().split('T')[0]`; quando precisar enviar uma data, usa a que a API devolveu ou formata no fuso do perfil.

4. **Bem-estar (vale para todo texto de interface)**
   - Dieta flexível, nunca punição: comer acima da meta não tira moeda, XP nem sequência.
   - Linguagem neutra no excedente ("ajuste do dia"). Nenhum texto incentiva jejum ou comer muito pouco.

5. **Design system "Tactical Kinetic HUD"** — detalhes na skill `rpg-life-ui-engine`.
   - Sem emojis: ícones `lucide-react` com `stroke-[1.5px]`/`stroke-[1.75px]`.
   - Sem gradientes genéricos. Fundo `#08090a`, superfícies `#0c0e12`/`#14171d`, bordas `border-white/[0.08]`.
   - Números com `tabular-nums font-mono tracking-tight`; rótulos `text-[10px] font-mono uppercase tracking-widest text-zinc-500`.

---

## 2. Referências de mercado (o que aproveitamos)

### MyFitnessPal / MacroFactor — diário e balanço energético
- Meta do dia, consumido e restante legíveis em 1 segundo.
- Macros (proteína, carboidrato, gordura) com barras proporcionais à meta.
- Refeições separadas (café, almoço, jantar, lanches); busca rápida e código de barras (TACO / Open Food Facts).
- **No RPG-LIFE:** o que sobra abaixo da meta em dia fechado vai para o **cofre de kcal** semanal, que zera no dia da refeição livre e paga as kcal dela.

### Hevy / Strong — ergonomia de treino
- Tabela de séries com técnica, carga, repetições e conclusão; timer de descanso; histórico por exercício.
- **No RPG-LIFE:** mostrar a carga da última vez por exercício (`GET /workout/progression/:exerciseName`); treino concluído rende moedas pela tabela fixa do backend.

### WeightWatchers — rollover
- Pontos não usados viram saldo para depois. Valida a ideia de guardar para gastar no dia escolhido.

---

## 3. Mapa de telas e endpoints

```
                      ┌──────────────────────┐
                      │  /login (auth)       │
                      └──────────┬───────────┘
                                 │ cookie HttpOnly
                                 ▼
┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
│ Hub           │ Treino        │ Nutrição      │ Atividade     │ Refeições     │
│ `/`           │ `/workouts`   │ `/nutrition`  │ `/activity`   │ livres        │
│               │               │               │               │ `/rewards`    │
└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
                                 │
                      ┌──────────┴───────────┐
                      │  /profile            │
                      └──────────────────────┘
```

Legenda dos endpoints: **(existe)** já está na API · **(Lote N)** previsto no `PLANO_PROXIMOS_LOTES.md`, ainda não implementado. Não ligar tela a endpoint que ainda não existe.

### Tela 0 — Login e cadastro (`/login`)
- `POST /user/login` (existe) — seta o cookie `jwt`.
- `POST /user/register` (existe) — cria usuário, `Progress` e `UserProfile`.
- `POST /user/logout` (existe).

### Tela 1 — Hub (`/`)
Objetivo: a **próxima refeição livre domina a tela** ("Rodízio sábado — guarde 360 kcal/dia, faltam 3 dias"), com saldo do cofre, saldo de moedas, meta do dia e o botão **Fechar o dia**.
- `GET /user/me` (existe) — `{ user, profile, progress, coinBalance }`.
- `GET /coins` (existe) — saldo e extrato de moedas.
- `GET /day/:date` e `POST /day/close` (Lote 2) — estado do dia e fechamento.
- `GET /vault` (Lote 2) — saldo do cofre no ciclo atual, dias restantes e extrato.
- `GET /free-meals/next` (Lote 3) — refeição agendada, `neededKcal`, `daysLeft`, `perDayKcal`, `ready`.
- `GET /energy/daily-summary` existe hoje com a fórmula antiga; será substituído no Lote 2. `GET /energy/weekly-budget` será **removido** — não usar.

### Tela 2 — Treino (`/workouts`)
- `GET /workout`, `POST /workout`, `GET /workout/:id`, `PUT /workout/:id`, `DELETE /workout/:id` (existem) — rotinas do próprio usuário.
- `POST /workout/session` (existe) — conclui o treino; devolve kcal, moedas, XP e o log.
- `GET /workout/logs/user` (existe) — histórico.
- `GET /workout/progression/:exerciseName` (existe) — carga da última vez e evolução.
- Componentes: cartão de rotina, sessão ativa com séries, timer de descanso, carga anterior por exercício.

### Tela 3 — Nutrição (`/nutrition`)
- `GET /nutrition/getDailySummary` (existe) — totais de macros e registros do dia.
- `POST /nutrition/log`, `DELETE /nutrition/log/:id` (existem).
- `GET /nutrition/search` (existe) — TACO + Open Food Facts.
- `GET /nutrition/barcode/:barcode` (existe) — 404 quando o produto não existe.
- Recentes, favoritos, repetir refeição e alimento próprio (Lote 4).

### Tela 4 — Atividade (`/activity`)
- `POST /activity/steps`, `GET /activity/steps/today`, `GET /activity/steps/recommendation` (existem).
- Por enquanto passo digitado à mão rende moeda. Quando a leitura automática chegar (Lote 4), passo manual vira só registro e a moeda vem só de `health_connect`/`healthkit`. Leitura automática pelo celular no Lote 4 (Capacitor).

### Tela 5 — Refeições livres (`/rewards`)
O clímax do ciclo: escolher, agendar e resgatar a refeição livre.
- `GET /free-meal-templates` (Lote 3) — catálogo curado (rodízio, pizza, hambúrguer…), com atalhos leve/média/pesada.
- `POST /free-meals`, `GET /free-meals/next`, `POST /free-meals/:id/redeem`, `DELETE /free-meals/:id` (Lote 3).
- Componentes: catálogo, montador com contadores +/−, agendamento, resgate com "o que comi de fato" e foto opcional, galeria de conquistas.
- Comprar a refeição livre só com as duas metas batidas (kcal no cofre e 100 moedas); com o botão travado, mostrar o que falta e a prévia do impacto. Sem as metas, a pessoa registra o que comeu no diário normal (dia acima da meta, alerta neutro, sem conquista). Nunca bloquear o registro.

### Tela 6 — Perfil (`/profile`)
- `GET /profile`, `PATCH /profile` (existem) — peso, altura, idade, sexo biológico, rotina **sem contar treino**, objetivo e fuso.
- `PATCH /profile/nutrition` (existe) — recalcula metas de calorias e macros e devolve `{ profile, targets }`.
- Registro de peso ao longo do tempo (`/weight`, Lote 3); extratos de cofre e moedas.
- Componentes: `PhysicalProfileForm`, `PrimaryGoalSelector`.

---

## 4. Tokens de cor semânticos (Tailwind)

```css
/* Base */
--bg-base: #08090a;
--bg-surface: #0c0e12;
--bg-surface-elevated: #14171d;
--border-subtle: rgba(255, 255, 255, 0.08);
--border-focus: rgba(255, 255, 255, 0.20);

/* Domínio */
--color-coins: #f59e0b;     /* Amber: moedas e ticket da refeição livre */
--color-workout: #f43f5e;   /* Rose: treino e esforço */
--color-nutrition: #10b981; /* Emerald: nutrição e macros */
--color-vault: #06b6d4;     /* Cyan: cofre de kcal */
```

---

## 5. Critérios de aceite de cada tela

- [ ] 100% dos dados vêm da API real via `client` do `openapi-fetch`, sem `any`, `unknown` ou cast forçado.
- [ ] Nenhuma referência a HP, atributos, classes, hábitos, quests ou loja de recompensas personalizadas.
- [ ] Estados de carregamento, vazio e erro tratados (zero moedas, cofre vazio, perfil físico não preenchido).
- [ ] Números com `tabular-nums` e `font-mono`.
- [ ] Textos revisados com o cuidado de bem-estar (sem culpa, sem punição).
- [ ] `npm run lint` (`tsc --noEmit`) em `rpg-frontend` com **zero erros**.
