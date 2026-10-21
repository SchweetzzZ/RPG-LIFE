import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Coins, AlertCircle, Loader2, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth.service';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Campos do formulário
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'player' | 'admin'>('player');

  // Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await authService.Login({ email, password });
        navigate({ to: '/' });
      } else {
        await authService.Register({ username, email, password, role });
        await authService.Login({ email, password });
        navigate({ to: '/' });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocorreu um erro inesperado ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'h-12 w-full rounded-lg border-2 border-line bg-raised pl-10 pr-3 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-action focus:outline-none';
  const labelClass = 'block font-pixel text-xs uppercase text-ink-dim';
  const iconClass = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint';

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setErrorMessage(null);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-ink">
      <div className="w-full max-w-sm space-y-5">
        {/* Logo: moeda em bloco + nome na fonte pixel */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border-2 border-[#0c0a08] bg-coin text-[#0c0a08] shadow-[0_4px_0_0_#0c0a08]">
            <Coins className="h-8 w-8" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="font-pixel text-4xl leading-none text-ink">RPG-LIFE</h1>
            <p className="mt-2 text-sm text-ink-dim">Conquiste suas calorias. 0% culpa, 100% mérito.</p>
          </div>
        </div>

        <div className="space-y-5 rounded-lg border-2 border-line bg-surface p-5 shadow-[0_4px_0_0_#0c0a08]">
          {/* Abas: Entrar vs Criar Conta */}
          <div role="tablist" aria-label="Acesso" className="grid grid-cols-2 gap-1.5">
            {(['login', 'register'] as const).map((tab) => {
              const on = mode === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => switchMode(tab)}
                  className={`min-h-[44px] rounded-lg border-2 bg-raised text-sm font-semibold transition-colors ${
                    on ? 'border-action text-action' : 'border-line text-ink-dim hover:border-ink-faint hover:text-ink'
                  }`}
                >
                  {tab === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              );
            })}
          </div>

          {errorMessage && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border-2 border-danger/60 bg-raised p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label htmlFor="login-username" className={labelClass}>
                  Nome de usuário
                </label>
                <div className="relative">
                  <User className={iconClass} />
                  <input
                    id="login-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nickname no RPG"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-email" className={labelClass}>
                E-mail
              </label>
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className={labelClass}>
                Senha
              </label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="mt-1 min-h-[48px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'login' ? 'Entrar' : 'Criar personagem'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-faint">
          {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-action underline-offset-2 hover:underline"
          >
            {mode === 'login' ? 'Crie sua conta' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}
