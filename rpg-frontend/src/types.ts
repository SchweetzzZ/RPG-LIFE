export type AttributeType = 'strength' | 'intelligence' | 'vitality' | 'focus';

export interface HunterAttributes {
  strength: number;
  intelligence: number;
  vitality: number;
  focus: number;
}

export interface BiometricProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';
  primaryGoal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'extreme_definition';
  stressLevel: number; // 0 - 10
  trainsRegularly: boolean;
  livesInHotClimate: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email?: string;
  title: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'Nível Monarca';
  level: number;
  currentXp: number;
  nextLevelXp: number;
  coins: number;
  gems: number;
  attributes: HunterAttributes;
  equippedSkinId: string;
  equippedThemeId: string;
  equippedBorderId: string;
  equippedTitle: string;
  streakDays: number;
  lastActiveDate: string;
  waterIntakeMl: number;
  dailyWaterGoalMl: number;
  biometrics?: BiometricProfile;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  rpe?: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços' | 'Abdômen' | 'Cardio' | 'Geral';
  primaryAttribute: AttributeType;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  targetMuscleGroups: string[];
  exercises: Exercise[];
  lastCompletedDate?: string;
  completionCount: number;
}

export interface WorkoutLogEntry {
  id: string;
  routineId: string;
  routineTitle: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  xpEarned: number;
  coinsEarned: number;
  exerciseLogs: {
    exerciseName: string;
    maxWeightKg: number;
    completedSetsCount: number;
  }[];
}

export interface HistoricalExerciseData {
  date: string;
  weightKg: number;
  reps: number;
  estimatedOneRepMax: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'todo' | 'penalty';
  attributeReward: AttributeType;
  xpReward: number;
  coinReward: number;
  gemReward?: number;
  difficulty: 'Fácil' | 'Média' | 'Difícil' | 'Épica';
  dueDate?: string;
  completed: boolean;
  streak: number;
  frequency?: 'daily' | 'weekly';
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'theme' | 'border' | 'title';
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  priceCoins?: number;
  priceGems?: number;
  description: string;
  previewColor?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  source: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  category: string;
}

export type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface LoggedFoodItem {
  id: string;
  foodId: string;
  foodName: string;
  source: string;
  mealCategory: MealCategory;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  addedAt: string;
}

export interface DailyNutritionGoals {
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
}
