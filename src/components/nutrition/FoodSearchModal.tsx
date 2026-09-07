import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNutritionStore } from '@/store/useNutritionStore';
import { FoodItem, MealType } from '@/types';
import { analyzeMealText, AIMealAnalysisResult } from '@/features/ai/foodIntelligence';
import { calculateNutrition } from '@/utils/nutritionCalculator';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Search, 
  Plus, 
  Star, 
  X, 
  Check, 
  Sparkles, 
  Utensils, 
  Wand2, 
  Edit3, 
  Flame, 
  Activity, 
  ArrowRight,
  Info,
  Scale,
  Zap,
  Filter,
  CheckCircle2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  targetDate: string;
  initialTab?: ModalTab;
}

type ModalTab = 'search' | 'ai_analyzer' | 'custom_builder';

type FoodCategoryFilter = 
  | 'all' 
  | 'high_protein' 
  | 'indian' 
  | 'breakfast' 
  | 'dairy' 
  | 'meat' 
  | 'vegan' 
  | 'grains' 
  | 'fats' 
  | 'fruits' 
  | 'drinks';

const CATEGORY_TABS: Array<{ id: FoodCategoryFilter; label: string; icon: string }> = [
  { id: 'all', label: 'All Foods', icon: '🌟' },
  { id: 'high_protein', label: 'High Protein', icon: '⚡' },
  { id: 'indian', label: 'Indian Classics', icon: '🇮🇳' },
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'dairy', label: 'Dairy & Shakes', icon: '🥛' },
  { id: 'meat', label: 'Meat & Seafood', icon: '🍗' },
  { id: 'vegan', label: 'Vegan & Veg', icon: '🥗' },
  { id: 'grains', label: 'Grains & Rice', icon: '🍚' },
  { id: 'fats', label: 'Nuts & Fats', icon: '🥜' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'drinks', label: 'Drinks & Snacks', icon: '🥤' }
];

const POPULAR_SEARCH_QUERIES = [
  'Whey Protein',
  'Boiled Eggs',
  'Chicken Breast',
  'Paneer',
  'Rolled Oats',
  'Idli',
  'Dosa',
  'Toned Milk',
  'Peanut Butter',
  'Basmati Rice',
  'Banana',
  'Dal Tadka'
];

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  isOpen,
  onClose,
  mealType,
  targetDate,
  initialTab = 'search'
}) => {
  const { foodLibrary, addFoodToMeal, addFoodToLibrary, logAIMealItems, toggleFavoriteFood } = useNutritionStore();
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<FoodCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [portionUnit, setPortionUnit] = useState<'serving' | 'g' | 'ml'>('serving');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // AI Meal Analyzer state
  const [aiMealInput, setAiMealInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIMealAnalysisResult | null>(null);

  // Custom Food state
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customServingSize, setCustomServingSize] = useState('100g');
  const [customServingUnit, setCustomServingUnit] = useState('portion');
  const [customServingGrams, setCustomServingGrams] = useState('100');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customFiber, setCustomFiber] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setCategoryFilter('all');
    }
  }, [isOpen, initialTab]);

  // Helper filter logic
  const filteredFoods = useMemo(() => {
    return foodLibrary.filter((food) => {
      // 1. Favorites filter
      if (onlyFavorites && !food.isFavorite) return false;

      // 2. Category filter
      if (categoryFilter !== 'all') {
        const lowerName = food.name.toLowerCase();
        const lowerCuisine = (food.cuisine || '').toLowerCase();
        const lowerPrep = (food.preparation || '').toLowerCase();
        const lowerAliases = (food.aliases || []).join(' ').toLowerCase();

        if (categoryFilter === 'high_protein') {
          // Food with >= 12g protein or protein > 8g per 100kcal
          const isHighPro = food.protein >= 12 || (food.calories > 0 && (food.protein * 4) / food.calories >= 0.3);
          if (!isHighPro) return false;
        } else if (categoryFilter === 'indian') {
          if (lowerCuisine !== 'indian' && !lowerAliases.includes('indian') && !lowerAliases.includes('dal') && !lowerAliases.includes('roti') && !lowerAliases.includes('dosa') && !lowerAliases.includes('curry')) return false;
        } else if (categoryFilter === 'breakfast') {
          const isBreakfast = lowerName.includes('egg') || lowerName.includes('oat') || lowerName.includes('idli') || lowerName.includes('dosa') || lowerName.includes('poha') || lowerName.includes('upma') || lowerName.includes('thepla') || lowerName.includes('chilla') || lowerName.includes('pancake') || lowerName.includes('toast') || lowerName.includes('cereal') || lowerName.includes('paratha');
          if (!isBreakfast) return false;
        } else if (categoryFilter === 'dairy') {
          const isDairy = lowerCuisine === 'dairy' || lowerName.includes('milk') || lowerName.includes('yogurt') || lowerName.includes('whey') || lowerName.includes('casein') || lowerName.includes('curd') || lowerName.includes('dahi') || lowerName.includes('cheese') || lowerName.includes('paneer') || lowerName.includes('ghee') || lowerName.includes('butter');
          if (!isDairy) return false;
        } else if (categoryFilter === 'meat') {
          const isMeat = lowerName.includes('chicken') || lowerName.includes('mutton') || lowerName.includes('beef') || lowerName.includes('salmon') || lowerName.includes('tuna') || lowerName.includes('fish') || lowerName.includes('tilapia') || lowerName.includes('steak') || lowerName.includes('turkey');
          if (!isMeat) return false;
        } else if (categoryFilter === 'vegan') {
          const isVegan = lowerName.includes('tofu') || lowerName.includes('tempeh') || lowerName.includes('soya') || lowerName.includes('plant') || lowerName.includes('spinach') || lowerName.includes('broccoli') || lowerName.includes('salad') || lowerName.includes('cucumber');
          if (!isVegan) return false;
        } else if (categoryFilter === 'grains') {
          const isGrain = lowerName.includes('rice') || lowerName.includes('roti') || lowerName.includes('naan') || lowerName.includes('quinoa') || lowerName.includes('oat') || lowerName.includes('pasta') || lowerName.includes('biryani') || lowerName.includes('khichdi') || lowerName.includes('sweet potato');
          if (!isGrain) return false;
        } else if (categoryFilter === 'fats') {
          const isFat = lowerName.includes('peanut butter') || lowerName.includes('almond') || lowerName.includes('walnut') || lowerName.includes('cashew') || lowerName.includes('chia') || lowerName.includes('avocado') || lowerName.includes('oil') || lowerName.includes('ghee');
          if (!isFat) return false;
        } else if (categoryFilter === 'fruits') {
          const isFruit = lowerName.includes('banana') || lowerName.includes('apple') || lowerName.includes('mango') || lowerName.includes('berry') || lowerName.includes('blueberr') || lowerName.includes('strawberr') || lowerName.includes('papaya') || lowerName.includes('dates') || lowerName.includes('watermelon') || lowerName.includes('orange');
          if (!isFruit) return false;
        } else if (categoryFilter === 'drinks') {
          const isDrink = lowerName.includes('chai') || lowerName.includes('tea') || lowerName.includes('coffee') || lowerName.includes('latte') || lowerName.includes('lassi') || lowerName.includes('chaas') || lowerName.includes('coconut water') || lowerName.includes('makhana') || lowerName.includes('chocolate') || lowerName.includes('chana');
          if (!isDrink) return false;
        }
      }

      // 3. Search query filter
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const matchesName = food.name.toLowerCase().includes(query);
      const matchesBrand = food.brand && food.brand.toLowerCase().includes(query);
      const matchesCuisine = food.cuisine && food.cuisine.toLowerCase().includes(query);
      const matchesPrep = food.preparation && food.preparation.toLowerCase().includes(query);
      const matchesAliases = food.aliases && food.aliases.some(a => a.toLowerCase().includes(query));

      return matchesName || matchesBrand || matchesCuisine || matchesPrep || matchesAliases;
    });
  }, [foodLibrary, searchQuery, categoryFilter, onlyFavorites]);

  if (!isOpen) return null;

  const handleSelectFood = (food: FoodItem) => {
    triggerHaptic('light');
    setSelectedFood(food);
    const isWeightBase = food.servingUnit === 'g' || food.servingUnit === 'ml';
    if (isWeightBase) {
      setPortionUnit(food.servingUnit === 'ml' ? 'ml' : 'g');
      setQuantity(food.servingGrams || 100);
    } else {
      setPortionUnit('serving');
      setQuantity(1);
    }
  };

  const handleQuickAddFood = (e: React.MouseEvent, food: FoodItem) => {
    e.stopPropagation();
    triggerHaptic('medium');
    addFoodToMeal(targetDate, mealType, food, 1, 'serving');
  };

  const handleAddCustomizedFood = (food: FoodItem, qty: number, unit: string) => {
    triggerHaptic('medium');
    addFoodToMeal(targetDate, mealType, food, qty, unit);
    setSelectedFood(null);
    onClose();
  };

  const handleRunAIAnalysis = (customPrompt?: string) => {
    const promptToRun = customPrompt || aiMealInput;
    if (!promptToRun.trim()) return;

    triggerHaptic('medium');
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeMealText(promptToRun);
      setAiResult(result);
      setIsAnalyzing(false);
    }, 200);
  };

  const handleEstimateComponent = (idx: number) => {
    if (!aiResult) return;
    triggerHaptic('light');
    const updatedComponents = [...aiResult.components];
    const c = updatedComponents[idx];
    
    const estimatedCals = 150 * (c.quantity || 1);
    const estimatedPro = 5 * (c.quantity || 1);
    const estimatedCarbs = 18 * (c.quantity || 1);
    const estimatedFat = 6 * (c.quantity || 1);

    updatedComponents[idx] = {
      ...c,
      calories: Math.round(estimatedCals),
      protein: Math.round(estimatedPro * 10) / 10,
      carbs: Math.round(estimatedCarbs * 10) / 10,
      fat: Math.round(estimatedFat * 10) / 10,
      isUnknown: false,
      isEstimated: true
    };

    const newTotalCals = updatedComponents.reduce((sum, item) => sum + item.calories, 0);
    const newTotalPro = updatedComponents.reduce((sum, item) => sum + item.protein, 0);
    const newTotalCarbs = updatedComponents.reduce((sum, item) => sum + item.carbs, 0);
    const newTotalFat = updatedComponents.reduce((sum, item) => sum + item.fat, 0);

    setAiResult({
      ...aiResult,
      components: updatedComponents,
      totalCalories: Math.round(newTotalCals),
      totalProtein: Math.round(newTotalPro * 10) / 10,
      totalCarbs: Math.round(newTotalCarbs * 10) / 10,
      totalFat: Math.round(newTotalFat * 10) / 10,
      hasUnknownItems: updatedComponents.some(item => item.isUnknown)
    });
  };

  const handleRemoveComponent = (idx: number) => {
    if (!aiResult) return;
    triggerHaptic('light');
    const updatedComponents = aiResult.components.filter((_, i) => i !== idx);
    const newTotalCals = updatedComponents.reduce((sum, item) => sum + item.calories, 0);
    const newTotalPro = updatedComponents.reduce((sum, item) => sum + item.protein, 0);
    const newTotalCarbs = updatedComponents.reduce((sum, item) => sum + item.carbs, 0);
    const newTotalFat = updatedComponents.reduce((sum, item) => sum + item.fat, 0);

    setAiResult({
      ...aiResult,
      components: updatedComponents,
      totalCalories: Math.round(newTotalCals),
      totalProtein: Math.round(newTotalPro * 10) / 10,
      totalCarbs: Math.round(newTotalCarbs * 10) / 10,
      totalFat: Math.round(newTotalFat * 10) / 10,
      hasUnknownItems: updatedComponents.some(item => item.isUnknown)
    });
  };

  const handleUpdateComponentMacro = (idx: number, field: 'calories' | 'protein' | 'carbs' | 'fat', value: number) => {
    if (!aiResult) return;
    const updatedComponents = [...aiResult.components];
    updatedComponents[idx] = {
      ...updatedComponents[idx],
      [field]: value
    };

    const newTotalCals = updatedComponents.reduce((sum, item) => sum + item.calories, 0);
    const newTotalPro = updatedComponents.reduce((sum, item) => sum + item.protein, 0);
    const newTotalCarbs = updatedComponents.reduce((sum, item) => sum + item.carbs, 0);
    const newTotalFat = updatedComponents.reduce((sum, item) => sum + item.fat, 0);

    setAiResult({
      ...aiResult,
      components: updatedComponents,
      totalCalories: Math.round(newTotalCals),
      totalProtein: Math.round(newTotalPro * 10) / 10,
      totalCarbs: Math.round(newTotalCarbs * 10) / 10,
      totalFat: Math.round(newTotalFat * 10) / 10
    });
  };

  const handleLogAIMeal = () => {
    if (!aiResult || aiResult.components.length === 0) return;
    triggerHaptic('medium');

    logAIMealItems(
      targetDate,
      mealType,
      aiResult.mealTitle,
      aiResult.components.map(c => ({
        name: `${c.quantity > 1 ? `${c.quantity} ` : ''}${c.name}`,
        calories: c.calories,
        protein: c.protein,
        carbs: c.carbs,
        fat: c.fat,
        fiber: c.fiber,
        servingDescription: `${c.quantity} × ${c.unit}`
      }))
    );

    // Save unknown items to library
    aiResult.components.forEach(c => {
      const exists = foodLibrary.some(f => f.name.toLowerCase() === c.name.toLowerCase());
      if (!exists && c.calories > 0) {
        addFoodToLibrary({
          name: c.name,
          servingSize: c.unit,
          servingUnit: 'portion',
          servingGrams: 100,
          calories: Math.round(c.calories / (c.quantity || 1)),
          protein: Math.round((c.protein / (c.quantity || 1)) * 10) / 10,
          carbs: Math.round((c.carbs / (c.quantity || 1)) * 10) / 10,
          fat: Math.round((c.fat / (c.quantity || 1)) * 10) / 10,
          fiber: c.fiber ? Math.round((c.fiber / (c.quantity || 1)) * 10) / 10 : 0,
          isCustom: true
        });
      }
    });

    onClose();
  };

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    triggerHaptic('medium');
    const parsedGrams = parseFloat(customServingGrams) || 100;
    const pro = parseFloat(customProtein) || 0;
    const carb = parseFloat(customCarbs) || 0;
    const fatVal = parseFloat(customFat) || 0;
    const cal = parseFloat(customCalories) || Math.round(pro * 4 + carb * 4 + fatVal * 9);

    const newFood = addFoodToLibrary({
      name: customName.trim(),
      brand: customBrand.trim() || 'Custom',
      servingSize: customServingSize.trim() || `${parsedGrams}g`,
      servingUnit: customServingUnit.trim() || 'portion',
      servingGrams: parsedGrams,
      calories: cal,
      protein: pro,
      carbs: carb,
      fat: fatVal,
      fiber: parseFloat(customFiber) || 0,
      isCustom: true
    });

    addFoodToMeal(targetDate, mealType, newFood, 1, 'serving');
    onClose();
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xl animate-fade-in p-0 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[94vh] bg-[#0A0E1A] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-slide-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0C1222] via-[#0E162B] to-[#0A0E1A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Utensils className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-black tracking-wider border border-emerald-500/30">
                  Log to {mealType.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {foodLibrary.length} Foods Indexed
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate mt-0.5">
                Nutrition & Macro Center
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors pressable shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#060810] border-b border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('search');
            }}
            className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all pressable ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border border-white/20 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search Foods</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('ai_analyzer');
            }}
            className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all pressable ${
              activeTab === 'ai_analyzer'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 scale-[1.02] border border-emerald-300'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'ai_analyzer' ? 'fill-slate-950' : 'fill-emerald-400'}`} />
            <span>Smart Estimator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('custom_builder');
            }}
            className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all pressable ${
              activeTab === 'custom_builder'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border border-white/20 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Custom Food</span>
          </button>
        </div>

        {/* TAB 1: FOOD SEARCH DATABASE */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Search Input Bar & Quick Favorites Filter */}
            <div className="p-3 sm:p-4 border-b border-white/5 space-y-3 bg-[#0C111F]">
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search foods, brands, ingredients (e.g., Milk, Eggs, Oats, Chicken, Biryani)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-[#12192D] rounded-2xl border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 font-sans shadow-inner transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Horizontal Category Carousel */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setOnlyFavorites(!onlyFavorites);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 pressable ${
                    onlyFavorites
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-300 text-amber-300' : 'text-slate-400'}`} />
                  <span>Favorites</span>
                </button>

                <div className="w-[1px] h-5 bg-white/10 shrink-0 mx-0.5" />

                {CATEGORY_TABS.map((cat) => {
                  const isSelected = categoryFilter === cat.id && !onlyFavorites;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setOnlyFavorites(false);
                        setCategoryFilter(cat.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 pressable ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md border border-emerald-400'
                          : 'bg-white/5 text-slate-300 hover:text-white border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Search Chips when no query */}
              {!searchQuery && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px] shrink-0">Popular:</span>
                  {POPULAR_SEARCH_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSearchQuery(q);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-black/40 hover:bg-white/10 text-slate-400 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 shrink-0 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Foods List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filteredFoods.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                    <Wand2 className="w-7 h-7" />
                  </div>
                  <div className="text-white font-black text-base">
                    No matching item for "{searchQuery}"
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Use our AI Smart Estimator to compute protein & macros automatically, or create a custom food item!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAiMealInput(searchQuery);
                        setActiveTab('ai_analyzer');
                        handleRunAIAnalysis(searchQuery);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg glow-volt pressable hover:brightness-110"
                    >
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      Analyze with AI Estimator
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomName(searchQuery);
                        setActiveTab('custom_builder');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#161F34] text-white font-bold text-xs border border-white/10 hover:bg-[#1E2A46] pressable"
                    >
                      + Add as Custom Food
                    </button>
                  </div>
                </div>
              ) : (
                filteredFoods.map((food) => {
                  const totalGrams = (food.protein || 0) + (food.carbs || 0) + (food.fat || 0);
                  const pPct = totalGrams > 0 ? Math.round((food.protein / totalGrams) * 100) : 33;
                  const cPct = totalGrams > 0 ? Math.round((food.carbs / totalGrams) * 100) : 33;
                  const fPct = totalGrams > 0 ? Math.round((food.fat / totalGrams) * 100) : 34;
                  const isHighPro = food.protein >= 15 || (food.calories > 0 && (food.protein * 4) / food.calories >= 0.35);

                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="p-3.5 rounded-2xl bg-[#0F1526] hover:bg-[#141C33] border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-sm pressable"
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        {/* Food Title & Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors truncate">
                            {food.name}
                          </span>
                          
                          {food.cuisine && (
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${
                              food.cuisine === 'Indian' 
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                : food.cuisine === 'Fitness'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800/80 text-slate-300 border-white/10'
                            }`}>
                              {food.cuisine}
                            </span>
                          )}

                          {isHighPro && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9.5px] font-mono font-bold border border-emerald-500/30 flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                              High Pro
                            </span>
                          )}

                          {food.isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9.5px] font-mono font-bold border border-cyan-500/30">
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Serving Info */}
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          Serving: {food.servingSize} {food.preparation ? `• ${food.preparation}` : ''}
                        </div>

                        {/* Macro stats */}
                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-2 font-mono flex-wrap">
                          <span className="text-white font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            {food.calories} kcal
                          </span>
                          <span className="text-emerald-400 font-bold">P: {food.protein}g</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-cyan-300 font-bold">C: {food.carbs}g</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-300 font-bold">F: {food.fat}g</span>
                          {food.fiber ? (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-purple-300 font-bold">Fib: {food.fiber}g</span>
                            </>
                          ) : null}
                        </div>

                        {/* Micro Macro Distribution Strip */}
                        <div className="w-full max-w-[200px] h-1.5 rounded-full bg-black/40 overflow-hidden flex mt-2 border border-white/5">
                          <div style={{ width: `${pPct}%` }} className="bg-emerald-400 h-full" title={`Protein: ${pPct}%`} />
                          <div style={{ width: `${cPct}%` }} className="bg-cyan-400 h-full" title={`Carbs: ${cPct}%`} />
                          <div style={{ width: `${fPct}%` }} className="bg-amber-400 h-full" title={`Fat: ${fPct}%`} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            toggleFavoriteFood(food.id);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-400 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/5 transition-colors pressable"
                          title={food.isFavorite ? 'Remove Favorite' : 'Save as Favorite'}
                        >
                          <Star className={`w-4 h-4 ${food.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAddFood(e, food)}
                          className="px-3 py-2 text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 font-black rounded-xl border border-emerald-300 shadow-md transition-all flex items-center gap-1 pressable"
                          title="Quick 1-Tap Log"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span className="text-xs font-mono hidden sm:inline">Log</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SMART MACRO ESTIMATOR / NLP PARSER */}
        {activeTab === 'ai_analyzer' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#10172B] to-[#0A0E1A] border border-emerald-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Sparkles className="w-4 h-4 fill-emerald-400" />
                <span>Smart Macro Estimator & Natural Language Parser</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Describe any food item, breakfast combo, or multi-ingredient meal in plain English. FitForge parses items and calculates protein, calories, carbs, fat, and fiber automatically.
              </p>

              {/* Natural language input */}
              <div className="space-y-2.5">
                <textarea
                  rows={2}
                  value={aiMealInput}
                  onChange={(e) => setAiMealInput(e.target.value)}
                  placeholder="e.g., 2 glasses of milk with 3 boiled eggs and 1 banana"
                  className="w-full p-3.5 bg-[#080B14] border border-emerald-500/40 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 resize-none font-sans shadow-inner"
                />

                {/* Preset quick suggestions */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    '🥛 2 glasses of milk',
                    '🍳 3 boiled eggs & 2 whole wheat rotis',
                    '🥣 1 bowl oats with 1 scoop whey & pb',
                    '🍗 200g chicken breast & 1 cup rice',
                    '☕ 1 cup masala chai & 2 aloo parathas',
                    '🥗 1 bowl dal tadka + 2 rotis + curd'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const clean = preset.replace(/^[^\s]+\s/, '');
                        setAiMealInput(clean);
                        handleRunAIAnalysis(clean);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#141C30] border border-white/10 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-emerald-500/40 pressable transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isAnalyzing || !aiMealInput.trim()}
                  onClick={() => handleRunAIAnalysis()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt hover:brightness-110 disabled:opacity-50 pressable transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  {isAnalyzing ? 'Analyzing with Neural Engine...' : '⚡ Calculate Macros & Protein with AI'}
                </button>
              </div>
            </div>

            {/* AI Results Card */}
            {aiResult && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#11182A] border border-white/10 shadow-2xl space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      AI Analysis • Confidence: {aiResult.confidence}
                    </span>
                    <h3 className="text-base font-black text-white">{aiResult.mealTitle}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-mono font-black">
                    {aiResult.totalCalories} kcal
                  </span>
                </div>

                {/* Macro Progress Bars */}
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2.5 rounded-2xl bg-[#080C16] border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase">Calories</div>
                    <div className="text-sm font-black text-white mt-0.5">{aiResult.totalCalories}</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">Protein</div>
                    <div className="text-sm font-black text-emerald-300 mt-0.5">{aiResult.totalProtein}g</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
                    <div className="text-[10px] text-cyan-400 uppercase font-bold">Carbs</div>
                    <div className="text-sm font-black text-cyan-300 mt-0.5">{aiResult.totalCarbs}g</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                    <div className="text-[10px] text-amber-400 uppercase font-bold">Fat</div>
                    <div className="text-sm font-black text-amber-300 mt-0.5">{aiResult.totalFat}g</div>
                  </div>
                </div>

                {/* Individual Components */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                    Parsed Components ({aiResult.components.length})
                  </span>
                  {aiResult.components.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#080C16] border border-white/10 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">{c.name}</span>
                          <span className="text-slate-400 text-[11px] ml-1.5">({c.quantity} × {c.unit})</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-300 flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{c.protein}g P</span>
                          <span>•</span>
                          <span className="text-white">{c.calories} kcal</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                            title="Remove component"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Unknown Food Action Card */}
                      {c.isUnknown && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1.5">
                              ⚠️ Unknown food detected: "{c.name}"
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(c.name);
                                setActiveTab('search');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
                            >
                              🔍 Search food
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEstimateComponent(idx)}
                              className="px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/30 transition-colors"
                            >
                              ⚡ Estimate with AI
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(idx)}
                              className="px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-semibold transition-colors"
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Estimated Review Inputs */}
                      {c.isEstimated && (
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1.5">
                          <div className="text-[11px] text-blue-300 font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            <span>Estimated Values (Adjust if needed):</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                            <div>
                              <span className="text-[9px] text-slate-400">Calories</span>
                              <input
                                type="number"
                                value={c.calories}
                                onChange={(e) => handleUpdateComponentMacro(idx, 'calories', parseInt(e.target.value, 10) || 0)}
                                className="w-full px-1.5 py-1 bg-slate-950 border border-white/10 rounded-lg text-center text-white text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-emerald-400">Protein (g)</span>
                              <input
                                type="number"
                                step="0.1"
                                value={c.protein}
                                onChange={(e) => handleUpdateComponentMacro(idx, 'protein', parseFloat(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 bg-slate-950 border border-emerald-500/30 rounded-lg text-center text-emerald-300 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-cyan-400">Carbs (g)</span>
                              <input
                                type="number"
                                step="0.1"
                                value={c.carbs}
                                onChange={(e) => handleUpdateComponentMacro(idx, 'carbs', parseFloat(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 bg-slate-950 border border-cyan-500/30 rounded-lg text-center text-cyan-300 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-amber-400">Fat (g)</span>
                              <input
                                type="number"
                                step="0.1"
                                value={c.fat}
                                onChange={(e) => handleUpdateComponentMacro(idx, 'fat', parseFloat(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 bg-slate-950 border border-amber-500/30 rounded-lg text-center text-amber-300 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleLogAIMeal}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt hover:brightness-110 pressable transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Log Entire Meal to {mealType.replace('_', ' ')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM FOOD CREATOR */}
        {activeTab === 'custom_builder' && (
          <form onSubmit={handleCreateCustomFood} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="p-4 rounded-3xl bg-[#11182A] border border-white/10 space-y-3 shadow-xl">
              <span className="text-xs font-mono uppercase text-emerald-400 font-black tracking-wider">
                1. Basic Information
              </span>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Food / Dish Name *</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Mom's Homemade Paneer Paratha, High Protein Smoothie"
                  className="w-full px-3.5 py-2.5 bg-[#080C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Brand / Kitchen</label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g., Homemade, MyFitness, Subway"
                    className="w-full px-3.5 py-2.5 bg-[#080C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Serving Label</label>
                  <input
                    type="text"
                    value={customServingSize}
                    onChange={(e) => setCustomServingSize(e.target.value)}
                    placeholder="e.g., 1 glass (250ml), 1 scoop"
                    className="w-full px-3.5 py-2.5 bg-[#080C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Unit Name</label>
                  <input
                    type="text"
                    value={customServingUnit}
                    onChange={(e) => setCustomServingUnit(e.target.value)}
                    placeholder="e.g., scoop, glass, egg, g"
                    className="w-full px-3.5 py-2.5 bg-[#080C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Weight per Serving (g/ml)</label>
                  <input
                    type="number"
                    value={customServingGrams}
                    onChange={(e) => setCustomServingGrams(e.target.value)}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 bg-[#080C16] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Macro Breakdown Inputs */}
            <div className="p-4 rounded-3xl bg-[#11182A] border border-white/10 space-y-3 shadow-xl">
              <span className="text-xs font-mono uppercase text-slate-400 font-black tracking-wider">
                2. Nutritional Values per Serving
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    placeholder={
                      customProtein || customCarbs || customFat
                        ? `${Math.round((parseFloat(customProtein) || 0) * 4 + (parseFloat(customCarbs) || 0) * 4 + (parseFloat(customFat) || 0) * 9)}`
                        : '150'
                    }
                    className="w-full py-2.5 px-3 bg-[#080C16] border border-white/10 rounded-xl text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-emerald-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    placeholder="10.0"
                    className="w-full py-2.5 px-3 bg-[#080C16] border border-emerald-500/30 rounded-xl text-emerald-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-cyan-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    placeholder="15.0"
                    className="w-full py-2.5 px-3 bg-[#080C16] border border-cyan-500/30 rounded-xl text-cyan-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-amber-400 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    placeholder="5.0"
                    className="w-full py-2.5 px-3 bg-[#080C16] border border-amber-500/30 rounded-xl text-amber-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt pressable transition-all hover:brightness-110"
            >
              Save Custom Food & Log to {mealType.replace('_', ' ')}
            </button>
          </form>
        )}

        {/* Portion Selector Sheet for Standard Foods */}
        {selectedFood && (() => {
          const isWeightFood = selectedFood.servingUnit === 'g' || selectedFood.servingUnit === 'ml';
          const calculated = calculateNutrition({ food: selectedFood, quantity, unit: portionUnit });

          return (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedFood(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#0F1528] rounded-3xl p-5 sm:p-6 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-4 animate-scale-up"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-black text-white truncate">{selectedFood.name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Base Serving: {selectedFood.servingSize} ({selectedFood.servingGrams}g)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Unit Switcher Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#080C16] border border-white/10 text-xs font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPortionUnit('serving');
                      setQuantity(1);
                    }}
                    className={`py-2 px-3 rounded-xl transition-all ${
                      portionUnit === 'serving'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isWeightFood ? '1 Serving' : `By ${selectedFood.servingUnit || 'Portion'}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPortionUnit(selectedFood.servingUnit === 'ml' ? 'ml' : 'g');
                      setQuantity(selectedFood.servingGrams || 100);
                    }}
                    className={`py-2 px-3 rounded-xl transition-all ${
                      portionUnit === 'g' || portionUnit === 'ml'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    By Weight ({selectedFood.servingUnit === 'ml' ? 'ml' : 'g'})
                  </button>
                </div>

                {/* Quick Multiplier Presets */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
                  {portionUnit === 'serving' ? (
                    [0.5, 1, 1.5, 2, 3].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setQuantity(mult);
                        }}
                        className={`px-3 py-1 rounded-xl font-bold transition-all pressable ${
                          quantity === mult
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        {mult}x
                      </button>
                    ))
                  ) : (
                    [50, 100, 150, 200, 250, 300].map((wt) => (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setQuantity(wt);
                        }}
                        className={`px-3 py-1 rounded-xl font-bold transition-all pressable ${
                          quantity === wt
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        {wt}{selectedFood.servingUnit === 'ml' ? 'ml' : 'g'}
                      </button>
                    ))
                  )}
                </div>

                {/* Quantity Stepper */}
                <div className="p-3.5 rounded-2xl bg-[#080C16] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {portionUnit === 'serving' ? 'Portions / Units:' : 'Exact Amount (g/ml):'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          if (portionUnit === 'serving') {
                            setQuantity(Math.max(0.25, Math.round((quantity - 0.5) * 10) / 10));
                          } else {
                            setQuantity(Math.max(10, quantity - (quantity > 100 ? 50 : 25)));
                          }
                        }}
                        className="w-9 h-9 rounded-xl bg-white/10 text-white font-black text-base flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step={portionUnit === 'serving' ? '0.25' : '10'}
                        min={portionUnit === 'serving' ? '0.25' : '5'}
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        className="w-24 py-1.5 text-center bg-[#131B2F] border border-emerald-500/30 rounded-xl text-white font-mono font-black text-base focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          if (portionUnit === 'serving') {
                            setQuantity(Math.round((quantity + 0.5) * 10) / 10);
                          } else {
                            setQuantity(quantity + (quantity >= 100 ? 50 : 25));
                          }
                        }}
                        className="w-9 h-9 rounded-xl bg-white/10 text-white font-black text-base flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Summary Description */}
                  <div className="text-[11px] font-mono text-emerald-400 text-center font-bold">
                    = {calculated.servingDescription}
                  </div>
                </div>

                {/* Calculated Live Total Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#080C16] to-[#0A0F1E] border border-emerald-500/30 grid grid-cols-4 gap-2 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Calories</div>
                    <div className="text-base font-black text-white">{calculated.calories}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">Protein</div>
                    <div className="text-base font-black text-emerald-300">{calculated.protein}g</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-400 uppercase font-bold">Carbs</div>
                    <div className="text-base font-black text-cyan-300">{calculated.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-400 uppercase font-bold">Fat</div>
                    <div className="text-base font-black text-amber-300">{calculated.fat}g</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCustomizedFood(selectedFood, quantity, portionUnit)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl glow-volt hover:brightness-110 pressable transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Log to {mealType.replace('_', ' ')}</span>
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>,
    document.body
  );
};
