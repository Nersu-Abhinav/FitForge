import { localDb, SyncQueueItem, BACKOFF_DELAYS_MS, MAX_SYNC_ATTEMPTS } from './localDb';
import { useSyncStore } from '@/store/useSyncStore';
import { resolveApiUrl, ApiError } from './api';
import { classifySyncError } from './syncErrorClassifier';

type SyncCallback = () => void | Promise<void>;

class SyncEngine {
  private isProcessing = false;
  private syncInterval: any = null;
  private syncListeners: Set<SyncCallback> = new Set();
  private onSyncAllRequired?: () => Promise<any>;

  init(syncAllHandler?: () => Promise<any>) {
    if (typeof window === 'undefined') return;
    if (syncAllHandler) {
      this.onSyncAllRequired = syncAllHandler;
    }

    // Listen to network status
    window.addEventListener('online', async () => {
      console.log('📶 Device back online, starting push-then-pull sync sequence...');
      useSyncStore.getState().setOnline(true);
      await this.runFullSyncSequence(false);
    });

    window.addEventListener('offline', () => {
      console.log('📴 Device went offline. All mutations will queue locally.');
      useSyncStore.getState().setOnline(false);
    });

    // Initial check
    useSyncStore.getState().setOnline(navigator.onLine);
    this.refreshPendingCount();

    // Auto-sync polling every 15 seconds when online
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => {
        if (navigator.onLine && !this.isProcessing) {
          this.runFullSyncSequence(false);
        }
      }, 15000);
    }
  }

  registerSyncListener(cb: SyncCallback) {
    this.syncListeners.add(cb);
    return () => this.syncListeners.delete(cb);
  }

  async refreshPendingCount() {
    try {
      const allItems = await localDb.getAllQueueItems();
      const now = Date.now();

      // Pending / due items
      const dueItems = allItems.filter(
        item => item.status !== 'permanent_failure' && (!item.nextRetryAt || item.nextRetryAt <= now)
      );

      // Failed (in backoff or permanent)
      const failedItems = allItems.filter(
        item => item.status === 'failed' || item.status === 'permanent_failure'
      );
      const permFailedItems = allItems.filter(
        item => item.status === 'permanent_failure'
      );

      useSyncStore.getState().setPendingCount(dueItems.length);
      useSyncStore.getState().setFailedCount(failedItems.length);
      useSyncStore.getState().setPermanentFailureCount(permFailedItems.length);
      useSyncStore.getState().setQueueItems(allItems);

      return dueItems.length;
    } catch (err) {
      console.warn('Could not refresh sync queue count:', err);
      return 0;
    }
  }

  /**
   * Run the full push-then-pull sequence:
   * 1. Push pending local mutations to server (respecting backoff delays)
   * 2. If onSyncAllRequired handler registered, run pull + merge + update
   * 3. Notify UI listeners
   */
  async runFullSyncSequence(isManualRetry = false) {
    if (this.isProcessing) return;
    try {
      // 1. Drain pending queue first (push)
      await this.drainQueue(isManualRetry);

      // 2. Run pull + reconcile if handler attached
      if (this.onSyncAllRequired && navigator.onLine) {
        await this.onSyncAllRequired();
      }

      // 3. Notify listeners
      for (const listener of this.syncListeners) {
        try {
          await listener();
        } catch (e) {
          console.error('Error in sync listener:', e);
        }
      }
    } catch (err) {
      console.error('Full sync sequence error:', err);
    }
  }

  /**
   * Enqueue mutation when offline or network fails
   */
  async enqueue(
    type: SyncQueueItem['type'],
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    payload: any
  ): Promise<void> {
    await localDb.enqueueSyncItem({
      type,
      endpoint,
      method,
      payload
    });
    await this.refreshPendingCount();
    console.log(`📥 Safely enqueued offline mutation [${type}] to local sync queue`);

    // If online, attempt immediate push and reconciliation
    if (navigator.onLine) {
      this.runFullSyncSequence(false);
    }
  }

  /**
   * Drain and execute pending sync items in FIFO order with Error Classification & Backoff
   */
  async drainQueue(isManualRetry = false): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    useSyncStore.getState().setSyncing(true);

    try {
      const queue = await localDb.getDueQueueItems(isManualRetry);
      if (queue.length === 0) {
        await this.refreshPendingCount();
        useSyncStore.getState().setLastSyncTime(new Date().toISOString());
        return;
      }

      console.log(`🔄 [PUSH PHASE] Pushing ${queue.length} eligible mutations to TiDB Cloud...`);

      for (const item of queue) {
        try {
          item.status = 'syncing';
          item.lastAttemptAt = Date.now();
          await localDb.updateQueueItem(item);
          await this.refreshPendingCount();

          const targetUrl = resolveApiUrl(item.endpoint);
          const res = await fetch(targetUrl, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.payload ? JSON.stringify(item.payload) : undefined
          });

          // 1. Conflict Check (409): Duplicate record on server
          if (res.status === 409) {
            console.log(`🤝 [Conflict Resolved] Mutation [${item.type}] already exists in TiDB Cloud. Removing queue item.`);
            await localDb.removeQueueItem(item.id);
            continue;
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new ApiError(errData.error || `HTTP ${res.status}`, res.status, errData);
          }

          // Successfully processed by TiDB Cloud
          await localDb.removeQueueItem(item.id);
          console.log(`✅ Synced queue item [${item.type}] to TiDB Cloud`);
        } catch (itemErr: any) {
          const classification = classifySyncError(itemErr);
          item.lastAttemptAt = Date.now();
          item.lastError = itemErr.message || 'Request failed';

          // Action 1: Conflict Resolution (409)
          if (classification.action === 'RESOLVE_CONFLICT') {
            console.log(`🤝 [Conflict Resolved] Queue item [${item.id}] duplicate detected. Auto-resolved.`);
            await localDb.removeQueueItem(item.id);
            continue;
          }

          // Action 2: Permanent Client Errors (400, 401, 403, 404, 422)
          if (classification.action === 'PERMANENT_FAILURE') {
            item.status = 'permanent_failure';
            item.nextRetryAt = undefined;
            console.error(
              `🛑 Mutation [${item.id}] rejected with permanent client error (${classification.statusCode}): ${itemErr.message}. Marked as PERMANENT FAILURE (no retry).`
            );
            await localDb.updateQueueItem(item);
            // Move on to next mutation so client errors don't stall the entire queue
            continue;
          }

          // Action 3: Network or Retryable 5xx Server Errors (Exponential Backoff)
          item.attempts += 1;
          if (item.attempts >= MAX_SYNC_ATTEMPTS) {
            item.status = 'permanent_failure';
            item.nextRetryAt = undefined;
            console.error(
              `🛑 Mutation [${item.id}] reached max retries (${MAX_SYNC_ATTEMPTS}). Marked as PERMANENT FAILURE. Requires manual retry.`
            );
          } else {
            // Apply exponential backoff schedule: 5s, 15s, 1m, 5m, 30m
            const delayMs = BACKOFF_DELAYS_MS[item.attempts - 1] || 30 * 60 * 1000;
            item.status = 'failed';
            item.nextRetryAt = Date.now() + delayMs;
            console.warn(
              `⚠️ Failed to push queue item [${item.id}] (Attempt ${item.attempts}/${MAX_SYNC_ATTEMPTS}). Retrying in ${delayMs / 1000}s: ${itemErr.message}`
            );
          }

          await localDb.updateQueueItem(item);

          // Stop sequential drain if backend is unreachable or experiencing server outage to preserve FIFO ordering
          break;
        }
      }

      await this.refreshPendingCount();
      useSyncStore.getState().setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error('Sync queue drain error:', err);
    } finally {
      this.isProcessing = false;
      useSyncStore.getState().setSyncing(false);
    }
  }
}

export const syncEngine = new SyncEngine();


