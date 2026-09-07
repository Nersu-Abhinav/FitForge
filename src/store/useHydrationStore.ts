import { create } from 'zustand';
import { HydrationLog } from '@/types';
import { api } from '@/services/api';

interface HydrationState {
  logs: HydrationLog[];
  setHydrationFromDB: (logs: HydrationLog[]) => void;
  addWater: (amountMl: number, date?: string) => void;
  subtractWater: (amountMl: number, date?: string) => void;
  removeLastLog: (date?: string) => void;
  deleteLog: (id: string) => void;
  clearWaterForDate: (date: string) => void;
  getWaterForDate: (date: string) => number;
  getLogsForDate: (date: string) => HydrationLog[];
}

import { getToday } from '@/utils/date';

export const useHydrationStore = create<HydrationState>((set, get) => ({
  logs: [],

  setHydrationFromDB: (dbLogs) => {
    set({ logs: dbLogs || [] });
  },

  addWater: (amountMl: number, date?: string) => {
    const targetDate = date || getToday();
    const newLog: HydrationLog = {
      id: `hydro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: targetDate,
      amountMl,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    };

    set((state) => ({
      logs: [newLog, ...state.logs]
    }));

    api.logHydration(newLog);
  },

  subtractWater: (amountMl: number, date?: string) => {
    const targetDate = date || getToday();
    const dateLogs = get().logs.filter(l => l.date === targetDate);
    if (dateLogs.length === 0) return;

    // Find the latest log for this date
    const latest = dateLogs[0];
    if (latest.amountMl <= amountMl) {
      get().deleteLog(latest.id);
    } else {
      // Reduce the amount of this log
      const updatedLog: HydrationLog = {
        ...latest,
        amountMl: latest.amountMl - amountMl
      };
      set((state) => ({
        logs: state.logs.map(l => l.id === latest.id ? updatedLog : l)
      }));
      api.logHydration(updatedLog);
    }
  },

  removeLastLog: (date?: string) => {
    const targetDate = date || getToday();
    let removedId: string | null = null;

    set((state) => {
      const index = state.logs.findIndex(l => l.date === targetDate);
      if (index === -1) return state;
      const target = state.logs[index];
      removedId = target.id;
      const nextLogs = [...state.logs];
      nextLogs.splice(index, 1);
      return { logs: nextLogs };
    });

    if (removedId) {
      api.deleteHydration(removedId);
    }
  },

  deleteLog: (id: string) => {
    set((state) => ({
      logs: state.logs.filter(l => l.id !== id)
    }));
    api.deleteHydration(id);
  },

  clearWaterForDate: (date: string) => {
    const targetLogs = get().logs.filter(l => l.date === date);
    set((state) => ({
      logs: state.logs.filter(l => l.date !== date)
    }));
    targetLogs.forEach(l => {
      api.deleteHydration(l.id);
    });
  },

  getWaterForDate: (date: string) => {
    return get().logs
      .filter(l => l.date === date)
      .reduce((sum, l) => sum + l.amountMl, 0);
  },

  getLogsForDate: (date: string) => {
    return get().logs.filter(l => l.date === date);
  }
}));

