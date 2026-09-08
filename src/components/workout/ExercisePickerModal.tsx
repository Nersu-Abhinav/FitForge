import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Exercise, MuscleGroup, Equipment } from '@/types';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { 
  Search, X, Plus, Info, Dumbbell, Filter, Check, ChevronRight, 
  Flame, Zap, Shield, Target, Activity, Sparkles, Award
} from 'lucide-react';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { CreateCustomExerciseModal } from './CreateCustomExerciseModal';

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
}

interface MuscleFilterOption {
  label: MuscleGroup | 'All';
  displayName: string;
  icon: string;
  color: string;
}

const MUSCLE_FILTER_OPTIONS: MuscleFilterOption[] = [
  { label: 'All', displayName: 'All Muscles', icon: '✨', color: 'from-emerald-500 to-teal-600' },
  { label: 'Chest', displayName: 'Chest', icon: '🔥', color: 'from-rose-500 to-red-600' },
  { label: 'Back', displayName: 'Back', icon: '⚡', color: 'from-blue-500 to-indigo-600' },
  { label: 'Shoulders', displayName: 'Shoulders', icon: '🛡️', color: 'from-amber-500 to-orange-600' },
  { label: 'Biceps', displayName: 'Biceps', icon: '💪', color: 'from-purple-500 to-violet-600' },
  { label: 'Triceps', displayName: 'Triceps', icon: '💥', color: 'from-fuchsia-500 to-pink-600' },
  { label: 'Quads', displayName: 'Quads', icon: '🦵', color: 'from-emerald-500 to-green-600' },
  { label: 'Hamstrings', displayName: 'Hamstrings', icon: '🎯', color: 'from-cyan-500 to-blue-600' },
  { label: 'Glutes', displayName: 'Glutes', icon: '🍑', color: 'from-pink-500 to-rose-600' },
  { label: 'Calves', displayName: 'Calves', icon: '⚡', color: 'from-teal-500 to-emerald-600' },
  { label: 'Abs/Core', displayName: 'Abs / Core', icon: '🧱', color: 'from-yellow-500 to-amber-600' },
  { label: 'Full Body', displayName: 'Full Body', icon: '⚔️', color: 'from-violet-500 to-purple-700' },
  { label: 'Cardio', displayName: 'Cardio', icon: '🏃', color: 'from-emerald-400 to-teal-500' }
];

const EQUIPMENT_FILTER_OPTIONS: { label: Equipment | 'All'; icon: string }[] = [
  { label: 'All', icon: '✨ All' },
  { label: 'Barbell', icon: '🏋️ Barbell' },
  { label: 'Dumbbell', icon: '🪙 Dumbbell' },
  { label: 'Cable', icon: '⚡ Cable' },
  { label: 'Machine', icon: '⚙️ Machine' },
  { label: 'Bodyweight', icon: '🤸 Bodyweight' },
  { label: 'Kettlebell', icon: '🔔 Kettlebell' },
  { label: 'Cardio Machine', icon: '🏃 Cardio' }
];

export const ExercisePickerModal: React.FC<ExercisePickerProps> = ({
  isOpen,
  onClose,
  onSelectExercise
}) => {
  const { exercises, addCustomExercise } = useWorkoutStore();
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | 'All'>('All');
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
  // Custom exercise modal state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  if (!isOpen) return null;

  const filteredExercises = exercises.filter((ex) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      ex.name.toLowerCase().includes(query) ||
      ex.category.toLowerCase().includes(query) ||
      ex.muscleGroup.toLowerCase().includes(query) ||
      ex.secondaryMuscles.some(m => m.toLowerCase().includes(query)) ||
      ex.equipment.toLowerCase().includes(query);

    const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
    const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment;

    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-0 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] bg-[#0A0E1A] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />

        {/* 1. Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0E1424]/80 backdrop-blur-md shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Exercise Library</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {exercises.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-400">Select an exercise to add to your workout session</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingCustom(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all pressable shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Custom</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Search Bar */}
        <div className="p-3 sm:px-4 border-b border-white/5 bg-[#090D18] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise (e.g., Bench Press, Squat, Cable, Lats)..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#121A2C] rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Muscle Group Horizontal Filter Pills */}
        <div 
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-white/10 bg-[#0A0F1E] shrink-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MUSCLE_FILTER_OPTIONS.map((muscle) => {
            const isSelected = selectedMuscle === muscle.label;
            return (
              <button
                key={muscle.label}
                type="button"
                onClick={() => setSelectedMuscle(muscle.label)}
                className={`h-8 px-3 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all pressable shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/25 font-black scale-[1.02]'
                    : 'bg-[#141C2E] text-slate-300 border-white/10 hover:border-emerald-500/40 hover:text-white hover:bg-[#1C2740]'
                }`}
              >
                <span className="text-xs">{muscle.icon}</span>
                <span className="leading-none">{muscle.displayName}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Equipment Filter Chips */}
        <div 
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#080B15] shrink-0 text-[11px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <span className="text-slate-500 font-mono text-[10px] uppercase font-bold pl-1 pr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Equipment:
          </span>
          {EQUIPMENT_FILTER_OPTIONS.map((eq) => {
            const isSelected = selectedEquipment === eq.label;
            return (
              <button
                key={eq.label}
                type="button"
                onClick={() => setSelectedEquipment(eq.label)}
                className={`py-1 px-2.5 rounded-lg font-mono font-semibold transition-all pressable whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                {eq.icon}
              </button>
            );
          })}
        </div>

        {/* 5. Exercise List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredExercises.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-500 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-300">No exercises found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No movements match your search query or selected muscle & equipment filters.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMuscle('All');
                    setSelectedEquipment('All');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setIsCreatingCustom(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow-md hover:bg-emerald-400 transition-colors"
                >
                  Create Custom Exercise
                </button>
              </div>
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="p-3.5 rounded-2xl bg-[#121A2C]/90 border border-white/10 hover:border-emerald-500/40 hover:bg-[#18233C] transition-all flex items-center justify-between group shadow-sm relative overflow-hidden"
              >
                <div
                  className="flex-1 cursor-pointer pr-3"
                  onClick={() => {
                    onSelectExercise(exercise.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                      {exercise.name}
                    </span>
                    {exercise.isCustom && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                        Custom
                      </span>
                    )}
                    {exercise.category === 'Compound' && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[9px] font-mono font-semibold border border-blue-500/20 hidden sm:inline-block">
                        Compound
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold text-[10px] border border-emerald-500/25 font-mono flex items-center gap-1">
                      <span>•</span>
                      {exercise.muscleGroup}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      exercise.equipment === 'Barbell'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : exercise.equipment === 'Dumbbell'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : exercise.equipment === 'Cable'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : exercise.equipment === 'Machine'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}>
                      {exercise.equipment === 'Barbell' ? '🏋️ Barbell (Total)' : exercise.equipment === 'Dumbbell' ? '🪙 DB (Per Hand)' : exercise.equipment}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Target className="w-3 h-3 text-slate-500" />
                      {exercise.recommendedRepRange}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedExerciseDetail(exercise)}
                    className="p-2.5 text-slate-400 hover:text-cyan-400 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 transition-colors"
                    title="View Form Cues & Movement Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectExercise(exercise.id);
                      onClose();
                    }}
                    className="h-9 px-3 text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-black rounded-xl border border-emerald-400 shadow-sm transition-all pressable flex items-center gap-1 text-xs"
                    title="Add to workout"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 6. Exercise Detail Sheet Drawer */}
        {selectedExerciseDetail && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedExerciseDetail(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0C101D] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-start pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                      {selectedExerciseDetail.muscleGroup}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">
                      {selectedExerciseDetail.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                      {selectedExerciseDetail.equipment}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1.5">
                    {selectedExerciseDetail.name}
                  </h3>
                  {selectedExerciseDetail.secondaryMuscles.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Secondary: <span className="text-slate-300">{selectedExerciseDetail.secondaryMuscles.join(', ')}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedExerciseDetail(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Cues */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
                <div className="text-xs font-bold text-emerald-400 mb-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Elite Form Cues & Biomechanics
                </div>
                <ul className="text-xs text-emerald-100/90 space-y-2 list-disc pl-4">
                  {selectedExerciseDetail.formCues.map((cue, idx) => (
                    <li key={idx} className="leading-relaxed">{cue}</li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">Step-by-Step Instructions</div>
                <ol className="text-xs text-slate-300 space-y-2.5 list-decimal pl-4">
                  {selectedExerciseDetail.instructions.map((inst, idx) => (
                    <li key={idx} className="leading-relaxed pl-1">{inst}</li>
                  ))}
                </ol>
              </div>

              {/* Common Mistakes */}
              {selectedExerciseDetail.commonMistakes.length > 0 && (
                <div className="bg-rose-950/25 border border-rose-500/25 rounded-2xl p-3.5">
                  <div className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Common Mistakes to Avoid
                  </div>
                  <ul className="text-xs text-rose-200/80 space-y-1.5 list-disc pl-4">
                    {selectedExerciseDetail.commonMistakes.map((m, idx) => (
                      <li key={idx} className="leading-relaxed">{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  onSelectExercise(selectedExerciseDetail.id);
                  setSelectedExerciseDetail(null);
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-emerald-400 pressable transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add This Exercise to Workout
              </button>
            </div>
          </div>
        )}

        {/* 7. Hyper-Customizable Create Custom Exercise Modal */}
        <CreateCustomExerciseModal
          isOpen={isCreatingCustom}
          onClose={() => setIsCreatingCustom(false)}
          onSaveExercise={async (exerciseData) => {
            const created = await addCustomExercise(exerciseData);
            if (created && created.id) {
              onSelectExercise(created.id);
              onClose();
            }
          }}
          initialMuscle={selectedMuscle === 'All' ? 'Chest' : selectedMuscle}
          initialEquipment={selectedEquipment === 'All' ? 'Barbell' : selectedEquipment}
        />

      </div>
    </div>,
    document.body
  );
};
