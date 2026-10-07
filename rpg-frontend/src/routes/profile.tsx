import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { User, ShieldCheck, Flame, Zap } from 'lucide-react';
import { PrimaryGoalSelector, type GoalType } from '../components/profile/PrimaryGoalSelector';
import { BiometricsForm } from '../components/profile/BiometricsForm';

export const Route = createFileRoute('/profile')({
  component: ProfileRouteComponent,
});

function ProfileRouteComponent() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('lose_weight');

  const handleSaveBiometrics = (data: any) => {
    // Simula recálculo de dieta do usuário
    console.log('Dados biométricos salvos:', data, 'Meta:', selectedGoal);
  };

  const handleLogout = () => {
    // Redireciona para o login
    navigate({ to: '/login' });
  };

  return (
    <main className="min-h-screen bg-[#08090a] text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-5">
        {/* Header do Perfil */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
                <User className="h-4 w-4 stroke-[2]" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100">
                Perfil & Ficha do Caçador
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Parametrização biológica e status de combate no RPG-LIFE.
            </p>
          </div>
        </header>

        {/* 1. Seletor Tático de Meta Corporal */}
        <PrimaryGoalSelector
          selectedGoal={selectedGoal}
          onChange={setSelectedGoal}
        />

        {/* 2. Formulário de Biometria & Recálculo */}
        <BiometricsForm
          onSave={handleSaveBiometrics}
          onLogout={handleLogout}
        />
      </div>
    </main>
  );
}
