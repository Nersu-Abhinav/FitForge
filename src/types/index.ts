// ---------------------------------------------------------------------------
// Sync & Distributed State Metadata
// ---------------------------------------------------------------------------
export type EntitySyncStatus = 'synced' | 'pending' | 'failed';

export interface SyncMetadata {
  syncStatus?: EntitySyncStatus;
  createdAt?: string | number;
  updatedAt?: string | number;
  deletedAt?: string | number | null;
  version?: number;
}

export type MuscleGroup = 
  | 'Chest' 
  | 'Back' 
  | 'Shoulders' 
  | 'Biceps' 
  | 'Triceps' 
  | 'Quads' 
  | 'Hamstrings' 
  | 'Glutes' 
  | 'Calves' 
  | 'Abs/Core' 
  | 'Cardio' 
  | 'Full Body';

export type Equipment = 
  | 'Barbell' 
  | 'Dumbbell' 
  | 'Cable' 
  | 'Machine' 
  | 'Bodyweight' 
  | 'Kettlebell' 
  | 'Bands' 
  | 'Cardio Machine';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise extends SyncMetadata {
  id: string;
  name: string;
  category: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: Equipment;
  difficulty: DifficultyLevel;
  instructions: string[];
  formCues: string[];
  commonMistakes: string[];
  recommendedRepRange: string;
  isCustom?: boolean;
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  completedAt?: string;
  previousWeightKg?: number;
  previousReps?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  notes?: string;
  sets: WorkoutSet[];
  order: number;
}

export interface Workout extends SyncMetadata {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO
  endTime?: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  caloriesBurned?: number;
  rating?: number; // 1-5
  notes?: string;
  status: 'in_progress' | 'completed' | 'discarded';
  totalVolumeKg?: number;
  totalSets?: number;
  totalReps?: number;
  prsAchieved?: string[];
}

export interface PersonalRecord extends SyncMetadata {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
  value: number;
  weightKg: number;
  reps: number;
  date: string;
  previousValue?: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface FoodItem extends SyncMetadata {
  id: string;
  name: string;
  aliases?: string[];
  cuisine?: string;
  preparation?: string;
  brand?: string;
  servingSize: string;
  servingUnit: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface MealItem {
  id: string;
  foodId: string;
  name: string;
  servingQuantity: number;
  servingDescription: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Meal extends SyncMetadata {
  id: string;
  type: MealType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  notes?: string;
}

export interface HydrationLog extends SyncMetadata {
  id: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: string;
}

export interface BodyMeasurement extends SyncMetadata {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  shouldersCm?: number;
  neckCm?: number;
  notes?: string;
}

export interface SleepLog extends SyncMetadata {
  id: string;
  date: string;
  durationMinutes: number;
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  qualityScore: number; // 1-100
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
}

export interface RecoveryLog extends SyncMetadata {
  id: string;
  date: string;
  recoveryDate?: string;
  energyLevel: number; // 1-10
  sorenessLevel: number; // 1-10 (10 = very sore)
  stressLevel: number; // 1-10 (10 = very high)
  calculatedScore: number; // 1-100
  recoveryScore?: number; // 1-100
  notes?: string;
}

export interface FitnessGoals {
  goalType: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'maintenance';
  targetWeightKg: number;
  targetBodyFatPct?: number;
  targetSleepHours?: number; // e.g. 8.0 hours
  dailyCalories: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
  dailyWaterMl: number;
  weeklyWorkoutsTarget: number;
}

export interface UserProfile extends SyncMetadata {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  birthDate?: string;
  heightCm: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  unitSystem: 'metric' | 'imperial';
  goals: FitnessGoals;
  joinedDate: string;
}

export interface AIInsight {
  id: string;
  category: 'workout' | 'nutrition' | 'recovery' | 'streak' | 'pr';
  title: string;
  message: string;
  impact: 'positive' | 'neutral' | 'warning' | 'celebration';
  actionableTip?: string;
  date: string;
}

export interface DailySummary {
  date: string;
  caloriesConsumed: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
  workoutCompleted: boolean;
  workoutTitle?: string;
  workoutDurationMin?: number;
  totalVolumeKg?: number;
  sleepMinutes?: number;
  sleepQuality?: number;
  recoveryScore?: number;
  weightKg?: number;
  completionScore: number; // 0 - 100
}
