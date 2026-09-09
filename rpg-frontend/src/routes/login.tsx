import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authService } from '../services/auth.service';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<'Login' | 'register'>('Login')

  //Campos do formulario
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'player' | 'admin'>('player')

  //Estados de feedBack
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      if (mode === 'Login') {
        await authService.Login({ email, password })
        navigate({ to: '/' })
      } else {
        await authService.Register({ username, email, password, role })
        await authService.Login({ email, password })
        navigate({ to: "/" })
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage("Ocorreu um erro inesperado")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-sm border border-neutral-800 bg-neutral-900/90 rounded-2xl p-6 shadow-2xl
       backdrop-blur-md">

        {/* Logo / Título Minimalista */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-2xl mb-3">
            🪙
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-100">
            RPG Life
          </h1>
          <p className="text-xs text-neutral-400 mt-1"> Conquiste suas Calorias. 0% culpa, 100% mérito </p>
        </div>
        {/* Abas Alternadoras: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-neutral-950 border border-neutral-800/80 rounded-xl mb-5 text-xs font-semibold">
          <button
            type='button' onClick={() => { setMode('Login'); setErrorMessage(null) }}
            className={`py-2 rounded-lg transition-all ${mode === 'Login' ? 'bg-neutral-800 text-neutral-100 shadow' : 'text-neutral-400 hover:text-neutral-200'}`}>
            Entrar
          </button>
          <button
            type="button" onClick={() => { setMode('register'); setErrorMessage(null) }}
            className={`py-2 rounded-lg transition-all ${mode === 'register' ? 'bg-neutral-800 text-neutral-100 shadow' : 'text-neutral-400 hover:text-neutral-200'}`}>
            Criar conta
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
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nome de Usúario</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nome de Usuario"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100 
                   placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"></input>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder='email'
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100
              placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"></input>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-100
              placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"></input>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 
          hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-sm shadow-lg 
          shadow-amber-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed 
          flex items-center justify-center gap-2">
            {loading ? (
              <span className='inline-block animate-spin'>⏳</span>
            ) : mode === "Login" ? (
              'Acessar Painel'
            ) : (
              'Começar agora'
            )}
          </button>
        </form>
        <div className="mt-5 text-center text-xs text-neutral-500">
          {mode === "Login" ? (
            <p>Não tem uma conta? {' '}
              <button type="button" onClick={() => { setMode('register'); setErrorMessage(null) }}
                className="text-amber-400 hover:underline font-medium cursor-pointer">
                Crie sua conta
              </button></p>
          ) : (
            <p>Já tem uma conta? {' '}
              <button type="button" onClick={() => { setMode('Login'); setErrorMessage(null) }}
                className="text-amber-400 hover:underline font-medium cursor-pointer">
                Faça login
              </button></p>
          )}
        </div>
      </div>
    </div >
  );
}