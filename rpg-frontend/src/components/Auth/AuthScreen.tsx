import React, { useState } from 'react';
import { client } from '../../services/api';
import {
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form Fields - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Submit Handler for Login via OpenAPI Fetch
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Preencha o e-mail/nickname e a senha.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await client.POST('/user/login', {
        body: {
          email: loginEmail.trim(),
          password: loginPassword,
        },
      });

      if (error) {
        console.error("Erro no login:", error);
        setErrorMessage('Credenciais inválidas. Verifique seu e-mail e senha.');
        return;
      }

      if (data) {
        console.log("Token recebido:", data.access_Token);
        localStorage.setItem('access_token', data.access_Token);

        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      }
    } catch (err: unknown) {
      setErrorMessage('Erro ao conectar ao servidor. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler for Register via OpenAPI Fetch
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim()) {
      setErrorMessage('Digite o Nickname do seu Caçador.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Insira um e-mail válido.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('A senha precisa ter no mínimo 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cadastrar no NestJS
      const { error: regError } = await client.POST('/user/register', {
        body: {
          email: regEmail.trim(),
          username: regName.trim(),
          password: regPassword,
          role: 'player',
        },
      });

      if (regError) {
        const rawMessage = regError.message;
        const formattedMessage = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : rawMessage;

        setErrorMessage(formattedMessage || 'Falha ao criar conta. O e-mail/nickname já pode estar em uso.');
        setLoading(false);
        return;
      }

      // 2. Fazer Login imediatamente após o cadastro
      const { data: loginData } = await client.POST('/user/login', {
        body: {
          email: regEmail.trim(),
          password: regPassword,
        },
      });

      if (loginData?.access_Token) {
        localStorage.setItem('access_token', loginData.access_Token);
      }

      soundFx.playQuestComplete();
      setSuccessMessage(`Despertar concluído! Bem-vindo, ${regName.trim()}.`);

      setTimeout(() => {
        onLoginSuccess();
      }, 600);
    } catch (err) {
      setErrorMessage('Ocorreu um erro ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-950/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            HUNTER SYSTEM ACCESS
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-100">
            {mode === 'login' ? 'Acessar Portal' : 'Despertar Caçador'}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Digite suas credenciais para sincronizar com o Sistema'
              : 'Registre seu perfil inicial para desbloquear missões'}
          </p>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs font-bold">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              soundFx.playCoin();
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${mode === 'login'
              ? 'bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              soundFx.playCoin();
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${mode === 'register'
              ? 'bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Cadastrar
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                E-mail
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="sung.jinwoo@hunter.sys"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sincronizando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nickname</label>
              <input
                type="text"
                required
                disabled={loading}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="ex: Cha Hae-In"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">E-mail</label>
              <input
                type="email"
                required
                disabled={loading}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ex: hunter@sistema.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Senha</label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirmar</label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'Processando...' : 'Concluir Cadastro'}</span>
            </button>
          </form>
        )}

        <div className="text-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
          SISTEMA V1.4 • CONEXÃO CRIPTOGRAFADA
        </div>
      </div>
    </div>
  );
};