import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { triggerHaptic } from '@/utils/haptics';
import { 
  X, 
  Dumbbell, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus, 
  Sparkles,
  Layers,
  SlidersHorizontal,
  Zap,
  Flame,
  Info
} from 'lucide-react';

export interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  equipmentType?: 'Barbell' | 'Dumbbell' | string;
  onApplyWeight?: (weightKg: number) => void;
  title?: string;
}

interface PlateOption {
  weight: number;
  color: string;
  borderColor: string;
  textColor: string;
  label: string;
  heightPx: number;
  widthPx: number;
  gradient: string;
}

const AVAILABLE_PLATES: PlateOption[] = [
  { weight: 25, color: 'bg-red-600', borderColor: 'border-red-400', textColor: 'text-white', label: '25 kg', heightPx: 80, widthPx: 14, gradient: 'from-red-500 via-red-600 to-red-800' },
  { weight: 20, color: 'bg-blue-600', borderColor: 'border-blue-400', textColor: 'text-white', label: '20 kg', heightPx: 76, widthPx: 13, gradient: 'from-blue-500 via-blue-600 to-blue-800' },
  { weight: 15, color: 'bg-amber-500', borderColor: 'border-amber-300', textColor: 'text-slate-950', label: '15 kg', heightPx: 70, widthPx: 12, gradient: 'from-amber-400 via-amber-500 to-amber-700' },
  { weight: 10, color: 'bg-emerald-600', borderColor: 'border-emerald-400', textColor: 'text-white', label: '10 kg', heightPx: 62, widthPx: 11, gradient: 'from-emerald-500 via-emerald-600 to-emerald-800' },
  { weight: 5, color: 'bg-slate-200', borderColor: 'border-white', textColor: 'text-slate-900', label: '5 kg', heightPx: 52, widthPx: 10, gradient: 'from-slate-100 via-slate-200 to-slate-400' },
  { weight: 2.5, color: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', label: '2.5 kg', heightPx: 44, widthPx: 8, gradient: 'from-slate-700 via-slate-800 to-slate-950' },
  { weight: 1.25, color: 'bg-zinc-400', borderColor: 'border-zinc-200', textColor: 'text-zinc-950', label: '1.25 kg', heightPx: 38, widthPx: 7, gradient: 'from-zinc-300 via-zinc-400 to-zinc-500' },
  { weight: 0.5, color: 'bg-purple-600', borderColor: 'border-purple-300', textColor: 'text-white', label: '0.5 kg', heightPx: 32, widthPx: 6, gradient: 'from-purple-500 via-purple-600 to-purple-800' },
];

const STANDARD_BARS = [
  { name: 'Olympic 7ft', weight: 20, desc: "Standard Men's Bar (20 kg / 44 lbs)" },
  { name: "Women's 6.6ft", weight: 15, desc: "Olympic Standard (15 kg / 33 lbs)" },
  { name: 'EZ-Curl Bar', weight: 10, desc: 'Bicep/Tricep Bar (10 kg / 22 lbs)' },
  { name: 'Hex/Trap Bar', weight: 25, desc: 'Deadlift Bar (25 kg / 55 lbs)' },
  { name: 'Smith Bar', weight: 15, desc: 'Guide Bar (15 kg)' },
  { name: 'Custom Bar', weight: 0, desc: 'Custom configured weight' },
];

const DUMBBELL_PRESETS = [
  2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 45, 50
];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeight = 60,
  equipmentType = 'Barbell',
  onApplyWeight,
  title
}) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });

  const [activeTab, setActiveTab] = useState<'Barbell' | 'Dumbbell'>(
    equipmentType === 'Dumbbell' ? 'Dumbbell' : 'Barbell'
  );

  // BARBELL STATE
  const [selectedBarWeight, setSelectedBarWeight] = useState<number>(20);
  const [customBarWeight, setCustomBarWeight] = useState<number>(20);
  const [isCustomBar, setIsCustomBar] = useState<boolean>(false);
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);
  const [calcMode, setCalcMode] = useState<'target' | 'manual'>('target');
  const [manualPlatesPerSide, setManualPlatesPerSide] = useState<number[]>([]);
  const [includeCollars, setIncludeCollars] = useState<boolean>(false);

  // DUMBBELL STATE
  const [dumbbellWeight, setDumbbellWeight] = useState<number>(initialWeight > 0 ? initialWeight : 20);
  const [dumbbellMode, setDumbbellMode] = useState<'pair' | 'single'>('pair');

  const actualBarWeight = isCustomBar ? customBarWeight : selectedBarWeight;
  const collarWeight = includeCollars ? 0.5 : 0;

  // Function to calculate plates from any target weight
  const calculatePlatesForWeight = (weight: number, bar: number, collars: number) => {
    const availableWeight = (weight - bar - collars * 2);
    if (availableWeight <= 0) return [];

    let weightPerSide = availableWeight / 2;
    const plates: number[] = [];

    // Greedy plate stacking algorithm
    for (const p of AVAILABLE_PLATES) {
      while (weightPerSide >= p.weight - 0.001) {
        plates.push(p.weight);
        weightPerSide -= p.weight;
        weightPerSide = Math.round(weightPerSide * 100) / 100;
      }
    }

    return plates;
  };

  // Sync initial weight when modal opens
  useEffect(() => {
    if (isOpen) {
      const starting = initialWeight > 0 ? initialWeight : 60;
      setTargetWeight(starting);
      const initialPlates = calculatePlatesForWeight(starting, 20, 0);
      setManualPlatesPerSide(initialPlates);
      if (equipmentType === 'Dumbbell') {
        setActiveTab('Dumbbell');
        setDumbbellWeight(initialWeight > 0 ? initialWeight : 20);
      } else {
        setActiveTab('Barbell');
      }
    }
  }, [isOpen, initialWeight, equipmentType]);

  // Plates per side
  const calculatedPlatesPerSide = useMemo(() => {
    if (calcMode === 'manual') {
      return manualPlatesPerSide;
    }
    return calculatePlatesForWeight(targetWeight, actualBarWeight, collarWeight);
  }, [calcMode, manualPlatesPerSide, targetWeight, actualBarWeight, collarWeight]);

  // Actual Total Weight on Barbell
  const calculatedTotalBarbellWeight = useMemo(() => {
    const platesTotalPerSide = calculatedPlatesPerSide.reduce((sum, p) => sum + p, 0);
    return Math.round((actualBarWeight + platesTotalPerSide * 2 + collarWeight * 2) * 100) / 100;
  }, [actualBarWeight, calculatedPlatesPerSide, collarWeight]);

  // AUTO-DETECT / AUTO-SYNC WEIGHT in Rack Stacker mode!
  useEffect(() => {
    if (calcMode === 'manual') {
      const autoTotal = calculatedTotalBarbellWeight;
      if (targetWeight !== autoTotal) {
        setTargetWeight(autoTotal);
      }
    }
  }, [calcMode, calculatedTotalBarbellWeight, targetWeight]);

  if (!isOpen) return null;

  // Plate counts map for badge view
  const plateCountSummary = calculatedPlatesPerSide.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleSwitchToManual = () => {
    triggerHaptic('light');
    setCalcMode('manual');
    // Ensure manual plates match current calculated plates
    setManualPlatesPerSide([...calculatedPlatesPerSide]);
    setTargetWeight(calculatedTotalBarbellWeight);
  };

  const handleSwitchToTarget = () => {
    triggerHaptic('light');
    setCalcMode('target');
    setTargetWeight(calculatedTotalBarbellWeight);
  };

  const handleAddManualPlate = (plateWeight: number) => {
    triggerHaptic('medium');
    setCalcMode('manual');
    const nextPlates = [...manualPlatesPerSide, plateWeight].sort((a, b) => b - a);
    setManualPlatesPerSide(nextPlates);
    // Auto-detect updated total weight
    const nextTotal = Math.round((actualBarWeight + nextPlates.reduce((s, p) => s + p, 0) * 2 + collarWeight * 2) * 100) / 100;
    setTargetWeight(nextTotal);
  };

  const handleRemoveManualPlate = (index: number) => {
    triggerHaptic('light');
    setCalcMode('manual');
    const nextPlates = manualPlatesPerSide.filter((_, i) => i !== index);
    setManualPlatesPerSide(nextPlates);
    // Auto-detect updated total weight
    const nextTotal = Math.round((actualBarWeight + nextPlates.reduce((s, p) => s + p, 0) * 2 + collarWeight * 2) * 100) / 100;
    setTargetWeight(nextTotal);
  };

  const handleResetPlates = () => {
    triggerHaptic('medium');
    setManualPlatesPerSide([]);
    setTargetWeight(actualBarWeight + (includeCollars ? 1 : 0));
  };

  const handleStepWeight = (delta: number) => {
    triggerHaptic('light');
    if (calcMode === 'manual') {
      const nextWeight = Math.max(actualBarWeight, targetWeight + delta);
      setTargetWeight(nextWeight);
      const recomputedPlates = calculatePlatesForWeight(nextWeight, actualBarWeight, collarWeight);
      setManualPlatesPerSide(recomputedPlates);
    } else {
      setTargetWeight(prev => Math.max(actualBarWeight, prev + delta));
    }
  };

  const handleApply = () => {
    triggerHaptic('success');
    const finalWeight = activeTab === 'Barbell' ? calculatedTotalBarbellWeight : dumbbellWeight;
    if (onApplyWeight) {
      onApplyWeight(finalWeight);
    }
    onClose();
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-hidden"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] bg-[#0A0E1A] border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col overflow-hidden animate-slide-up hud-border relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-lg ${
              activeTab === 'Barbell' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-volt' 
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 glow-cyan'
            }`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                {title || (activeTab === 'Barbell' ? 'Barbell Plate Calculator' : 'Dumbbell Load Selector')}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {activeTab === 'Barbell' ? 'Auto-detecting total bilateral load' : 'Precision single/pair dumbbell increments'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Barbell vs Dumbbell) */}
        <div className="grid grid-cols-2 gap-2 my-2.5 p-1 bg-[#0E1424] rounded-2xl border border-white/5 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('Barbell');
            }}
            className={`py-2 rounded-xl text-xs font-mono font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'Barbell'
                ? 'bg-emerald-500 text-slate-950 shadow-md glow-volt'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏋️ Barbell + Plates</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('Dumbbell');
            }}
            className={`py-2 rounded-xl text-xs font-mono font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'Dumbbell'
                ? 'bg-cyan-500 text-slate-950 shadow-md glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🪙 Dumbbells</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3.5 pr-1 text-slate-200 relative z-10 w-full min-w-0">
          {activeTab === 'Barbell' ? (
            <>
              {/* Total Weight Live Hero Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0D1829] via-[#0A1220] to-[#080E18] border border-emerald-500/30 flex items-center justify-between shadow-inner w-full min-w-0">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Total Load (Bilateral)
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                      {calculatedTotalBarbellWeight}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">kg</span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({Math.round(calculatedTotalBarbellWeight * 2.20462 * 10) / 10} lbs)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                    {actualBarWeight}kg Bar + {calculatedPlatesPerSide.reduce((s, p) => s + p, 0)}kg plates × 2 {includeCollars ? '+ 1kg Collars' : ''}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={handleResetPlates}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 border border-white/10 transition-colors active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-400" />
                    Clear Bar
                  </button>
                  <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCollars}
                      onChange={(e) => {
                        triggerHaptic('light');
                        setIncludeCollars(e.target.checked);
                      }}
                      className="rounded bg-slate-900 border-white/20 text-emerald-500 focus:ring-0"
                    />
                    Collars (+1kg)
                  </label>
                </div>
              </div>

              {/* Realistic Responsive Barbell Graphic Visualizer with Tap to Unload */}
              <div className="p-3.5 rounded-2xl bg-[#060912] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl w-full min-w-0">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest text-center w-full mb-1 flex items-center justify-center gap-1">
                  <span>Barbell Sleeve • {calculatedPlatesPerSide.length} Plates Loaded / Side</span>
                  <span className="text-emerald-400 font-bold">(Tap Plate to Unload)</span>
                </div>

                {/* The Barbell Graphic Container */}
                <div className="w-full flex items-center justify-center py-2.5 overflow-hidden">
                  <div className="flex items-center max-w-full justify-center">
                    {/* Center Shaft with Realistic Metallic Knurling */}
                    <div className="w-12 sm:w-16 h-3.5 bg-gradient-to-b from-zinc-400 via-zinc-200 to-zinc-500 rounded-l shadow-md border-y border-zinc-600 flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px] opacity-25" />
                      <span className="text-[6px] font-mono text-zinc-900 font-black tracking-widest opacity-70 z-10">KNURL</span>
                    </div>

                    {/* Inside Stopper Ring */}
                    <div className="w-3 h-11 bg-gradient-to-r from-zinc-300 via-zinc-200 to-zinc-400 rounded-sm border border-zinc-600 shadow-xl shrink-0" />

                    {/* Sleeve (Stacked Plates) */}
                    <div className="h-6 min-w-[70px] max-w-[200px] bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-400 border-y border-zinc-500 flex items-center px-0.5 relative shadow-inner">
                      {calculatedPlatesPerSide.length === 0 ? (
                        <span className="text-[8px] font-mono text-zinc-600 mx-auto font-bold italic truncate px-1">
                          Empty (0 kg)
                        </span>
                      ) : (
                        <div className="flex items-center gap-0.5 overflow-hidden max-w-full">
                          {calculatedPlatesPerSide.map((plateWeight, idx) => {
                            const pData = AVAILABLE_PLATES.find(p => p.weight === plateWeight) || AVAILABLE_PLATES[0];
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleRemoveManualPlate(idx)}
                                title={`Remove ${pData.label} (Tap to unload)`}
                                style={{ height: `${Math.min(pData.heightPx, 68)}px`, width: `${Math.max(pData.widthPx - 2, 8)}px` }}
                                className={`bg-gradient-to-b ${pData.gradient} ${pData.borderColor} rounded-[2px] border shadow-lg flex flex-col items-center justify-center text-[7px] font-mono font-black ${pData.textColor} hover:scale-110 hover:brightness-125 transition-transform pressable cursor-pointer shrink-0`}
                              >
                                <span className="rotate-90 select-none leading-none whitespace-nowrap drop-shadow">
                                  {pData.weight}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Collar if enabled */}
                    {includeCollars && (
                      <div className="w-2 h-7 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 border border-amber-600 rounded-sm shadow-md shrink-0 flex items-center justify-center" title="Lockjaw Collar (0.5kg/side)">
                        <div className="w-0.5 h-3 bg-black/40 rounded" />
                      </div>
                    )}

                    {/* Bar End Cap */}
                    <div className="w-3 h-7 bg-gradient-to-r from-zinc-400 to-zinc-600 rounded-r border-y border-r border-zinc-700 shadow shrink-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
                    </div>
                  </div>
                </div>

                {/* Loaded Breakdown Chips */}
                {calculatedPlatesPerSide.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1 pt-2 border-t border-white/5 w-full">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">Each Side:</span>
                    {Object.entries(plateCountSummary).map(([wt, count]) => {
                      const p = AVAILABLE_PLATES.find(item => item.weight === Number(wt));
                      return (
                        <span
                          key={wt}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${p?.color || 'bg-slate-800'} ${p?.textColor || 'text-white'} ${p?.borderColor || 'border-white/20'} shadow-sm`}
                        >
                          {count} × {wt}kg
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 1. Barbell Type & Base Weight Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                    1. Select Barbell Type & Base Weight
                  </label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Bar: {actualBarWeight} kg
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full min-w-0">
                  {STANDARD_BARS.map((bar) => {
                    const isSelected = !isCustomBar && selectedBarWeight === bar.weight && bar.weight !== 0;
                    return (
                      <button
                        key={bar.name}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          if (bar.weight === 0) {
                            setIsCustomBar(true);
                          } else {
                            setIsCustomBar(false);
                            setSelectedBarWeight(bar.weight);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all pressable overflow-hidden min-w-0 ${
                          isSelected || (isCustomBar && bar.weight === 0)
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                            : 'bg-[#0E1424] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between gap-1">
                          <span className="truncate">{bar.name}</span>
                          <span className="font-mono text-emerald-400 shrink-0 text-[11px]">{bar.weight > 0 ? `${bar.weight}kg` : 'Custom'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{bar.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {isCustomBar && (
                  <div className="p-2.5 rounded-xl bg-[#0E1424] border border-emerald-500/30 flex items-center gap-3 animate-fade-in w-full min-w-0">
                    <span className="text-xs font-mono text-slate-300 font-semibold shrink-0">Custom Bar Weight:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="50"
                      value={customBarWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCustomBarWeight(val);
                      }}
                      className="w-20 px-2.5 py-1 bg-slate-900 border border-emerald-500/40 rounded-lg text-white font-mono font-bold text-xs text-center focus:outline-none"
                    />
                    <span className="text-xs font-mono text-emerald-400">kg</span>
                  </div>
                )}
              </div>

              {/* 2. Target Total Weight Stepper (Auto-Detected in Rack Stacker Mode!) */}
              <div className="space-y-2 pt-2 border-t border-white/10 w-full min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                      2. Total Barbell Weight
                    </label>
                    {calcMode === 'manual' && (
                      <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ⚡ Auto-Detecting
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1 p-0.5 bg-black/40 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={handleSwitchToTarget}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        calcMode === 'target' 
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Target Mode
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToManual}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        calcMode === 'manual' 
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Rack Stacker
                    </button>
                  </div>
                </div>

                {/* Target Weight Slider & Stepper */}
                <div className="flex items-center gap-2 bg-[#0E1424] p-1.5 sm:p-2 rounded-2xl border border-white/10 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => handleStepWeight(-2.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-emerald-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-emerald-500/30 transition-all"
                    title="Decrease weight by 2.5 kg"
                  >
                    <Minus className="w-5 h-5 text-emerald-400" />
                  </button>

                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="number"
                      step="0.5"
                      min={actualBarWeight}
                      value={targetWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || actualBarWeight;
                        setTargetWeight(val);
                        if (calcMode === 'manual') {
                          const recomputed = calculatePlatesForWeight(val, actualBarWeight, collarWeight);
                          setManualPlatesPerSide(recomputed);
                        }
                      }}
                      className="w-full py-1.5 px-2 bg-slate-900 border border-white/10 rounded-xl text-center text-white font-mono font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepWeight(2.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-emerald-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-emerald-500/30 transition-all"
                    title="Increase weight by 2.5 kg"
                  >
                    <Plus className="w-5 h-5 text-emerald-400" />
                  </button>
                </div>

                {/* Quick Target Chips in Clean Wrapped Flex Layout */}
                <div className="flex flex-wrap gap-1.5 py-1 w-full min-w-0">
                  {[40, 50, 60, 70, 80, 90, 100, 110, 120, 140, 160, 180, 200].map(wt => (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTargetWeight(wt);
                        if (calcMode === 'manual') {
                          const recomputed = calculatePlatesForWeight(wt, actualBarWeight, collarWeight);
                          setManualPlatesPerSide(recomputed);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                        targetWeight === wt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow font-black glow-volt'
                          : 'bg-[#0E1424] text-slate-300 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {wt}kg
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Plate Rack (Tap to Load Plates) */}
              <div className="space-y-2 pt-2 border-t border-white/10 w-full min-w-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                    3. Gym Plate Rack (Tap to Load onto Bar)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Adds pair to both sides</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full min-w-0">
                  {AVAILABLE_PLATES.map((p) => (
                    <button
                      key={p.weight}
                      type="button"
                      onClick={() => handleAddManualPlate(p.weight)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all pressable bg-gradient-to-b ${p.gradient} ${p.borderColor} ${p.textColor} shadow-md hover:scale-105 active:scale-95`}
                    >
                      <span className="text-xs font-black font-mono leading-none drop-shadow">{p.weight}</span>
                      <span className="text-[9px] opacity-85 mt-0.5 font-mono">kg</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* DUMBBELL HERO BANNER */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0A1828] to-[#070E18] border border-cyan-500/30 flex items-center justify-between shadow-inner w-full min-w-0">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Dumbbell Weight ({dumbbellMode === 'pair' ? 'Per Hand' : 'Single DB'})
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                      {dumbbellWeight}
                    </span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">kg / DB</span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({Math.round(dumbbellWeight * 2.20462 * 10) / 10} lbs)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                    {dumbbellMode === 'pair' ? (
                      <span>Combined 2-Hand Load: <strong>{dumbbellWeight * 2} kg</strong> per rep</span>
                    ) : (
                      <span>Single DB Total Load: <strong>{dumbbellWeight} kg</strong> per rep</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setDumbbellMode(m => m === 'pair' ? 'single' : 'pair');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors active:scale-95"
                  >
                    {dumbbellMode === 'pair' ? '👥 Pair (2 DBs)' : '👤 Single DB'}
                  </button>
                </div>
              </div>

              {/* Visual Dumbbell Graphic */}
              <div className="p-3.5 rounded-2xl bg-[#060912] border border-white/10 flex flex-col items-center justify-center min-h-[120px] relative shadow-2xl overflow-hidden w-full min-w-0">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest text-center w-full mb-1">
                  Visual Dumbbell Specification
                </div>

                {/* Dual Hex Head DB Graphic */}
                <div className="flex items-center gap-1 my-2">
                  <div className="w-10 h-16 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-xl shadow-xl flex flex-col items-center justify-center text-cyan-300 font-black font-mono text-xs">
                    <span>{dumbbellWeight}</span>
                    <span className="text-[7px] text-cyan-500">KG</span>
                  </div>

                  <div className="w-12 sm:w-14 h-4 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-400 border-y border-zinc-600 rounded flex items-center justify-center shadow">
                    <div className="w-8 h-2.5 bg-zinc-600/40 rounded flex items-center justify-center">
                      <span className="text-[6px] font-mono text-zinc-900 font-bold opacity-60">KNURL</span>
                    </div>
                  </div>

                  <div className="w-10 h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 border-2 border-cyan-500/50 rounded-xl shadow-xl flex flex-col items-center justify-center text-cyan-300 font-black font-mono text-xs">
                    <span>{dumbbellWeight}</span>
                    <span className="text-[7px] text-cyan-500">KG</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  {dumbbellMode === 'pair' ? '2× Identical Dumbbells in Hand' : '1× Two-Handed Hold / Goblet Dumbbell'}
                </div>
              </div>

              {/* Precision Dumbbell Stepper Input */}
              <div className="space-y-2 w-full min-w-0">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                  Custom Weight Stepper
                </label>
                <div className="flex items-center gap-2 bg-[#0E1424] p-1.5 sm:p-2 rounded-2xl border border-white/10 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setDumbbellWeight(prev => Math.max(1, prev - 2.5));
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-cyan-500/30 transition-all"
                  >
                    <Minus className="w-5 h-5 text-cyan-400" />
                  </button>

                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="150"
                      value={dumbbellWeight}
                      onChange={(e) => setDumbbellWeight(parseFloat(e.target.value) || 0)}
                      className="w-full py-1.5 px-2 bg-slate-900 border border-white/10 rounded-xl text-center text-white font-mono font-black text-xl focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setDumbbellWeight(prev => prev + 2.5);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 text-white shrink-0 pressable flex items-center justify-center border border-white/5 hover:border-cyan-500/30 transition-all"
                  >
                    <Plus className="w-5 h-5 text-cyan-400" />
                  </button>
                </div>
              </div>

              {/* Quick Dumbbell Rack Presets in Clean Wrapped Grid */}
              <div className="space-y-2 pt-2 border-t border-white/10 w-full min-w-0">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                  Dumbbell Rack Presets (Standard Gym Increments)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 w-full min-w-0">
                  {DUMBBELL_PRESETS.map((wt) => {
                    const isSelected = dumbbellWeight === wt;
                    return (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setDumbbellWeight(wt);
                        }}
                        className={`py-2 px-1.5 rounded-xl text-xs font-mono font-bold transition-all border pressable ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black glow-cyan'
                            : 'bg-[#0E1424] text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {wt} kg
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer / Apply Button */}
        <div className="pt-3 border-t border-white/10 flex gap-2.5 shrink-0 relative z-10 w-full min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleApply}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 shadow-lg transition-all pressable flex items-center justify-center gap-1.5 ${
              activeTab === 'Barbell'
                ? 'bg-emerald-500 hover:bg-emerald-400 glow-volt'
                : 'bg-cyan-500 hover:bg-cyan-400 glow-cyan'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Apply {activeTab === 'Barbell' ? `${calculatedTotalBarbellWeight} kg` : `${dumbbellWeight} kg`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
