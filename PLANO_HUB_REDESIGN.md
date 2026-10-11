# Plano — Redesign da tela Hub (`/`)

> Escopo: só **apresentação** do Hub (`rpg-frontend/src/routes/index.tsx` e `src/components/dashboard/*`).
> Não mexer em backend, services, hooks, tipos nem `schema.ts`. Seguir o `AGENTS.md` (zero `any`/`unknown`, `npm run lint` no fim).
> A tela de Treino vem depois e reaproveita os tokens e componentes criados aqui.

---

## 1. Diagnóstico (a partir do print atual)

1. **O botão mais chamativo da tela é a ação errada.** "Fechar o dia" é o único botão dourado e preenchido, com brilho. Logo abaixo, o próprio app avisa que fechar sem refeições "não guarda kcal, não rende moedas e interrompe a sequência". A tela empurra o usuário para a ação que o prejudica.
2. **Dourado em tudo, então nada se destaca.** Moedas, selo da refeição livre, botão "Refeições livres", "Fechar o dia", texto de orientação, borda do card principal: tudo âmbar. Dourado deveria significar uma coisa só (moeda/recompensa).
3. **Informação repetida.** "2.150 kcal" aparece 3 vezes no card da refeição (canto, frase de orientação e um chip que parece botão, mas não faz nada). "2.978" aparece 2 vezes em "Meta de hoje". O cofre aparece no card da refeição ("Cofre 0/2.150") e de novo num card próprio.
4. **"Cofre da semana" é um card enorme para um número só** ("0 kcal"), quase todo vazio, com cor própria (ciano) que não aparece em nenhum outro lugar.
5. **Não existe "próximo passo".** Com 0 refeições registradas, o Hub não diz "registre sua primeira refeição". Ele sugere fechar o dia.
6. **Pouco jogo no visual de jogo.** Tem "NVL 1", mas sem barra de XP, sequência nem sensação de progresso. As barras são linhas de 1,5px vazias.
7. **Tipografia sem regra.** Mono e sans misturados ao acaso, muitos rótulos de 10–11px em CAIXA ALTA espaçada. Quando tudo é rótulo, nada é título.
8. **No desktop o Hub abre em `max-w-4xl` com grid de 2 colunas**, enquanto a navegação é uma barra de celular (`max-w-md`). Parecem dois apps diferentes.

---

## 2. Hierarquia nova (proposta)

Ordem de cima para baixo, em **uma coluna** (`max-w-md` em todas as larguras, alinhada com a BottomNav):

| # | Bloco | Pergunta que responde | Substitui |
|---|---|---|---|
| 1 | **PlayerBar** (barra de status do personagem) | "Quem sou eu e quanto tenho?" | `UserHUD` |
| 2 | **TodayCard** (Hoje) | "O que faço agora?" | `EnergyBalance` + `CloseDayPanel` |
| 3 | **QuestCard** (Missão: refeição livre) | "Quanto falta para a recompensa?" | `NextFreeMealHero` + `CaloricVault` |

Quando o perfil está incompleto (`day === null`), o `ProfileIncompleteCard` ocupa o lugar do TodayCard e vira o card com a ação principal.

### Regra de ouro: **um único botão primário por tela**, e ele depende do estado do dia

| Estado (`day`) | Botão primário do TodayCard | Secundário |
|---|---|---|
| `status === 'closed'` | nenhum: mostra "Dia fechado ✓" e o resumo de recompensas | — |
| `foodLogsCount === 0` | **Registrar refeição** → `/nutrition` | "Fechar o dia mesmo assim" como link discreto (texto), mantendo o aviso |
| `foodLogsCount > 0 && canClose` | **Fechar o dia** | "Registrar refeição" (secundário) |
| `!canClose` | **Registrar refeição** | motivo do bloqueio (`closeBlockedReason`) em texto pequeno |

Manter toda a lógica atual do `CloseDayPanel` (`dayService.closeDay`, `onClosed`, exibição de `result`, erro). Só muda onde e como aparece.

---

## 3. Sistema de cores (tokens): uma cor, um significado

Definir em `src/index.css` com `@theme` (Tailwind v4), para o Treino reutilizar depois:

| Token | Significado | Sugestão |
|---|---|---|
| `--color-bg` / `--color-surface` / `--color-raised` | fundo, card, elemento dentro do card | `#08090a` / `#0f1115` / `#161a20` |
| `--color-line` | bordas | `#262a31` |
| `--color-action` | **o** botão primário e o foco | verde "go", ex. `#4ade80` (texto preto) |
| `--color-coin` | **somente** moedas, ticket, recompensas | âmbar `#fbbf24` |
| `--color-kcal` | calorias, cofre, energia | azul `#38bdf8` |
| `--color-xp` | nível, XP, sequência | violeta `#a78bfa` |
| `--color-danger` | **somente** erro/alerta real | rosa `#fb7185` |
| texto | primário / secundário / apagado | `zinc-100` / `zinc-400` / `zinc-500` |

Regras:
- Âmbar fora de moeda/recompensa é proibido no Hub.
- Avisos que são conselho (ex.: "6 dias sem registro") ficam **neutros**, com ícone de info. Rosa só para erro.
- Sem gradientes nem blobs com blur. A cara de jogo vem da forma (item 4), não de brilho.

---

## 4. Linguagem visual "jogo 2D" (contida)

- **Barras segmentadas** (blocos tipo barra de HP/XP) em vez de linhas finas: altura de 10–12px, 10 a 20 segmentos, segmento cheio na cor do token e vazio em `--color-raised`. Componente único `SegmentedBar`.
- **Cards "chunky":** borda de 2px em `--color-line`, cantos `rounded-lg` (não `2xl`) e sombra dura deslocada (`shadow-[0_4px_0_0_#000]`, sem blur). O botão primário também ganha sombra dura e "afunda" no `:active` (`translate-y-[2px]` + shadow menor).
- **Tipografia:**
  - Uma fonte pixel **só para números grandes e o selo de nível**, ex. *Pixelify Sans* ou *Silkscreen* (Google Fonts no `index.html` ou `@fontsource`). Se ficar estranho, cair para a sans com `tabular-nums`.
  - Corpo de texto em uma sans só (a atual do Tailwind serve). **Remover `font-mono`** de rótulos e frases. Mono só se for número tabular.
  - CAIXA ALTA espaçada só nos rótulos de seção (no máximo um por card).
  - Tamanho mínimo de texto: 12px. Números principais: 32–40px.

---

## 5. Especificação de cada bloco

### 5.1 `PlayerBar` (novo, substitui `UserHUD`)
- Uma faixa compacta, não um card alto: avatar (inicial) + nome + selo `NV 1` (cor `xp`).
- Logo abaixo do nome, barra segmentada de XP **se** `GetMeResponseDto` tiver XP atual/próximo nível. **Se não tiver, não inventar:** mostrar só o nível e anotar como follow-up de backend.
- À direita: sequência (🔥 + número, cor `xp`) se existir no `me`, e **moedas** com ícone e número na fonte pixel (cor `coin`).
- Remover o botão "Refeições livres" (a Loja já está na BottomNav).
- Objetivo ("Manutenção • Equilíbrio") e peso saem do Hub, já que estão no Perfil. No máximo, uma linha pequena `zinc-500`.

### 5.2 `TodayCard` (novo, substitui `EnergyBalance` + `CloseDayPanel`)
- Rótulo: `HOJE`.
- Número grande: **kcal restantes** (cor `kcal`, fonte pixel) + legenda "kcal restantes".
- Barra segmentada consumido/meta (cor `kcal`).
- Uma linha pequena com a composição da meta: `Meta 2.978 = base 2.978 + treino 0 + passos 0` (tirar os 3 cartõezinhos).
- Linha de "prévia do cofre": `Sobra prevista para o cofre: 0 kcal`.
- Ações conforme a tabela da seção 2. Resultado do fechamento (moedas, XP, sequência, subiu de nível) aparece dentro do card, em destaque, como "recompensa recebida": é o momento mais gamificado do app.
- Remover a meta repetida no cabeçalho (o "2.978 kcal" ciano).

### 5.3 `QuestCard` (novo, substitui `NextFreeMealHero` + `CaloricVault`)
- Rótulo: `MISSÃO` + data (`dom., 11/10` ou "hoje").
- Título: nome da refeição (`meal.title`) + `~2.150 kcal` em texto secundário, mostrado uma vez só.
- **Uma frase de status em linguagem humana** (reescrever a `guideline`):
  - com `perDayKcal`: "Guarde 300 kcal por dia nos próximos 5 dias."
  - já coberto: "Cofre cheio! Só falta resgatar." (se as moedas também baterem)
  - sem dias e faltando: "É hoje e o cofre ainda não cobre: faltam 2.150 kcal."
  - escopo dia: "Paga com a sobra da meta de hoje."
- Duas barras segmentadas lado a lado ou empilhadas, cada uma com ícone e `atual / necessário`:
  - Cofre (cor `kcal`): `availableKcal / estimatedKcal`
  - Moedas (cor `coin`): `coinBalance / ticketCost`
- Remover o chip "Faltam X kcal e Y moedas", que repetia a frase e parecia botão.
- Aviso de dias sem registro: linha neutra compacta com ícone de info.
- Rodapé com uma linha só (dados do `vault.cycle`): "Semana termina dom., 11/10 · cofre e moedas zeram na segunda". Se `previousCycle.resetKcal > 0`, segunda linha pequena.
- Ação: link secundário "Ver na Loja →" para `/rewards`. Se ambos os requisitos estiverem cumpridos, vira "Resgatar" (mas o primário da tela continua sendo o do TodayCard, então este fica no estilo secundário com cor `coin`).
- Estado vazio (sem refeição): manter "Agendar refeição livre" no estilo secundário.

### 5.4 `ProfileIncompleteCard`
- Restilizar com os tokens. Quando aparece, é o único botão primário da tela ("Completar perfil").

---

## 6. Componentes compartilhados (criar em `src/components/ui/`)
- `SegmentedBar.tsx` — props: `value`, `max`, `segments?`, `tone: 'kcal' | 'coin' | 'xp' | 'action'`.
- `Card.tsx` — wrapper com borda 2px, sombra dura e padding padrão; prop opcional `label`.
- `Button.tsx` — variantes `primary` (`action`, sombra dura), `secondary` (contorno), `link` (texto); suporta `Link` do TanStack ou `<button>`; `min-h-[44px]`.
- `StatChip.tsx` (opcional) — ícone + número + cor de token (moedas, sequência).

Nada de lógica nesses componentes: só visual tipado.

---

## 7. Ordem de execução
1. Criar a branch (ex. `feat/hub-redesign`).
2. Tokens de cor e fonte em `src/index.css` (`@theme`) + fonte no `index.html`.
3. Componentes `ui/` (seção 6).
4. `PlayerBar` → `TodayCard` → `QuestCard` → restyle do `ProfileIncompleteCard`.
5. Atualizar `routes/index.tsx`: uma coluna, `max-w-md mx-auto`, `space-y-4`, nova ordem.
6. Apagar `UserHUD`, `energyBalance`, `CaloricVault`, `NextFreeMealHero` e `CloseDayPanel` **só se não forem importados em outro lugar** (conferir com busca no projeto).
7. `npm run lint` em `rpg-frontend` sem erros.
8. Conferir no navegador com `npm run dev`, em 375px (DevTools → modo dispositivo) e no desktop.

---

## 8. Critérios de aceite
- [ ] Existe **um** botão preenchido na tela, e ele muda conforme o estado do dia (seção 2).
- [ ] Âmbar aparece só em moedas/recompensas; rosa só em erro.
- [ ] Nenhum número aparece duas vezes na tela.
- [ ] Nenhum card fica com área vazia grande: o cofre está dentro da Missão.
- [ ] Textos ≥ 12px; nada de `font-mono` em frases.
- [ ] Layout em coluna única e idêntico em celular e desktop, alinhado à BottomNav.
- [ ] Estados conferidos: perfil incompleto · sem refeição agendada · refeição da semana · refeição do dia · 0 registros · com registros · dia fechado (com resultado de recompensa) · erro e carregando.
- [ ] `npm run lint` passa; zero `any`/`unknown`/cast.
- [ ] Nenhuma alteração em services, hooks, tipos ou backend.

---

## 9. Decisões em aberto (confirmar com o usuário antes de implementar)
1. **Ordem Hoje × Missão:** o plano põe "Hoje" primeiro (é o que tem ação agora). A alternativa é a Missão no topo, como motivação principal.
2. **Fonte pixel:** usar (Pixelify Sans / Silkscreen) nos números e no nível, ou ficar só na sans.
3. **XP e sequência no PlayerBar:** se `GetMeResponseDto` não expuser XP do nível e sequência, abrir uma tarefa de backend separada (fora deste escopo).

## 10. Fora do escopo (anotar, não fazer agora)
- BottomNav e modais com o mesmo `z-50` (a barra pode cobrir o fim dos modais).
- Inputs com `text-sm` causando zoom no iOS; `vh` → `dvh` nos modais.
- "Treino do dia" no Hub (o `useHubData` não carrega treinos hoje).
- Redesign da tela de Treino (próxima etapa, reaproveitando os tokens e os `ui/`).
