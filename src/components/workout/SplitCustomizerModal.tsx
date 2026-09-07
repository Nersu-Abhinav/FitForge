import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore, getBalancedExercisesForMuscles } from '@/store/useWorkoutStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { MuscleGroup } from '@/types';
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
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Wand2
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
  'Abs/Core'
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
  const { weeklySplit, updateSplitDay, resetSplitToDefault, exercises } = useWorkoutStore();

  const [activeDay, setActiveDay] = useState<string>(targetDayName);
  const currentDayData = weeklySplit.find(d => d.dayName === activeDay) || weeklySplit[0];

  const [title, setTitle] = useState(currentDayData?.title || 'Chest + Biceps');
  const [subtitle, setSubtitle] = useState(currentDayData?.subtitle || '');
  const [isRest, setIsRest] = useState(Boolean(currentDayData?.isRest));
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>(currentDayData?.selectedMuscles || ['Chest', 'Biceps']);
  const [exerciseIds, setExerciseIds] = useState<string[]>(currentDayData?.exerciseIds || []);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(currentDayData?.estimatedMinutes || 60);
  const [notes, setNotes] = useState<string>(currentDayData?.overviewNotes || '');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync state when activeDay or modal opens
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
  }, [activeDay, weeklySplit]);

  if (!isOpen) return null;

  // Toggle muscle selection
  const handleToggleMuscle = (muscle: MuscleGroup) => {
    let next: MuscleGroup[];
    if (selectedMuscles.includes(muscle)) {
      next = selectedMuscles.filter(m => m !== muscle);
    } else {
      next = [...selectedMuscles, muscle];
    }
    setSelectedMuscles(next);

    // Auto-update title if not custom
    if (next.length > 0) {
      const autoTitle = next.join(' + ');
      setTitle(autoTitle);
      setSubtitle(`${autoTitle} Hypertrophy & Strength Focus`);
      
      // Auto-suggest evenly balanced exercises across all chosen muscle groups
      const suggested = getBalancedExercisesForMuscles(next, exercises, 6);
      
      if (suggested.length > 0) {
        setExerciseIds(suggested);
      }
    } else {
      setTitle('Custom Training');
      setSubtitle('Targeted Training Session');
    }
  };

  const handleAutoBalance = () => {
    if (selectedMuscles.length === 0) return;
    const balanced = getBalancedExercisesForMuscles(selectedMuscles, exercises, 6);
    setExerciseIds(balanced);
    setSaveToast(`Auto-balanced for ${selectedMuscles.join(' + ')}!`);
    setTimeout(() => setSaveToast(null), 1400);
  };

  const handleToggleRest = () => {
    const nextRest = !isRest;
    setIsRest(nextRest);
    if (nextRest) {
      setTitle('Rest & Active Recovery');
      setSubtitle('Systemic Recovery & Joint Health');
      setSelectedMuscles([]);
      setExerciseIds([]);
      setEstimatedMinutes(0);
    } else {
      const defaultMuscles: MuscleGroup[] = ['Chest', 'Biceps'];
      setTitle('Chest + Biceps');
      setSubtitle('Chest & Bicep Hypertrophy Focus');
      setSelectedMuscles(defaultMuscles);
      setEstimatedMinutes(60);
      const suggested = getBalancedExercisesForMuscles(defaultMuscles, exercises, 6);
      setExerciseIds(suggested);
    }
  };

  const handleAddExercise = (exId: string) => {
    if (!exerciseIds.includes(exId)) {
      setExerciseIds([...exerciseIds, exId]);
    }
  };

  const handleRemoveExercise = (exId: string) => {
    setExerciseIds(exerciseIds.filter(id => id !== exId));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
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

    setSaveToast(`${activeDay} updated to: ${title}!`);
    setTimeout(() => {
      setSaveToast(null);
    }, 1500);
  };

  const availableExercisesForMuscles = exercises.filter(
    ex => selectedMuscles.length === 0 || selectedMuscles.includes(ex.muscleGroup)
  );

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0B0F19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
      >
        
        {/* Top Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#0E1528] to-[#0A101C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold glow-volt">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Custom Split Architect</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Custom Muscle Splits
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize any day's muscle combination (e.g. Chest + Biceps, Back + Triceps)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Selector Bar */}
        <div className="grid grid-cols-7 p-2 gap-1 bg-[#080B13] border-b border-white/5">
          {weeklySplit.map((d) => {
            const isCurrent = d.dayName === activeDay;
            return (
              <button
                key={d.dayName}
                type="button"
                onClick={() => setActiveDay(d.dayName)}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all text-center flex flex-col items-center ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 shadow-md glow-volt'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-[10px] uppercase">{d.dayShort}</span>
                <span className="text-[9px] font-normal truncate max-w-full px-0.5">
                  {d.isRest ? 'Rest' : d.title.split('+')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Save Toast */}
        {saveToast && (
          <div className="p-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in font-mono">
            <Check className="w-4 h-4 text-emerald-400" />
            {saveToast}
          </div>
        )}

        {/* Main Customizer Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Day & Rest Toggle Header */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Configuring Day:
              </span>
              <h4 className="text-xl font-black text-white">{activeDay}</h4>
            </div>

            <button
              type="button"
              onClick={handleToggleRest}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
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
            /* Rich Active Recovery & Regeneration Protocol Card */
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
                Muscles grow and central nervous system (CNS) pathways repair during rest. {activeDay} is configured to restore glycogen reserves and reduce systemic fatigue.
              </p>

              {/* Protocol Checklist */}
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
                    <div className="text-xs font-bold text-white">Electrolytes & Water</div>
                    <div className="text-[11px] text-slate-400">Drink 3.5L+ to maintain cellular hydration</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                  <span className="text-base">🥩</span>
                  <div>
                    <div className="text-xs font-bold text-white">High Protein Intake</div>
                    <div className="text-[11px] text-slate-400">Maintain target protein to fuel muscle repair</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                  <span className="text-base">😴</span>
                  <div>
                    <div className="text-xs font-bold text-white">Sleep & Deep Rest</div>
                    <div className="text-[11px] text-slate-400">Target 8+ hours of quality REM and deep sleep</div>
                  </div>
                </div>
              </div>

              {/* Recovery Coach Note Input */}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-mono text-teal-400 font-bold block">
                  Recovery Day Plan & Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Light stretching, sauna session, and early bedtime"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-black/60 border border-teal-500/30 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400 font-sans"
                />
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleToggleRest}
                  className="text-xs text-teal-300 hover:text-white underline font-mono"
                >
                  Want to train on {activeDay} instead? Switch to Training Day
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Interactive Muscle Group Multi-Selector Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 font-bold">
                    Select Target Muscle Groups:
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {selectedMuscles.length} Selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ALL_MUSCLES.map((muscle) => {
                    const isSelected = selectedMuscles.includes(muscle);
                    return (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => handleToggleMuscle(muscle)}
                        className={`p-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm glow-volt'
                            : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>{muscle}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Custom Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-mono text-slate-300 block">
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
                  <label className="text-xs font-mono text-slate-300 block">
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
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-mono text-slate-300 font-bold">
                        Prescribed Exercises ({exerciseIds.length})
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
                      Evenly distributed across all targeted muscle groups.
                    </span>
                  </div>

                  {selectedMuscles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                      title="Evenly distribute exercises across all selected muscle groups"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Auto-Balance ({selectedMuscles.length} Groups)</span>
                    </button>
                  )}
                </div>

                {/* Current Selected Movements */}
                <div className="space-y-2">
                  {exerciseIds.map((exId, idx) => {
                    const exObj = exercises.find(e => e.id === exId);
                    return (
                      <div 
                        key={exId}
                        className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{exObj ? exObj.name : exId}</span>
                              {exObj && (
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
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
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {exObj?.equipment} • {exObj?.recommendedRepRange || '8 - 12 reps'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(exId)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove from routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add from Available Movements */}
                <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10 space-y-2">
                  <span className="text-[11px] font-mono text-slate-300 font-bold block">
                    + Add movements for selected muscles ({selectedMuscles.join(', ') || 'All'}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableExercisesForMuscles
                      .filter(ex => !exerciseIds.includes(ex.id))
                      .map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleAddExercise(ex.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>{ex.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({ex.muscleGroup})</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* 4. Notes */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 block">
                  Coach Notes / Focus Tips (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on deep stretch on incline dumbbell curls and heavy bench press"
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
              onClick={resetSplitToDefault}
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
              title="Reset all 7 days to standard defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Splits
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-white/5 text-slate-300 text-xs font-bold hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-volt pressable transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Save {activeDay}'s Split
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
