import React, { useEffect } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Timer, Plus, X, Play, RotateCcw } from 'lucide-react';

export const RestTimerFloating: React.FC = () => {
  const { restTimer, tickRestTimer, stopRestTimer, adjustRestTimer, startRestTimer } = useWorkoutStore();

  useEffect(() => {
    if (!restTimer.isActive || restTimer.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      tickRestTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.remainingSeconds, tickRestTimer]);

  if (!restTimer.isActive && restTimer.remainingSeconds === 0) return null;

  const minutes = Math.floor(restTimer.remainingSeconds / 60);
  const seconds = restTimer.remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = restTimer.totalDuration > 0 ? (restTimer.remainingSeconds / restTimer.totalDuration) : 0;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px] animate-slide-up">
      <div className="glass-panel rounded-2xl p-4 shadow-2xl border border-emerald-500/30 bg-[#0E1424]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Timer className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                Rest Timer
                {restTimer.exerciseName && (
                  <span className="text-[11px] text-slate-400 lowercase">• set {restTimer.setNumber || 1} done</span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate max-w-[180px]">
                {restTimer.exerciseName || 'Recover for next set'}
              </div>
            </div>
          </div>

          <button
            onClick={stopRestTimer}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timer Display & Quick Adjust */}
        <div className="flex items-center justify-between gap-3 bg-black/40 rounded-xl p-3 border border-white/5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
              {formattedTime}
            </span>
            <span className="text-xs font-mono text-slate-500">
              / {Math.floor(restTimer.totalDuration / 60)}:{String(restTimer.totalDuration % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => adjustRestTimer(15)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-200 text-xs font-mono font-medium transition-all pressable"
            >
              +15s
            </button>
            <button
              onClick={() => adjustRestTimer(30)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-200 text-xs font-mono font-medium transition-all pressable"
            >
              +30s
            </button>
            <button
              onClick={stopRestTimer}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs tracking-tight hover:bg-emerald-400 transition-all pressable"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
            style={{ width: `${progressPct * 100}%` }}
          />
        </div>

        {/* Preset Chips */}
        <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-white/5">
          <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
          {[60, 90, 120, 180].map((seconds) => (
            <button
              key={seconds}
              onClick={() => startRestTimer(seconds, restTimer.exerciseName, restTimer.setNumber)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
