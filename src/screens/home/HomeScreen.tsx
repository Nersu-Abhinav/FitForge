import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useSyncStore } from '@/store/useSyncStore';
import { generateFitnessInsights } from '@/features/ai/insightsEngine';
import { getToday, getLocalDateString, offsetDateString } from '@/utils/date';
import { selectCurrentWorkoutStreak } from '@/utils/streak';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { VolumeBarChart } from '@/components/charts/VolumeBarChart';
import { DailyMetricsModal, MetricTab } from '@/components/body/DailyMetricsModal';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Flame, 
  Dumbbell, 
  Utensils, 
  Droplets, 
  Moon, 
  Scale, 
  Sparkles, 
  ChevronRight, 
  Trophy, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Activity,
  Plus,
  Clock,
  Play,
  Edit3,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Award
} from 'lucide-react';

import { TabKey } from '@/components/navigation/BottomTabBar';

interface HomeScreenProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenActiveWorkout: () => void;
  onOpenQuickAction: () => void;
  onOpenAIAdvisor: (query?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateTab,
  onOpenActiveWorkout,
  onOpenQuickAction,
  onOpenAIAdvisor
}) => {
  const { user } = useAuthStore();
  const { workouts, activeWorkout, prs, startWorkout, weeklySplit } = useWorkoutStore();
  const { meals, getDailyTotals } = useNutritionStore();
  const { logs: hydrationLogs, getWaterForDate, addWater } = useHydrationStore();
  const { measurements, sleepLogs, recoveryLogs, getLatestWeight, getSleepForDate, getRecoveryForDate } = useBodyStore();
  const { isOnline, isSyncing, pendingCount, failedCount, permanentFailureCount } = useSyncStore();

  const todayStr = getToday();
  const dailyNutrition = getDailyTotals(todayStr);
  const waterConsumedMl = getWaterForDate(todayStr);
  const todaySleep = getSleepForDate(todayStr);
  const todayRecovery = getRecoveryForDate(todayStr);
  const currentWeightKg = getLatestWeight();
  const currentStreak = selectCurrentWorkoutStreak(workouts);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const insights = generateFitnessInsights({
    workouts,
    meals,
    hydration: hydrationLogs,
    measurements,
    sleepLogs,
    recoveryLogs,
    goals: user.goals
  });
  const primaryInsight = insights[0] || {
    id: 'default',
    title: 'Ready for Training',
    message: 'Log your sets and nutrition consistently to build progressive overload.',
    impact: 'positive'
  };

  const [metricsModalTab, setMetricsModalTab] = useState<MetricTab | null>(null);

  const todayDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const scheduledToday = weeklySplit.find(s => s.dayIndex === todayDayIndex) || weeklySplit[0];

  const calProgress = dailyNutrition.calories / (user.goals.dailyCalories || 2600);
  const proProgress = dailyNutrition.protein / (user.goals.dailyProteinGrams || 160);
  const waterProgress = waterConsumedMl / (user.goals.dailyWaterMl || 3500);

  const cutoffSevenDays = offsetDateString(todayStr, -7);
  const weeklyWorkouts = workouts.filter(w => {
    return w.date >= cutoffSevenDays && w.date <= todayStr;
  });

  // Dynamic 7-Day volume calculation from real logged workouts
  const today = new Date();
  const dayOfWeekIndex = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeekIndex);
  startOfWeek.setHours(0, 0, 0, 0);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const volumeData = daysOfWeek.map((day, idx) => {
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + idx);
    const dateStr = getLocalDateString(targetDate);

    const dayWorkouts = workouts.filter(w => w.date === dateStr);
    const totalDayVolume = dayWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

    return {
      day,
      volumeKg: totalDayVolume,
      isToday: idx === dayOfWeekIndex
    };
  });

  const totalWeekVolume = volumeData.reduce((sum, d) => sum + d.volumeKg, 0);

  // Pure Database Recovery score calculation
  const calculatedRecovery = todayRecovery 
    ? (todayRecovery.calculatedScore ?? todayRecovery.recoveryScore ?? Math.round(((todayRecovery.energyLevel / 10) * 40) + (((10 - todayRecovery.sorenessLevel) / 10) * 30) + (((10 - todayRecovery.stressLevel) / 10) * 30)))
    : null;
  const overallTargetScore = Math.round(((calProgress + proProgress + waterProgress) / 3) * 100);

  return (
    <div className="relative flex flex-col gap-6 w-full pb-20 md:pb-8 animate-fade-in select-none">
      {/* Ambient Aurora Glow Lights */}
      <div className="w-[500px] h-[380px] bg-emerald-500/10 rounded-full blur-[120px] absolute -top-24 -left-24 pointer-events-none" />
      <div className="w-[450px] h-[340px] bg-cyan-500/10 rounded-full blur-[110px] absolute top-48 -right-24 pointer-events-none" />
      <div className="w-[380px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] absolute bottom-12 left-1/3 pointer-events-none" />

      {/* 1. Elite Hero Command Center Banner */}
      <div className="relative forge-card rounded-3xl p-6 sm:p-7 border border-emerald-500/30 bg-gradient-to-br from-[#0A1220] via-[#0D1829] to-[#070D18] overflow-hidden shadow-2xl hud-border">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </span>

              <span 
                onClick={() => {
                  triggerHaptic('light');
                  onNavigateTab('health');
                }}
                className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 cursor-pointer transition-all pressable shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {calculatedRecovery !== null ? `${calculatedRecovery}% Readiness` : 'Check-in Today'}
              </span>

              {currentStreak > 0 && (
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {currentStreak}d Streak
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-2.5">
              {greeting}, <span className="gradient-text-volt">{user.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {workouts.length > 0 
                ? 'Your training metrics and recovery telemetry are actively synchronized with TiDB Cloud.'
                : 'Welcome to FitForge! Start a workout or log your nutrition to track progressive overload.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Hydrate Sip Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                addWater(500);
              }}
              className="p-3 px-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center gap-2.5 transition-all pressable shadow-sm group"
              title="Quick Add 500ml Water"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="text-left font-mono">
                <div className="text-xs font-black">+500ml</div>
                <div className="text-[9px] text-cyan-400/80 uppercase font-bold">Hydrate</div>
              </div>
            </button>

            {/* Logged Sessions Pill */}
            <div className="p-3 px-3.5 rounded-2xl bg-[#0F172A]/90 border border-white/10 flex items-center gap-2.5 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono shadow-inner">
                {workouts.length}
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Sessions</div>
                <div className="text-[10px] font-mono font-semibold">
                  {!isOnline ? (
                    <span className="text-zinc-400">⌁ Offline</span>
                  ) : isSyncing ? (
                    <span className="text-cyan-400 animate-pulse">☁ Syncing</span>
                  ) : permanentFailureCount > 0 || failedCount > 0 ? (
                    <span className="text-rose-400">⚠ Error</span>
                  ) : pendingCount > 0 ? (
                    <span className="text-amber-400">⚠ {pendingCount} sync</span>
                  ) : workouts.length > 0 ? (
                    <span className="text-emerald-400">☁ Synced</span>
                  ) : (
                    <span className="text-slate-400">0 Records</span>
                  )}
                </div>
              </div>
            </div>

            {/* Instant Start Workout Action */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                if (activeWorkout) {
                  onOpenActiveWorkout();
                } else {
                  startWorkout(`${scheduledToday.dayName}: ${scheduledToday.title}`, scheduledToday.exerciseIds);
                  onOpenActiveWorkout();
                }
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:brightness-110 pressable transition-all flex items-center gap-2 shrink-0 animate-shimmer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{activeWorkout ? 'Resume Session' : 'Start Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Responsive Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 8 COLS (Target metrics, Live workout) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card: Daily Target Metrics (Calories, Protein, Hydration + Sleep, Weight, Soreness) */}
          <div className="forge-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Daily Nutritional & Health Targets
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">Today's Progress & Recovery</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                {overallTargetScore}% Hit
              </span>
            </div>

            {/* Triple Glowing Progress Rings (Compact 3-in-1 Side-by-Side Grid) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-5 text-center">
              
              {/* 1. Calories Dial */}
              <div 
                onClick={() => {
                  triggerHaptic('light');
                  onNavigateTab('nutrition');
                }}
                className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#10172B] to-[#0A0E1A] border border-white/10 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer transition-all pressable group relative overflow-hidden"
                title="Click to view & log meals"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="scale-95 sm:scale-100 transition-transform">
                  <ProgressRing progress={calProgress} size={92} strokeWidth={8} color="#10B981" glowColor="#10B981">
                    <span className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
                      {dailyNutrition.calories}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">kcal</span>
                  </ProgressRing>
                </div>
                <div className="flex items-center gap-0.5 mt-2.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">Calories</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                  {Math.round(calProgress * 100)}% target
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  ({Math.max(0, user.goals.dailyCalories - dailyNutrition.calories)} left)
                </span>
              </div>

              {/* 2. Protein Dial */}
              <div 
                onClick={() => {
                  triggerHaptic('light');
                  onNavigateTab('nutrition');
                }}
                className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#10172B] to-[#0A0E1A] border border-white/10 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer transition-all pressable group relative overflow-hidden"
                title="Click to view & log meals"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="scale-95 sm:scale-100 transition-transform">
                  <ProgressRing progress={proProgress} size={92} strokeWidth={8} color="#06B6D4" glowColor="#06B6D4">
                    <span className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
                      {dailyNutrition.protein}g
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">protein</span>
                  </ProgressRing>
                </div>
                <div className="flex items-center gap-0.5 mt-2.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">Protein</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                </div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold mt-0.5">
                  {Math.round(proProgress * 100)}% target
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  ({Math.max(0, user.goals.dailyProteinGrams - dailyNutrition.protein)}g left)
                </span>
              </div>

              {/* 3. Hydration Dial */}
              <div 
                onClick={() => {
                  triggerHaptic('light');
                  setMetricsModalTab('hydration');
                }}
                className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#10172B] to-[#0A0E1A] border border-white/10 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer transition-all pressable group relative overflow-hidden"
                title="Click to log water"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="scale-95 sm:scale-100 transition-transform">
                  <ProgressRing progress={waterProgress} size={92} strokeWidth={8} color="#38BDF8" glowColor="#38BDF8">
                    <span className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
                      {(waterConsumedMl / 1000).toFixed(1)}L
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">water</span>
                  </ProgressRing>
                </div>
                <div className="flex items-center gap-0.5 mt-2.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors">Hydration</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-sky-400" />
                </div>
                <span className="text-[10px] text-sky-400 font-mono font-bold mt-0.5">
                  {Math.round(waterProgress * 100)}% target
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  ({Math.max(0, Math.round((user.goals.dailyWaterMl - waterConsumedMl) / 100) / 10)}L left)
                </span>
              </div>
            </div>

            {/* Sub-Metrics: Sleep, Weight, Soreness - Direct Tap to Add/Edit (Compact 3-in-1 Row) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-white/5">
              
              {/* 1. SLEEP CARD */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setMetricsModalTab('sleep');
                }}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-[#0E1322] border border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between text-left transition-all pressable group cursor-pointer shadow-md gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-200 font-bold group-hover:text-purple-300">
                      Sleep
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                      {todaySleep ? `${todaySleep.qualityScore}% Q` : 'Log rest'}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] sm:text-xs font-bold text-white group-hover:text-purple-300">
                  {todaySleep ? `${Math.floor(todaySleep.durationMinutes / 60)}h ${todaySleep.durationMinutes % 60}m` : '+ Add'}
                </div>
              </button>

              {/* 2. WEIGHT CARD */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setMetricsModalTab('weight');
                }}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-[#0E1322] border border-white/10 hover:border-amber-500/50 hover:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between text-left transition-all pressable group cursor-pointer shadow-md gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-200 font-bold group-hover:text-amber-300">
                      Weight
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                      {currentWeightKg > 0 ? 'Weigh-in' : 'Record'}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300">
                  {currentWeightKg > 0 ? `${currentWeightKg} ${user.unitSystem === 'imperial' ? 'lb' : 'kg'}` : '+ Add'}
                </div>
              </button>

              {/* 3. SORENESS / READINESS CARD */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setMetricsModalTab('recovery');
                }}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-[#0E1322] border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between text-left transition-all pressable group cursor-pointer shadow-md gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs text-slate-200 font-bold group-hover:text-emerald-300">
                      Soreness
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                      {todayRecovery ? `${todayRecovery.sorenessLevel}/10 DOMS` : 'Check-in'}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] sm:text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  {todayRecovery ? `${calculatedRecovery}%` : '+ Add'}
                </div>
              </button>

            </div>
          </div>

          {/* Card: Recommended Workout Session (Dynamically matches user's Mon-Sun split) */}
          <div className="forge-card rounded-3xl p-6 sm:p-7 border border-emerald-500/40 bg-gradient-to-br from-[#0E1528] via-[#10182E] to-[#0A101C] shadow-2xl relative overflow-hidden hud-border">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-volt shrink-0 shadow-lg">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeWorkout 
                      ? 'Live Session In Progress' 
                      : `${scheduledToday.dayName}'s Programmed Session • ${scheduledToday.tag}`}
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                    {activeWorkout ? activeWorkout.name : scheduledToday.title}
                  </h3>
                </div>
              </div>

              {activeWorkout ? (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenActiveWorkout();
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt hover:brightness-110 pressable transition-all flex items-center gap-2 shrink-0 animate-shimmer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Resume Session
                </button>
              ) : scheduledToday.isRest ? (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setMetricsModalTab('recovery');
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg pressable transition-all flex items-center gap-2 shrink-0"
                >
                  <Moon className="w-4 h-4 text-slate-950" />
                  Active Recovery Check
                </button>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    startWorkout(`${scheduledToday.dayName}: ${scheduledToday.title}`, scheduledToday.exerciseIds);
                    onOpenActiveWorkout();
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt pressable transition-all flex items-center gap-2 shrink-0 animate-shimmer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Start Today's Split
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/10 text-center text-xs font-mono relative z-10">
              <div className="p-3 rounded-2xl bg-[#141D32]/80 border border-white/10 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Movements</div>
                <div className="text-white font-black text-sm mt-0.5">
                  {scheduledToday.isRest ? 'Rest' : `${scheduledToday.exerciseIds.length} Exercises`}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#141D32]/80 border border-white/10 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Duration</div>
                <div className="text-white font-black text-sm mt-0.5">
                  {scheduledToday.isRest ? 'Recharge' : `~${scheduledToday.estimatedMinutes} mins`}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#141D32]/80 border border-white/10 shadow-sm">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Target RPE</div>
                <div className="text-emerald-300 font-black text-sm mt-0.5">
                  {scheduledToday.isRest ? '0.0 (Rest)' : '8.0 - 9.0'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#141D32]/80 border border-white/10 shadow-sm">
                <div className="text-[10px] font-bold text-cyan-400 uppercase">Split Focus</div>
                <div className="text-white font-black text-sm mt-0.5 truncate px-1">
                  {scheduledToday.isRest ? 'Regeneration' : scheduledToday.title}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 COLS (AI Insights, Volume Chart, PR Showcase, Streaks) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* AI Performance Intelligence Card with Glowing Cyber Gradient Border */}
          <div 
            className="forge-card rounded-3xl p-6 border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-[#10152A] to-[#0D1220] shadow-2xl hover:border-purple-400 hover:shadow-purple-500/20 transition-all group relative overflow-hidden hud-border"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

            <div 
              onClick={() => {
                triggerHaptic('light');
                onOpenAIAdvisor();
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3.5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white border border-purple-400/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-purple-500/25">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase text-purple-400 font-bold tracking-wider">
                        Apex AI Agent
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold">
                        v3.2
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white">{primaryInsight.title}</h3>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:translate-x-1 group-hover:bg-purple-500/20 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                {primaryInsight.message}
              </p>

              {primaryInsight.actionableTip && (
                <div className="mt-3 p-3 rounded-2xl bg-black/50 border border-purple-500/25 text-[11px] text-emerald-300 relative z-10 shadow-inner flex items-start gap-1.5">
                  <span className="shrink-0">⚡</span>
                  <div>
                    <strong className="text-white">Coach Directive:</strong> {primaryInsight.actionableTip}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Launcher Pills */}
            <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap gap-1.5 relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onOpenAIAdvisor('Show todays workout overload targets');
                }}
                className="px-2.5 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold transition-all pressable flex items-center gap-1"
              >
                🦾 Overload Targets
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onOpenAIAdvisor('What should I eat for my remaining macros?');
                }}
                className="px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-all pressable flex items-center gap-1"
              >
                🥗 Fuel Blueprint
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onOpenAIAdvisor('Analyze my muscle fatigue & recovery score');
                }}
                className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition-all pressable flex items-center gap-1"
              >
                🔬 Fatigue Radar
              </button>
            </div>
          </div>

          {/* 7-Day Training Volume Chart Mini */}
          <div className="forge-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">Weekly Load</span>
                <div className="text-sm font-black text-white mt-0.5">Volume Progression</div>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                {totalWeekVolume.toLocaleString()} kg
              </span>
            </div>
            <VolumeBarChart data={volumeData} height={120} />
          </div>

          {/* Consistency Streak Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#11182B] to-[#0A0E1A] border border-amber-500/20 shadow-xl flex items-center justify-between hud-border">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg glow-gold">
                <Flame className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{currentStreak > 0 ? `${currentStreak}-Day Active Streak` : 'Consistency Tracker'}</span>
                  {currentStreak >= 3 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      🔥 Streak
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  This Week: {weeklyWorkouts.length} / 5 workouts completed
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              {weeklyWorkouts.length >= 3 ? '🔥 On Track' : currentStreak > 0 ? `${currentStreak}d Streak` : '⚡ Start Today'}
            </div>
          </div>

        </div>

      </div>

      {/* Universal Daily Metrics & Recovery Modal */}
      <DailyMetricsModal
        isOpen={metricsModalTab !== null}
        onClose={() => setMetricsModalTab(null)}
        initialTab={metricsModalTab || 'weight'}
      />
    </div>
  );
};
