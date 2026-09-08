import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { triggerHaptic } from '@/utils/haptics';
import { Exercise, MuscleGroup, Equipment, DifficultyLevel } from '@/types';
import { 
  X, 
  Dumbbell, 
  Check, 
  Plus, 
  Minus, 
  Sparkles, 
  SlidersHorizontal, 
  Layers, 
  Flame, 
  Clock, 
  Activity, 
  Scale, 
  Zap, 
  ChevronRight,
  Info,
  Shield,
  Tag,
  Compass
} from 'lucide-react';
import { PlateCalculatorModal } from './PlateCalculatorModal';

export interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExercise: (exerciseData: Omit<Exercise, 'id' | 'isCustom'>) => Promise<Exercise | void> | void;
  initialMuscle?: MuscleGroup;
  initialEquipment?: Equipment;
}

interface PlateDef {
  weight: number;
  color: string;
  borderColor: string;
  textColor: string;
  label: string;
  heightPx: number;
  widthPx: number;
  gradient: string;
}

const OLYMPIC_PLATES: PlateDef[] = [
  { weight: 25, color: 'bg-red-600', borderColor: 'border-red-400', textColor: 'text-white', label: '25', heightPx: 64, widthPx: 12, gradient: 'from-red-500 via-red-600 to-red-800' },
  { weight: 20, color: 'bg-blue-600', borderColor: 'border-blue-400', textColor: 'text-white', label: '20', heightPx: 60, widthPx: 11, gradient: 'from-blue-500 via-blue-600 to-blue-800' },
  { weight: 15, color: 'bg-amber-500', borderColor: 'border-amber-300', textColor: 'text-slate-950', label: '15', heightPx: 54, widthPx: 10, gradient: 'from-amber-400 via-amber-500 to-amber-700' },
  { weight: 10, color: 'bg-emerald-600', borderColor: 'border-emerald-400', textColor: 'text-white', label: '10', heightPx: 48, widthPx: 9, gradient: 'from-emerald-500 via-emerald-600 to-emerald-800' },
  { weight: 5, color: 'bg-slate-200', borderColor: 'border-white', textColor: 'text-slate-900', label: '5', heightPx: 40, widthPx: 8, gradient: 'from-slate-100 via-slate-200 to-slate-400' },
  { weight: 2.5, color: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', label: '2.5', heightPx: 34, widthPx: 7, gradient: 'from-slate-700 via-slate-800 to-slate-950' },
  { weight: 1.25, color: 'bg-zinc-400', borderColor: 'border-zinc-200', textColor: 'text-zinc-950', label: '1.25', heightPx: 28, widthPx: 6, gradient: 'from-zinc-300 via-zinc-400 to-zinc-500' },
  { weight: 0.5, color: 'bg-purple-600', borderColor: 'border-purple-300', textColor: 'text-white', label: '0.5', heightPx: 24, widthPx: 5, gradient: 'from-purple-500 via-purple-600 to-purple-800' },
];

const STANDARD_BARS = [
  { name: 'Olympic 20kg', weight: 20, desc: "Standard 7ft Men's Bar (20kg / 44lbs)" },
  { name: "Women's 15kg", weight: 15, desc: "Olympic 6.6ft Bar (15kg / 33lbs)" },
  { name: 'EZ-Curl 10kg', weight: 10, desc: 'Bicep / Tricep Bar (10kg / 22lbs)' },
  { name: 'Trap Bar 25kg', weight: 25, desc: 'Hex / Deadlift Bar (25kg / 55lbs)' },
  { name: 'Smith Bar 15kg', weight: 15, desc: 'Counterbalanced Guide (15kg)' },
  { name: 'Custom Bar', weight: 0, desc: 'Custom configured barbell weight' },
];

const MUSCLE_OPTIONS: { name: MuscleGroup; icon: string; color: string }[] = [
  { name: 'Chest', icon: '🔥', color: 'from-emerald-500 to-teal-600' },
  { name: 'Back', icon: '⚡', color: 'from-blue-500 to-indigo-600' },
  { name: 'Shoulders', icon: '🛡️', color: 'from-cyan-500 to-blue-600' },
  { name: 'Biceps', icon: '💪', color: 'from-amber-500 to-orange-600' },
  { name: 'Triceps', icon: '💥', color: 'from-rose-500 to-red-600' },
  { name: 'Quads', icon: '🍗', color: 'from-emerald-400 to-green-600' },
  { name: 'Hamstrings', icon: '🎯', color: 'from-purple-500 to-pink-600' },
  { name: 'Glutes', icon: '🍑', color: 'from-pink-500 to-rose-600' },
  { name: 'Calves', icon: '⚡', color: 'from-amber-400 to-yellow-600' },
  { name: 'Abs/Core', icon: '🧱', color: 'from-cyan-400 to-teal-600' },
  { name: 'Cardio', icon: '🫀', color: 'from-violet-500 to-purple-700' },
  { name: 'Full Body', icon: '🌟', color: 'from-amber-400 to-emerald-500' },
];

const SECONDARY_MUSCLE_TAGS = [
  'Upper Chest', 'Lower Chest', 'Lats', 'Upper Traps', 'Mid Traps', 'Rhomboids',
  'Rear Delts', 'Front Delts', 'Side Delts', 'Long Head Triceps', 'Lateral Head Triceps',
  'Brachialis', 'Biceps Short Head', 'Biceps Long Head', 'Vastus Lateralis', 'Vastus Medialis',
  'Hamstring Biceps Femoris', 'Glute Medius', 'Gluteus Maximus', 'Transverse Abdominis',
  'Obliques', 'Lower Back / Erectors', 'Rotator Cuff', 'Grip / Wrists'
];

const CABLE_ATTACHMENTS = [
  { id: 'rope', name: 'Triceps Rope', icon: '🪢' },
  { id: 'straight', name: 'Straight Revolving Bar', icon: '➖' },
  { id: 'd_handle', name: 'D-Handles (Dual)', icon: '🔄' },
  { id: 'v_bar', name: 'V-Bar / Triceps Pushdown', icon: '🔽' },
  { id: 'lat_bar', name: 'Lat Pulldown Wide Bar', icon: '📐' },
  { id: 'ankle', name: 'Ankle Strap', icon: '🥾' },
  { id: 'single_handle', name: 'Single D-Handle', icon: '🔘' },
];

const SMART_NAME_SUGGESTIONS: Record<MuscleGroup, string[]> = {
  'Chest': ['Incline Hammer Strength Press', 'Cable High-to-Low Fly', 'Plate-Loaded Chest Dip', 'Guillotine Neck Press'],
  'Back': ['Meadows Single-Arm Row', 'Chest-Supported T-Bar Row', 'Kelso Shrug', 'Straight-Arm Cable Pulldown'],
  'Shoulders': ['Lu Raises (Full ROM)', 'Cable Y-Raise Behind Back', 'Viking Overhead Press', 'Incline Dumbbell Lateral Raise'],
  'Biceps': ['Bayesian Cable Curl (Behind Back)', 'Incline Dumbbell Spider Curl', 'Hammer Strength Preacher Curl'],
  'Triceps': ['Cross-Body Cable Extension', 'JM Press (Smith Machine)', 'Overhead Cable French Press'],
  'Quads': ['Pendulum Squat', 'Belt Squat', 'Reverse Nordic Curl', 'Heels-Elevated Goblet Squat'],
  'Hamstrings': ['Seated Leg Curl (Toes Plantarflexed)', 'Single-Leg Romanian Deadlift', 'Nordic Hamstring Curl'],
  'Glutes': ['B-Stance Hip Thrust', 'Cable Kickback (Glute Medius)', 'Bulgarian Split Squat (Glute Bias)'],
  'Calves': ['Donkey Calf Raise', 'Tibialis Raise', 'Seated Soleus Calf Raise'],
  'Abs/Core': ['Dragon Flag', 'Pallof Press with Rotation', 'Hanging Leg-to-Bar Raise', 'Ab Wheel Rollout'],
  'Cardio': ['HIIT Assault Bike Sprint', 'Incline Treadmill Sled Push', 'Rower 500m Intervals', 'Battle Rope Slams'],
  'Full Body': ['Clean and Jerk', 'Snatch Grip High Pull', 'Kettlebell Man Maker', 'Turkish Get-Up'],
};

export const CreateCustomExerciseModal: React.FC<CreateCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onSaveExercise,
  initialMuscle = 'Chest',
  initialEquipment = 'Barbell',
}) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });

  // Core Form State
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initialMuscle);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [recommendedRepRange, setRecommendedRepRange] = useState('8 - 12 reps');
  const [targetSets, setTargetSets] = useState(3);
  const [restSeconds, setRestSeconds] = useState(90);
  const [tempo, setTempo] = useState('3-0-1-0 Controlled');
  const [cues, setCues] = useState<string[]>(['Control the 3-second eccentric phase', 'Full stretch and contraction']);
  const [newCueInput, setNewCueInput] = useState('');

  // Equipment Specific Customizations
  // Barbell
  const [selectedBar, setSelectedBar] = useState(STANDARD_BARS[0]);
  const [customBarWeight, setCustomBarWeight] = useState(20);
  const [targetBarbellWeight, setTargetBarbellWeight] = useState(60);

  // Dumbbell
  const [dbWeightPerHand, setDbWeightPerHand] = useState(24);
  const [dbMode, setDbMode] = useState<'pair' | 'single'>('pair');

  // Cable
  const [cableWeight, setCableWeight] = useState(30);
  const [cableAttachment, setCableAttachment] = useState(CABLE_ATTACHMENTS[0].name);
  const [pulleyHeight, setPulleyHeight] = useState<'High' | 'Mid' | 'Low'>('Mid');

  // Machine / Smith
  const [machineResistanceType, setMachineResistanceType] = useState<'Plate-Loaded' | 'Pin-Stack' | 'Smith-Bar'>('Plate-Loaded');
  const [machineAngle, setMachineAngle] = useState('Flat (180°)');

  // Kettlebell
  const [kbWeight, setKbWeight] = useState(16);
  const [kbMode, setKbMode] = useState<'Single' | 'Pair'>('Single');

  // Bodyweight
  const [bwStyle, setBwStyle] = useState<'Bodyweight Only' | 'Weighted (Belt)' | 'Band Assisted'>('Bodyweight Only');
  const [bwAddedWeight, setBwAddedWeight] = useState(10);

  // Active Tab
  const [activeConfigTab, setActiveConfigTab] = useState<'mechanics' | 'targets' | 'cues'>('mechanics');

  // Child Plate Calculator Modal
  const [isPlateCalcModalOpen, setIsPlateCalcModalOpen] = useState(false);

  // Calculate Olympic plates breakdown per side for Barbell preview (Hooks MUST be top-level before early returns)
  const actualBarWeight = selectedBar.weight === 0 ? customBarWeight : selectedBar.weight;
  const plateBreakdownPerSide = useMemo(() => {
    const netWeightToLoad = Math.max(0, targetBarbellWeight - actualBarWeight);
    let sideWeight = netWeightToLoad / 2;
    const plates: PlateDef[] = [];

    OLYMPIC_PLATES.forEach((plate) => {
      while (sideWeight >= plate.weight - 0.001) {
        plates.push(plate);
        sideWeight -= plate.weight;
      }
    });

    return plates;
  }, [targetBarbellWeight, actualBarWeight]);

  if (!isOpen) return null;

  const handleToggleSecondaryMuscle = (muscle: string) => {
    triggerHaptic('selection');
    setSecondaryMuscles(prev => 
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  const handleAddCue = () => {
    if (!newCueInput.trim()) return;
    triggerHaptic('selection');
    setCues(prev => [...prev, newCueInput.trim()]);
    setNewCueInput('');
  };

  const handleRemoveCue = (idx: number) => {
    triggerHaptic('selection');
    setCues(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');

    // Build rich instructions and form cues
    const builtInstructions = [
      equipment === 'Barbell'
        ? `Barbell specification: ${selectedBar.weight === 0 ? `${customBarWeight}kg custom bar` : selectedBar.name}. Target load includes bar plus plates (${targetBarbellWeight} kg total).`
        : equipment === 'Dumbbell'
        ? `Dumbbell configuration: ${dbMode === 'pair' ? `Pair of dumbbells (${dbWeightPerHand} kg each)` : `Single dumbbell (${dbWeightPerHand} kg)`}.`
        : equipment === 'Cable'
        ? `Cable setup: ${cableAttachment} at ${pulleyHeight} pulley height (${cableWeight} kg stack pin).`
        : equipment === 'Machine'
        ? `Machine configuration: ${machineResistanceType} with ${machineAngle} angle position.`
        : equipment === 'Kettlebell'
        ? `Kettlebell setup: ${kbMode === 'Pair' ? 'Double bells' : 'Single bell'} (${kbWeight} kg).`
        : `Bodyweight mechanics: ${bwStyle}${bwStyle !== 'Bodyweight Only' ? ` (${bwAddedWeight} kg)` : ''}.`,
      `Prescribed prescription: ${targetSets} working sets of ${recommendedRepRange} at ${tempo} tempo with ${restSeconds}s rest.`
    ];

    const builtFormCues = [
      ...cues,
      `Tempo: ${tempo}`,
      `Rest interval: ${restSeconds}s`
    ];

    await onSaveExercise({
      name: name.trim(),
      category: 'Custom',
      muscleGroup,
      secondaryMuscles,
      equipment,
      difficulty,
      recommendedRepRange,
      instructions: builtInstructions,
      formCues: builtFormCues,
      commonMistakes: ['Rushing through the eccentric phase', 'Sacrificing range of motion for ego weight']
    });

    onClose();
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-0 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[94vh] bg-[#0A0E1A] border-t sm:border border-cyan-500/30 sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-gradient-to-b from-cyan-500/15 via-emerald-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Custom Exercise</h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                  Pro Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Configure visual equipment mechanics, load & biomechanics</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar relative z-10">
          
          {/* LIVE MASTER EXERCISE PREVIEW CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0E172A] to-slate-950 border border-cyan-500/30 shadow-xl relative overflow-hidden group">
            {/* Background Accent Lines */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono text-emerald-300 font-bold uppercase">
                    {muscleGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold uppercase">
                    {equipment}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-slate-300">
                    {difficulty}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-white truncate max-w-sm">
                  {name.trim() || 'Custom Exercise Name'}
                </h4>
              </div>

              {/* Live Target Load Chip */}
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Default Load</span>
                <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono">
                  {equipment === 'Barbell' && `${targetBarbellWeight} kg (Total)`}
                  {equipment === 'Dumbbell' && `${dbMode === 'pair' ? `2 × ${dbWeightPerHand} kg` : `1 × ${dbWeightPerHand} kg`}`}
                  {equipment === 'Cable' && `${cableWeight} kg (${cableAttachment})`}
                  {equipment === 'Machine' && `${machineResistanceType} (${machineAngle})`}
                  {equipment === 'Kettlebell' && `${kbMode === 'Pair' ? `2 × ${kbWeight} kg` : `1 × ${kbWeight} kg`}`}
                  {equipment === 'Bodyweight' && `${bwStyle}${bwStyle !== 'Bodyweight Only' ? ` (${bwAddedWeight}kg)` : ''}`}
                </span>
              </div>
            </div>

            {/* LIVE DYNAMIC EQUIPMENT GRAPHIC */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 flex flex-col items-center justify-center my-2 min-h-[90px] relative overflow-hidden">
              {/* 1. Barbell Live Visualization with Plates */}
              {equipment === 'Barbell' && (
                <div className="w-full flex flex-col items-center gap-2">
                  <div className="w-full flex items-center justify-center gap-1.5 py-2">
                    {/* Left Sleeve Bar Collar */}
                    <div className="h-5 w-4 bg-gradient-to-r from-slate-400 to-slate-600 rounded-l border border-white/20 shadow-md" />
                    
                    {/* Left Plates Stack */}
                    <div className="flex items-center gap-0.5 justify-end">
                      {plateBreakdownPerSide.length === 0 ? (
                        <span className="text-[10px] font-mono text-slate-500 italic px-2">Unloaded Bar ({actualBarWeight}kg)</span>
                      ) : (
                        plateBreakdownPerSide.map((p, idx) => (
                          <div
                            key={`left-${idx}`}
                            style={{ height: `${p.heightPx}px`, width: `${p.widthPx}px` }}
                            className={`rounded-sm bg-gradient-to-b ${p.gradient} border ${p.borderColor} shadow-lg flex items-center justify-center relative transition-all`}
                            title={`${p.label} kg plate`}
                          >
                            <span className="text-[8px] font-black text-white font-mono transform -rotate-90 select-none">
                              {p.label}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Center Knurled Bar */}
                    <div className="h-3 w-32 sm:w-44 bg-gradient-to-r from-slate-500 via-slate-300 to-slate-500 rounded-sm border border-white/20 relative shadow-inner flex items-center justify-center">
                      <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px] opacity-30" />
                      <span className="absolute text-[9px] font-mono font-black text-slate-900 bg-white/70 px-1 rounded shadow-xs">
                        {actualBarWeight}kg Bar
                      </span>
                    </div>

                    {/* Right Plates Stack */}
                    <div className="flex items-center gap-0.5 justify-start">
                      {plateBreakdownPerSide.map((p, idx) => (
                        <div
                          key={`right-${idx}`}
                          style={{ height: `${p.heightPx}px`, width: `${p.widthPx}px` }}
                          className={`rounded-sm bg-gradient-to-b ${p.gradient} border ${p.borderColor} shadow-lg flex items-center justify-center relative transition-all`}
                          title={`${p.label} kg plate`}
                        >
                          <span className="text-[8px] font-black text-white font-mono transform -rotate-90 select-none">
                            {p.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Right Sleeve Bar Collar */}
                    <div className="h-5 w-4 bg-gradient-to-r from-slate-600 to-slate-400 rounded-r border border-white/20 shadow-md" />
                  </div>

                  <div className="flex items-center justify-between w-full px-2 text-[10px] font-mono text-slate-400">
                    <span>Bar: <strong className="text-white">{selectedBar.name}</strong></span>
                    <span>Plates/side: <strong className="text-cyan-300">{plateBreakdownPerSide.map(p => `${p.label}k`).join('+') || 'None'}</strong></span>
                    <span>Total: <strong className="text-emerald-400">{targetBarbellWeight} kg</strong></span>
                  </div>
                </div>
              )}

              {/* 2. Dumbbell Live Visualization */}
              {equipment === 'Dumbbell' && (
                <div className="w-full flex items-center justify-center gap-6 py-2">
                  {[...Array(dbMode === 'pair' ? 2 : 1)].map((_, i) => (
                    <div key={i} className="flex items-center gap-1 group/db animate-scale-up">
                      {/* Left Hex Head */}
                      <div className="w-6 h-14 rounded-lg bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-xl flex flex-col items-center justify-center relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 mb-1" />
                        <span className="text-[9px] font-mono font-black text-cyan-300 transform -rotate-90 select-none">
                          {dbWeightPerHand}
                        </span>
                      </div>

                      {/* Knurled Steel Grip Handle */}
                      <div className="w-10 h-3 bg-gradient-to-r from-slate-500 via-slate-300 to-slate-500 rounded border border-white/30 shadow-inner flex items-center justify-center">
                        <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:2px_2px] opacity-40" />
                      </div>

                      {/* Right Hex Head */}
                      <div className="w-6 h-14 rounded-lg bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-xl flex flex-col items-center justify-center relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 mb-1" />
                        <span className="text-[9px] font-mono font-black text-cyan-300 transform -rotate-90 select-none">
                          KG
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Cable Stack Live Visualization */}
              {equipment === 'Cable' && (
                <div className="w-full flex items-center justify-center gap-4 py-1">
                  {/* Pin Stack Graphic */}
                  <div className="w-24 bg-slate-900 rounded-lg border border-purple-500/30 p-1 space-y-0.5 shadow-inner">
                    {[10, 20, 30, 40, 50].map((w) => {
                      const isPin = cableWeight >= w && cableWeight < w + 10;
                      return (
                        <div 
                          key={w} 
                          className={`h-2.5 rounded text-[8px] font-mono font-bold flex items-center justify-between px-1.5 ${
                            isPin 
                              ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400 font-black' 
                              : cableWeight > w 
                              ? 'bg-purple-950/60 text-purple-300' 
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <span>{w} kg</span>
                          {isPin && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>{cableAttachment}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Pulley: <strong className="text-white">{pulleyHeight} Position</strong>
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 block font-bold">
                      Stack Load: {cableWeight} kg
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Machine / Smith Live Visualization */}
              {equipment === 'Machine' && (
                <div className="w-full flex items-center justify-center gap-4 py-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="font-bold text-amber-300 block">{machineResistanceType}</span>
                      <span className="text-[10px] font-mono text-slate-400">Position: {machineAngle}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Kettlebell Live Visualization */}
              {equipment === 'Kettlebell' && (
                <div className="flex items-center justify-center gap-4 py-1">
                  {[...Array(kbMode === 'Pair' ? 2 : 1)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      {/* Horn Handle */}
                      <div className="w-8 h-5 border-3 border-slate-400 border-b-0 rounded-t-full relative" />
                      {/* Bell Body */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-black border border-rose-500/40 shadow-xl flex items-center justify-center relative">
                        <div className="w-full h-1 bg-amber-400 absolute top-1.5 opacity-80" />
                        <span className="text-[10px] font-mono font-black text-rose-300">
                          {kbWeight}k
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. Bodyweight Live Visualization */}
              {equipment === 'Bodyweight' && (
                <div className="flex items-center justify-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center text-lg">
                    🤸
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-blue-300 block">{bwStyle}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {bwStyle === 'Bodyweight Only' ? 'Calisthenics Mass Tracking' : `Added Belt Load: +${bwAddedWeight} kg`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Target Prescription Chips Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <strong>{targetSets} Sets</strong> × {recommendedRepRange}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <strong>{restSeconds}s Rest</strong>
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                {tempo.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* TAB NAVIGATION: Mechanics vs Targets vs Form Cues */}
          <div className="flex gap-1.5 p-1 bg-slate-900/80 border border-white/10 rounded-2xl">
            {[
              { id: 'mechanics' as const, label: 'Equipment & Load', icon: Dumbbell },
              { id: 'targets' as const, label: 'Muscles & Reps', icon: SlidersHorizontal },
              { id: 'cues' as const, label: 'Cues & Biomechanics', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeConfigTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveConfigTab(tab.id);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: EQUIPMENT & LOAD MECHANICS */}
          {activeConfigTab === 'mechanics' && (
            <div className="space-y-4 animate-fade-in">
              {/* Exercise Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Incline Dumbbell Bench Press, Barbell RDL"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
                />

                {/* Smart Name Suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-[10px] font-mono">
                  <span className="text-slate-500 whitespace-nowrap">Suggested:</span>
                  {(SMART_NAME_SUGGESTIONS[muscleGroup] || []).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setName(sug);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 whitespace-nowrap border border-white/5 hover:border-cyan-500/30 transition-all"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Type Grid Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                  Equipment Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'Barbell' as Equipment, title: 'Barbell', desc: 'Olympic bar + plates', icon: '🏋️‍♂️', color: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' },
                    { type: 'Dumbbell' as Equipment, title: 'Dumbbell', desc: 'Independent per hand', icon: '🪙', color: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' },
                    { type: 'Cable' as Equipment, title: 'Cable / Pulley', desc: 'Selectorized pin stack', icon: '⚡', color: 'border-purple-500/60 bg-purple-500/15 text-purple-300' },
                    { type: 'Machine' as Equipment, title: 'Machine / Smith', desc: 'Guided motion plane', icon: '⚙️', color: 'border-amber-500/60 bg-amber-500/15 text-amber-300' },
                    { type: 'Bodyweight' as Equipment, title: 'Bodyweight', desc: 'Calisthenics / + belt', icon: '🤸', color: 'border-blue-500/60 bg-blue-500/15 text-blue-300' },
                    { type: 'Kettlebell' as Equipment, title: 'Kettlebell', desc: 'Offset ballistic bell', icon: '🪨', color: 'border-rose-500/60 bg-rose-500/15 text-rose-300' }
                  ].map((eq) => {
                    const isSelected = equipment === eq.type;
                    return (
                      <button
                        key={eq.type}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setEquipment(eq.type);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all pressable flex flex-col justify-between ${
                          isSelected
                            ? `${eq.color} shadow-lg glow-volt ring-1 ring-cyan-400/50`
                            : 'bg-[#121A2C] border-white/10 text-slate-300 hover:border-white/20 hover:bg-[#18233C]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{eq.icon}</span>
                            <span className="text-xs font-black text-white">{eq.title}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{eq.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BARBELL DETAILED MECHANICS */}
              {equipment === 'Barbell' && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Dumbbell className="w-4 h-4" />
                      <span>Barbell Bar & Default Starting Load</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlateCalcModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1 border border-emerald-500/30 transition-all pressable"
                    >
                      ⚖️ Launch Plate Stacker
                    </button>
                  </div>

                  {/* Standard Bar Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {STANDARD_BARS.map(bar => {
                      const isSelected = selectedBar.name === bar.name;
                      return (
                        <button
                          key={bar.name}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setSelectedBar(bar);
                          }}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-mono font-bold text-left transition-all border pressable flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                              : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-emerald-500/40'
                          }`}
                        >
                          <span>{bar.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedBar.weight === 0 && (
                    <div className="flex items-center gap-2 pt-1 animate-fade-in">
                      <span className="text-xs font-mono text-slate-300">Custom Bar Weight:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={customBarWeight}
                        onChange={(e) => setCustomBarWeight(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-slate-900 border border-emerald-500/40 rounded-lg text-white font-mono font-bold text-xs text-center focus:outline-none"
                      />
                      <span className="text-xs font-mono text-emerald-400">kg</span>
                    </div>
                  )}

                  {/* Target Starting Weight Stepper */}
                  <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Target Total Load (Bar + Plates):</span>
                      <span className="text-sm font-black text-emerald-400">{targetBarbellWeight} kg</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setTargetBarbellWeight(prev => Math.max(actualBarWeight, prev - 5));
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 grid grid-cols-5 gap-1 text-[11px] font-mono">
                        {[40, 60, 80, 100, 140].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              triggerHaptic('selection');
                              setTargetBarbellWeight(w);
                            }}
                            className={`py-1.5 rounded-lg border text-center ${
                              targetBarbellWeight === w
                                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 font-bold'
                                : 'bg-slate-900/60 border-white/5 text-slate-400'
                            }`}
                          >
                            {w}k
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setTargetBarbellWeight(prev => prev + 5);
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DUMBBELL DETAILED MECHANICS */}
              {equipment === 'Dumbbell' && (
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                      <Dumbbell className="w-4 h-4" />
                      <span>Dumbbell Mechanics & Weight Per Hand</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlateCalcModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1 border border-cyan-500/30 transition-all pressable"
                    >
                      🪙 Dumbbell Picker
                    </button>
                  </div>

                  {/* Mode: Pair vs Single */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setDbMode('pair');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border pressable flex items-center justify-between ${
                        dbMode === 'pair'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                          : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-cyan-500/40'
                      }`}
                    >
                      <span>👥 Pair (Per Hand)</span>
                      {dbMode === 'pair' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setDbMode('single');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border pressable flex items-center justify-between ${
                        dbMode === 'single'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                          : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-cyan-500/40'
                      }`}
                    >
                      <span>👤 Single DB (Goblet)</span>
                      {dbMode === 'single' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  {/* Weight Per Hand Stepper & Chips */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Selected Dumbbell Weight:</span>
                      <span className="text-sm font-black text-cyan-400">
                        {dbMode === 'pair' ? `2 × ${dbWeightPerHand} kg` : `1 × ${dbWeightPerHand} kg`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setDbWeightPerHand(prev => Math.max(2, prev - 2));
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 grid grid-cols-6 gap-1 text-[11px] font-mono">
                        {[12, 16, 20, 24, 30, 36].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              triggerHaptic('selection');
                              setDbWeightPerHand(w);
                            }}
                            className={`py-1.5 rounded-lg border text-center ${
                              dbWeightPerHand === w
                                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold'
                                : 'bg-slate-900/60 border-white/5 text-slate-400'
                            }`}
                          >
                            {w}k
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setDbWeightPerHand(prev => prev + 2);
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CABLE / PULLEY DETAILED MECHANICS */}
              {equipment === 'Cable' && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                    <Zap className="w-4 h-4" />
                    <span>Cable Attachment & Pulley Position</span>
                  </div>

                  {/* Attachment selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {CABLE_ATTACHMENTS.map(att => {
                      const isSelected = cableAttachment === att.name;
                      return (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setCableAttachment(att.name);
                          }}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-mono font-bold text-left transition-all border flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 font-black shadow-md'
                              : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-purple-500/40'
                          }`}
                        >
                          <span className="truncate">{att.icon} {att.name}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pulley height */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['High', 'Mid', 'Low'] as const).map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setPulleyHeight(pos);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-mono font-bold border text-center ${
                          pulleyHeight === pos
                            ? 'bg-purple-500/30 text-purple-300 border-purple-400'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        {pos} Pulley
                      </button>
                    ))}
                  </div>

                  {/* Weight Stack Pin */}
                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                    <span className="text-slate-300">Stack Pin Load:</span>
                    <div className="flex items-center gap-2">
                      {[15, 25, 35, 45, 60].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setCableWeight(w);
                          }}
                          className={`px-2 py-1 rounded-lg border text-[11px] ${
                            cableWeight === w
                              ? 'bg-purple-500 text-white font-bold border-purple-400'
                              : 'bg-slate-900 text-slate-400 border-white/10'
                          }`}
                        >
                          {w}k
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MACHINE / SMITH DETAILED MECHANICS */}
              {equipment === 'Machine' && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Scale className="w-4 h-4" />
                    <span>Machine Resistance & Bench Angle</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['Plate-Loaded', 'Pin-Stack', 'Smith-Bar'] as const).map(res => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setMachineResistanceType(res);
                        }}
                        className={`py-2 rounded-xl text-xs font-mono font-bold border text-center ${
                          machineResistanceType === res
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300 block">Angle / Seat Position:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
                      {['Flat (180°)', 'Incline 30°', 'Incline 45°', 'Shoulder 75°', 'Decline -15°', 'Seated Vertical'].map(ang => (
                        <button
                          key={ang}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setMachineAngle(ang);
                          }}
                          className={`py-1.5 px-2 rounded-lg border text-center ${
                            machineAngle === ang
                              ? 'bg-amber-500/30 text-amber-300 border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-400 border-white/5'
                          }`}
                        >
                          {ang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* KETTLEBELL DETAILED MECHANICS */}
              {equipment === 'Kettlebell' && (
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-300 font-bold">Kettlebell Weight:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setKbMode('Single')}
                        className={`px-2 py-1 rounded-lg text-xs font-mono ${kbMode === 'Single' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-400'}`}
                      >
                        Single Bell
                      </button>
                      <button
                        type="button"
                        onClick={() => setKbMode('Pair')}
                        className={`px-2 py-1 rounded-lg text-xs font-mono ${kbMode === 'Pair' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-400'}`}
                      >
                        Double (Pair)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 text-[11px] font-mono">
                    {[12, 16, 20, 24, 28, 32].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setKbWeight(w);
                        }}
                        className={`py-2 rounded-xl border text-center ${
                          kbWeight === w
                            ? 'bg-rose-500 text-white border-rose-400 font-black shadow-md'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        {w} kg
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BODYWEIGHT DETAILED MECHANICS */}
              {equipment === 'Bodyweight' && (
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    {(['Bodyweight Only', 'Weighted (Belt)', 'Band Assisted'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setBwStyle(st);
                        }}
                        className={`py-2 rounded-xl text-[11px] font-mono font-bold border text-center ${
                          bwStyle === st
                            ? 'bg-blue-500 text-slate-950 border-blue-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {bwStyle !== 'Bodyweight Only' && (
                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <span className="text-slate-300">Added / Assisted Weight:</span>
                      <div className="flex items-center gap-2">
                        {[5, 10, 15, 20, 30].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              triggerHaptic('selection');
                              setBwAddedWeight(w);
                            }}
                            className={`px-2.5 py-1 rounded-lg border ${
                              bwAddedWeight === w
                                ? 'bg-blue-500 text-white font-bold border-blue-400'
                                : 'bg-slate-900 text-slate-400 border-white/10'
                            }`}
                          >
                            {w}k
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MUSCLES & PRESCRIPTION TARGETS */}
          {activeConfigTab === 'targets' && (
            <div className="space-y-4 animate-fade-in">
              {/* Primary Muscle Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                  Primary Muscle Group *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {MUSCLE_OPTIONS.map((muscle) => {
                    const isSelected = muscleGroup === muscle.name;
                    return (
                      <button
                        key={muscle.name}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setMuscleGroup(muscle.name);
                        }}
                        className={`py-2.5 px-3 rounded-2xl text-xs font-mono font-bold transition-all text-left border flex items-center justify-between ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-cyan-400 shadow-md font-black'
                            : 'bg-[#121A2C] text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{muscle.icon}</span>
                          <span className="truncate">{muscle.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary / Synergist Muscles Multi-Select */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                    Secondary / Synergist Muscles
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {secondaryMuscles.length} selected
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-900/60 border border-white/10 max-h-36 overflow-y-auto custom-scrollbar">
                  {SECONDARY_MUSCLE_TAGS.map(sec => {
                    const isSel = secondaryMuscles.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleToggleSecondaryMuscle(sec)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all border ${
                          isSel
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                            : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '}{sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Sets & Recommended Rep Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Working Sets */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <label className="text-xs font-mono text-slate-300 block font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Target Working Sets
                  </label>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5, 6].map(sets => (
                      <button
                        key={sets}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setTargetSets(sets);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border text-center transition-all ${
                          targetSets === sets
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                            : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {sets}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rest Timer Preset */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <label className="text-xs font-mono text-slate-300 block font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Rest Between Sets
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[45, 60, 90, 120, 180].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setRestSeconds(s);
                        }}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-mono font-bold border text-center transition-all ${
                          restSeconds === s
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                            : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rep Range Preset Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block font-bold">
                  Recommended Rep Range
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  {['3 - 5 reps', '6 - 8 reps', '8 - 12 reps', '10 - 15 reps', '15 - 20 reps', 'To Failure'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setRecommendedRepRange(r);
                      }}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        recommendedRepRange === r
                          ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/60 font-bold'
                          : 'bg-slate-900/80 text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="or enter custom range (e.g. 5x5 Strength, Myo-reps)"
                  value={recommendedRepRange}
                  onChange={(e) => setRecommendedRepRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Difficulty & Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 block font-bold">Difficulty Level</label>
                  <div className="flex gap-1.5">
                    {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setDifficulty(d);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border text-center ${
                          difficulty === d
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-white/10'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 block font-bold">Execution Tempo</label>
                  <select
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="3-0-1-0 Controlled">3-0-1-0 (3s eccentric, explosive up)</option>
                    <option value="2-0-1-0 Standard">2-0-1-0 (Standard Hypertrophy)</option>
                    <option value="4-1-1-0 High Tension">4-1-1-0 (4s eccentric + 1s stretch)</option>
                    <option value="Explosive Concentric">Explosive Power (Speed work)</option>
                    <option value="Isometric Pause (2s)">2s Pause at peak contraction</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORM CUES & BIOMECHANICS */}
          {activeConfigTab === 'cues' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                  Form Cues & Execution Rules ({cues.length})
                </label>
                
                <div className="space-y-1.5">
                  {cues.map((cue, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {cue}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCue(idx)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCueInput}
                    onChange={(e) => setNewCueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCue();
                      }
                    }}
                    placeholder="Type custom cue (e.g. 'Pack lats and lock shoulder blades')..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCue}
                    className="py-2 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Quick Preset Cue Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Quick Cue Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Drive through the heels',
                    'Maintain neutral spine alignment',
                    'Squeeze at full peak contraction (1s)',
                    'Lock core and brace intra-abdominal pressure',
                    'Control 3-second negative descent',
                    'Keep elbows tucked at 45 degrees',
                    'Full active stretch at bottom position'
                  ].map(quickCue => (
                    <button
                      key={quickCue}
                      type="button"
                      onClick={() => {
                        if (!cues.includes(quickCue)) {
                          triggerHaptic('selection');
                          setCues(prev => [...prev, quickCue]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono border border-white/5 hover:border-cyan-500/30 transition-all"
                    >
                      + {quickCue}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 glow-volt pressable transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Custom Movement
            </button>
          </div>
        </form>

        {/* 4. Child Plate Calculator Modal Integration */}
        <PlateCalculatorModal
          isOpen={isPlateCalcModalOpen}
          onClose={() => setIsPlateCalcModalOpen(false)}
          equipmentType={equipment}
          initialWeight={equipment === 'Barbell' ? targetBarbellWeight : dbWeightPerHand}
          onApplyWeight={(appliedWeight) => {
            if (equipment === 'Barbell') {
              setTargetBarbellWeight(appliedWeight);
            } else if (equipment === 'Dumbbell') {
              setDbWeightPerHand(appliedWeight);
            }
            setIsPlateCalcModalOpen(false);
          }}
        />

      </div>
    </div>,
    document.body
  );
};
