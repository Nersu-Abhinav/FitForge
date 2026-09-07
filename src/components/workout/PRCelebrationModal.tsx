import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { Trophy, Flame, X, Sparkles } from 'lucide-react';

export const PRCelebrationModal: React.FC = () => {
  const { latestPRCelebration, clearPRCelebration } = useWorkoutStore();
  const { handleBackdropClick } = useModalBehavior({
    isOpen: Boolean(latestPRCelebration),
    onClose: clearPRCelebration
  });

  useEffect(() => {
    if (latestPRCelebration) {
      // Fire confetti cannons
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#06B6D4', '#F59E0B', '#FFFFFF']
        });
      } catch (e) {
        // Fallback gracefully
      }
    }
  }, [latestPRCelebration]);

  if (!latestPRCelebration) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm glass-card rounded-3xl p-6 border border-emerald-500/40 text-center shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Glow ambient */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={clearPRCelebration}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-emerald-500/30 border border-amber-400/40 flex items-center justify-center mb-4 shadow-lg glow-amber animate-bounce" style={{ animationDuration: '2s' }}>
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          New Personal Record
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-1">
          {latestPRCelebration.exerciseName}
        </h2>

        <div className="my-4 py-4 px-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono">Weight Lifted</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {latestPRCelebration.weightKg} <span className="text-base font-normal text-slate-300">kg</span>
            </div>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono">Reps Completed</div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {latestPRCelebration.reps} <span className="text-base font-normal text-slate-400">reps</span>
            </div>
          </div>
        </div>

        {latestPRCelebration.previousValue && (
          <p className="text-xs text-slate-400 mb-5">
            Previous best: <span className="font-semibold text-slate-200">{latestPRCelebration.previousValue} kg</span> (+{(latestPRCelebration.value - latestPRCelebration.previousValue).toFixed(1)} kg increase)
          </p>
        )}

        <button
          onClick={clearPRCelebration}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg glow-volt hover:brightness-110 pressable transition-all"
        >
          Keep Crushing It 🔥
        </button>
      </div>
    </div>
  );
};
