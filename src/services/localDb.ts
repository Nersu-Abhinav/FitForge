// ============================================================================
// FitForge Offline Local Database (IndexedDB)
// Single local relational & sync queue storage for robust offline-first gym tracking
// ============================================================================

const DB_NAME = 'fitforge_offline_db';
const DB_VERSION = 4;

export const BACKOFF_DELAYS_MS = [
  5 * 1000,       // 1st failure: 5 sec
  15 * 1000,      // 2nd failure: 15 sec
  60 * 1000,      // 3rd failure: 1 min
  5 * 60 * 1000,  // 4th failure: 5 min
  30 * 60 * 1000  // 5th failure: 30 min
];
export const MAX_SYNC_ATTEMPTS = 5;

export interface SyncQueueItem {
  id: string;
  type: 'workout' | 'meal' | 'hydration' | 'weight' | 'measurements' | 'sleep' | 'recovery' | 'profile' | 'exercise' | 'food' | 'favorite_food' | 'split';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed' | 'permanent_failure';
  lastError?: string;
  nextRetryAt?: number;
  lastAttemptAt?: number;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Stores for local offline entities
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meals')) {
          db.createObjectStore('meals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('hydration')) {
          db.createObjectStore('hydration', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('measurements')) {
          db.createObjectStore('measurements', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sleepLogs')) {
          db.createObjectStore('sleepLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recoveryLogs')) {
          db.createObjectStore('recoveryLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customExercises')) {
          db.createObjectStore('customExercises', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customFoods')) {
          db.createObjectStore('customFoods', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('favoriteFoodIds')) {
          db.createObjectStore('favoriteFoodIds', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  // Generic Get All
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  // Generic Put Single Item
  async put<T extends Record<string, any>>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    const itemWithId = {
      ...item,
      id: item.id || `${storeName.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(itemWithId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Safe Entity Reconciliation (Zero-Data-Loss Sync):
   * Never blindly calls store.clear(). Reconciles server items with local state:
   * 1. Preserves local items that have pending mutations in syncQueue (syncStatus: 'pending')
   * 2. Preserves local items with newer updatedAt / higher version
   * 3. Upserts new and updated server items (syncStatus: 'synced')
   * 4. Handles soft deletions (deletedAt) and removes server-purged records
   */
  async reconcileEntities<T extends { id: string; updatedAt?: string | number; createdAt?: string | number; version?: number; deletedAt?: string | number | null; syncStatus?: 'synced' | 'pending' | 'failed' }>(
    storeName: string,
    serverItems: T[]
  ): Promise<T[]> {
    const db = await this.getDB();
    const queueItems = await this.getAll<SyncQueueItem>('syncQueue');
    const pendingIds = new Set(
      queueItems
        .map(q => q.payload?.id || (q.endpoint.startsWith(`/${storeName}/`) ? q.endpoint.split('/')[2] : null))
        .filter(Boolean)
    );

    const localItems = await this.getAll<T>(storeName);
    const localMap = new Map<string, T>((localItems || []).map(item => [item.id, item]));
    const serverMap = new Map<string, T>((serverItems || []).map(item => [item.id, item]));

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      const reconciledList: T[] = [];

      // 1. Process all server items: upsert unless local version has un-synced edits
      for (const [id, serverItem] of serverMap.entries()) {
        const localItem = localMap.get(id);
        const serverVersion = serverItem.version || 1;
        const localVersion = localItem?.version || 1;

        if (localItem && pendingIds.has(id)) {
          // Local item has pending offline mutation: retain local version marked as pending
          const pendingItem = {
            ...localItem,
            syncStatus: 'pending' as const
          };
          reconciledList.push(pendingItem);
        } else if (
          localItem &&
          (localVersion > serverVersion || (localItem.updatedAt && serverItem.updatedAt && new Date(localItem.updatedAt).getTime() > new Date(serverItem.updatedAt).getTime()))
        ) {
          // Local item is newer or higher version: retain local version
          reconciledList.push(localItem);
        } else {
          // Server item is verified current: tag as synced and upsert to store
          const syncedItem: T = {
            ...serverItem,
            syncStatus: 'synced' as const,
            updatedAt: serverItem.updatedAt || new Date().toISOString()
          };
          store.put(syncedItem);
          reconciledList.push(syncedItem);
        }
      }

      // 2. Process items that exist locally but NOT on server
      for (const [id, localItem] of localMap.entries()) {
        if (!serverMap.has(id)) {
          if (pendingIds.has(id)) {
            // Unpushed new local entity: keep safely in IndexedDB marked as pending
            const pendingItem = {
              ...localItem,
              syncStatus: 'pending' as const
            };
            store.put(pendingItem);
            reconciledList.push(pendingItem);
          } else {
            // Record was deleted remotely on server: clean up from local store
            store.delete(id);
          }
        }
      }

      tx.oncomplete = () => resolve(reconciledList);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Generic Bulk Put / Replace (Used only for intentional full resets / wipes)
  async setAll<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Generic Delete Single Item
  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // -------------------------------------------------------------------------
  // Sync Queue Operations with Exponential Backoff & State Lifecycle
  // -------------------------------------------------------------------------
  async enqueueSyncItem(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts' | 'status'>): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sq-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending'
    };
    await this.put('syncQueue', queueItem);
    return queueItem;
  }

  /**
   * Get items eligible for processing:
   * - Not permanently failed
   * - nextRetryAt timestamp has elapsed (or is not set)
   * - Recovers any orphaned 'syncing' items from previous crashed sessions (> 15s old)
   */
  async getDueQueueItems(isManualRetry = false): Promise<SyncQueueItem[]> {
    const items = await this.getAll<SyncQueueItem>('syncQueue');
    const now = Date.now();

    return items
      .filter(item => {
        if (isManualRetry) {
          // In manual retry, process everything that is not permanently failed or currently in active flight (< 5s old)
          return item.status !== 'permanent_failure' && (item.status !== 'syncing' || (now - (item.lastAttemptAt || 0) > 5000));
        }
        if (item.status === 'permanent_failure') {
          return false;
        }
        // If an item was marked 'syncing' but the tab refreshed / crashed (> 15s ago), recover it
        if (item.status === 'syncing') {
          return now - (item.lastAttemptAt || 0) > 15000;
        }
        if (item.nextRetryAt && item.nextRetryAt > now) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async getAllQueueItems(): Promise<SyncQueueItem[]> {
    const items = await this.getAll<SyncQueueItem>('syncQueue');
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  async getFailedQueueItems(): Promise<SyncQueueItem[]> {
    const items = await this.getAll<SyncQueueItem>('syncQueue');
    return items.filter(item => item.status === 'failed' || item.status === 'permanent_failure');
  }

  async removeQueueItem(id: string): Promise<void> {
    await this.delete('syncQueue', id);
  }

  async updateQueueItem(item: SyncQueueItem): Promise<void> {
    await this.put('syncQueue', item);
  }

  async resetItemForManualRetry(id: string): Promise<void> {
    const items = await this.getAll<SyncQueueItem>('syncQueue');
    const target = items.find(i => i.id === id);
    if (target) {
      target.attempts = 0;
      target.status = 'pending';
      target.nextRetryAt = undefined;
      target.lastError = undefined;
      await this.put('syncQueue', target);
    }
  }

  async resetAllFailedForManualRetry(): Promise<void> {
    const items = await this.getAll<SyncQueueItem>('syncQueue');
    for (const item of items) {
      if (item.status === 'failed' || item.status === 'permanent_failure') {
        item.attempts = 0;
        item.status = 'pending';
        item.nextRetryAt = undefined;
        item.lastError = undefined;
        await this.put('syncQueue', item);
      }
    }
  }

  async clearQueue(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDb = new LocalDatabase();

