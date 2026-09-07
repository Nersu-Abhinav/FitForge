import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { 
  Flame, 
  Dumbbell, 
  Sparkles, 
  Droplets, 
  Activity, 
  Database, 
  Search,
  Plus
} from 'lucide-react';

import { getToday, getYesterday, getLocalDateString } from '@/utils/date';

interface DesktopHeaderProps {
  onOpenActiveWorkout: () => void;
  onOpenQuickAction: () => void;
  onOpenAIAdvisor: () => void;
}

import { selectCurrentWorkoutStreak } from '@/utils/streak';

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  onOpenActiveWorkout,
  onOpenQuickAction,
  onOpenAIAdvisor
}) => {
  const { user } = useAuthStore();
  const { workouts, activeWorkout, startWorkout } = useWorkoutStore();
  const { addWater } = useHydrationStore();

  // Compute canonical real-time streak
  const streak = selectCurrentWorkoutStreak(workouts);

  return (
    <header className="sticky top-0 z-20 w-full bg-[#070A11]/85 backdrop-blur-xl border-b border-white/[0.08] px-8 py-4 flex items-center justify-between shadow-sm">
      {/* Search / Command Bar */}
      <div className="flex items-center gap-3 w-full max-w-sm">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exercises, logs, meals..."
            className="w-full pl-9 pr-4 py-2 bg-[#0E1322] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right controls: Live TiDB / Offline Sync Badge, Real Streak, +500ml, Start/Resume workout */}
      <div className="flex items-center gap-3">
        {/* Offline-First TiDB Sync Status Badge */}
        <SyncStatusBadge />

        {/* Real-time Dynamic Workout Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          {streak > 0 ? `${streak}d Streak` : '0d Streak'}
        </div>

        {/* 1-Tap Water Logger */}
        <button
          onClick={() => addWater(500)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-300 text-xs font-mono font-bold transition-all pressable"
          title="Quick log 500ml water"
        >
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          +500ml
        </button>

        {/* Start / Resume Workout Button */}
        {activeWorkout ? (
          <button
            onClick={onOpenActiveWorkout}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:brightness-110 pressable transition-all flex items-center gap-1.5"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Resume Session
          </button>
        ) : (
          <button
            onClick={() => {
              startWorkout('Workout Session');
              onOpenActiveWorkout();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 pressable transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Start Session
          </button>
        )}
      </div>
    </header>
  );
};

