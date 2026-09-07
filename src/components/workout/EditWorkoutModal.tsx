import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Workout, WorkoutExercise, WorkoutSet, SetType } from '@/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { ExercisePickerModal } from './ExercisePickerModal';
import { 
  X, 
  Trash2, 
  Plus, 
  Save, 
  Dumbbell, 
  Clock, 
  Calendar, 
  Star, 
  AlertTriangle,
  Flame,
  Check,
  Edit3
} from 'lucide-react';

interface EditWorkoutModalProps {
  isOpen: boolean;
  workout: Workout | null;
  onClose: () => void;
}

export const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({
  isOpen,
  workout,
  onClose
}) => {
  const { updateHistoricalWorkout, deleteHistoricalWorkout, getExerciseById } = useWorkoutStore();
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });

  const [editableWorkout, setEditableWorkout] = useState<Workout | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Clone workout into local state when modal opens
  useEffect(() => {
    if (workout) {
      setEditableWorkout(JSON.parse(JSON.stringify(workout)));
      setIsConfirmingDelete(false);
    }
  }, [workout]);

  if (!isOpen || !editableWorkout) return null;

  // Compute live totals
  let computedVolume = 0;
  let computedSets = 0;
  let computedReps = 0;

  editableWorkout.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      if (s.completed) {
        computedSets++;
        computedReps += Number(s.reps) || 0;
        computedVolume += (Number(s.weightKg) || 0) * (Number(s.reps) || 0);
      }
    });
  });

  // Metadata update handlers
  const handleNameChange = (name: string) => {
    setEditableWorkout((prev) => prev ? { ...prev, name } : null);
  };

  const handleDateChange = (date: string) => {
    setEditableWorkout((prev) => prev ? { ...prev, date } : null);
  };

  const handleDurationChange = (minutes: number) => {
    setEditableWorkout((prev) => prev ? { ...prev, durationSeconds: Math.max(0, minutes * 60) } : null);
  };

  const handleRatingChange = (rating: number) => {
    setEditableWorkout((prev) => prev ? { ...prev, rating } : null);
  };

  const handleNotesChange = (notes: string) => {
    setEditableWorkout((prev) => prev ? { ...prev, notes } : null);
  };

  // Exercise & Set update handlers
  const handleAddExercise = (exerciseId: string) => {
    const exerciseInfo = getExerciseById(exerciseId);
    if (!exerciseInfo) return;

    const newExercise: WorkoutExercise = {
      id: `we-edit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      exerciseId,
      exerciseName: exerciseInfo.name,
      muscleGroup: exerciseInfo.muscleGroup,
      order: (editableWorkout.exercises.length || 0) + 1,
      sets: [
        {
          id: `set-edit-${Date.now()}-1`,
          setNumber: 1,
          type: 'normal',
          weightKg: 0,
          reps: 10,
          completed: true
        }
      ]
    };

    setEditableWorkout((prev) => prev ? {
      ...prev,
      exercises: [...prev.exercises, newExercise]
    } : null);
    setIsExercisePickerOpen(false);
  };

  const handleRemoveExercise = (workoutExerciseId: string) => {
    setEditableWorkout((prev) => prev ? {
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== workoutExerciseId)
    } : null);
  };

  const handleExerciseNotesChange = (workoutExerciseId: string, notes: string) => {
    setEditableWorkout((prev) => prev ? {
      ...prev,
      exercises: prev.exercises.map((ex) => ex.id === workoutExerciseId ? { ...ex, notes } : ex)
    } : null);
  };

  const handleAddSet = (workoutExerciseId: string) => {
    setEditableWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            id: `set-edit-${Date.now()}-${ex.sets.length + 1}`,
            setNumber: ex.sets.length + 1,
            type: lastSet ? lastSet.type : 'normal',
            weightKg: lastSet ? lastSet.weightKg : 0,
            reps: lastSet ? lastSet.reps : 10,
            rpe: lastSet ? lastSet.rpe : undefined,
            completed: true
          };
          return {
            ...ex,
            sets: [...ex.sets, newSet]
          };
        })
      };
    });
  };

  const handleRemoveSet = (workoutExerciseId: string, setId: string) => {
    setEditableWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const filteredSets = ex.sets.filter((s) => s.id !== setId);
          return {
            ...ex,
            sets: filteredSets.map((s, idx) => ({ ...s, setNumber: idx + 1 }))
          };
        })
      };
    });
  };

  const handleUpdateSet = (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setEditableWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => s.id === setId ? { ...s, ...updates } : s)
          };
        })
      };
    });
  };

  // Save Workout
  const handleSave = async () => {
    if (!editableWorkout) return;
    setIsSaving(true);
    try {
      await updateHistoricalWorkout(editableWorkout);
      onClose();
    } catch (err) {
      console.error('Failed to update historical workout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Workout
  const handleDelete = async () => {
    if (!editableWorkout) return;
    try {
      await deleteHistoricalWorkout(editableWorkout.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete historical workout:', err);
    }
  };

  const setTypeOptions: { type: SetType; label: string; color: string }[] = [
    { type: 'normal', label: 'Normal', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { type: 'warmup', label: 'Warmup', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { type: 'dropset', label: 'Drop Set', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { type: 'failure', label: 'Failure', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
  ];

  if (!isOpen) return null;

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-2 sm:p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] bg-[#0A0E17] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up my-auto"
      >
        
        {/* Top Header */}
        <header className="px-5 py-4 border-b border-white/10 bg-[#0E1424] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Workout Editor
              </span>
              <h2 className="text-base font-black text-white">Edit Historical Session</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Workout Name */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                Workout Session Name
              </label>
              <input
                type="text"
                value={editableWorkout.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Chest & Biceps Overload"
                className="w-full px-4 py-2.5 bg-[#141C2E] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Date
              </label>
              <input
                type="date"
                value={editableWorkout.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#141C2E] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Duration Minutes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Duration (Min)
              </label>
              <input
                type="number"
                min="1"
                value={Math.round((editableWorkout.durationSeconds || 0) / 60)}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-[#141C2E] border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                Rating
              </label>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[#141C2E] border border-white/10 rounded-xl h-[38px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        (editableWorkout.rating || 0) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Notes */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                Session Notes & Feedback
              </label>
              <textarea
                value={editableWorkout.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="How did this session feel? Note energy, fatigue, or form cues..."
                rows={2}
                className="w-full px-3 py-2 bg-[#141C2E] border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* Live Dynamic Stats Summary */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#111728] border border-white/5 font-mono text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Volume</span>
              <div className="text-sm font-black text-emerald-400">{Math.round(computedVolume).toLocaleString()} kg</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Completed Sets</span>
              <div className="text-sm font-black text-white">{computedSets} Sets</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Reps</span>
              <div className="text-sm font-black text-cyan-400">{computedReps} Reps</div>
            </div>
          </div>

          {/* Exercises & Sets Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                Exercises in Session ({editableWorkout.exercises.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsExercisePickerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Movement
              </button>
            </div>

            {editableWorkout.exercises.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#141C2E] border border-dashed border-white/10 text-slate-500 text-xs font-mono">
                No movements currently in this session. Click "Add Movement" to append exercises.
              </div>
            ) : (
              editableWorkout.exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="rounded-2xl bg-[#12192A] border border-white/10 overflow-hidden shadow-sm"
                >
                  {/* Exercise Card Header */}
                  <div className="px-4 py-3 bg-[#182138] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center">
                        {exIdx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-white">{ex.exerciseName}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{ex.muscleGroup}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove exercise from workout"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sets Table */}
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-1.5 px-2 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-3">Type</div>
                      <div className="col-span-3 text-center">Weight (kg)</div>
                      <div className="col-span-2 text-center">Reps</div>
                      <div className="col-span-2 text-center">Done</div>
                      <div className="col-span-1 text-center">Del</div>
                    </div>

                    {ex.sets.map((set, setIdx) => (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl border transition-all ${
                          set.completed
                            ? 'bg-[#162035] border-white/5'
                            : 'bg-black/30 border-dashed border-white/10 opacity-70'
                        }`}
                      >
                        {/* Set Index */}
                        <div className="col-span-1 text-center font-mono text-xs font-bold text-slate-400">
                          {setIdx + 1}
                        </div>

                        {/* Set Type Dropdown */}
                        <div className="col-span-3">
                          <select
                            value={set.type || 'normal'}
                            onChange={(e) => handleUpdateSet(ex.id, set.id, { type: e.target.value as SetType })}
                            className="w-full px-1.5 py-1 rounded-lg bg-[#0E1424] border border-white/10 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="normal">Normal</option>
                            <option value="warmup">Warmup</option>
                            <option value="dropset">Drop Set</option>
                            <option value="failure">Failure</option>
                          </select>
                        </div>

                        {/* Weight (kg) */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={set.weightKg}
                            onChange={(e) => handleUpdateSet(ex.id, set.id, { weightKg: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 rounded-lg bg-[#0E1424] border border-white/10 text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Reps */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            value={set.reps}
                            onChange={(e) => handleUpdateSet(ex.id, set.id, { reps: parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-2 py-1 rounded-lg bg-[#0E1424] border border-white/10 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Completed Toggle */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateSet(ex.id, set.id, { completed: !set.completed })}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              set.completed
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-500 hover:text-white border border-white/10'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>

                        {/* Delete Set */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Set Button for Exercise */}
                    <button
                      type="button"
                      onClick={() => handleAddSet(ex.id)}
                      className="w-full py-1.5 rounded-xl border border-dashed border-white/10 text-[11px] font-mono text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" />
                      Add Set
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer Controls */}
        <footer className="px-5 py-3.5 border-t border-white/10 bg-[#0E1424] shrink-0">
          {isConfirmingDelete ? (
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in w-full">
              <div className="flex items-center gap-2.5 text-xs text-rose-300 font-mono font-bold">
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span>Delete this session permanently?</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/10 pressable"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 pressable"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 pressable"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Session</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/5 pressable"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg glow-volt disabled:opacity-50 pressable"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </footer>

        {/* Exercise Picker Modal for adding new movements */}
        {isExercisePickerOpen && (
          <ExercisePickerModal
            isOpen={isExercisePickerOpen}
            onClose={() => setIsExercisePickerOpen(false)}
            onSelectExercise={(exerciseId) => handleAddExercise(exerciseId)}
          />
        )}

      </div>
    </div>,
    document.body
  );
};
