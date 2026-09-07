import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBodyStore } from '@/store/useBodyStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { CalendarDatePicker } from '@/components/common/CalendarDatePicker';
import { getToday } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';
import { 
  X, 
  Scale, 
  Moon, 
  Activity, 
  Droplets, 
  Check, 
  Calendar, 
  Sparkles, 
  Flame, 
  Clock, 
  TrendingUp,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap,
  Trash2,
  RotateCcw,
  Minus,
  Plus,
  BedDouble,
  Sun
} from 'lucide-react';

export type MetricTab = 'weight' | 'sleep' | 'recovery' | 'hydration';

interface DailyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: MetricTab;
  initialDate?: string;
}

const MUSCLE_CATEGORIES = [
  { group: 'Upper Body', muscles: ['Chest', 'Upper Back', 'Lats', 'Shoulders', 'Biceps', 'Triceps'] },
  { group: 'Lower Body', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { group: 'Core', muscles: ['Abs/Core', 'Lower Back'] }
];

function formatHydrationDisplayTime(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  if (timeStr.includes('T') || timeStr.endsWith('Z')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
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

export const DailyMetricsModal: React.FC<DailyMetricsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'weight',
  initialDate
}) => {
  const { user } = useAuthStore();
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const { 
    measurements, 
    sleepLogs, 
    recoveryLogs, 
    logMeasurements, 
    logSleep, 
    logRecovery,
    deleteMeasurement,
    deleteSleep,
    deleteRecovery,
    getMeasurementForDate,
    getSleepForDate,
    getRecoveryForDate,
    getLatestWeight
  } = useBodyStore();

  const { 
    getWaterForDate, 
    getLogsForDate, 
    addWater, 
    subtractWater, 
    deleteLog: deleteHydrationLog, 
    clearWaterForDate, 
    removeLastLog 
  } = useHydrationStore();

  const [activeTab, setActiveTab] = useState<MetricTab>(initialTab);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || getToday()
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // --- Weight State ---
  const [weightValue, setWeightValue] = useState<string>('');
  const [bodyFatPct, setBodyFatPct] = useState<string>('');
  const [showAdvancedMeasurements, setShowAdvancedMeasurements] = useState(false);
  const [chestCm, setChestCm] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [hipsCm, setHipsCm] = useState<string>('');
  const [armsCm, setArmsCm] = useState<string>('');
  const [thighsCm, setThighsCm] = useState<string>('');
  const [weightNotes, setWeightNotes] = useState<string>('');

  // --- Sleep State ---
  const [sleepHours, setSleepHours] = useState<string>('7.5');
  const [bedtime, setBedtime] = useState<string>('23:00');
  const [wakeTime, setWakeTime] = useState<string>('06:30');
  const [sleepQuality, setSleepQuality] = useState<number>(85);
  const [deepSleepMins, setDeepSleepMins] = useState<string>('90');

  // --- Recovery State ---
  const [energy, setEnergy] = useState<number>(8);
  const [soreness, setSoreness] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [soreMuscles, setSoreMuscles] = useState<string[]>([]);
  const [recoveryNotes, setRecoveryNotes] = useState<string>('');

  // --- Hydration State ---
  const [customWaterInput, setCustomWaterInput] = useState<string>('250');

  // Sync state when tab or date changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    if (!isOpen) return;

    // Load existing measurement
    const existingMeas = getMeasurementForDate(selectedDate);
    if (existingMeas) {
      const displayW = user.unitSystem === 'imperial'
        ? (existingMeas.weightKg * 2.20462).toFixed(1)
        : String(existingMeas.weightKg || '');
      setWeightValue(displayW);
      setBodyFatPct(existingMeas.bodyFatPct !== undefined ? String(existingMeas.bodyFatPct) : '');
      setChestCm(existingMeas.chestCm !== undefined ? String(existingMeas.chestCm) : '');
      setWaistCm(existingMeas.waistCm !== undefined ? String(existingMeas.waistCm) : '');
      setHipsCm(existingMeas.hipsCm !== undefined ? String(existingMeas.hipsCm) : '');
      setArmsCm(existingMeas.armsCm !== undefined ? String(existingMeas.armsCm) : '');
      setThighsCm(existingMeas.thighsCm !== undefined ? String(existingMeas.thighsCm) : '');
      setWeightNotes(existingMeas.notes || '');
    } else {
      const latest = getLatestWeight();
      const displayW = latest > 0
        ? (user.unitSystem === 'imperial' ? (latest * 2.20462).toFixed(1) : String(latest))
        : '';
      setWeightValue(displayW);
      setBodyFatPct('');
      setChestCm('');
      setWaistCm('');
      setHipsCm('');
      setArmsCm('');
      setThighsCm('');
      setWeightNotes('');
    }

    // Load existing sleep
    const existingSleep = getSleepForDate(selectedDate);
    if (existingSleep) {
      setSleepHours((existingSleep.durationMinutes / 60).toFixed(1));
      setBedtime(existingSleep.bedtime || '23:00');
      setWakeTime(existingSleep.wakeTime || '06:30');
      setSleepQuality(existingSleep.qualityScore || 85);
      setDeepSleepMins(existingSleep.deepSleepMinutes ? String(existingSleep.deepSleepMinutes) : '90');
    } else {
      setSleepHours('7.5');
      setBedtime('23:00');
      setWakeTime('06:30');
      setSleepQuality(85);
      setDeepSleepMins('90');
    }

    // Load existing recovery
    const existingRecovery = getRecoveryForDate(selectedDate);
    if (existingRecovery) {
      setEnergy(existingRecovery.energyLevel || 8);
      setSoreness(existingRecovery.sorenessLevel || 3);
      setStress(existingRecovery.stressLevel || 3);
      setRecoveryNotes(existingRecovery.notes || '');
    } else {
      setEnergy(8);
      setSoreness(3);
      setStress(3);
      setRecoveryNotes('');
    }
  }, [isOpen, selectedDate, activeTab]);

  if (!isOpen) return null;

  const showToast = (msg: string, autoClose = false) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
      if (autoClose) {
        onClose();
      }
    }, 1200);
  };

  // --- Handlers ---
  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightValue);
    if (!w || isNaN(w) || w <= 0) return;

    triggerHaptic('medium');
    const normalizedWeightKg = user.unitSystem === 'imperial' ? w / 2.20462 : w;

    const payload = {
      date: selectedDate,
      weightKg: Math.round(normalizedWeightKg * 100) / 100,
      bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : undefined,
      chestCm: chestCm ? parseFloat(chestCm) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
      hipsCm: hipsCm ? parseFloat(hipsCm) : undefined,
      armsCm: armsCm ? parseFloat(armsCm) : undefined,
      thighsCm: thighsCm ? parseFloat(thighsCm) : undefined,
      notes: weightNotes.trim() || undefined
    };

    logMeasurements(payload);
    onClose();
  };

  const handleAdjustWeight = (delta: number) => {
    triggerHaptic('light');
    const current = parseFloat(weightValue) || 75;
    const updated = Math.max(10, current + delta);
    setWeightValue(updated.toFixed(1));
  };

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(sleepHours);
    if (!hours || isNaN(hours) || hours <= 0) return;

    triggerHaptic('medium');
    const totalMins = Math.round(hours * 60);
    const deepMins = deepSleepMins ? parseInt(deepSleepMins, 10) : undefined;

    logSleep({
      date: selectedDate,
      durationMinutes: totalMins,
      bedtime,
      wakeTime,
      qualityScore: sleepQuality,
      deepSleepMinutes: deepMins
    });

    onClose();
  };

  const handleAdjustSleep = (delta: number) => {
    triggerHaptic('light');
    const current = parseFloat(sleepHours) || 7.5;
    const updated = Math.min(16, Math.max(1, current + delta));
    setSleepHours(updated.toFixed(1));
  };

  const handleSaveRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    const notesWithMuscles = soreMuscles.length > 0 
      ? `Sore: ${soreMuscles.join(', ')}${recoveryNotes ? ` | ${recoveryNotes}` : ''}`
      : recoveryNotes;

    logRecovery(energy, soreness, stress, notesWithMuscles || undefined, selectedDate);
    onClose();
  };

  const handleAddWaterPreset = (ml: number) => {
    triggerHaptic('light');
    addWater(ml, selectedDate);
  };

  const handleSubtractWaterPreset = (ml: number) => {
    triggerHaptic('light');
    subtractWater(ml, selectedDate);
  };

  const handleDeleteWeightLog = () => {
    triggerHaptic('medium');
    deleteMeasurement(selectedDate);
    onClose();
  };

  const handleDeleteSleepLog = () => {
    triggerHaptic('medium');
    deleteSleep(selectedDate);
    onClose();
  };

  const handleDeleteRecoveryLog = () => {
    triggerHaptic('medium');
    deleteRecovery(selectedDate);
    onClose();
  };

  const handleUndoLastWater = () => {
    triggerHaptic('medium');
    removeLastLog(selectedDate);
  };

  const handleClearAllWater = () => {
    triggerHaptic('medium');
    clearWaterForDate(selectedDate);
  };

  const handleDeleteWaterEntry = (id: string, amount: number) => {
    triggerHaptic('medium');
    deleteHydrationLog(id);
  };

  const handleSaveCustomWater = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = parseInt(customWaterInput, 10);
    if (ml && ml > 0) {
      triggerHaptic('light');
      addWater(ml, selectedDate);
      setCustomWaterInput('');
    }
  };

  const handleSubtractCustomWater = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = parseInt(customWaterInput, 10);
    if (ml && ml > 0) {
      triggerHaptic('light');
      subtractWater(ml, selectedDate);
      showToast(`-${ml}ml removed!`, false);
    }
  };

  const toggleSoreMuscle = (muscle: string) => {
    triggerHaptic('light');
    if (soreMuscles.includes(muscle)) {
      setSoreMuscles(soreMuscles.filter(m => m !== muscle));
    } else {
      setSoreMuscles([...soreMuscles, muscle]);
    }
  };

  // Calculated Recovery Score Preview
  const previewEnergyPts = (energy / 10) * 40;
  const previewSorenessPts = ((10 - soreness) / 10) * 30;
  const previewStressPts = ((10 - stress) / 10) * 30;
  const previewCalculatedRecovery = Math.round(previewEnergyPts + previewSorenessPts + previewStressPts);

  const getRecoveryReadiness = (score: number) => {
    if (score >= 80) return { label: 'Peak Readiness', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40 glow-volt' };
    if (score >= 60) return { label: 'Good Training State', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40 glow-cyan' };
    if (score >= 40) return { label: 'Moderate Fatigue', color: 'text-amber-400 bg-amber-500/15 border-amber-500/40 glow-amber' };
    return { label: 'Recovery Recommended', color: 'text-rose-400 bg-rose-500/15 border-rose-500/40 glow-rose' };
  };

  const readiness = getRecoveryReadiness(previewCalculatedRecovery);
  const existingMeasForDate = getMeasurementForDate(selectedDate);
  const existingSleepForDate = getSleepForDate(selectedDate);
  const existingRecoveryForDate = getRecoveryForDate(selectedDate);
  const waterForDate = getWaterForDate(selectedDate);
  const dayWaterLogs = getLogsForDate(selectedDate);
  const waterGoal = user.goals.dailyWaterMl || 3000;
  const waterPct = Math.min(100, Math.round((waterForDate / waterGoal) * 100));

  // Dedicated Theme Configurations with Clean Non-Truncated Headers
  const metricConfigs = {
    weight: {
      title: 'Bodyweight & Stats',
      subtitle: 'Morning weigh-in, body fat %, and tape circumferences',
      icon: Scale,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20 border-amber-500/40 glow-amber',
      headerGradient: 'from-amber-950/50 via-[#0E1528] to-[#0A101C]'
    },
    sleep: {
      title: 'Sleep & Recovery',
      subtitle: 'Sleep duration, restorative score, and sleep schedule',
      icon: Moon,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20 border-purple-500/40 glow-purple',
      headerGradient: 'from-purple-950/50 via-[#0E1528] to-[#0A101C]'
    },
    recovery: {
      title: 'Readiness & DOMS',
      subtitle: 'Physiological energy, localized soreness, and stress',
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20 border-emerald-500/40 glow-volt',
      headerGradient: 'from-emerald-950/50 via-[#0E1528] to-[#0A101C]'
    },
    hydration: {
      title: 'Daily Hydration',
      subtitle: 'Water intake telemetry, 1-tap presets, and fluid logs',
      icon: Droplets,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20 border-cyan-500/40 glow-cyan',
      headerGradient: 'from-cyan-950/50 via-[#0E1528] to-[#0A101C]'
    }
  };

  const currentConfig = metricConfigs[activeTab];
  const CurrentIcon = currentConfig.icon;

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-hidden"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] bg-[#0A0E1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up relative hud-border"
      >
        
        {/* Dedicated Header Bar */}
        <div className={`px-5 py-3.5 border-b border-white/10 bg-gradient-to-r ${currentConfig.headerGradient} flex items-center justify-between shrink-0 relative z-10`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-bold shadow-lg shrink-0 ${currentConfig.iconBg} ${currentConfig.iconColor}`}>
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {currentConfig.title}
                </h3>
                <SyncStatusBadge size="sm" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors pressable shrink-0 ml-2"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector Row */}
        <div className="px-5 py-2.5 bg-[#070A12] border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
          <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider">
            TARGET DATE
          </span>
          <CalendarDatePicker
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Success Toast Overlay */}
        {successToast && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in relative z-10">
            <Check className="w-4 h-4 text-emerald-400" />
            {successToast}
          </div>
        )}

        {/* Body Content Area - Strictly Dedicated to ONLY the clicked metric */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-slate-200 relative z-10 w-full min-w-0">

          {/* DEDICATED VIEW 1: WEIGHT & BODY COMPOSITION */}
          {activeTab === 'weight' && (
            <form onSubmit={handleSaveWeight} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">Morning Weigh-In Telemetry</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Fasted bodyweight & optional composition metrics</p>
                </div>
                {existingMeasForDate && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-bold">
                    Editing Log
                  </span>
                )}
              </div>

              {/* High-Tech Weight Scale Card with Micro-Adjusters */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0E1528] via-[#0B1020] to-[#070B14] border border-amber-500/30 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase font-bold">Body Mass ({user.unitSystem === 'imperial' ? 'lb' : 'kg'}) *</span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">Smart Scale Input</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustWeight(-0.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-amber-500/30 transition-all font-mono font-bold text-xs"
                    title="Minus 0.5"
                  >
                    -0.5
                  </button>

                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 76.5"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-900/90 border border-white/10 rounded-xl text-center text-white font-mono font-black text-2xl sm:text-3xl focus:outline-none focus:border-amber-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustWeight(0.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-amber-500/30 transition-all font-mono font-bold text-xs"
                    title="Plus 0.5"
                  >
                    +0.5
                  </button>
                </div>

                {/* Quick Benchmark Chips */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>Goal Target: <strong className="text-amber-300 font-bold">{user.goals.targetWeightKg || 78.5} kg</strong></span>
                  {weightValue && (
                    <span className="text-slate-300">
                      ≈ {(parseFloat(weightValue) * (user.unitSystem === 'imperial' ? 0.453592 : 2.20462)).toFixed(1)} {user.unitSystem === 'imperial' ? 'kg' : 'lbs'}
                    </span>
                  )}
                </div>
              </div>

              {/* Body Fat % Card */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase">Body Fat Percentage (optional)</label>
                  {bodyFatPct && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      {parseFloat(bodyFatPct) < 14 ? '🟢 Athletic' : parseFloat(bodyFatPct) <= 20 ? '🟡 Fitness' : '🔵 Standard'}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="60"
                  placeholder="e.g. 14.5"
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-amber-400 font-mono font-bold text-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Collapsible Tape Measurements */}
              <div className="border border-white/10 rounded-2xl p-3.5 bg-black/20 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedMeasurements(!showAdvancedMeasurements)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
                >
                  <span className="flex items-center gap-2 font-mono">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Body Tape Circumferences (cm)
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    {showAdvancedMeasurements ? '− Hide' : '+ Expand Tape Log'}
                  </span>
                </button>

                {showAdvancedMeasurements && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 animate-fade-in">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Chest</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="cm"
                        value={chestCm}
                        onChange={(e) => setChestCm(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Waist</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="cm"
                        value={waistCm}
                        onChange={(e) => setWaistCm(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Hips</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="cm"
                        value={hipsCm}
                        onChange={(e) => setHipsCm(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Arms</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="cm"
                        value={armsCm}
                        onChange={(e) => setArmsCm(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Thighs</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="cm"
                        value={thighsCm}
                        onChange={(e) => setThighsCm(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fasted morning weigh-in, high energy"
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                {existingMeasForDate && (
                  <button
                    type="button"
                    onClick={handleDeleteWeightLog}
                    className="py-3 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors pressable"
                    title="Delete this weight record"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-amber pressable transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Save Weight & Stats
                </button>
              </div>
            </form>
          )}

          {/* DEDICATED VIEW 2: SLEEP TRACKER */}
          {activeTab === 'sleep' && (
            <form onSubmit={handleSaveSleep} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono uppercase text-purple-400 font-bold tracking-wider">Sleep & Nocturnal Recovery</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Restorative duration and quality score</p>
                </div>
                {existingSleepForDate && (
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 font-bold">
                    Editing Log
                  </span>
                )}
              </div>

              {/* Total Sleep Card with Micro-Adjusters and Quick Chips */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#120D22] via-[#0E0A1C] to-[#070510] border border-purple-500/30 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase font-bold">Sleep Duration (Hours) *</span>
                  <span className="text-xs font-mono text-purple-400 font-bold">
                    {Math.floor(parseFloat(sleepHours) || 0)}h {Math.round(((parseFloat(sleepHours) || 0) % 1) * 60)}m
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustSleep(-0.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-purple-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-purple-500/30 transition-all font-mono font-bold text-xs"
                    title="Minus 30 mins"
                  >
                    -30m
                  </button>

                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="16"
                      required
                      placeholder="7.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-900/90 border border-white/10 rounded-xl text-center text-purple-300 font-mono font-black text-2xl sm:text-3xl focus:outline-none focus:border-purple-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustSleep(0.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-purple-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-purple-500/30 transition-all font-mono font-bold text-xs"
                    title="Plus 30 mins"
                  >
                    +30m
                  </button>
                </div>

                {/* Quick Preset Hours */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                  {[6, 6.5, 7, 7.5, 8, 8.5, 9].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setSleepHours(String(hrs))}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                        parseFloat(sleepHours) === hrs
                          ? 'bg-purple-500 text-white border-purple-400 shadow glow-purple font-black'
                          : 'bg-[#0E1424] text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Range Slider */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase">Restorative Quality Score</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {sleepQuality}% ({sleepQuality >= 85 ? '🌟 Optimal' : sleepQuality >= 70 ? '👍 Good' : '⚠️ Low'})
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
                  className="w-full mt-2 accent-purple-500"
                />
              </div>

              {/* Bedtime & Wake Time Dual Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-bold uppercase">
                    <BedDouble className="w-3.5 h-3.5 text-purple-400" />
                    Bedtime
                  </label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-bold uppercase">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Wake Time
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                {existingSleepForDate && (
                  <button
                    type="button"
                    onClick={handleDeleteSleepLog}
                    className="py-3 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors pressable"
                    title="Delete this sleep record"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider shadow-lg glow-purple pressable transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Save Sleep Record
                </button>
              </div>
            </form>
          )}

          {/* DEDICATED VIEW 3: RECOVERY & DOMS */}
          {activeTab === 'recovery' && (
            <form onSubmit={handleSaveRecovery} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">Physiological Readiness & DOMS</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Neural readiness, muscular fatigue, and stress indicators</p>
                </div>
                {existingRecoveryForDate && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                    Editing Log
                  </span>
                )}
              </div>

              {/* Dynamic Readiness Score HUD Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1A24] via-[#08121A] to-[#040A0F] border border-emerald-500/30 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Computed Readiness Score</span>
                  <div className="text-3xl font-black font-mono text-white mt-0.5">
                    {previewCalculatedRecovery} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${readiness.color}`}>
                  {readiness.label}
                </div>
              </div>

              {/* Sliders: Energy, Soreness, Stress */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-mono font-medium">Energy Level:</span>
                    <span className="font-mono text-emerald-400 font-bold">{energy} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-mono font-medium">Muscle Soreness (DOMS):</span>
                    <span className="font-mono text-rose-400 font-bold">{soreness} / 10 (10 = severe)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={soreness}
                    onChange={(e) => setSoreness(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-mono font-medium">Life & Training Stress:</span>
                    <span className="font-mono text-amber-400 font-bold">{stress} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stress}
                    onChange={(e) => setStress(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Categorized Muscle Soreness Specific Tags */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase block">
                  Target Specific Sore Muscles (tap to toggle):
                </label>
                <div className="space-y-2 p-3 bg-black/30 rounded-2xl border border-white/5">
                  {MUSCLE_CATEGORIES.map((cat) => (
                    <div key={cat.group} className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">{cat.group}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.muscles.map((muscle) => {
                          const isSelected = soreMuscles.includes(muscle);
                          return (
                            <button
                              key={muscle}
                              type="button"
                              onClick={() => toggleSoreMuscle(muscle)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all pressable ${
                                isSelected
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                                  : 'bg-[#0E1424] text-slate-400 border border-white/5 hover:border-white/20'
                              }`}
                            >
                              {muscle} {isSelected && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Recovery Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Legs fatigued from squats, solid mental focus"
                  value={recoveryNotes}
                  onChange={(e) => setRecoveryNotes(e.target.value)}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                {existingRecoveryForDate && (
                  <button
                    type="button"
                    onClick={handleDeleteRecoveryLog}
                    className="py-3 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors pressable"
                    title="Delete this recovery record"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt pressable transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Save Recovery Score
                </button>
              </div>
            </form>
          )}

          {/* DEDICATED VIEW 4: HYDRATION & WATER */}
          {activeTab === 'hydration' && (
            <div className="space-y-4">
              {/* Fluid Progress Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#091828] via-[#071220] to-[#040A12] border border-cyan-500/30 flex items-center justify-between shadow-inner">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    Daily Cellular Hydration
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black text-white font-mono">
                      {(waterForDate / 1000).toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">/ {(waterGoal / 1000).toFixed(1)} L</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ml-1">
                      {waterPct}% Goal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {waterForDate > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllWater}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold transition-all flex items-center gap-1 pressable"
                      title="Clear all hydration for this date"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 1-Tap Quick Presets */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2.5">
                <span className="text-xs text-slate-400 block font-mono font-bold uppercase">1-Tap Quick Add Presets:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { amt: 250, label: '+250ml', desc: 'Glass 🥛' },
                    { amt: 500, label: '+500ml', desc: 'Bottle 🍶' },
                    { amt: 750, label: '+750ml', desc: 'Shaker 🥤' },
                    { amt: 1000, label: '+1L', desc: 'Jug 🫗' }
                  ].map((p) => (
                    <button
                      key={p.amt}
                      type="button"
                      onClick={() => handleAddWaterPreset(p.amt)}
                      className="py-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs pressable transition-all flex flex-col items-center gap-1 shadow-sm active:scale-95"
                    >
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Undo / Decrement Row */}
                {waterForDate > 0 && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap animate-fade-in">
                    <span className="text-[11px] font-mono text-slate-400">Quick Decrease:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSubtractWaterPreset(250)}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold transition-all flex items-center gap-1 pressable"
                      >
                        <Minus className="w-3 h-3" />
                        250ml
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubtractWaterPreset(500)}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold transition-all flex items-center gap-1 pressable"
                      >
                        <Minus className="w-3 h-3" />
                        500ml
                      </button>
                      <button
                        type="button"
                        onClick={handleUndoLastWater}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-all flex items-center gap-1 pressable"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Undo Last
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Water Amount */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase block">Custom Water Amount (ml)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="50"
                    min="50"
                    max="5000"
                    value={customWaterInput}
                    onChange={(e) => setCustomWaterInput(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-mono font-bold text-base focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomWater}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase shadow-md glow-cyan pressable flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    Add
                  </button>
                  {waterForDate > 0 && (
                    <button
                      type="button"
                      onClick={handleSubtractCustomWater}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-bold text-xs uppercase transition-all pressable flex items-center gap-1"
                      title="Remove this amount"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Individual Logged Entries Breakdown */}
              {dayWaterLogs.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Logged Entries ({dayWaterLogs.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Tap 🗑️ to delete</span>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {dayWaterLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-slate-900/80 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="font-mono font-bold text-xs text-cyan-300">+{log.amountMl} ml</span>
                          {log.timestamp && (
                            <span className="text-[10px] font-mono text-slate-500">at {formatHydrationDisplayTime(log.timestamp)}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteWaterEntry(log.id, log.amountMl)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all pressable"
                          title="Delete this water entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-cyan pressable transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Done & Apply
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
};
