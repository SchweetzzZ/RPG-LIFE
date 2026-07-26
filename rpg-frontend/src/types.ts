export type AttributeType = 'strength' | 'intelligence' | 'vitality' | 'focus';

export interface HunterAttributes {
  strength: number; // Força: Treinos e Exercícios
  intelligence: number; // Inteligência: Leitura e Estudos
  vitality: number; // Vitalidade: Água, Sono e Dieta
  focus: number; // Foco: Trabalho e Hábitos
}

export interface BiometricProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  primaryGoal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'extreme_definition';
  stressLevel: number; // 0 - 10
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

export interface AuthAccount {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  profile: UserProfile;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface Exercise {
  id: string;
  name: string;
  category: 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços' | 'Abdômen' | 'Cardio';
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
  totalVolumeKg: number; // Sum of weight * reps for completed sets
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
  streak: number; // Para hábitos diários
  lastCompletedDate?: string;
  frequency?: 'daily' | 'weekdays' | 'custom';
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'skin' | 'theme' | 'border' | 'title';
  priceCoins?: number;
  priceGems?: number;
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  previewImage?: string;
  previewColor?: string;
  effectDescription?: string;
}

export interface ActiveTheme {
  id: string;
  name: string;
  bgGradient: string;
  accentColor: string;
  cardBg: string;
  borderGlow: string;
}

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface FoodItem {
  id: string;
  name: string;
  source: 'Tabela TACO' | 'Open Food Facts' | 'Base Caçador';
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  category: 'Proteínas' | 'Carboidratos' | 'Gorduras' | 'Frutas' | 'Vegetais' | 'Suplementos' | 'Geral';
}

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

