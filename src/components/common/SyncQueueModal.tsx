import React from 'react';
import { createPortal } from 'react-dom';
import { useSyncStore } from '@/store/useSyncStore';
import { SyncQueueItem, MAX_SYNC_ATTEMPTS } from '@/services/localDb';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { 
  X, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  Database, 
  Dumbbell, 
  Utensils, 
  Droplets, 
  Scale, 
  Moon, 
  Activity, 
  User 
} from 'lucide-react';
import clsx from 'clsx';

interface SyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncQueueModal: React.FC<SyncQueueModalProps> = ({ isOpen, onClose }) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    permanentFailureCount,
    queueItems,
    lastSyncTime,
    syncNow,
    retryItem,
    retryAllFailed,
    discardItem,
    clearAllQueue
  } = useSyncStore();

  if (!isOpen) return null;

  const getTypeIcon = (type: SyncQueueItem['type']) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case 'meal':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'weight':
      case 'measurements':
        return <Scale className="w-4 h-4 text-indigo-400" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-purple-400" />;
      case 'recovery':
        return <Activity className="w-4 h-4 text-rose-400" />;
      default:
        return <User className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatPayloadSummary = (item: SyncQueueItem) => {
    try {
      const p = item.payload;
      if (!p) return item.endpoint;
      if (item.type === 'workout') return `${p.name || 'Workout'} (${p.exercises?.length || 0} exercises)`;
      if (item.type === 'meal') return `${p.name || 'Meal'} (${p.calories || 0} kcal, ${p.protein || 0}g protein)`;
      if (item.type === 'hydration') return `+${p.amountMl || 0}ml Water`;
      if (item.type === 'weight') return `Weight Log: ${p.weightKg || 0} kg`;
      if (item.type === 'sleep') return `Sleep: ${p.hours || 0}h (Quality: ${p.quality || 'Good'})`;
      if (item.type === 'recovery') return `Recovery: ${p.score || 0}%`;
      return JSON.stringify(p).slice(0, 50);
    } catch {
      return item.endpoint;
    }
  };

  const formatTimeAgo = (ts: number) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  const getRetryWaitText = (item: SyncQueueItem) => {
    if (item.status === 'permanent_failure') return 'Permanent failure (manual retry needed)';
    if (!item.nextRetryAt) return 'Ready to sync';
    const remainingMs = item.nextRetryAt - Date.now();
    if (remainingMs <= 0) return 'Ready to sync';
    const sec = Math.ceil(remainingMs / 1000);
    if (sec < 60) return `Retrying in ${sec}s`;
    return `Retrying in ${Math.ceil(sec / 60)}m`;
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px) + 16px, 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 24px)'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1017] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Sync Engine & Offline Queue
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold',
                  isOnline ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                )}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                Exponential backoff schedule with max {MAX_SYNC_ATTEMPTS} attempts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-zinc-950/60 border-b border-zinc-800/60 shrink-0">
          <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Pending Queue</span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 sm:mt-1">{queueItems.length} items</span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">In Backoff Delay</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 mt-0.5 sm:mt-1">{failedCount}</span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Failures</span>
            <span className="text-lg sm:text-xl font-black text-rose-400 mt-0.5 sm:mt-1">{permanentFailureCount}</span>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y-0">
          {queueItems.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">All Changes Synchronized</h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                Your local database is fully up to date with TiDB Cloud. Any new workout, nutrition, or recovery logs while offline will queue here safely.
              </p>
            </div>
          ) : (
            queueItems.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'p-3.5 rounded-xl border transition-all flex flex-col gap-2',
                  item.status === 'permanent_failure'
                    ? 'bg-rose-950/20 border-rose-800/50'
                    : item.status === 'failed'
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : item.status === 'syncing'
                    ? 'bg-cyan-950/20 border-cyan-800/40 animate-pulse'
                    : 'bg-zinc-900/40 border-zinc-800/80'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {item.type}
                        </span>
                        <span className={clsx(
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
                          item.status === 'permanent_failure'
                            ? 'bg-rose-900/60 text-rose-300'
                            : item.status === 'failed'
                            ? 'bg-amber-900/60 text-amber-300'
                            : item.status === 'syncing'
                            ? 'bg-cyan-900/60 text-cyan-300'
                            : 'bg-zinc-800 text-zinc-300'
                        )}>
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {item.attempts}/{MAX_SYNC_ATTEMPTS} attempts
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium">
                        {formatPayloadSummary(item)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => retryItem(item.id)}
                      disabled={isSyncing}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                      title="Reset attempts and retry now"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                    <button
                      onClick={() => discardItem(item.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-700/50 text-zinc-400 hover:text-rose-300 transition-colors"
                      title="Discard this queued mutation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Error & Retry Details */}
                {(item.lastError || item.nextRetryAt || item.status === 'permanent_failure') && (
                  <div className="mt-1 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 text-rose-300/90 truncate max-w-[70%]">
                      <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                      <span className="truncate">{item.lastError || 'Failed to sync'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400 font-mono text-[10px] shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{getRetryWaitText(item)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-400">
            {lastSyncTime ? (
              <span>Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>
            ) : (
              <span>Not synced yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {failedCount > 0 && (
              <button
                type="button"
                onClick={() => retryAllFailed()}
                disabled={isSyncing}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                Retry All Failed
              </button>
            )}

            {queueItems.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllQueue()}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Clear Queue
              </button>
            )}

            <button
              type="button"
              onClick={() => syncNow()}
              disabled={isSyncing || !isOnline}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 pressable"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
              <span>{isSyncing ? 'Syncing...' : 'Force Sync All'}</span>
            </button>

            {/* Explicit Dedicated Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10 pressable flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
