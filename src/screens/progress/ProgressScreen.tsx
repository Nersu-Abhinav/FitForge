import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { WeightTrendChart } from '@/components/charts/WeightTrendChart';
import { SleepTrendChart } from '@/components/charts/SleepTrendChart';
import { RecoveryTrendChart } from '@/components/charts/RecoveryTrendChart';
import { HydrationTrendChart, DailyHydrationPoint } from '@/components/charts/HydrationTrendChart';
import { VolumeBarChart } from '@/components/charts/VolumeBarChart';
import { DailyMetricsModal, MetricTab } from '@/components/body/DailyMetricsModal';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { getToday, getLocalDateString, offsetDateString, parseLocalDateString } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';
import { 
  TrendingUp, 
  Scale, 
  Moon, 
  Activity, 
  Dumbbell,
  CheckCircle2,
  Plus,
  Edit3,
  Calendar,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Flame,
  Droplets,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Trash2
} from 'lucide-react';

function formatHydrationDisplayTime(timeStr?: string): string {
  if (!timeStr) return '';
  // If already formatted with AM/PM
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  // If ISO format
  if (timeStr.includes('T') || timeStr.endsWith('Z')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  // If "HH:mm" or "HH:mm:ss"
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  return timeStr;
}

export const ProgressScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { workouts } = useWorkoutStore();
  const { 
    measurements, 
    sleepLogs, 
    recoveryLogs, 
    getLatestWeight,
    deleteMeasurement,
    deleteSleep,
    deleteRecovery
  } = useBodyStore();
  const { 
    logs: hydrationLogs, 
    addWater, 
    getWaterForDate, 
    getLogsForDate,
    deleteLog: deleteHydrationLog,
    clearWaterForDate
  } = useHydrationStore();

  const [mainChartTab, setMainChartTab] = useState<'weight' | 'sleep' | 'recovery' | 'hydration'>('weight');
  const [activeTab, setActiveTab] = useState<'weight' | 'sleep' | 'recovery' | 'hydration'>('weight');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [modalTab, setModalTab] = useState<MetricTab | null>(null);
  const [modalDate, setModalDate] = useState<string | undefined>(undefined);
  const [expandedWaterDate, setExpandedWaterDate] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState<boolean>(false);

  const todayStr = getToday();
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const cutoffDate = offsetDateString(todayStr, -days);

  const filteredWeightData = measurements
    .filter(m => m.date >= cutoffDate && m.date <= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredSleepData = sleepLogs
    .filter(s => (s.date || '') >= cutoffDate && (s.date || '') <= todayStr)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const filteredRecoveryData = recoveryLogs
    .filter(r => (r.date || r.recoveryDate || '') >= cutoffDate && (r.date || r.recoveryDate || '') <= todayStr)
    .sort((a, b) => (a.date || a.recoveryDate || '').localeCompare(b.date || b.recoveryDate || ''));

  // Group hydration logs by date in timeframe
  const hydrationByDateMap = hydrationLogs.reduce((acc, log) => {
    if (log.date >= cutoffDate && log.date <= todayStr) {
      acc[log.date] = (acc[log.date] || 0) + log.amountMl;
    }
    return acc;
  }, {} as Record<string, number>);

  const waterGoalMl = user.goals.dailyWaterMl || 3000;
  const todayWaterMl = getWaterForDate(todayStr);

  const filteredHydrationData: DailyHydrationPoint[] = Object.keys(hydrationByDateMap)
    .sort()
    .map(date => ({
      date,
      totalMl: hydrationByDateMap[date],
      goalMl: waterGoalMl
    }));

  if (todayWaterMl > 0 && !filteredHydrationData.find(d => d.date === todayStr)) {
    filteredHydrationData.push({
      date: todayStr,
      totalMl: todayWaterMl,
      goalMl: waterGoalMl
    });
    filteredHydrationData.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Group all hydration logs by date for clean consolidated historical log cards
  const groupedHydrationHistory = useMemo(() => {
    const map = new Map<string, { date: string; totalMl: number; logs: typeof hydrationLogs }>();
    hydrationLogs.forEach((log) => {
      const existing = map.get(log.date);
      if (existing) {
        existing.totalMl += log.amountMl;
        existing.logs.push(log);
      } else {
        map.set(log.date, { date: log.date, totalMl: log.amountMl, logs: [log] });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [hydrationLogs]);

  // Dynamic Weekly Training Volume Load
  const today = new Date();
  const dayOfWeekIndex = (today.getDay() + 6) % 7; // Mon = 0
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
  const pastWorkouts = workouts.filter(w => w.date <= todayStr);
  const totalCompletedSets = pastWorkouts.reduce((sum, w) => sum + (w.totalSets || 0), 0);

  const latestWeight = getLatestWeight();
  const firstMeasInTimeframe = filteredWeightData[0];
  const weightDelta = firstMeasInTimeframe && latestWeight > 0 
    ? (latestWeight - firstMeasInTimeframe.weightKg).toFixed(1)
    : null;

  // Sleep averages
  const avgSleepDurationMins = sleepLogs.length > 0 
    ? Math.round(sleepLogs.reduce((sum, s) => sum + s.durationMinutes, 0) / sleepLogs.length)
    : 0;
  const avgSleepQuality = sleepLogs.length > 0
    ? Math.round(sleepLogs.reduce((sum, s) => sum + (s.qualityScore || 80), 0) / sleepLogs.length)
    : 0;

  // Recovery averages
  const avgRecoveryScore = recoveryLogs.length > 0
    ? Math.round(recoveryLogs.reduce((sum, r) => sum + (r.calculatedScore || r.recoveryScore || 75), 0) / recoveryLogs.length)
    : 0;
  const avgSoreness = recoveryLogs.length > 0
    ? (recoveryLogs.reduce((sum, r) => sum + (r.sorenessLevel || 3), 0) / recoveryLogs.length).toFixed(1)
    : '0';

  const handleOpenModal = (tab: MetricTab, date?: string) => {
    triggerHaptic('medium');
    setModalTab(tab);
    setModalDate(date || getToday());
  };

  const handleQuickAddWater = (amountMl: number) => {
    triggerHaptic('medium');
    addWater(amountMl, todayStr);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const d = parseLocalDateString(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const currentRecordsCount = 
    activeTab === 'weight' ? measurements.length :
    activeTab === 'sleep' ? sleepLogs.length :
    activeTab === 'recovery' ? recoveryLogs.length :
    groupedHydrationHistory.length;

  return (
    <div className="relative flex flex-col gap-6 w-full pb-20 md:pb-8">
      {/* Ambient Aurora Glow Lights */}
      <div className="w-[450px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] absolute -top-20 -left-20 pointer-events-none" />
      <div className="w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[90px] absolute top-60 -right-20 pointer-events-none" />
      <div className="w-[300px] h-[250px] bg-emerald-500/10 rounded-full blur-[80px] absolute bottom-10 left-1/3 pointer-events-none" />
      
      {/* 1. TOP HERO BANNER */}
      <div className="forge-card rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-purple-500 opacity-80" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center glow-cyan shrink-0 shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Progress & Intelligence
                </span>
                <SyncStatusBadge size="sm" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-0.5 sm:mt-1">
                Analytics & Metrics
              </h1>
            </div>
          </div>

          {/* Quick Log Action Pills - 4-Col Grid on Mobile / Flex Row on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto md:flex md:items-center">
            <button
              type="button"
              onClick={() => handleOpenModal('weight')}
              className="py-2.5 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs uppercase tracking-wider pressable transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <Scale className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">+ Weight</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal('sleep')}
              className="py-2.5 px-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-300 font-bold text-xs uppercase tracking-wider pressable transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <Moon className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">+ Sleep</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal('recovery')}
              className="py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-xs uppercase tracking-wider pressable transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">+ Recovery</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal('hydration')}
              className="py-2.5 px-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 font-bold text-xs uppercase tracking-wider pressable transition-all flex items-center justify-center gap-1.5 shadow-md glow-cyan"
            >
              <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">+ Water</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHARTS & TRENDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 7 COLS (Interactive 4-Tab Metric Intelligence Chart) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="forge-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
            
            {/* Top Switcher: 4 Metric Tabs in a flawless 4-column responsive grid */}
            <div className="pb-2 border-b border-white/5">
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#060A14] rounded-2xl border border-white/10 w-full shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMainChartTab('weight');
                  }}
                  className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 pressable ${
                    mainChartTab === 'weight'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 border border-amber-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Scale className={`w-3.5 h-3.5 shrink-0 ${mainChartTab === 'weight' ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span className="whitespace-nowrap tracking-tight">Weight</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMainChartTab('sleep');
                  }}
                  className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 pressable ${
                    mainChartTab === 'sleep'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-lg shadow-purple-500/25 border border-purple-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Moon className={`w-3.5 h-3.5 shrink-0 ${mainChartTab === 'sleep' ? 'text-white' : 'text-purple-400'}`} />
                  <span className="whitespace-nowrap tracking-tight">Sleep</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMainChartTab('recovery');
                  }}
                  className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 pressable ${
                    mainChartTab === 'recovery'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border border-emerald-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className={`w-3.5 h-3.5 shrink-0 ${mainChartTab === 'recovery' ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span className="whitespace-nowrap tracking-tight">Recovery</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMainChartTab('hydration');
                  }}
                  className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-mono font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 pressable ${
                    mainChartTab === 'hydration'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25 border border-cyan-400/50 glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Droplets className={`w-3.5 h-3.5 shrink-0 ${mainChartTab === 'hydration' ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span className="whitespace-nowrap tracking-tight">Water</span>
                </button>
              </div>
            </div>

            {/* TAB 1: BODYWEIGHT PROGRESSION */}
            {mainChartTab === 'weight' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Bodyweight Progression
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                          {latestWeight > 0 ? `${latestWeight}` : '—'}
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                          {user.unitSystem === 'metric' ? 'kg' : 'lb'}
                        </span>
                      </div>
                      {filteredWeightData.length > 1 && weightDelta && (
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap ${
                          parseFloat(weightDelta) < 0 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {parseFloat(weightDelta) > 0 ? `+${weightDelta}` : weightDelta} {user.unitSystem === 'metric' ? 'kg' : 'lb'}
                        </span>
                      )}
                      {filteredWeightData.length === 1 && (
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                          Day 1 Baseline
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="flex items-center bg-[#070A12] p-1 rounded-xl border border-white/10 shrink-0">
                    {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTimeframe(tf);
                        }}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all pressable ${
                          timeframe === tf
                            ? 'bg-white/20 text-white shadow-sm border border-white/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Area */}
                <div className="w-full pt-1 pb-1">
                  <WeightTrendChart 
                    data={filteredWeightData} 
                    unit={user.unitSystem} 
                    height={180} 
                    targetWeightKg={user.goals.targetWeightKg || 78.5}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                  <span>Target: <strong className="text-amber-300 font-bold">{user.goals.targetWeightKg || 78.5} kg</strong></span>
                  <button
                    type="button"
                    onClick={() => handleOpenModal('weight')}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors pressable"
                  >
                    + Log Morning Weigh-In
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SLEEP & DURATION TRENDS */}
            {mainChartTab === 'sleep' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase text-purple-400 font-bold tracking-wider flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5" />
                      Sleep & Recovery Cycles
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                        {sleepLogs.length > 0 
                          ? `${Math.floor(sleepLogs[sleepLogs.length - 1].durationMinutes / 60)}h ${sleepLogs[sleepLogs.length - 1].durationMinutes % 60}m` 
                          : '—'}
                      </span>
                      {sleepLogs.length > 0 && (
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                          {sleepLogs[sleepLogs.length - 1].qualityScore || 80}% Quality
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="flex items-center bg-[#070A12] p-1 rounded-xl border border-white/10 shrink-0">
                    {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTimeframe(tf);
                        }}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all pressable ${
                          timeframe === tf
                            ? 'bg-white/20 text-white shadow-sm border border-white/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleep Chart Area */}
                <div className="w-full pt-1 pb-1">
                  <SleepTrendChart 
                    data={filteredSleepData} 
                    targetSleepHours={user.goals.targetSleepHours || 8.0} 
                    height={180} 
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                  <span>Target: <strong className="text-purple-300 font-bold">{user.goals.targetSleepHours || 8.0} hrs/night</strong></span>
                  <button
                    type="button"
                    onClick={() => handleOpenModal('sleep')}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors pressable"
                  >
                    + Log Sleep Session
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: READINESS & RECOVERY DOMS */}
            {mainChartTab === 'recovery' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Physiological Readiness
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                        {recoveryLogs.length > 0 
                          ? `${recoveryLogs[recoveryLogs.length - 1].calculatedScore || recoveryLogs[recoveryLogs.length - 1].recoveryScore || 85}%` 
                          : '—'}
                      </span>
                      {recoveryLogs.length > 0 && (
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                          DOMS: {recoveryLogs[recoveryLogs.length - 1].sorenessLevel || 3}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="flex items-center bg-[#070A12] p-1 rounded-xl border border-white/10 shrink-0">
                    {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTimeframe(tf);
                        }}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all pressable ${
                          timeframe === tf
                            ? 'bg-white/20 text-white shadow-sm border border-white/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recovery Chart Area */}
                <div className="w-full pt-1 pb-1">
                  <RecoveryTrendChart 
                    data={filteredRecoveryData} 
                    height={180} 
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                  <span>Benchmark: <strong className="text-emerald-300 font-bold">80%+ Optimal</strong></span>
                  <button
                    type="button"
                    onClick={() => handleOpenModal('recovery')}
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors pressable"
                  >
                    + Log Recovery State
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: HYDRATION & WATER INTAKE */}
            {mainChartTab === 'hydration' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5" />
                      Hydration & Daily Water
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                          {(todayWaterMl / 1000).toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-cyan-400 font-mono">L Today</span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                        {Math.round((todayWaterMl / waterGoalMl) * 100)}% of {(waterGoalMl / 1000).toFixed(1)}L Goal
                      </span>
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="flex items-center bg-[#070A12] p-1 rounded-xl border border-white/10 shrink-0">
                    {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTimeframe(tf);
                        }}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all pressable ${
                          timeframe === tf
                            ? 'bg-white/20 text-white shadow-sm border border-white/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Add Water Buttons */}
                <div className="p-2.5 rounded-2xl bg-[#080D1A]/90 border border-cyan-500/20 shadow-inner flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                      Quick Hydrate
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Tap to log</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '+250ml', ml: 250, desc: 'Glass' },
                      { label: '+500ml', ml: 500, desc: 'Bottle' },
                      { label: '+750ml', ml: 750, desc: 'Shaker' },
                      { label: '+1L', ml: 1000, desc: 'Jug' },
                    ].map((item) => (
                      <button
                        key={item.ml}
                        type="button"
                        onClick={() => handleQuickAddWater(item.ml)}
                        className="py-1.5 px-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 active:scale-95 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all pressable shadow-sm flex flex-col items-center justify-center hover:border-cyan-400"
                        title={`Quick add ${item.desc} (${item.ml}ml)`}
                      >
                        <span className="text-xs font-black">{item.label}</span>
                        <span className="text-[9px] text-cyan-400/70 font-normal">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hydration Chart Area */}
                <div className="w-full pt-1 pb-1">
                  <HydrationTrendChart 
                    data={filteredHydrationData} 
                    targetGoalMl={waterGoalMl} 
                    height={180} 
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                  <span>Target: <strong className="text-cyan-300 font-bold">{(waterGoalMl / 1000).toFixed(1)} L / Day ({waterGoalMl} ml)</strong></span>
                  <button
                    type="button"
                    onClick={() => handleOpenModal('hydration')}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors pressable"
                  >
                    + Detailed Water Log
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Weekly Training Volume Bar Chart */}
          <div className="forge-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">Weekly Training Volume</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                  {totalWeekVolume.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg total</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>

            <div className="h-44 w-full">
              <VolumeBarChart data={volumeData} />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 5 COLS (Vitals Summary & Activity Telemetry Log) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Recovery, Sleep & Hydration Telemetry Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-3xl forge-card border border-purple-500/30 space-y-1 relative overflow-hidden">
              <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider truncate block">Avg Sleep</span>
              <div className="text-lg font-black text-white font-mono">
                {avgSleepDurationMins > 0 ? `${Math.floor(avgSleepDurationMins / 60)}h` : '—'}
              </div>
              <span className="text-[10px] text-purple-300 font-mono font-bold block truncate">
                {avgSleepQuality > 0 ? `${avgSleepQuality}%` : 'No logs'}
              </span>
            </div>

            <div className="p-3.5 rounded-3xl forge-card border border-emerald-500/30 space-y-1 relative overflow-hidden">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider truncate block">Readiness</span>
              <div className="text-lg font-black text-white font-mono">
                {avgRecoveryScore > 0 ? `${avgRecoveryScore}%` : '88%'}
              </div>
              <span className="text-[10px] text-emerald-300 font-mono font-bold block truncate">
                {avgSoreness !== '0' ? `DOMS ${avgSoreness}` : 'Optimal'}
              </span>
            </div>

            <div className="p-3.5 rounded-3xl forge-card border border-cyan-500/30 space-y-1 relative overflow-hidden">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider truncate block">Hydration</span>
              <div className="text-lg font-black text-white font-mono">
                {(todayWaterMl / 1000).toFixed(1)}L
              </div>
              <span className="text-[10px] text-cyan-300 font-mono font-bold block truncate">
                {Math.round((todayWaterMl / waterGoalMl) * 100)}% Goal
              </span>
            </div>
          </div>

          {/* HISTORICAL LOGS CARD WITH 4 TABS - Clean Bounded Height with Grouped Water */}
          <div className="forge-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-base font-black text-white truncate">Historical Logs</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 shrink-0">
                  {currentRecordsCount} Records
                </span>
              </div>

              {/* Quick Log Button for active category */}
              <button
                type="button"
                onClick={() => handleOpenModal(activeTab)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all pressable shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Log New</span>
              </button>
            </div>

            {/* 4 Interactive Category Tabs in responsive grid */}
            <div className="grid grid-cols-4 p-1 gap-1 bg-[#060A14] rounded-2xl border border-white/10 w-full shadow-inner">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('weight');
                }}
                className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold font-mono transition-all flex flex-col sm:flex-row items-center justify-center gap-1 pressable ${
                  activeTab === 'weight'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 shadow-md font-black border border-amber-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Scale className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'weight' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className="whitespace-nowrap tracking-tight">Weight</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('sleep');
                }}
                className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold font-mono transition-all flex flex-col sm:flex-row items-center justify-center gap-1 pressable ${
                  activeTab === 'sleep'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-white shadow-md font-black border border-purple-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'sleep' ? 'text-white' : 'text-purple-400'}`} />
                <span className="whitespace-nowrap tracking-tight">Sleep</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('recovery');
                }}
                className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold font-mono transition-all flex flex-col sm:flex-row items-center justify-center gap-1 pressable ${
                  activeTab === 'recovery'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md font-black border border-emerald-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'recovery' ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span className="whitespace-nowrap tracking-tight">Recovery</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('hydration');
                }}
                className={`py-1.5 sm:py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold font-mono transition-all flex flex-col sm:flex-row items-center justify-center gap-1 pressable ${
                  activeTab === 'hydration'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-black glow-cyan border border-cyan-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Droplets className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'hydration' ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span className="whitespace-nowrap tracking-tight">Water</span>
              </button>
            </div>

            {/* Clean, Bounded Scrollable Activity Feed with Smart Pagination */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              
              {/* Weight Log Cards */}
              {activeTab === 'weight' && (
                measurements.length === 0 ? (
                  <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-2">
                    <Scale className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">No bodyweight records logged yet.</p>
                  </div>
                ) : (
                  <>
                    {(showAllLogs ? [...measurements].reverse() : [...measurements].reverse().slice(0, 4)).map((m) => (
                      <div
                        key={m.id || m.date}
                        onClick={() => handleOpenModal('weight', m.date)}
                        className="p-3.5 rounded-2xl bg-black/35 hover:bg-black/55 border border-white/5 hover:border-amber-500/30 flex items-center justify-between gap-3 transition-all cursor-pointer group pressable shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            <Scale className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-white font-mono">{m.weightKg} kg</span>
                              {m.bodyFatPct && (
                                <span className="text-[10px] font-mono text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/25">
                                  {m.bodyFatPct}% BF
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              {formatDateDisplay(m.date)} {m.notes ? `• ${m.notes}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                              if (window.confirm(`Delete weight record for ${formatDateDisplay(m.date)}?`)) {
                                deleteMeasurement(m.date);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                    ))}

                    {measurements.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 pressable"
                      >
                        {showAllLogs ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            <span>Collapse to Recent</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                            <span>View All ({measurements.length}) Records</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )
              )}

              {/* Sleep Log Cards */}
              {activeTab === 'sleep' && (
                sleepLogs.length === 0 ? (
                  <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-2">
                    <Moon className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">No sleep records logged yet.</p>
                  </div>
                ) : (
                  <>
                    {(showAllLogs ? [...sleepLogs].reverse() : [...sleepLogs].reverse().slice(0, 4)).map((s) => (
                      <div
                        key={s.id || s.date}
                        onClick={() => handleOpenModal('sleep', s.date)}
                        className="p-3.5 rounded-2xl bg-black/35 hover:bg-black/55 border border-white/5 hover:border-purple-500/30 flex items-center justify-between gap-3 transition-all cursor-pointer group pressable shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            <Moon className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-white font-mono">
                                {Math.floor(s.durationMinutes / 60)}h {s.durationMinutes % 60}m
                              </span>
                              <span className="text-[10px] font-mono text-purple-300 px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/25">
                                {s.qualityScore}% Quality
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              {formatDateDisplay(s.date)} • {s.bedtime || '23:00'} → {s.wakeTime || '06:30'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                              if (window.confirm(`Delete sleep log for ${formatDateDisplay(s.date)}?`)) {
                                deleteSleep(s.date);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                    ))}

                    {sleepLogs.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 pressable"
                      >
                        {showAllLogs ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
                            <span>Collapse to Recent</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                            <span>View All ({sleepLogs.length}) Records</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )
              )}

              {/* Recovery Log Cards */}
              {activeTab === 'recovery' && (
                recoveryLogs.length === 0 ? (
                  <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-2">
                    <Activity className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">No recovery entries logged yet.</p>
                  </div>
                ) : (
                  <>
                    {(showAllLogs ? [...recoveryLogs].reverse() : [...recoveryLogs].reverse().slice(0, 4)).map((r) => (
                      <div
                        key={r.id || r.date}
                        onClick={() => handleOpenModal('recovery', r.date)}
                        className="p-3.5 rounded-2xl bg-black/35 hover:bg-black/55 border border-white/5 hover:border-emerald-500/30 flex items-center justify-between gap-3 transition-all cursor-pointer group pressable shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            <Activity className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-emerald-400 font-mono">
                                {r.calculatedScore || r.recoveryScore || 85}% Readiness
                              </span>
                              <span className="text-[10px] font-mono text-rose-300 px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/25">
                                DOMS {r.sorenessLevel || 3}/10
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              {formatDateDisplay(r.date)} {r.notes ? `• ${r.notes}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                              if (window.confirm(`Delete recovery entry for ${formatDateDisplay(r.date || r.recoveryDate || '')}?`)) {
                                deleteRecovery(r.date || r.recoveryDate || '');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>
                    ))}

                    {recoveryLogs.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 pressable"
                      >
                        {showAllLogs ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Collapse to Recent</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            <span>View All ({recoveryLogs.length}) Records</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )
              )}

              {/* Hydration Log Cards - Consolidated by Date with Pagination */}
              {activeTab === 'hydration' && (
                groupedHydrationHistory.length === 0 ? (
                  <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-2">
                    <Droplets className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">No hydration entries logged yet.</p>
                  </div>
                ) : (
                  <>
                    {(showAllLogs ? groupedHydrationHistory : groupedHydrationHistory.slice(0, 4)).map((group) => {
                      const isExpanded = expandedWaterDate === group.date;
                      const pctOfGoal = Math.round((group.totalMl / waterGoalMl) * 100);

                      return (
                        <div
                          key={group.date}
                          className="rounded-2xl bg-black/35 border border-white/5 hover:border-cyan-500/30 overflow-hidden transition-all shadow-sm"
                        >
                          {/* Summary Header */}
                          <div
                            onClick={() => handleOpenModal('hydration', group.date)}
                            className="p-3.5 flex items-center justify-between gap-3 cursor-pointer group pressable"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                                <Droplets className="w-4 h-4 text-cyan-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-black text-cyan-400 font-mono">
                                    {(group.totalMl / 1000).toFixed(2)} L
                                  </span>
                                  <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/25">
                                    {pctOfGoal}% Goal
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    ({group.logs.length} logs)
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono block truncate">
                                  {formatDateDisplay(group.date)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedWaterDate(isExpanded ? null : group.date);
                                }}
                                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                                title={isExpanded ? 'Collapse entries' : 'Expand entries'}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerHaptic('medium');
                                  if (window.confirm(`Clear all water logs for ${formatDateDisplay(group.date)}?`)) {
                                    clearWaterForDate(group.date);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Clear all water for this day"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            </div>
                          </div>

                          {/* Expandable Breakdown of Individual Entries */}
                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-1.5 bg-black/20 animate-fade-in">
                              {group.logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="flex items-center justify-between text-[11px] font-mono p-1.5 px-2 rounded-lg bg-white/5 border border-white/5 group/sip hover:border-white/10"
                                >
                                  <div className="flex items-center gap-2 text-cyan-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span className="font-bold">+{log.amountMl} ml</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">
                                      {formatHydrationDisplayTime(log.timestamp) || 'logged'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        triggerHaptic('light');
                                        deleteHydrationLog(log.id);
                                      }}
                                      className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                                      title="Delete this entry"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {groupedHydrationHistory.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 pressable"
                      >
                        {showAllLogs ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Collapse to Recent</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                            <span>View All ({groupedHydrationHistory.length}) Days</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Daily Metrics Modal */}
      {modalTab && (
        <DailyMetricsModal
          isOpen={!!modalTab}
          initialTab={modalTab}
          initialDate={modalDate}
          onClose={() => {
            setModalTab(null);
            setModalDate(undefined);
          }}
        />
      )}
    </div>
  );
};
