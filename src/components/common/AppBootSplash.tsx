import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { 
  Sparkles, 
  Dumbbell, 
  Zap, 
  Cloud, 
  CheckCircle2, 
  Shield, 
  Activity,
  ChevronRight
} from 'lucide-react';

interface AppBootSplashProps {
  onComplete: () => void;
  isDataReady?: boolean;
}

const BOOT_STAGES = [
  { threshold: 20, message: 'Initializing Neural Hypertrophy Core...', icon: Zap, color: 'text-amber-400' },
  { threshold: 50, message: 'Connecting to TiDB Cloud Database...', icon: Cloud, color: 'text-cyan-400' },
  { threshold: 80, message: 'Reconciling Biometric & Nutrition Telemetry...', icon: Activity, color: 'text-purple-400' },
  { threshold: 100, message: 'Systems Calibrated • Launching FitForge OS', icon: CheckCircle2, color: 'text-emerald-400' }
];

export const AppBootSplash: React.FC<AppBootSplashProps> = ({ onComplete, isDataReady = false }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Smooth realistic boot progress sequence
  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      // Accelerate if database sync is finished
      const increment = isDataReady 
        ? Math.floor(Math.random() * 8) + 6 
        : Math.floor(Math.random() * 4) + 2;

      currentProgress = Math.min(100, currentProgress + increment);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        triggerHaptic('success');
        
        // Brief pause at 100% for visual satisfaction before cinematic fade
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 550);
        }, 350);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [isDataReady, onComplete]);

  // Current stage message
  const currentStage = BOOT_STAGES.find(s => progress <= s.threshold) || BOOT_STAGES[BOOT_STAGES.length - 1];
  const StageIcon = currentStage.icon;

  return (
    <div 
      style={{
        paddingTop: 'max(20px, env(safe-area-inset-top, 32px))',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom, 24px))'
      }}
      className={`fixed inset-0 z-[100] bg-[#050811] text-slate-100 flex flex-col items-center justify-between px-6 sm:px-10 select-none overflow-hidden transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Pulsing Aurora Beacons */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 -left-20 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-10 -right-20 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header / System Badge */}
      <div className="w-full flex items-center justify-between max-w-md relative z-10 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
            TiDB Cloud • Direct Link
          </span>
        </div>

        <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 glow-volt shadow-sm">
          v2.4 APEX
        </span>
      </div>

      {/* Center: Glowing Kinetic Core & Brand Emblem */}
      <div className="flex flex-col items-center justify-center text-center my-auto relative z-10 max-w-sm space-y-6">
        
        {/* Futuristic Orbital Energy Ring Container */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          
          {/* Rotating Outer Dashed Orbit */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/25 animate-spin [animation-duration:14s]" />
          
          {/* Counter-Rotating Concentric Orbit */}
          <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/30 animate-spin [animation-duration:9s] [animation-direction:reverse]" />
          
          {/* Radial Pulse Glow Sphere */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 blur-md animate-pulse" />

          {/* Central 3D Jewel Emblem */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0E1B2E] via-[#091220] to-[#050B14] border-2 border-emerald-400/60 shadow-[0_0_35px_rgba(16,185,129,0.4)] flex items-center justify-center group hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-400/10 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-emerald-400 stroke-[2.5] drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </div>
          </div>
        </div>

        {/* Brand Titles */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans flex items-center justify-center gap-2">
            FITFORGE
            <span className="text-emerald-400 font-mono text-sm uppercase px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-black">
              PRO
            </span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
            Autonomous Hypertrophy & Performance OS
          </p>
        </div>

        {/* Dynamic Progress Capsule Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-mono px-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5 truncate max-w-[240px]">
              <StageIcon className={`w-3.5 h-3.5 ${currentStage.color} shrink-0 animate-pulse`} />
              <span className="truncate">{currentStage.message}</span>
            </span>
            <span className="text-emerald-400 font-black shrink-0">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-900/90 border border-white/10 p-[1px] overflow-hidden shadow-inner">
            <div 
              style={{ width: `${progress}%` }} 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.7)] transition-all duration-150 ease-out" 
            />
          </div>
        </div>

      </div>

      {/* Bottom Footer Telemetry Badges */}
      <div className="w-full max-w-md relative z-10 flex items-center justify-between text-[10.5px] font-mono text-slate-400 pb-2 border-t border-white/10 pt-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Encrypted Relational Sync</span>
        </div>

        <button 
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            setIsFadingOut(true);
            setTimeout(onComplete, 400);
          }}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 pressable"
        >
          <span>Skip Boot</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
