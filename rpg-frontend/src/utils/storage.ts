import {
  UserProfile,
  WorkoutRoutine,
  Quest,
  ShopItem,
  WorkoutLogEntry,
  HistoricalExerciseData,
  LoggedFoodItem,
  DailyNutritionGoals,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'life_rpg_profile_v1',
  ROUTINES: 'life_rpg_routines_v1',
  QUESTS: 'life_rpg_quests_v1',
  SHOP_ITEMS: 'life_rpg_shop_items_v1',
  WORKOUT_LOGS: 'life_rpg_workout_logs_v1',
  HISTORICAL_EXERCISES: 'life_rpg_historical_exercises_v1',
  LOGGED_FOODS: 'life_rpg_logged_foods_v1',
  NUTRITION_GOALS: 'life_rpg_nutrition_goals_v1',
};

export const DEFAULT_NUTRITION_GOALS: DailyNutritionGoals = {
  targetCalories: 2200,
  targetProteinGrams: 150,
  targetCarbsGrams: 250,
  targetFatGrams: 65,
};

export const DEFAULT_LOGGED_FOODS: LoggedFoodItem[] = [
  {
    id: 'logged_demo_1',
    foodId: 'food_2',
    foodName: 'Ovo de Galinha Cozido',
    source: 'Tabela TACO',
    mealCategory: 'breakfast',
    amountGrams: 150,
    calories: 219,
    protein: 20.0,
    carbs: 0.9,
    fat: 14.3,
    addedAt: '08:15',
  },
  {
    id: 'logged_demo_2',
    foodId: 'food_11',
    foodName: 'Pão Francês',
    source: 'Tabela TACO',
    mealCategory: 'breakfast',
    amountGrams: 50,
    calories: 150,
    protein: 4.0,
    carbs: 29.3,
    fat: 1.6,
    addedAt: '08:16',
  },
  {
    id: 'logged_demo_3',
    foodId: 'food_1',
    foodName: 'Peito de Frango Grelhado',
    source: 'Tabela TACO',
    mealCategory: 'lunch',
    amountGrams: 150,
    calories: 239,
    protein: 48.0,
    carbs: 0.0,
    fat: 3.8,
    addedAt: '12:45',
  },
  {
    id: 'logged_demo_4',
    foodId: 'food_7',
    foodName: 'Arroz Branco Cozido',
    source: 'Tabela TACO',
    mealCategory: 'lunch',
    amountGrams: 150,
    calories: 192,
    protein: 3.8,
    carbs: 42.2,
    fat: 0.3,
    addedAt: '12:46',
  },
  {
    id: 'logged_demo_5',
    foodId: 'food_15',
    foodName: 'Banana Prata',
    source: 'Tabela TACO',
    mealCategory: 'snack',
    amountGrams: 120,
    calories: 118,
    protein: 1.6,
    carbs: 31.2,
    fat: 0.1,
    addedAt: '16:30',
  },
];


export const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_001',
  name: 'Caçador Principal',
  nickname: 'Shadow Hunter',
  title: 'Caçador Rank E',
  rank: 'E',
  level: 14,
  currentXp: 680,
  nextLevelXp: 1200,
  coins: 450,
  gems: 125,
  attributes: {
    strength: 28,
    intelligence: 22,
    vitality: 25,
    focus: 30,
  },
  equippedSkinId: 'skin_default',
  equippedThemeId: 'theme_obsidian',
  equippedBorderId: 'border_default',
  equippedTitle: 'Caçador Rank E',
  streakDays: 7,
  lastActiveDate: new Date().toISOString().split('T')[0],
  waterIntakeMl: 1750,
  dailyWaterGoalMl: 2500,
  biometrics: {
    weightKg: 75,
    heightCm: 178,
    age: 28,
    gender: 'male',
    activityLevel: 'moderate',
    primaryGoal: 'gain_muscle',
    stressLevel: 5,
  },
};

export const DEFAULT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine_a',
    title: 'Treino A - Peito & Tríceps',
    description: 'Hipertrofia e força máxima para peitoral e tríceps com acompanhamento de carga.',
    estimatedMinutes: 50,
    targetMuscleGroups: ['Peito', 'Tríceps', 'Ombros'],
    completionCount: 12,
    lastCompletedDate: '2026-07-20',
    exercises: [
      {
        id: 'ex_supino_reto',
        name: 'Supino Reto com Barra',
        category: 'Peito',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 70, reps: 10, completed: false },
          { id: 's2', setNumber: 2, weightKg: 75, reps: 8, completed: false },
          { id: 's3', setNumber: 3, weightKg: 80, reps: 6, completed: false },
          { id: 's4', setNumber: 4, weightKg: 80, reps: 6, completed: false },
        ],
      },
      {
        id: 'ex_supino_inc',
        name: 'Supino Inclinado com Halteres',
        category: 'Peito',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 24, reps: 10, completed: false },
          { id: 's2', setNumber: 2, weightKg: 26, reps: 10, completed: false },
          { id: 's3', setNumber: 3, weightKg: 28, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex_triceps_pulley',
        name: 'Tríceps Pulley com Corda',
        category: 'Braços',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 35, reps: 12, completed: false },
          { id: 's2', setNumber: 2, weightKg: 40, reps: 10, completed: false },
          { id: 's3', setNumber: 3, weightKg: 45, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex_triceps_testa',
        name: 'Tríceps Testa com Barra W',
        category: 'Braços',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 20, reps: 10, completed: false },
          { id: 's2', setNumber: 2, weightKg: 24, reps: 10, completed: false },
          { id: 's3', setNumber: 3, weightKg: 28, reps: 8, completed: false },
        ],
      },
    ],
  },
  {
    id: 'routine_b',
    title: 'Treino B - Costas & Bíceps',
    description: 'Foco em dorsal espessa e bíceps volumosos com estímulo de alta intensidade.',
    estimatedMinutes: 55,
    targetMuscleGroups: ['Costas', 'Bíceps', 'Trapézio'],
    completionCount: 10,
    lastCompletedDate: '2026-07-18',
    exercises: [
      {
        id: 'ex_puxada_front',
        name: 'Puxada Frontal Pulley',
        category: 'Costas',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 50, reps: 12, completed: false },
          { id: 's2', setNumber: 2, weightKg: 55, reps: 10, completed: false },
          { id: 's3', setNumber: 3, weightKg: 60, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex_remada_curv',
        name: 'Remada Curvada com Barra',
        category: 'Costas',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 50, reps: 10, completed: false },
          { id: 's2', setNumber: 2, weightKg: 60, reps: 8, completed: false },
          { id: 's3', setNumber: 3, weightKg: 65, reps: 6, completed: false },
        ],
      },
      {
        id: 'ex_rosca_dir',
        name: 'Rosca Direta na Barra W',
        category: 'Braços',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 20, reps: 12, completed: false },
          { id: 's2', setNumber: 2, weightKg: 25, reps: 10, completed: false },
          { id: 's3', setNumber: 3, weightKg: 30, reps: 8, completed: false },
        ],
      },
    ],
  },
  {
    id: 'routine_c',
    title: 'Treino C - Pernas & Ombros',
    description: 'Construção muscular de quadríceps, posterior e deltoides.',
    estimatedMinutes: 60,
    targetMuscleGroups: ['Pernas', 'Ombros', 'Abdômen'],
    completionCount: 8,
    lastCompletedDate: '2026-07-15',
    exercises: [
      {
        id: 'ex_agachamento',
        name: 'Agachamento Livre com Barra',
        category: 'Pernas',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 80, reps: 10, completed: false },
          { id: 's2', setNumber: 2, weightKg: 95, reps: 8, completed: false },
          { id: 's3', setNumber: 3, weightKg: 110, reps: 6, completed: false },
          { id: 's4', setNumber: 4, weightKg: 120, reps: 5, completed: false },
        ],
      },
      {
        id: 'ex_elev_lat',
        name: 'Elevação Lateral com Halteres',
        category: 'Ombros',
        primaryAttribute: 'strength',
        sets: [
          { id: 's1', setNumber: 1, weightKg: 10, reps: 15, completed: false },
          { id: 's2', setNumber: 2, weightKg: 12, reps: 12, completed: false },
          { id: 's3', setNumber: 3, weightKg: 14, reps: 10, completed: false },
        ],
      },
    ],
  },
];

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'q_daily_water',
    title: 'Consumo de Água (2.5 Litros)',
    description: 'Mantenha as células hidratadas para otimizar o ganho de Vitalidade.',
    category: 'daily',
    attributeReward: 'vitality',
    xpReward: 60,
    coinReward: 25,
    difficulty: 'Fácil',
    completed: false,
    streak: 6,
    frequency: 'daily',
  },
  {
    id: 'q_daily_workout',
    title: 'Treino da Academia do Caçador',
    description: 'Conclua ao menos 1 sessão de treino no módulo de musculação.',
    category: 'daily',
    attributeReward: 'strength',
    xpReward: 120,
    coinReward: 50,
    difficulty: 'Média',
    completed: true,
    streak: 7,
    frequency: 'daily',
  },
  {
    id: 'q_daily_reading',
    title: 'Sessão de Estudo / Leitura (30 min)',
    description: 'Expanda sua mente lendo livros técnicos ou praticando programação.',
    category: 'daily',
    attributeReward: 'intelligence',
    xpReward: 80,
    coinReward: 35,
    difficulty: 'Fácil',
    completed: false,
    streak: 4,
    frequency: 'daily',
  },
  {
    id: 'q_daily_focus',
    title: 'Bloco de Trabalho Profundo (2 Horas)',
    description: 'Elimine distrações e complete suas metas de alta prioridade.',
    category: 'daily',
    attributeReward: 'focus',
    xpReward: 100,
    coinReward: 40,
    difficulty: 'Média',
    completed: false,
    streak: 5,
    frequency: 'weekdays',
  },
  {
    id: 'q_todo_project',
    title: 'Finalizar Projeto de Arquitetura Frontend',
    description: 'Implementar e testar todos os componentes da interface do aplicativo.',
    category: 'todo',
    attributeReward: 'focus',
    xpReward: 250,
    coinReward: 100,
    gemReward: 10,
    difficulty: 'Difícil',
    dueDate: '2026-07-25',
    completed: false,
    streak: 0,
  },
  {
    id: 'q_todo_marmitas',
    title: 'Preparar Marmitas Anabólicas da Semana',
    description: 'Cozinhar frango, arroz e vegetais para manter a dieta 100% alinhada.',
    category: 'todo',
    attributeReward: 'vitality',
    xpReward: 180,
    coinReward: 70,
    difficulty: 'Média',
    dueDate: '2026-07-24',
    completed: false,
    streak: 0,
  },
  {
    id: 'q_penalty_emergency',
    title: 'Missão Emergencial: 50 Flexões ou 10k Passos',
    description: 'Penalidade do Sistema por faltar ao treino na semana anterior. Complete para recuperar honra.',
    category: 'penalty',
    attributeReward: 'strength',
    xpReward: 300,
    coinReward: 120,
    gemReward: 15,
    difficulty: 'Épica',
    completed: false,
    streak: 0,
  },
];

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'skin_default',
    name: 'Caçador Urbano',
    description: 'Aparência padrão de um caçador em início de jornada no Rank E.',
    type: 'skin',
    priceCoins: 0,
    rarity: 'Comum',
    previewColor: '#3B82F6',
    effectDescription: 'Sem bônus extra',
  },
  {
    id: 'skin_shadow_monarch',
    name: 'Monarca das Sombras',
    description: 'Invocação lendária envolta em chamas negras e aura azul elétrica.',
    type: 'skin',
    priceCoins: 800,
    rarity: 'Lendário',
    previewColor: '#8B5CF6',
    effectDescription: 'Efeito de aura de sombras pulsante no avatar',
  },
  {
    id: 'skin_cyber_hunter',
    name: 'Guerreiro Ciberpunk',
    description: 'Armadura futurista com visores neon e circuitos integrados.',
    type: 'skin',
    priceCoins: 500,
    rarity: 'Épico',
    previewColor: '#00F0FF',
    effectDescription: 'Aura neon ciano com brilho futurista',
  },
  {
    id: 'skin_golden_knight',
    name: 'Cavaleiro Dourado Rank S',
    description: 'Sua autoridade é inquestionável. Revestimento de ouro purificado.',
    type: 'skin',
    priceGems: 100,
    rarity: 'Lendário',
    previewColor: '#F59E0B',
    effectDescription: 'Partículas douradas e coroa reluzente',
  },
  {
    id: 'theme_obsidian',
    name: 'Obsidian Neon',
    description: 'Tema padrão com contraste preto azulado e acentos ciano elétrico.',
    type: 'theme',
    priceCoins: 0,
    rarity: 'Comum',
    previewColor: '#0F172A',
  },
  {
    id: 'theme_shadow_solo',
    name: 'Shadow Solo',
    description: 'Atmosfera roxa sombria inspirada no exército de sombras.',
    type: 'theme',
    priceCoins: 350,
    rarity: 'Épico',
    previewColor: '#4C1D95',
  },
  {
    id: 'theme_gold_rank_s',
    name: 'Imperial Gold',
    description: 'Aparência de prestígio para caçadores do topo do ranking.',
    type: 'theme',
    priceGems: 50,
    rarity: 'Lendário',
    previewColor: '#78350F',
  },
  {
    id: 'border_default',
    name: 'Borda Padrão',
    description: 'Moldura de caçador iniciante.',
    type: 'border',
    priceCoins: 0,
    rarity: 'Comum',
  },
  {
    id: 'border_shadow',
    name: 'Borda das Sombras',
    description: 'Emite tentáculos visuais de sombra ao redor do avatar.',
    type: 'border',
    priceCoins: 300,
    rarity: 'Raro',
  },
  {
    id: 'border_imperial',
    name: 'Moldura Imperial Rank S',
    description: 'Moldura de platina cravejada de pedras preciosas.',
    type: 'border',
    priceGems: 40,
    rarity: 'Lendário',
  },
  {
    id: 'title_shadow_monarch',
    name: 'Monarca das Sombras',
    description: 'Título lendário para quem domina a própria vida.',
    type: 'title',
    priceGems: 75,
    rarity: 'Lendário',
  },
  {
    id: 'title_gym_legend',
    name: 'Lenda da Academia',
    description: 'Dado àqueles com disciplina inabalável nos ferros.',
    type: 'title',
    priceCoins: 400,
    rarity: 'Épico',
  },
];

export const DEFAULT_HISTORICAL_EXERCISES: Record<string, HistoricalExerciseData[]> = {
  'Supino Reto com Barra': [
    { date: '10/Jun', weightKg: 60, reps: 10, estimatedOneRepMax: 80 },
    { date: '20/Jun', weightKg: 65, reps: 10, estimatedOneRepMax: 86 },
    { date: '01/Jul', weightKg: 70, reps: 8, estimatedOneRepMax: 88 },
    { date: '10/Jul', weightKg: 75, reps: 8, estimatedOneRepMax: 95 },
    { date: '20/Jul', weightKg: 80, reps: 6, estimatedOneRepMax: 96 },
  ],
  'Agachamento Livre com Barra': [
    { date: '10/Jun', weightKg: 80, reps: 10, estimatedOneRepMax: 106 },
    { date: '20/Jun', weightKg: 90, reps: 10, estimatedOneRepMax: 120 },
    { date: '01/Jul', weightKg: 100, reps: 8, estimatedOneRepMax: 126 },
    { date: '10/Jul', weightKg: 110, reps: 6, estimatedOneRepMax: 132 },
    { date: '20/Jul', weightKg: 120, reps: 5, estimatedOneRepMax: 140 },
  ],
  'Puxada Frontal Pulley': [
    { date: '10/Jun', weightKg: 40, reps: 12, estimatedOneRepMax: 56 },
    { date: '20/Jun', weightKg: 45, reps: 10, estimatedOneRepMax: 60 },
    { date: '01/Jul', weightKg: 50, reps: 10, estimatedOneRepMax: 66 },
    { date: '10/Jul', weightKg: 55, reps: 8, estimatedOneRepMax: 70 },
    { date: '20/Jul', weightKg: 60, reps: 8, estimatedOneRepMax: 76 },
  ],
};

export const DEFAULT_WORKOUT_LOGS: WorkoutLogEntry[] = [
  {
    id: 'log_01',
    routineId: 'routine_a',
    routineTitle: 'Treino A - Peito & Tríceps',
    date: '2026-07-20 18:30',
    durationMinutes: 48,
    totalVolumeKg: 3420,
    totalSetsCompleted: 10,
    xpEarned: 240,
    coinsEarned: 80,
    exerciseLogs: [
      { exerciseName: 'Supino Reto com Barra', maxWeightKg: 80, completedSetsCount: 4 },
      { exerciseName: 'Supino Inclinado com Halteres', maxWeightKg: 28, completedSetsCount: 3 },
      { exerciseName: 'Tríceps Pulley com Corda', maxWeightKg: 45, completedSetsCount: 3 },
    ],
  },
];

// Helper functions for LocalStorage
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

// Calculate Hunter Rank based on level
export function calculateRank(level: number): 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'Nível Monarca' {
  if (level >= 50) return 'Nível Monarca';
  if (level >= 40) return 'S';
  if (level >= 30) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}
