import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { client } from '../../services/api';

/** Shape returned by the backend NutritionController GET /search */
interface ApiFoodItem {
  id?: string;
  name: string;
  source: string;
  nutrientsPer100g?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}
import {
  Apple,
  Search,
  Plus,
  Trash2,
  Flame,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Shield,
  Filter,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Info,
  Scale,
} from 'lucide-react';
import {
  FoodItem,
  LoggedFoodItem,
  MealCategory,
  DailyNutritionGoals,
  UserProfile,
} from '../../types';
import { TACO_FOOD_DATABASE } from '../../data/tacoFoods';
import { soundFx } from '../../utils/audio';

interface NutritionModuleProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  loggedFoods: LoggedFoodItem[];
  onAddLoggedFood: (food: LoggedFoodItem) => void;
  onRemoveLoggedFood: (id: string) => void;
  dailyGoals?: DailyNutritionGoals;
  onUpdateDailyGoals?: (goals: DailyNutritionGoals) => void;
}

export const NutritionModule: React.FC<NutritionModuleProps> = ({
  profile,
  onUpdateProfile,
  loggedFoods,
  onAddLoggedFood,
  onRemoveLoggedFood,
  dailyGoals = {
    targetCalories: 2200,
    targetProteinGrams: 150,
    targetCarbsGrams: 250,
    targetFatGrams: 65,
  },
  onUpdateDailyGoals,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todas');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('Todas');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Modal / Drawer state for adding food
  const [selectedFoodForModal, setSelectedFoodForModal] = useState<FoodItem | null>(null);
  const [targetMeal, setTargetMeal] = useState<MealCategory>('breakfast');
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Modal for Custom Food Creation
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState(100);
  const [customProtein, setCustomProtein] = useState(10);
  const [customCarbs, setCustomCarbs] = useState(10);
  const [customFat, setCustomFat] = useState(2);

  // Accordion Expand/Collapse States for the 4 Meals
  const [expandedMeals, setExpandedMeals] = useState<Record<MealCategory, boolean>>({
    breakfast: true,
    lunch: true,
    snack: true,
    dinner: true,
  });

  // Edit Goals Drawer
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editGoalsForm, setEditGoalsForm] = useState<DailyNutritionGoals>(dailyGoals);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Backend API search state
  const [apiFoods, setApiFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setApiFoods([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { response } = await client.GET('/search', { params: { query: { q: searchQuery } } });
        if (!response.ok) return;
        const items = (await response.json()) as ApiFoodItem[];
        const mapped: FoodItem[] = items.map((item) => ({
          id: item.id ?? `api_${Math.random()}`,
          name: item.name,
          source: item.source === 'OPEN_FOOD_FACTS' ? 'Open Food Facts' : 'Tabela TACO',
          caloriesPer100g: item.nutrientsPer100g?.calories ?? 0,
          proteinPer100g: item.nutrientsPer100g?.protein ?? 0,
          carbsPer100g: item.nutrientsPer100g?.carbs ?? 0,
          fatPer100g: item.nutrientsPer100g?.fat ?? 0,
          category: 'Geral',
        }));
        setApiFoods(mapped);
      } catch (err: unknown) {
        console.warn('Backend food search warning:', err instanceof Error ? err.message : err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered Food Results (Local + Backend API)
  const filteredFoodResults = useMemo(() => {
    if (!searchQuery.trim() && selectedCategoryFilter === 'Todas' && selectedSourceFilter === 'Todas') {
      return TACO_FOOD_DATABASE.slice(0, 8);
    }

    const localMatches = TACO_FOOD_DATABASE.filter((item) => {
      const matchesQuery = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesCategory =
        selectedCategoryFilter === 'Todas' || item.category === selectedCategoryFilter;
      const matchesSource =
        selectedSourceFilter === 'Todas' || item.source === selectedSourceFilter;
      return matchesQuery && matchesCategory && matchesSource;
    });

    // Merge API foods avoiding duplicates by name
    const existingNames = new Set(localMatches.map((f) => f.name.toLowerCase()));
    const uniqueApiFoods = apiFoods.filter((f) => !existingNames.has(f.name.toLowerCase()));

    return [...localMatches, ...uniqueApiFoods];
  }, [searchQuery, selectedCategoryFilter, selectedSourceFilter, apiFoods]);

  // Calculate Today's Macro Totals
  const totals = useMemo(() => {
    return loggedFoods.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [loggedFoods]);

  const remainingCalories = Math.max(0, dailyGoals.targetCalories - totals.calories);
  const caloriesPercent = Math.min(100, Math.round((totals.calories / dailyGoals.targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((totals.protein / dailyGoals.targetProteinGrams) * 100));
  const carbsPercent = Math.min(100, Math.round((totals.carbs / dailyGoals.targetCarbsGrams) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fat / dailyGoals.targetFatGrams) * 100));

  // Categorize Logged Foods by Meal
  const foodsByMeal = useMemo(() => {
    const map: Record<MealCategory, LoggedFoodItem[]> = {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    };
    loggedFoods.forEach((item) => {
      if (map[item.mealCategory]) {
        map[item.mealCategory].push(item);
      }
    });
    return map;
  }, [loggedFoods]);

  // Handle Opening Add Modal
  const handleOpenAddModal = (food: FoodItem, defaultMeal?: MealCategory) => {
    setSelectedFoodForModal(food);
    setPortionGrams(100);
    if (defaultMeal) {
      setTargetMeal(defaultMeal);
    }
    setIsSearchFocused(false);
  };

  // Calculated values for current modal selection
  const calculatedModalNutrition = useMemo(() => {
    if (!selectedFoodForModal) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const factor = portionGrams / 100;
    return {
      kcal: Math.round(selectedFoodForModal.caloriesPer100g * factor),
      protein: Number((selectedFoodForModal.proteinPer100g * factor).toFixed(1)),
      carbs: Number((selectedFoodForModal.carbsPer100g * factor).toFixed(1)),
      fat: Number((selectedFoodForModal.fatPer100g * factor).toFixed(1)),
    };
  }, [selectedFoodForModal, portionGrams]);

  // Save Food to Journal
  const handleConfirmAddFood = () => {
    if (!selectedFoodForModal) return;

    const newLoggedItem: LoggedFoodItem = {
      id: `logged_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      foodId: selectedFoodForModal.id,
      foodName: selectedFoodForModal.name,
      source: selectedFoodForModal.source,
      mealCategory: targetMeal,
      amountGrams: portionGrams,
      calories: calculatedModalNutrition.kcal,
      protein: calculatedModalNutrition.protein,
      carbs: calculatedModalNutrition.carbs,
      fat: calculatedModalNutrition.fat,
      addedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    onAddLoggedFood(newLoggedItem);
    soundFx.playQuestComplete();

    // Reward XP + Vitality
    onUpdateProfile({
      currentXp: profile.currentXp + 15,
      attributes: {
        ...profile.attributes,
        vitality: profile.attributes.vitality + 1,
      },
    });

    showToast(`+15 XP | Alimento registrado no ${mealInfoMap[targetMeal].label}!`);
    setSelectedFoodForModal(null);
  };

  // Custom Food Save
  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const customFood: FoodItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      source: 'Base Caçador',
      caloriesPer100g: Number(customKcal),
      proteinPer100g: Number(customProtein),
      carbsPer100g: Number(customCarbs),
      fatPer100g: Number(customFat),
      category: 'Geral',
    };

    handleOpenAddModal(customFood);
    setIsCustomFoodModalOpen(false);
    setCustomName('');
  };

  // Toggle Meal Accordion
  const toggleMealAccordion = (meal: MealCategory) => {
    setExpandedMeals((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  // Meal Info Map
  const mealInfoMap: Record<
    MealCategory,
    { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }
  > = {
    breakfast: {
      label: 'Café da Manhã',
      icon: Coffee,
      color: 'text-amber-400',
      bg: 'from-amber-950/40 to-slate-900/90 border-amber-800/40',
    },
    lunch: {
      label: 'Almoço',
      icon: Sun,
      color: 'text-emerald-400',
      bg: 'from-emerald-950/40 to-slate-900/90 border-emerald-800/40',
    },
    snack: {
      label: 'Lanche da Tarde',
      icon: Utensils,
      color: 'text-purple-400',
      bg: 'from-purple-950/40 to-slate-900/90 border-purple-800/40',
    },
    dinner: {
      label: 'Jantar',
      icon: Moon,
      color: 'text-cyan-400',
      bg: 'from-cyan-950/40 to-slate-900/90 border-cyan-800/40',
    },
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-cyan-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-300"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. CABEÇALHO DA TELA (RESUMO DE MACROS DIÁRIOS) */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Apple className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                COMBUSTÍVEL DO CAÇADOR
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-wide flex items-center gap-2">
              Diário de Nutrição
            </h1>
            <p className="text-xs text-slate-400">
              Monitore suas calorias e macronutrientes para potencializar seu treino e subir de nível.
            </p>
          </div>

          <button
            onClick={() => setIsEditingGoals(true)}
            className="self-start sm:self-center px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-cyan-400 transition flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Ajustar Metas
          </button>
        </div>

        {/* Calorias Restantes Highlight Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Main Calorie Ring Card */}
          <div className="md:col-span-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                Calorias Restantes
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-extrabold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/50">
                {caloriesPercent}% Consumido
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div>
                <div className="text-3xl font-black text-slate-100 font-mono tracking-tight">
                  {remainingCalories.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  de <span className="text-slate-200 font-bold">{dailyGoals.targetCalories} kcal</span>
                </div>
              </div>

              {/* Progress Circle Visual */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className="text-cyan-400"
                    strokeDasharray={`${caloriesPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${caloriesPercent}, 100` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono font-black text-xs text-cyan-300">
                  {totals.calories}
                </span>
              </div>
            </div>

            {/* Linear Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mt-2">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${caloriesPercent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {/* 3 Mini-cards for Macros */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Proteínas */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Proteínas
                </span>
                <span className="text-[10px] font-mono text-purple-400 font-bold">
                  {proteinPercent}%
                </span>
              </div>
              <div>
                <div className="text-lg font-black font-mono text-slate-100">
                  {totals.protein.toFixed(0)}g{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {dailyGoals.targetProteinGrams}g
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Força & Músculos</div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-purple-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${proteinPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Carboidratos */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Apple className="w-3.5 h-3.5 text-emerald-400" />
                  Carboidratos
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {carbsPercent}%
                </span>
              </div>
              <div>
                <div className="text-lg font-black font-mono text-slate-100">
                  {totals.carbs.toFixed(0)}g{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {dailyGoals.targetCarbsGrams}g
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Energia & Estamina</div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-emerald-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${carbsPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Gorduras */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Gorduras
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {fatPercent}%
                </span>
              </div>
              <div>
                <div className="text-lg font-black font-mono text-slate-100">
                  {totals.fat.toFixed(0)}g{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {dailyGoals.targetFatGrams}g
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Hormônios & Vitalidade</div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-amber-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${fatPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE BUSCA INTELIGENTE (TACO / OPEN FOOD FACTS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 relative z-30">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-4 h-4 text-cyan-400" />
            Buscar Alimento (TACO & Open Food Facts)
          </label>

          <button
            onClick={() => setIsCustomFoodModalOpen(true)}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Alimento Personalizado
          </button>
        </div>

        {/* Input Search Container */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Digite um alimento (ex: Frango, Arroz, Ovo, Banana, Tapioca, Whey...)"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 pl-10 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Categorias:</span>
          {['Todas', 'Proteínas', 'Carboidratos', 'Frutas', 'Vegetais', 'Gorduras', 'Suplementos'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${selectedCategoryFilter === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Search Floating / Instant Results */}
        {(isSearchFocused || searchQuery.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-950 border border-slate-800 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/60 shadow-2xl mt-2"
          >
            <div className="p-2 bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
              <span>Resultados Encontrados ({filteredFoodResults.length})</span>
              <button
                onClick={() => setIsSearchFocused(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                Fechar
              </button>
            </div>

            {filteredFoodResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhum alimento encontrado para "{searchQuery}".
                <button
                  onClick={() => setIsCustomFoodModalOpen(true)}
                  className="block mx-auto mt-2 text-cyan-400 font-bold underline"
                >
                  Cadastrar alimento personalizado
                </button>
              </div>
            ) : (
              filteredFoodResults.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleOpenAddModal(food)}
                  className="p-3 hover:bg-slate-900/90 transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-200 group-hover:text-cyan-300 transition">
                        {food.name}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${food.source === 'Tabela TACO'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : food.source === 'Open Food Facts'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                      >
                        {food.source}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3 font-mono">
                      <span>Por 100g:</span>
                      <span className="text-amber-400 font-bold">{food.caloriesPer100g} kcal</span>
                      <span className="text-purple-300">P: {food.proteinPer100g}g</span>
                      <span className="text-emerald-300">C: {food.carbsPer100g}g</span>
                      <span className="text-amber-300">G: {food.fatPer100g}g</span>
                    </div>
                  </div>

                  <button className="p-2 bg-slate-900 group-hover:bg-cyan-500 text-slate-300 group-hover:text-slate-950 rounded-xl transition border border-slate-800 group-hover:border-cyan-400">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* 3. REFEIÇÕES DO DIA (LAYOUT ESTILO QUESTS DIÁRIAS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-400" />
            Refeições Registradas Hoje
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Total: {loggedFoods.length} itens no diário
          </span>
        </div>

        {(['breakfast', 'lunch', 'snack', 'dinner'] as MealCategory[]).map((mealKey) => {
          const mealInfo = mealInfoMap[mealKey];
          const MealIcon = mealInfo.icon;
          const items = foodsByMeal[mealKey];
          const isExpanded = expandedMeals[mealKey];

          const mealKcal = items.reduce((acc, i) => acc + i.calories, 0);
          const mealProtein = items.reduce((acc, i) => acc + i.protein, 0);
          const mealCarbs = items.reduce((acc, i) => acc + i.carbs, 0);
          const mealFat = items.reduce((acc, i) => acc + i.fat, 0);

          return (
            <div
              key={mealKey}
              className={`bg-gradient-to-r ${mealInfo.bg} border rounded-2xl overflow-hidden shadow-lg transition-all`}
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleMealAccordion(mealKey)}
                className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-800 ${mealInfo.color}`}>
                    <MealIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                      {mealInfo.label}
                      <span className="text-[10px] font-mono text-slate-400 font-normal bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-amber-400 font-bold">{mealKcal} kcal</span>
                      <span>•</span>
                      <span className="text-purple-300">P: {mealProtein.toFixed(1)}g</span>
                      <span>•</span>
                      <span className="text-emerald-300">C: {mealCarbs.toFixed(1)}g</span>
                      <span>•</span>
                      <span className="text-amber-300">G: {mealFat.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (filteredFoodResults.length > 0) {
                        handleOpenAddModal(filteredFoodResults[0], mealKey);
                      } else {
                        handleOpenAddModal(TACO_FOOD_DATABASE[0], mealKey);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-extrabold text-xs rounded-xl transition border border-slate-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>

                  <button className="text-slate-400 hover:text-slate-200 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Accordion List Body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-800/80 bg-slate-950/60 p-4 space-y-2"
                  >
                    {items.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500 italic flex flex-col items-center justify-center gap-1">
                        <span>Nenhum alimento adicionado ao {mealInfo.label}.</span>
                        <button
                          onClick={() => handleOpenAddModal(TACO_FOOD_DATABASE[0], mealKey)}
                          className="text-cyan-400 font-bold underline not-italic hover:text-cyan-300"
                        >
                          + Adicionar o primeiro alimento
                        </button>
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                              <span>{item.foodName}</span>
                              <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {item.amountGrams}g
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span className="text-amber-400 font-bold">{item.calories} kcal</span>
                              <span>P: {item.protein}g</span>
                              <span>C: {item.carbs}g</span>
                              <span>G: {item.fat}g</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onRemoveLoggedFood(item.id);
                              showToast(`Alimento removido do ${mealInfo.label}`);
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            title="Remover do Diário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL / DRAWER DE ADICIONAR ALIMENTO */}
      <AnimatePresence>
        {selectedFoodForModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                      REGISTRAR NO DIÁRIO
                    </span>
                    <h3 className="text-base font-black text-slate-100">
                      {selectedFoodForModal.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFoodForModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/80 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabela Simplificada por 100g */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Kcal / 100g</span>
                  <span className="font-mono font-black text-amber-400">
                    {selectedFoodForModal.caloriesPer100g}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Proteína</span>
                  <span className="font-mono font-bold text-purple-400">
                    {selectedFoodForModal.proteinPer100g}g
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Carbos</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedFoodForModal.carbsPer100g}g
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gordura</span>
                  <span className="font-mono font-bold text-amber-300">
                    {selectedFoodForModal.fatPer100g}g
                  </span>
                </div>
              </div>

              {/* Target Meal Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Refeição de Destino
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'snack', 'dinner'] as MealCategory[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMeal(m)}
                      className={`p-2 rounded-xl text-xs font-extrabold transition border ${targetMeal === m
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                    >
                      {mealInfoMap[m].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portion Slider & Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">
                    Quantidade Consumida (Gramas / Ml)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 px-3 py-1 rounded-xl">
                    <input
                      type="number"
                      value={portionGrams}
                      onChange={(e) => setPortionGrams(Math.max(1, Number(e.target.value)))}
                      className="w-16 bg-transparent text-right font-mono font-black text-cyan-400 text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">g</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />

                {/* Quick Portion Chips */}
                <div className="flex items-center gap-2 overflow-x-auto text-xs">
                  {[30, 50, 100, 150, 200, 250, 300].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setPortionGrams(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${portionGrams === preset
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                    >
                      {preset}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Portioned Nutrition Summary */}
              <div className="bg-gradient-to-r from-cyan-950/60 via-slate-950 to-purple-950/60 border border-cyan-800/50 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                  VALORES DA PORÇÃO ({portionGrams}g)
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <span className="text-xl font-black text-slate-100 font-mono">
                      {calculatedModalNutrition.kcal}
                    </span>
                    <span className="text-[10px] text-amber-400 block font-bold">Calorias (kcal)</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-purple-300 font-mono">
                      {calculatedModalNutrition.protein}g
                    </span>
                    <span className="text-[10px] text-purple-400 block font-bold">Proteína</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-emerald-300 font-mono">
                      {calculatedModalNutrition.carbs}g
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-bold">Carbos</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-amber-300 font-mono">
                      {calculatedModalNutrition.fat}g
                    </span>
                    <span className="text-[10px] text-amber-400 block font-bold">Gordura</span>
                  </div>
                </div>
              </div>

              {/* Confirm Submit Button */}
              <button
                onClick={handleConfirmAddFood}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                Salvar no Diário (+15 XP & Vitalidade)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PARA CRIAR ALIMENTO PERSONALIZADO */}
      <AnimatePresence>
        {isCustomFoodModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  Novo Alimento Personalizado
                </h3>
                <button
                  onClick={() => setIsCustomFoodModalOpen(false)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomFood} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nome do Alimento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Panqueca de Aveia Caseira"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Kcal (por 100g)
                    </label>
                    <input
                      type="number"
                      required
                      value={customKcal}
                      onChange={(e) => setCustomKcal(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Proteínas (g/100g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={customProtein}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Carboidratos (g/100g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Gorduras (g/100g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition mt-2"
                >
                  Cadastrar e Selecionar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PARA EDITAR METAS NUTRISIONAIS */}
      <AnimatePresence>
        {isEditingGoals && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                  Ajustar Metas Nutricionais Diárias
                </h3>
                <button
                  onClick={() => setIsEditingGoals(false)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Meta Diária de Calorias (kcal)
                  </label>
                  <input
                    type="number"
                    value={editGoalsForm.targetCalories}
                    onChange={(e) =>
                      setEditGoalsForm({ ...editGoalsForm, targetCalories: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1">
                      Proteínas (g)
                    </label>
                    <input
                      type="number"
                      value={editGoalsForm.targetProteinGrams}
                      onChange={(e) =>
                        setEditGoalsForm({
                          ...editGoalsForm,
                          targetProteinGrams: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-emerald-300 block mb-1">
                      Carbos (g)
                    </label>
                    <input
                      type="number"
                      value={editGoalsForm.targetCarbsGrams}
                      onChange={(e) =>
                        setEditGoalsForm({
                          ...editGoalsForm,
                          targetCarbsGrams: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Gorduras (g)
                    </label>
                    <input
                      type="number"
                      value={editGoalsForm.targetFatGrams}
                      onChange={(e) =>
                        setEditGoalsForm({
                          ...editGoalsForm,
                          targetFatGrams: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onUpdateDailyGoals) {
                      onUpdateDailyGoals(editGoalsForm);
                    }
                    setIsEditingGoals(false);
                    showToast('Metas diárias atualizadas!');
                  }}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition mt-2"
                >
                  Salvar Novas Metas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
