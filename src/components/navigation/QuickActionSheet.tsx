import React, { useState } from 'react';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { DailyMetricsModal, MetricTab } from '@/components/body/DailyMetricsModal';
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal';
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
  Sparkles,
  Timer,
  SlidersHorizontal,
  Flame,
  Bot,
  Layers,
  ChevronRight,
  TrendingUp,
  HeartPulse
} from 'lucide-react';

import { TabKey } from '@/components/navigation/BottomTabBar';
import { triggerHaptic } from '@/utils/haptics';
import { getToday } from '@/utils/date';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabKey) => void;
  onOpenActiveWorkout: () => void;
  onOpenAIAdvisor?: (query?: string) => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenActiveWorkout,
  onOpenAIAdvisor
}) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const { startWorkout, activeWorkout, activeWorkoutElapsedSeconds, resumeActiveWorkoutTimer, startRestTimer } = useWorkoutStore();
  const { addWater, getWaterForDate } = useHydrationStore();
  const { getLatestWeight } = useBodyStore();
  const { getDailyTotals } = useNutritionStore();

  const [metricsTab, setMetricsTab] = useState<MetricTab | null>(null);
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [quickToast, setQuickToast] = useState<string | null>(null);

  const todayStr = getToday();
  const todayWater = getWaterForDate(todayStr);
  const latestWeight = getLatestWeight();
  const dailyNutrition = getDailyTotals(todayStr);

  if (!isOpen && metricsTab === null && !isPlateCalcOpen) return null;

  const showQuickToast = (msg: string) => {
    setQuickToast(msg);
    setTimeout(() => {
      setQuickToast((prev) => (prev === msg ? null : prev));
    }, 2000);
  };

  const handleStartWorkout = () => {
    triggerHaptic('heavy');
    if (activeWorkout) {
      resumeActiveWorkoutTimer();
    } else {
      startWorkout('Custom Workout Session');
    }
    onClose();
    onOpenActiveWorkout();
  };

  const handleOpenMetric = (tab: MetricTab) => {
    triggerHaptic('light');
    setMetricsTab(tab);
  };

  const handleQuickHydrate = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    addWater(amount);
    showQuickToast(`+${amount}ml Water Logged! (${todayWater + amount}ml today)`);
  };

  const handleQuickRestTimer = (secs: number, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    startRestTimer(secs);
    showQuickToast(`Rest Timer started for ${secs}s!`);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      {isOpen && metricsTab === null && !isPlateCalcOpen && (
        <div 
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md animate-fade-in"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#090D18] border-t border-white/10 rounded-t-[32px] p-5 sm:p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col overflow-hidden relative"
          >
            {/* Ambient Background Aura */}
            <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Mobile Sheet Grab Handle */}
            <div className="w-14 h-1.5 rounded-full bg-slate-600/70 mx-auto mb-3.5 shrink-0" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold glow-volt shadow-inner">
                  <Zap className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-tight">Quick Action Command</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      Zero-Friction
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1-Tap telemetry logging & instant workout controls
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Toast */}
            {quickToast && (
              <div className="mb-3 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in shadow-md">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{quickToast}</span>
              </div>
            )}

            {/* Main Scrollable Grid of 8 High-Impact Actions */}
            <div className="overflow-y-auto pr-1 space-y-3 flex-1 pb-4 relative z-10">
              
              {/* PRIMARY HERO: Start / Resume Workout */}
              <button
                onClick={handleStartWorkout}
                className="w-full p-4 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-[#0E1A2C] to-[#0A1220] border border-emerald-500/40 text-left hover:border-emerald-400 transition-all pressable group shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-inner shrink-0">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">
                        {activeWorkout ? '⚡ Resume Active Session' : '🚀 Start Workout Session'}
                      </span>
                      {activeWorkout && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse font-bold">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      {activeWorkout 
                        ? `${activeWorkout.name} • ${formatTimer(activeWorkoutElapsedSeconds)} elapsed` 
                        : 'Live sets, ghost weights & auto plate math'}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black shadow-md glow-volt group-hover:translate-x-1 transition-transform shrink-0">
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </div>
              </button>

              {/* 2-Column Grid for Fast Logging Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* 1. Log Food / Nutrition */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('nutrition');
                  }}
                  className="p-3.5 rounded-2xl bg-[#0E1528] border border-orange-500/30 text-left hover:border-orange-500/60 transition-all pressable group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                      {Math.round(dailyNutrition.calories)} kcal
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Log Nutrition</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      {Math.round(dailyNutrition.protein)}g protein logged
                    </div>
                  </div>
                </button>

                {/* 2. Hydration with 1-Tap Quick Increment Chips */}
                <div 
                  onClick={() => handleOpenMetric('hydration')}
                  className="p-3.5 rounded-2xl bg-[#0E1528] border border-cyan-500/30 text-left hover:border-cyan-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                      {todayWater}ml
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Log Water</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleQuickHydrate(250, e)}
                        className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold transition-all active:scale-95"
                      >
                        +250ml
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleQuickHydrate(500, e)}
                        className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold transition-all active:scale-95"
                      >
                        +500ml
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Log Body Weight */}
                <button
                  onClick={() => handleOpenMetric('weight')}
                  className="p-3.5 rounded-2xl bg-[#0E1528] border border-amber-500/30 text-left hover:border-amber-500/60 transition-all pressable group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Scale className="w-4 h-4" />
                    </div>
                    {latestWeight !== null && latestWeight !== undefined && (
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        {latestWeight} kg
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Log Weight</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      Weigh-in & body tape
                    </div>
                  </div>
                </button>

                {/* 4. Sleep Tracker */}
                <button
                  onClick={() => handleOpenMetric('sleep')}
                  className="p-3.5 rounded-2xl bg-[#0E1528] border border-purple-500/30 text-left hover:border-purple-500/60 transition-all pressable group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      Auto-Calc
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Log Sleep</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      Bedtime & wake duration
                    </div>
                  </div>
                </button>

                {/* 5. Recovery & Readiness */}
                <button
                  onClick={() => handleOpenMetric('recovery')}
                  className="p-3.5 rounded-2xl bg-[#0E1528] border border-teal-500/30 text-left hover:border-teal-500/60 transition-all pressable group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md">
                      CNS Score
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Recovery Score</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      Soreness & readiness check
                    </div>
                  </div>
                </button>

                {/* 6. Plate Math Calculator */}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsPlateCalcOpen(true);
                  }}
                  className="p-3.5 rounded-2xl bg-[#0E1528] border border-indigo-500/30 text-left hover:border-indigo-500/60 transition-all pressable group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      Barbell Math
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Plate Calculator</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      Exact plate configuration
                    </div>
                  </div>
                </button>

              </div>

              {/* 7. Quick Rest Timer Dock */}
              <div className="p-3.5 rounded-2xl bg-[#0B101E] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">Launch Rest Timer:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  {[30, 60, 90, 120].map((secs) => (
                    <button
                      key={secs}
                      type="button"
                      onClick={(e) => handleQuickRestTimer(secs, e)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 text-xs font-bold transition-all active:scale-95"
                    >
                      {secs}s
                    </button>
                  ))}
                </div>
              </div>

              {/* 8. AI Fitness Advisor Quick Ask */}
              {onOpenAIAdvisor && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onClose();
                    onOpenAIAdvisor('Analyze my training volume and give me optimization tips for today.');
                  }}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#101426] to-[#0D1222] border border-purple-500/30 hover:border-purple-500/60 text-left transition-all flex items-center justify-between pressable group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Ask AI Coach</span>
                        <Sparkles className="w-3 h-3 text-purple-400 fill-purple-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Instant biomechanical feedback & form analysis
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-300 transition-colors" />
                </button>
              )}

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

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={isPlateCalcOpen}
        onClose={() => setIsPlateCalcOpen(false)}
        initialWeight={60}
      />
    </>
  );
};
