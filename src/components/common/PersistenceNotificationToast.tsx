import React, { useEffect, useState } from 'react';
import { usePersistenceStore, PersistenceEvent } from '@/store/usePersistenceStore';
import { triggerHaptic } from '@/utils/haptics';
import { 
  RefreshCw, 
  CheckCircle2, 
  CloudOff, 
  AlertTriangle, 
  X, 
  Droplets, 
  Dumbbell, 
  Utensils, 
  Moon, 
  Activity, 
  Scale, 
  User, 
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import clsx from 'clsx';

const ENTITY_EMOJIS: Record<PersistenceEvent['entity'], string> = {
  hydration: '💧',
  workout: '⚡',
  split: '🏋️',
  meal: '🥗',
  sleep: '🌙',
  recovery: '🔋',
  weight: '⚖️',
  measurements: '📏',
  profile: '👤'
};

export const PersistenceNotificationToast: React.FC = () => {
  const { currentEvent, clearEvent } = usePersistenceStore();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!currentEvent) {
      setProgress(100);
      return;
    }

    if (currentEvent.status === 'saved') {
      triggerHaptic('light');
    } else if (currentEvent.status === 'failed') {
      triggerHaptic('heavy');
    }

    setProgress(100);
    const duration = currentEvent.status === 'saving' ? 5000 : 2000;
    const intervalTime = 30;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentEvent?.id, currentEvent?.status]);

  if (!currentEvent) return null;

  const emoji = ENTITY_EMOJIS[currentEvent.entity] || '⚡';
  const isSaving = currentEvent.status === 'saving';
  const isSaved = currentEvent.status === 'saved';
  const isQueued = currentEvent.status === 'queued';
  const isFailed = currentEvent.status === 'failed';

  // Format clean human message
  const cleanMessage = currentEvent.message
    .replace(' to TiDB Cloud', '')
    .replace(' from TiDB Cloud', '')
    .replace(' to cloud', '')
    .replace(' from cloud', '');

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-auto animate-slide-down max-w-[94vw] sm:max-w-md transition-all duration-300"
      style={{
        top: 'max(calc(env(safe-area-inset-top, 0px) + 16px), 56px)'
      }}
    >
      <div
        className={clsx(
          'relative overflow-hidden rounded-full border shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 px-3.5 sm:px-4 py-2 flex items-center gap-2.5 sm:gap-3',
          isSaving && 'bg-[#081226]/95 border-cyan-500/40 text-cyan-200 shadow-cyan-950/50',
          isSaved && 'bg-[#061B14]/95 border-emerald-500/45 text-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.35)]',
          isQueued && 'bg-[#1D1204]/95 border-amber-500/45 text-amber-200 shadow-amber-950/50',
          isFailed && 'bg-[#20050E]/95 border-rose-500/45 text-rose-200 shadow-rose-950/50'
        )}
      >
        {/* Ambient Subtle Radial Glow */}
        <div 
          className={clsx(
            'absolute inset-0 rounded-full opacity-20 blur-lg pointer-events-none',
            isSaving && 'bg-cyan-400',
            isSaved && 'bg-emerald-400',
            isQueued && 'bg-amber-400',
            isFailed && 'bg-rose-400'
          )}
        />

        {/* Left Icon Pill */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center border shadow-inner transition-transform',
              isSaving && 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400',
              isSaved && 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
              isQueued && 'bg-amber-500/20 border-amber-400/40 text-amber-300',
              isFailed && 'bg-rose-500/20 border-rose-400/40 text-rose-300 animate-pulse'
            )}
          >
            {isSaving && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
            {isSaved && <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />}
            {isQueued && <CloudOff className="w-3.5 h-3.5 text-amber-300" />}
            {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />}
          </div>
        </div>

        {/* Message and Status */}
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <span className="text-xs shrink-0 select-none">{emoji}</span>
          <span className="text-xs sm:text-[13px] font-black text-white tracking-tight truncate">
            {cleanMessage}
          </span>

          {/* Micro cloud sync tag */}
          <span 
            className={clsx(
              'hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold border shrink-0',
              isSaving && 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
              isSaved && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
              isQueued && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
              isFailed && 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            )}
          >
            <span 
              className={clsx(
                'w-1.5 h-1.5 rounded-full',
                isSaving && 'bg-cyan-400 animate-pulse',
                isSaved && 'bg-emerald-400 shadow-[0_0_6px_#10B981]',
                isQueued && 'bg-amber-400',
                isFailed && 'bg-rose-400'
              )} 
            />
            {isSaving ? 'Syncing' : isSaved ? 'TiDB Cloud ⚡' : isQueued ? 'Offline' : 'Error'}
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            clearEvent();
          }}
          className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0 ml-0.5 pressable"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Sleek Bottom Hairline Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/40 overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className={clsx(
              'h-full transition-all duration-75',
              isSaving && 'bg-gradient-to-r from-cyan-400 to-blue-400',
              isSaved && 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_8px_#10B981]',
              isQueued && 'bg-gradient-to-r from-amber-400 to-orange-400',
              isFailed && 'bg-gradient-to-r from-rose-400 to-red-400'
            )}
          />
        </div>
      </div>
    </div>
  );
};
