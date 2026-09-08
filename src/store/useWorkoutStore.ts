import { create } from 'zustand';
import { Workout, WorkoutExercise, WorkoutSet, Exercise, PersonalRecord, MuscleGroup, Equipment, SetType } from '@/types';
import { SEED_EXERCISES } from '@/database/seeds/exercises';
import { api } from '@/services/api';
import { getToday } from '@/utils/date';

export type { Workout, WorkoutExercise, WorkoutSet, Exercise, PersonalRecord };

export interface CustomSplitDay {
  dayName: string;
  dayShort: string;
  dayIndex: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  title: string;
  subtitle: string;
  tag: string;
  selectedMuscles: MuscleGroup[];
  isRest: boolean;
  exerciseIds: string[];
  estimatedMinutes: number;
  overviewNotes: string;
}

export const EXERCISE_ALIAS_MAP: Record<string, string> = {
  'ex-barbell-squat': 'ex-back-squat',
  'ex-squat': 'ex-back-squat',
  'ex-tricep-pushdown': 'ex-rope-pushdown',
  'ex-leg-curl': 'ex-lying-leg-curl',
  'ex-hamstring-curl': 'ex-lying-leg-curl',
  'ex-calf-raise': 'ex-standing-calf-raise',
  'ex-calves-raise': 'ex-standing-calf-raise',
  'ex-standing-db-curl': 'ex-incline-db-curl',
  'ex-dumbbell-shoulder-press': 'ex-db-shoulder-press',
  'ex-seated-row': 'ex-seated-cable-row',
};

export const DEFAULT_SPLIT_DAYS: CustomSplitDay[] = [
  {
    dayName: 'Monday',
    dayShort: 'Mon',
    dayIndex: 1,
    title: 'Chest + Triceps',
    subtitle: 'Pec Hypertrophy & Horseshoe Tricep Overload',
    tag: 'Chest & Triceps',
    selectedMuscles: ['Chest', 'Triceps'],
    isRest: false,
    exerciseIds: ['ex-bench-press', 'ex-incline-db-press', 'ex-cable-fly', 'ex-rope-pushdown', 'ex-skull-crushers', 'ex-dips'],
    estimatedMinutes: 60,
    overviewNotes: 'Heavy compound pressing paired with strict tricep lockout extension.'
  },
  {
    dayName: 'Tuesday',
    dayShort: 'Tue',
    dayIndex: 2,
    title: 'Back + Biceps',
    subtitle: 'V-Taper Lat Width & Bicep Peak Volume',
    tag: 'Back & Biceps',
    selectedMuscles: ['Back', 'Biceps'],
    isRest: false,
    exerciseIds: ['ex-lat-pulldown', 'ex-barbell-row', 'ex-seated-cable-row', 'ex-barbell-curl', 'ex-incline-db-curl', 'ex-hammer-curl'],
    estimatedMinutes: 60,
    overviewNotes: 'Drive through elbows on rows and emphasize eccentric on bicep curls.'
  },
  {
    dayName: 'Wednesday',
    dayShort: 'Wed',
    dayIndex: 3,
    title: 'Shoulders + Legs',
    subtitle: 'Boulder Delts & Quad/Hamstring Drive',
    tag: 'Delts & Lower Body',
    selectedMuscles: ['Shoulders', 'Quads', 'Hamstrings'],
    isRest: false,
    exerciseIds: ['ex-overhead-press', 'ex-lateral-raise', 'ex-back-squat', 'ex-leg-press', 'ex-romanian-deadlift', 'ex-lying-leg-curl'],
    estimatedMinutes: 70,
    overviewNotes: 'Strict vertical pressing paired with deep squats and hip-hinge deadlifts.'
  },
  {
    dayName: 'Thursday',
    dayShort: 'Thu',
    dayIndex: 4,
    title: 'Chest + Triceps',
    subtitle: 'Upper Clavicular Pecs & Tricep Power',
    tag: 'Upper Chest & Triceps',
    selectedMuscles: ['Chest', 'Triceps'],
    isRest: false,
    exerciseIds: ['ex-incline-bb-press', 'ex-pec-deck', 'ex-flat-db-press', 'ex-overhead-cable-extension', 'ex-straight-bar-pushdown', 'ex-close-grip-bench'],
    estimatedMinutes: 60,
    overviewNotes: 'Incline bench angle for upper pecs followed by overhead tricep long-head stretch.'
  },
  {
    dayName: 'Friday',
    dayShort: 'Fri',
    dayIndex: 5,
    title: 'Back + Biceps',
    subtitle: 'Lat Thickness & Arm Density Burnout',
    tag: 'Back & Biceps',
    selectedMuscles: ['Back', 'Biceps'],
    isRest: false,
    exerciseIds: ['ex-pull-up', 'ex-single-arm-db-row', 'ex-t-bar-row', 'ex-preacher-curl', 'ex-cable-rope-curl', 'ex-barbell-curl'],
    estimatedMinutes: 60,
    overviewNotes: 'Strict bodyweight Pull-Ups and heavy isolated preacher curls.'
  },
  {
    dayName: 'Saturday',
    dayShort: 'Sat',
    dayIndex: 6,
    title: 'Shoulders + Legs',
    subtitle: 'Lateral Deltoids & Lower Body Volume Hypertrophy',
    tag: '3D Delts & Legs',
    selectedMuscles: ['Shoulders', 'Quads', 'Hamstrings', 'Calves'],
    isRest: false,
    exerciseIds: ['ex-db-shoulder-press', 'ex-lateral-raise', 'ex-leg-extension', 'ex-front-squat', 'ex-lying-leg-curl', 'ex-standing-calf-raise'],
    estimatedMinutes: 65,
    overviewNotes: 'High-tension lateral deltoid raises and quad/calf isolation burnouts.'
  },
  {
    dayName: 'Sunday',
    dayShort: 'Sun',
    dayIndex: 0,
    title: 'Rest & Active Recovery',
    subtitle: 'Systemic Recovery & Muscle Growth Phase',
    tag: 'Active Recovery & Mobility',
    selectedMuscles: [],
    isRest: true,
    exerciseIds: [],
    estimatedMinutes: 0,
    overviewNotes: 'Light walking, 3.5L+ hydration, 8+ hours sleep, and systemic recovery.'
  }
];

/**
 * Intelligently balances and distributes exercise prescriptions evenly across all selected muscle groups.
 * e.g., Chest + Triceps -> 3 Chest + 3 Triceps
 * e.g., Shoulders + Quads + Hamstrings -> 2 Shoulders + 2 Quads + 2 Hamstrings
 */
export function getBalancedExercisesForMuscles(
  muscles: MuscleGroup[],
  allExercises: Exercise[],
  targetTotal = 6
): string[] {
  if (!muscles || muscles.length === 0) return [];

  // Group available exercises by muscle group
  const byMuscle: Record<string, Exercise[]> = {};
  muscles.forEach(m => {
    byMuscle[m] = allExercises.filter(e => e.muscleGroup === m);
  });

  const muscleCount = muscles.length;
  const baseQuota = Math.floor(targetTotal / muscleCount);
  const remainder = targetTotal % muscleCount;

  const selectedIds: string[] = [];

  // Distribute slots evenly among selected muscle groups
  muscles.forEach((m, idx) => {
    const list = byMuscle[m] || [];
    const quota = Math.max(1, baseQuota + (idx < remainder ? 1 : 0));
    const chosen = list.slice(0, quota);
    chosen.forEach(ex => {
      if (!selectedIds.includes(ex.id)) {
        selectedIds.push(ex.id);
      }
    });
  });

  // If still below targetTotal (e.g., if one group had fewer items), fill round-robin
  if (selectedIds.length < targetTotal) {
    let progress = true;
    while (selectedIds.length < targetTotal && progress) {
      progress = false;
      for (const m of muscles) {
        const list = byMuscle[m] || [];
        for (const ex of list) {
          if (!selectedIds.includes(ex.id) && selectedIds.length < targetTotal) {
            selectedIds.push(ex.id);
            progress = true;
            break;
          }
        }
      }
    }
  }

  return selectedIds;
}

// Startup validation to guarantee all default split exercises exist in canonical catalog
const validateSplitExerciseIds = (splits: CustomSplitDay[]) => {
  const seedIdSet = new Set(SEED_EXERCISES.map(e => e.id));
  splits.forEach(day => {
    day.exerciseIds.forEach(id => {
      if (!seedIdSet.has(id)) {
        console.error(`[Configuration Error] Workout split '${day.dayName}' references unregistered exerciseId: '${id}'`);
      }
    });
  });
};
validateSplitExerciseIds(DEFAULT_SPLIT_DAYS);

function loadSavedSplit(): CustomSplitDay[] {
  try {
    const saved = localStorage.getItem('fitforge_custom_split');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 7) {
        const seedIdSet = new Set(SEED_EXERCISES.map(e => e.id));
        const exerciseMap = new Map(SEED_EXERCISES.map(e => [e.id, e]));

        return parsed.map((day: CustomSplitDay) => {
          let canonicalIds = (day.exerciseIds || []).map(id => {
            const resolved = EXERCISE_ALIAS_MAP[id] || id;
            return seedIdSet.has(resolved) ? resolved : id;
          });

          // Auto-heal check: if day specifies multiple selected muscles, verify that all muscles are represented
          if (!day.isRest && day.selectedMuscles && day.selectedMuscles.length > 1) {
            const presentMuscles = new Set(
              canonicalIds.map(id => exerciseMap.get(id)?.muscleGroup).filter(Boolean)
            );
            const isMissingAnyMuscle = day.selectedMuscles.some(m => !presentMuscles.has(m));

            // Auto-rebalance if one or more targeted muscle groups were left out
            if (isMissingAnyMuscle || canonicalIds.length === 0) {
              console.info(`[WorkoutStore] Auto-rebalancing multi-muscle split '${day.dayName}' (${day.selectedMuscles.join(' + ')}) for optimal muscle distribution.`);
              canonicalIds = getBalancedExercisesForMuscles(day.selectedMuscles, SEED_EXERCISES, Math.max(6, canonicalIds.length));
            }
          }

          return {
            ...day,
            exerciseIds: canonicalIds
          };
        });
      }
    }
  } catch (e) {
    console.warn('Could not load custom split from localStorage:', e);
  }
  return DEFAULT_SPLIT_DAYS;
}

interface RestTimerState {
  isActive: boolean;
  totalDuration: number;
  remainingSeconds: number;
  exerciseName?: string;
  setNumber?: number;
}

interface WorkoutState {
  exercises: Exercise[];
  workouts: Workout[];
  activeWorkout: Workout | null;
  activeWorkoutElapsedSeconds: number;
  isActiveWorkoutPaused: boolean;
  restTimer: RestTimerState;
  prs: PersonalRecord[];
  latestPRCelebration: PersonalRecord | null;
  weeklySplit: CustomSplitDay[];

  // Workout Duration Timer Actions
  pauseActiveWorkoutTimer: () => void;
  resumeActiveWorkoutTimer: () => void;
  setActiveWorkoutElapsedSeconds: (seconds: number | ((prev: number) => number)) => void;

  // DB Hydration
  setWorkoutsFromDB: (workouts: Workout[]) => void;
  setCustomExercisesFromDB: (customExercises: Exercise[]) => void;
  setWeeklySplitFromDB: (split: CustomSplitDay[]) => void;

  // Split Customization Actions
  updateSplitDay: (dayName: string, updates: Partial<CustomSplitDay>) => void;
  resetSplitToDefault: () => void;

  // Exercise Actions
  addCustomExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => Promise<Exercise>;
  deleteCustomExercise: (id: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  getPreviousPerformance: (exerciseId: string) => { weightKg: number; reps: number }[];

  // Active Workout Actions
  startWorkout: (name?: string, exerciseIds?: string[]) => void;
  finishWorkout: (notes?: string, rating?: number) => Promise<Workout | null>;
  discardWorkout: () => void;
  addExerciseToWorkout: (exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutExerciseId: string) => void;
  addSetToExercise: (workoutExerciseId: string, setType?: SetType) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetCompleted: (workoutExerciseId: string, setId: string) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;

  // Historical Workout Editing Actions
  updateHistoricalWorkout: (workout: Workout) => Promise<Workout>;
  deleteHistoricalWorkout: (workoutId: string) => Promise<void>;

  // Rest Timer Actions
  startRestTimer: (durationSeconds: number, exerciseName?: string, setNumber?: number) => void;
  stopRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  tickRestTimer: () => void;
  clearPRCelebration: () => void;

  // Streak Selector Helper
  getCurrentStreak: () => number;
}

export { selectCurrentWorkoutStreak } from '@/utils/streak';
import { selectCurrentWorkoutStreak } from '@/utils/streak';

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  exercises: [...SEED_EXERCISES],
  workouts: [],
  activeWorkout: null,
  activeWorkoutElapsedSeconds: 0,
  isActiveWorkoutPaused: false,

  pauseActiveWorkoutTimer: () => {
    set({ isActiveWorkoutPaused: true });
  },

  resumeActiveWorkoutTimer: () => {
    set({ isActiveWorkoutPaused: false });
  },

  setActiveWorkoutElapsedSeconds: (seconds) => {
    if (typeof seconds === 'function') {
      set((state) => ({ activeWorkoutElapsedSeconds: seconds(state.activeWorkoutElapsedSeconds) }));
    } else {
      set({ activeWorkoutElapsedSeconds: seconds });
    }
  },

  restTimer: {
    isActive: false,
    totalDuration: 90,
    remainingSeconds: 0
  },
  prs: [],
  latestPRCelebration: null,
  weeklySplit: loadSavedSplit(),

  getCurrentStreak: () => selectCurrentWorkoutStreak(get().workouts),

  setWeeklySplitFromDB: (dbSplit) => {
    if (!dbSplit || !Array.isArray(dbSplit) || dbSplit.length !== 7) return;
    set({ weeklySplit: dbSplit });
    try {
      localStorage.setItem('fitforge_custom_split', JSON.stringify(dbSplit));
    } catch {}
  },

  updateSplitDay: (dayName, updates) => {
    const state = get();
    const nextSplit = state.weeklySplit.map(d => 
      d.dayName === dayName ? { ...d, ...updates } : d
    );
    set({ weeklySplit: nextSplit });
    try {
      localStorage.setItem('fitforge_custom_split', JSON.stringify(nextSplit));
    } catch (e) {
      console.error('Failed to persist custom split to localStorage:', e);
    }
    // Directly persist to TiDB Cloud database
    api.saveWeeklySplit(nextSplit).catch(err => {
      console.warn('[WorkoutStore] Remote split persistence error:', err);
    });
  },

  resetSplitToDefault: () => {
    set({ weeklySplit: DEFAULT_SPLIT_DAYS });
    try {
      localStorage.removeItem('fitforge_custom_split');
    } catch (e) {}
    // Directly persist default to TiDB Cloud database
    api.saveWeeklySplit(DEFAULT_SPLIT_DAYS).catch(err => {
      console.warn('[WorkoutStore] Remote split reset error:', err);
    });
  },

  setWorkoutsFromDB: (dbWorkouts) => {
    set({ workouts: dbWorkouts || [] });
  },

  setCustomExercisesFromDB: (customExercises) => {
    if (!customExercises || customExercises.length === 0) return;
    set((state) => {
      const customMap = new Map(customExercises.map(e => [e.id, { ...e, isCustom: true }]));
      // Retain existing custom exercises not in this batch if any, or overwrite with current batch
      const currentOthers = state.exercises.filter(e => !e.isCustom && !customMap.has(e.id));
      return {
        exercises: [...customExercises.map(e => ({ ...e, isCustom: true })), ...currentOthers]
      };
    });
  },

  addCustomExercise: async (newEx) => {
    const exercise: Exercise = {
      ...newEx,
      id: `custom-ex-${Date.now()}`,
      isCustom: true,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    // 1. Optimistic local update in Zustand
    set((state) => ({
      exercises: [exercise, ...state.exercises.filter(e => e.id !== exercise.id)]
    }));

    // 2. Persist to IndexedDB & TiDB Cloud / Sync Queue
    try {
      const res = await api.saveCustomExercise(exercise);
      if (res && (res as any).exercise) {
        const saved = (res as any).exercise;
        set((state) => ({
          exercises: state.exercises.map(e => e.id === exercise.id ? { ...e, ...saved, isCustom: true, syncStatus: 'synced' } : e)
        }));
      }
    } catch (err) {
      console.warn('Custom exercise persistence handled by offline queue:', err);
    }

    return exercise;
  },

  deleteCustomExercise: async (id: string) => {
    set((state) => ({
      exercises: state.exercises.filter(e => e.id !== id)
    }));
    try {
      await api.deleteCustomExercise(id);
    } catch (err) {
      console.warn('Failed to delete custom exercise:', err);
    }
  },

  updateHistoricalWorkout: async (workout: Workout) => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    workout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalSets++;
          totalReps += s.reps || 0;
          totalVolume += (s.weightKg || 0) * (s.reps || 0);
        }
      });
    });

    const updated: Workout = {
      ...workout,
      totalVolumeKg: Math.round(totalVolume * 10) / 10,
      totalSets,
      totalReps,
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      workouts: state.workouts.map(w => w.id === updated.id ? updated : w)
    }));

    await api.saveWorkout(updated);
    return updated;
  },

  deleteHistoricalWorkout: async (workoutId: string) => {
    set((state) => ({
      workouts: state.workouts.filter(w => w.id !== workoutId)
    }));
    await api.deleteWorkout(workoutId);
  },

  getExerciseById: (id: string) => {
    const canonicalId = EXERCISE_ALIAS_MAP[id] || id;
    return get().exercises.find(e => e.id === canonicalId || e.id === id);
  },

  getPreviousPerformance: (exerciseId: string) => {
    const workouts = get().workouts;
    for (const w of workouts) {
      const found = w.exercises.find(e => e.exerciseId === exerciseId);
      if (found && found.sets.length > 0) {
        return found.sets.filter(s => s.completed).map(s => ({
          weightKg: s.weightKg,
          reps: s.reps
        }));
      }
    }
    return [];
  },

  startWorkout: (name = 'Custom Workout', exerciseIds?: string[]) => {
    const state = get();
    const loadedExercises: WorkoutExercise[] = [];

    if (exerciseIds && exerciseIds.length > 0) {
      exerciseIds.forEach((exId, exOrder) => {
        const exercise = state.getExerciseById(exId);
        if (exercise) {
          const prevSets = state.getPreviousPerformance(exId);
          const initialSets: WorkoutSet[] = (prevSets.length > 0 ? prevSets : [
            { weightKg: 0, reps: 0 },
            { weightKg: 0, reps: 0 },
            { weightKg: 0, reps: 0 }
          ]).map((s, idx) => ({
            id: `set-${Date.now()}-${exOrder}-${idx}`,
            setNumber: idx + 1,
            type: 'normal',
            weightKg: s.weightKg || 0,
            reps: s.reps || 0,
            completed: false,
            previousWeightKg: prevSets.length > 0 ? s.weightKg : undefined,
            previousReps: prevSets.length > 0 ? s.reps : undefined
          }));

          loadedExercises.push({
            id: `we-${Date.now()}-${exOrder}`,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscleGroup,
            order: exOrder + 1,
            sets: initialSets
          });
        }
      });
    }

    const newWorkout: Workout = {
      id: `wo-${Date.now()}`,
      name,
      date: getToday(),
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      exercises: loadedExercises,
      status: 'in_progress',
      totalVolumeKg: 0,
      totalSets: 0,
      totalReps: 0
    };
    set({ 
      activeWorkout: newWorkout,
      activeWorkoutElapsedSeconds: 0,
      isActiveWorkoutPaused: false
    });
  },

  finishWorkout: async (notes = '', rating = 5) => {
    const active = get().activeWorkout;
    if (!active) return null;

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    active.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalVolume += (s.weightKg * s.reps);
          totalSets += 1;
          totalReps += s.reps;
        }
      });
    });

    const elapsed = get().activeWorkoutElapsedSeconds;

    const finished: Workout = {
      ...active,
      endTime: new Date().toISOString(),
      durationSeconds: elapsed > 0 ? elapsed : Math.max(1, Math.round((Date.now() - new Date(active.startTime).getTime()) / 1000)),
      status: 'completed',
      notes,
      rating,
      totalVolumeKg: Math.round(totalVolume),
      totalSets,
      totalReps,
      caloriesBurned: Math.round(totalVolume * 0.05 + totalSets * 12 + 150)
    };

    const nextWorkouts = [finished, ...get().workouts];
    set({
      workouts: nextWorkouts,
      activeWorkout: null,
      activeWorkoutElapsedSeconds: 0,
      isActiveWorkoutPaused: false,
      restTimer: { isActive: false, totalDuration: 90, remainingSeconds: 0 }
    });

    // Save directly to TiDB Cloud Database & local IndexedDB
    await api.saveWorkout(finished);

    return finished;
  },

  discardWorkout: () => {
    set({
      activeWorkout: null,
      activeWorkoutElapsedSeconds: 0,
      isActiveWorkoutPaused: false,
      restTimer: { isActive: false, totalDuration: 90, remainingSeconds: 0 }
    });
  },

  addExerciseToWorkout: (exerciseId: string) => {
    const state = get();
    if (!state.activeWorkout) return;

    const exercise = state.getExerciseById(exerciseId);
    if (!exercise) return;

    const prevSets = state.getPreviousPerformance(exerciseId);

    const initialSets: WorkoutSet[] = (prevSets.length > 0 ? prevSets : [
      { weightKg: 0, reps: 0 },
      { weightKg: 0, reps: 0 },
      { weightKg: 0, reps: 0 }
    ]).map((s, idx) => ({
      id: `set-${Date.now()}-${idx}`,
      setNumber: idx + 1,
      type: 'normal',
      weightKg: s.weightKg || 0,
      reps: s.reps || 0,
      completed: false,
      previousWeightKg: prevSets.length > 0 ? s.weightKg : undefined,
      previousReps: prevSets.length > 0 ? s.reps : undefined
    }));

    const newWorkoutExercise: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      order: state.activeWorkout.exercises.length + 1,
      sets: initialSets
    };

    set((s) => ({
      activeWorkout: s.activeWorkout ? {
        ...s.activeWorkout,
        exercises: [...s.activeWorkout.exercises, newWorkoutExercise]
      } : null
    }));
  },

  removeExerciseFromWorkout: (workoutExerciseId: string) => {
    set((s) => {
      if (!s.activeWorkout) return s;
      return {
        activeWorkout: {
          ...s.activeWorkout,
          exercises: s.activeWorkout.exercises.filter(e => e.id !== workoutExerciseId)
        }
      };
    });
  },

  addSetToExercise: (workoutExerciseId: string, setType: SetType = 'normal') => {
    set((s) => {
      if (!s.activeWorkout) return s;

      const updatedExercises = s.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;

        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set-${Date.now()}`,
          setNumber: ex.sets.length + 1,
          type: setType,
          weightKg: lastSet ? lastSet.weightKg : 0,
          reps: lastSet ? lastSet.reps : 0,
          completed: false,
          previousWeightKg: lastSet?.previousWeightKg,
          previousReps: lastSet?.previousReps
        };

        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      });

      return {
        activeWorkout: {
          ...s.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  },

  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    set((s) => {
      if (!s.activeWorkout) return s;

      const updatedExercises = s.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;

        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id !== setId) return set;
            return { ...set, ...updates };
          })
        };
      });

      return {
        activeWorkout: {
          ...s.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  },

  toggleSetCompleted: (workoutExerciseId: string, setId: string) => {
    const state = get();
    if (!state.activeWorkout) return;

    let justCompletedSet: WorkoutSet | null = null;
    let targetExName = '';
    let targetExId = '';

    const updatedExercises = state.activeWorkout.exercises.map(ex => {
      if (ex.id !== workoutExerciseId) return ex;
      targetExName = ex.exerciseName;
      targetExId = ex.exerciseId;

      return {
        ...ex,
        sets: ex.sets.map(s => {
          if (s.id !== setId) return s;
          const willBeCompleted = !s.completed;
          if (willBeCompleted) {
            justCompletedSet = { ...s, completed: true };
          }
          return {
            ...s,
            completed: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined
          };
        })
      };
    });

    if (justCompletedSet) {
      const completed: WorkoutSet = justCompletedSet;
      state.startRestTimer(90, targetExName, completed.setNumber);
    }

    set((s) => ({
      activeWorkout: s.activeWorkout ? {
        ...s.activeWorkout,
        exercises: updatedExercises
      } : null
    }));
  },

  removeSet: (workoutExerciseId: string, setId: string) => {
    set((s) => {
      if (!s.activeWorkout) return s;

      const updatedExercises = s.activeWorkout.exercises.map(ex => {
        if (ex.id !== workoutExerciseId) return ex;

        const filtered = ex.sets.filter(set => set.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...ex, sets: renumbered };
      });

      return {
        activeWorkout: {
          ...s.activeWorkout,
          exercises: updatedExercises
        }
      };
    });
  },

  startRestTimer: (durationSeconds: number, exerciseName?: string, setNumber?: number) => {
    set({
      restTimer: {
        isActive: true,
        totalDuration: durationSeconds,
        remainingSeconds: durationSeconds,
        exerciseName,
        setNumber
      }
    });
  },

  stopRestTimer: () => {
    set({
      restTimer: {
        isActive: false,
        totalDuration: 90,
        remainingSeconds: 0
      }
    });
  },

  adjustRestTimer: (deltaSeconds: number) => {
    set((s) => {
      const next = Math.max(0, s.restTimer.remainingSeconds + deltaSeconds);
      return {
        restTimer: {
          ...s.restTimer,
          remainingSeconds: next,
          totalDuration: Math.max(s.restTimer.totalDuration, next)
        }
      };
    });
  },

  tickRestTimer: () => {
    set((s) => {
      if (!s.restTimer.isActive || s.restTimer.remainingSeconds <= 0) return s;
      const next = s.restTimer.remainingSeconds - 1;
      if (next === 0) {
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        return {
          restTimer: { ...s.restTimer, remainingSeconds: 0, isActive: false }
        };
      }
      return {
        restTimer: { ...s.restTimer, remainingSeconds: next }
      };
    });
  },

  clearPRCelebration: () => {
    set({ latestPRCelebration: null });
  }
}));
