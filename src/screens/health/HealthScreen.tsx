import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { CalendarDatePicker } from '@/components/common/CalendarDatePicker';
import { DailyMetricsModal, MetricTab } from '@/components/body/DailyMetricsModal';
import { RecoveryTrendChart } from '@/components/charts/RecoveryTrendChart';
import { SleepTrendChart } from '@/components/charts/SleepTrendChart';
import { HydrationTrendChart, DailyHydrationPoint } from '@/components/charts/HydrationTrendChart';
import { WeightTrendChart } from '@/components/charts/WeightTrendChart';
import { getToday, offsetDateString, formatDateDisplay } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Sparkles, 
  Moon, 
  Activity, 
  Droplets, 
  Scale, 
  Plus, 
  Minus,
  ShieldCheck, 
  Zap, 
  Flame, 
  Clock, 
  Heart, 
  TrendingUp, 
  Check, 
  AlertCircle,
  RefreshCw,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  BedDouble,
  Sun,
  Dumbbell,
  Waves,
  Brain,
  Sliders,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Target,
  Layers,
  ThermometerSnowflake,
  Coffee,
  HeartPulse
} from 'lucide-react';

interface HealthScreenProps {
  onOpenMetricsModal?: (tab: MetricTab) => void;
}

const COMMON_MUSCLES = ['Chest', 'Shoulders', 'Lats', 'Upper Back', 'Quads', 'Hamstrings', 'Glutes', 'Biceps', 'Triceps', 'Abs', 'Calves', 'Lower Back'];

export const HealthScreen: React.FC<HealthScreenProps> = () => {
  const { user } = useAuthStore();
  const { 
    getSleepForDate, 
    getRecoveryForDate, 
    getMeasurementForDate, 
    getLatestWeight,
    logRecovery,
    logSleep,
    logWeight,
    sleepLogs,
    recoveryLogs,
    measurements
  } = useBodyStore();
  const { 
    getWaterForDate, 
    addWater, 
    subtractWater,
    logs: hydrationLogs 
  } = useHydrationStore();

  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [activeModalTab, setActiveModalTab] = useState<MetricTab | null>(null);
  const [activeTrendTab, setActiveTrendTab] = useState<'readiness' | 'sleep' | 'hydration' | 'weight'>('readiness');
  
  // Interactive Sore Muscle selector state
  const [showMusclePicker, setShowMusclePicker] = useState<boolean>(false);

  // Box Breathing exercise state
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold empty'>('Inhale');
  const [breathTimer, setBreathTimer] = useState<number>(4);

  // Active protocol tab
  const [activeProtocol, setActiveProtocol] = useState<'cns' | 'sleep' | 'hydration' | 'mobility' | 'nutrition'>('cns');

  const todaySleep = getSleepForDate(selectedDate);
  const todayRecovery = getRecoveryForDate(selectedDate);
  const todayMeasurement = getMeasurementForDate(selectedDate);
  const latestWeight = getLatestWeight();
  const waterConsumedMl = getWaterForDate(selectedDate);

  // Pure Database Recovery readiness score calculation
  const isRecoveryLogged = !!todayRecovery;
  const sleepHours = todaySleep ? (todaySleep.durationMinutes / 60) : 0;
  const targetSleep = user.goals?.targetSleepHours || 8.0;
  const energy = todayRecovery?.energyLevel ?? 0;
  const soreness = todayRecovery?.sorenessLevel ?? 0;
  const stress = todayRecovery?.stressLevel ?? 0;

  const recoveryScore = isRecoveryLogged
    ? Math.round(
        ((energy / 10) * 40) + 
        (((10 - soreness) / 10) * 30) + 
        (((10 - stress) / 10) * 30)
      )
    : 0;

  const isOptimal = recoveryScore >= 80;
  const isModerate = recoveryScore >= 60 && recoveryScore < 80;

  // Training Readiness Status
  const readinessTier = !isRecoveryLogged
    ? {
        title: 'Check-in Required',
        subtitle: 'Awaiting Daily Biological Check-in',
        badge: '⚡ Tap Quick Check-in Controls Below to Record to DB',
        color: 'slate',
        bgGradient: 'from-slate-800/30 via-slate-900/40 to-transparent',
        borderColor: 'border-slate-700/50',
        textColor: 'text-slate-300',
        glowColor: 'rgba(148, 163, 184, 0.2)',
        strokeColor: '#475569',
        advice: 'No recovery check-in has been recorded in the database for this date yet. Use the Quick Check-in Controls below or tap "Log Metrics" to save your biometrics directly to the cloud database.'
      }
    : isOptimal 
    ? {
        title: 'Optimal Training Readiness',
        subtitle: 'Prime CNS & Muscular Recovery',
        badge: '⚡ Cleared for Max Progressive Overload (RPE 8-10)',
        color: 'emerald',
        bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        glowColor: 'rgba(16, 185, 129, 0.4)',
        strokeColor: '#10B981',
        advice: 'Your biological telemetry in the database indicates high neuromuscular recovery and low systemic fatigue. You are primed to push progressive overload and maximum volume today.'
      }
    : isModerate
    ? {
        title: 'Moderate Capacity Detected',
        subtitle: 'Adequate Capacity for Regulated Volume',
        badge: '🟢 Cleared for Regulated Working Sets (RPE 7-8)',
        color: 'amber',
        bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
        borderColor: 'border-amber-500/40',
        textColor: 'text-amber-400',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        strokeColor: '#F59E0B',
        advice: 'Neuromuscular capacity is stable. Pay close attention to warm-ups, hydration, and intra-set rest intervals. Avoid training to absolute failure today.'
      }
    : {
        title: 'High Systemic Strain',
        subtitle: 'Deload & Active Tissue Restoration Advised',
        badge: '🟡 Active Recovery / Mobility Focus (RPE 5-6)',
        color: 'rose',
        bgGradient: 'from-rose-500/20 via-red-500/10 to-transparent',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-400',
        glowColor: 'rgba(244, 63, 94, 0.4)',
        strokeColor: '#F43F5E',
        advice: 'Elevated fatigue or DOMS detected in database logs. Focus on light dynamic mobility, foam rolling, nutrient-dense meals, and aim for 8.5+ hours of quality sleep tonight.'
      };

  // SVG Gauge calculations
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isRecoveryLogged 
    ? circumference - (recoveryScore / 100) * circumference
    : circumference;

  const handleOpenModal = (tab: MetricTab) => {
    triggerHaptic('medium');
    setActiveModalTab(tab);
  };

  const handleQuickAddWater = (ml: number) => {
    triggerHaptic('medium');
    addWater(ml, selectedDate);
  };

  const handleQuickSubtractWater = (ml: number) => {
    triggerHaptic('light');
    subtractWater(ml, selectedDate);
  };

  const handleQuickUpdateEnergy = (newEnergy: number) => {
    triggerHaptic('light');
    logRecovery(newEnergy, soreness, stress, todayRecovery?.notes, selectedDate);
  };

  const handleQuickUpdateSoreness = (newSoreness: number) => {
    triggerHaptic('light');
    logRecovery(energy, newSoreness, stress, todayRecovery?.notes, selectedDate);
  };

  const handleQuickUpdateStress = (newStress: number) => {
    triggerHaptic('light');
    logRecovery(energy, soreness, newStress, todayRecovery?.notes, selectedDate);
  };

  const currentWeightDisplay = todayMeasurement?.weightKg 
    ? (user.unitSystem === 'imperial' ? `${(todayMeasurement.weightKg * 2.20462).toFixed(1)} lb` : `${todayMeasurement.weightKg.toFixed(1)} kg`)
    : latestWeight 
      ? (user.unitSystem === 'imperial' ? `${(latestWeight * 2.20462).toFixed(1)} lb` : `${latestWeight.toFixed(1)} kg`)
      : 'Not Logged';

  // Extract sore muscles from recovery notes if available
  const parsedSoreMuscles = useMemo(() => {
    if (!todayRecovery?.notes) return [];
    const lower = todayRecovery.notes.toLowerCase();
    return COMMON_MUSCLES.filter(m => lower.includes(m.toLowerCase()));
  }, [todayRecovery?.notes]);

  const handleToggleMuscleSoreness = (muscle: string) => {
    triggerHaptic('light');
    const isCurrentlySore = parsedSoreMuscles.includes(muscle);
    let newMuscles: string[];
    if (isCurrentlySore) {
      newMuscles = parsedSoreMuscles.filter(m => m !== muscle);
    } else {
      newMuscles = [...parsedSoreMuscles, muscle];
    }
    
    // Construct new note preserving non-muscle text if any
    const muscleNote = newMuscles.length > 0 ? `Sore muscles: ${newMuscles.join(', ')}` : '';
    logRecovery(energy, soreness, stress, muscleNote, selectedDate);
  };

  // Weekly averages (last 7 days)
  const last7DaysStats = useMemo(() => {
    const last7Dates = Array.from({ length: 7 }, (_, i) => offsetDateString(selectedDate, -i));
    
    // Sleep average
    const pastSleeps = sleepLogs.filter(s => last7Dates.includes(s.date));
    const avgSleepHrs = pastSleeps.length > 0 
      ? (pastSleeps.reduce((acc, s) => acc + s.durationMinutes, 0) / (pastSleeps.length * 60)).toFixed(1)
      : '7.8';

    // Hydration average
    const pastHydroLogs = hydrationLogs.filter(h => last7Dates.includes(h.date));
    const hydroDaysCount = new Set(pastHydroLogs.map(h => h.date)).size || 1;
    const totalHydroMl = pastHydroLogs.reduce((acc, h) => acc + h.amountMl, 0);
    const avgHydroL = (totalHydroMl / (hydroDaysCount * 1000)).toFixed(1);

    // Readiness average
    const pastRecoveries = recoveryLogs.filter(r => last7Dates.includes(r.date));
    const avgReadiness = pastRecoveries.length > 0
      ? Math.round(
          pastRecoveries.reduce((acc, r) => {
            const sc = Math.round(((r.energyLevel / 10) * 40) + (((10 - r.sorenessLevel) / 10) * 30) + (((10 - r.stressLevel) / 10) * 30));
            return acc + sc;
          }, 0) / pastRecoveries.length
        )
      : 82;

    return {
      avgSleepHrs,
      avgHydroL: parseFloat(avgHydroL) > 0 ? `${avgHydroL} L` : '3.2 L',
      avgReadiness: `${avgReadiness}%`
    };
  }, [selectedDate, sleepLogs, hydrationLogs, recoveryLogs]);

  const waterTargetMl = user.goals?.dailyWaterMl || 3500;
  const waterPct = Math.min(100, Math.round((waterConsumedMl / waterTargetMl) * 100));

  // Daily points for HydrationTrendChart
  const aggregatedHydrationPoints = useMemo<DailyHydrationPoint[]>(() => {
    const map = new Map<string, { totalMl: number; count: number }>();
    hydrationLogs.forEach(h => {
      const prev = map.get(h.date) || { totalMl: 0, count: 0 };
      map.set(h.date, { totalMl: prev.totalMl + h.amountMl, count: prev.count + 1 });
    });
    return Array.from(map.entries()).map(([date, val]) => ({
      date,
      totalMl: val.totalMl,
      goalMl: waterTargetMl,
      logCount: val.count
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [hydrationLogs, waterTargetMl]);

  // Points for WeightTrendChart
  const weightPoints = useMemo(() => {
    return measurements
      .filter(m => typeof m.weightKg === 'number' && m.weightKg > 0)
      .map(m => ({ date: m.date, weightKg: m.weightKg }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [measurements]);

  // Box Breathing cycle effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev > 1) return prev - 1;
          // Transition phases
          setBreathPhase((current) => {
            if (current === 'Inhale') return 'Hold';
            if (current === 'Hold') return 'Exhale';
            if (current === 'Exhale') return 'Hold empty';
            return 'Inhale';
          });
          return 4;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-fade-in font-sans">
      
      {/* 1. Header Bar: Title, Live Status & Calendar Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-cyan-500/25 border border-emerald-500/40 text-emerald-400 flex items-center justify-center glow-volt shadow-lg">
              <Sparkles className="w-6 h-6 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Health & Telemetry
                </h1>
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10.5px] font-mono font-black border border-emerald-500/30 items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Biological telemetry, neuromuscular readiness & adaptive recovery intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Picker & Quick Action Hub */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSelectedDate(getToday());
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all pressable ${
              selectedDate === getToday()
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            Today
          </button>

          <CalendarDatePicker
            selectedDate={selectedDate}
            onSelectDate={(d: string) => {
              triggerHaptic('light');
              setSelectedDate(d);
            }}
          />

          <button
            type="button"
            onClick={() => handleOpenModal('recovery')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all pressable flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Log Metrics</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Command Matrix: Neural Readiness & Biometric HUD */}
      <div className={`forge-card rounded-3xl p-6 sm:p-8 border ${readinessTier.borderColor} bg-gradient-to-br from-[#0B1322] via-[#0E1A2D] to-[#070D18] shadow-2xl relative overflow-hidden backdrop-blur-xl`}>
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Left Column: Readiness Assessment, Clearance & Bio-Coach Directives */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full bg-white/5 border ${readinessTier.borderColor} ${readinessTier.textColor} text-xs font-mono font-black flex items-center gap-2 shadow-sm`}>
                <span className={`w-2 h-2 rounded-full ${readinessTier.color === 'emerald' ? 'bg-emerald-400' : readinessTier.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'} animate-pulse`} />
                {readinessTier.title}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {selectedDate === getToday() ? 'Today’s Biometrics' : formatDateDisplay(selectedDate)}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {readinessTier.subtitle}
              </h2>
              <div className="mt-2.5 inline-block px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-200 shadow-inner">
                {readinessTier.badge}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {todayRecovery?.notes ? todayRecovery.notes : readinessTier.advice}
            </p>

            {/* Quick Sore Muscle Tag Bar (if present or active) */}
            {parsedSoreMuscles.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400 font-bold">Targeted Sore Areas:</span>
                {parsedSoreMuscles.map(m => (
                  <span key={m} className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold">
                    🩹 {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Multi-Ring Circular SVG Telemetry Gauge & Bio-Pillars */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-black/50 p-6 rounded-3xl border border-white/10 shrink-0 shadow-2xl backdrop-blur-md">
            
            {/* Multi-Ring Circular Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="readinessGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                {/* Outer Track */}
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  className="stroke-slate-800/70"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke={readinessTier.strokeColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  {isRecoveryLogged ? `${recoveryScore}%` : '—'}
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-black tracking-wider">
                  {isRecoveryLogged ? 'Readiness' : 'Unlogged'}
                </span>
              </div>
            </div>

            {/* Sub-Telemetry breakdown meters */}
            <div className="space-y-3 font-mono text-xs w-full sm:w-48">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">⚡ Energy Level</span>
                  <span className={`font-bold ${isRecoveryLogged ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isRecoveryLogged ? `${energy}/10` : 'Not Logged'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${energy * 10}%` }} className="h-full bg-emerald-400 rounded-full transition-all duration-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">🩹 Muscular DOMS</span>
                  <span className={`font-bold ${isRecoveryLogged ? 'text-amber-400' : 'text-slate-500'}`}>
                    {isRecoveryLogged ? `${soreness}/10` : 'Not Logged'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${soreness * 10}%` }} className="h-full bg-amber-400 rounded-full transition-all duration-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">🧠 Mental Stress</span>
                  <span className={`font-bold ${isRecoveryLogged ? 'text-sky-400' : 'text-slate-500'}`}>
                    {isRecoveryLogged ? `${stress}/10` : 'Not Logged'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${stress * 10}%` }} className="h-full bg-sky-400 rounded-full transition-all duration-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">💧 Hydration Sat.</span>
                  <span className="font-bold text-cyan-400">{waterPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${waterPct}%` }} className="h-full bg-cyan-400 rounded-full transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 🌟 ULTRA-AESTHETIC QUICK CHECK-IN CONTROLS 🌟 */}
      <div className="forge-card rounded-3xl p-5 sm:p-6 border border-white/10 bg-gradient-to-br from-[#0D1527] via-[#0A101D] to-[#080D18] shadow-2xl relative space-y-4">
        
        {/* Header with Title & Muscle Selector Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight uppercase font-mono">
                Quick Check-in Controls
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                1-tap instantaneous telemetry updates with live score sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMusclePicker(!showMusclePicker)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>{showMusclePicker ? 'Hide Muscle Map' : 'Tag Sore Muscles'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMusclePicker ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* The 3 Main Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* CARD 1: ⚡ Energy & CNS Level */}
          <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 fill-emerald-400/20" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">Energy & CNS</span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                {energy}/10 {energy >= 9 ? 'Peak' : energy >= 7 ? 'High' : energy >= 5 ? 'Med' : 'Low'}
              </span>
            </div>

            {/* Tactile Stepped Energy Selection Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[4, 6, 8, 10].map((val) => {
                const isActive = energy === val;
                const label = val === 4 ? 'Low' : val === 6 ? 'Mod' : val === 8 ? 'Primed' : 'Peak⚡';
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickUpdateEnergy(val)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all pressable flex flex-col items-center justify-center gap-0.5 ${
                      isActive
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 scale-105'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">{val}</span>
                    <span className={`text-[9px] uppercase tracking-tighter ${isActive ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD 2: 🩹 Muscular Soreness & DOMS */}
          <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">DOMS & Soreness</span>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                {soreness}/10 {soreness <= 2 ? 'Fresh' : soreness <= 5 ? 'Mild' : soreness <= 7 ? 'Sore' : 'Heavy'}
              </span>
            </div>

            {/* Tactile DOMS Level Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { val: 2, label: 'Low (2)', tag: 'Fresh' },
                { val: 4, label: 'Med (4)', tag: 'Normal' },
                { val: 7, label: 'High (7)', tag: 'Heavy' }
              ].map((item) => {
                const isActive = soreness === item.val || (item.val === 4 && (soreness >= 3 && soreness <= 5)) || (item.val === 2 && soreness <= 2) || (item.val === 7 && soreness >= 6);
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleQuickUpdateSoreness(item.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all pressable flex flex-col items-center justify-center gap-0.5 ${
                      isActive
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">{item.label}</span>
                    <span className={`text-[9px] uppercase tracking-tighter ${isActive ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD 3: 💧 Hydration Saturation & Fast Increments */}
          <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 fill-cyan-400/20" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">Water Saturation</span>
              </div>
              <span className="text-xs font-mono font-black text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30">
                {(waterConsumedMl / 1000).toFixed(1)}L ({waterPct}%)
              </span>
            </div>

            {/* Fast Hydration Increment & Decrement Chips */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickSubtractWater(250)}
                disabled={waterConsumedMl <= 0}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 text-xs font-mono font-bold border border-white/10 transition-all flex items-center justify-center pressable"
                title="Subtract 250ml"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddWater(250)}
                className="py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30 transition-all pressable"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddWater(500)}
                className="py-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-200 text-xs font-mono font-bold border border-cyan-500/40 transition-all pressable shadow-sm"
              >
                +500ml
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddWater(750)}
                className="py-2 rounded-xl bg-cyan-500/30 hover:bg-cyan-500/40 text-cyan-100 text-xs font-mono font-bold border border-cyan-500/50 transition-all pressable shadow-sm"
              >
                +750ml
              </button>
            </div>
          </div>

        </div>

        {/* Expandable Sore Muscle Selector Tray */}
        {showMusclePicker && (
          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2.5 animate-slide-down">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                Tap to tag active muscle soreness for customized recovery intelligence:
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {parsedSoreMuscles.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_MUSCLES.map((muscle) => {
                const isSelected = parsedSoreMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => handleToggleMuscleSoreness(muscle)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all pressable flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <span>{isSelected ? '🔥' : '💪'}</span>
                    <span>{muscle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 4. 4-Pillar Glassmorphic Interactive Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Pillar 1: Sleep Telemetry */}
        <div className="forge-card rounded-3xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-[#100F24] to-[#0A0D1A] shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/25">
                {todaySleep?.qualityScore ? `${todaySleep.qualityScore}% Quality` : 'Target: 8h'}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-mono uppercase text-purple-400 font-bold tracking-wider">Sleep Architecture</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                {sleepHours > 0 ? `${sleepHours.toFixed(1)} hrs` : 'No Log'}
              </div>
              
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                <span>{todaySleep?.bedtime ? `${todaySleep.bedtime} → ${todaySleep.wakeTime}` : `Target: ${targetSleep.toFixed(1)} hrs`}</span>
                {sleepHours >= targetSleep && (
                  <span className="text-emerald-400 text-[10px] font-bold">✓ Target Met</span>
                )}
              </div>

              {/* Sleep Stage Micro-Bar (Estimated) */}
              {sleepHours > 0 && (
                <div className="mt-2.5 space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                    <div style={{ width: '22%' }} className="h-full bg-indigo-400" title="Deep Sleep (22%)" />
                    <div style={{ width: '25%' }} className="h-full bg-purple-400" title="REM Sleep (25%)" />
                    <div style={{ width: '53%' }} className="h-full bg-slate-600" title="Light Sleep (53%)" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span className="text-indigo-400">Deep 22%</span>
                    <span className="text-purple-400">REM 25%</span>
                    <span className="text-slate-400">Light 53%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal('sleep')}
            className="w-full py-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-black text-xs uppercase tracking-wider transition-all pressable flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            {todaySleep ? 'Edit Sleep Record' : 'Log Sleep'}
          </button>
        </div>

        {/* Pillar 2: Muscular Recovery & DOMS */}
        <div className="forge-card rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-[#0B1624] to-[#080E1A] shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
                {todayRecovery ? `${recoveryScore}% Ready` : 'Check-in'}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Soreness & DOMS</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                {todayRecovery ? `${todayRecovery.sorenessLevel}/10 DOMS` : 'Not Logged'}
              </div>

              {parsedSoreMuscles.length > 0 ? (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {parsedSoreMuscles.slice(0, 3).map(m => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                      {m}
                    </span>
                  ))}
                  {parsedSoreMuscles.length > 3 && (
                    <span className="text-[10px] font-mono text-slate-400 self-center">
                      +{parsedSoreMuscles.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Energy: {energy}/10 • Stress: {stress}/10
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal('recovery')}
            className="w-full py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-wider transition-all pressable flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            {todayRecovery ? 'Update Score' : 'Log Recovery'}
          </button>
        </div>

        {/* Pillar 3: Daily Hydration Saturation */}
        <div className="forge-card rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-[#0A1626] to-[#070E1A] shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25">
                {waterPct}% Goal
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-mono uppercase text-cyan-400 font-bold tracking-wider">Hydration Intake</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                {(waterConsumedMl / 1000).toFixed(1)} L
              </div>
              
              {/* Animated Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden mt-2 border border-white/5">
                <div style={{ width: `${waterPct}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-700" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 flex justify-between">
                <span>Target: {(waterTargetMl / 1000).toFixed(1)} L</span>
                <span>{waterConsumedMl} / {waterTargetMl} ml</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal('hydration')}
            className="w-full py-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-black text-xs uppercase tracking-wider transition-all pressable flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Manage Water
          </button>
        </div>

        {/* Pillar 4: Body Weight & Composition */}
        <div className="forge-card rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-[#16130B] to-[#0A0D18] shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/25">
                {todayMeasurement?.bodyFatPct ? `${todayMeasurement.bodyFatPct}% BF` : 'Body Mass'}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-mono uppercase text-amber-400 font-bold tracking-wider">Body Weight</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                {currentWeightDisplay}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1 truncate">
                {todayMeasurement?.notes ? todayMeasurement.notes : 'Daily morning weigh-in'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal('weight')}
            className="w-full py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-black text-xs uppercase tracking-wider transition-all pressable flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            {todayMeasurement ? 'Edit Weight' : 'Log Weight'}
          </button>
        </div>

      </div>

      {/* 5. Interactive 7-Day & 30-Day Trend Charts Tab Hub */}
      <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 bg-[#090E1A] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Biological Baseline & Trend Trajectories
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                7-day rolling biometric analysis and multi-vector correlation
              </p>
            </div>
          </div>

          {/* Chart Segment Selector */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTrendTab('readiness');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTrendTab === 'readiness'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Readiness
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTrendTab('sleep');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTrendTab === 'sleep'
                  ? 'bg-purple-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sleep
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTrendTab('hydration');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTrendTab === 'hydration'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Water
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTrendTab('weight');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTrendTab === 'weight'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weight
            </button>
          </div>
        </div>

        {/* 3 Rolling Averages Pill Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10.5px] text-purple-400 uppercase font-bold">7-Day Avg Sleep</span>
              <div className="text-xl font-black text-white mt-0.5">{last7DaysStats.avgSleepHrs} hrs</div>
            </div>
            <Moon className="w-5 h-5 text-purple-400/60" />
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10.5px] text-cyan-400 uppercase font-bold">7-Day Avg Hydration</span>
              <div className="text-xl font-black text-white mt-0.5">{last7DaysStats.avgHydroL}</div>
            </div>
            <Droplets className="w-5 h-5 text-cyan-400/60" />
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10.5px] text-emerald-400 uppercase font-bold">7-Day Avg Readiness</span>
              <div className="text-xl font-black text-white mt-0.5">{last7DaysStats.avgReadiness}</div>
            </div>
            <Activity className="w-5 h-5 text-emerald-400/60" />
          </div>
        </div>

        {/* Active Chart Display */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/10 min-h-[220px]">
          {activeTrendTab === 'readiness' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="text-emerald-400 font-bold">● Systemic Readiness & Score Trends</span>
                <span>Threshold: &gt;80% (Prime)</span>
              </div>
              <RecoveryTrendChart data={recoveryLogs} height={200} />
            </div>
          )}

          {activeTrendTab === 'sleep' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="text-purple-400 font-bold">● Sleep Duration & Target Line</span>
                <span>Goal: {targetSleep} hrs/night</span>
              </div>
              <SleepTrendChart data={sleepLogs} height={200} targetSleepHours={targetSleep} />
            </div>
          )}

          {activeTrendTab === 'hydration' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-bold">● Daily Water Intake Saturation</span>
                <span>Target: {(waterTargetMl / 1000).toFixed(1)} L/day</span>
              </div>
              <HydrationTrendChart data={aggregatedHydrationPoints} height={200} targetGoalMl={waterTargetMl} />
            </div>
          )}

          {activeTrendTab === 'weight' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="text-amber-400 font-bold">● Body Mass Trajectory</span>
                <span>Unit: {user.unitSystem === 'imperial' ? 'lb' : 'kg'}</span>
              </div>
              <WeightTrendChart data={weightPoints} height={200} unit={user.unitSystem} targetWeightKg={user.goals?.targetWeightKg} />
            </div>
          )}
        </div>
      </div>

      {/* 6. Active Bio-Optimization & CNS Recovery Toolkit */}
      <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 bg-gradient-to-br from-[#0B101E] via-[#0D1528] to-[#080D19] shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Bio-Optimization Protocols & Active CNS Restoration
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Scientific interventions to accelerate tissue regeneration and nervous system reset
              </p>
            </div>
          </div>

          {/* Protocol Tab Buttons */}
          <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-black/50 border border-white/10">
            {[
              { id: 'cns', label: '🫁 Box Breathing' },
              { id: 'sleep', label: '🌙 Circadian' },
              { id: 'hydration', label: '💧 Electrolytes' },
              { id: 'mobility', label: '🧘 Mobility' },
              { id: 'nutrition', label: '🥗 Anabolism' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveProtocol(p.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  activeProtocol === p.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol 1: Box Breathing Active CNS Reset Tool */}
        {activeProtocol === 'cns' && (
          <div className="p-6 rounded-3xl bg-black/50 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in">
            <div className="space-y-3 max-w-lg">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10.5px] font-mono font-bold uppercase">
                Autonomic Nervous System Down-Regulation
              </span>
              <h4 className="text-xl font-black text-white tracking-tight">
                4-4-4-4 Tactical Box Breathing
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Immediately reduces systemic cortisol, lowers resting heart rate, and shifts your autonomic state into deep parasympathetic recovery mode.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setIsBreathingActive(!isBreathingActive);
                  }}
                  className={`px-5 py-2.5 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all pressable flex items-center gap-2 shadow-lg ${
                    isBreathingActive 
                      ? 'bg-rose-500 text-white shadow-rose-500/20' 
                      : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-cyan-500/20 hover:scale-105'
                  }`}
                >
                  {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                  <span>{isBreathingActive ? 'Pause Exercise' : 'Start 2-Min Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsBreathingActive(false);
                    setBreathPhase('Inhale');
                    setBreathTimer(4);
                  }}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Breathing Visualizer Orb */}
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <div 
                className={`absolute inset-0 rounded-full border-2 border-cyan-400/40 transition-all duration-1000 ${
                  isBreathingActive && (breathPhase === 'Inhale' || breathPhase === 'Hold')
                    ? 'scale-110 bg-cyan-500/20 shadow-2xl shadow-cyan-500/30'
                    : 'scale-90 bg-cyan-500/5'
                }`} 
              />
              <div 
                className={`w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-500/30 via-teal-500/20 to-blue-500/30 border border-cyan-400/60 flex flex-col items-center justify-center text-center backdrop-blur-md transition-all duration-1000 ${
                  isBreathingActive && breathPhase === 'Inhale' ? 'scale-105' : 'scale-95'
                }`}
              >
                <Wind className="w-6 h-6 text-cyan-300 mb-1 animate-pulse" />
                <span className="text-xs font-mono font-black uppercase text-cyan-200">
                  {isBreathingActive ? breathPhase : 'Ready'}
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {isBreathingActive ? `${breathTimer}s` : '4s'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Protocol 2: Circadian & Deep Sleep Architecture */}
        {activeProtocol === 'sleep' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in font-sans">
            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold">
                <Moon className="w-4 h-4" />
                <span>Phase 1: Blue Light & Melatonin</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cease high-intensity blue screen exposure 90 minutes before bedtime. Stimulate natural endogenous melatonin secretion.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold">
                <ThermometerSnowflake className="w-4 h-4" />
                <span>Phase 2: Thermal Regulation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Keep bedroom ambient temperature at 18-20°C (65-68°F). Core body temperature must drop 1°C for initiation of Stage 4 Deep NREM sleep.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold">
                <Coffee className="w-4 h-4" />
                <span>Phase 3: Adenosine Clearance</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enforce a hard caffeine cutoff 8-10 hours before sleep. Half-life of caffeine averages 6 hours and prevents deep slow-wave restorative sleep.
              </p>
            </div>
          </div>
        )}

        {/* Protocol 3: Electrolyte & Hydration Saturation */}
        {activeProtocol === 'hydration' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in font-sans">
            <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <Sun className="w-4 h-4" />
                <span>Morning Hydro-Flush</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drink 500-750ml of filtered water with a pinch of Himalayan pink salt immediately upon waking to kickstart cellular hydration and adrenals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <Zap className="w-4 h-4" />
                <span>Intra-Workout Sodium & Potassium</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                For training sessions exceeding 45 minutes, supplement 500mg sodium + 200mg potassium to prevent intracellular cramping and maintain blood plasma volume.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <Moon className="w-4 h-4" />
                <span>Evening Taper</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Taper heavy fluid intake 2 hours before sleep to prevent nocturia and sleep fragmentation, preserving uninterrupted REM and slow-wave cycles.
              </p>
            </div>
          </div>
        )}

        {/* Protocol 4: Active Tissue & Mobility */}
        {activeProtocol === 'mobility' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in font-sans">
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <Activity className="w-4 h-4" />
                <span>Zone-2 Active Recovery Walking</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                20-30 minutes of low-intensity walking (HR 100-120 bpm) flushes metabolic waste, increases lymphatic flow, and accelerates DOMS clearance by 40%.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <Layers className="w-4 h-4" />
                <span>Myofascial Foam Rolling</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                60 seconds of continuous rolling over tight muscle bellies (avoiding joints) breaks fascia adhesions and increases arterial blood circulation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <RotateCcw className="w-4 h-4" />
                <span>Thoracic & Hip Mobility Flow</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Perform 90/90 hip openers, Cat-Cow spinal waves, and world's greatest stretches to restore joint kinematics prior to the next heavy training day.
              </p>
            </div>
          </div>
        )}

        {/* Protocol 5: Nutrient Timing & Anabolic Window */}
        {activeProtocol === 'nutrition' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in font-sans">
            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                <Flame className="w-4 h-4" />
                <span>Leucine Threshold Trigger</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Consume 25-40g high-quality protein per meal (delivering 3g+ of L-Leucine) every 3-4 hours to maximally stimulate Muscle Protein Synthesis (MPS).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Anti-Inflammatory Lipids</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Supplement 2-3g of high-EPA/DHA Omega-3 fish oil daily to down-regulate muscle cell membrane inflammation and support tendon integrity.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Pre-Bed Casein / Slow Protein</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                30-40g of micellar casein or Greek yogurt before sleep provides a steady amino acid stream throughout the night, preventing overnight muscle catabolism.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Daily Metrics Modal */}
      {activeModalTab && (
        <DailyMetricsModal
          isOpen={true}
          onClose={() => setActiveModalTab(null)}
          initialTab={activeModalTab}
          initialDate={selectedDate}
        />
      )}

    </div>
  );
};
