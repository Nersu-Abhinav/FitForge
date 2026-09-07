import { Workout } from '@/types';
import { getToday, getYesterday, getLocalDateString } from '@/utils/date';

/**
 * Canonical Selector: selectCurrentWorkoutStreak
 *
 * Calculates the current consecutive active workout streak from recorded workout dates.
 * A streak remains active if the user worked out today OR yesterday.
 */
export function selectCurrentWorkoutStreak(workouts: Workout[]): number {
  if (!workouts || workouts.length === 0) return 0;

  const todayStr = getToday();
  // Only consider past or today workouts
  const pastWorkouts = workouts.filter(w => w.date <= todayStr);
  const workoutDates = Array.from(new Set(pastWorkouts.map(w => w.date))).sort().reverse();

  const yesterdayStr = getYesterday();

  if (!workoutDates.includes(todayStr) && !workoutDates.includes(yesterdayStr)) {
    return 0;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  let checkDate = workoutDates.includes(todayStr) ? new Date() : yesterday;
  let streak = 0;

  while (true) {
    const dStr = getLocalDateString(checkDate);
    if (workoutDates.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
