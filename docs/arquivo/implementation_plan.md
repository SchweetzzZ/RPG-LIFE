# 🧱 Plano: Limpeza do Código Legado & Wireframe Funcional Minimalista

Descartar o código monolítico e mockado do frontend anterior (`App.tsx`, mocks extensos e uso desordenado de `localStorage`) e iniciar uma arquitetura limpa, modular e tipada em cima da infraestrutura já instalada (Vite + TanStack Router + Tailwind 4 + Lucide React).

---

## 🧹 1. O que será descartado / arquivado?

- **`App.tsx` monolítico (624 linhas):** Contém dezenas de estados locais desconectados da API, arrays mockados de treinos e comidas, e lógica desordenada de `localStorage`.
- **`types.ts` legado:** Modelos antigos que não refletem os novos DTOs do NestJS (`EnergySummaryDto`, `StepLogDto`, técnicas de treino `back_off_set`, etc.).
- **Componentes órfãos em `src/components/`:** Vários componentes mockados que não conectam ao backend.

> [!TIP]
> Manteremos intacta a infraestrutura do projeto: `package.json` (com as bibliotecas Vite, TanStack Router, Lucide, Tailwind 4), `vite.config.ts` (com o proxy para o backend em `http://localhost:4000`) e a rota de login funcional.

---

## 🏛️ 2. Nova Estrutura Limpa (`src/`)

```
src/
├── api/                  # Tipagens e DTOs alinhados 1:1 com o backend
├── services/
│   └── api.ts            # Client HTTP limpo (Axios/Fetch) com injeção automática de Bearer Token
├── components/
│   └── layout/
│       ├── Header.tsx    # Header minimalista: Avatar, Rank, Barra HP, XP e Moedas
│       └── BottomNav.tsx # Navegação inferior fixa de 5 abas
├── routes/
│   ├── __root.tsx        # Root router (Outlet + Devtools)
│   ├── login.tsx         # Tela de autenticação limpa
│   └── _authenticated/  # Layout protegido (verifica token; se ausente ➔ /login)
│       ├── index.tsx     # [1] Hub / Balanço Calórico (GET /energy/daily-summary)
│       ├── workouts.tsx  # [2] Treinos: Séries, Técnicas, Rest Timer e Concluir
│       ├── nutrition.tsx # [3] Diário: Macros diários e Busca Barcode/TACO
│       ├── habits.tsx    # [4] Quests: Passos (POST /habits/steps) e Hábitos
│       └── profile.tsx   # [5] Perfil: Biometria (GET/PATCH /user/profile) e Atributos
├── index.css             # Estilização base leve (Dark Slate neutro, legível)
└── main.tsx              # Ponto de entrada do React
```

---

## 📐 3. Princípio de Estilização: *Clean & Skeleton First*

- **Cores Neutras:** Fundo grafite/slate (`#0f172a`), superfícies de cards (`#1e293b`), bordas discretas (`#334155`) e texto branco/cinza claro.
- **Hierarquia Funcional:** Tabelas bem alinhadas para os treinos, botões claros com estado de clique, inputs legíveis para peso/repetições/passos.
- **Zero Poluição de IA:** Sem neons agressivos ou gradientes pesados nesta fase — foco total em verificar se os dados trafegam e salvam no banco com sucesso.

---

## 🧪 4. Roteiro de Validação Ponta a Ponta

1. **Login Real:** Logar com credenciais existentes ou registrar novo usuário e persistir o token JWT.
2. **Hub:** Conferir se `GET /energy/daily-summary` retorna a TMB calculada pelo backend e saldo inicial.
3. **Treino:** Abrir uma rotina, marcar séries, acionar o timer e clicar em "Concluir Treino" ➔ validar retorno `201` com Kcal gastas e ganho de moedas.
4. **Passos:** Inserir 5.000 passos ➔ validar gravação no `POST /habits/steps` e atualização no resumo diário.
5. **Nutrição:** Fazer busca de um código de barras ➔ validar resposta do Open Food Facts.
6. **Compilação:** Executar `npm run build` no `rpg-frontend` para certificar zero erros de TypeScript.
