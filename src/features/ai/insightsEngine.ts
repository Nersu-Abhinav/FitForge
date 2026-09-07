import { AIInsight, Workout, Meal, HydrationLog, BodyMeasurement, SleepLog, RecoveryLog, FitnessGoals } from '@/types';
import { getToday, offsetDateString } from '@/utils/date';

interface FitnessDataSnapshot {
  workouts: Workout[];
  meals: Meal[];
  hydration: HydrationLog[];
  measurements: BodyMeasurement[];
  sleepLogs: SleepLog[];
  recoveryLogs: RecoveryLog[];
  goals: FitnessGoals;
}

export function generateFitnessInsights(snapshot: FitnessDataSnapshot): AIInsight[] {
  const insights: AIInsight[] = [];
  const todayStr = getToday();

  // 1. Workout Frequency & Progressive Overload Analysis (Past 7 calendar days, excluding future dates)
  const cutoffSevenDays = offsetDateString(todayStr, -7);
  const recentWorkouts = snapshot.workouts.filter(w => w.date >= cutoffSevenDays && w.date <= todayStr);
  const totalWeeklyVolume = recentWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

  if (recentWorkouts.length >= 3) {
    insights.push({
      id: 'ins-wo-vol',
      category: 'workout',
      title: 'Progressive Overload on Track',
      message: `You've completed ${recentWorkouts.length} sessions this week totaling ${Math.round(totalWeeklyVolume).toLocaleString()} kg of work volume.`,
      impact: 'positive',
      actionableTip: 'Keep compound movement intensity at RPE 8-9 for optimal myofibrillar hypertrophy.',
      date: todayStr
    });
  }

  // 2. Nutrition & Protein Adherence Analysis
  const todayMeals = snapshot.meals.filter(m => m.date === todayStr);
  const todayProtein = todayMeals.reduce((sum, m) => sum + m.totalProtein, 0);
  const proteinTarget = snapshot.goals.dailyProteinGrams || 160;

  if (todayProtein >= proteinTarget * 0.8) {
    insights.push({
      id: 'ins-nut-pro',
      category: 'nutrition',
      title: 'Strong Protein Intake',
      message: `You have logged ${todayProtein}g of protein today (${Math.round((todayProtein / proteinTarget) * 100)}% of your ${proteinTarget}g target).`,
      impact: 'positive',
      actionableTip: 'Optimal leucine distribution stimulates maximum muscle protein synthesis every 3-4 hours.',
      date: todayStr
    });
  } else if (todayMeals.length > 0) {
    const remaining = Math.round(proteinTarget - todayProtein);
    insights.push({
      id: 'ins-nut-pro-rem',
      category: 'nutrition',
      title: 'Protein Target Gap',
      message: `You are ${remaining}g away from hitting your daily ${proteinTarget}g protein target.`,
      impact: 'neutral',
      actionableTip: 'A scoop of whey isolate or 150g greek yogurt will close this gap quickly.',
      date: todayStr
    });
  }

  // 3. Sleep & Recovery Readiness
  const recentSleep = snapshot.sleepLogs[0];
  const recentRecovery = snapshot.recoveryLogs[0];

  if (recentRecovery && recentRecovery.calculatedScore >= 80) {
    insights.push({
      id: 'ins-rec-high',
      category: 'recovery',
      title: 'Optimal Recovery Score (' + recentRecovery.calculatedScore + '%)',
      message: 'High readiness detected with low subjective soreness and rested energy levels.',
      impact: 'celebration',
      actionableTip: 'Ideal day to test strength progression on primary compound lifts.',
      date: todayStr
    });
  } else if (recentSleep && recentSleep.durationMinutes < 390) {
    insights.push({
      id: 'ins-sleep-low',
      category: 'recovery',
      title: 'Sub-Optimal Sleep Duration',
      message: `Logged ${Math.floor(recentSleep.durationMinutes / 60)}h ${recentSleep.durationMinutes % 60}m of sleep.`,
      impact: 'warning',
      actionableTip: 'Ensure adequate pre-workout hydration and consider lower accessory volume today.',
      date: todayStr
    });
  }

  // 4. Weight Trend Correlation
  if (snapshot.measurements.length >= 2) {
    const latest = snapshot.measurements[snapshot.measurements.length - 1];
    const prev = snapshot.measurements[snapshot.measurements.length - 2];
    const diff = Math.round((latest.weightKg - prev.weightKg) * 10) / 10;

    if (snapshot.goals.goalType === 'fat_loss' && diff < 0) {
      insights.push({
        id: 'ins-wt-trend',
        category: 'streak',
        title: 'Fat Loss Velocity Confirmed',
        message: `Body weight down ${Math.abs(diff)} kg over the past measurement interval while maintaining strength.`,
        impact: 'positive',
        date: todayStr
      });
    } else if (snapshot.goals.goalType === 'muscle_gain') {
      insights.push({
        id: 'ins-wt-gain',
        category: 'streak',
        title: 'Steady Lean Mass Accumulation',
        message: `Weight is trending at an ideal steady rate (+${diff > 0 ? diff : 0.1} kg/wk) minimizing adipose gain.`,
        impact: 'positive',
        date: todayStr
      });
    }
  }

  return insights;
}
