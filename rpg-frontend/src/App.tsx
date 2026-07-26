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
import {
  DEFAULT_PROFILE,
  DEFAULT_ROUTINES,
  DEFAULT_QUESTS,
  DEFAULT_SHOP_ITEMS,
  DEFAULT_HISTORICAL_EXERCISES,
  DEFAULT_WORKOUT_LOGS,
  DEFAULT_LOGGED_FOODS,
  DEFAULT_NUTRITION_GOALS,
  loadFromStorage,
  saveToStorage,
  calculateRank,
} from './utils/storage';
import { soundFx } from './utils/audio';
import { useNavigate } from '@tanstack/react-router';
import { workoutLogApi, workoutApi, characterApi, profileApi } from './services/api';

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

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Core State with localStorage persistence
  const [profile, setProfile] = useState<UserProfile>(() =>
    loadFromStorage('life_rpg_profile_v1', DEFAULT_PROFILE)
  );
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() =>
    loadFromStorage('life_rpg_routines_v1', DEFAULT_ROUTINES)
  );
  const [quests, setQuests] = useState<Quest[]>(() =>
    loadFromStorage('life_rpg_quests_v1', DEFAULT_QUESTS)
  );
  const [shopItems] = useState<ShopItem[]>(() =>
    loadFromStorage('life_rpg_shop_items_v1', DEFAULT_SHOP_ITEMS)
  );
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>(() =>
    loadFromStorage('life_rpg_owned_items_v1', [
      'skin_default',
      'theme_obsidian',
      'border_default',
    ])
  );
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>(() =>
    loadFromStorage('life_rpg_workout_logs_v1', DEFAULT_WORKOUT_LOGS)
  );
  const [historicalData, setHistoricalData] = useState<
    Record<string, HistoricalExerciseData[]>
  >(() =>
    loadFromStorage('life_rpg_historical_v1', DEFAULT_HISTORICAL_EXERCISES)
  );
  const [loggedFoods, setLoggedFoods] = useState<LoggedFoodItem[]>(() =>
    loadFromStorage('life_rpg_logged_foods_v1', DEFAULT_LOGGED_FOODS)
  );
  const [dailyNutritionGoals, setDailyNutritionGoals] = useState<DailyNutritionGoals>(() =>
    loadFromStorage('life_rpg_nutrition_goals_v1', DEFAULT_NUTRITION_GOALS)
  );

  // Level Up Modal State
  const [levelUpModalData, setLevelUpModalData] = useState<{
    oldLevel: number;
    newLevel: number;
  } | null>(null);

  // Save to LocalStorage on state changes
  useEffect(() => {
    saveToStorage('life_rpg_profile_v1', profile);
  }, [profile]);

  useEffect(() => {
    saveToStorage('life_rpg_routines_v1', routines);
  }, [routines]);

  useEffect(() => {
    saveToStorage('life_rpg_quests_v1', quests);
  }, [quests]);

  useEffect(() => {
    saveToStorage('life_rpg_owned_items_v1', ownedItemIds);
  }, [ownedItemIds]);

  useEffect(() => {
    saveToStorage('life_rpg_workout_logs_v1', workoutLogs);
  }, [workoutLogs]);

  useEffect(() => {
    saveToStorage('life_rpg_historical_v1', historicalData);
  }, [historicalData]);

  useEffect(() => {
    saveToStorage('life_rpg_logged_foods_v1', loggedFoods);
  }, [loggedFoods]);

  useEffect(() => {
    saveToStorage('life_rpg_nutrition_goals_v1', dailyNutritionGoals);
  }, [dailyNutritionGoals]);

  // Fetch initial data from NestJS backend if logged in
  useEffect(() => {
    async function loadBackendData() {
      try {
        // Load profile biometrics
        const backendProfile = await profileApi.getProfile().catch(() => null);
        if (backendProfile) {
          setProfile((prev) => ({
            ...prev,
            biometrics: {
              weightKg: backendProfile.weightKg || prev.biometrics?.weightKg || 75,
              heightCm: backendProfile.heightCm || prev.biometrics?.heightCm || 178,
              age: backendProfile.age || prev.biometrics?.age || 28,
              gender: backendProfile.biologicalSex === 'female' ? 'female' : 'male',
              activityLevel: backendProfile.activityLevel || prev.biometrics?.activityLevel || 'moderate',
              primaryGoal: backendProfile.primaryGoal || prev.biometrics?.primaryGoal || 'gain_muscle',
              stressLevel: backendProfile.stressLevel ?? prev.biometrics?.stressLevel ?? 5,
            },
          }));
        }

        // Load workout routines from backend (source of truth)
        const backendRoutines = await workoutApi.list().catch(() => null);
        if (backendRoutines && backendRoutines.length > 0) {
          const mapped: WorkoutRoutine[] = backendRoutines.map((r) => ({
            id: r._id ?? r.id,
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

        // Load workout logs
        const logs = await workoutLogApi.getLogs().catch(() => null);
        if (logs && logs.length > 0) {
          const mappedLogs: WorkoutLogEntry[] = logs.map((l: any) => ({
            id: l._id || l.id,
            routineId: l.routineId || '',
            routineTitle: l.routineTitle || l.routineName || 'Treino',
            date: l.completedAt
              ? new Date(l.completedAt).toLocaleString('pt-BR')
              : new Date().toLocaleString('pt-BR'),
            durationMinutes: l.durationMinutes || 0,
            totalVolumeKg: l.totalVolumeKg || 0,
            totalSetsCompleted: l.totalSetsCompleted || l.totalSets || 0,
            xpEarned: l.xpEarned || l.xpGained || 0,
            coinsEarned: l.coinsEarned || l.coinsGained || 0,
            exerciseLogs: (l.exerciseLogs || l.exercises || []).map((e: any) => ({
              exerciseName: e.exerciseName,
              maxWeightKg: e.maxWeightKg || 0,
              completedSetsCount: e.completedSetsCount || 0,
            })),
          }));
          setWorkoutLogs((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newBackendLogs = mappedLogs.filter((item) => !existingIds.has(item.id));
            return [...newBackendLogs, ...prev];
          });
        }
      } catch (err: any) {
        console.warn('Backend initial fetch info:', err.message);
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
      // Optimistic: add immediately with temp id
      setRoutines((prev) => [routineToSave, ...prev]);
      try {
        const { id: _id, ...payload } = routineToSave;
        const saved = await workoutApi.create(payload);
        // Replace temp id with real backend _id
        setRoutines((prev) =>
          prev.map((r) => (r.id === routineToSave.id ? { ...saved, id: saved._id } : r))
        );
      } catch (err: any) {
        console.warn('Failed to save routine to backend:', err.message);
      }
    } else {
      // Optimistic update
      setRoutines((prev) =>
        prev.map((r) => (r.id === routineToSave.id ? routineToSave : r))
      );
      try {
        const { id: _id, ...payload } = routineToSave;
        await workoutApi.update(routineToSave.id, payload);
      } catch (err: any) {
        console.warn('Failed to update routine on backend:', err.message);
      }
    }
  };

  // Gym Logic: Delete Routine (synced to backend)
  const handleDeleteRoutine = async (routineId: string) => {
    // Optimistic remove
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    try {
      await workoutApi.delete(routineId);
    } catch (err: any) {
      console.warn('Failed to delete routine on backend:', err.message);
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
    workoutLogApi.createLog(newLog).catch((err: any) => {
      console.warn('Backend workout log sync warning:', err.message);
    });

    characterApi.addXp({ xpGained: xpEarned, coinsGained: coinsEarned }).catch((err: any) => {
      console.warn('Backend character XP sync warning:', err.message);
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

  // Developer Reset Demo Data
  const handleResetData = () => {
    setProfile(DEFAULT_PROFILE);
    setRoutines(DEFAULT_ROUTINES);
    setQuests(DEFAULT_QUESTS);
    setOwnedItemIds(['skin_default', 'theme_obsidian', 'border_default']);
    setWorkoutLogs(DEFAULT_WORKOUT_LOGS);
    setHistoricalData(DEFAULT_HISTORICAL_EXERCISES);
    soundFx.playCoin();
  };

  // Add Test Resources
  const handleAddDevResources = () => {
    handleUpdateProfile({
      currentXp: profile.currentXp + 500,
      coins: profile.coins + 500,
      gems: profile.gems + 50,
    });
    soundFx.playLevelUp();
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
              onResetData={handleResetData}
              onAddDevResources={handleAddDevResources}
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
