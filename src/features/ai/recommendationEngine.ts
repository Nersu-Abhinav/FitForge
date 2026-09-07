import { Workout } from '@/types';

export interface ExerciseProgressionRecommendation {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  recommendedWeightKg: number;
  lastWeightKg?: number;
  lastReps?: number;
  lastRpe?: number;
  sessionCount: number;
  progressionStatus: 'overload' | 'maintain' | 'consolidate' | 'baseline';
  badgeText: string;
  rationale: string;
}

/**
 * Calculates progressive overload recommendation transparently from the user's actual workout history.
 *
 * Algorithm Rules:
 * 1. Gather all past completed sets for the given exercise across recent sessions.
 * 2. If no history exists, provide a calibrated starting baseline.
 * 3. If user achieved target reps with RPE <= 7.5: Suggest a +1.25kg to +2.5kg overload.
 * 4. If RPE >= 9.0: Suggest consolidating technique and rep tempo at current weight.
 * 5. If RPE ~ 8.0: Suggest maintaining weight while aiming for rep progression.
 */
export function calculateExerciseRecommendation(
  exerciseId: string,
  exerciseName: string,
  workouts: Workout[],
  targetSets: number = 3,
  targetReps: string = '8-10'
): ExerciseProgressionRecommendation {
  const relevantSets: Array<{ weightKg: number; reps: number; rpe?: number; date: string }> = [];
  const sessionDates = new Set<string>();

  for (const w of workouts) {
    const ex = w.exercises.find(
      e => e.exerciseId === exerciseId || e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
    if (ex) {
      const completedSets = ex.sets.filter(s => s.completed && s.weightKg > 0);
      if (completedSets.length > 0) {
        sessionDates.add(w.date);
        for (const s of completedSets) {
          relevantSets.push({
            weightKg: s.weightKg,
            reps: s.reps,
            rpe: (s as any).rpe,
            date: w.date
          });
        }
      }
    }
  }

  const sessionCount = sessionDates.size;

  // No prior history: Calibrated baseline
  if (relevantSets.length === 0) {
    const isHeavyCompound = /squat|deadlift|bench|press|row/i.test(exerciseName);
    const baselineWeight = isHeavyCompound ? 40 : 16;
    return {
      exerciseId,
      exerciseName,
      targetSets,
      targetReps,
      recommendedWeightKg: baselineWeight,
      sessionCount: 0,
      progressionStatus: 'baseline',
      badgeText: 'Calibrated Baseline',
      rationale: `Recommended: ${baselineWeight}kg (Starting baseline load — no historical sessions logged yet)`
    };
  }

  const latestWeight = relevantSets[0].weightKg;
  const latestReps = relevantSets[0].reps;
  const avgRpe =
    relevantSets.slice(0, 3).reduce((sum, s) => sum + (s.rpe || 8), 0) / Math.min(3, relevantSets.length);

  const maxTargetRep = parseInt(targetReps.split('-').pop() || '10', 10);

  // Overload Condition
  if (latestReps >= maxTargetRep && avgRpe <= 7.5) {
    const increment = latestWeight >= 50 ? 2.5 : latestWeight >= 20 ? 2.0 : 1.25;
    const recommendedWeightKg = Math.round((latestWeight + increment) * 10) / 10;
    return {
      exerciseId,
      exerciseName,
      targetSets,
      targetReps,
      recommendedWeightKg,
      lastWeightKg: latestWeight,
      lastReps: latestReps,
      lastRpe: Math.round(avgRpe * 10) / 10,
      sessionCount,
      progressionStatus: 'overload',
      badgeText: `+${increment}kg Overload`,
      rationale: `Recommended: ${recommendedWeightKg}kg based on your last ${sessionCount} session${sessionCount === 1 ? '' : 's'} (${latestWeight}kg × ${latestReps} reps @ RPE ${Math.round(avgRpe * 10) / 10})`
    };
  }

  // Technique Consolidation Condition
  if (avgRpe >= 9.0) {
    return {
      exerciseId,
      exerciseName,
      targetSets,
      targetReps,
      recommendedWeightKg: latestWeight,
      lastWeightKg: latestWeight,
      lastReps: latestReps,
      lastRpe: Math.round(avgRpe * 10) / 10,
      sessionCount,
      progressionStatus: 'consolidate',
      badgeText: 'Form Consolidation',
      rationale: `Recommended: ${latestWeight}kg based on your last ${sessionCount} session${sessionCount === 1 ? '' : 's'} (Consolidate tempo and form before loading)`
    };
  }

  // Steady Progression / Maintain Condition
  return {
    exerciseId,
    exerciseName,
    targetSets,
    targetReps,
    recommendedWeightKg: latestWeight,
    lastWeightKg: latestWeight,
    lastReps: latestReps,
    lastRpe: Math.round(avgRpe * 10) / 10,
    sessionCount,
    progressionStatus: 'maintain',
    badgeText: 'Maintain & Solidify',
    rationale: `Recommended: ${latestWeight}kg based on your last ${sessionCount} session${sessionCount === 1 ? '' : 's'} (Target steady ${targetReps} reps)`
  };
}
