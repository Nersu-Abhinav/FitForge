import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { FoodSearchModal } from '@/components/nutrition/FoodSearchModal';
import { QuickAddMacroModal } from '@/components/nutrition/QuickAddMacroModal';
import { DailyMetricsModal } from '@/components/body/DailyMetricsModal';
import { MacroBreakdownBar } from '@/components/charts/MacroBreakdownBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MealType, FoodItem } from '@/types';
import { CalendarDatePicker } from '@/components/common/CalendarDatePicker';
import { getToday, getYesterday } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Utensils, 
  Plus, 
  Zap, 
  Copy, 
  Trash2, 
  Droplets, 
  Camera, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Check,
  Minus,
  RotateCcw
} from 'lucide-react';

const MEAL_TYPES: { key: MealType; title: string; subtitle: string }[] = [
  { key: 'breakfast', title: 'Breakfast', subtitle: 'High protein & complex carbs' },
  { key: 'lunch', title: 'Lunch', subtitle: 'Midday sustained energy' },
  { key: 'dinner', title: 'Dinner', subtitle: 'Recovery and muscle repair' },
  { key: 'snack', title: 'Snacks & Extras', subtitle: 'Mid-meal protein boosters' },
  { key: 'pre_workout', title: 'Pre-Workout', subtitle: 'Fast glycogen & electrolytes' },
  { key: 'post_workout', title: 'Post-Workout', subtitle: 'Rapid protein & carbohydrate recovery' }
];

export const NutritionScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    meals, 
    selectedDate, 
    setSelectedDate, 
    getMealsForDate, 
    getDailyTotals, 
    removeMealItem,
    copyPreviousDayMeal,
    quickAddMacros
  } = useNutritionStore();

  const { logs: hydroLogs, addWater, subtractWater, removeLastLog, getWaterForDate } = useHydrationStore();

  // Modals state
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialTab, setSearchInitialTab] = useState<'search' | 'ai_analyzer' | 'custom_builder'>('search');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isHydrationModalOpen, setIsHydrationModalOpen] = useState(false);

  const todayMeals = getMealsForDate(selectedDate);
  const dailyTotals = getDailyTotals(selectedDate);
  const waterConsumedMl = getWaterForDate(selectedDate);

  const calProgress = dailyTotals.calories / (user.goals.dailyCalories || 2600);
  const remainingCalories = Math.max(0, (user.goals.dailyCalories || 2600) - dailyTotals.calories);


  const handleOpenSearch = (mealType: MealType, tab: 'search' | 'ai_analyzer' | 'custom_builder' = 'search') => {
    setActiveMealType(mealType);
    setSearchInitialTab(tab);
    setIsSearchOpen(true);
  };

  const handleOpenQuickAdd = (mealType: MealType) => {
    setActiveMealType(mealType);
    setIsQuickAddOpen(true);
  };

  return (
    <div className="relative flex flex-col gap-6 w-full pb-20 md:pb-8">
      {/* Ambient Aurora Glow Lights */}
      <div className="w-[450px] h-[350px] bg-orange-500/10 rounded-full blur-[100px] absolute -top-20 -left-20 pointer-events-none" />
      <div className="w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[90px] absolute top-60 -right-20 pointer-events-none" />
      <div className="w-[300px] h-[250px] bg-emerald-500/10 rounded-full blur-[80px] absolute bottom-10 left-1/3 pointer-events-none" />

      {/* Top Banner with Date Stepper */}
      <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-emerald-400 opacity-70" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center glow-gold shrink-0 shadow-lg">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase text-orange-400 font-bold tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  Macronutrient Fuel Engine
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  Hypertrophy Fuel Pacing
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Nutrition & Macro Tracker
              </h1>
            </div>
          </div>

          {/* Interactive Calendar Date Picker with Future Locking */}
          <CalendarDatePicker
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </div>

      {/* Desktop 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 5 COLS (Macro targets, Donut, Water, AI Scanner) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Daily Macro Target Donut Card */}
          <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  Daily Caloric Goal
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
                  {dailyTotals.calories} <span className="text-sm font-normal text-slate-400">/ {user.goals.dailyCalories} kcal</span>
                </h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm text-emerald-400 font-black">{remainingCalories} kcal</span>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <ProgressRing progress={calProgress} size={124} strokeWidth={10} color="#10B981" glowColor="#10B981">
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {Math.round(calProgress * 100)}%
                </span>
                <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">Target Hit</span>
              </ProgressRing>

              <div className="flex-1 w-full">
                <MacroBreakdownBar
                  proteinG={dailyTotals.protein}
                  carbsG={dailyTotals.carbs}
                  fatG={dailyTotals.fat}
                  proteinTarget={user.goals.dailyProteinGrams || 160}
                  carbsTarget={user.goals.dailyCarbsGrams || 280}
                  fatTarget={user.goals.dailyFatGrams || 75}
                />
              </div>
            </div>
          </div>

          {/* Water Tracker Card */}
          <div className="forge-card rounded-3xl p-6 sm:p-7 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-[#0C1220] to-[#0A0E1A] shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div 
                onClick={() => {
                  triggerHaptic('light');
                  setIsHydrationModalOpen(true);
                }}
                className="flex items-center gap-3 cursor-pointer group"
                title="Tap to manage water logs"
              >
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                    Hydration Target
                    <span className="text-[10px] text-cyan-500/70 font-sans normal-case hover:underline">Manage ⚙️</span>
                  </span>
                  <div className="text-lg font-black text-white font-mono">
                    {(waterConsumedMl / 1000).toFixed(1)} L <span className="text-xs font-normal text-slate-400">/ {(user.goals.dailyWaterMl / 1000).toFixed(1)} L</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-black px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  {Math.round((waterConsumedMl / (user.goals.dailyWaterMl || 3500)) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsHydrationModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors pressable"
                  title="Open full hydration manager & log breakdown"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick 1-tap water buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[250, 500, 750, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    triggerHaptic('light');
                    addWater(amt, selectedDate);
                  }}
                  className="py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs pressable transition-all flex flex-col items-center gap-0.5 shadow-sm"
                >
                  +{amt >= 1000 ? '1L' : `${amt}ml`}
                </button>
              ))}
            </div>

            {/* Quick Decrease / Undo Row */}
            {waterConsumedMl > 0 && (
              <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between gap-2 flex-wrap animate-fade-in">
                <span className="text-[11px] font-mono text-slate-400">Reduce Water:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      subtractWater(250, selectedDate);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold transition-all flex items-center gap-1 pressable"
                  >
                    <Minus className="w-3 h-3" />
                    250ml
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      removeLastLog(selectedDate);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-all flex items-center gap-1 pressable"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo
                  </button>
                </div>
              </div>
            )}

            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${Math.min(100, (waterConsumedMl / (user.goals.dailyWaterMl || 3500)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Smart Macro Estimator / NLP Meal Parser */}
          <div 
            onClick={() => handleOpenSearch('lunch', 'ai_analyzer')}
            className="forge-card rounded-3xl p-5 border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-[#121024] to-[#0A0D18] cursor-pointer hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all pressable flex items-center justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>Smart Macro Estimator</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold tracking-wider uppercase">
                    NLP Parser
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Natural language meal parsing & instant macronutrient calculation</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 7 COLS (6 Meal Slots with Items) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              Meals Logged for {selectedDate === getToday() ? 'Today' : selectedDate === getYesterday() ? 'Yesterday' : selectedDate}
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {todayMeals.reduce((sum, m) => sum + m.items.length, 0)} Items Tracked
            </span>
          </div>

          <div className="space-y-4">
            {MEAL_TYPES.map((slot) => {
              const loggedMeal = todayMeals.find(m => m.type === slot.key);
              const hasItems = loggedMeal && loggedMeal.items.length > 0;

              // Meal-specific luxury themes and color systems
              const slotConfig: Record<MealType, { 
                icon: string; 
                tag: string; 
                timing: string;
                bgGradient: string;
                borderColor: string;
                glowSphereColor: string;
                iconBg: string;
                iconColor: string;
              }> = {
                breakfast: { 
                  icon: '🌅', 
                  tag: 'Morning Ignition',
                  timing: '07:00 – 10:00',
                  bgGradient: 'from-amber-950/30 via-[#12101E] to-[#0A0E1A]',
                  borderColor: 'border-amber-500/30 hover:border-amber-500/60',
                  glowSphereColor: 'bg-amber-500/10',
                  iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
                  iconColor: 'text-amber-400'
                },
                lunch: { 
                  icon: '☀️', 
                  tag: 'Midday Power',
                  timing: '12:00 – 15:00',
                  bgGradient: 'from-cyan-950/30 via-[#0B1526] to-[#0A0E1A]',
                  borderColor: 'border-cyan-500/30 hover:border-cyan-500/60',
                  glowSphereColor: 'bg-cyan-500/10',
                  iconBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
                  iconColor: 'text-cyan-400'
                },
                dinner: { 
                  icon: '🌙', 
                  tag: 'Nocturnal Recovery',
                  timing: '19:00 – 22:00',
                  bgGradient: 'from-indigo-950/30 via-[#100E26] to-[#0A0E1A]',
                  borderColor: 'border-indigo-500/30 hover:border-indigo-500/60',
                  glowSphereColor: 'bg-indigo-500/10',
                  iconBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
                  iconColor: 'text-indigo-400'
                },
                snack: { 
                  icon: '⚡', 
                  tag: 'Glycogen Boost',
                  timing: 'Between Meals',
                  bgGradient: 'from-yellow-950/30 via-[#14120E] to-[#0A0E1A]',
                  borderColor: 'border-yellow-500/30 hover:border-yellow-500/60',
                  glowSphereColor: 'bg-yellow-500/10',
                  iconBg: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
                  iconColor: 'text-yellow-400'
                },
                pre_workout: { 
                  icon: '🚀', 
                  tag: 'High-Octane Pre-Load',
                  timing: '30-60m Pre-Lift',
                  bgGradient: 'from-rose-950/30 via-[#1A0E16] to-[#0A0E1A]',
                  borderColor: 'border-rose-500/30 hover:border-rose-500/60',
                  glowSphereColor: 'bg-rose-500/10',
                  iconBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
                  iconColor: 'text-rose-400'
                },
                post_workout: { 
                  icon: '🧬', 
                  tag: 'Anabolic Window',
                  timing: '0-45m Post-Lift',
                  bgGradient: 'from-emerald-950/30 via-[#0A181C] to-[#0A0E1A]',
                  borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
                  glowSphereColor: 'bg-emerald-500/10',
                  iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                  iconColor: 'text-emerald-400'
                }
              };

              const currentConfig = slotConfig[slot.key];

              // Proportional macro calculation for the live ratio bar
              const totalMacroGrams = hasItems 
                ? (loggedMeal.totalProtein + loggedMeal.totalCarbs + loggedMeal.totalFat) || 1
                : 1;
              const proteinPct = hasItems ? Math.round((loggedMeal.totalProtein / totalMacroGrams) * 100) : 0;
              const carbsPct = hasItems ? Math.round((loggedMeal.totalCarbs / totalMacroGrams) * 100) : 0;
              const fatPct = hasItems ? Math.round((loggedMeal.totalFat / totalMacroGrams) * 100) : 0;

              return (
                <div
                  key={slot.key}
                  className={`forge-card rounded-3xl p-5 sm:p-6 border bg-gradient-to-br ${currentConfig.bgGradient} ${currentConfig.borderColor} shadow-2xl space-y-4 transition-all duration-300 relative overflow-hidden backdrop-blur-md`}
                >
                  {/* Atmospheric Glow Sphere */}
                  <div className={`absolute top-0 right-0 w-48 h-48 ${currentConfig.glowSphereColor} rounded-full blur-2xl pointer-events-none`} />

                  {/* Header: Identity, Timing, Tag & Macro Ribbon / Copy Yesterday */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3.5">
                      {/* Illuminated Icon Pod */}
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shadow-lg shrink-0 ${currentConfig.iconBg}`}>
                        {currentConfig.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-white tracking-tight">{slot.title}</h3>
                          <span className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 ${currentConfig.iconColor} flex items-center gap-1.5 shadow-sm`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {currentConfig.tag}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {currentConfig.timing}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{slot.subtitle}</p>
                      </div>
                    </div>

                    {/* Right Side: Macro Stats or Copy Yesterday */}
                    {hasItems ? (
                      <div className="flex flex-col items-end shrink-0 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 shadow-sm">
                            🔥 {loggedMeal.totalCalories} <span className="text-xs font-normal text-slate-300">kcal</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1.5">
                          <span className="text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                            P: {loggedMeal.totalProtein}g
                          </span>
                          <span className="text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                            C: {loggedMeal.totalCarbs}g
                          </span>
                          <span className="text-rose-300 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                            F: {loggedMeal.totalFat}g
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          copyPreviousDayMeal(slot.key, selectedDate);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 text-xs font-mono font-bold flex items-center gap-2 transition-all pressable shadow-sm shrink-0 self-start sm:self-auto group"
                        title="Copy yesterday's meal"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Copy Yesterday</span>
                      </button>
                    )}
                  </div>

                  {/* Micro Macro Distribution Strip (When items logged) */}
                  {hasItems && (
                    <div className="space-y-1 relative z-10 pt-1">
                      <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden flex shadow-inner">
                        <div style={{ width: `${proteinPct}%` }} className="h-full bg-cyan-400" title={`Protein: ${proteinPct}%`} />
                        <div style={{ width: `${carbsPct}%` }} className="h-full bg-amber-400" title={`Carbs: ${carbsPct}%`} />
                        <div style={{ width: `${fatPct}%` }} className="h-full bg-rose-400" title={`Fat: ${fatPct}%`} />
                      </div>
                    </div>
                  )}

                  {/* Logged Food Items List */}
                  {hasItems && (
                    <div className="space-y-2 pt-2 border-t border-white/10 relative z-10">
                      {loggedMeal.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-colors shadow-inner"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-100 text-sm truncate">{item.name}</span>
                              <span className="text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                {item.servingDescription}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-mono mt-1 text-slate-400 flex-wrap">
                              <span className="text-cyan-400 font-semibold">{item.protein}g protein</span>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">{item.carbs}g carbs</span>
                              <span>•</span>
                              <span className="text-rose-400 font-semibold">{item.fat}g fat</span>
                              {item.fiber !== undefined && item.fiber > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-semibold">{item.fiber}g fiber</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-emerald-400 font-black text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {item.calories} kcal
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('medium');
                                removeMealItem(loggedMeal.id, item.id);
                              }}
                              className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors pressable"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3 Tactical Action Capsules: Search Food, AI Vision Scan, Quick Macros */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10 relative z-10">
                    <button
                      type="button"
                      onClick={() => handleOpenSearch(slot.key, 'search')}
                      className="py-2.5 px-2 rounded-2xl bg-[#0C1424] hover:bg-[#121F38] text-slate-200 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all pressable border border-white/10 shadow-md hover:border-cyan-400/50 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400 stroke-[3] shrink-0" />
                      <span>Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSearch(slot.key, 'ai_analyzer')}
                      className="py-2.5 px-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 hover:text-emerald-200 font-mono font-black text-xs flex items-center justify-center gap-1.5 transition-all pressable border border-emerald-500/40 shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300 shrink-0" />
                      <span>AI Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickAdd(slot.key)}
                      className="py-2.5 px-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all pressable border border-amber-500/30 shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] whitespace-nowrap"
                      title="Quick Add Macros"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                      <span>Quick Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Food Search Modal */}
      <FoodSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        mealType={activeMealType}
        targetDate={selectedDate}
        initialTab={searchInitialTab}
      />

      {/* Quick Add Macro Modal */}
      <QuickAddMacroModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        mealType={activeMealType}
        targetDate={selectedDate}
      />

      {/* Daily Metrics & Hydration Manager Modal */}
      <DailyMetricsModal
        isOpen={isHydrationModalOpen}
        onClose={() => setIsHydrationModalOpen(false)}
        initialTab="hydration"
        initialDate={selectedDate}
      />

    </div>
  );
};
