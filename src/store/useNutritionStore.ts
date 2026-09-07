import { create } from 'zustand';
import { Meal, MealItem, FoodItem, MealType } from '@/types';
import { SEED_FOODS } from '@/database/seeds/foods';
import { api } from '@/services/api';
import { calculateNutrition } from '@/utils/nutritionCalculator';

interface NutritionState {
  foodLibrary: FoodItem[];
  meals: Meal[];
  selectedDate: string; // YYYY-MM-DD

  // DB Hydration
  setMealsFromDB: (meals: Meal[]) => void;
  setCustomFoodsFromDB: (customFoods: FoodItem[]) => void;
  setFavoriteFoodsFromDB: (favoriteFoodIds: string[]) => void;

  // Actions
  setSelectedDate: (date: string) => void;
  addFoodToLibrary: (food: Omit<FoodItem, 'id'>) => FoodItem;
  deleteCustomFood: (id: string) => Promise<void>;
  toggleFavoriteFood: (foodId: string) => void;
  
  // Meal Actions
  addFoodToMeal: (date: string, mealType: MealType, food: FoodItem, quantity: number, unit?: string) => Promise<void>;
  logAIMealItems: (date: string, mealType: MealType, mealTitle: string, items: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number; fiber?: number; servingDescription?: string }>) => void;
  quickAddMacros: (date: string, mealType: MealType, calories: number, protein: number, carbs: number, fat: number, fiber?: number, name?: string) => void;
  removeMealItem: (mealId: string, itemId: string) => void;
  copyPreviousDayMeal: (mealType: MealType, targetDate: string) => void;
  
  // Computed helpers
  getMealsForDate: (date: string) => Meal[];
  getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number; fiber: number };
}

import { getToday, offsetDateString } from '@/utils/date';

export const useNutritionStore = create<NutritionState>((set, get) => ({
  foodLibrary: SEED_FOODS,
  meals: [],
  selectedDate: getToday(),

  setMealsFromDB: (dbMeals) => {
    set({ meals: dbMeals || [] });
  },

  setCustomFoodsFromDB: (customFoods) => {
    if (!customFoods || customFoods.length === 0) return;
    set((state) => {
      const customMap = new Map(customFoods.map(f => [f.id, { ...f, isCustom: true }]));
      const currentOthers = state.foodLibrary.filter(f => !f.isCustom && !customMap.has(f.id));
      return {
        foodLibrary: [...customFoods.map(f => ({ ...f, isCustom: true })), ...currentOthers]
      };
    });
  },

  setFavoriteFoodsFromDB: (favoriteFoodIds) => {
    if (!favoriteFoodIds) return;
    const favSet = new Set(favoriteFoodIds);
    set((state) => ({
      foodLibrary: state.foodLibrary.map(f => ({
        ...f,
        isFavorite: favSet.has(f.id)
      }))
    }));
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  addFoodToLibrary: (newFood) => {
    const food: FoodItem = {
      ...newFood,
      id: `food-custom-${Date.now()}`,
      isCustom: true,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    // 1. Optimistic update in Zustand
    set((state) => ({
      foodLibrary: [food, ...state.foodLibrary.filter(f => f.id !== food.id)]
    }));

    // 2. Persist asynchronously to IndexedDB & TiDB Cloud / Sync Queue
    api.saveCustomFood(food).then((res) => {
      if (res && (res as any).food) {
        const saved = (res as any).food;
        set((state) => ({
          foodLibrary: state.foodLibrary.map(f => f.id === food.id ? { ...f, ...saved, isCustom: true, syncStatus: 'synced' } : f)
        }));
      }
    }).catch((err) => {
      console.warn('Custom food persistence handled by offline queue:', err);
    });

    return food;
  },

  deleteCustomFood: async (id) => {
    set((state) => ({
      foodLibrary: state.foodLibrary.filter(f => f.id !== id)
    }));
    try {
      await api.deleteCustomFood(id);
    } catch (err) {
      console.warn('Failed to delete custom food:', err);
    }
  },

  toggleFavoriteFood: (foodId) => {
    const currentFood = get().foodLibrary.find(f => f.id === foodId);
    const nextIsFavorite = !currentFood?.isFavorite;

    // 1. Optimistic update in Zustand
    set((state) => ({
      foodLibrary: state.foodLibrary.map(f => 
        f.id === foodId ? { ...f, isFavorite: nextIsFavorite } : f
      )
    }));

    // 2. Persist asynchronously to IndexedDB & TiDB Cloud / Sync Queue
    api.toggleFavoriteFood(foodId, nextIsFavorite).catch((err) => {
      console.warn('Favorite food persistence handled by offline queue:', err);
    });
  },

  addFoodToMeal: async (date, mealType, food, quantity, unit) => {
    const calc = calculateNutrition({ food, quantity, unit });

    const newItem: MealItem = {
      id: `item-${Date.now()}`,
      foodId: food.id,
      name: food.name,
      servingQuantity: quantity,
      servingDescription: calc.servingDescription,
      calories: calc.calories,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
      fiber: calc.fiber
    };

    const currentMeals = get().meals;
    const existingMeal = currentMeals.find(m => m.date === date && m.type === mealType);

    let updatedMeal: Meal;
    let updatedMeals: Meal[];

    if (existingMeal) {
      const newItems = [...existingMeal.items, newItem];
      updatedMeal = {
        ...existingMeal,
        items: newItems,
        totalCalories: newItems.reduce((sum, i) => sum + i.calories, 0),
        totalProtein: Math.round(newItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10,
        totalCarbs: Math.round(newItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10,
        totalFat: Math.round(newItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10,
        totalFiber: Math.round(newItems.reduce((sum, i) => sum + (i.fiber || 0), 0) * 10) / 10
      };
      updatedMeals = currentMeals.map(m => m.id === existingMeal.id ? updatedMeal : m);
    } else {
      updatedMeal = {
        id: `meal-${Date.now()}`,
        type: mealType,
        date,
        time: new Date().toTimeString().slice(0, 5),
        items: [newItem],
        totalCalories: newItem.calories,
        totalProtein: newItem.protein,
        totalCarbs: newItem.carbs,
        totalFat: newItem.fat,
        totalFiber: newItem.fiber || 0
      };
      updatedMeals = [updatedMeal, ...currentMeals];
    }

    set({ meals: updatedMeals });
    await api.saveMeal(updatedMeal);
  },

  logAIMealItems: async (date, mealType, mealTitle, items) => {
    const mealItems: MealItem[] = items.map((item, idx) => ({
      id: `ai-item-${Date.now()}-${idx}`,
      foodId: `custom-ai-${Date.now()}-${idx}`,
      name: item.name,
      servingQuantity: 1,
      servingDescription: item.servingDescription || '1 portion',
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber || 0
    }));

    const currentMeals = get().meals;
    const existingMeal = currentMeals.find(m => m.date === date && m.type === mealType);

    let updatedMeal: Meal;
    let updatedMeals: Meal[];

    if (existingMeal) {
      const newItems = [...existingMeal.items, ...mealItems];
      updatedMeal = {
        ...existingMeal,
        items: newItems,
        totalCalories: newItems.reduce((sum, i) => sum + i.calories, 0),
        totalProtein: Math.round(newItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10,
        totalCarbs: Math.round(newItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10,
        totalFat: Math.round(newItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10,
        totalFiber: Math.round(newItems.reduce((sum, i) => sum + (i.fiber || 0), 0) * 10) / 10
      };
      updatedMeals = currentMeals.map(m => m.id === existingMeal.id ? updatedMeal : m);
    } else {
      const totCal = mealItems.reduce((sum, i) => sum + i.calories, 0);
      const totPro = Math.round(mealItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10;
      const totCarb = Math.round(mealItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10;
      const totFat = Math.round(mealItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10;
      const totFib = Math.round(mealItems.reduce((sum, i) => sum + (i.fiber || 0), 0) * 10) / 10;

      updatedMeal = {
        id: `meal-${Date.now()}`,
        type: mealType,
        date,
        time: new Date().toTimeString().slice(0, 5),
        items: mealItems,
        totalCalories: totCal,
        totalProtein: totPro,
        totalCarbs: totCarb,
        totalFat: totFat,
        totalFiber: totFib
      };
      updatedMeals = [updatedMeal, ...currentMeals];
    }

    set({ meals: updatedMeals });
    await api.saveMeal(updatedMeal);
  },

  quickAddMacros: async (date, mealType, calories, protein, carbs, fat, fiber = 0, name = 'Quick Entry') => {
    const newItem: MealItem = {
      id: `item-${Date.now()}`,
      foodId: 'quick-entry',
      name,
      servingQuantity: 1,
      servingDescription: '1 serving',
      calories,
      protein,
      carbs,
      fat,
      fiber: fiber || 0
    };

    const currentMeals = get().meals;
    const existingMeal = currentMeals.find(m => m.date === date && m.type === mealType);

    let updatedMeal: Meal;
    let updatedMeals: Meal[];

    if (existingMeal) {
      const newItems = [...existingMeal.items, newItem];
      updatedMeal = {
        ...existingMeal,
        items: newItems,
        totalCalories: newItems.reduce((sum, i) => sum + i.calories, 0),
        totalProtein: Math.round(newItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10,
        totalCarbs: Math.round(newItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10,
        totalFat: Math.round(newItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10,
        totalFiber: Math.round(newItems.reduce((sum, i) => sum + (i.fiber || 0), 0) * 10) / 10
      };
      updatedMeals = currentMeals.map(m => m.id === existingMeal.id ? updatedMeal : m);
    } else {
      updatedMeal = {
        id: `meal-${Date.now()}`,
        type: mealType,
        date,
        time: new Date().toTimeString().slice(0, 5),
        items: [newItem],
        totalCalories: calories,
        totalProtein: protein,
        totalCarbs: carbs,
        totalFat: fat,
        totalFiber: fiber || 0
      };
      updatedMeals = [updatedMeal, ...currentMeals];
    }

    set({ meals: updatedMeals });
    await api.saveMeal(updatedMeal);
  },

  removeMealItem: async (mealId, itemId) => {
    const currentMeals = get().meals;
    const meal = currentMeals.find(m => m.id === mealId);
    if (!meal) return;

    const remainingItems = meal.items.filter(i => i.id !== itemId);
    let updatedMeals: Meal[];

    if (remainingItems.length === 0) {
      updatedMeals = currentMeals.filter(m => m.id !== mealId);
      set({ meals: updatedMeals });
      await api.deleteMeal(mealId);
    } else {
      const updatedMeal: Meal = {
        ...meal,
        items: remainingItems,
        totalCalories: remainingItems.reduce((sum, i) => sum + i.calories, 0),
        totalProtein: Math.round(remainingItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10,
        totalCarbs: Math.round(remainingItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10,
        totalFat: Math.round(remainingItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10,
        totalFiber: Math.round(remainingItems.reduce((sum, i) => sum + (i.fiber || 0), 0) * 10) / 10
      };
      updatedMeals = currentMeals.map(m => m.id === mealId ? updatedMeal : m);
      set({ meals: updatedMeals });
      await api.saveMeal(updatedMeal);
    }
  },

  copyPreviousDayMeal: (mealType, targetDate) => {
    const prevDateStr = offsetDateString(targetDate, -1);

    const prevMeal = get().meals.find(m => m.date === prevDateStr && m.type === mealType);
    if (!prevMeal || prevMeal.items.length === 0) return;

    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      type: mealType,
      date: targetDate,
      time: new Date().toTimeString().slice(0, 5),
      items: prevMeal.items.map(item => ({ ...item, id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` })),
      totalCalories: prevMeal.totalCalories,
      totalProtein: prevMeal.totalProtein,
      totalCarbs: prevMeal.totalCarbs,
      totalFat: prevMeal.totalFat,
      totalFiber: prevMeal.totalFiber
    };

    const nextMeals = [newMeal, ...get().meals];
    set({ meals: nextMeals });
    api.saveMeal(newMeal);
  },

  getMealsForDate: (date) => {
    return get().meals.filter(m => m.date === date);
  },

  getDailyTotals: (date) => {
    const dayMeals = get().meals.filter(m => m.date === date);
    return dayMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: Math.round((acc.protein + meal.totalProtein) * 10) / 10,
      carbs: Math.round((acc.carbs + meal.totalCarbs) * 10) / 10,
      fat: Math.round((acc.fat + meal.totalFat) * 10) / 10,
      fiber: Math.round((acc.fiber + meal.totalFiber) * 10) / 10
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }
}));
