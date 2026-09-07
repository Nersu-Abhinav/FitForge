import { create } from 'zustand';
import { syncEngine } from '@/services/syncEngine';
import { localDb, SyncQueueItem } from '@/services/localDb';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  permanentFailureCount: number;
  queueItems: SyncQueueItem[];
  lastSyncTime: string | null;

  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setFailedCount: (count: number) => void;
  setPermanentFailureCount: (count: number) => void;
  setQueueItems: (items: SyncQueueItem[]) => void;
  setLastSyncTime: (time: string) => void;

  syncNow: () => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  retryAllFailed: () => Promise<void>;
  discardItem: (id: string) => Promise<void>;
  clearAllQueue: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  permanentFailureCount: 0,
  queueItems: [],
  lastSyncTime: null,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setFailedCount: (failedCount) => set({ failedCount }),
  setPermanentFailureCount: (permanentFailureCount) => set({ permanentFailureCount }),
  setQueueItems: (queueItems) => set({ queueItems }),
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

  syncNow: async () => {
    await syncEngine.runFullSyncSequence(true);
  },

  retryItem: async (id: string) => {
    await localDb.resetItemForManualRetry(id);
    await syncEngine.runFullSyncSequence(true);
  },

  retryAllFailed: async () => {
    await localDb.resetAllFailedForManualRetry();
    await syncEngine.runFullSyncSequence(true);
  },

  discardItem: async (id: string) => {
    await localDb.removeQueueItem(id);
    await syncEngine.refreshPendingCount();
  },

  clearAllQueue: async () => {
    await localDb.clearQueue();
    await syncEngine.refreshPendingCount();
  }
}));

