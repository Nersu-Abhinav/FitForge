import React from 'react';
import { parseLocalDateString } from '@/utils/date';
import { Droplets, Sparkles } from 'lucide-react';

export interface DailyHydrationPoint {
  date: string;
  totalMl: number;
  goalMl: number;
  logCount?: number;
}

interface HydrationTrendChartProps {
  data: DailyHydrationPoint[];
  targetGoalMl?: number;
  height?: number;
}

export const HydrationTrendChart: React.FC<HydrationTrendChartProps> = ({
  data,
  targetGoalMl = 3000,
  height = 190
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
      <div className="flex flex-col items-center justify-center text-slate-500 text-xs py-8 space-y-2" style={{ height }}>
        <Droplets className="w-6 h-6 text-cyan-400/50" />
        <span className="text-slate-400 font-mono">No hydration logs recorded in this timeframe</span>
        <span className="text-[11px] text-slate-600 font-mono">Log your daily water intake to track cellular hydration</span>
      </div>
    );
  }

  // Sort chronologically
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const width = 360;
  const paddingX = 24;
  const paddingY = 24;

  const maxVal = Math.max(targetGoalMl * 1.2, ...sortedData.map(d => d.totalMl), 2500);
  const minVal = 0;

  const getY = (ml: number) => {
    const range = maxVal - minVal;
    if (range === 0) return height / 2;
    const ratio = (ml - minVal) / range;
    return height - paddingY - ratio * (height - paddingY * 2);
  };

  // Single-point state
  if (sortedData.length === 1) {
    const single = sortedData[0];
    const nodeY = getY(single.totalMl);
    const targetY = getY(targetGoalMl);
    const pct = Math.round((single.totalMl / targetGoalMl) * 100);

    return (
      <div className="w-full flex flex-col gap-2">
        <div className="relative w-full overflow-hidden" style={{ height }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="singleHydroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#0284C7" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
              <filter id="hydroGlowSingle" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid & Goal Lines */}
            <line x1={paddingX} y1={targetY} x2={width - paddingX} y2={targetY} stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-40" />
            <text x={width - paddingX} y={targetY - 5} fill="#06B6D4" fontSize="9" textAnchor="end" fontFamily="monospace" opacity={0.85}>
              Goal: {(targetGoalMl / 1000).toFixed(1)}L
            </text>

            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

            {/* Baseline area */}
            <path 
              d={`M ${paddingX} ${nodeY} L ${width - paddingX} ${nodeY} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`} 
              fill="url(#singleHydroGrad)" 
            />

            {/* Trajectory line */}
            <line 
              x1={paddingX} 
              y1={nodeY} 
              x2={width - paddingX} 
              y2={nodeY} 
              stroke="#06B6D4" 
              strokeWidth="2.5" 
              strokeDasharray="4 4"
              className="opacity-80"
              filter="url(#hydroGlowSingle)"
            />

            {/* Center Node with Ripple */}
            <circle cx={width / 2} cy={nodeY} r={10} fill="#06B6D4" fillOpacity="0.25" className="animate-ping" />
            <circle cx={width / 2} cy={nodeY} r={7} fill="#06B6D4" stroke="#06B6D4" strokeWidth="1" className="shadow-lg glow-cyan" />
            <circle cx={width / 2} cy={nodeY} r={3} fill="#FFFFFF" />

            <text x={width / 2} y={nodeY - 12} fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {(single.totalMl / 1000).toFixed(2)}L ({pct}%)
            </text>
          </svg>
        </div>

        {/* Date bounds */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
          <span className="font-semibold text-slate-300">{formatDateDisplay(single.date)}</span>
          <span className="text-cyan-400 font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs shadow-sm">
            {(single.totalMl / 1000).toFixed(2)}L Today Baseline
          </span>
        </div>
      </div>
    );
  }

  // Multi-point spline chart
  const stepX = (width - paddingX * 2) / (sortedData.length - 1);
  const points = sortedData.map((d, i) => ({
    x: paddingX + i * stepX,
    y: getY(d.totalMl),
    data: d
  }));

  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  const targetY = getY(targetGoalMl);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="hydroGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
            <filter id="hydroGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

          {/* Target Goal Benchmark Line */}
          <line 
            x1={paddingX} 
            y1={targetY} 
            x2={width - paddingX} 
            y2={targetY} 
            stroke="#06B6D4" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            className="opacity-50"
          />
          <text x={width - paddingX} y={targetY - 5} fill="#06B6D4" fontSize="9" textAnchor="end" fontFamily="monospace" opacity={0.85}>
            Goal: {(targetGoalMl / 1000).toFixed(1)}L
          </text>

          {/* Filled Area */}
          <path d={areaD} fill="url(#hydroGradient)" />

          {/* Main Trajectory Curve */}
          <path d={pathD} fill="none" stroke="#06B6D4" strokeWidth="2.5" filter="url(#hydroGlow)" />

          {/* Data Points */}
          {points.map((p, i) => {
            const isTargetMet = p.data.totalMl >= targetGoalMl;
            return (
              <g key={i} className="cursor-pointer group">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isTargetMet ? 5 : 4} 
                  fill={isTargetMet ? '#10B981' : '#06B6D4'} 
                  stroke="#0A0E1A" 
                  strokeWidth="2"
                  className="transition-transform group-hover:scale-125"
                />
                <circle cx={p.x} cy={p.y} r={1.5} fill="#FFFFFF" />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.length > 1 && (
            <>
              <text x={points[0].x} y={height - 6} fill="#94A3B8" fontSize="9" textAnchor="start" fontFamily="monospace">
                {formatDateDisplay(points[0].data.date)}
              </text>
              <text x={points[points.length - 1].x} y={height - 6} fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace">
                {formatDateDisplay(points[points.length - 1].data.date)}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
