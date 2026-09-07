import React, { useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { DailyMetricsModal, MetricTab } from '@/components/body/DailyMetricsModal';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { 
  Dumbbell, 
  Utensils, 
  Droplets, 
  Scale, 
  Moon, 
  X, 
  Plus, 
  Check, 
  Zap,
  Activity,
  Sparkles
} from 'lucide-react';

import { TabKey } from '@/components/navigation/BottomTabBar';
import { triggerHaptic } from '@/utils/haptics';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabKey) => void;
  onOpenActiveWorkout: () => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenActiveWorkout
}) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const [metricsTab, setMetricsTab] = useState<MetricTab | null>(null);

  if (!isOpen && metricsTab === null) return null;

  const handleStartWorkout = () => {
    triggerHaptic('medium');
    if (!activeWorkout) {
      startWorkout('Upper Body Power');
    }
    onClose();
    onOpenActiveWorkout();
  };

  const handleOpenMetric = (tab: MetricTab) => {
    triggerHaptic('light');
    setMetricsTab(tab);
  };

  return (
    <>
      {isOpen && metricsTab === null && (
        <div 
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0E1322] border-t border-white/10 rounded-t-3xl p-5 shadow-2xl animate-slide-up pb-safe pb-8"
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-600/60 mx-auto mb-3.5" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Zero-Friction Logging</span>
                <h3 className="text-lg font-black text-white">Quick Actions</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of 6 High-Impact Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Start / Resume Workout */}
              <button
                onClick={handleStartWorkout}
                className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-[#12192B] border border-emerald-500/30 text-left hover:border-emerald-500/60 transition-all pressable group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">
                  {activeWorkout ? 'Resume Workout' : 'Start Workout'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeWorkout ? 'Currently in progress' : 'Live sets & ghost weights'}
                </div>
              </button>

              {/* 2. Log Food */}
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('nutrition');
                }}
                className="p-4 rounded-2xl bg-[#12192B] border border-orange-500/30 text-left hover:border-orange-500/60 transition-all pressable group"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">Log Food</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Track calories & macros</div>
              </button>

              {/* 3. Hydration */}
              <button
                onClick={() => handleOpenMetric('hydration')}
                className="p-4 rounded-2xl bg-[#12192B] border border-cyan-500/30 text-left hover:border-cyan-500/60 transition-all pressable group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">Log Water</div>
                <div className="text-[11px] text-slate-400 mt-0.5">1-Tap +250 / +500ml</div>
              </button>

              {/* 4. Body Weight & Stats */}
              <button
                onClick={() => handleOpenMetric('weight')}
                className="p-4 rounded-2xl bg-[#12192B] border border-amber-500/30 text-left hover:border-amber-500/60 transition-all pressable group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">Log Weight</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Weigh-in & body tape</div>
              </button>

              {/* 5. Sleep */}
              <button
                onClick={() => handleOpenMetric('sleep')}
                className="p-4 rounded-2xl bg-[#12192B] border border-purple-500/30 text-left hover:border-purple-500/60 transition-all pressable group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">Log Sleep</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Duration & quality score</div>
              </button>

              {/* 6. Recovery & Soreness */}
              <button
                onClick={() => handleOpenMetric('recovery')}
                className="p-4 rounded-2xl bg-[#12192B] border border-emerald-500/30 text-left hover:border-emerald-500/60 transition-all pressable group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">Recovery Score</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Soreness & readiness</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded High-Fidelity Universal Daily Metrics Modal */}
      <DailyMetricsModal
        isOpen={metricsTab !== null}
        onClose={() => {
          setMetricsTab(null);
          onClose();
        }}
        initialTab={metricsTab || 'weight'}
      />
    </>
  );
};
