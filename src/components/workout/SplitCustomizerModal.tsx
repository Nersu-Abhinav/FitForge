import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore, getBalancedExercisesForMuscles } from '@/store/useWorkoutStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { MuscleGroup, Equipment, Exercise } from '@/types';
import { triggerHaptic } from '@/utils/haptics';
import { 
  X, 
  Check, 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Moon, 
  Dumbbell, 
  Clock, 
  Info,
  Layers,
  ChevronRight,
  Zap,
  Wand2,
  Search,
  PlusCircle,
  Filter,
  Undo2,
  Flame,
  Shield,
  Target,
  Activity,
  Award,
  SlidersHorizontal
} from 'lucide-react';

const ALL_MUSCLES: MuscleGroup[] = [
  'Chest', 
  'Back', 
  'Shoulders', 
  'Biceps', 
  'Triceps', 
  'Quads', 
  'Hamstrings', 
  'Glutes', 
  'Calves', 
  'Abs/Core',
  'Cardio'
];

interface SplitCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDayName?: string;
}

export const SplitCustomizerModal: React.FC<SplitCustomizerModalProps> = ({
  isOpen,
  onClose,
  targetDayName = 'Monday'
}) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const { weeklySplit, updateSplitDay, resetSplitToDefault, exercises, addCustomExercise } = useWorkoutStore();

  const [activeDay, setActiveDay] = useState<string>(targetDayName);
  const currentDayData = weeklySplit.find(d => d.dayName === activeDay) || weeklySplit[0];

  const [title, setTitle] = useState(currentDayData?.title || 'Chest + Biceps');
  const [subtitle, setSubtitle] = useState(currentDayData?.subtitle || '');
  const [isRest, setIsRest] = useState(Boolean(currentDayData?.isRest));
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>(currentDayData?.selectedMuscles || ['Chest', 'Biceps']);
  const [exerciseIds, setExerciseIds] = useState<string[]>(currentDayData?.exerciseIds || []);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(currentDayData?.estimatedMinutes || 60);
  const [notes, setNotes] = useState<string>(currentDayData?.overviewNotes || '');
  
  // Feedback Toasts & Undo state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'undo'; undoData?: { id: string; index: number } } | null>(null);

  // Search & Filter state for adding movements
  const [movementSearchQuery, setMovementSearchQuery] = useState('');
  const [movementFilterMuscle, setMovementFilterMuscle] = useState<string>('Targeted');
  const [movementFilterEquipment, setMovementFilterEquipment] = useState<string>('All');
  
  // Custom Exercise Creation Modal state
  const [isCustomExerciseModalOpen, setIsCustomExerciseModalOpen] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExMuscle, setCustomExMuscle] = useState<MuscleGroup>('Chest');
  const [customExEquipment, setCustomExEquipment] = useState<Equipment>('Barbell');
  const [customExRepRange, setCustomExRepRange] = useState('8 - 12 reps');
  const [customExCues, setCustomExCues] = useState('');

  // Sync state ONLY when activeDay or isOpen changes
  useEffect(() => {
    if (targetDayName) {
      setActiveDay(targetDayName);
    }
  }, [targetDayName, isOpen]);

  useEffect(() => {
    const dayData = weeklySplit.find(d => d.dayName === activeDay);
    if (dayData) {
      setTitle(dayData.title);
      setSubtitle(dayData.subtitle || '');
      setIsRest(Boolean(dayData.isRest));
      setSelectedMuscles(dayData.selectedMuscles || []);
      setExerciseIds(dayData.exerciseIds || []);
      setEstimatedMinutes(dayData.estimatedMinutes || 60);
      setNotes(dayData.overviewNotes || '');
    }
  }, [activeDay, isOpen]);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'info' | 'undo' = 'success', undoData?: { id: string; index: number }) => {
    setToastMessage({ text, type, undoData });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  // Switch active day safely, committing current state to memory
  const handleSelectDay = (newDay: string) => {
    if (newDay === activeDay) return;
    triggerHaptic('light');

    // Commit current day changes first
    updateSplitDay(activeDay, {
      title,
      subtitle,
      isRest,
      selectedMuscles,
      exerciseIds,
      estimatedMinutes: isRest ? 0 : estimatedMinutes,
      overviewNotes: notes,
      tag: isRest ? 'Active Recovery' : `${selectedMuscles.join(' + ')} Overload`
    });

    setActiveDay(newDay);
  };

  // Toggle muscle selection WITHOUT wiping out existing customized exercises
  const handleToggleMuscle = (muscle: MuscleGroup) => {
    triggerHaptic('light');
    let next: MuscleGroup[];
    if (selectedMuscles.includes(muscle)) {
      next = selectedMuscles.filter(m => m !== muscle);
    } else {
      next = [...selectedMuscles, muscle];
    }
    setSelectedMuscles(next);

    // Auto-update title if not custom
    let autoTitle = title;
    let autoSub = subtitle;
    if (next.length > 0) {
      autoTitle = next.join(' + ');
      autoSub = `${autoTitle} Hypertrophy & Strength Focus`;
      setTitle(autoTitle);
      setSubtitle(autoSub);
    } else {
      autoTitle = 'Custom Training';
      autoSub = 'Targeted Training Session';
      setTitle(autoTitle);
      setSubtitle(autoSub);
    }

    // If currently empty, auto-populate; otherwise PRESERVE existing exercises!
    let nextExercises = exerciseIds;
    if (exerciseIds.length === 0 && next.length > 0) {
      nextExercises = getBalancedExercisesForMuscles(next, exercises, 6);
      setExerciseIds(nextExercises);
    }

    updateSplitDay(activeDay, {
      title: autoTitle,
      subtitle: autoSub,
      selectedMuscles: next,
      exerciseIds: nextExercises
    });
  };

  // Explicit Auto-Balance trigger
  const handleAutoBalance = () => {
    triggerHaptic('medium');
    if (selectedMuscles.length === 0) {
      showToast('Select at least one muscle group first!', 'info');
      return;
    }
    const balanced = getBalancedExercisesForMuscles(selectedMuscles, exercises, 6);
    setExerciseIds(balanced);
    updateSplitDay(activeDay, { exerciseIds: balanced });
    showToast(`Balanced 6 movements for ${selectedMuscles.join(' + ')}!`, 'success');
  };

  const handleToggleRest = () => {
    triggerHaptic('medium');
    const nextRest = !isRest;
    setIsRest(nextRest);
    if (nextRest) {
      const restTitle = 'Rest & Active Recovery';
      const restSub = 'Systemic Recovery & Joint Health';
      setTitle(restTitle);
      setSubtitle(restSub);
      setSelectedMuscles([]);
      setExerciseIds([]);
      setEstimatedMinutes(0);
      updateSplitDay(activeDay, {
        isRest: true,
        title: restTitle,
        subtitle: restSub,
        selectedMuscles: [],
        exerciseIds: [],
        estimatedMinutes: 0
      });
      showToast(`${activeDay} set as Rest Day`, 'info');
    } else {
      const defaultMuscles: MuscleGroup[] = ['Chest', 'Biceps'];
      const defaultTitle = 'Chest + Biceps';
      const defaultSub = 'Chest & Bicep Hypertrophy Focus';
      setTitle(defaultTitle);
      setSubtitle(defaultSub);
      setSelectedMuscles(defaultMuscles);
      setEstimatedMinutes(60);
      const suggested = getBalancedExercisesForMuscles(defaultMuscles, exercises, 6);
      setExerciseIds(suggested);
      updateSplitDay(activeDay, {
        isRest: false,
        title: defaultTitle,
        subtitle: defaultSub,
        selectedMuscles: defaultMuscles,
        estimatedMinutes: 60,
        exerciseIds: suggested
      });
      showToast(`${activeDay} activated for training!`, 'success');
    }
  };

  const handleAddExercise = (exId: string) => {
    triggerHaptic('light');
    if (!exerciseIds.includes(exId)) {
      const updated = [...exerciseIds, exId];
      setExerciseIds(updated);
      updateSplitDay(activeDay, { exerciseIds: updated });
      const exObj = exercises.find(e => e.id === exId);
      showToast(`Added '${exObj?.name || 'Exercise'}'`, 'success');
    }
  };

  const handleRemoveExercise = (exId: string) => {
    triggerHaptic('light');
    const index = exerciseIds.indexOf(exId);
    const exObj = exercises.find(e => e.id === exId);
    const updated = exerciseIds.filter(id => id !== exId);
    setExerciseIds(updated);
    updateSplitDay(activeDay, { exerciseIds: updated });
    
    showToast(`Removed '${exObj?.name || 'Movement'}'`, 'undo', { id: exId, index });
  };

  const handleUndoDelete = () => {
    if (!toastMessage?.undoData) return;
    triggerHaptic('medium');
    const { id, index } = toastMessage.undoData;
    const restored = [...exerciseIds];
    restored.splice(Math.min(index, restored.length), 0, id);
    setExerciseIds(restored);
    updateSplitDay(activeDay, { exerciseIds: restored });
    setToastMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    updateSplitDay(activeDay, {
      title,
      subtitle,
      isRest,
      selectedMuscles,
      exerciseIds,
      estimatedMinutes: isRest ? 0 : estimatedMinutes,
      overviewNotes: notes,
      tag: isRest ? 'Active Recovery' : `${selectedMuscles.join(' + ')} Overload`
    });

    showToast(`${activeDay}'s Split Saved!`, 'success');
  };

  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExName.trim()) return;
    triggerHaptic('success');

    const created = await addCustomExercise({
      name: customExName.trim(),
      category: 'Custom',
      muscleGroup: customExMuscle,
      secondaryMuscles: [],
      equipment: customExEquipment,
      difficulty: 'Intermediate',
      recommendedRepRange: customExRepRange || '8 - 12 reps',
      instructions: [
        customExCues || 'Perform with strict control, full range of motion, and focused tempo.'
      ],
      formCues: [
        customExCues ? customExCues : 'Full stretch and contraction',
        'Control the eccentric phase'
      ],
      commonMistakes: ['Rushing the movement', 'Using excessive momentum']
    });

    if (created && created.id) {
      const nextIds = [...exerciseIds, created.id];
      setExerciseIds(nextIds);
      updateSplitDay(activeDay, { exerciseIds: nextIds });
      setIsCustomExerciseModalOpen(false);
      setCustomExName('');
      setCustomExCues('');
      showToast(`Created & Added '${created.name}'!`, 'success');
    }
  };

  // Filter available exercises based on search, equipment, and category tab
  const availableFilteredExercises = exercises.filter(ex => {
    // Search query match
    if (movementSearchQuery.trim()) {
      const q = movementSearchQuery.toLowerCase().trim();
      const matchName = ex.name.toLowerCase().includes(q);
      const matchMuscle = ex.muscleGroup.toLowerCase().includes(q);
      const matchEquip = ex.equipment.toLowerCase().includes(q);
      const matchCategory = ex.category?.toLowerCase().includes(q);
      if (!matchName && !matchMuscle && !matchEquip && !matchCategory) return false;
    }

    // Equipment filter match
    if (movementFilterEquipment !== 'All' && ex.equipment !== movementFilterEquipment) {
      return false;
    }

    // Muscle category match
    if (movementFilterMuscle === 'Targeted') {
      return selectedMuscles.length === 0 || selectedMuscles.includes(ex.muscleGroup);
    }
    if (movementFilterMuscle === 'All') {
      return true;
    }
    if (movementFilterMuscle === 'Custom') {
      return Boolean(ex.isCustom);
    }
    return ex.muscleGroup === movementFilterMuscle;
  });

  const getMuscleBadgeStyle = (muscle: MuscleGroup | string) => {
    switch (muscle) {
      case 'Chest': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Back': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Shoulders': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Biceps': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Triceps': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Quads': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Hamstrings': return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Glutes': return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
      case 'Calves': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Abs/Core': return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      case 'Cardio': return 'bg-red-500/15 text-red-300 border-red-500/30';
      default: return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0B0F19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up relative"
      >
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-[#0E1528] to-[#0A101C] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold glow-volt shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white tracking-tight">Custom Split Architect</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Custom Muscle Splits
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize any day's muscle combination & movements
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setCustomExMuscle(selectedMuscles[0] || 'Chest');
                setIsCustomExerciseModalOpen(true);
              }}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>+ Custom Exercise</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7-Day Selector Bar */}
        <div className="grid grid-cols-7 p-1.5 sm:p-2 gap-1 bg-[#080B13] border-b border-white/5 shrink-0">
          {weeklySplit.map((d) => {
            const isCurrent = d.dayName === activeDay;
            return (
              <button
                key={d.dayName}
                type="button"
                onClick={() => handleSelectDay(d.dayName)}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all text-center flex flex-col items-center ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 shadow-md glow-volt'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-[10px] uppercase font-black">{d.dayShort}</span>
                <span className="text-[9px] font-normal truncate max-w-full px-0.5">
                  {d.isRest ? 'Rest' : (d.selectedMuscles && d.selectedMuscles.length > 0 ? d.selectedMuscles[0] : d.title.split('+')[0].trim())}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Toast with Instant Undo */}
        {toastMessage && (
          <div className="p-2.5 bg-[#0F172A] border-b border-emerald-500/30 text-xs font-bold flex items-center justify-between px-4 animate-fade-in font-mono shadow-md">
            <div className="flex items-center gap-2 text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage.text}</span>
            </div>
            {toastMessage.undoData && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
          </div>
        )}

        {/* Main Customizer Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Day & Rest Toggle Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-black/40 border border-white/5">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Configuring Protocol:
              </span>
              <h4 className="text-xl font-black text-white">{activeDay}</h4>
            </div>

            <button
              type="button"
              onClick={handleToggleRest}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
                isRest
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                  : 'bg-black/40 text-slate-400 border-white/10 hover:text-white hover:border-teal-500/40'
              }`}
            >
              <Moon className="w-4 h-4" />
              {isRest ? '✓ Rest Day Active' : 'Set as Rest Day'}
            </button>
          </div>

          {isRest ? (
            /* Active Recovery Protocol Card */
            <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-950/40 via-[#0D1524] to-[#0A0E1A] border border-teal-500/40 space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold shadow-inner">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">
                      Recovery & Regeneration Day
                    </span>
                    <h4 className="text-lg font-black text-white">Systemic Recovery & Muscle Growth</h4>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  0 Training Load
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Muscles repair and nervous pathways regenerate during active rest. {activeDay} is set to reduce systemic fatigue and restore joint mobility.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                  <span className="text-base">🚶</span>
                  <div>
                    <div className="text-xs font-bold text-white">Zone 1 Movement</div>
                    <div className="text-[11px] text-slate-400">20-30 min gentle walk to stimulate blood flow</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                  <span className="text-base">💧</span>
                  <div>
                    <div className="text-xs font-bold text-white">Hydration & Electrolytes</div>
                    <div className="text-[11px] text-slate-400">Target 3.5L water with magnesium & sodium</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Target Muscle Multi-Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                    Targeted Muscle Groups ({selectedMuscles.length})
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Tap to combine any muscles
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {ALL_MUSCLES.map((muscle) => {
                    const isSelected = selectedMuscles.includes(muscle);
                    return (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => handleToggleMuscle(muscle)}
                        className={`p-2 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-between pressable ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                            : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="truncate">{muscle}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Custom Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    Routine Title / Split Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest + Biceps Hypertrophy"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    Est. Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 60)}
                    className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-mono font-bold text-sm text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 3. Programmed Exercises for this Day */}
              <div className="space-y-3.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-mono text-slate-200 font-bold">
                        Prescribed Movements ({exerciseIds.length})
                      </label>
                      {selectedMuscles.length > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {selectedMuscles.map(m => {
                            const count = exerciseIds.filter(id => exercises.find(e => e.id === id)?.muscleGroup === m).length;
                            return `${count} ${m}`;
                          }).join(' • ')}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Evenly distributed across your targeted split.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedMuscles.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoBalance}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title="Evenly balance movements across targeted muscle groups"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Auto-Balance ({selectedMuscles.length} Groups)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setCustomExMuscle(selectedMuscles[0] || 'Chest');
                        setIsCustomExerciseModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+ Custom</span>
                    </button>
                  </div>
                </div>

                {/* Current Selected Movements List */}
                {exerciseIds.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-black/40 border border-dashed border-white/10 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-mono">No exercises assigned yet for this routine.</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">Browse below to add movements or tap Auto-Balance.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exerciseIds.map((exId, idx) => {
                      const exObj = exercises.find(e => e.id === exId);
                      return (
                        <div 
                          key={`${exId}-${idx}`}
                          className="p-3 rounded-2xl bg-[#0E1424] border border-white/10 flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                                <span className="truncate">{exObj ? exObj.name : exId}</span>
                                {exObj && (
                                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold border ${getMuscleBadgeStyle(exObj.muscleGroup)}`}>
                                    {exObj.muscleGroup}
                                  </span>
                                )}
                                {exObj?.isCustom && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                    ✨ Custom
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {exObj?.equipment} • {exObj?.recommendedRepRange || '8 - 12 reps'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exId)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 ml-2"
                            title="Remove from routine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* EXPANDED MOVEMENT BROWSER: Filter Pills, Search, & Grid */}
                <div className="p-4 rounded-3xl bg-[#0D1526] border border-white/10 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Add Movements to Routine ({availableFilteredExercises.length} Available)
                      </span>
                    </div>

                    {/* Quick Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search exercise / equipment..."
                        value={movementSearchQuery}
                        onChange={(e) => setMovementSearchQuery(e.target.value)}
                        className="pl-8 pr-7 py-1.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-56 font-sans"
                      />
                      {movementSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setMovementSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Muscle Category Filter Ribbon */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
                    {['Targeted', 'All', 'Custom', ...ALL_MUSCLES].map((cat) => {
                      const isActive = movementFilterMuscle === cat;
                      const count = exercises.filter(ex => {
                        if (cat === 'Targeted') return selectedMuscles.length === 0 || selectedMuscles.includes(ex.muscleGroup);
                        if (cat === 'All') return true;
                        if (cat === 'Custom') return Boolean(ex.isCustom);
                        return ex.muscleGroup === cat;
                      }).length;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setMovementFilterMuscle(cat);
                          }}
                          className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm glow-volt'
                              : 'bg-black/40 text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{cat === 'Targeted' ? `🎯 Targeted (${selectedMuscles.join(', ') || 'All'})` : cat === 'Custom' ? '✨ Custom' : cat}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-white/10 text-slate-400'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Equipment Sub-Filter Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                    <span className="text-slate-500 text-[10px] flex items-center gap-1 shrink-0">
                      <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                      Equipment:
                    </span>
                    {['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell'].map((eq) => {
                      const isEqActive = movementFilterEquipment === eq;
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setMovementFilterEquipment(eq);
                          }}
                          className={`px-2 py-0.5 rounded-lg border transition-all ${
                            isEqActive
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                              : 'bg-black/30 text-slate-500 border-white/5 hover:text-slate-300'
                          }`}
                        >
                          {eq}
                        </button>
                      );
                    })}
                  </div>

                  {/* Available Exercises Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {availableFilteredExercises.length === 0 ? (
                      <div className="col-span-full p-6 text-center text-xs text-slate-400 font-mono space-y-2 bg-black/30 rounded-2xl border border-white/5">
                        <p>No available movements found for "{movementSearchQuery || movementFilterMuscle}".</p>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setCustomExMuscle(selectedMuscles[0] || 'Chest');
                            setIsCustomExerciseModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Create Custom Exercise</span>
                        </button>
                      </div>
                    ) : (
                      availableFilteredExercises.map((ex) => {
                        const isAlreadyInSplit = exerciseIds.includes(ex.id);
                        return (
                          <div
                            key={ex.id}
                            className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                              isAlreadyInSplit
                                ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                                : 'bg-black/40 border-white/5 hover:border-emerald-500/40 hover:bg-black/60'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {ex.name}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getMuscleBadgeStyle(ex.muscleGroup)}`}>
                                  {ex.muscleGroup}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/5">
                                  {ex.equipment}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {ex.recommendedRepRange || '8-12 reps'}
                                </span>
                              </div>
                            </div>

                            {isAlreadyInSplit ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(ex.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-colors shrink-0"
                                title="Click to remove"
                              >
                                <Check className="w-3 h-3" />
                                <span>Added</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddExercise(ex.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+ Add</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Notes */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 block font-bold">
                  Coach Notes / Focus Tips (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on deep stretch on dumbbell curls and strict form on deadlifts"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                resetSplitToDefault();
                showToast('All 7 days reset to defaults', 'info');
              }}
              className="py-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
              title="Reset all 7 days to standard defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset All Splits</span>
              <span className="sm:hidden">Reset</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 sm:px-5 rounded-xl bg-white/5 text-slate-300 text-xs font-bold hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="submit"
                className="py-3 px-5 sm:px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt pressable transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Save {activeDay}'s Split
              </button>
            </div>
          </div>

        </form>

        {/* INLINE CREATE CUSTOM EXERCISE MODAL */}
        {isCustomExerciseModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-cyan-500/40 p-5 sm:p-6 space-y-5 text-left shadow-2xl relative animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Create Custom Exercise</h4>
                    <span className="text-[10px] font-mono text-cyan-400">Save to Cloud & Add to Split</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomExerciseModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomExercise} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 block font-bold">Exercise Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incline Hammer Strength Press"
                    value={customExName}
                    onChange={(e) => setCustomExName(e.target.value)}
                    className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-300 block font-bold">Primary Muscle</label>
                    <select
                      value={customExMuscle}
                      onChange={(e) => setCustomExMuscle(e.target.value as MuscleGroup)}
                      className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    >
                      {ALL_MUSCLES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-300 block font-bold">Equipment</label>
                    <select
                      value={customExEquipment}
                      onChange={(e) => setCustomExEquipment(e.target.value as Equipment)}
                      className="w-full p-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    >
                      {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Bands', 'Cardio Machine'].map(eq => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 block font-bold">Recommended Rep Range</label>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    {['3 - 5 reps', '6 - 8 reps', '8 - 12 reps', '10 - 15 reps', '15 - 20 reps', 'To Failure'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCustomExRepRange(r)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                          customExRepRange === r 
                            ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50 font-bold' 
                            : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="or type custom range (e.g. 8 - 12 reps)"
                    value={customExRepRange}
                    onChange={(e) => setCustomExRepRange(e.target.value)}
                    className="w-full p-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 block font-bold">Form Cue / Focus Note (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Squeeze chest for 1 second at top contraction"
                    value={customExCues}
                    onChange={(e) => setCustomExCues(e.target.value)}
                    className="w-full p-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-sans placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomExerciseModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    Save & Add to Split
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
