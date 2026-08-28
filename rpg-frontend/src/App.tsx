/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  WorkoutRoutine,
  Quest,
  ShopItem,
  WorkoutLogEntry,
  HistoricalExerciseData,
  LoggedFoodItem,
  DailyNutritionGoals,
} from './types';
import { soundFx } from './utils/audio';
import { useNavigate } from '@tanstack/react-router';
import { client } from './services/api';

import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { HunterDashboard } from './components/Dashboard/HunterDashboard';
import { WorkoutModule } from './components/Workout/WorkoutModule';
import { NutritionModule } from './components/Nutrition/NutritionModule';
import { GuidelinesModule } from './components/Guidelines/GuidelinesModule';
import { QuestsModule } from './components/Quests/QuestsModule';
import { ShopModule } from './components/Shop/ShopModule';
import { SettingsModule } from './components/Settings/SettingsModule';
import { LevelUpModal } from './components/Modals/LevelUpModal';

export function calculateRank(level: number): 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'Nível Monarca' {
  if (level >= 100) return 'Nível Monarca';
  if (level >= 80) return 'S';
  if (level >= 60) return 'A';
  if (level >= 40) return 'B';
  if (level >= 25) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

const INITIAL_PROFILE: UserProfile = {
  id: '',
  name: 'Caçador',
  nickname: 'Caçador',
  title: 'Caçador Novato',
  rank: 'E',
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  coins: 0,
  gems: 0,
  attributes: { strength: 10, intelligence: 10, vitality: 10, focus: 10 },
  equippedSkinId: 'skin_default',
  equippedThemeId: 'theme_obsidian',
  equippedBorderId: 'border_default',
  equippedTitle: 'Caçador Novato',
  streakDays: 0,
  lastActiveDate: new Date().toISOString(),
  waterIntakeMl: 0,
  dailyWaterGoalMl: 2000,
};

const DEFAULT_NUTRITION_GOALS: DailyNutritionGoals = {
  targetCalories: 2200,
  targetProteinGrams: 150,
  targetCarbsGrams: 250,
  targetFatGrams: 65,
};

interface UserMeResponse {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  profile?: {
    weightKg?: number;
    heightCm?: number;
    age?: number;
    biologicalSex?: string;
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';
    primaryGoal?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'extreme_definition';
    stressLevel?: number;
    trainsRegularly?: boolean;
    livesInHotClimate?: boolean;
  };
  character?: {
    level?: number;
    currentXp?: number;
    nextLevelXp?: number;
    coins?: number;
    gems?: number;
    attributes?: HunterAttributes;
  };
}

interface BackendWorkoutRoutine {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  targetMuscleGroups?: string[];
  exercises?: Exercise[];
  completionCount?: number;
  lastCompletedDate?: string;
}

interface BackendExerciseLog {
  exerciseName: string;
  maxWeightKg?: number;
  completedSetsCount?: number;
}

interface BackendWorkoutLog {
  _id?: string;
  id?: string;
  routineId?: string;
  routineTitle?: string;
  routineName?: string;
  completedAt?: string;
  durationMinutes?: number;
  totalVolumeKg?: number;
  totalSetsCompleted?: number;
  totalSets?: number;
  xpEarned?: number;
  xpGained?: number;
  coinsEarned?: number;
  coinsGained?: number;
  exerciseLogs?: BackendExerciseLog[];
  exercises?: BackendExerciseLog[];
}

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Core State
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems] = useState<ShopItem[]>([]);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>(['skin_default', 'theme_obsidian', 'border_default']);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, HistoricalExerciseData[]>>({});
  const [loggedFoods, setLoggedFoods] = useState<LoggedFoodItem[]>([]);
  const [dailyNutritionGoals, setDailyNutritionGoals] = useState<DailyNutritionGoals>(DEFAULT_NUTRITION_GOALS);

  // Level Up Modal State
  const [levelUpModalData, setLevelUpModalData] = useState<{
    oldLevel: number;
    newLevel: number;
  } | null>(null);

  // Fetch initial data from NestJS backend if logged in
  useEffect(() => {
    async function loadBackendData() {
      try {
        // Load user me (profile & character)
        const token = localStorage.getItem('access_token');
        if (token) {
          const res = await fetch('/api/user/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userMe = (await res.json()) as UserMeResponse;
            if (userMe) {
              const char = userMe.character;
              const prof = userMe.profile;
              setProfile((prev) => ({
                ...prev,
                id: userMe.id ?? prev.id,
                nickname: userMe.username ?? prev.nickname,
                email: userMe.email ?? prev.email,
                level: char?.level ?? prev.level,
                currentXp: char?.currentXp ?? prev.currentXp,
                nextLevelXp: char?.nextLevelXp ?? prev.nextLevelXp,
                coins: char?.coins ?? prev.coins,
                gems: char?.gems ?? prev.gems,
                attributes: char?.attributes ?? prev.attributes,
                biometrics: prof ? {
                  weightKg: prof.weightKg ?? prev.biometrics?.weightKg ?? 70,
                  heightCm: prof.heightCm ?? prev.biometrics?.heightCm ?? 170,
                  age: prof.age ?? prev.biometrics?.age ?? 25,
                  gender: prof.biologicalSex === 'female' ? 'female' : prof.biologicalSex === 'other' ? 'other' : 'male',
                  activityLevel: prof.activityLevel ?? prev.biometrics?.activityLevel ?? 'moderate',
                  primaryGoal: prof.primaryGoal ?? prev.biometrics?.primaryGoal ?? 'gain_muscle',
                  stressLevel: prof.stressLevel ?? prev.biometrics?.stressLevel ?? 5,
                  trainsRegularly: prof.trainsRegularly ?? prev.biometrics?.trainsRegularly ?? false,
                  livesInHotClimate: prof.livesInHotClimate ?? prev.biometrics?.livesInHotClimate ?? false,
                } : prev.biometrics,
              }));
            }
          }
        }

        // Load workout routines from backend
        const workoutRes = await client.GET('/workout', {});
        if (workoutRes.response.ok) {
          const backendRoutines = (await workoutRes.response.json()) as BackendWorkoutRoutine[];
          if (Array.isArray(backendRoutines) && backendRoutines.length > 0) {
            const mapped: WorkoutRoutine[] = backendRoutines.map((r) => ({
              id: r._id ?? r.id ?? `routine_${Math.random()}`,
              title: r.title,
              description: r.description ?? '',
              estimatedMinutes: r.estimatedMinutes ?? 45,
              targetMuscleGroups: r.targetMuscleGroups ?? [],
              exercises: r.exercises ?? [],
              completionCount: r.completionCount ?? 0,
              lastCompletedDate: r.lastCompletedDate ?? undefined,
            }));
            setRoutines(mapped);
          }
        }

        // Load workout logs
        const logsRes = await client.GET('/workout/logs/user', {});
        if (logsRes.response.ok) {
          const logs = (await logsRes.response.json()) as BackendWorkoutLog[];
          if (Array.isArray(logs) && logs.length > 0) {
            const mappedLogs: WorkoutLogEntry[] = logs.map((l) => ({
              id: l._id ?? l.id ?? `log_${Math.random()}`,
              routineId: l.routineId ?? '',
              routineTitle: l.routineTitle ?? l.routineName ?? 'Treino',
              date: l.completedAt
                ? new Date(l.completedAt).toLocaleString('pt-BR')
                : new Date().toLocaleString('pt-BR'),
              durationMinutes: l.durationMinutes ?? 0,
              totalVolumeKg: l.totalVolumeKg ?? 0,
              totalSetsCompleted: l.totalSetsCompleted ?? l.totalSets ?? 0,
              xpEarned: l.xpEarned ?? l.xpGained ?? 0,
              coinsEarned: l.coinsEarned ?? l.coinsGained ?? 0,
              exerciseLogs: (l.exerciseLogs ?? l.exercises ?? []).map((e) => ({
                exerciseName: e.exerciseName,
                maxWeightKg: e.maxWeightKg ?? 0,
                completedSetsCount: e.completedSetsCount ?? 0,
              })),
            }));
            setWorkoutLogs((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newBackendLogs = mappedLogs.filter((item) => !existingIds.has(item.id));
              return [...newBackendLogs, ...prev];
            });
          }
        }
      } catch (err: unknown) {
        console.warn('Backend initial fetch info:', err instanceof Error ? err.message : err);
      }
    }
    loadBackendData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate({ to: '/login' });
  };

  // Nutrition Handlers
  const handleAddLoggedFood = (food: LoggedFoodItem) => {
    setLoggedFoods((prev) => [food, ...prev]);
  };

  const handleRemoveLoggedFood = (id: string) => {
    setLoggedFoods((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateDailyGoals = (goals: DailyNutritionGoals) => {
    setDailyNutritionGoals(goals);
  };

  // Check XP for Level-Up
  const handleXPCheck = (newProfile: UserProfile) => {
    if (newProfile.currentXp >= newProfile.nextLevelXp) {
      const oldLevel = newProfile.level;
      const newLevel = oldLevel + 1;
      const newRank = calculateRank(newLevel);
      const updatedNextLevelXp = newProfile.nextLevelXp + 350;

      const upgradedProfile: UserProfile = {
        ...newProfile,
        level: newLevel,
        rank: newRank,
        currentXp: newProfile.currentXp - newProfile.nextLevelXp,
        nextLevelXp: updatedNextLevelXp,
        attributes: {
          strength: newProfile.attributes.strength + 3,
          intelligence: newProfile.attributes.intelligence + 3,
          vitality: newProfile.attributes.vitality + 3,
          focus: newProfile.attributes.focus + 3,
        },
      };

      soundFx.playLevelUp();
      setLevelUpModalData({ oldLevel, newLevel });
      return upgradedProfile;
    }
    return newProfile;
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...updated };
      return handleXPCheck(merged);
    });
  };

  // Toggle Sound Mute
  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  // Quests Logic: Toggle Complete
  const handleToggleQuestComplete = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;
        const newCompleted = !q.completed;

        if (newCompleted) {
          // Award XP and Coins
          handleUpdateProfile({
            currentXp: profile.currentXp + q.xpReward,
            coins: profile.coins + q.coinReward,
            gems: profile.gems + (q.gemReward || 0),
            attributes: {
              ...profile.attributes,
              [q.attributeReward]:
                profile.attributes[q.attributeReward] + 2,
            },
          });
        }

        return {
          ...q,
          completed: newCompleted,
          streak: newCompleted && q.category === 'daily' ? q.streak + 1 : q.streak,
        };
      })
    );
  };

  // Create Quest
  const handleCreateQuest = (newQuest: Quest) => {
    setQuests((prev) => [newQuest, ...prev]);
  };

  // Delete Quest
  const handleDeleteQuest = (questId: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  // Gym Logic: Save or Update Routine (synced to backend)
  const handleSaveRoutine = async (routineToSave: WorkoutRoutine) => {
    const isNew = routineToSave.id.startsWith('routine_') || routineToSave.id.startsWith('temp_');

    if (isNew) {
      setRoutines((prev) => [routineToSave, ...prev]);
      try {
        const { id: _id, ...payload } = routineToSave;
        const { data: saved } = await client.POST('/workout', { body: payload as any });
        if (saved) {
          const savedId = (saved as any)._id ?? (saved as any).id;
          setRoutines((prev) =>
            prev.map((r) => (r.id === routineToSave.id ? { ...routineToSave, id: savedId } : r))
          );
        }
      } catch (err: unknown) {
        console.warn('Failed to save routine to backend:', err instanceof Error ? err.message : err);
      }
    } else {
      setRoutines((prev) =>
        prev.map((r) => (r.id === routineToSave.id ? routineToSave : r))
      );
      try {
        const { id: _id, ...payload } = routineToSave;
        await client.PUT('/workout/{id}', { params: { path: { id: routineToSave.id } }, body: payload as any });
      } catch (err: unknown) {
        console.warn('Failed to update routine on backend:', err instanceof Error ? err.message : err);
      }
    }
  };

  // Gym Logic: Delete Routine (synced to backend)
  const handleDeleteRoutine = async (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    try {
      await client.DELETE('/workout/{id}', { params: { path: { id: routineId } } });
    } catch (err: unknown) {
      console.warn('Failed to delete routine on backend:', err instanceof Error ? err.message : err);
    }
  };

  // Gym Logic: Finish Active Workout Session
  const handleFinishWorkoutSession = (
    routine: WorkoutRoutine,
    durationMinutes: number,
    xpEarned: number,
    coinsEarned: number
  ) => {
    const nowStr = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    let totalVolume = 0;
    let completedSetsCount = 0;

    routine.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          completedSetsCount++;
          totalVolume += s.weightKg * s.reps;
        }
      });
    });

    // Create Workout Log Entry
    const newLog: WorkoutLogEntry = {
      id: `log_${Date.now()}`,
      routineId: routine.id,
      routineTitle: routine.title,
      date: nowStr,
      durationMinutes,
      totalVolumeKg: totalVolume,
      totalSetsCompleted: completedSetsCount,
      xpEarned,
      coinsEarned,
      exerciseLogs: routine.exercises.map((ex) => ({
        exerciseName: ex.name,
        maxWeightKg: Math.max(...ex.sets.map((s) => s.weightKg), 0),
        completedSetsCount: ex.sets.filter((s) => s.completed).length,
      })),
    };

    setWorkoutLogs((prev) => [newLog, ...prev]);

    // Send workout log to NestJS backend
    client.POST('/workout/logs', { body: newLog as any }).catch((err: unknown) => {
      console.warn('Backend workout log sync warning:', err instanceof Error ? err.message : err);
    });

    client.POST('/character/xp', { body: { userId: profile.id, xpGained: xpEarned, coinsGained: coinsEarned } }).catch((err: unknown) => {
      console.warn('Backend character XP sync warning:', err instanceof Error ? err.message : err);
    });

    // Update Historical Progression Data for Recharts
    setHistoricalData((prev) => {
      const updated = { ...prev };
      const dateShort = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });

      routine.exercises.forEach((ex) => {
        const maxWeight = Math.max(...ex.sets.map((s) => s.weightKg), 0);
        if (maxWeight > 0) {
          const exHistory = updated[ex.name] || [];
          const estimated1RM = Math.round(maxWeight * 1.2);
          updated[ex.name] = [
            ...exHistory,
            {
              date: dateShort,
              weightKg: maxWeight,
              reps: 8,
              estimatedOneRepMax: estimated1RM,
            },
          ];
        }
      });

      return updated;
    });

    // Reward Player with Strength XP and Coins
    handleUpdateProfile({
      currentXp: profile.currentXp + xpEarned,
      coins: profile.coins + coinsEarned,
      attributes: {
        ...profile.attributes,
        strength: profile.attributes.strength + 5,
      },
    });
  };

  // Shop Logic: Buy Item
  const handleBuyShopItem = (item: ShopItem) => {
    if (ownedItemIds.includes(item.id)) return;

    if (item.priceCoins !== undefined && profile.coins >= item.priceCoins) {
      handleUpdateProfile({ coins: profile.coins - item.priceCoins });
      setOwnedItemIds((prev) => [...prev, item.id]);
      handleEquipShopItem(item);
    } else if (item.priceGems !== undefined && profile.gems >= item.priceGems) {
      handleUpdateProfile({ gems: profile.gems - item.priceGems });
      setOwnedItemIds((prev) => [...prev, item.id]);
      handleEquipShopItem(item);
    }
  };

  // Shop Logic: Equip Item
  const handleEquipShopItem = (item: ShopItem) => {
    if (item.type === 'skin') {
      handleUpdateProfile({ equippedSkinId: item.id });
    } else if (item.type === 'theme') {
      handleUpdateProfile({ equippedThemeId: item.id });
    } else if (item.type === 'border') {
      handleUpdateProfile({ equippedBorderId: item.id });
    } else if (item.type === 'title') {
      handleUpdateProfile({ equippedTitle: item.name });
    }
  };

  const pendingQuestsCount = quests.filter((q) => !q.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      {/* Top Header */}
      <Header
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Responsive Side / Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingQuestsCount={pendingQuestsCount}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <HunterDashboard
              profile={profile}
              quests={quests}
              onUpdateProfile={handleUpdateProfile}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'workout' && (
            <WorkoutModule
              routines={routines}
              workoutLogs={workoutLogs}
              historicalData={historicalData}
              profile={profile}
              onSaveRoutine={handleSaveRoutine}
              onDeleteRoutine={handleDeleteRoutine}
              onFinishWorkoutSession={handleFinishWorkoutSession}
            />
          )}

          {activeTab === 'nutrition' && (
            <NutritionModule
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              loggedFoods={loggedFoods}
              onAddLoggedFood={handleAddLoggedFood}
              onRemoveLoggedFood={handleRemoveLoggedFood}
              dailyGoals={dailyNutritionGoals}
              onUpdateDailyGoals={handleUpdateDailyGoals}
            />
          )}

          {activeTab === 'guidelines' && (
            <GuidelinesModule
              profile={profile}
              quests={quests}
              onUpdateProfile={handleUpdateProfile}
              onCreateQuest={handleCreateQuest}
            />
          )}

          {activeTab === 'quests' && (
            <QuestsModule
              quests={quests}
              onToggleQuestComplete={handleToggleQuestComplete}
              onCreateQuest={handleCreateQuest}
              onDeleteQuest={handleDeleteQuest}
            />
          )}

          {activeTab === 'shop' && (
            <ShopModule
              shopItems={shopItems}
              profile={profile}
              ownedItemIds={ownedItemIds}
              onBuyItem={handleBuyShopItem}
              onEquipItem={handleEquipShopItem}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Level Up Celebration Modal */}
      {levelUpModalData && (
        <LevelUpModal
          profile={profile}
          oldLevel={levelUpModalData.oldLevel}
          newLevel={levelUpModalData.newLevel}
          onClose={() => setLevelUpModalData(null)}
        />
      )}
    </div>
  );
}
