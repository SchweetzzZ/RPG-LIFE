# 🔐 Guia de Implementação: Autenticação (Login & Cadastro)

> **Princípio Fundamental:** Zero mocks, zero bancos fakes. A autenticação conecta-se 100% aos endpoints reais do NestJS (`POST /user/login` e `POST /user/register`), com armazenamento seguro de JWT em `localStorage` e interceptor automático no cliente HTTP (`openapi-fetch`).
> **Design:** *Dark Obsidian Minimalist* — paleta escura profunda, foco suave em neon/âmbar, micro-interações ágeis e alternância fluida entre "Entrar" e "Criar Conta".

---

## 🔎 Auditoria de Contratos: Backend ➔ Frontend

Análise dos contratos da nossa API NestJS (`rpg-backend`) que já estão documentados no Swagger e disponíveis no `schema.ts`:

### 1. `POST /user/login` (Autenticação)
| Parâmetro / Retorno | Tipo | Descrição |
| :--- | :--- | :--- |
| `body.email` | `string` (e-mail válido) | E-mail da conta |
| `body.password` | `string` | Senha em texto puro (o back faz hash bcrypt) |
| **Retorno 200** | `{ access_Token: string }` | Token JWT assinado para as requisições autenticadas |
| **Retorno 401 / 404** | `{ statusCode: 401, message: string }` | Credenciais inválidas / Usuário não encontrado |

### 2. `POST /user/register` (Novo Usuário)
| Parâmetro / Retorno | Tipo | Descrição |
| :--- | :--- | :--- |
| `body.username` | `string` | Nome de exibição do usuário |
| `body.email` | `string` (e-mail válido) | E-mail único |
| `body.password` | `string` | Senha |
| `body.role` | `'player' \| 'admin'` | **Obrigatório**. Define a responsabilidade e permissões do usuário na plataforma |
| **Retorno 201** | `{ id: string, email: string, username: string, role: "player" \| "admin" }` | Usuário e perfil criados com sucesso no banco |
| **Retorno 409** | `{ statusCode: 409, message: "user already exists" }` | E-mail já em uso |

#### 🛡️ Divisão de Responsabilidades pelas Roles:
- **`player` (Jogador / Usuário Geral):** Focado na jornada fitness e economia comportamental — registro de treinos, check-in de hábitos, gasto calórico diário, cofre e resgate de refeições livres.
- **`admin` (Administrador):** Acesso à gestão da plataforma — controle de usuários, moderação, auditoria e parametrizações globais do sistema.

---

## 📂 Arquitetura de Pastas e Arquivos

Organização limpa dentro de `rpg-frontend/src/`:

```text
src/
├── types/
│   └── auth.ts              <-- Tipos inferidos do schema.ts (LoginDto, RegisterDto, etc.)
├── services/
│   ├── api.ts               <-- Cliente HTTP com interceptor JWT (já configurado)
│   └── auth.service.ts      <-- Métodos login(), register() e logout()
└── routes/
    └── login.tsx            <-- Tela única com tabs (Entrar / Criar Conta) e validação
```

---

## 🔨 Passo a Passo da Implementação

---

### 🔹 ETAPA 1: Tipos Derivados do Contrato Swagger (`src/types/auth.ts`)

Nenhuma tipagem manual é necessária. Importamos diretamente as definições do Swagger geradas em `src/api/schema.ts`:

Crie `rpg-frontend/src/types/auth.ts`:

```typescript
import type { components } from '../api/schema';

// Payloads de entrada
export type LoginInput = components['schemas']['LoginUserDto'];
export type RegisterInput = components['schemas']['RegisterUserDto'];

// Payloads de resposta da API
export type LoginResponse = components['schemas']['LoginResponseDto'];
export type RegisterResponse = components['schemas']['RegisterResponseDto'];
```

---

### 🔹 ETAPA 2: Camada de Serviço de Autenticação (`src/services/auth.service.ts`)

Como o backend NestJS utiliza **Cookies `HttpOnly`** (`res.cookie('jwt', ...)`), o token é armazenado e trafegado automaticamente pelo navegador em um cofre inacessível via JavaScript (100% blindado contra ataques XSS).

Como o cliente `api.ts` já está configurado com `credentials: 'include'`, **você não precisa fazer `localStorage.setItem` manual**! O próprio navegador anexa o cookie em todas as chamadas futuras.

Crie `rpg-frontend/src/services/auth.service.ts`:

```typescript
import { client } from './api';
import type { LoginInput, RegisterInput, LoginResponse, RegisterResponse } from '../types/auth';

export const authService = {
  // 1. Realiza Login (o backend devolve o cookie HttpOnly 'jwt' automaticamente)
  async login(credentials: LoginInput): Promise<LoginResponse> {
    const { data, error, response } = await client.POST('/user/login', {
      body: credentials,
    });

    if (error || !data) {
      if (response.status === 401 || response.status === 404) {
        throw new Error('E-mail ou senha incorretos.');
      }
      throw new Error('Falha ao conectar com o servidor. Tente novamente.');
    }

    return data;
  },

  // 2. Cria nova conta no backend
  async register(dataInput: RegisterInput): Promise<RegisterResponse> {
    const { data, error, response } = await client.POST('/user/register', {
      body: dataInput,
    });

    if (error || !data) {
      if (response.status === 409) {
        throw new Error('Este e-mail já está cadastrado.');
      }
      throw new Error('Não foi possível realizar o cadastro. Verifique os dados.');
    }

    return data;
  },

  // 3. Logout (redireciona para login e pode chamar endpoint de limpeza de cookie)
  logout() {
    // Redireciona para a tela de autenticação
    window.location.href = '/login';
  },
};
```

---

### 🔹 ETAPA 3: A Tela Unificada de Login & Cadastro (`src/routes/login.tsx`)

Criamos uma interface minimalista *Dark Obsidian* com:
1. Alternância fluida por abas: **"Entrar"** e **"Criar Conta"**.
2. Inputs com foco estilizado em âmbar dourado (remetendo ao sistema de moedas).
3. Estados claros de carregamento (`isLoading`) e mensagens de erro amigáveis.
4. Redirecionamento automático com `useNavigate()` do TanStack Router para a rota raiz (`/`) ao logar com sucesso.

Edite `rpg-frontend/src/routes/login.tsx`:

```tsx
import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authService } from '../services/auth.service';

export const Route = createFileRoute('/login')({
  component: LoginPage, 
});

function LoginPage() {
  const navigate = useNavigate();

  // Modo da tela: 'login' ou 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Campos do formulário
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        // Fluxo de Login
        await authService.login({ email, password });
        // Redireciona diretamente para o Dashboard conectado
        navigate({ to: '/' });
      } else {
        // Fluxo de Cadastro (todo novo usuário da tela pública se cadastra como 'player')
        await authService.register({ username, email, password, role: 'player' });
        // Auto-login imediatamente após cadastrar com sucesso
        await authService.login({ email, password });
        navigate({ to: '/' });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocorreu um erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm border border-neutral-800 bg-neutral-900/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        
        {/* Logo / Título Minimalista */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-2xl mb-3">
            🪙
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-100">
            RPG-LIFE
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Conquiste suas calorias. 0% Culpa, 100% Mérito.
          </p>
        </div>

        {/* Abas Alternadoras: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-neutral-950 border border-neutral-800/80 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Campo Nome (Apenas no Cadastro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Nome de Usuário
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Felipe"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          )}

          {/* Campo E-mail */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Botão de Ação Primária */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : mode === 'login' ? (
              'Acessar Painel ➔'
            ) : (
              'Começar Agora ➔'
            )}
          </button>
        </form>

        {/* Rodapé / Alternância Rápida */}
        <div className="mt-5 text-center text-xs text-neutral-500">
          {mode === 'login' ? (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(null); }}
                className="text-amber-400 hover:underline font-medium"
              >
                Cadastre-se grátis
              </button>
            </p>
          ) : (
            <p>
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(null); }}
                className="text-amber-400 hover:underline font-medium"
              >
                Fazer login
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
```

---

## 🧪 Como Testar na Prática

1. **Abra o navegador em:** `http://localhost:3000/login`
2. **Crie uma conta de teste:**
   * Clique na aba **"Criar Conta"**.
   * Digite seu nome, e-mail e senha.
   * Ao clicar em *"Começar Agora"*, o sistema cria o usuário no MongoDB, faz o login automaticamente, define o cookie HttpOnly e te leva para o Dashboard (`/`).
3. **Verifique no DevTools (F12):**
   * Em `Application > Cookies`, confira o cookie **`jwt`** gravado com a flag `HttpOnly: true`.
   * Em `Network`, confira as requisições `POST /api/user/register` e `POST /api/user/login` retornando 200/201 com o cabeçalho `Set-Cookie`.
