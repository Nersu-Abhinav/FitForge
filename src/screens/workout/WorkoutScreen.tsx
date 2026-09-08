import React, { useState } from 'react';
import { useWorkoutStore, CustomSplitDay } from '@/store/useWorkoutStore';
import { Workout, Exercise } from '@/types';
import { ExercisePickerModal } from '@/components/workout/ExercisePickerModal';
import { SplitCustomizerModal } from '@/components/workout/SplitCustomizerModal';
import { EditWorkoutModal } from '@/components/workout/EditWorkoutModal';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Play, 
  Plus, 
  Dumbbell, 
  Clock, 
  Flame, 
  Calendar, 
  ChevronRight, 
  Search, 
  History, 
  Layers,
  Star,
  Trophy,
  Filter,
  Sparkles,
  Zap,
  CheckCircle2,
  Activity,
  Moon,
  Info,
  Sliders,
  Edit3,
  Target,
  ShieldCheck,
  BarChart2,
  ArrowRight,
  TrendingUp,
  X,
  HelpCircle,
  Repeat
} from 'lucide-react';

interface WorkoutScreenProps {
  onOpenActiveWorkout: () => void;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ onOpenActiveWorkout }) => {
  const { workouts, activeWorkout, startWorkout, exercises, weeklySplit, prs } = useWorkoutStore();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [customizerTargetDay, setCustomizerTargetDay] = useState('Monday');
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // Active day selection: default to today's day of week
  const todayDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const todaySplit = weeklySplit.find(s => s.dayIndex === todayDayIndex) || weeklySplit[0];
  const [selectedDayName, setSelectedDayName] = useState<string>(todaySplit.dayName);

  const activeSelectedSplit = weeklySplit.find(s => s.dayName === selectedDayName) || todaySplit;

  const handleStartSplit = (split: CustomSplitDay) => {
    if (split.isRest) return;
    triggerHaptic('heavy');
    startWorkout(`${split.dayName}: ${split.title}`, split.exerciseIds);
    onOpenActiveWorkout();
  };

  const handleOpenCustomizer = (dayName: string) => {
    triggerHaptic('light');
    setCustomizerTargetDay(dayName);
    setIsCustomizerOpen(true);
  };

  const getDayColor = (split: CustomSplitDay) => {
    if (split.isRest) {
      return {
        border: 'border-teal-500/40 hover:border-teal-400',
        bg: 'bg-gradient-to-br from-teal-950/50 via-[#0C1726] to-[#060D18]',
        badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        text: 'text-teal-400',
        glow: 'rgba(20, 184, 166, 0.3)',
        accentBg: 'from-teal-500 to-cyan-400',
        btnBg: 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 text-slate-950 hover:brightness-110'
      };
    }
    if (split.selectedMuscles.includes('Chest') || split.selectedMuscles.includes('Biceps')) {
      return {
        border: 'border-emerald-500/40 hover:border-emerald-400',
        bg: 'bg-gradient-to-br from-emerald-950/50 via-[#0A1422] to-[#060D18]',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        text: 'text-emerald-400',
        glow: 'rgba(16, 185, 129, 0.35)',
        accentBg: 'from-emerald-500 to-teal-400',
        btnBg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 shadow-emerald-500/40'
      };
    }
    if (split.selectedMuscles.includes('Back') || split.selectedMuscles.includes('Triceps')) {
      return {
        border: 'border-cyan-500/40 hover:border-cyan-400',
        bg: 'bg-gradient-to-br from-cyan-950/50 via-[#091526] to-[#060D18]',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        text: 'text-cyan-400',
        glow: 'rgba(6, 182, 212, 0.35)',
        accentBg: 'from-cyan-500 to-blue-400',
        btnBg: 'bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 text-slate-950 hover:brightness-110 shadow-cyan-500/40'
      };
    }
    if (split.selectedMuscles.includes('Quads') || split.selectedMuscles.includes('Hamstrings') || split.selectedMuscles.includes('Glutes')) {
      return {
        border: 'border-rose-500/40 hover:border-rose-400',
        bg: 'bg-gradient-to-br from-rose-950/50 via-[#150D1D] to-[#090610]',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        text: 'text-rose-400',
        glow: 'rgba(244, 63, 94, 0.35)',
        accentBg: 'from-rose-500 to-amber-500',
        btnBg: 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-400 text-slate-950 hover:brightness-110 shadow-rose-500/40'
      };
    }
    return {
      border: 'border-purple-500/40 hover:border-purple-400',
      bg: 'bg-gradient-to-br from-purple-950/50 via-[#120D22] to-[#080512]',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      text: 'text-purple-400',
      glow: 'rgba(168, 85, 247, 0.35)',
      accentBg: 'from-purple-500 to-indigo-400',
      btnBg: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-400 text-slate-950 hover:brightness-110 shadow-purple-500/40'
    };
  };

  const activeColor = getDayColor(activeSelectedSplit);

  const getMuscleBadgeStyle = (muscle: string) => {
    switch (muscle) {
      case 'Chest':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Back':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Shoulders':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Biceps':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Triceps':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Quads':
      case 'Hamstrings':
      case 'Glutes':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Abs/Core':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div className="relative flex flex-col gap-6 w-full pb-24 md:pb-10 animate-fade-in select-none">
      {/* Ambient Aurora Glow Lights */}
      <div className="w-[500px] h-[380px] bg-emerald-500/10 rounded-full blur-[120px] absolute -top-24 -left-24 pointer-events-none" />
      <div className="w-[450px] h-[340px] bg-cyan-500/10 rounded-full blur-[110px] absolute top-60 -right-24 pointer-events-none" />

      {/* 1. TOP HEADER & WORKOUT CONTROLLER */}
      <div className="forge-card rounded-3xl p-6 sm:p-7 border border-emerald-500/30 bg-gradient-to-br from-[#09111E] via-[#0B1526] to-[#060B14] shadow-2xl relative overflow-hidden hud-border">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 via-teal-300 to-transparent" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500/25 to-teal-400/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center glow-volt shrink-0 shadow-lg">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Hypertrophy OS Protocol
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm">
                  Smart Split Sync
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
                {activeWorkout ? activeWorkout.name : 'Hypertrophy & Strength HQ'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCustomizer(selectedDayName)}
              className="px-4 py-3 rounded-2xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-white/15 hover:border-emerald-500/40 text-slate-200 font-bold text-xs uppercase tracking-wider pressable transition-all flex items-center gap-2 shadow-sm"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              Customize Split
            </button>

            {activeWorkout ? (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenActiveWorkout();
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:brightness-110 pressable transition-all flex items-center gap-2 animate-shimmer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Resume Active Workout
              </button>
            ) : (
              <button
                onClick={() => handleStartSplit(todaySplit)}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:brightness-110 pressable transition-all flex items-center gap-2 animate-shimmer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                {todaySplit.isRest ? 'Active Recovery' : `Start Today (${todaySplit.title})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. PROGRAMMED WEEKLY SCHEDULE MATRIX (7-DAY STRIP) */}
      <div className="forge-card rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-5 hud-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Weekly Program Architecture
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-semibold">
                7-Day Split
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">
              Select Training Protocol
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-400">
              Today: <span className="text-emerald-400 font-bold">{todaySplit.dayName}</span> • {todaySplit.title}
            </div>
            <button
              onClick={() => handleOpenCustomizer(selectedDayName)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-mono flex items-center gap-1.5 transition-all pressable"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit {activeSelectedSplit.dayShort}
            </button>
          </div>
        </div>

        {/* 7-Day Interactive Day Carousel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {weeklySplit.map((split) => {
            const isToday = split.dayIndex === todayDayIndex;
            const isSelected = split.dayName === activeSelectedSplit.dayName;
            const colors = getDayColor(split);

            return (
              <button
                key={split.dayName}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDayName(split.dayName);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between pressable ${
                  isSelected
                    ? `${colors.border} ${colors.bg} shadow-lg ring-1 ring-white/30 scale-[1.03]`
                    : 'border-white/10 bg-[#0E1424]/80 hover:border-white/20 hover:bg-[#121A2E]'
                }`}
              >
                {isToday && (
                  <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-emerald-500 text-slate-950 font-mono text-[9px] font-black uppercase rounded-full shadow-md glow-volt">
                    Today
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-400">
                      {split.dayShort}
                    </span>
                    {split.isRest ? (
                      <Moon className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Dumbbell className={`w-3.5 h-3.5 ${isSelected ? colors.text : 'text-slate-500'}`} />
                    )}
                  </div>
                  <h4 className={`text-xs font-black mt-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {split.title}
                  </h4>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{split.isRest ? 'Rest' : `${split.exerciseIds.length} Movements`}</span>
                  <span>{split.isRest ? 'Recharge' : `~${split.estimatedMinutes}m`}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. ULTRA-MODERN EXPANDED PROTOCOL HERO CARD */}
        <div className={`p-6 sm:p-7 rounded-3xl border ${activeColor.border} ${activeColor.bg} shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl`}>
          {/* Ambient Glow Aura */}
          <div 
            style={{ backgroundColor: activeColor.glow }}
            className="w-72 h-72 rounded-full blur-[90px] absolute -top-16 -right-16 pointer-events-none" 
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-mono uppercase font-black px-3 py-1 rounded-xl border ${activeColor.badge} shadow-sm`}>
                  {activeSelectedSplit.dayName} • {activeSelectedSplit.tag}
                </span>

                {activeSelectedSplit.dayIndex === todayDayIndex && (
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    Scheduled For Today
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenCustomizer(activeSelectedSplit.dayName)}
                  className="text-xs font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3 h-3 text-emerald-400" />
                  Customize
                </button>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeSelectedSplit.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-xl">
                {activeSelectedSplit.subtitle}
              </p>
            </div>

            {/* Big Tactical Action Button */}
            <div className="shrink-0">
              {!activeSelectedSplit.isRest ? (
                <button
                  onClick={() => handleStartSplit(activeSelectedSplit)}
                  className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl pressable transition-all flex items-center justify-center gap-3 ${activeColor.btnBg} animate-shimmer`}
                >
                  <Play className="w-5 h-5 fill-slate-950 stroke-[3]" />
                  <span>START {activeSelectedSplit.dayName.toUpperCase()}'S WORKOUT</span>
                </button>
              ) : (
                <div className="px-6 py-3.5 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold font-mono flex items-center gap-2.5 shadow-lg">
                  <Moon className="w-4 h-4 text-teal-400" />
                  Active Rest & Recovery Protocol
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Telemetry Pills Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Estimated Time</div>
                <div className="text-xs font-black text-white font-mono">~{activeSelectedSplit.estimatedMinutes} Minutes</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Movements</div>
                <div className="text-xs font-black text-white font-mono">{activeSelectedSplit.exerciseIds.length} Exercises</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Intensity Tier</div>
                <div className="text-xs font-black text-white font-mono">RPE 8.0 - 9.5</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Target Focus</div>
                <div className="text-xs font-black text-white truncate max-w-[110px]">
                  {activeSelectedSplit.selectedMuscles.length > 0 ? activeSelectedSplit.selectedMuscles.join(', ') : 'Rest'}
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Coach Briefing Box */}
          <div className="p-4 rounded-2xl bg-[#090F1A]/80 border border-white/10 text-xs text-slate-300 leading-relaxed relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500" />
            <div className="flex items-start gap-3 pl-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Tactical Hypertrophy Briefing</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">AI Guidance</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeSelectedSplit.overviewNotes || 'Focus on controlled eccentric tempo (2-3s), explosive concentric force, and full muscular stretch under load.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0 sm:self-center pl-2 sm:pl-0">
              {activeSelectedSplit.selectedMuscles.map(m => (
                <span key={m} className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${getMuscleBadgeStyle(m)}`}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* 4. PRESCRIBED MOVEMENT SEQUENCE (ENHANCED CARDS) */}
          {!activeSelectedSplit.isRest && (
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono uppercase text-slate-300 font-black tracking-wider">
                    Prescribed Exercise Protocol ({activeSelectedSplit.exerciseIds.length} Movements)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCustomizer(activeSelectedSplit.dayName)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Edit Order & Add
                </button>
              </div>

              {/* Grid of Movement Protocol Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSelectedSplit.exerciseIds.map((exId, idx) => {
                  const exObj = exercises.find(e => e.id === exId);
                  const prRecord = prs.find(p => p.exerciseId === exId);
                  const muscleColorClass = exObj ? getMuscleBadgeStyle(exObj.muscleGroup) : '';

                  return (
                    <div 
                      key={`${exId}-${idx}`}
                      onClick={() => {
                        if (exObj) {
                          triggerHaptic('light');
                          setPreviewExercise(exObj);
                        }
                      }}
                      className="p-4 rounded-2xl bg-gradient-to-b from-[#0E172A]/90 to-[#0A101E]/90 border border-white/10 hover:border-emerald-500/50 hover:bg-[#131F38] transition-all duration-200 shadow-md flex flex-col justify-between gap-3 group cursor-pointer relative overflow-hidden"
                    >
                      {/* Top Row: Index Badge, Name, Category */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Futuristic Step Hexagon Badge */}
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/15 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-inner group-hover:border-emerald-400/50 group-hover:text-emerald-400 transition-colors">
                            {String(idx + 1).padStart(2, '0')}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors leading-snug truncate">
                              {exObj ? exObj.name : exId}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {exObj && (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${muscleColorClass}`}>
                                  {exObj.muscleGroup}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                {exObj?.equipment || 'Barbell'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Info Arrow Button */}
                        <div className="p-2 rounded-xl bg-white/5 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 border border-white/5 transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Bottom Row: Prescribed Sets & Reps & PR telemetry */}
                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold text-white">3-4 Sets</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300 font-semibold">{exObj?.recommendedRepRange || '8-12 reps'}</span>
                        </div>

                        {prRecord ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg shadow-sm">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>PR: {prRecord.weightKg}kg × {prRecord.reps}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-slate-500" />
                            <span>Hypertrophy Target</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. SESSION HISTORY & LOGS */}
      <div className="w-full">
        <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-4 hud-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              Logged Sessions History ({workouts.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Click any workout to view & edit details
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {workouts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No completed sessions yet. Start today's split to record your first workout!
              </div>
            ) : (
              workouts.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setEditingWorkout(w);
                  }}
                  className="p-4 rounded-2xl bg-[#121A2C] border border-white/10 hover:border-emerald-500/50 hover:bg-[#18233B] transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                        {w.date} • {Math.round(w.durationSeconds / 60)}m
                      </span>
                      <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors mt-0.5">
                        {w.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.rating && (
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: w.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setEditingWorkout(w);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 border border-white/5 transition-all"
                        title="Edit Workout"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono pt-2.5 mt-2.5 border-t border-white/10">
                    <span className="text-emerald-400 font-black">{w.totalVolumeKg?.toLocaleString()} kg volume</span>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{w.exercises.length} Exercises</span>
                      <span>•</span>
                      <span className="text-emerald-400/80 group-hover:text-emerald-300 font-bold flex items-center gap-1">
                        Edit <ChevronRight className="w-3 h-3 inline" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EXERCISE PREVIEW MODAL */}
      {previewExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#0C1424] border border-emerald-500/40 shadow-2xl p-6 space-y-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-md font-bold border ${getMuscleBadgeStyle(previewExercise.muscleGroup)}`}>
                    {previewExercise.muscleGroup}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/10 px-2.5 py-0.5 rounded-md">
                    {previewExercise.equipment}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {previewExercise.name}
                </h3>
              </div>

              <button
                onClick={() => setPreviewExercise(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Cues */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Execution & Form Guidance</span>
                </div>
                {previewExercise.instructions && previewExercise.instructions.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed font-sans">
                    {previewExercise.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">Keep strict posture, full range of motion, and squeeze at the peak of contraction.</p>
                )}
              </div>

              {/* Personal Record Telemetry */}
              {(() => {
                const previewPr = prs.find(p => p.exerciseId === previewExercise.id);
                if (!previewPr) return null;
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">Personal Record</div>
                        <div className="text-sm font-black text-white font-mono">
                          {previewPr.weightKg} kg × {previewPr.reps} reps
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-amber-400/80 uppercase font-bold">Recorded Best</div>
                      <div className="text-xs font-black text-white">
                        {previewPr.value ? `${previewPr.value} kg` : `${previewPr.weightKg} kg`}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPreviewExercise(null)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={(exId) => {
          if (activeWorkout) {
            useWorkoutStore.getState().addExerciseToWorkout(exId);
            onOpenActiveWorkout();
          } else {
            startWorkout('Workout Session');
            useWorkoutStore.getState().addExerciseToWorkout(exId);
            onOpenActiveWorkout();
          }
        }}
      />

      {/* Split Customizer Modal */}
      <SplitCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        targetDayName={customizerTargetDay}
      />

      {/* Historical Workout Editor Modal */}
      <EditWorkoutModal
        isOpen={!!editingWorkout}
        workout={editingWorkout}
        onClose={() => setEditingWorkout(null)}
      />

    </div>
  );
};
