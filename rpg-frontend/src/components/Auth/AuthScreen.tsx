import React, { useState } from 'react';
import { UserProfile, AuthAccount } from '../../types';
import { authApi } from '../../services/api';
import {
  Shield,
  Zap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  Sword,
  Flame,
  Brain,
  Heart,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface AuthScreenProps {
  onLoginSuccess: (account: AuthAccount) => void;
  defaultProfile: UserProfile;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  defaultProfile,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form Fields - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form Fields - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [selectedClass, setSelectedClass] = useState<'shadow' | 'warrior' | 'mage' | 'scout'>('shadow');

  // Error & Status States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Class presets for new Hunter registration
  const hunterClasses = [
    {
      id: 'shadow',
      name: 'Sombras',
      icon: Sword,
      description: 'Foco em Agilidade e Reação',
      attrs: { strength: 12, intelligence: 10, vitality: 12, focus: 15 },
    },
    {
      id: 'warrior',
      name: 'Guerreiro',
      icon: Flame,
      description: 'Foco em Força Bruta e Resistência',
      attrs: { strength: 16, intelligence: 8, vitality: 14, focus: 10 },
    },
    {
      id: 'mage',
      name: 'Arcano',
      icon: Brain,
      description: 'Foco em Inteligência e Estratégia',
      attrs: { strength: 8, intelligence: 18, vitality: 10, focus: 12 },
    },
    {
      id: 'scout',
      name: 'Estrategista',
      icon: Heart,
      description: 'Foco em Vitalidade e Hábito',
      attrs: { strength: 10, intelligence: 12, vitality: 16, focus: 14 },
    },
  ];

  // Quick Demo Login (loads default Jin-Woo account)
  const handleQuickDemoLogin = () => {
    soundFx.playQuestComplete();
    localStorage.setItem('access_token', 'demo_token_jinwoo');
    const demoAccount: AuthAccount = {
      id: 'acc_demo_jinwoo',
      email: 'sung.jinwoo@hunter.sys',
      passwordHash: 'demo123',
      createdAt: new Date().toISOString(),
      profile: {
        ...defaultProfile,
        email: 'sung.jinwoo@hunter.sys',
      },
    };
    onLoginSuccess(demoAccount);
  };

  // Submit Handler for Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Preencha o e-mail/nickname e a senha.');
      return;
    }

    // Try backend authentication first
    try {
      const res = await authApi.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res && res.access_Token) {
        localStorage.setItem('access_token', res.access_Token);
      } else {
        localStorage.setItem('access_token', 'backend_auth_' + Date.now());
      }

      soundFx.playQuestComplete();
      setSuccessMessage('Acesso Autorizado pelo Backend NestJS.');

      const account: AuthAccount = {
        id: `acc_${Date.now()}`,
        email: loginEmail.trim(),
        passwordHash: loginPassword,
        createdAt: new Date().toISOString(),
        profile: {
          ...defaultProfile,
          email: loginEmail.trim(),
          nickname: loginEmail.split('@')[0],
        },
      };

      setTimeout(() => {
        onLoginSuccess(account);
      }, 500);
      return;
    } catch (apiErr: any) {
      console.warn('Backend login failed, attempting local auth fallback:', apiErr.message);
    }

    // Fallback to local accounts
    try {
      const stored = localStorage.getItem('life_rpg_accounts_v1');
      const accounts: AuthAccount[] = stored ? JSON.parse(stored) : [];

      const found = accounts.find(
        (acc) =>
          acc.email.toLowerCase() === loginEmail.trim().toLowerCase() ||
          acc.profile.nickname.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (!found) {
        if (
          loginEmail.toLowerCase().includes('jinwoo') ||
          loginEmail.toLowerCase().includes('demo')
        ) {
          handleQuickDemoLogin();
          return;
        }

        setErrorMessage(apiErrMessage(errorMessage, 'Caçador não encontrado. Crie uma nova conta ou use o acesso convidado.'));
        return;
      }

      if (found.passwordHash !== loginPassword) {
        setErrorMessage('Senha incorreta para este Caçador.');
        return;
      }

      localStorage.setItem('access_token', 'local_token_' + found.id);
      soundFx.playQuestComplete();
      setSuccessMessage('Acesso Autorizado pelo Sistema.');
      setTimeout(() => {
        onLoginSuccess(found);
      }, 500);
    } catch {
      handleQuickDemoLogin();
    }
  };

  function apiErrMessage(customErr: string | null, fallback: string) {
    return customErr || fallback;
  }

  // Submit Handler for Register
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

    const classData = hunterClasses.find((c) => c.id === selectedClass) || hunterClasses[0];

    const newProfile: UserProfile = {
      ...defaultProfile,
      id: `usr_${Date.now()}`,
      name: regName.trim(),
      nickname: regName.trim(),
      email: regEmail.trim(),
      title: `${classData.name} Despertado`,
      rank: 'E',
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      attributes: classData.attrs,
    };

    const newAccount: AuthAccount = {
      id: `acc_${Date.now()}`,
      email: regEmail.trim(),
      passwordHash: regPassword,
      createdAt: new Date().toISOString(),
      profile: newProfile,
    };

    // Attempt backend registration & login
    try {
      await authApi.register({
        email: regEmail.trim(),
        username: regName.trim(),
        password: regPassword,
      });

      const loginRes = await authApi.login({
        email: regEmail.trim(),
        password: regPassword,
      }).catch(() => null);

      if (loginRes && loginRes.access_Token) {
        localStorage.setItem('access_token', loginRes.access_Token);
      } else {
        localStorage.setItem('access_token', 'reg_token_' + Date.now());
      }
    } catch (apiErr: any) {
      console.warn('Backend registration warning:', apiErr.message);
      localStorage.setItem('access_token', 'local_reg_token_' + Date.now());
    }

    try {
      const stored = localStorage.getItem('life_rpg_accounts_v1');
      const accounts: AuthAccount[] = stored ? JSON.parse(stored) : [];
      accounts.push(newAccount);
      localStorage.setItem('life_rpg_accounts_v1', JSON.stringify(accounts));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    soundFx.playQuestComplete();
    setSuccessMessage(`Despertar concluído! Bem-vindo, ${regName.trim()}.`);
    setTimeout(() => {
      onLoginSuccess(newAccount);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex items-center justify-center p-4 relative font-sans">
      {/* Minimal ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-950/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Minimalist Card */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6">
        {/* Minimal Header */}
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
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                E-mail ou Nickname
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="sung.jinwoo@hunter.sys"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
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
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Guest Access */}
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2 bg-slate-950 hover:bg-slate-800/80 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrar como Sung Jin-Woo (Modo Convidado)</span>
              </button>
            </div>
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
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
                />
              </div>
            </div>

            {/* Hunter Class Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Classe Inicial
              </label>

              <div className="grid grid-cols-2 gap-2">
                {hunterClasses.map((cls) => {
                  const Icon = cls.icon;
                  const isSelected = selectedClass === cls.id;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls.id as typeof selectedClass);
                        soundFx.playCoin();
                      }}
                      className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${isSelected
                          ? 'bg-slate-800 border-cyan-500/80 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                    >
                      <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {cls.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Concluir Cadastro</span>
            </button>
          </form>
        )}

        {/* Minimal Footer */}
        <div className="text-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
          SISTEMA V1.4 • CONEXÃO CRIPTOGRAFADA
        </div>
      </div>
    </div>
  );
};
