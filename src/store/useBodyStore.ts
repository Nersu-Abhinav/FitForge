import { create } from 'zustand';
import { BodyMeasurement, SleepLog, RecoveryLog } from '@/types';
import { api } from '@/services/api';

interface BodyState {
  measurements: BodyMeasurement[];
  sleepLogs: SleepLog[];
  recoveryLogs: RecoveryLog[];

  // DB Hydration
  setBodyDataFromDB: (data: { measurements?: BodyMeasurement[]; sleepLogs?: SleepLog[]; recoveryLogs?: RecoveryLog[] }) => void;

  // Actions
  logWeight: (weightKg: number, date?: string, bodyFatPct?: number) => void;
  logMeasurements: (data: Omit<BodyMeasurement, 'id'>) => void;
  logSleep: (data: Omit<SleepLog, 'id'>) => void;
  logRecovery: (energy: number, soreness: number, stress: number, notes?: string, date?: string) => void;
  deleteMeasurement: (idOrDate: string) => Promise<void>;
  deleteSleep: (idOrDate: string) => Promise<void>;
  deleteRecovery: (idOrDate: string) => Promise<void>;
  
  // Helpers
  getLatestWeight: () => number;
  getMeasurementForDate: (date: string) => BodyMeasurement | undefined;
  getSleepForDate: (date: string) => SleepLog | undefined;
  getRecoveryForDate: (date: string) => RecoveryLog | undefined;
}

import { getToday } from '@/utils/date';

export const useBodyStore = create<BodyState>((set, get) => ({
  measurements: [],
  sleepLogs: [],
  recoveryLogs: [],

  setBodyDataFromDB: (data) => {
    set({
      measurements: data.measurements || [],
      sleepLogs: data.sleepLogs || [],
      recoveryLogs: data.recoveryLogs || []
    });
  },

  logWeight: async (weightKg, date, bodyFatPct) => {
    const targetDate = date || getToday();
    const canonicalId = `bm-${targetDate}`;
    set((state) => {
      const existingIdx = state.measurements.findIndex(m => m.date === targetDate || m.id === canonicalId);
      let nextMeasurements: BodyMeasurement[];

      if (existingIdx >= 0) {
        nextMeasurements = [...state.measurements];
        nextMeasurements[existingIdx] = {
          ...nextMeasurements[existingIdx],
          id: canonicalId,
          date: targetDate,
          weightKg,
          bodyFatPct: bodyFatPct !== undefined ? bodyFatPct : nextMeasurements[existingIdx].bodyFatPct
        };
      } else {
        const newEntry: BodyMeasurement = {
          id: canonicalId,
          date: targetDate,
          weightKg,
          bodyFatPct
        };
        nextMeasurements = [...state.measurements, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      }

      return { measurements: nextMeasurements };
    });

    await api.logWeight(weightKg, targetDate, bodyFatPct);
  },

  logMeasurements: async (data) => {
    const mDate = data.date || getToday();
    const canonicalId = (data as Partial<BodyMeasurement>).id || `bm-${mDate}`;
    let nextMeasurements: BodyMeasurement[] = [];

    set((state) => {
      const existingIdx = state.measurements.findIndex(m => m.date === mDate || m.id === canonicalId);

      if (existingIdx >= 0) {
        nextMeasurements = [...state.measurements];
        nextMeasurements[existingIdx] = {
          ...nextMeasurements[existingIdx],
          ...data,
          id: canonicalId,
          date: mDate
        };
      } else {
        const newEntry: BodyMeasurement = {
          ...data,
          id: canonicalId,
          date: mDate
        };
        nextMeasurements = [...state.measurements, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      }

      return { measurements: nextMeasurements };
    });

    await api.logMeasurements({ ...data, id: canonicalId, date: mDate });
  },

  logSleep: async (data) => {
    const sDate = data.date || getToday();
    const canonicalId = (data as Partial<SleepLog>).id || `sleep-${sDate}`;
    let nextSleep: SleepLog[] = [];

    set((state) => {
      const existingIdx = state.sleepLogs.findIndex(s => s.date === sDate || s.id === canonicalId);

      if (existingIdx >= 0) {
        nextSleep = [...state.sleepLogs];
        nextSleep[existingIdx] = { 
          ...nextSleep[existingIdx], 
          ...data,
          id: canonicalId,
          date: sDate
        };
      } else {
        const newEntry: SleepLog = { 
          ...data, 
          id: canonicalId, 
          date: sDate
        };
        nextSleep = [newEntry, ...state.sleepLogs];
      }

      return { sleepLogs: nextSleep };
    });

    await api.logSleep({ ...data, id: canonicalId, date: sDate });
  },

  logRecovery: async (energy, soreness, stress, notes, date) => {
    const targetDate = date || getToday();
    const energyPts = (energy / 10) * 40;
    const sorenessPts = ((10 - soreness) / 10) * 30;
    const stressPts = ((10 - stress) / 10) * 30;
    const calculatedScore = Math.round(energyPts + sorenessPts + stressPts);
    const canonicalId = `recovery-${targetDate}`;

    const newEntry: RecoveryLog = {
      id: canonicalId,
      date: targetDate,
      energyLevel: energy,
      sorenessLevel: soreness,
      stressLevel: stress,
      calculatedScore,
      notes
    };

    set((state) => {
      const existingIdx = state.recoveryLogs.findIndex(r => r.date === date || r.id === canonicalId);
      let nextRecovery: RecoveryLog[];

      if (existingIdx >= 0) {
        nextRecovery = [...state.recoveryLogs];
        nextRecovery[existingIdx] = newEntry;
      } else {
        nextRecovery = [newEntry, ...state.recoveryLogs];
      }

      return { recoveryLogs: nextRecovery };
    });

    await api.logRecovery(newEntry);
  },

  deleteMeasurement: async (idOrDate: string) => {
    set((state) => ({
      measurements: state.measurements.filter(m => m.id !== idOrDate && m.date !== idOrDate)
    }));
    await api.deleteMeasurement(idOrDate);
  },

  deleteSleep: async (idOrDate: string) => {
    set((state) => ({
      sleepLogs: state.sleepLogs.filter(s => s.id !== idOrDate && s.date !== idOrDate)
    }));
    await api.deleteSleep(idOrDate);
  },

  deleteRecovery: async (idOrDate: string) => {
    set((state) => ({
      recoveryLogs: state.recoveryLogs.filter(r => r.id !== idOrDate && (r.date !== idOrDate && r.recoveryDate !== idOrDate))
    }));
    await api.deleteRecovery(idOrDate);
  },

  getLatestWeight: () => {
    const list = get().measurements;
    if (list.length === 0) return 0;
    return list[list.length - 1].weightKg;
  },

  getMeasurementForDate: (date) => {
    return get().measurements.find(m => m.date === date);
  },

  getSleepForDate: (date) => {
    return get().sleepLogs.find(s => s.date === date);
  },

  getRecoveryForDate: (date) => {
    return get().recoveryLogs.find(r => r.date === date);
  }
}));
