// ============================================================================
// FitForge Offline-First API & TiDB Synchronization Client
// Architecture: Mobile / App -> Local IndexedDB -> Sync Queue -> API -> TiDB Cloud
// ============================================================================

import { localDb, SyncQueueItem } from './localDb';
import { syncEngine } from './syncEngine';
import { usePersistenceStore, PersistenceEvent } from '@/store/usePersistenceStore';
import { classifySyncError } from './syncErrorClassifier';
import { getToday } from '@/utils/date';

export const DEFAULT_CLOUD_API_URL = 'https://fitforge-ji4u.onrender.com/api';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('fitforge_custom_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 24/7 Global TiDB Cloud Production Backend URL on Render
  return DEFAULT_CLOUD_API_URL;
}

export const API_BASE = getApiBaseUrl();

export function resolveApiUrl(endpoint: string): string {
  const currentBase = getApiBaseUrl();
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    // Automatically migrate legacy full URL records from IndexedDB
    try {
      const url = new URL(endpoint);
      const pathname = url.pathname.replace(/^\/api/, '');
      return `${currentBase}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
    } catch {
      return endpoint;
    }
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${currentBase}${cleanEndpoint}`;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: any;
  try {
    data = await res.json();
  } catch (err) {
    data = { error: res.statusText };
  }

  if (!res.ok || data?.success === false) {
    const errorMsg = data?.error || `HTTP ${res.status}: ${res.statusText}`;
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}

async function handleMutationError<T>(
  err: any,
  evtId: string,
  entity: PersistenceEvent['entity'],
  type: SyncQueueItem['type'],
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  payload: any,
  fallbackData: T
): Promise<T> {
  const classification = classifySyncError(err);

  if (classification.action === 'RESOLVE_CONFLICT') {
    console.info(`[API] Conflict resolved for ${endpoint} (duplicate record on server)`);
    usePersistenceStore.getState().setSaved(evtId, entity, 'Synchronized with cloud record');
    return fallbackData;
  }

  if (classification.action === 'PERMANENT_FAILURE') {
    console.error(`[API] Mutation permanently rejected (${classification.statusCode}):`, err.message);
    usePersistenceStore.getState().setFailed(evtId, entity, `Error ${classification.statusCode}: ${err.message}`);
    throw err;
  }

  // Network / Offline / 5xx Server Error -> Enqueue to offline sync queue
  console.warn(`[API] Network or retryable server error (${classification.action}), queuing for offline sync:`, err.message);
  await syncEngine.enqueue(type, endpoint, method, payload);
  usePersistenceStore.getState().setQueued(evtId, entity, 'Saved locally • Queued for sync');
  return fallbackData;
}

export interface HealthStatus {
  success: boolean;
  status: 'online' | 'offline' | 'error';
  database: 'connected' | 'disconnected';
  databaseName?: string;
  latencyMs: number;
  version?: string;
  tableCount?: number;
  timestamp?: string;
  counts?: {
    workouts?: number;
    workoutExercises?: number;
    workoutSets?: number;
    meals?: number;
    mealItems?: number;
    hydration?: number;
  };
}

export const api = {
  // Initialize sync engine & register sync handler
  init(syncCallback?: () => Promise<any>) {
    syncEngine.init(syncCallback || (() => this.syncAll()));
  },

  // Health check & real-time infrastructure probe
  async getHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await handleResponse<HealthStatus>(res);
      return data;
    } catch (err: any) {
      return {
        success: false,
        status: 'offline',
        database: 'disconnected',
        latencyMs: Date.now() - startTime
      };
    }
  },

  // 1. Load Local State (Instant Offline Access)
  async loadLocalState() {
    try {
      const [workouts, meals, hydration, measurements, sleepLogs, recoveryLogs, userProfiles, customExercises, customFoods, favoriteFoodObjs] = await Promise.all([
        localDb.getAll('workouts'),
        localDb.getAll('meals'),
        localDb.getAll('hydration'),
        localDb.getAll('measurements'),
        localDb.getAll('sleepLogs'),
        localDb.getAll('recoveryLogs'),
        localDb.getAll('userProfile'),
        localDb.getAll('customExercises'),
        localDb.getAll('customFoods'),
        localDb.getAll('favoriteFoodIds')
      ]);

      const favoriteFoodIds = ((favoriteFoodObjs || []) as any[]).map(f => f.id || f.foodId);

      return {
        success: true,
        offline: true,
        user: userProfiles[0] || null,
        workouts: workouts || [],
        meals: meals || [],
        hydration: hydration || [],
        measurements: measurements || [],
        sleepLogs: sleepLogs || [],
        recoveryLogs: recoveryLogs || [],
        customExercises: customExercises || [],
        customFoods: customFoods || [],
        favoriteFoodIds
      };
    } catch (localErr) {
      console.error('Local IndexedDB load error:', localErr);
      return null;
    }
  },

  /**
   * Correct 7-Step Synchronization Sequence:
   * 1. Load local DB (IndexedDB)
   * 2. Load pending queue
   * 3. Push local pending mutations to TiDB (drain queue first!)
   * 4. Pull latest TiDB state
   * 5. Merge / reconcile local pending mutations with server state
   * 6. Update local DB (IndexedDB)
   * 7. Return reconciled state for Zustand
   */
  async syncAll() {
    // Step 1: Load local state from IndexedDB
    const localData = await this.loadLocalState();

    // If offline, return local data immediately
    if (!navigator.onLine) {
      await syncEngine.refreshPendingCount();
      return localData;
    }

    try {
      // Step 2 & 3: Load pending queue & PUSH local pending mutations FIRST!
      await syncEngine.drainQueue();

      // Step 4: PULL latest TiDB state
      const res = await fetch(`${API_BASE}/sync/all`);
      if (!res.ok) {
        throw new Error(`Failed to pull server sync state: HTTP ${res.status}`);
      }
      const serverData = await res.json();
      if (!serverData || !serverData.success) {
        return localData;
      }

      // Step 5 & 6: Safe Non-Destructive Entity Reconciliation
      // Safely merges server state into local IndexedDB without store.clear(), preserving pending mutations & newer timestamps
      const [
        reconciledWorkouts,
        reconciledMeals,
        reconciledHydration,
        reconciledMeasurements,
        reconciledSleep,
        reconciledRecovery,
        reconciledCustomExercises,
        reconciledCustomFoods
      ] = await Promise.all([
        localDb.reconcileEntities('workouts', serverData.workouts || []),
        localDb.reconcileEntities('meals', serverData.meals || []),
        localDb.reconcileEntities('hydration', serverData.hydration || []),
        localDb.reconcileEntities('measurements', serverData.measurements || []),
        localDb.reconcileEntities('sleepLogs', serverData.sleepLogs || []),
        localDb.reconcileEntities('recoveryLogs', serverData.recoveryLogs || []),
        localDb.reconcileEntities('customExercises', serverData.customExercises || []),
        localDb.reconcileEntities('customFoods', serverData.customFoods || [])
      ]);

      if (serverData.user) {
        await localDb.put('userProfile', serverData.user);
      }

      if (serverData.favoriteFoodIds && Array.isArray(serverData.favoriteFoodIds)) {
        await localDb.setAll(
          'favoriteFoodIds',
          serverData.favoriteFoodIds.map((id: string) => ({ id, foodId: id }))
        );
      }

      if (serverData.weeklySplit && Array.isArray(serverData.weeklySplit) && serverData.weeklySplit.length === 7) {
        localStorage.setItem('fitforge_custom_split', JSON.stringify(serverData.weeklySplit));
      }

      const reconciled = {
        success: true,
        user: serverData.user || localData?.user || null,
        workouts: reconciledWorkouts,
        meals: reconciledMeals,
        hydration: reconciledHydration,
        measurements: reconciledMeasurements,
        sleepLogs: reconciledSleep,
        recoveryLogs: reconciledRecovery,
        customExercises: reconciledCustomExercises,
        customFoods: reconciledCustomFoods,
        favoriteFoodIds: serverData.favoriteFoodIds || localData?.favoriteFoodIds || [],
        weeklySplit: serverData.weeklySplit || null
      };

      // Step 7: Return reconciled state to update Zustand
      return reconciled;
    } catch (err) {
      console.warn('Network sync failed, falling back safely to local data:', err);
      return localData;
    }
  },

  // User Profile
  async getUserProfile() {
    try {
      const res = await fetch(`${API_BASE}/user/profile`);
      const data = await handleResponse<{ success: boolean; user: any }>(res);
      await localDb.put('userProfile', data.user);
      return data.user;
    } catch (err) {
      const cached = await localDb.getAll('userProfile');
      return cached[0] || null;
    }
  },

  async updateUserProfile(profile: any) {
    const evtId = usePersistenceStore.getState().setSaving('profile', 'Updating user profile...');
    await localDb.put('userProfile', profile);
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await handleResponse<{ success: boolean; user: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'profile', 'Profile saved to cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'profile',
        'profile',
        '/user/profile',
        'PUT',
        profile,
        { success: true, offline: true, user: profile }
      );
    }
  },

  // Workouts (Offline-First)
  async getWorkouts() {
    try {
      const res = await fetch(`${API_BASE}/workouts`);
      const data = await handleResponse<{ success: boolean; workouts: any[] }>(res);
      await localDb.setAll('workouts', data.workouts || []);
      return data.workouts || [];
    } catch (err) {
      return await localDb.getAll('workouts');
    }
  },

  async saveWorkout(workout: any) {
    const evtId = usePersistenceStore.getState().setSaving('workout', `Saving ${workout.name || 'Workout'}...`);
    // 1. Immediately save to Local IndexedDB
    await localDb.put('workouts', workout);

    // 2. Attempt remote TiDB Cloud persist
    try {
      const res = await fetch(`${API_BASE}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout)
      });
      const data = await handleResponse<{ success: boolean; workout: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'workout', 'Workout saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'workout',
        'workout',
        '/workouts',
        'POST',
        workout,
        { success: true, offline: true, workout }
      );
    }
  },

  async deleteWorkout(id: string) {
    const evtId = usePersistenceStore.getState().setSaving('workout', 'Deleting workout session...');
    await localDb.delete('workouts', id);
    try {
      const res = await fetch(`${API_BASE}/workouts/${id}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'workout', 'Workout deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'workout',
        'workout',
        `/workouts/${id}`,
        'DELETE',
        { id },
        { success: true, offline: true, id }
      );
    }
  },

  // Weekly Split (Direct TiDB Cloud Persistence)
  async getWeeklySplit() {
    try {
      const res = await fetch(`${API_BASE}/split`);
      const data = await handleResponse<{ success: boolean; split: any[] }>(res);
      if (data.split && Array.isArray(data.split) && data.split.length === 7) {
        localStorage.setItem('fitforge_custom_split', JSON.stringify(data.split));
        return data.split;
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveWeeklySplit(split: any[]) {
    const evtId = usePersistenceStore.getState().setSaving('workout', 'Saving weekly training architecture...');
    try {
      localStorage.setItem('fitforge_custom_split', JSON.stringify(split));
      const res = await fetch(`${API_BASE}/split`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(split)
      });
      const data = await handleResponse<{ success: boolean; count: number }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'workout', 'Weekly split saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'workout',
        'split',
        '/split',
        'PUT',
        split,
        { success: true, offline: true, split }
      );
    }
  },

  // Custom Exercises (Offline-First)
  async getCustomExercises() {
    try {
      const res = await fetch(`${API_BASE}/exercises`);
      const data = await handleResponse<{ success: boolean; exercises: any[] }>(res);
      await localDb.setAll('customExercises', data.exercises || []);
      return data.exercises || [];
    } catch (err) {
      return await localDb.getAll('customExercises');
    }
  },

  async saveCustomExercise(exercise: any) {
    const evtId = usePersistenceStore.getState().setSaving('workout', `Saving ${exercise.name || 'Exercise'}...`);
    // 1. Immediately save to Local IndexedDB
    await localDb.put('customExercises', {
      ...exercise,
      syncStatus: 'pending'
    });

    // 2. Attempt remote TiDB Cloud persist
    try {
      const res = await fetch(`${API_BASE}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exercise)
      });
      const data = await handleResponse<{ success: boolean; exercise: any }>(res);
      const savedEx = { ...data.exercise, syncStatus: 'synced' };
      await localDb.put('customExercises', savedEx);
      usePersistenceStore.getState().setSaved(evtId, 'workout', 'Custom exercise saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'workout',
        'exercise',
        '/exercises',
        'POST',
        exercise,
        { success: true, offline: true, exercise }
      );
    }
  },

  async deleteCustomExercise(id: string) {
    const evtId = usePersistenceStore.getState().setSaving('workout', 'Deleting custom exercise...');
    await localDb.delete('customExercises', id);
    try {
      const res = await fetch(`${API_BASE}/exercises/${id}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'workout', 'Custom exercise deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'workout',
        'exercise',
        `/exercises/${id}`,
        'DELETE',
        { id },
        { success: true, offline: true, id }
      );
    }
  },

  // Meals (Offline-First)
  async getMeals(date?: string) {
    try {
      const url = date ? `${API_BASE}/meals?date=${date}` : `${API_BASE}/meals`;
      const res = await fetch(url);
      const data = await handleResponse<{ success: boolean; meals: any[] }>(res);
      return data.meals || [];
    } catch (err) {
      return await localDb.getAll('meals');
    }
  },

  async saveMeal(meal: any) {
    const evtId = usePersistenceStore.getState().setSaving('meal', `Saving ${meal.type || 'Meal'}...`);
    await localDb.put('meals', meal);
    try {
      const res = await fetch(`${API_BASE}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal)
      });
      const data = await handleResponse<{ success: boolean; meal: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'meal', 'Meal saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'meal',
        'meal',
        '/meals',
        'POST',
        meal,
        { success: true, offline: true, meal }
      );
    }
  },

  async deleteMeal(id: string) {
    const evtId = usePersistenceStore.getState().setSaving('meal', 'Deleting meal...');
    await localDb.delete('meals', id);
    try {
      const res = await fetch(`${API_BASE}/meals/${id}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'meal', 'Meal deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'meal',
        'meal',
        `/meals/${id}`,
        'DELETE',
        { id },
        { success: true, offline: true, id }
      );
    }
  },

  // Custom Foods (Offline-First)
  async getCustomFoods() {
    try {
      const res = await fetch(`${API_BASE}/foods`);
      const data = await handleResponse<{ success: boolean; foods: any[] }>(res);
      await localDb.setAll('customFoods', data.foods || []);
      return data.foods || [];
    } catch (err) {
      return await localDb.getAll('customFoods');
    }
  },

  async saveCustomFood(food: any) {
    const evtId = usePersistenceStore.getState().setSaving('meal', `Saving ${food.name || 'Food'}...`);
    // 1. Immediately save to Local IndexedDB
    await localDb.put('customFoods', {
      ...food,
      syncStatus: 'pending'
    });

    // 2. Attempt remote TiDB Cloud persist
    try {
      const res = await fetch(`${API_BASE}/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food)
      });
      const data = await handleResponse<{ success: boolean; food: any }>(res);
      const savedFood = { ...data.food, syncStatus: 'synced' };
      await localDb.put('customFoods', savedFood);
      usePersistenceStore.getState().setSaved(evtId, 'meal', 'Custom food saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'meal',
        'food',
        '/foods',
        'POST',
        food,
        { success: true, offline: true, food }
      );
    }
  },

  async deleteCustomFood(id: string) {
    const evtId = usePersistenceStore.getState().setSaving('meal', 'Deleting custom food...');
    await localDb.delete('customFoods', id);
    try {
      const res = await fetch(`${API_BASE}/foods/${id}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'meal', 'Custom food deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'meal',
        'food',
        `/foods/${id}`,
        'DELETE',
        { id },
        { success: true, offline: true, id }
      );
    }
  },

  // Favorite Foods (Offline-First)
  async getFavoriteFoodIds() {
    try {
      const res = await fetch(`${API_BASE}/foods/favorites`);
      const data = await handleResponse<{ success: boolean; favoriteFoodIds: string[] }>(res);
      await localDb.setAll('favoriteFoodIds', (data.favoriteFoodIds || []).map(id => ({ id, foodId: id })));
      return data.favoriteFoodIds || [];
    } catch (err) {
      const cached = await localDb.getAll<any>('favoriteFoodIds');
      return (cached || []).map(c => c.id || c.foodId);
    }
  },

  async toggleFavoriteFood(foodId: string, isFavorite: boolean) {
    const evtId = usePersistenceStore.getState().setSaving('meal', isFavorite ? 'Adding food to favorites...' : 'Removing food from favorites...');
    if (isFavorite) {
      await localDb.put('favoriteFoodIds', { id: foodId, foodId });
    } else {
      await localDb.delete('favoriteFoodIds', foodId);
    }

    try {
      const res = await fetch(`${API_BASE}/foods/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId, isFavorite })
      });
      const data = await handleResponse<{ success: boolean; foodId: string; isFavorite: boolean }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'meal', isFavorite ? 'Added to favorites' : 'Removed from favorites');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'meal',
        'favorite_food',
        '/foods/favorites',
        'POST',
        { foodId, isFavorite },
        { success: true, offline: true, foodId, isFavorite }
      );
    }
  },

  // Hydration (Offline-First)
  async getHydration(date?: string) {
    try {
      const url = date ? `${API_BASE}/hydration?date=${date}` : `${API_BASE}/hydration`;
      const res = await fetch(url);
      const data = await handleResponse<{ success: boolean; hydrationLogs: any[] }>(res);
      return data.hydrationLogs || [];
    } catch (err) {
      return await localDb.getAll('hydration');
    }
  },

  async logHydration(logOrAmount: number | { id?: string; amountMl: number; date?: string; timestamp?: string }, date?: string, id?: string) {
    let entry: { id: string; amountMl: number; date: string; timestamp: string };
    if (typeof logOrAmount === 'object') {
      entry = {
        id: logOrAmount.id || `hydro-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        amountMl: logOrAmount.amountMl,
        date: logOrAmount.date || getToday(),
        timestamp: logOrAmount.timestamp || new Date().toTimeString().slice(0, 5)
      };
    } else {
      entry = {
        id: id || `hydro-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        amountMl: logOrAmount,
        date: date || getToday(),
        timestamp: new Date().toTimeString().slice(0, 5)
      };
    }
    const evtId = usePersistenceStore.getState().setSaving('hydration', `Logging +${entry.amountMl}ml water...`);
    await localDb.put('hydration', entry);

    try {
      const res = await fetch(`${API_BASE}/hydration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await handleResponse<{ success: boolean; log: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'hydration', 'Hydration saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'hydration',
        'hydration',
        '/hydration',
        'POST',
        entry,
        { success: true, offline: true, log: entry }
      );
    }
  },

  async deleteHydration(id: string) {
    const evtId = usePersistenceStore.getState().setSaving('hydration', 'Removing hydration log...');
    await localDb.delete('hydration', id);
    try {
      const res = await fetch(`${API_BASE}/hydration/${id}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'hydration', 'Hydration log removed from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'hydration',
        'hydration',
        `/hydration/${id}`,
        'DELETE',
        { id },
        { success: true, offline: true, id }
      );
    }
  },

  // Body & Measurements (Offline-First)
  async getBodyData() {
    try {
      const res = await fetch(`${API_BASE}/body`);
      return await handleResponse<{
        success: boolean;
        measurements: any[];
        sleepLogs: any[];
        recoveryLogs: any[];
      }>(res);
    } catch (err) {
      const [measurements, sleepLogs, recoveryLogs] = await Promise.all([
        localDb.getAll('measurements'),
        localDb.getAll('sleepLogs'),
        localDb.getAll('recoveryLogs')
      ]);
      return { success: true, offline: true, measurements, sleepLogs, recoveryLogs };
    }
  },

  async logWeight(weightKg: number, date?: string, bodyFatPct?: number) {
    const targetDate = date || getToday();
    const canonicalId = `bm-${targetDate}`;
    const evtId = usePersistenceStore.getState().setSaving('weight', `Logging weight ${weightKg} kg...`);
    const entry = {
      id: canonicalId,
      date: targetDate,
      weightKg,
      bodyFatPct
    };
    await localDb.put('measurements', entry);

    try {
      const res = await fetch(`${API_BASE}/body/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: canonicalId, weightKg, date: targetDate, bodyFatPct })
      });
      const data = await handleResponse<{ success: boolean; measurement: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'weight', 'Weight measurement saved to cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'weight',
        'weight',
        '/body/weight',
        'POST',
        { id: canonicalId, weightKg, date: targetDate, bodyFatPct },
        { success: true, offline: true, measurement: entry }
      );
    }
  },

  async logMeasurements(measurementData: any) {
    const targetDate = measurementData.date || getToday();
    const canonicalId = measurementData.id || `bm-${targetDate}`;
    const evtId = usePersistenceStore.getState().setSaving('measurements', 'Saving body measurements...');
    const entry = {
      ...measurementData,
      id: canonicalId,
      date: targetDate
    };
    await localDb.put('measurements', entry);
    try {
      const res = await fetch(`${API_BASE}/body/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await handleResponse<{ success: boolean; measurement: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'measurements', 'Measurements saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'measurements',
        'measurements',
        '/body/measurements',
        'POST',
        entry,
        { success: true, offline: true, measurement: entry }
      );
    }
  },

  async logSleep(sleepData: any) {
    const targetDate = sleepData.date || getToday();
    const canonicalId = sleepData.id || `sleep-${targetDate}`;
    const hours = sleepData.durationMinutes ? (sleepData.durationMinutes / 60).toFixed(1) : sleepData.hours || '0';
    const evtId = usePersistenceStore.getState().setSaving('sleep', `Logging sleep (${hours}h)...`);
    const entry = {
      ...sleepData,
      id: canonicalId,
      date: targetDate
    };
    await localDb.put('sleepLogs', entry);
    try {
      const res = await fetch(`${API_BASE}/body/sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await handleResponse<{ success: boolean; sleepLog: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'sleep', 'Sleep log saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'sleep',
        'sleep',
        '/body/sleep',
        'POST',
        entry,
        { success: true, offline: true, sleepLog: entry }
      );
    }
  },

  async logRecovery(recoveryData: any) {
    const targetDate = recoveryData.date || getToday();
    const canonicalId = recoveryData.id || `recovery-${targetDate}`;
    const evtId = usePersistenceStore.getState().setSaving('recovery', `Logging recovery score...`);
    const entry = {
      ...recoveryData,
      id: canonicalId,
      date: targetDate
    };
    await localDb.put('recoveryLogs', entry);
    try {
      const res = await fetch(`${API_BASE}/body/recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await handleResponse<{ success: boolean; recoveryLog: any }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'recovery', 'Recovery log saved to TiDB Cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'recovery',
        'recovery',
        '/body/recovery',
        'POST',
        entry,
        { success: true, offline: true, recoveryLog: entry }
      );
    }
  },

  async deleteMeasurement(idOrDate: string) {
    const evtId = usePersistenceStore.getState().setSaving('measurements', 'Deleting measurement...');
    await localDb.delete('measurements', idOrDate);
    try {
      const res = await fetch(`${API_BASE}/body/measurements/${encodeURIComponent(idOrDate)}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'measurements', 'Measurement deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'measurements',
        'measurements',
        `/body/measurements/${idOrDate}`,
        'DELETE',
        { id: idOrDate },
        { success: true, offline: true, id: idOrDate }
      );
    }
  },

  async deleteSleep(idOrDate: string) {
    const evtId = usePersistenceStore.getState().setSaving('sleep', 'Deleting sleep record...');
    await localDb.delete('sleepLogs', idOrDate);
    try {
      const res = await fetch(`${API_BASE}/body/sleep/${encodeURIComponent(idOrDate)}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'sleep', 'Sleep record deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'sleep',
        'sleep',
        `/body/sleep/${idOrDate}`,
        'DELETE',
        { id: idOrDate },
        { success: true, offline: true, id: idOrDate }
      );
    }
  },

  async deleteRecovery(idOrDate: string) {
    const evtId = usePersistenceStore.getState().setSaving('recovery', 'Deleting recovery record...');
    await localDb.delete('recoveryLogs', idOrDate);
    try {
      const res = await fetch(`${API_BASE}/body/recovery/${encodeURIComponent(idOrDate)}`, { method: 'DELETE' });
      const data = await handleResponse<{ success: boolean; id: string }>(res);
      usePersistenceStore.getState().setSaved(evtId, 'recovery', 'Recovery record deleted from cloud');
      return data;
    } catch (err: any) {
      return await handleMutationError(
        err,
        evtId,
        'recovery',
        'recovery',
        `/body/recovery/${idOrDate}`,
        'DELETE',
        { id: idOrDate },
        { success: true, offline: true, id: idOrDate }
      );
    }
  },

  // Clear all DB data
  async clearAllData() {
    await localDb.clearQueue();
    await localDb.setAll('workouts', []);
    await localDb.setAll('meals', []);
    await localDb.setAll('hydration', []);
    await localDb.setAll('measurements', []);
    await localDb.setAll('sleepLogs', []);
    await localDb.setAll('recoveryLogs', []);
    await localDb.setAll('customExercises', []);
    await localDb.setAll('customFoods', []);
    await localDb.setAll('favoriteFoodIds', []);

    try {
      const res = await fetch(`${API_BASE}/clear-all-data`, { method: 'POST' });
      return await handleResponse<{ success: boolean; message: string }>(res);
    } catch (err) {
      return { success: true, message: 'Local storage wiped.' };
    }
  }
};
