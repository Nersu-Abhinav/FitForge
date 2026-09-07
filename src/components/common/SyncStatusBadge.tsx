import React, { useState } from 'react';
import { useSyncStore } from '@/store/useSyncStore';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, ZapOff } from 'lucide-react';
import { SyncQueueModal } from './SyncQueueModal';
import clsx from 'clsx';

interface SyncStatusBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ size = 'md', className }) => {
  const { isOnline, isSyncing, pendingCount, failedCount, permanentFailureCount } = useSyncStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive sync status accurately from actual sync engine
  let statusText = 'Synced';
  let badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40';
  let icon = <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;

  if (!isOnline) {
    statusText = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline';
    badgeColor = 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700/80';
    icon = <CloudOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
  } else if (isSyncing) {
    statusText = pendingCount > 0 ? `Syncing (${pendingCount})...` : 'Syncing...';
    badgeColor = 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 animate-pulse';
    icon = <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />;
  } else if (permanentFailureCount > 0 || failedCount > 0) {
    const totalFailed = permanentFailureCount + failedCount;
    statusText = totalFailed === 1 ? 'Sync failed' : `${totalFailed} errors`;
    badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-700/60 hover:bg-rose-900/60';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  } else if (pendingCount > 0) {
    statusText = pendingCount === 1 ? '1 pending' : `${pendingCount} pending`;
    badgeColor = 'bg-amber-950/50 text-amber-300 border-amber-700/50 hover:bg-amber-900/50';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        title="Click to view offline queue & sync options"
        className={clsx(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-mono font-bold tracking-tight transition-all border shadow-xs active:scale-95 cursor-pointer shrink-0',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
          badgeColor,
          className
        )}
      >
        {icon}
        <span className="leading-none">{statusText}</span>
      </button>

      {/* Sync Queue Inspector Modal */}
      <SyncQueueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
