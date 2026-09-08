import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { ExercisePickerModal } from './ExercisePickerModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { SetType } from '@/types';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Play, 
  Check, 
  Plus, 
  Trash2, 
  Clock, 
  Flame, 
  Dumbbell, 
  ChevronDown, 
  X, 
  Award,
  MoreVertical,
  Star,
  SlidersHorizontal,
  Timer,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface ActiveWorkoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutProps> = ({ isOpen, onClose }) => {
  useModalBehavior({ isOpen, onClose });
  const { 
    activeWorkout, 
    activeWorkoutElapsedSeconds,
    isActiveWorkoutPaused,
    pauseActiveWorkoutTimer,
    resumeActiveWorkoutTimer,
    setActiveWorkoutElapsedSeconds,
    exercises,
    finishWorkout, 
    discardWorkout, 
    addExerciseToWorkout, 
    removeExerciseFromWorkout,
    addSetToExercise,
    updateSet,
    toggleSetCompleted,
    removeSet,
    restTimer,
    startRestTimer,
    stopRestTimer,
    adjustRestTimer
  } = useWorkoutStore();

  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [finishRating, setFinishRating] = useState(5);
  const [finishNotes, setFinishNotes] = useState('');

  // Plate / DB Calculator state
  const [plateCalcState, setPlateCalcState] = useState<{
    isOpen: boolean;
    exerciseId?: string;
    setId?: string;
    equipmentType?: string;
    currentWeight?: number;
    title?: string;
  }>({ isOpen: false });

  // Workout duration timer (ticks only when open and not paused)
  useEffect(() => {
    if (!isOpen || !activeWorkout || isActiveWorkoutPaused) return;

    const interval = setInterval(() => {
      setActiveWorkoutElapsedSeconds((s: number) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeWorkout, isActiveWorkoutPaused, setActiveWorkoutElapsedSeconds]);

  if (!isOpen || !activeWorkout) return null;

  const handleMinimize = () => {
    triggerHaptic('light');
    pauseActiveWorkoutTimer(); // Stop timer when leaving/collapsing, resumes when clicking Resume Active Workout
    onClose();
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m ${secs}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate live volume & completed sets
  let liveVolume = 0;
  let liveCompletedSets = 0;
  let totalSetsCount = 0;

  activeWorkout.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      totalSetsCount++;
      if (s.completed) {
        liveVolume += (s.weightKg * s.reps);
        liveCompletedSets++;
      }
    });
  });

  const completionPct = totalSetsCount > 0 ? Math.round((liveCompletedSets / totalSetsCount) * 100) : 0;

  const handleFinish = () => {
    finishWorkout(finishNotes, finishRating);
    setIsFinishing(false);
    onClose();
  };

  const handleSetToggle = (exerciseId: string, setId: string, completedBefore: boolean) => {
    toggleSetCompleted(exerciseId, setId);
    if (!completedBefore) {
      // Auto trigger 90s rest timer on completing a set
      startRestTimer(90);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070A12] text-white animate-fade-in overflow-hidden transform-gpu">
      
      {/* Ambient Aurora Glow Lights */}
      <div className="w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] absolute -top-10 -left-20 pointer-events-none" />
      <div className="w-[450px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] absolute top-1/3 -right-20 pointer-events-none" />
      <div className="w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[90px] absolute bottom-10 left-1/4 pointer-events-none" />

      {/* Top Live Telemetry HUD Bar with Mobile Safe Area Support */}
      <header 
        style={{
          paddingTop: 'max(14px, env(safe-area-inset-top, 28px))'
        }}
        className="px-4 sm:px-6 pb-3.5 border-b border-white/10 bg-[#0B0F1C]/90 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-20 shadow-2xl"
      >
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleMinimize}
            className="p-2 rounded-2xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all pressable"
            title="Minimize workout"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isActiveWorkoutPaused ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'} shadow-[0_0_8px_rgba(16,185,129,0.8)]`} />
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {activeWorkout.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs font-mono mt-0.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  if (isActiveWorkoutPaused) {
                    resumeActiveWorkoutTimer();
                  } else {
                    pauseActiveWorkoutTimer();
                  }
                }}
                className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md border transition-all pressable ${
                  isActiveWorkoutPaused 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                }`}
                title={isActiveWorkoutPaused ? "Resume Timer" : "Pause Timer"}
              >
                {isActiveWorkoutPaused ? <Play className="w-3 h-3 fill-amber-300" /> : <Clock className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{formatTimer(activeWorkoutElapsedSeconds)}</span>
                {isActiveWorkoutPaused && <span className="text-[9px] uppercase font-mono tracking-wider opacity-90">Paused</span>}
              </button>
              <span className="text-slate-400">
                <strong className="text-white">{liveCompletedSets}</strong>/{totalSetsCount} sets ({completionPct}%)
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-cyan-400 font-bold hidden sm:inline">
                {Math.round(liveVolume).toLocaleString()} kg volume
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Rest Timer Badge & Finish Button */}
        <div className="flex items-center gap-2.5">
          {restTimer.isActive && restTimer.remainingSeconds > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold animate-pulse">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rest: {formatTimer(restTimer.remainingSeconds)}</span>
              <button 
                onClick={stopRestTimer}
                className="ml-1 text-slate-400 hover:text-white"
                title="Stop Rest Timer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFinishing(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt hover:brightness-110 pressable transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Finish</span>
          </button>
        </div>
      </header>

      {/* Main Exercises Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-3xl mx-auto w-full pb-36 relative z-10">
        
        {/* Rest Timer Quick Launch Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0E1424] border border-white/10 text-xs shadow-inner">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Rest Timer:</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            {[30, 60, 90, 120, 180].map((secs) => (
              <button
                key={secs}
                onClick={() => startRestTimer(secs)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/5 text-[11px] font-bold transition-colors pressable"
              >
                {secs >= 60 ? `${secs / 60}m` : `${secs}s`}
              </button>
            ))}
          </div>
        </div>

        {activeWorkout.exercises.length === 0 ? (
          /* Empty Workout State */
          <div className="py-16 sm:py-20 text-center flex flex-col items-center forge-card rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-lg glow-volt">
              <Dumbbell className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-1.5">Your Workout is Empty</h2>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Add your first exercise to start recording sets, reps, and weights with ghost suggestions and automatic plate calculation.
            </p>
            <button
              onClick={() => setIsExercisePickerOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl glow-volt pressable transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add First Exercise
            </button>
          </div>
        ) : (
          /* Exercises List */
          activeWorkout.exercises.map((exercise, exIdx) => {
            const exMeta = exercises.find(e => e.id === exercise.exerciseId || e.name.toLowerCase() === exercise.exerciseName.toLowerCase());
            const eqType = exMeta?.equipment || 'Barbell';
            const isDumbbell = eqType === 'Dumbbell';
            const isBarbell = eqType === 'Barbell';

            return (
              <div
                key={exercise.id}
                className="forge-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
              >
                {/* Left equipment vertical glow accent */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  isBarbell ? 'bg-gradient-to-b from-emerald-400 to-teal-500' :
                  isDumbbell ? 'bg-gradient-to-b from-cyan-400 to-blue-500' :
                  'bg-gradient-to-b from-purple-400 to-indigo-500'
                }`} />

                {/* Exercise Header with Equipment Badge & Tools */}
                <div className="flex items-start justify-between gap-4 pl-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                        Exercise {exIdx + 1} • {exercise.muscleGroup}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                        isBarbell
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isDumbbell
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}>
                        {isBarbell ? '🏋️ Barbell (Total Load)' : isDumbbell ? '🪙 Dumbbell (Per Hand)' : `⚙️ ${eqType}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {exercise.exerciseName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPlateCalcState({
                        isOpen: true,
                        exerciseId: exercise.id,
                        equipmentType: eqType,
                        currentWeight: exercise.sets[0]?.weightKg || (isBarbell ? 60 : 20),
                        title: `${exercise.exerciseName} • ${isBarbell ? 'Plate Calculator' : 'Dumbbell Picker'}`
                      })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all pressable shadow-sm"
                      title="Open Plate & Weight Calculator"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Calc Load</span>
                    </button>
                    
                    <button
                      onClick={() => removeExerciseFromWorkout(exercise.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sets Table Header */}
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 text-center items-center">
                  <span className="col-span-2 text-left">Set</span>
                  <span className="col-span-2 text-slate-500">Previous</span>
                  <button
                    type="button"
                    onClick={() => setPlateCalcState({
                      isOpen: true,
                      exerciseId: exercise.id,
                      equipmentType: eqType,
                      currentWeight: exercise.sets[0]?.weightKg || (isBarbell ? 60 : 20),
                      title: `${exercise.exerciseName} • Load Calculator`
                    })}
                    className="col-span-3 text-emerald-400 font-bold hover:underline flex items-center justify-center gap-1 cursor-pointer"
                    title="Click to calculate plates or pick dumbbell"
                  >
                    <span>{isDumbbell ? 'kg (DB)' : 'kg (tot)'}</span>
                    <span className="text-[10px]">⚖️</span>
                  </button>
                  <span className="col-span-2">Reps</span>
                  <span className="col-span-2">Done</span>
                  <span className="col-span-1 text-slate-600">Del</span>
                </div>

                {/* Set Rows with Smart Sequential Working Set Numbering */}
                <div className="space-y-2.5">
                  {(() => {
                    let workingSetIndex = 0;
                    return exercise.sets.map((set) => {
                      let normalWorkingNumber = 0;
                      if (set.type === 'normal') {
                        workingSetIndex++;
                        normalWorkingNumber = workingSetIndex;
                      }

                      return (
                        <div
                          key={set.id}
                          className={`grid grid-cols-12 gap-1.5 sm:gap-2 items-center p-2 rounded-2xl transition-all group/row ${
                            set.completed
                              ? 'bg-emerald-950/30 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'bg-black/30 border border-white/5 hover:border-white/15'
                          }`}
                        >
                          {/* Set Type Pill Selector */}
                          <div className="col-span-2 flex items-center gap-1">
                            <select
                              value={set.type}
                              onChange={(e) => {
                                if (e.target.value === 'delete') {
                                  removeSet(exercise.id, set.id);
                                } else {
                                  updateSet(exercise.id, set.id, { type: e.target.value as SetType });
                                }
                              }}
                              className={`text-xs font-mono font-black px-1.5 py-1.5 rounded-xl cursor-pointer border w-full text-center transition-all ${
                                set.type === 'warmup' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                set.type === 'dropset' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                                set.type === 'failure' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                                'bg-[#121828] text-slate-200 border-white/10'
                              }`}
                              title="Change set type or delete set"
                            >
                              <option value="normal">{normalWorkingNumber || (workingSetIndex + 1)}</option>
                              <option value="warmup">W</option>
                              <option value="dropset">D</option>
                              <option value="failure">F</option>
                              <option value="delete">🗑️</option>
                            </select>
                          </div>

                        {/* Ghost Previous Performance */}
                        <div className="col-span-2 text-center text-xs font-mono text-slate-400 truncate">
                          {set.previousWeightKg !== undefined ? (
                            <button
                              type="button"
                              onClick={() => updateSet(exercise.id, set.id, { 
                                weightKg: set.previousWeightKg, 
                                reps: set.previousReps || 0 
                              })}
                              className="hover:text-emerald-400 transition-colors truncate block w-full text-[11px]"
                              title="Click to copy previous set weight and reps"
                            >
                              {set.previousWeightKg}k×{set.previousReps}
                            </button>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>

                        {/* Weight Input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg === 0 ? '' : set.weightKg}
                            onChange={(e) => updateSet(exercise.id, set.id, { weightKg: parseFloat(e.target.value) || 0 })}
                            placeholder={set.previousWeightKg !== undefined && set.previousWeightKg > 0 ? String(set.previousWeightKg) : '—'}
                            className="w-full py-2 px-1 text-center bg-[#0C1222] border border-white/10 rounded-xl text-white font-mono font-black text-sm focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all placeholder-slate-600"
                          />
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={set.reps === 0 ? '' : set.reps}
                            onChange={(e) => updateSet(exercise.id, set.id, { reps: parseInt(e.target.value, 10) || 0 })}
                            placeholder={set.previousReps !== undefined && set.previousReps > 0 ? String(set.previousReps) : '—'}
                            className="w-full py-2 px-1 text-center bg-[#0C1222] border border-white/10 rounded-xl text-white font-mono font-black text-sm focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all placeholder-slate-600"
                          />
                        </div>

                        {/* Completed Checkmark Toggle Button */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleSetToggle(exercise.id, set.id, set.completed)}
                            className={`w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex items-center justify-center transition-all pressable ${
                              set.completed
                                ? 'bg-emerald-500 text-slate-950 shadow-lg glow-volt'
                                : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10'
                            }`}
                            title={set.completed ? 'Mark incomplete' : 'Mark completed'}
                          >
                            <Check className={`w-4 h-4 ${set.completed ? 'stroke-[3.5]' : 'stroke-[2]'}`} />
                          </button>
                        </div>

                        {/* Delete Set Button */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeSet(exercise.id, set.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete this set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>

                {/* Set Actions: Add Set, Drop Set, Failure */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addSetToExercise(exercise.id, 'normal')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-all pressable border border-white/5"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      + Add Set
                    </button>
                    {exercise.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const lastSet = exercise.sets[exercise.sets.length - 1];
                          if (lastSet) removeSet(exercise.id, lastSet.id);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 text-xs font-mono transition-all pressable border border-white/5 flex items-center gap-1"
                        title="Delete last set"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Del Last</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addSetToExercise(exercise.id, 'dropset')}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-mono font-bold transition-colors pressable border border-purple-500/30"
                    >
                      + Drop Set
                    </button>
                    <button
                      type="button"
                      onClick={() => addSetToExercise(exercise.id, 'failure')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-mono font-bold transition-colors pressable border border-rose-500/30"
                    >
                      + Failure Set
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Add Another Movement / Exercise Button */}
        {activeWorkout.exercises.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setIsExercisePickerOpen(true);
              }}
              className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white font-black text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all duration-300 pressable shadow-[0_0_20px_rgba(16,185,129,0.15)] group"
            >
              <div className="w-6 h-6 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-emerald-300 stroke-[3]" />
              </div>
              <span>Add Next Movement</span>
            </button>
          </div>
        )}

        {/* Discard Workout Option */}
        <div className="pt-4 pb-2 text-center flex justify-center">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsDiscardModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 text-xs font-mono font-bold tracking-wider transition-all pressable flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Discard Session</span>
          </button>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelectExercise={(exId) => {
          addExerciseToWorkout(exId);
        }}
      />

      {/* Finish Workout Review Modal */}
      {isFinishing && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFinishing(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm forge-card rounded-3xl p-6 border border-emerald-500/40 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-lg glow-volt">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">Workout Complete!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5 font-mono">
              {formatTimer(activeWorkoutElapsedSeconds)} • {liveCompletedSets} sets • {Math.round(liveVolume).toLocaleString()} kg volume
            </p>

            {/* Rating */}
            <div className="mb-5 p-3 rounded-2xl bg-black/30 border border-white/5">
              <div className="text-xs font-bold text-slate-300 mb-2">Session Intensity / RPE</div>
              <div className="flex justify-center gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFinishRating(star)}
                    className="p-1.5 transition-transform pressable hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= finishRating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6 text-left">
              <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">Session Log Notes</label>
              <textarea
                value={finishNotes}
                onChange={(e) => setFinishNotes(e.target.value)}
                placeholder="Felt strong, hit progressive overload on 3rd set..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white text-xs focus:outline-none focus:border-emerald-400 resize-none font-sans"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setIsFinishing(false)}
                className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt pressable transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                Save & Log 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cybernetic Discard Workout Confirmation Modal */}
      {isDiscardModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDiscardModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0B0F1C] rounded-3xl p-6 border border-rose-500/40 text-center shadow-2xl relative overflow-hidden animate-scale-up"
          >
            {/* Ambient Red Glow */}
            <div className="w-40 h-40 bg-rose-500/15 rounded-full blur-[50px] absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4 shadow-lg glow-rose">
              <Trash2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">Discard Workout Session?</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6 font-mono leading-relaxed">
              Are you sure? All recorded exercises, sets, weights, and reps for this session will be permanently erased.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsDiscardModalOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-colors pressable"
              >
                Keep Training
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  discardWorkout();
                  setIsDiscardModalOpen(false);
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg glow-rose pressable transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plate Calculator & Dumbbell Weight Picker */}
      <PlateCalculatorModal
        isOpen={plateCalcState.isOpen}
        onClose={() => setPlateCalcState({ isOpen: false })}
        equipmentType={plateCalcState.equipmentType || 'Barbell'}
        initialWeight={plateCalcState.currentWeight || 60}
        title={plateCalcState.title}
        onApplyWeight={(wt) => {
          if (plateCalcState.exerciseId) {
            const targetEx = activeWorkout?.exercises.find(e => e.id === plateCalcState.exerciseId);
            if (targetEx) {
              if (plateCalcState.setId) {
                updateSet(plateCalcState.exerciseId, plateCalcState.setId, { weightKg: wt });
              } else {
                // Apply to first set and any uncompleted 0kg set
                targetEx.sets.forEach((s, idx) => {
                  if (idx === 0 || (!s.completed && s.weightKg === 0)) {
                    updateSet(targetEx.id, s.id, { weightKg: wt });
                  }
                });
              }
            }
          }
          setPlateCalcState({ isOpen: false });
        }}
      />
    </div>,
    document.body
  );
};
