import { create } from 'zustand';

export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'queued' | 'failed';

export interface PersistenceEvent {
  id: string;
  status: PersistenceStatus;
  entity: 'workout' | 'meal' | 'hydration' | 'weight' | 'measurements' | 'sleep' | 'recovery' | 'split' | 'profile';
  message: string;
  timestamp: number;
}

interface PersistenceState {
  currentEvent: PersistenceEvent | null;
  history: PersistenceEvent[];
  isSaving: boolean;

  setSaving: (entity: PersistenceEvent['entity'], message?: string) => string;
  setSaved: (id: string, entity: PersistenceEvent['entity'], message?: string) => void;
  setQueued: (id: string, entity: PersistenceEvent['entity'], message?: string) => void;
  setFailed: (id: string, entity: PersistenceEvent['entity'], error?: string) => void;
  clearEvent: () => void;
}

export const usePersistenceStore = create<PersistenceState>((set, get) => ({
  currentEvent: null,
  history: [],
  isSaving: false,

  setSaving: (entity, message) => {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const event: PersistenceEvent = {
      id,
      status: 'saving',
      entity,
      message: message || `Saving ${entity}...`,
      timestamp: Date.now()
    };
    set((state) => ({
      currentEvent: event,
      isSaving: true,
      history: [event, ...state.history].slice(0, 20)
    }));

    // Safety timeout: dismiss after 5s if still saving
    setTimeout(() => {
      if (get().currentEvent?.id === id && get().currentEvent?.status === 'saving') {
        set({ isSaving: false, currentEvent: null });
      }
    }, 5000);

    return id;
  },

  setSaved: (id, entity, message) => {
    const event: PersistenceEvent = {
      id,
      status: 'saved',
      entity,
      message: message || `Saved to TiDB Cloud`,
      timestamp: Date.now()
    };
    set((state) => ({
      currentEvent: event,
      isSaving: false,
      history: [event, ...state.history.filter(h => h.id !== id)].slice(0, 20)
    }));

    // Auto-dismiss 'saved' event after 2.2 seconds
    setTimeout(() => {
      if (get().currentEvent?.id === id) {
        set({ currentEvent: null });
      }
    }, 2200);
  },

  setQueued: (id, entity, message) => {
    const event: PersistenceEvent = {
      id,
      status: 'queued',
      entity,
      message: message || `Saved Locally • Queued for Cloud Sync`,
      timestamp: Date.now()
    };
    set((state) => ({
      currentEvent: event,
      isSaving: false,
      history: [event, ...state.history.filter(h => h.id !== id)].slice(0, 20)
    }));

    // Auto-dismiss 'queued' event after 2.5 seconds
    setTimeout(() => {
      if (get().currentEvent?.id === id) {
        set({ currentEvent: null });
      }
    }, 2500);
  },

  setFailed: (id, entity, error) => {
    const event: PersistenceEvent = {
      id,
      status: 'failed',
      entity,
      message: error || `Failed to persist ${entity}`,
      timestamp: Date.now()
    };
    set((state) => ({
      currentEvent: event,
      isSaving: false,
      history: [event, ...state.history.filter(h => h.id !== id)].slice(0, 20)
    }));

    // Auto-dismiss 'failed' event after 5 seconds
    setTimeout(() => {
      if (get().currentEvent?.id === id) {
        set({ currentEvent: null });
      }
    }, 5000);
  },

  clearEvent: () => set({ currentEvent: null, isSaving: false })
}));
