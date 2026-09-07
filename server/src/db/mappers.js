// ============================================================================
// FitForge Database & Domain Data Mappers (Single Source of Truth)
// Architecture: TypeScript Domain Model <-> DTO / API <-> DB Mapper <-> TiDB Schema
// ============================================================================

export const DEFAULT_USER_ID = 'usr-abhinav-01';

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDate(val) {
  if (!val) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof val === 'string') {
    return val.split('T')[0].slice(0, 10);
  }
  return String(val);
}

/**
 * Format Time to HH:MM:SS or HH:MM
 */
export function formatTime(val, defaultVal = '12:00:00') {
  if (!val) return defaultVal;
  if (val instanceof Date) return val.toTimeString().slice(0, 8);
  if (typeof val === 'string') {
    if (val.length === 5) return `${val}:00`;
    return val.slice(0, 8);
  }
  return defaultVal;
}

// ---------------------------------------------------------------------------
// 1. USER & FITNESS GOALS MAPPER
// ---------------------------------------------------------------------------
export const UserMapper = {
  toDomain(userRow = {}, goalRow = {}) {
    return {
      id: userRow.id || DEFAULT_USER_ID,
      name: userRow.name || 'Abhinav',
      email: userRow.email || 'abhinav@fitforge.app',
      heightCm: parseFloat(userRow.height_cm) || 180.0,
      fitnessLevel: userRow.fitness_level || 'intermediate',
      unitSystem: userRow.unit_system || 'metric',
      joinedDate: userRow.created_at ? formatDate(userRow.created_at) : '2026-01-15',
      goals: {
        goalType: goalRow.goal_type || 'muscle_gain',
        targetWeightKg: parseFloat(goalRow.target_weight_kg) || 78.5,
        targetBodyFatPct: parseFloat(goalRow.target_body_fat_pct) || 12.0,
        dailyCalories: parseInt(goalRow.daily_calories, 10) || 2600,
        dailyProteinGrams: parseFloat(goalRow.daily_protein_g) || 160,
        dailyCarbsGrams: parseFloat(goalRow.daily_carbs_g) || 280,
        dailyFatGrams: parseFloat(goalRow.daily_fat_g) || 75,
        dailyWaterMl: parseInt(goalRow.daily_water_ml, 10) || 3500,
        weeklyWorkoutsTarget: parseInt(goalRow.weekly_workouts_target, 10) || 5
      }
    };
  }
};

// ---------------------------------------------------------------------------
// 2. HYDRATION MAPPER
// ---------------------------------------------------------------------------
export const HydrationMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    return {
      id: dto.id || `hydro-${Date.now()}`,
      user_id: dto.userId || defaultUserId,
      log_date: formatDate(dto.logDate || dto.date),
      amount_ml: parseInt(dto.amountMl, 10) || 250
    };
  },

  toDomain(row) {
    return {
      id: row.id,
      userId: row.user_id,
      date: formatDate(row.log_date),
      amountMl: parseInt(row.amount_ml, 10) || 0,
      timestamp: row.logged_at ? (typeof row.logged_at === 'string' ? row.logged_at.slice(11, 16) : new Date(row.logged_at).toTimeString().slice(0, 5)) : '12:00'
    };
  }
};

// ---------------------------------------------------------------------------
// 3. BODY MEASUREMENTS MAPPER
// ---------------------------------------------------------------------------
export const BodyMeasurementMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    const userId = dto.userId || defaultUserId;
    const mDate = formatDate(dto.measurementDate || dto.date);
    const canonicalId = (dto.id && dto.id.startsWith('bm-')) ? dto.id : `bm-${mDate}`;
    return {
      id: canonicalId,
      user_id: userId,
      measurement_date: mDate,
      weight_kg: dto.weightKg ? parseFloat(dto.weightKg) : 75.0,
      body_fat_pct: dto.bodyFatPct !== undefined && dto.bodyFatPct !== null ? parseFloat(dto.bodyFatPct) : null,
      chest_cm: dto.chestCm !== undefined && dto.chestCm !== null ? parseFloat(dto.chestCm) : null,
      waist_cm: dto.waistCm !== undefined && dto.waistCm !== null ? parseFloat(dto.waistCm) : null,
      hips_cm: dto.hipsCm !== undefined && dto.hipsCm !== null ? parseFloat(dto.hipsCm) : null,
      arms_cm: dto.armsCm !== undefined && dto.armsCm !== null ? parseFloat(dto.armsCm) : null,
      thighs_cm: dto.thighsCm !== undefined && dto.thighsCm !== null ? parseFloat(dto.thighsCm) : null,
      shoulders_cm: dto.shouldersCm !== undefined && dto.shouldersCm !== null ? parseFloat(dto.shouldersCm) : null,
      neck_cm: dto.neckCm !== undefined && dto.neckCm !== null ? parseFloat(dto.neckCm) : null,
      notes: dto.notes || null
    };
  },

  toDomain(row) {
    const mDate = formatDate(row.measurement_date);
    return {
      id: row.id || `bm-${mDate}`,
      date: mDate,
      measurementDate: mDate,
      weightKg: parseFloat(row.weight_kg) || 0,
      bodyFatPct: row.body_fat_pct !== null ? parseFloat(row.body_fat_pct) : undefined,
      chestCm: row.chest_cm !== null ? parseFloat(row.chest_cm) : undefined,
      waistCm: row.waist_cm !== null ? parseFloat(row.waist_cm) : undefined,
      hipsCm: row.hips_cm !== null ? parseFloat(row.hips_cm) : undefined,
      armsCm: row.arms_cm !== null ? parseFloat(row.arms_cm) : undefined,
      thighsCm: row.thighs_cm !== null ? parseFloat(row.thighs_cm) : undefined,
      shouldersCm: row.shoulders_cm !== null ? parseFloat(row.shoulders_cm) : undefined,
      neckCm: row.neck_cm !== null ? parseFloat(row.neck_cm) : undefined,
      notes: row.notes || undefined
    };
  }
};

// ---------------------------------------------------------------------------
// 4. SLEEP LOGS MAPPER
// ---------------------------------------------------------------------------
export const SleepMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    const userId = dto.userId || defaultUserId;
    const sDate = formatDate(dto.sleepDate || dto.date);
    const canonicalId = (dto.id && dto.id.startsWith('sleep-')) ? dto.id : `sleep-${sDate}`;
    return {
      id: canonicalId,
      user_id: userId,
      sleep_date: sDate,
      duration_minutes: parseInt(dto.durationMinutes, 10) || 480,
      bedtime: formatTime(dto.bedtime, '23:00:00'),
      wake_time: formatTime(dto.wakeTime, '07:00:00'),
      quality_score: parseInt(dto.qualityScore, 10) || 85
    };
  },

  toDomain(row) {
    const sDate = formatDate(row.sleep_date);
    return {
      id: row.id || `sleep-${sDate}`,
      date: sDate,
      sleepDate: sDate,
      durationMinutes: parseInt(row.duration_minutes, 10) || 0,
      bedtime: typeof row.bedtime === 'string' ? row.bedtime.slice(0, 5) : '23:00',
      wakeTime: typeof row.wake_time === 'string' ? row.wake_time.slice(0, 5) : '07:00',
      qualityScore: parseInt(row.quality_score, 10) || 80
    };
  }
};

// ---------------------------------------------------------------------------
// 5. RECOVERY LOGS MAPPER
// ---------------------------------------------------------------------------
export const RecoveryMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    const userId = dto.userId || defaultUserId;
    const rDate = formatDate(dto.recoveryDate || dto.date);
    const score = dto.recoveryScore ?? dto.calculatedScore ?? 85;
    const canonicalId = (dto.id && dto.id.startsWith('recovery-')) ? dto.id : `recovery-${rDate}`;
    return {
      id: canonicalId,
      user_id: userId,
      recovery_date: rDate,
      energy_level: parseInt(dto.energyLevel, 10) || 8,
      soreness_level: parseInt(dto.sorenessLevel, 10) || 3,
      stress_level: parseInt(dto.stressLevel, 10) || 3,
      recovery_score: parseInt(score, 10) || 85,
      notes: dto.notes || null
    };
  },

  toDomain(row) {
    const rDate = formatDate(row.recovery_date);
    return {
      id: row.id || `recovery-${rDate}`,
      date: rDate,
      recoveryDate: rDate,
      energyLevel: parseInt(row.energy_level, 10) || 8,
      sorenessLevel: parseInt(row.soreness_level, 10) || 3,
      stressLevel: parseInt(row.stress_level, 10) || 3,
      calculatedScore: parseInt(row.recovery_score, 10) || 85,
      recoveryScore: parseInt(row.recovery_score, 10) || 85,
      notes: row.notes || undefined
    };
  }
};

// ---------------------------------------------------------------------------
// 6. WORKOUTS (RELATIONAL) MAPPER
// ---------------------------------------------------------------------------
export const WorkoutMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    return {
      id: dto.id,
      user_id: dto.userId || defaultUserId,
      name: dto.name || 'Workout Session',
      workout_date: formatDate(dto.date || dto.workoutDate),
      start_time: dto.startTime ? new Date(dto.startTime) : new Date(),
      end_time: dto.endTime ? new Date(dto.endTime) : new Date(),
      duration_seconds: parseInt(dto.durationSeconds, 10) || 0,
      calories_burned: parseInt(dto.caloriesBurned, 10) || 0,
      rating: parseInt(dto.rating, 10) || 5,
      status: dto.status || 'completed',
      total_volume_kg: parseFloat(dto.totalVolumeKg) || 0,
      notes: dto.notes || ''
    };
  },

  toDomain(workoutRow, exercises = [], sets = []) {
    const workoutExercises = exercises
      .filter(we => we.workout_id === workoutRow.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(we => {
        const exSets = sets
          .filter(s => s.workout_exercise_id === we.id)
          .sort((a, b) => (a.set_number || 0) - (b.set_number || 0))
          .map(s => ({
            id: s.id,
            setNumber: parseInt(s.set_number, 10) || 1,
            type: s.set_type || 'normal',
            weightKg: parseFloat(s.weight_kg) || 0,
            reps: parseInt(s.reps, 10) || 0,
            rpe: s.rpe ? parseFloat(s.rpe) : undefined,
            completed: Boolean(s.completed),
            completedAt: s.completed_at ? new Date(s.completed_at).toISOString() : undefined
          }));

        return {
          id: we.id,
          exerciseId: we.exercise_id,
          exerciseName: we.exercise_name || 'Exercise',
          muscleGroup: we.muscle_group || 'Full Body',
          order: parseInt(we.order_index, 10) || 1,
          notes: we.notes || undefined,
          sets: exSets
        };
      });

    let totalSets = 0;
    let totalReps = 0;
    workoutExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalSets++;
          totalReps += s.reps;
        }
      });
    });

    return {
      id: workoutRow.id,
      userId: workoutRow.user_id,
      name: workoutRow.name,
      date: formatDate(workoutRow.workout_date),
      startTime: workoutRow.start_time ? new Date(workoutRow.start_time).toISOString() : new Date().toISOString(),
      endTime: workoutRow.end_time ? new Date(workoutRow.end_time).toISOString() : new Date().toISOString(),
      durationSeconds: parseInt(workoutRow.duration_seconds, 10) || 0,
      caloriesBurned: parseInt(workoutRow.calories_burned, 10) || 0,
      rating: parseInt(workoutRow.rating, 10) || 5,
      status: workoutRow.status || 'completed',
      totalVolumeKg: parseFloat(workoutRow.total_volume_kg) || 0,
      totalSets,
      totalReps,
      exercises: workoutExercises,
      notes: workoutRow.notes || ''
    };
  }
};

// ---------------------------------------------------------------------------
// 7. MEALS (RELATIONAL) MAPPER
// ---------------------------------------------------------------------------
export const MealMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    return {
      id: dto.id,
      user_id: dto.userId || defaultUserId,
      meal_type: dto.type || 'lunch',
      meal_date: formatDate(dto.date || dto.mealDate),
      meal_time: formatTime(dto.time, '12:00:00'),
      total_calories: parseInt(dto.totalCalories, 10) || 0,
      total_protein_g: parseFloat(dto.totalProtein) || 0,
      total_carbs_g: parseFloat(dto.totalCarbs) || 0,
      total_fat_g: parseFloat(dto.totalFat) || 0,
      total_fiber_g: parseFloat(dto.totalFiber) || 0,
      notes: dto.notes || ''
    };
  },

  toDomain(mealRow, mealItems = []) {
    const items = mealItems
      .filter(i => i.meal_id === mealRow.id)
      .map(i => ({
        id: i.id,
        foodId: i.food_id,
        name: i.food_name || 'Food Item',
        servingQuantity: parseFloat(i.quantity) || 1,
        servingDescription: i.serving_size || '1 serving',
        calories: parseInt(i.calculated_calories, 10) || 0,
        protein: parseFloat(i.calculated_protein_g) || 0,
        carbs: parseFloat(i.calculated_carbs_g) || 0,
        fat: parseFloat(i.calculated_fat_g) || 0,
        fiber: parseFloat(i.calculated_fiber_g !== undefined ? i.calculated_fiber_g : (i.fiber_g !== undefined ? i.fiber_g : 0)) || 0
      }));

    return {
      id: mealRow.id,
      type: mealRow.meal_type,
      date: formatDate(mealRow.meal_date),
      time: typeof mealRow.meal_time === 'string' ? mealRow.meal_time.slice(0, 5) : '12:00',
      totalCalories: parseInt(mealRow.total_calories, 10) || 0,
      totalProtein: parseFloat(mealRow.total_protein_g) || 0,
      totalCarbs: parseFloat(mealRow.total_carbs_g) || 0,
      totalFat: parseFloat(mealRow.total_fat_g) || 0,
      totalFiber: parseFloat(mealRow.total_fiber_g) || 0,
      items
    };
  }
};

// ---------------------------------------------------------------------------
// 8. EXERCISE (CUSTOM & LIBRARY) MAPPER
// ---------------------------------------------------------------------------
export const ExerciseMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    const parseJsonArray = (val) => {
      if (!val) return JSON.stringify([]);
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([val]);
        } catch {
          return JSON.stringify([val]);
        }
      }
      return JSON.stringify(val);
    };

    return {
      id: dto.id || `custom-ex-${Date.now()}`,
      name: dto.name || 'Custom Exercise',
      category: dto.category || 'Strength',
      muscle_group: dto.muscleGroup || 'Full Body',
      secondary_muscles: parseJsonArray(dto.secondaryMuscles),
      equipment: dto.equipment || 'Barbell',
      difficulty: dto.difficulty || 'Intermediate',
      instructions: parseJsonArray(dto.instructions),
      form_cues: parseJsonArray(dto.formCues),
      common_mistakes: parseJsonArray(dto.commonMistakes),
      recommended_rep_range: dto.recommendedRepRange || '8-12 reps',
      is_custom: dto.isCustom !== undefined ? (dto.isCustom ? 1 : 0) : 1,
      user_id: dto.userId || defaultUserId
    };
  },

  toDomain(row) {
    const safeParse = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const res = JSON.parse(val);
          return Array.isArray(res) ? res : [val];
        } catch {
          return [val];
        }
      }
      return [];
    };

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      muscleGroup: row.muscle_group,
      secondaryMuscles: safeParse(row.secondary_muscles),
      equipment: row.equipment,
      difficulty: row.difficulty || 'Intermediate',
      instructions: safeParse(row.instructions),
      formCues: safeParse(row.form_cues),
      commonMistakes: safeParse(row.common_mistakes),
      recommendedRepRange: row.recommended_rep_range || '8-12 reps',
      isCustom: Boolean(row.is_custom),
      userId: row.user_id || undefined
    };
  }
};

// ---------------------------------------------------------------------------
// 9. FOOD ITEMS (CUSTOM & LIBRARY) MAPPER
// ---------------------------------------------------------------------------
export const FoodItemMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    return {
      id: dto.id || `food-custom-${Date.now()}`,
      name: dto.name || 'Custom Food',
      brand: dto.brand || null,
      serving_size: dto.servingSize || '1 serving',
      serving_unit: dto.servingUnit || 'g',
      serving_grams: parseFloat(dto.servingGrams) || 100.0,
      calories: parseFloat(dto.calories) || 0,
      protein_g: parseFloat(dto.protein) || 0,
      carbs_g: parseFloat(dto.carbs) || 0,
      fat_g: parseFloat(dto.fat) || 0,
      fiber_g: parseFloat(dto.fiber) || 0,
      sugar_g: parseFloat(dto.sugar) || 0,
      sodium_mg: parseFloat(dto.sodium) || 0,
      is_custom: dto.isCustom !== undefined ? (dto.isCustom ? 1 : 0) : 1,
      user_id: dto.userId || defaultUserId
    };
  },

  toDomain(row) {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand || undefined,
      servingSize: row.serving_size || '1 serving',
      servingUnit: row.serving_unit || 'g',
      servingGrams: parseFloat(row.serving_grams) || 100,
      calories: parseFloat(row.calories) || 0,
      protein: parseFloat(row.protein_g) || 0,
      carbs: parseFloat(row.carbs_g) || 0,
      fat: parseFloat(row.fat_g) || 0,
      fiber: parseFloat(row.fiber_g) || 0,
      sugar: parseFloat(row.sugar_g) || 0,
      sodium: parseFloat(row.sodium_mg) || 0,
      isCustom: Boolean(row.is_custom),
      userId: row.user_id || undefined
    };
  }
};

// ---------------------------------------------------------------------------
// 10. USER WEEKLY SPLIT MAPPER
// ---------------------------------------------------------------------------
export const SplitMapper = {
  toRow(dto, defaultUserId = DEFAULT_USER_ID) {
    return {
      id: dto.id || `split-${defaultUserId}-${dto.dayIndex}`,
      user_id: dto.userId || defaultUserId,
      day_name: dto.dayName,
      day_short: dto.dayShort,
      day_index: dto.dayIndex,
      title: dto.title,
      subtitle: dto.subtitle || '',
      tag: dto.tag || '',
      selected_muscles: JSON.stringify(dto.selectedMuscles || []),
      is_rest: dto.isRest ? 1 : 0,
      exercise_ids: JSON.stringify(dto.exerciseIds || []),
      estimated_minutes: parseInt(dto.estimatedMinutes || 60, 10),
      overview_notes: dto.overviewNotes || ''
    };
  },

  toDomain(row) {
    const safeParse = (val) => {
      try {
        return typeof val === 'string' ? JSON.parse(val) : (val || []);
      } catch {
        return [];
      }
    };
    return {
      dayName: row.day_name,
      dayShort: row.day_short,
      dayIndex: row.day_index,
      title: row.title,
      subtitle: row.subtitle || '',
      tag: row.tag || '',
      selectedMuscles: safeParse(row.selected_muscles),
      isRest: Boolean(row.is_rest),
      exerciseIds: safeParse(row.exercise_ids),
      estimatedMinutes: parseInt(row.estimated_minutes || 0, 10),
      overviewNotes: row.overview_notes || ''
    };
  }
};
