import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { Flame, Dumbbell, Sparkles, Scale } from 'lucide-react';

import { selectCurrentWorkoutStreak } from '@/utils/streak';

interface TopHeaderProps {
  onOpenActiveWorkout?: () => void;
  onOpenAIAdvisor?: () => void;
  onOpenProfile?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  onOpenActiveWorkout, 
  onOpenAIAdvisor,
  onOpenProfile 
}) => {
  const { user } = useAuthStore();
  const { workouts, activeWorkout } = useWorkoutStore();

  // Canonical streak calculation
  const streak = selectCurrentWorkoutStreak(workouts);

  return (
    <header 
      className="sticky top-0 z-30 pb-2.5 bg-[#080B11]/95 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between transition-all"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 36px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)'
      }}
    >
      {/* Brand logo & OS badge */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20 glow-volt shrink-0 overflow-hidden">
          <img 
            src="/app-logo.png" 
            alt="FitForge Logo" 
            className="w-full h-full object-cover rounded-[10px]"
            onError={(e) => {
              // Fallback to dumbbell icon if image is loading
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="w-full h-full bg-[#080B11] rounded-[10px] flex items-center justify-center -z-10 absolute inset-0">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-black text-base text-white tracking-tight">FITFORGE</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              OS
            </span>
          </div>
        </div>
      </div>

      {/* Right controls: Sync status, Active workout pill, AI advisor trigger, Streak pill, User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <SyncStatusBadge size="sm" />
        
        {activeWorkout && (
          <button
            onClick={onOpenActiveWorkout}
            className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 animate-pulse pressable shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </button>
        )}

        <button
          onClick={onOpenAIAdvisor}
          className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-colors pressable shrink-0"
          title="Open AI Fitness Advisor"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {/* Streak */}
        <div className="px-2 py-0.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          {streak}d
        </div>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-sm hover:scale-105 active:scale-95 transition-all pressable shrink-0"
          title={`Profile (${user.name})`}
        >
          <div className="w-full h-full bg-[#080B11] rounded-full flex items-center justify-center">
            <span className="text-[11px] font-black text-emerald-400 uppercase">
              {user.name ? user.name[0] : 'U'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
