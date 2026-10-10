import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Coins, AlertCircle, Loader2, Mail, Lock, User, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen bg-[#08090a] text-zinc-100">
      <div className="w-full max-w-sm border border-white/[0.08] bg-[#0c0e12] rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
        {/* Logo / Título Tático */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 shadow-inner">
            <Coins className="h-6 w-6 stroke-[1.75]" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100">
            RPG-LIFE
          </h1>
          <p className="font-mono text-xs text-zinc-400">
            Conquiste suas calorias. 0% culpa, 100% mérito.
          </p>
        </div>

        {/* Abas Alternadoras: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-[#08090a] border border-white/[0.08] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-lg transition-all min-h-[38px] ${mode === 'login'
                ? 'bg-[#14171d] text-zinc-100 shadow-sm border border-white/[0.08]'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-lg transition-all min-h-[38px] ${mode === 'register'
                ? 'bg-[#14171d] text-zinc-100 shadow-sm border border-white/[0.08]'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 stroke-[2]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nickname no RPG"
                  className="w-full h-12 pl-10 pr-3.5 bg-[#08090a] border border-white/[0.1] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-12 pl-10 pr-3.5 bg-[#08090a] border border-white/[0.1] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/60 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-3.5 bg-[#08090a] border border-white/[0.1] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black stroke-[2.5]" />
            ) : mode === 'login' ? (
              'Acessar Painel do Caçador'
            ) : (
              'Criar Personagem'
            )}
          </button>
        </form>

        <div className="text-center font-mono text-xs text-zinc-500 pt-1">
          {mode === 'login' ? (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="text-amber-400 hover:underline font-semibold"
              >
                Crie sua conta
              </button>
            </p>
          ) : (
            <p>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-amber-400 hover:underline font-semibold"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}