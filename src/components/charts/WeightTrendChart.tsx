import React from 'react';
import { parseLocalDateString } from '@/utils/date';
import { Scale } from 'lucide-react';

interface WeightPoint {
  date: string;
  weightKg: number;
}

interface WeightTrendChartProps {
  data: WeightPoint[];
  height?: number;
  unit?: 'metric' | 'imperial';
  targetWeightKg?: number;
}

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  data,
  height = 180,
  unit = 'metric',
  targetWeightKg
}) => {
  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = parseLocalDateString(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-500 text-xs py-8 space-y-1.5" style={{ height }}>
        <Scale className="w-6 h-6 text-amber-500/50" />
        <span className="text-slate-400 font-mono">No weight logs in this timeframe</span>
        <span className="text-[11px] text-slate-600 font-mono">Log your morning weigh-in to generate trendlines</span>
      </div>
    );
  }

  // Convert if imperial
  const displayData = data.map(d => ({
    ...d,
    val: unit === 'imperial' ? Math.round(d.weightKg * 2.20462 * 10) / 10 : d.weightKg
  }));

  const targetVal = targetWeightKg 
    ? (unit === 'imperial' ? Math.round(targetWeightKg * 2.20462 * 10) / 10 : targetWeightKg)
    : undefined;

  const unitLabel = unit === 'imperial' ? 'lb' : 'kg';
  const width = 360;
  const paddingX = 24;
  const paddingY = 24;

  // Single-point special state: render an amber baseline with center glowing orb
  if (displayData.length === 1) {
    const single = displayData[0];
    const centerY = height / 2;

    return (
      <div className="w-full flex flex-col gap-2">
        <div className="relative w-full overflow-hidden" style={{ height }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="singleWeightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
              <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

            {/* Target Weight Benchmark Line if available */}
            {targetVal && (
              <>
                <line 
                  x1={paddingX} 
                  y1={paddingY + 15} 
                  x2={width - paddingX} 
                  y2={paddingY + 15} 
                  stroke="#F59E0B" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4"
                  className="opacity-40"
                />
                <text x={width - paddingX} y={paddingY + 10} fill="#F59E0B" fontSize="9" textAnchor="end" fontFamily="monospace" opacity={0.8}>
                  Goal: {targetVal} {unitLabel}
                </text>
              </>
            )}

            {/* Baseline area */}
            <path 
              d={`M ${paddingX} ${centerY} L ${width - paddingX} ${centerY} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`} 
              fill="url(#singleWeightGradient)" 
            />

            {/* Baseline trajectory line */}
            <line 
              x1={paddingX} 
              y1={centerY} 
              x2={width - paddingX} 
              y2={centerY} 
              stroke="#F59E0B" 
              strokeWidth="2.5" 
              strokeDasharray="4 4"
              className="opacity-80"
              filter="url(#amberGlow)"
            />

            {/* Center Glowing Node */}
            <circle cx={width / 2} cy={centerY} r={8} fill="#F59E0B" fillOpacity="0.3" className="animate-pulse" />
            <circle cx={width / 2} cy={centerY} r={4.5} fill="#F59E0B" stroke="#070B14" strokeWidth="2" />
          </svg>
        </div>

        {/* Date bounds */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
          <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(single.date)}</span>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-sm">
              {single.val} {unitLabel} Baseline
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Multi-point trendline calculation
  const weights = displayData.map(d => d.val);
  const minW = Math.min(...weights) - 0.8;
  const maxW = Math.max(...weights) + 0.8;
  const range = maxW - minW || 1;

  // Generate SVG path points with smooth bezier curves
  const points = displayData.map((d, index) => {
    const x = paddingX + (index / (displayData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.val - minW) / range) * (height - 2 * paddingY);
    return { x, y, val: d.val, date: d.date };
  });

  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  // Fill area gradient path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="weightGradientMulti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#D97706" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
            <filter id="weightGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

          {/* Gradient area */}
          <path d={areaD} fill="url(#weightGradientMulti)" />

          {/* Smooth Line */}
          <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" filter="url(#weightGlow)" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              {idx === points.length - 1 && (
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={7} 
                  fill="#F59E0B" 
                  fillOpacity="0.3" 
                  stroke="#F59E0B" 
                  strokeWidth="1" 
                  className="animate-pulse"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={idx === points.length - 1 ? 4.5 : 3.5}
                fill="#F59E0B"
                stroke="#070B14"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Date bounds */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
        <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(displayData[0]?.date)}</span>
        <span className="text-amber-400 font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          Latest: {points[points.length - 1]?.val} {unitLabel}
        </span>
        <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(displayData[displayData.length - 1]?.date)}</span>
      </div>
    </div>
  );
};
