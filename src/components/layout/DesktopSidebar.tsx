import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { TabKey } from '@/components/navigation/BottomTabBar';
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  TrendingUp, 
  Settings, 
  Sparkles, 
  Plus, 
  Flame, 
  Scale, 
  Database,
  Play,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

interface DesktopSidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenQuickAction: () => void;
  onOpenActiveWorkout: () => void;
  onOpenAIAdvisor: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAction,
  onOpenActiveWorkout,
  onOpenAIAdvisor
}) => {
  const { user, toggleUnitSystem } = useAuthStore();
  const { activeWorkout } = useWorkoutStore();

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { key: 'workout', label: 'Workout Hub', icon: <Dumbbell className="w-4 h-4" /> },
    { key: 'health', label: 'Health & Recovery', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'nutrition', label: 'Nutrition & Macros', icon: <Utensils className="w-4 h-4" /> },
    { key: 'progress', label: 'Analytics & Body', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'profile', label: 'Settings & Cloud', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-[#070A11] border-r border-white/[0.08] p-5 shrink-0 z-30 justify-between select-none shadow-2xl">
      
      {/* 1. Header & Brand */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 p-[1.5px] shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg text-white tracking-tight">FITFORGE</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Personal Fitness Intelligence</p>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 pressable transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Quick Log Activity
        </button>

        {/* Navigation List */}
        <nav className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-3 mb-2">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all pressable ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-300 border border-emerald-500/30 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />}
              </button>
            );
          })}

          {/* Special AI Fitness Advisor Link */}
          <div className="pt-2">
            <button
              onClick={onOpenAIAdvisor}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all pressable bg-gradient-to-r from-purple-950/40 to-purple-900/10 border border-purple-500/30 text-purple-200 hover:border-purple-500/60 shadow-md"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold">AI Fitness Analyst</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold">
                PRO
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* 2. Footer: Active Workout & User Card */}
      <div className="space-y-3">
        {activeWorkout && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Live Session</span>
              </div>
              <button
                onClick={onOpenActiveWorkout}
                className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase pressable"
              >
                Resume
              </button>
            </div>
            <div className="text-xs font-bold text-white truncate">{activeWorkout.name}</div>
          </div>
        )}

        {/* User Card */}
        <div className="p-3 rounded-2xl bg-[#0E1322] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#0B101D] rounded-[10px] flex items-center justify-center font-bold text-xs text-emerald-400">
                {user.name.slice(0, 1)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono capitalize truncate">{user.goals.goalType.replace('_', ' ')}</div>
            </div>
          </div>

          <button
            onClick={toggleUnitSystem}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[10px] font-bold transition-colors"
            title="Toggle Units (KG / LB)"
          >
            {user.unitSystem.toUpperCase()}
          </button>
        </div>
      </div>

    </aside>
  );
};
