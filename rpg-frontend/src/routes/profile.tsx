import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PrimaryGoalSelector } from '../components/profile/PrimaryGoalSelector';
import { PhysicalProfileForm } from '../components/profile/PhysicalProfileForm';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlocks';
import { useResource } from '../hooks/useResource';
import { profileService } from '../services/profile.service';
import type { PrimaryGoal, ProfileData, UpdateProfileInput } from '../types/profile';

export const Route = createFileRoute('/profile')({
  component: ProfileRouteComponent,
});

function ProfileRouteComponent() {
  const { data, loading, error, reload } = useResource(profileService.getProfile);

  return (
    <main className="min-h-screen bg-bg px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <header className="px-1">
          <h1 className="font-pixel text-2xl font-bold text-ink">Perfil</h1>
          <p className="text-xs text-ink-faint">Seus dados para calcular as metas de calorias e macros.</p>
        </header>

        {loading && !data && <LoadingBlock label="Carregando seu perfil..." />}
        {error && <ErrorBlock message={error} onRetry={reload} />}
        {data && <PhysicalProfileSection profile={data} />}
      </div>
    </main>
  );
}

function PhysicalProfileSection({ profile }: { profile: ProfileData }) {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoal | null>(profile.primaryGoal);

  const handleSavePhysicalProfile = (input: UpdateProfileInput) => profileService.saveNutritionProfile(input);

  const handleLogout = () => {
    // Redireciona para o login
    navigate({ to: '/login' });
  };

  return (
    <>
      {/* 1. Seletor Tático de Meta Corporal */}
      <PrimaryGoalSelector
        selectedGoal={selectedGoal}
        onChange={setSelectedGoal}
      />

      {/* 2. Perfil físico & recálculo das metas */}
      <PhysicalProfileForm
        initialData={profile}
        primaryGoal={selectedGoal}
        onSave={handleSavePhysicalProfile}
        onLogout={handleLogout}
      />
    </>
  );
}
