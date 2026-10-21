import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
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
    <main className="min-h-screen px-3 pb-28 pt-3 text-ink sm:p-4 sm:pb-28">
      <div className="mx-auto w-full max-w-md space-y-3">
        <PageHeader title="Perfil" icon={User} />

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
