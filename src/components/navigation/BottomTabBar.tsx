import React from 'react';
import { Home, Dumbbell, Sparkles, Utensils, TrendingUp, User, Plus } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { useWorkoutStore } from '@/store/useWorkoutStore';

export type TabKey = 'home' | 'workout' | 'health' | 'nutrition' | 'progress' | 'profile';

interface BottomTabBarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenQuickAction: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAction
}) => {
  const { activeWorkout } = useWorkoutStore();

  const leftTabs: { key: TabKey; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    { 
      key: 'home', 
      label: 'Home', 
      icon: (active) => <Home className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'scale-110' : ''}`} /> 
    },
    { 
      key: 'workout', 
      label: 'Workout', 
      icon: (active) => (
        <div className="relative">
          <Dumbbell className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
          {activeWorkout && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'health', 
      label: 'Health', 
      icon: (active) => (
        <Sparkles className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'scale-110 fill-emerald-400/20' : ''}`} />
      )
    }
  ];

  const rightTabs: { key: TabKey; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    { 
      key: 'nutrition', 
      label: 'Fuel', 
      icon: (active) => <Utensils className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'scale-110' : ''}`} /> 
    },
    { 
      key: 'progress', 
      label: 'Progress', 
      icon: (active) => <TrendingUp className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'scale-110' : ''}`} /> 
    },
    { 
      key: 'profile', 
      label: 'Profile', 
      icon: (active) => <User className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'scale-110' : ''}`} /> 
    }
  ];

  const handleTabClick = (key: TabKey) => {
    triggerHaptic('light');
    onSelectTab(key);
  };

  const handleFabClick = () => {
    triggerHaptic('medium');
    onOpenQuickAction();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070A12]/95 backdrop-blur-3xl px-2 pt-1.5 pb-safe touch-none-callout shadow-[0_-12px_40px_rgba(0,0,0,0.85)] border-t border-white/[0.07]">
      {/* Top Hairline Neon Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 via-teal-400/30 to-transparent" />

      <div className="flex items-center justify-between max-w-lg mx-auto relative px-0.5">
        {/* Left three tabs (Home, Workout, Health) */}
        {leftTabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all pressable relative ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                isActive 
                  ? 'bg-gradient-to-b from-emerald-500/25 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_14px_rgba(16,185,129,0.3)]' 
                  : 'bg-transparent text-slate-400 hover:bg-white/5'
              }`}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[9.5px] tracking-tight font-medium transition-all duration-200 truncate max-w-[48px] ${
                isActive ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-2.5 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)] absolute -bottom-0.5" />
              )}
            </button>
          );
        })}

        {/* Center Floating Jewel FAB Button (Centered with 3 tabs left & 3 tabs right) */}
        <div className="flex-1 flex justify-center -mt-6 shrink-0 px-1">
          <button
            onClick={handleFabClick}
            aria-label="Quick Action"
            className="group relative w-13 h-13 rounded-full flex items-center justify-center pressable transition-all duration-300 active:scale-90"
            title="Quick Log Activity"
          >
            {/* Outer ambient glow pulse */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md group-hover:bg-emerald-500/50 transition-all duration-300 animate-pulse" />
            
            {/* Glossy Jewel Body */}
            <div className="relative w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-400 to-emerald-300 p-[1.5px] shadow-[0_6px_25px_rgba(16,185,129,0.5)] group-hover:shadow-[0_8px_30px_rgba(16,185,129,0.7)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center border border-white/40 shadow-inner">
                <Plus className="w-6 h-6 text-slate-950 stroke-[3] transition-transform duration-300 group-hover:rotate-90 group-active:rotate-45" />
              </div>
            </div>
          </button>
        </div>

        {/* Right three tabs (Fuel, Progress, Profile) */}
        {rightTabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all pressable relative ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                isActive 
                  ? 'bg-gradient-to-b from-emerald-500/25 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_14px_rgba(16,185,129,0.3)]' 
                  : 'bg-transparent text-slate-400 hover:bg-white/5'
              }`}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[9.5px] tracking-tight font-medium transition-all duration-200 truncate max-w-[48px] ${
                isActive ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-2.5 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)] absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
