import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useSyncStore } from '@/store/useSyncStore';
import { api, HealthStatus } from '@/services/api';
import { getToday } from '@/utils/date';
import { selectCurrentWorkoutStreak } from '@/utils/streak';
import { escapeCsv } from '@/utils/csv';
import { triggerHaptic } from '@/utils/haptics';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { 
  User, 
  Settings, 
  Target, 
  Cloud, 
  Download, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  Sliders,
  Scale,
  Database,
  Flame,
  Award,
  Sparkles,
  Edit3,
  Dumbbell,
  Droplets,
  Activity,
  ChevronRight,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Moon
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, updateGoals, toggleUnitSystem } = useAuthStore();
  const { workouts, prs } = useWorkoutStore();
  const { meals } = useNutritionStore();
  const { logs: hydroLogs } = useHydrationStore();
  const { measurements, sleepLogs, recoveryLogs, getLatestWeight } = useBodyStore();
  const { isSyncing, syncNow, lastSyncTime, pendingCount, failedCount } = useSyncStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editLevel, setEditLevel] = useState(user.fitnessLevel);
  const [editGoalType, setEditGoalType] = useState(user.goals.goalType);

  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalCalories, setGoalCalories] = useState(String(user.goals.dailyCalories || 2600));
  const [goalProtein, setGoalProtein] = useState(String(user.goals.dailyProteinGrams || 160));
  const [goalCarbs, setGoalCarbs] = useState(String(user.goals.dailyCarbsGrams || 280));
  const [goalFat, setGoalFat] = useState(String(user.goals.dailyFatGrams || 75));
  const [goalWater, setGoalWater] = useState(String(user.goals.dailyWaterMl || 3500));
  const [targetWeight, setTargetWeight] = useState(String(user.goals.targetWeightKg || 78.5));
  const [targetSleep, setTargetSleep] = useState(String(user.goals.targetSleepHours || 8.0));

  const [syncFeedback, setSyncFeedback] = useState<'idle' | 'synced' | 'failed'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const currentStreak = selectCurrentWorkoutStreak(workouts);
  const totalVolumeKg = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const currentWeight = getLatestWeight();

  const refreshHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await api.getHealth();
      setHealthData(health);
    } catch (err) {
      console.warn('Failed to fetch health status:', err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    await updateProfile({
      name: editName.trim() || user.name,
      fitnessLevel: editLevel
    });
    await updateGoals({
      goalType: editGoalType
    });
    setIsEditingProfile(false);
  };

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    await updateGoals({
      dailyCalories: parseInt(goalCalories, 10) || 2600,
      dailyProteinGrams: parseInt(goalProtein, 10) || 160,
      dailyCarbsGrams: parseInt(goalCarbs, 10) || 280,
      dailyFatGrams: parseInt(goalFat, 10) || 75,
      dailyWaterMl: parseInt(goalWater, 10) || 3500,
      targetWeightKg: parseFloat(targetWeight) || 78.5,
      targetSleepHours: parseFloat(targetSleep) || 8.0
    });
    setIsEditingGoals(false);
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    triggerHaptic('medium');
    try {
      setSyncFeedback('idle');
      await syncNow();
      setSyncFeedback('synced');
      await refreshHealth();
      setTimeout(() => setSyncFeedback('idle'), 3500);
    } catch (err) {
      console.error('Manual sync pipeline error:', err);
      setSyncFeedback('failed');
      setTimeout(() => setSyncFeedback('idle'), 3500);
    }
  };

  const handleExportJSON = () => {
    triggerHaptic('light');
    const fullData = {
      exportedAt: new Date().toISOString(),
      user,
      workouts,
      prs,
      meals,
      hydration: hydroLogs,
      measurements,
      sleep: sleepLogs,
      recovery: recoveryLogs
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitforge_backup_${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportMessage('Full JSON export downloaded successfully!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  const handleExportCSV = () => {
    triggerHaptic('light');
    let csv = 'Date,Workout Name,Duration Minutes,Volume Kg,Rating,Calories\n';
    workouts.forEach(w => {
      const dateVal = escapeCsv(w.date);
      const nameVal = escapeCsv(w.name);
      const durationVal = escapeCsv(Math.round((w.durationSeconds || 0) / 60));
      const volumeVal = escapeCsv(w.totalVolumeKg !== undefined && w.totalVolumeKg !== null ? w.totalVolumeKg : 0);
      const ratingVal = escapeCsv(w.rating !== undefined && w.rating !== null ? w.rating : '');
      const calVal = escapeCsv(w.caloriesBurned !== undefined && w.caloriesBurned !== null ? w.caloriesBurned : '');
      csv += `${dateVal},${nameVal},${durationVal},${volumeVal},${ratingVal},${calVal}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitforge_workouts_${getToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setExportMessage('Workout CSV report exported!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  return (
    <div className="relative flex flex-col gap-6 w-full pb-20 md:pb-8">
      {/* Ambient Aurora Glow Lights */}
      <div className="w-[450px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] absolute -top-20 -left-20 pointer-events-none" />
      <div className="w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[90px] absolute top-60 -right-20 pointer-events-none" />

      {/* 1. ATHLETE PRO PASSPORT HERO CARD */}
      <div className="relative forge-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl overflow-hidden">
        {/* Top Hairline Neon Gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 via-teal-400 to-purple-400 opacity-80" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar with Glow Ring */}
            <div className="relative group">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(16,185,129,0.35)] glow-volt">
                <div className="w-full h-full bg-[#080C14] rounded-[22px] flex items-center justify-center font-black text-3xl sm:text-4xl text-emerald-400">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#080C14] flex items-center justify-center text-[10px] text-slate-950 font-black shadow-md">
                ✓
              </span>
            </div>

            {/* Name & Athlete Tags */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
                  {user.fitnessLevel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-wider">
                  {user.goals.goalType.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono">{user.email}</p>

              <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                <span className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {currentStreak}d Streak
                </span>
                <span>•</span>
                <span>Joined {user.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsEditingProfile(!isEditingProfile);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all pressable shadow-sm"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg pressable transition-all flex items-center gap-2 disabled:opacity-50 ${
                syncFeedback === 'synced'
                  ? 'bg-emerald-400 text-slate-950 glow-volt'
                  : syncFeedback === 'failed'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 glow-volt'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : syncFeedback === 'synced' ? 'Synced' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Edit Profile Form Overlay/Accordion */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in relative z-10">
            <div>
              <label className="text-xs font-mono text-slate-300 font-medium">Athlete Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white text-xs font-sans focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 font-medium">Fitness Level</label>
              <select
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value as any)}
                className="w-full mt-1 px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white text-xs font-sans focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="elite">Elite</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 font-medium">Primary Focus</label>
              <select
                value={editGoalType}
                onChange={(e) => setEditGoalType(e.target.value as any)}
                className="w-full mt-1 px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white text-xs font-sans focus:outline-none"
              >
                <option value="muscle_gain">Muscle Hypertrophy</option>
                <option value="strength">Pure Strength</option>
                <option value="fat_loss">Fat Loss & Cutting</option>
                <option value="endurance">Endurance & Conditioning</option>
                <option value="maintenance">Health & Maintenance</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md glow-volt pressable"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* Athlete Fast Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10 relative z-10">
          <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Workouts</span>
            <div className="text-base sm:text-lg font-black text-white font-mono">{workouts.length} Sessions</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400">Volume Lifted</span>
            <div className="text-base sm:text-lg font-black text-emerald-300 font-mono">{(totalVolumeKg / 1000).toFixed(1)}k kg</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400">Current Weight</span>
            <div className="text-base sm:text-lg font-black text-cyan-300 font-mono">
              {currentWeight > 0 ? `${currentWeight} kg` : '—'}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-purple-400">Target Weight</span>
            <div className="text-base sm:text-lg font-black text-purple-300 font-mono">{user.goals.targetWeightKg || 78.5} kg</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/35 border border-purple-500/20 bg-purple-500/5 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase text-purple-300 flex items-center gap-1">
              <Moon className="w-3 h-3 text-purple-400" />
              Target Sleep
            </span>
            <div className="text-base sm:text-lg font-black text-purple-200 font-mono">{user.goals.targetSleepHours || 8.0} hrs</div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 6 COLS (Nutrition Targets & Unit Preferences) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* DAILY NUTRITIONAL & LIFESTYLE TARGETS CARD */}
          <div className="forge-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Daily Macro & Health Targets</h3>
                  <p className="text-xs text-slate-400">Calibrated for {user.goals.goalType.replace('_', ' ')}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsEditingGoals(!isEditingGoals);
                }}
                className="text-xs text-emerald-400 hover:underline font-bold font-mono"
              >
                {isEditingGoals ? 'Cancel' : 'Edit Targets'}
              </button>
            </div>

            {isEditingGoals ? (
              <form onSubmit={handleSaveGoals} className="space-y-4 pt-2 animate-fade-in">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium">Calories (kcal)</label>
                    <input
                      type="number"
                      value={goalCalories}
                      onChange={(e) => setGoalCalories(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium">Water (ml)</label>
                    <input
                      type="number"
                      value={goalWater}
                      onChange={(e) => setGoalWater(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
                      <Moon className="w-3 h-3 text-purple-400" />
                      Sleep (hrs)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={targetSleep}
                      onChange={(e) => setTargetSleep(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-black/60 border border-purple-500/30 focus:border-purple-400 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[11px] text-emerald-400 font-bold">Protein (g)</label>
                    <input
                      type="number"
                      value={goalProtein}
                      onChange={(e) => setGoalProtein(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-cyan-400 font-bold">Carbs (g)</label>
                    <input
                      type="number"
                      value={goalCarbs}
                      onChange={(e) => setGoalCarbs(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-400 font-bold">Fat (g)</label>
                    <input
                      type="number"
                      value={goalFat}
                      onChange={(e) => setGoalFat(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-black/60 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md glow-volt pressable"
                >
                  Save New Targets
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-center text-xs font-mono pt-1">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Calories</div>
                  <div className="text-sm sm:text-base font-black text-white mt-0.5">{user.goals.dailyCalories} kcal</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[10px] text-emerald-400 uppercase">Protein</div>
                  <div className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">{user.goals.dailyProteinGrams} g</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[10px] text-cyan-400 uppercase">Carbs</div>
                  <div className="text-sm sm:text-base font-black text-cyan-300 mt-0.5">{user.goals.dailyCarbsGrams} g</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[10px] text-cyan-300 uppercase">Water</div>
                  <div className="text-sm sm:text-base font-black text-cyan-300 mt-0.5">{(user.goals.dailyWaterMl / 1000).toFixed(1)} L</div>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 col-span-3 sm:col-span-3 md:col-span-1">
                  <div className="text-[10px] text-purple-300 uppercase">Sleep Target</div>
                  <div className="text-sm sm:text-base font-black text-purple-200 mt-0.5">{user.goals.targetSleepHours || 8.0} hrs</div>
                </div>
              </div>
            )}
          </div>

          {/* APP & TRAINING PREFERENCES */}
          <div className="forge-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Preferences & Controls</h3>
                <p className="text-xs text-slate-400">Units, haptics, and system preferences</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Unit System Switcher */}
              <div className="p-4 rounded-2xl bg-black/35 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white">Measurement Units</span>
                    <p className="text-[11px] text-slate-400">Metric (kg, cm) vs Imperial (lb, in)</p>
                  </div>
                </div>

                <div className="flex items-center bg-[#070A12] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      if (user.unitSystem !== 'metric') toggleUnitSystem();
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      user.unitSystem === 'metric'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    KG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (user.unitSystem !== 'imperial') toggleUnitSystem();
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      user.unitSystem === 'imperial'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    LB
                  </button>
                </div>
              </div>

              {/* Offline First Guarantee */}
              <div className="p-4 rounded-2xl bg-black/35 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white">Offline-First Engine</span>
                    <p className="text-[11px] text-slate-400">IndexedDB persistence with zero-latency instant boots</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 6 COLS (Cloud Infrastructure & Data Export) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* TIDB CLOUD DISTRIBUTED DATABASE CARD */}
          <div className="forge-card rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-[#0D1322] to-[#0A0E1A] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    TiDB Cloud Persistence
                    <span className={`w-2 h-2 rounded-full ${healthData?.database === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  </h3>
                  <p className="text-xs text-slate-400">
                    {healthData?.database === 'connected' 
                      ? `Real-Time Cluster: Connected (${healthData.latencyMs}ms latency)` 
                      : healthData?.status === 'offline' 
                      ? 'Local DB Mode (Cloud Offline)'
                      : 'Connecting to Cloud Cluster...'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={refreshHealth}
                disabled={isCheckingHealth}
                title="Refresh Infrastructure Health"
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-colors pressable"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Database Name:</span>
                <span className="text-emerald-400 font-bold">{healthData?.databaseName || 'fitforge_db'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Tables:</span>
                <span className="text-white font-bold">
                  {healthData?.tableCount ? `${healthData.tableCount} Relational Tables` : '15 Relational Tables'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cluster Latency:</span>
                <span className="text-cyan-400 font-bold">{healthData ? `${healthData.latencyMs} ms` : 'Probing...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Sync Queue:</span>
                <span className={pendingCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isSyncing ? 'Syncing in Progress...' : pendingCount > 0 ? `${pendingCount} Items Queued` : 'Synchronized (0 Pending)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Successful Sync:</span>
                <span className="text-cyan-400 font-bold">
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* DATA EXPORT & PORTABILITY */}
          <div className="forge-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Full Data Portability & Backup</h3>
                <p className="text-xs text-slate-400">Download complete logs, sets, and nutrition history</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center justify-center gap-2 border border-white/10 transition-colors pressable"
              >
                <Download className="w-4 h-4 text-purple-400" />
                Export Full JSON
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center justify-center gap-2 border border-white/10 transition-colors pressable"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export Workout CSV
              </button>
            </div>

            {exportMessage && (
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                {exportMessage}
              </div>
            )}
          </div>

          {/* DANGER ZONE: DATA PURGE */}
          <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-400">Reset & Purge Data</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Wipes cloud database records and resets to initial baseline</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (confirm('Are you sure you want to reset all data and wipe TiDB Cloud records? This cannot be undone.')) {
                  await api.clearAllData();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors pressable shrink-0"
            >
              Purge Database
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
