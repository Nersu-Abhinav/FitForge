import React from 'react';

interface MacroBreakdownProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

export const MacroBreakdownBar: React.FC<MacroBreakdownProps> = ({
  proteinG,
  carbsG,
  fatG,
  proteinTarget,
  carbsTarget,
  fatTarget
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Protein */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Protein
          </span>
          <span className="font-mono text-slate-300 text-[11px]">
            <span className="font-bold text-white">{proteinG}</span> / {proteinTarget} g
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (proteinG / (proteinTarget || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Carbs */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            Carbs
          </span>
          <span className="font-mono text-slate-300 text-[11px]">
            <span className="font-bold text-white">{carbsG}</span> / {carbsTarget} g
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (carbsG / (carbsTarget || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Fat */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Fat
          </span>
          <span className="font-mono text-slate-300 text-[11px]">
            <span className="font-bold text-white">{fatG}</span> / {fatTarget} g
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (fatG / (fatTarget || 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
