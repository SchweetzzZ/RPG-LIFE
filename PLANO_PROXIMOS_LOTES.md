# RPG-LIFE — Plano dos próximos lotes (documento de passagem)

> Escrito para uma conversa nova, com contexto limpo. Leia este arquivo inteiro antes de qualquer coisa.
> Relação com os outros documentos:
> - `PLANO_REESTRUTURACAO.md` = visão de produto, fórmulas e modelos (a "especificação"). Continua valendo, mas a seção 7 (Fases) foi substituída por este plano.
> - `AGENTS.md` = padrões de código (seção 0 tem as convenções do núcleo novo).
> - `docs/arquivo/` = planos antigos. NÃO seguir.

---

## 1. O produto em uma frase

**"O app que te deixa comer pizza no sábado sem culpa."**
O ciclo central: agendar uma refeição livre → guardar kcal todo dia fechando o dia → ganhar o ticket com consistência → resgatar no dia marcado → registrar o que comeu de fato → compartilhar.

Duas moedas com papéis diferentes:
| | Cofre de kcal (permissão) | Moedas (mérito) |
|---|---|---|
| Mede | O que sobrou abaixo da meta, já com déficit | Consistência (dia fechado, treino, passos, sequência) |
| Entra | Só em dia **fechado** | Ações concluídas |
| Paga | As kcal da refeição livre | O "ticket" da refeição livre |
| Zera | Toda segunda-feira (semana fixa de segunda a domingo) | Junto com o cofre |

A refeição livre exige **as duas** (regras completas na seção 4, todas confirmadas). Regra inegociável: moeda só vem de esforço real (nada de comprar moeda, nada de recompensa definida pelo usuário).

---

## 2. Estado atual (snapshot)

- Repositório: `github.com/SchweetzzZ/RPG-LIFE`. Branch de trabalho: **`refactor/nucleo`**, último commit conhecido **`e821e5d` ("new future main")**, enviado ao GitHub. `main` ainda está no commit antigo `88c4177`.
- Existe uma alteração local não commitada em `docker-compose.yml` (`restart: always` → `no`), do usuário. Não é do Lote 1.
- Lote 1b commitado na `refactor/nucleo` (`e7180d4`).
- **Lote 2 implementado em 10/10/2026, SEM COMMIT**, na branch `lote-2-nucleo-honesto` (saiu de `e7180d4`). O usuário revisa e commita. Detalhes e decisões tomadas na implementação em 6.8.
- Padrão adotado nas respostas da API: o controller converte o documento do Mongo com uma função `toXxxResponse` (arquivo `<modulo>.mapper.ts`): `_id` vira `id`, sem `user`, datas em ISO. Seguir o mesmo padrão nos módulos novos.
- Stack: backend NestJS + MongoDB (Mongoose) + Zod (`nestjs-zod`); frontend React + Vite + TanStack Router + Tailwind 4 + `openapi-fetch` (tipos em `rpg-frontend/src/api/schema.ts`).

### Backend (`rpg-backend/src/modules`)
| Módulo | O que tem hoje |
|---|---|
| `user` | cadastro, login, logout, `GET /user/me` → `{ user, profile, progress, coinBalance }`. Cadastro cria `Progress` + `UserProfile`. |
| `profile` | `GET/PATCH /profile`, `PATCH /profile/nutrition` (calcula metas de calorias/macros). Schema com perfil físico, objetivo, `activityLevel`, `timezone` (padrão `America/Sao_Paulo`), metas. |
| `progress` | nível, XP, `currentStreak`, `bestStreak`, `lastClosedDate`. Serviço: `getOrCreate`, `get`, `addXp`. Sem controller. |
| `economy` | `CoinEntry` (livro-razão), `CoinService` (`add`, `spend`, `balance`, `history`), `GET /coins`. Motivos: `day_close`, `workout`, `steps_goal`, `streak_7`, `ticket`. |
| `activity` | só passos: `POST /activity/steps`, `GET /activity/steps/today`, `GET /activity/steps/recommendation`. `StepLog` tem `source` (`manual`/`health_connect`/`healthkit`). |
| `nutricion` | busca TACO/Open Food Facts, código de barras, `FoodLog`, resumo diário. |
| `workout` | rotinas, `POST /workout/session` (conclui treino, calcula kcal por MET bruto e moedas `round(kcal*0.25)`, XP fixo 200), histórico, progressão por exercício. |
| `energy` | `GET /energy/daily-summary` e `/energy/weekly-budget` com a fórmula **antiga e com bugs** (ver Lote 2). |
| `common` | guards (JWT, roles, rate limit com Redis), filtros, decorators, `utils/user-date.ts` (`toUserDate`, `addDays`, `dayOfWeek`, `resolveTimezone`) com testes. |

### Frontend
Rotas: `/login`, `/` (Hub), `/workouts`, `/nutrition`, `/activity`, `/rewards`, `/profile`. Pelas verificações feitas, **só o login usa a API**; as demais telas usam dados mockados (confirme com grep antes de assumir). O `AGENTS.md` proíbe mocks, então ligar tudo à API é parte do trabalho.

### Fora do produto (já removido, não recriar)
HP, atributos (força/inteligência…), classes de personagem, hábitos genéricos, quests, água, gemas/skins/battle pass (monetização congelada).

---

## 3. Como trabalhar (regras operacionais aprendidas)

**Preferências do usuário**
- Falar em português. Ser objetivo.
- **Quer ver e entender o código antes de aprovar.** mudanças **sem commit**, mostrar o código novo e os diffs, e só commitar/enviar quando ele pedir. Nunca `push` sem pedido.
- Subagentes funcionaram bem para blocos grandes, desde que recebam o escopo exato e devolvam relatório com o código completo dos arquivos novos e diff dos modificados.
- Conferir o que o subagente afirma (git status, tsc) antes de repassar.

**Dois computadores com caminhos diferentes** (`...\ProjetosDoWind\RPG-LIFE` e `...\projetos\RPG-life`). O que liga os dois é o GitHub: sempre `git push` antes de sair de um e `git pull` ao chegar no outro. Arquivos fora do git (`rpg-backend/.env`, `node_modules`) não viajam.

**Ferramentas e armadilhas**
- O shell do computador do usuário (`device_bash`) é um Linux virtual com a pasta montada. Cada chamada é um `bash -c` novo; **corta em 120 s** e processos em segundo plano **morrem** entre chamadas.
- `node_modules` foi instalado no Windows: `jest`, `vite build` e `nest build` completo não rodam direito no Linux. Use **`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json`** no backend (~30–60 s) e **`tsc --noEmit`** no frontend (~11 s). O build completo o usuário roda no Windows. **Testes automatizados (jest) não são exigidos:** a verificação é `tsc` verde + fluxo manual na API.
- NUNCA iniciar o backend aqui: o `rpg-backend/.env` aponta para o banco real do usuário.
- NUNCA rodar `npm run lint` do backend (tem `--fix` e reformata arquivos).
- Quebra de linha: desde o Lote 1b existe `.gitattributes` (`* text=auto eol=lf`), e o `git status` comum já não mostra "modificados" falsos. Muitos arquivos no disco ainda estão em CRLF; por segurança continue usando `git -c core.autocrlf=true ...`. Para leituras use também `git --no-optional-locks`. Nunca `git add -A`/`git add .`; commit sempre com arquivos explícitos. Ao editar arquivo existente, preserve o estilo de quebra de linha dele.
- Git via essa ferramenta pode deixar `.git/index.lock` vazio. Sem permissão de apagar: `mv .git/index.lock .git/stale-index-lock-claude` (somente se nenhum git estiver rodando).
- Banco de desenvolvimento pode ser resetado: **não escrever migrações**.
- Padrão de código: ver `AGENTS.md` (Zod + `createZodDto`, `@ApiOkResponse` com DTO em toda rota, `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, `@CurrentUser('sub')`, datas só via `toUserDate`, moedas só via `CoinService`, zero `any` no frontend).

**Primeira coisa a fazer na conversa nova:** `git -c core.autocrlf=true status`, `git branch --show-current`, `git log --oneline -3`, e confirmar com o usuário a branch de partida.

---

## 4. Decisões

### Todas confirmadas pelo usuário (10/10/2026)

**A regra do jogo:** entrar todo dia, fechar o dia, treinar e bater os passos → juntar moedas e guardar kcal → se as duas metas baterem, a refeição livre está **conquistada**. O cofre diz **quanto** dá para comer; as moedas dizem **se a pessoa mereceu** (medem o esforço físico, que o cofre não vê).

1. **O cofre é semanal e zera no fim do ciclo.** Base: "meta do dia × 7" (permite ciclar carboidrato durante a semana ou ficar bem abaixo e compensar na refeição livre, que é o objetivo). O ciclo **termina no dia da refeição livre agendada** e o cofre zera depois dele. Substitui a ideia antiga de validade de 14 dias por lotes. **Atualizado em 10/10 (usuário):** o ciclo passou a ser a **semana fixa de segunda a domingo**, e o cofre zera na virada para segunda (ver decisão 12).
2. **Comer acima da meta desconta do que já estava guardado** no ciclo (o cofre nunca fica negativo). Não se perde moeda, XP nem sequência. A mensagem é um alerta neutro: "Você passou da meta hoje. Se foi consciente, tudo bem; se não foi, recomendamos um controle maior da próxima vez."
3. **Ticket da refeição livre: 100 moedas** por enquanto (ajustar no teste do Lote 5).
4. **"Comprar" a refeição livre só com as duas metas batidas** (kcal suficientes no cofre **e** 100 moedas). Sem isso:
   - a pessoa continua vendo tudo: saldo do cofre, custo estimado da refeição, quanto falta e a prévia do impacto ("seu cofre tem 1.200 kcal; um rodízio pesado dá ~2.500; você passaria 1.300 kcal da reserva");
   - se comer mesmo assim, registra no diário como qualquer refeição: conta como dia acima da meta (decisão 2), aparece o alerta neutro e **não** entra na galeria de conquistas;
   - nunca há bloqueio de registro nem mensagem de culpa.
5. **Moedas zeram junto com o cofre** no fim do ciclo (na virada para segunda-feira): toda semana é um jogo novo. (Manter moedas entre ciclos pode virar recurso pago no futuro; fora do escopo agora.)
6. **Previsão antes do dia marcado:** se o diário do ciclo está completo até hoje (todos os dias fechados), o app já mostra quanto a pessoa poderá gastar na refeição livre se seguir a meta até lá. Se faltarem dias registrados, ou se ela já tiver extrapolado muito, o app sugere: "recomendamos deixar essa refeição para a próxima semana".
7. **Sexo usado no cálculo:** só `male`/`female` (feito no Lote 1b).
8. **Nível e XP continuam**, como medidor de longo prazo. O XP vem das mesmas ações que dão moedas (fechar o dia, treino, passos, sequência) e **nunca zera** (as moedas zeram a cada ciclo; o nível mostra a evolução de meses). Substitui o XP fixo de 200 por treino.
9. **Sem trava no que entra no cofre:** nem piso (TMB) nem teto (25%). Tudo o que sobra da meta num dia fechado vai para o cofre. Decisão do usuário: o app não controla quanto a pessoa come; ela é responsável pelas próprias escolhas.
10. **Nome do produto:** continua em aberto; não bloqueia nada.
11. **Rotina fora da academia + treino real somado no dia (opção A).** O perfil pergunta "como é sua rotina fora da academia?" com 3 opções: `sedentary` (trabalho sentado, 1,2) / `light` (em pé ou andando parte do dia, 1,375) / `moderate` (trabalho físico, 1,55). O treino e os passos entram na meta só nos dias em que acontecem (fórmula 6.2), para não serem contados duas vezes. O nível de treino da pessoa aparece pelo histórico (frequência, carga, XP), não por uma resposta do perfil.
12. **Ciclo = semana fixa de segunda a domingo** (decisão do usuário em 10/10, "por enquanto"; substitui o "no máximo 7 dias terminando na refeição livre"). Na virada para segunda, cofre e moedas zeram e começa a semana nova. A refeição livre é agendada dentro da semana (até domingo) e não muda o fim do ciclo. Depois da refeição livre, o que sobrar no cofre continua lá e **só zera no fim do domingo**, junto com as moedas (confirmado pelo usuário em 10/10).
13. (ver 9: sem teto)
14. **Refeição livre "do dia" (ideia do usuário, 10/10):** além da refeição livre da semana (paga com o cofre), uma versão no escopo do dia, paga só com as kcal que sobram da meta de hoje. **Custo confirmado:** ticket igual às moedas de um dia completo no app (fechar o dia +10, treino +20, passos +10 = **40 moedas**). **Conta como conquista** (confirmado; entra na galeria como "refeição livre do dia"). Convive com a da semana no mesmo ciclo; o ticket de 40 sai do mesmo saldo de moedas da semana (confirmar no Lote 3).

---

## 5. Lote 1b — fechamento da fase 0 (pequeno, fazer primeiro)

- [x] `npm i -D @types/react-dom` no frontend (zera o único erro de lint conhecido).
- [x] Adicionar `.gitattributes` na raiz (`* text=auto eol=lf`) para acabar com o ruído de CRLF entre Windows e Linux (conversar com o usuário antes: afeta os dois computadores).
- [x] Regenerar `rpg-frontend/src/api/schema.ts` com a API real: `npx openapi-typescript http://localhost:4000/api/json -o src/api/schema.ts` (backend rodando na máquina do usuário). Comparar com a versão editada à mão.
- [x] No Windows do usuário: `npm run build` nos dois projetos e `npx jest` no backend (existe `user-date.spec.ts` com 11 testes).
- [x] DTO de resposta tipado + `@ApiOkResponse` + `@ApiBearerAuth()` nas rotas de `workout`, `nutricion` e `profile` (hoje faltam; o AGENTS.md exige).
- [x] Atualizar a skill `.agents/skills/rpg-frontend-architecture/SKILL.md` (ainda descreve HP, quests, hábitos) e o diagrama em `rpg-life-ui-engine`.
- [x] `profile.tsx`: tipar `handleSaveBiometrics` (hoje `data: any`), corrigir título "Ficha do Caçador".
- [x] `CaloricVault.tsx`: classe CSS com erro de digitação (`text-esmerald-400`) e desestruturação vazia.

---

## 6. Lote 2 — Núcleo honesto (backend; sem telas novas)

Objetivo: o cofre e as moedas passam a refletir esforço real, e o ciclo "fechar o dia → guardar kcal → ganhar moedas" funciona ponta a ponta na API.

### 6.1 Bugs da conta atual (`energy.service.ts`) a eliminar
1. **Déficit vira comida:** o resumo diário usa 80% do TDEE, mas o orçamento semanal usa o TDEE cheio → o déficit planejado é contado como "economia".
2. **Não registrar = economizar:** dia sem `FoodLog` gera `savedCalories = TDEE inteiro`.
3. **Dupla contagem:** o multiplicador de atividade (1,55) já embute exercício e ainda soma kcal de treino e passos. O MET do treino é bruto (inclui o basal).
4. **Fuso:** já corrigido no Lote 1 (usar sempre `toUserDate`).
5. O `WeeklyBudgetResponseSchema` já não bate com o que o serviço devolve (`weekRange`/`tdee` vs `weeklyTdeeTarget`) — some junto com o endpoint antigo.

### 6.2 Fórmula nova
```
TMB          = Mifflin-St Jeor (como hoje)
Base do dia  = TMB × multiplicador de ROTINA SEM TREINO (1,2 / 1,375 / 1,55)
Ativo líquido= treino + passos
   treino    = (MET − 1) × peso(kg) × horas
   passos    = max(0, passos − 4.000) × 0,04 × (peso / 70)
Meta do dia  = (Base + Ativo) × (1 − déficit%)    // perder 20% · manter 0% · ganhar −10% (superávit)
Guardado     = dia FECHADO ? max(0, Meta − Consumido) : 0          // sem piso nem teto (decisão 9)
Excedente    = Consumido > Meta ? débito no cofre de (Consumido − Meta), limitado ao saldo do ciclo : 0
```
- O excedente gera o alerta neutro da decisão 2 (sem perder moeda, XP nem sequência).
- Onboarding/perfil passa a perguntar a rotina **sem contar treino**; ajustar textos e o enum (decisão 11).
- Calcular tudo no fuso do usuário. Funções puras e testáveis (separar a matemática do acesso ao banco).
- [x] **`PATCH /profile/nutrition` quebrava** (feito antes do lote, em `refactor/nucleo`): o sexo virou o enum `BiologicalSex` só com `male`/`female` ("sexo usado no cálculo", não identidade de gênero; se um dia perguntar gênero, é outro campo fora da conta). `other` saiu da API. Perfil incompleto agora devolve 400 com a lista dos campos que faltam; um `other` antigo no banco conta como não preenchido.
- [x] **`primaryAttribute` removido do treino** (feito antes do lote): saiu do DTO, do schema do Mongo, do DTO de resposta e do mapper. O frontend não usava.

### 6.3 Modelos e endpoints
- **`DayClose`** `{ user, date, targetKcal, consumedKcal, activeKcal, savedKcal, overflowKcal, closedAt }`, índice único `(user, date)`.
- **`Cycle`** `{ user, startDate (segunda), endDate (domingo), freeMeal?, status: 'open'|'closed', closedAt? }`, no máximo 1 ciclo `open` por usuário. É sempre a semana de segunda a domingo que contém o dia (decisão 12). Fecha quando o domingo termina (no fuso do usuário), verificado de forma preguiçosa na próxima requisição do usuário (sem cron).
- **`VaultEntry`** `{ user, cycle, date, kcal (+ depósito / − débito), type: 'day_close'|'overflow'|'redeem'|'cycle_reset', refId? }`. Saldo = soma das entradas do ciclo aberto, nunca negativo. Ao fechar o ciclo, grava `cycle_reset` zerando o que sobrou (o extrato mostra o que se perdeu).
- `POST /day/close` `{ date? }`: só aceita **hoje ou ontem** (no fuso do usuário). **Idempotente:** fechar duas vezes devolve o fechamento existente sem pagar de novo. Sem `FoodLog` no dia, fecha mas não guarda kcal, não dá moedas e quebra a sequência. Calcula a meta, grava `DayClose`, deposita/debita no cofre, paga moedas, atualiza a sequência.
- `GET /day/:date`: estado do dia (aberto/fechado, meta, consumido, previsão do que seria guardado).
- `GET /vault`: saldo do ciclo atual, datas do ciclo (início, fim, dias restantes) e extrato.
- Remover `GET /energy/weekly-budget` e a lógica antiga; `GET /energy/daily-summary` passa a usar a fórmula nova (ou ser absorvido por `/day/:date`; decidir ao implementar e manter um só).

### 6.4 Moedas (substitui as fórmulas provisórias `kcal×0,25` e `passos×0,01`)
| Ação | Moedas | Regra |
|---|---|---|
| Fechar o dia | +10 | só 1× por dia, com ≥1 `FoodLog` |
| Treino concluído | +20 | só o 1º treino do dia |
| Meta de passos batida | +10 | só 1× por dia; por enquanto vale qualquer `source`, inclusive `manual` (restrição só no Lote 4) |
| 7 dias fechados seguidos | +50 | a cada múltiplo de 7 na sequência |
| Ticket de refeição livre | −100 | na compra da refeição livre (Lote 3) |
| Fim do ciclo | −saldo | zera as moedas que sobraram (`CoinReason.CYCLE_RESET`, decisão 5) |

O saldo continua sendo a soma do livro-razão (regra do `AGENTS.md`); o zeramento é uma entrada negativa, nunca um campo de saldo. Todas as entradas com `refId` (data ou id) e **idempotência**: a mesma ação no mesmo dia não paga duas vezes (índice único parcial ou checagem por `reason + refId`).

### 6.5 Anti-fraude dos passos — ADIADO para o Lote 4
Decisão do usuário (10/10/2026): só faz sentido quando o app ler os passos direto do celular (Health Connect / HealthKit). Até lá, passo digitado à mão rende moeda normalmente. Ver Lote 4.

### 6.6 Sequência (`progress`)
- Ao fechar o dia D: se `lastClosedDate` = D−1 → `currentStreak + 1`; se = D → nada; senão → 1. Atualizar `bestStreak`. Gravar `lastClosedDate = D`.
- Fechar "ontem" tardiamente pode reconstituir a sequência, mas não pode fechar dois dias de uma vez.
- Dia fechado sem refeição registrada não conta e quebra a sequência (decisão do usuário, 10/10).

### 6.7 Pronto quando
`tsc --noEmit` do backend verde; fluxo manual na API: registrar comida → fechar o dia → ver `/vault` e `/coins` → fechar de novo sem pagar em dobro.

### 6.8 Implementado (10/10/2026) — o que ficou e o que foi decidido no caminho
- **Arquivos novos:** `energy/energy-math.ts` (fórmula 6.2, funções puras), `vault/` (`Cycle`, `VaultEntry`, `cycle-math.ts`, `VaultService`, `GET /vault`), `day/` (`DayClose`, `day-rules.ts`, `DayService`, `POST /day/close`, `GET /day/:date`), `progress/streak.ts`, `economy/rewards.ts` (tabela de moedas e XP), `economy/reward.service.ts`, `profile/nutrition-input.ts`, `common/utils/mongo-errors.ts`. Também foram escritos 7 arquivos `.spec.ts` (54 testes passando), mas testes jest deixaram de ser exigência do plano.
- **Removidos:** `GET /energy/daily-summary` e `GET /energy/weekly-budget` (o `EnergyService` ficou sem controller e só calcula o dia para o `DayService`). O front ainda chama esses dois em `services/dashboard.service.ts`; trocar no Lote 3 ao regenerar o `schema.ts`.
- **Rotina fora da academia:** `ActivityLevel` agora só tem `sedentary`/`light`/`moderate` (decisão 11). As metas do `PATCH /profile/nutrition` usam a mesma fórmula do fechamento (num dia sem treino). O `PhysicalProfileForm` do front ainda oferece 5 níveis: ajustar no Lote 3.
- **Fechar o dia sem refeição registrada é permitido** (decisão do usuário): o dia fecha, mas não guarda kcal, não rende moedas nem XP e **quebra a sequência** (conta como dia não fechado para a sequência). A resposta traz um `notice` explicando. O `DayClose` guarda `foodLogsCount` para isso.
- **Ciclo = semana fixa de segunda a domingo** (decisão 12, atualizada). O fechamento continua preguiçoso: a semana nova é aberta na primeira requisição depois do domingo.
- **Dia de uma semana já encerrada** (ex.: na segunda, fechar o domingo como "ontem"; confirmado pelo usuário): fecha e conta para a sequência, mas não mexe no cofre nem rende moedas/XP (as moedas daquele ciclo já foram zeradas). O mesmo vale para treino e passos registrados nessa data. A resposta traz um `notice` explicando.
- **XP = 5× as moedas** (fechar 50, treino 100, passos 50, sequência de 7 = 250). Aprovado pelo usuário; ajustar com o tempo em `economy/rewards.ts`.
- **Meta de passos** = a recomendação por rotina (`sedentary` 6.000 / `light` 8.000 / `moderate` 10.000). Aprovado pelo usuário.
- **Idempotência:** índices únicos em `coin_entries (user, reason, refId)`, `vault_entries (user, type, refId)`, `day_closes (user, date)` e no máximo 1 `cycles` aberto por usuário. Se o banco de desenvolvimento tiver moedas antigas duplicadas com o mesmo `refId`, o índice não sobe: resetar o banco.
- **Jest:** adicionado `moduleNameMapper` para os imports `src/...` (sem isso, specs que importam schemas não rodavam).
- Verificado na nuvem com MongoDB real: fluxo registrar → treino → passos → fechar → fechar de novo → `/vault` → `/coins`, bônus de 7 dias, excedente com cofre vazio, dia fechado vazio quebrando a sequência, virada de semana zerando cofre e moedas, e requisições simultâneas abrindo um só ciclo.

---

## 7. Lote 3 — Refeição livre (backend + telas ligadas à API)

### 7.1 Catálogo do montador
- **`FreeMealTemplate`** (global): `{ slug, name, category, icon, items: [{ key, name, unit, kcalPerUnit, defaultQty, source }], presets: { light, medium, heavy } }`.
- Seed de **30 a 50 refeições típicas** (rodízio de sushi, pizza, hambúrguer artesanal, açaí, churrascaria, feijoada, fast-food…). Script idempotente (upsert por `slug`), por exemplo `npm run seed:free-meals`.
- **Fonte por item, obrigatória.** Usar: USDA FoodData Central (domínio público, uso comercial livre), tabelas nutricionais publicadas pelas redes, TACO (conferir termos). **TBCA (USP) é CC BY-NC-ND: uso comercial exige autorização dos coordenadores — não usar sem isso.** Ao montar o catálogo, registrar a fonte e a data de consulta de cada número.
- Nenhuma API entrega "kcal de um rodízio"; o catálogo é curado uma vez. Presets leve/média/pesada são atalhos; com o tempo recalibrar com o `actualKcal` dos usuários.

### 7.2 `FreeMeal` (a refeição agendada)
`{ user, template?, title, scheduledFor, plannedItems[], estimatedKcal, actualItems?[], actualKcal?, ticketCost, status: 'planned'|'ready'|'redeemed'|'cancelled', photoUrl?, redeemedAt? }`. Os itens são **copiados** (snapshot) para o histórico não mudar se o catálogo for recalibrado.

Endpoints: `GET /free-meal-templates`, `POST /free-meals`, `GET /free-meals/next`, `POST /free-meals/:id/redeem`, `DELETE /free-meals/:id`.
- `POST /free-meals` agenda a refeição **dentro do ciclo aberto** (até domingo). Não muda o fim do ciclo (decisão 12).
- `GET /free-meals/next` (listas, ver 7.5) devolve, por refeição ativa: refeição, saldo do cofre, saldo de moedas, `neededKcal`, `neededCoins`, `daysLeft`, **`perDayKcal`** (quanto guardar por dia até lá), **`projectedKcal`** (quanto terá no dia se seguir a meta até lá; só quando todos os dias do ciclo até ontem estão fechados), `canBuy` (as duas metas batidas) e `recommendPostpone` + motivo (dias sem registro no ciclo, ou previsão muito abaixo do estimado da refeição; limiar a definir ao implementar, sugestão: previsão < 50% do estimado).
- **Comprar/resgatar** (`POST /free-meals/:id/redeem`): só com `canBuy` (decisão 4); senão 400 com o que falta em kcal e moedas. Debita kcal do cofre (`VaultEntry` tipo `redeem`) e o ticket (`CoinReason.TICKET`); aceita `actualItems`; entra na galeria de conquistas. Se `actualKcal` < estimado, a sobra volta ao cofre (até o ciclo fechar). Sem `canBuy`, a pessoa registra o que comeu no diário normal (`POST /nutrition/log`): vira dia acima da meta, com o alerta neutro, e não conta como conquista.
- **Refeição livre do dia** (decisão 14): campo `scope: 'week'|'day'` no `FreeMeal`. A do dia usa só a sobra da meta de hoje (`Meta − Consumido até agora`), não mexe no cofre e custa **40 moedas** (`CoinReason.TICKET_DAY`); só pode ser comprada com sobra suficiente e 40 moedas; entra na galeria como "refeição livre do dia". Pode coexistir com a da semana no mesmo ciclo.
- **Atomicidade:** hoje `CoinService.spend` não é atômico (checa saldo e grava separado). O resgate toca em duas contas (kcal e moedas). Opções: transação do MongoDB (exige replica set; o `docker-compose.yml` sobe Mongo standalone) ou idempotência por `refId` com índice único. Decidir no início do lote e testar duas chamadas simultâneas.

### 7.3 Telas (zero mock, `openapi-fetch`, sem `any`)
- **Hub (`/`)**: a próxima refeição livre domina a tela ("Rodízio sábado — guarde 360 kcal/dia, faltam 3 dias"), saldo de cofre e moedas, meta do dia, botão **Fechar o dia**.
- **Refeições livres (`/rewards`)**: catálogo, montador com contadores +/− e atalhos leve/média/pesada, item avulso e refeição personalizada, agendar, prévia do impacto no cofre, comprar/resgatar só com as duas metas batidas (botão mostra o que falta quando travado), registro do que comeu de fato e foto opcional, galeria de conquistas, sugestão de adiar para a próxima semana quando for o caso.
- **Treino**: mostrar a carga da última vez por exercício (usar `GET /workout/progression/:exerciseName`) e trocar a recompensa mockada pela tabela real.
- **Perfil**: registro de peso ao longo do tempo (`WeightLog`, `POST/GET /weight`), extratos de cofre e moedas, escolha de fuso.
  - `PhysicalProfileForm` (antes `BiometricsForm`): os valores já foram alinhados com a API (`male`/`female`, rótulo "Sexo usado no cálculo" com explicação, níveis `sedentary`…`very_intense`, sem casts). **Falta:** ao ligar à API, trocar a interface `PhysicalProfileData` escrita à mão pelo tipo de `components['schemas']['UpdateProfileDto']` do `schema.ts` regenerado, e reduzir os níveis se a decisão 11 for aprovada.
- **Dieta**: macros do dia e cadastrar alimento próprio.

### 7.4 Pronto quando
Fluxo completo no app: agendar rodízio → fechar dias → ver a barra encher → resgatar → registrar o que comeu → ver na galeria. Nenhuma tela com dado mockado.

### 7.5 Lote 3a implementado (10/10/2026) — decisões
Branch `lote-3a-refeicao-livre` (saiu da `main` em `9c15be5`), **sem commit**. Só backend; as telas ficam para o 3b.
- **Arquivos novos** em `rpg-backend/src/modules/free-meal/`: `FreeMealTemplate` (catálogo global, `slug` único), `FreeMeal`, item snapshot (`free-meal-item.schema.ts`), `free-meal-math.ts` (regras puras), `FreeMealService`, controllers, DTOs Zod, mapper `toFreeMealResponse`/`toFreeMealTemplateResponse`, `seed/free-meal-catalog.ts` (dados) e `seed/seed-free-meals.ts`.
- **Endpoints:** `GET /free-meal-templates`, `POST /free-meals`, `GET /free-meals/next` (listas `week` e `day` + `totals`; ver abaixo), `GET /free-meals` (galeria = resgatadas, mais recentes primeiro), `POST /free-meals/:id/redeem`, `DELETE /free-meals/:id`.
- **Catálogo:** 15 refeições (meta do plano era 30 a 50; o resto fica para depois), com kcal de **USDA FoodData Central (FNDDS 2021-2023)** e **TACO 4ª ed.**; cada item guarda fonte, URL, data de consulta e como o número foi calculado (kcal/100 g × porção). TBCA não usada. Itens da TACO usam a unidade "100 g" (a TACO não publica peso de porção). Equivalências (ex.: calabresa ≈ pepperoni, torresmo ≈ toucinho frito) ficam em `note`. Seed idempotente por `slug`: `npm run seed:free-meals` (`-- --dry-run` só valida, sem banco).
- **Itens são snapshot** (nome, unidade, kcal por unidade, quantidade, origem). Item avulso: `custom` (kcal digitada) ou da busca do `nutricion` (`taco`/`open_food_facts`, com `refId`). Sem template: refeição totalmente personalizada.
- **Sem foto** neste lote (fica para depois, com bucket Cloudflare).
- **Agendamento sem limite de vagas (decisão do usuário):** dentro do ciclo aberto (hoje até domingo); `day` só para hoje. Pode agendar **várias `week` no mesmo ciclo e várias `day` no mesmo dia**. Agendar só **planeja**: nada é cobrado nem reservado até o resgate; quem decide é o saldo no momento do resgate. Não existe mais vaga por escopo (`slotKey`, índice único e 409 saíram) nem `Cycle.freeMeal` (campo e `hasFreeMeal` da resposta de `/vault` removidos). **Limite de sanidade:** no máximo `MAX_ACTIVE_FREE_MEALS_PER_SCOPE = 10` refeições ativas (planned/ready) por escopo e usuário (400 com mensagem clara; em `free-meal-math.ts`).
- **Ticket:** semana 100 moedas (`ticket`), dia 40 (`ticket_day`), os dois do **mesmo saldo de moedas da semana**; tabela em `economy/rewards.ts` (`FREE_MEAL_TICKETS`).
- **`GET /free-meals/next` com listas:** `{ today, cycle, vaultBalanceKcal, coinBalance, week: Plan[], day: Plan[], totals }`. Cada lista é ordenada por `scheduledFor` e, em empate, por criação; **a primeira de cada lista domina o Hub**. Cada Plan tem `ready`/`canBuy` próprios, calculados **individualmente contra o saldo atual** (se o cofre cobre cada uma sozinha mas não todas juntas, todas aparecem prontas; depois do resgate de uma, as outras são recalculadas na próxima leitura). `totals.week|day = { count, totalEstimatedKcal, totalNeededKcal, totalNeededCoins }`: `totalNeededKcal = max(0, soma dos estimados − kcal disponíveis)` (semana: cofre; dia: sobra de hoje já descontada) e `totalNeededCoins = max(0, soma dos tickets − saldo de moedas)`, por escopo (as moedas são o mesmo saldo para os dois).
- **Acumulado:** para `perDayKcal`, `projectedKcal` e `recommendPostpone`, a 1ª da lista segue como antes; as seguintes usam o **acumulado** = estimado dela + estimados das anteriores (na ordem da lista) contra o cofre: `accumulatedNeededKcal = max(0, acumulado − cofre)`, `perDayKcal = ceil(accumulatedNeededKcal / daysLeft)` (`daysLeft` próprio da data dela), `projectedKcal` é comparada ao acumulado (< 50% recomenda adiar) e a recomendação por dias sem registro continua. O Plan traz `accumulatedEstimatedKcal` e `accumulatedNeededKcal`; `neededKcal`/`ready`/`canBuy` continuam individuais.
- **Várias `day` dividem a mesma sobra:** `availableKcal = max(0, (Meta − Consumido de hoje) − soma(min(actualKcal ?? estimatedKcal, estimatedKcal) das `day` já resgatadas hoje))`. Vale para `ready`/`canBuy`, para `/next` (e `totals.day`) e para a validação do resgate da `day`. As `day` ainda não resgatadas são avaliadas individualmente contra esse valor. "Hoje" = dia do usuário (`toUserDate`); como a `day` só é agendada para hoje e expira se o dia passa, uso `scheduledFor = hoje` + `redeemed`.
- **`ready` por kcal:** semana fica `ready` quando o saldo do cofre ≥ estimado (mesmo antes do dia); dia, quando a sobra de hoje (Meta − Consumido) ≥ estimado. Calculado de forma preguiçosa ao ler/resgatar (pode voltar a `planned` se o saldo cair). **`canBuy` = ready e moedas ≥ ticket**; o resgate vale a partir daí, sem esperar a data. Sem `canBuy`: 400 com `details: { missingKcal, missingCoins }` (o `AllExceptionsFilter` passou a repassar `details`).
- **Comer menos:** o cofre só debita o que foi comido; a sobra fica até o ciclo fechar. **Comer mais:** nada extra é debitado; só registra e devolve `exceededKcal` (decisão do usuário: "apenas mostrar"). Sem perder moeda, XP ou sequência.
- A refeição livre resgatada **não entra no consumo do dia** (`FoodLog`): é outro modelo, o `EnergyService` não a lê.
- **Previsão (`projectedKcal`):** só com todos os dias do ciclo até ontem fechados (com refeição registrada): saldo + média do que cada dia fechado rendeu ao cofre × dias até a véspera da refeição. Na segunda (nenhum dia fechado ainda) fica `null`. **`recommendPostpone`**: dias sem registro/fechamento no ciclo, ou previsão < 50% do estimado (nunca quando já está pronta).
- **Fim do ciclo / do dia:** refeição não resgatada de um ciclo encerrado (semana) ou de um dia que passou (dia) vira `cancelled` com `cancelReason: 'expired'`, de forma preguiçosa (sem cron).
- **Atomicidade sem transação** (Mongo local standalone): 1) revalida `canBuy`; 2) troca o status para `redeemed` com `findOneAndUpdate` condicional (só uma chamada vence); 3) débitos idempotentes com `refId = id da refeição` (`CoinService.addOnce` e `VaultService.debitRedeem`, índices únicos já existentes). Se cair entre 2 e 3, chamar o resgate de novo completa o que faltou sem cobrar em dobro (se o ciclo já tiver fechado, não cobra no ciclo novo). O resgate revalida `canBuy` contra o saldo atual (ledger já desconta as outras resgatadas; `day`, ver acima). Limite conhecido: resgatar **duas refeições diferentes** EXATAMENTE ao mesmo tempo pode deixar o saldo de moedas negativo (e o cofre abaixo do estimado). **Atlas (produção)** tem replica set: lá dá para envolver o resgate numa transação.
- `CoinService.spend` (não atômico) não é usado pelo resgate; o comentário foi atualizado.

---

## 8. Lote 4 — Atrito zero

- **Anti-fraude dos passos** (veio do Lote 2): quando a leitura automática estiver pronta, passo digitado à mão (`source: manual`) passa a valer só como registro, sem moeda; moeda de passos só com `health_connect`/`healthkit`; teto plausível por dia (sugestão: 60.000), rejeitando ou limitando acima disso.
- **Passos automáticos:** envolver o frontend em **Capacitor**. Android primeiro (Health Connect); iOS (HealthKit) depois, exige Mac. O backend **não** consulta API nenhuma: o app lê no celular e envia `POST /activity/steps` com `source`. Google Fit está descontinuado, não usar. Avaliar plugins de Health Connect para Capacitor verificando se estão mantidos. Estratégia: ao abrir o app e em sincronização periódica, ler o total dos últimos 7 dias e enviar (o backend já é idempotente por dia).
- **Registro rápido de comida:** `GET /nutrition/recent`, favoritos (`FavoriteFood`), `POST /nutrition/repeat` (repetir refeição de ontem), alimento próprio (`CustomFood`), leitor de código de barras no app.
- **Onboarding em ≤ 2 minutos:** peso, altura, idade, sexo, rotina sem treino, objetivo, fuso → termina em "agende sua primeira refeição livre".
- **Privacidade (LGPD):** são dados de saúde. Consentimento explícito no cadastro, política de privacidade, exportar e excluir conta.

---

## 9. Lote 5 — Teste real (4 semanas, 10 a 20 pessoas da academia)

- Distribuir o app (APK / teste interno do Android).
- Instrumentar eventos mínimos: dia fechado, refeição agendada, refeição resgatada, retenção semanal.
- Métricas de sucesso: **≥ 5 dias fechados por semana** por usuário ativo · **≥ 1 refeição livre resgatada** · **retenção na semana 4**.
- Perguntas a responder: a refeição agendada motiva mais do que um saldo genérico? O registro de comida é rápido o bastante? O ticket de 100 moedas está no ponto certo?

---

## 10. Depois do teste (só se validar)

Card compartilhável pós-resgate ("Conquistei essa pizza: 3 treinos, 48 mil passos, 1.600 kcal guardadas") · modo grupo (amigos guardando para o mesmo rodízio) · conquistas de longo prazo (metas escolhidas pelo usuário, recompensa definida pelo sistema e conferida por dados reais) · gráfico de evolução de carga · meta calórica adaptativa pela tendência de peso (PRO) · foto com IA (PRO) · canal com nutricionistas e personais · monetização (assinatura PRO; passe de temporada e cosméticos só se o núcleo provar retenção).

Referência de mercado: o WeightWatchers já usa "rollover" (até 4 pontos/dia não usados vão para um saldo semanal), o que valida guardar-para-gastar-depois. Não achei produto que combine refeição livre agendada + cofre de kcal + treino; o teste do Lote 5 é o que prova se o ângulo funciona.

---

## 11. Cuidado de bem-estar (vale para todos os lotes)

"Ganhar comida com exercício" pode reforçar comportamento compensatório. Tratar como dieta flexível, nunca como punição: sem perder moeda, XP ou sequência por comer acima da meta; linguagem neutra no excedente ("ajuste do dia"). Por decisão do usuário (decisão 9) o cofre não tem piso nem teto: o app não controla quanto a pessoa come. Ainda assim, nenhum texto de interface deve incentivar jejum ou comer muito pouco. Revisar textos de interface com isso em mente.

---

## 12. Ordem sugerida e dependências

`1b` → `2` → `3` → `4` → `5`.
- O Lote 3 depende do 2 (cofre, moedas, fechamento do dia).
- O Lote 4 só faz sentido depois do 3 (senão não há o que ligar aos passos).
- Cada lote em branch própria a partir da anterior (`refactor/nucleo` → `lote-2-nucleo-honesto` → …), sem commit até o usuário revisar.
