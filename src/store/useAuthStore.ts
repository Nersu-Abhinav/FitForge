import { create } from 'zustand';
import { UserProfile, FitnessGoals } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  user: UserProfile;
  setUserFromDB: (user: UserProfile) => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateGoals: (goals: Partial<FitnessGoals>) => Promise<void>;
  toggleUnitSystem: () => Promise<void>;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr-abhinav-01',
  name: 'Abhinav',
  email: 'abhinav@fitforge.app',
  heightCm: 180,
  fitnessLevel: 'intermediate',
  unitSystem: 'metric',
  joinedDate: '2026-01-15',
  goals: {
    goalType: 'muscle_gain',
    targetWeightKg: 78.5,
    targetBodyFatPct: 12.0,
    targetSleepHours: 8.0,
    dailyCalories: 2600,
    dailyProteinGrams: 160,
    dailyCarbsGrams: 280,
    dailyFatGrams: 75,
    dailyWaterMl: 3500,
    weeklyWorkoutsTarget: 5,
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: DEFAULT_USER,

  setUserFromDB: (dbUser) => {
    set({ user: dbUser });
  },

  updateProfile: async (updates) => {
    const nextUser = { ...get().user, ...updates };
    set({ user: nextUser });
    await api.updateUserProfile(nextUser);
  },

  updateGoals: async (goalUpdates) => {
    const nextUser = {
      ...get().user,
      goals: { ...get().user.goals, ...goalUpdates },
    };
    set({ user: nextUser });
    await api.updateUserProfile(nextUser);
  },

  toggleUnitSystem: async () => {
    const nextSystem: 'metric' | 'imperial' = get().user.unitSystem === 'metric' ? 'imperial' : 'metric';
    const nextUser = { ...get().user, unitSystem: nextSystem };
    set({ user: nextUser });
    await api.updateUserProfile(nextUser);
  }
}));
