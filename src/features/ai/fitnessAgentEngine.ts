import { Workout, Meal, HydrationLog, BodyMeasurement, SleepLog, RecoveryLog, FitnessGoals, Exercise, MealType } from '@/types';
import { getToday, offsetDateString } from '@/utils/date';
import { selectCurrentWorkoutStreak } from '@/utils/streak';
import { calculateExerciseRecommendation } from '@/features/ai/recommendationEngine';
import { CANONICAL_FOODS } from '@/data/foods';
import { CANONICAL_EXERCISES } from '@/data/exercises';

export interface AgentContext {
  user: {
    name: string;
    fitnessLevel: string;
    unitSystem: string;
    goals: FitnessGoals;
  };
  workouts: Workout[];
  meals: Meal[];
  hydration: HydrationLog[];
  measurements: BodyMeasurement[];
  sleepLogs: SleepLog[];
  recoveryLogs: RecoveryLog[];
  weeklySplit: Array<{
    dayName: string;
    dayShort: string;
    dayIndex: number;
    title: string;
    subtitle: string;
    tag: string;
    isRest: boolean;
    exerciseIds: string[];
  }>;
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  content: string;
  suggestedPrompts?: string[];
  action?: {
    type: 'START_WORKOUT' | 'LOG_MEAL' | 'NAVIGATE' | 'QUICK_ADD_MACROS';
    payload: any;
    buttonLabel: string;
  };
  insightsData?: {
    readinessScore?: number;
    targetExercise?: string;
    recommendedWeight?: number;
    macrosBudget?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  };
}

/**
 * Calculates current real-time nutritional remaining budget for today
 */
export function calculateTodayMacroBudget(meals: Meal[], goals: FitnessGoals) {
  const todayStr = getToday();
  const todayMeals = meals.filter(m => m.date === todayStr);

  const consumed = todayMeals.reduce((acc, m) => ({
    calories: acc.calories + (m.totalCalories || 0),
    protein: acc.protein + (m.totalProtein || 0),
    carbs: acc.carbs + (m.totalCarbs || 0),
    fat: acc.fat + (m.totalFat || 0),
    fiber: acc.fiber + (m.totalFiber || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const targetCalories = goals.dailyCalories || 2600;
  const targetProtein = goals.dailyProteinGrams || 160;
  const targetCarbs = goals.dailyCarbsGrams || 280;
  const targetFat = goals.dailyFatGrams || 75;

  return {
    consumed,
    remaining: {
      calories: Math.max(0, targetCalories - consumed.calories),
      protein: Math.max(0, targetProtein - consumed.protein),
      carbs: Math.max(0, targetCarbs - consumed.carbs),
      fat: Math.max(0, targetFat - consumed.fat)
    },
    targets: {
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat
    }
  };
}

/**
 * Computes muscle group recovery fatigue map based on workouts in the last 5 days
 */
export function calculateMuscleRecoveryMap(workouts: Workout[]) {
  const todayStr = getToday();
  const muscleGroups = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Arms', 'Core'] as const;
  const recoveryMap: Record<string, { daysSince: number; recoveryPct: number; status: 'ready' | 'recovering' | 'fatigued' }> = {};

  muscleGroups.forEach(muscle => {
    let daysSince = 99;
    
    // Find latest workout containing this muscle group
    const pastWorkouts = workouts
      .filter(w => w.date <= todayStr && w.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const w of pastWorkouts) {
      const hasMuscle = (w.exercises || []).some(e => {
        const name = e.exerciseName.toLowerCase();
        const muscleLower = muscle.toLowerCase();
        if (e.muscleGroup && e.muscleGroup.toLowerCase() === muscleLower) return true;
        if (muscle === 'Chest' && (name.includes('bench') || name.includes('chest') || name.includes('fly'))) return true;
        if (muscle === 'Back' && (name.includes('row') || name.includes('pulldown') || name.includes('pull-up') || name.includes('deadlift'))) return true;
        if (muscle === 'Quads' && (name.includes('squat') || name.includes('leg press') || name.includes('extension'))) return true;
        if (muscle === 'Hamstrings' && (name.includes('rdl') || name.includes('curl') || name.includes('deadlift'))) return true;
        if (muscle === 'Shoulders' && (name.includes('overhead') || name.includes('lateral') || name.includes('military') || name.includes('press'))) return true;
        if (muscle === 'Arms' && (name.includes('curl') || name.includes('tricep') || name.includes('pushdown') || name.includes('dip'))) return true;
        return false;
      });

      if (hasMuscle) {
        const d1 = new Date(w.date).getTime();
        const d2 = new Date(todayStr).getTime();
        daysSince = Math.max(0, Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)));
        break;
      }
    }

    let recoveryPct = 100;
    let status: 'ready' | 'recovering' | 'fatigued' = 'ready';

    if (daysSince === 0) {
      recoveryPct = 35;
      status = 'fatigued';
    } else if (daysSince === 1) {
      recoveryPct = 65;
      status = 'recovering';
    } else if (daysSince === 2) {
      recoveryPct = 85;
      status = 'recovering';
    } else {
      recoveryPct = 100;
      status = 'ready';
    }

    recoveryMap[muscle] = { daysSince, recoveryPct, status };
  });

  return recoveryMap;
}

/**
 * Intelligent Agent reasoning pipeline: Generates hyper-specific fitness, workout, macro & recovery response
 */
export async function processAgentQuery(query: string, context: AgentContext): Promise<AgentMessage> {
  const q = query.toLowerCase().trim();
  const todayStr = getToday();
  const streak = selectCurrentWorkoutStreak(context.workouts);
  const macroBudget = calculateTodayMacroBudget(context.meals, context.user.goals);
  const muscleRecovery = calculateMuscleRecoveryMap(context.workouts);

  // Determine scheduled today workout from user's live weekly split
  const todayDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const scheduledSplit = context.weeklySplit.find(s => s.dayIndex === todayDayIndex)
    || context.weeklySplit.find(s => !s.isRest && s.exerciseIds.length > 0)
    || context.weeklySplit[0];

  const latestRecovery = context.recoveryLogs.find(r => r.date === todayStr);
  const readiness = latestRecovery ? latestRecovery.calculatedScore : 88;

  // 1. WORKOUT PLAN & PROGRESSIVE OVERLOAD QUERIES
  if (q.includes('workout') || q.includes('exercise') || q.includes('routine') || q.includes('train') || q.includes('overload') || q.includes('push') || q.includes('pull') || q.includes('legs') || q.includes('split')) {
    if (scheduledSplit.isRest) {
      return {
        id: `agent-msg-${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `### 🌙 Scheduled: **${scheduledSplit.title}**\n\nToday is marked as an **Active Recovery** day in your weekly split.\n\n• **Directives**: Light mobility, 3.5L+ hydration, and 8+ hours quality sleep.\n• **Recovery Score**: \`${readiness}%\` readiness.\n\n> 💡 If you want to train anyway, you can customize your split in the Workout tab!`,
        suggestedPrompts: [
          'What should I eat on rest days?',
          'Analyze my muscle fatigue & recovery score',
          'Show me form cues for bench press'
        ]
      };
    }

    const exerciseRecommendations = (scheduledSplit.exerciseIds || []).map(exId => {
      const canonical = CANONICAL_EXERCISES.find(e => e.id === exId);
      const name = canonical ? canonical.name : exId;
      return calculateExerciseRecommendation(exId, name, context.workouts);
    });

    let content = `### 🦾 Recommended Session: **${scheduledSplit.title}**\n\n`;
    content += `Based on your **${streak}-day consistency streak** and **${readiness}% Recovery Score**, your training targets are calibrated for progressive overload today:\n\n`;

    exerciseRecommendations.forEach((rec, idx) => {
      content += `${idx + 1}. **${rec.exerciseName}**\n`;
      content += `   • **Target**: ${rec.targetSets} sets × ${rec.targetReps} reps @ **${rec.recommendedWeightKg} kg**\n`;
      content += `   • **Status**: \`${rec.badgeText}\` — *${rec.rationale}*\n\n`;
    });

    content += `> 💡 **Coach Focus**: Keep rest periods around 90-120 seconds on compounds to preserve motor unit recruitment.`;

    return {
      id: `agent-msg-${Date.now()}`,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content,
      action: {
        type: 'START_WORKOUT',
        payload: {
          title: scheduledSplit.title,
          exerciseIds: scheduledSplit.exerciseIds
        },
        buttonLabel: `Start ${scheduledSplit.title} Now ⚡`
      },
      suggestedPrompts: [
        'What should I eat post-workout?',
        'How is my recovery & muscle fatigue?',
        'Show me form cues for bench press',
        'Should I increase weights today?'
      ]
    };
  }

  // 2. NUTRITION, MEALS & MACROS QUERIES
  if (q.includes('eat') || q.includes('diet') || q.includes('food') || q.includes('macro') || q.includes('protein') || q.includes('calorie') || q.includes('meal') || q.includes('post-workout') || q.includes('pre-workout') || q.includes('indian')) {
    const remCal = macroBudget.remaining.calories;
    const remPro = macroBudget.remaining.protein;
    const remCarb = macroBudget.remaining.carbs;
    const remFat = macroBudget.remaining.fat;

    let content = `### 🥗 Macro Diagnostic & Meal Blueprint\n\n`;
    content += `**Today's Status**: Logged **${macroBudget.consumed.calories} kcal** / **${macroBudget.targets.calories} kcal** target.\n\n`;
    content += `**Remaining Macro Budget**:\n`;
    content += `• **Calories**: \`${remCal} kcal\`\n`;
    content += `• **Protein**: \`${remPro}g\` (Essential for muscle protein synthesis)\n`;
    content += `• **Carbs**: \`${remCarb}g\` | **Fat**: \`${remFat}g\`\n\n`;

    content += `#### 🍽️ High-Value Fuel Recommendations:\n`;
    if (q.includes('indian') || true) {
      content += `1. **Soya Chunks Bhurji + 2 Whole Wheat Rotis**: ~42g Protein, 380 kcal, 4g Fiber\n`;
      content += `2. **Low-Fat Paneer / Curd Tikka Bowl**: ~32g Protein, 310 kcal, 2.5g Fiber\n`;
      content += `3. **Whey Protein Isolate + 50g Oats Bowl**: ~31g Protein, 280 kcal, 4g Fiber\n`;
      content += `4. **Spiced Chicken Breast Salad (150g)**: ~46g Protein, 245 kcal\n\n`;
    }

    content += `> ⚡ **Nutrient Timing**: Consume at least **30g protein** within 2 hours of training to activate the mTOR anabolic signaling pathway.`;

    return {
      id: `agent-msg-${Date.now()}`,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content,
      action: {
        type: 'QUICK_ADD_MACROS',
        payload: {
          name: 'AI High-Protein Meal Bowl',
          calories: Math.min(remCal, 450),
          protein: Math.min(remPro, 35),
          carbs: Math.min(remCarb, 40),
          fat: Math.min(remFat, 12),
          fiber: 4
        },
        buttonLabel: 'Quick-Log 35g Protein Meal'
      },
      suggestedPrompts: [
        'Give me high-protein vegetarian Indian options',
        'How much water should I drink today?',
        'Calculate my weekly volume load',
        'Am I hitting enough fiber?'
      ]
    };
  }

  // 3. RECOVERY, CNS, SLEEP & SORENESS QUERIES
  if (q.includes('recover') || q.includes('sleep') || q.includes('sore') || q.includes('fatigue') || q.includes('readiness') || q.includes('tired') || q.includes('cns') || q.includes('deload')) {
    let content = `### 🔬 Physiological Readiness & Recovery Analysis\n\n`;
    content += `**Daily Recovery Score**: **${readiness}%** (${readiness >= 80 ? '🟢 Prime Performance Window' : readiness >= 60 ? '🟡 Moderate Readiness' : '🔴 Deload / Active Recovery Recommended'})\n\n`;
    
    content += `#### 🧬 Muscle Group Recovery Radar:\n`;
    Object.entries(muscleRecovery).forEach(([muscle, data]) => {
      const icon = data.status === 'ready' ? '🟢' : data.status === 'recovering' ? '🟡' : '🔴';
      content += `• **${muscle}**: ${icon} ${data.recoveryPct}% (${data.daysSince === 0 ? 'Trained today' : data.daysSince === 99 ? 'Fully fresh' : `${data.daysSince}d ago`})\n`;
    });

    content += `\n**Coach Verdict**:\n`;
    if (readiness >= 80) {
      content += `You are cleared for high-intensity progressive loading. Focus on peak velocity on your compound sets today.`;
    } else {
      content += `Maintain working weights with high technical precision. Add an extra 30s rest between heavy working sets to prevent cumulative fatigue.`;
    }

    return {
      id: `agent-msg-${Date.now()}`,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content,
      suggestedPrompts: [
        'Show me todays workout plan',
        'What should I eat to speed up recovery?',
        'When should I schedule my next rest day?',
        'Analyze my bench press progression'
      ]
    };
  }

  // 4. GENERAL / DEFAULT INTELLIGENT COACHING RESPONSE
  let defaultContent = `### 👋 FitForge AI Head Coach Online\n\n`;
  defaultContent += `I have analyzed your **${context.workouts.length} total logged sessions**, **${streak}-day streak**, **${readiness}% Recovery Score**, and today's **${macroBudget.remaining.protein}g remaining protein target**.\n\n`;
  defaultContent += `Here is your customized focus for today:\n`;
  defaultContent += `1. **Training Focus**: **${scheduledSplit.title}** (${scheduledSplit.exerciseIds.length} exercises ready with ghost weight targets).\n`;
  defaultContent += `2. **Nutrition Directive**: You have **${macroBudget.remaining.calories} kcal** and **${macroBudget.remaining.protein}g protein** left in your daily allowance.\n`;
  defaultContent += `3. **Readiness**: Muscle recovery is optimal at **${readiness}%**.\n\n`;
  defaultContent += `What would you like to optimize next? Ask me about workouts, exercise progression, Indian macro meals, or fatigue breakdown!`;

  return {
    id: `agent-msg-${Date.now()}`,
    sender: 'agent',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    content: defaultContent,
    action: {
      type: 'START_WORKOUT',
      payload: {
        title: scheduledSplit.title,
        exerciseIds: scheduledSplit.exerciseIds
      },
      buttonLabel: `Launch ${scheduledSplit.title} 🚀`
    },
    suggestedPrompts: [
      'Show me todays workout & target weights',
      'What should I eat for my remaining macros?',
      'Analyze my muscle fatigue & recovery score',
      'How can I break my bench press plateau?'
    ]
  };
}
