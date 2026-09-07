import React, { useState } from 'react';
import { useWorkoutStore, CustomSplitDay } from '@/store/useWorkoutStore';
import { Workout } from '@/types';
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
  BarChart2
} from 'lucide-react';

interface WorkoutScreenProps {
  onOpenActiveWorkout: () => void;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ onOpenActiveWorkout }) => {
  const { workouts, activeWorkout, startWorkout, exercises, weeklySplit } = useWorkoutStore();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [customizerTargetDay, setCustomizerTargetDay] = useState('Monday');

  // Active day selection: default to today's day of week
  const todayDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const todaySplit = weeklySplit.find(s => s.dayIndex === todayDayIndex) || weeklySplit[0];
  const [selectedDayName, setSelectedDayName] = useState<string>(todaySplit.dayName);

  const activeSelectedSplit = weeklySplit.find(s => s.dayName === selectedDayName) || todaySplit;

  const handleStartSplit = (split: CustomSplitDay) => {
    if (split.isRest) return;
    triggerHaptic('medium');
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
        border: 'border-teal-500/30 hover:border-teal-400',
        bg: 'bg-gradient-to-br from-teal-950/40 via-[#0D1524] to-[#070D18]',
        badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        text: 'text-teal-400',
        btnBg: 'bg-teal-500 hover:bg-teal-400 glow-volt'
      };
    }
    if (split.selectedMuscles.includes('Chest') || split.selectedMuscles.includes('Biceps')) {
      return {
        border: 'border-emerald-500/30 hover:border-emerald-400',
        bg: 'bg-gradient-to-br from-emerald-950/40 via-[#0D1524] to-[#070D18]',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        text: 'text-emerald-400',
        btnBg: 'bg-emerald-500 hover:bg-emerald-400 glow-volt'
      };
    }
    if (split.selectedMuscles.includes('Back') || split.selectedMuscles.includes('Triceps')) {
      return {
        border: 'border-cyan-500/30 hover:border-cyan-400',
        bg: 'bg-gradient-to-br from-cyan-950/40 via-[#0D1524] to-[#070D18]',
        badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        text: 'text-cyan-400',
        btnBg: 'bg-cyan-500 hover:bg-cyan-400 glow-cyan'
      };
    }
    return {
      border: 'border-purple-500/30 hover:border-purple-400',
      bg: 'bg-gradient-to-br from-purple-950/40 via-[#0D1524] to-[#070D18]',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      text: 'text-purple-400',
      btnBg: 'bg-purple-500 hover:bg-purple-400 glow-purple'
    };
  };

  const activeColor = getDayColor(activeSelectedSplit);

  return (
    <div className="relative flex flex-col gap-6 w-full pb-20 md:pb-8 animate-fade-in select-none">
      {/* Ambient background glows */}
      <div className="w-[500px] h-[380px] bg-emerald-500/10 rounded-full blur-[120px] absolute -top-24 -left-24 pointer-events-none" />
      <div className="w-[450px] h-[340px] bg-cyan-500/10 rounded-full blur-[110px] absolute top-60 -right-24 pointer-events-none" />

      {/* 1. Top Hero Command Center */}
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
                  Customizable Training Engine
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm">
                  Custom Muscle Splits
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
                {activeWorkout ? activeWorkout.name : 'Strength & Hypertrophy OS'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCustomizer(selectedDayName)}
              className="px-4 py-3 rounded-2xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-white/15 hover:border-emerald-500/40 text-slate-200 font-bold text-xs uppercase tracking-wider pressable transition-all flex items-center gap-2 shadow-sm"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              Customize Splits
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

      {/* 2. PROGRAMMED WEEKLY SCHEDULE MATRIX (Mon - Sun) */}
      <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-5 hud-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Weekly Training Split
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-semibold">
                Fully Customizable
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">
              Weekly Training Architecture
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
              Edit {activeSelectedSplit.dayShort} Split
            </button>
          </div>
        </div>

        {/* 7-Day Interactive Day Pills Grid */}
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
                    ? `${colors.border} ${colors.bg} shadow-lg ring-1 ring-white/20 scale-[1.02]`
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
                  <span>{split.isRest ? 'Rest' : `${split.exerciseIds.length} Ex`}</span>
                  <span>{split.isRest ? 'Recharge' : `~${split.estimatedMinutes}m`}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Expanded Detail Card */}
        <div className={`p-6 rounded-2xl border ${activeColor.border} ${activeColor.bg} shadow-xl space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-mono uppercase font-black px-2.5 py-0.5 rounded-md border ${activeColor.badge}`}>
                  {activeSelectedSplit.dayName} • {activeSelectedSplit.tag}
                </span>
                {activeSelectedSplit.dayIndex === todayDayIndex && (
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    ⚡ Scheduled For Today
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenCustomizer(activeSelectedSplit.dayName)}
                  className="text-xs font-mono text-slate-400 hover:text-white underline flex items-center gap-1 ml-2"
                >
                  <Edit3 className="w-3 h-3 text-emerald-400" />
                  Customize this routine
                </button>
              </div>
              <h3 className="text-2xl font-black text-white mt-1.5">
                {activeSelectedSplit.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeSelectedSplit.subtitle}
              </p>
            </div>

            {!activeSelectedSplit.isRest ? (
              <button
                onClick={() => handleStartSplit(activeSelectedSplit)}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-950 shadow-lg pressable transition-all flex items-center gap-2 ${activeColor.btnBg} animate-shimmer`}
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Start {activeSelectedSplit.dayName}'s Workout
              </button>
            ) : (
              <div className="px-5 py-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold font-mono flex items-center gap-2">
                <Moon className="w-4 h-4 text-teal-400" />
                Active Rest & Recovery Phase
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Coach Notes: </strong>
              {activeSelectedSplit.overviewNotes || 'Focus on controlled tempo, progressive overload, and full mind-muscle contraction.'}
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Targeted Muscle Groups:{' '}
                <span className="text-white font-medium">
                  {activeSelectedSplit.selectedMuscles.length > 0
                    ? activeSelectedSplit.selectedMuscles.join(' • ')
                    : 'Active Recovery'}
                </span>
              </div>
            </div>
          </div>

          {/* Programmed Movement Sequence */}
          {!activeSelectedSplit.isRest && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                  Prescribed Movement Order ({activeSelectedSplit.exerciseIds.length} Exercises):
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenCustomizer(activeSelectedSplit.dayName)}
                  className="text-xs text-emerald-400 hover:underline font-mono"
                >
                  + Edit Movements
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {activeSelectedSplit.exerciseIds.map((exId, idx) => {
                  const exObj = exercises.find(e => e.id === exId);
                  return (
                    <div 
                      key={exId} 
                      className="p-3 rounded-xl bg-black/50 border border-white/10 hover:border-emerald-500/30 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white leading-tight truncate">
                            {exObj ? exObj.name : exId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                            {exObj?.recommendedRepRange || '8-12 reps'} • {exObj?.equipment}
                          </div>
                        </div>
                      </div>

                      {exObj && (
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 ml-2 ${
                          exObj.muscleGroup === 'Chest' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          exObj.muscleGroup === 'Triceps' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          exObj.muscleGroup === 'Back' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          exObj.muscleGroup === 'Biceps' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                          exObj.muscleGroup === 'Shoulders' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {exObj.muscleGroup}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Session History */}
      <div className="w-full">
        {/* Recent Workouts Log */}
        <div className="forge-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-4 hud-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              Session History ({workouts.length})
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
