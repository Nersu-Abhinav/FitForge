import React from 'react';
import { SleepLog } from '@/types';
import { parseLocalDateString } from '@/utils/date';
import { Moon, Sparkles } from 'lucide-react';

interface SleepTrendChartProps {
  data: SleepLog[];
  targetSleepHours?: number;
  height?: number;
}

export const SleepTrendChart: React.FC<SleepTrendChartProps> = ({
  data,
  targetSleepHours = 8.0,
  height = 180
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
        <Moon className="w-6 h-6 text-purple-400/50" />
        <span className="text-slate-400 font-mono">No sleep sessions recorded in this timeframe</span>
        <span className="text-[11px] text-slate-600 font-mono">Log your sleep hours to track recovery cycles</span>
      </div>
    );
  }

  // Sort chronologically
  const sortedData = [...data].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const width = 360;
  const paddingX = 24;
  const paddingY = 24;

  // Single-point state
  if (sortedData.length === 1) {
    const single = sortedData[0];
    const durationHours = (single.durationMinutes / 60);
    const centerY = height / 2;
    const hoursText = `${Math.floor(single.durationMinutes / 60)}h ${single.durationMinutes % 60}m`;
    const quality = single.qualityScore || 80;

    return (
      <div className="w-full flex flex-col gap-2">
        <div className="relative w-full overflow-hidden" style={{ height }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="singleSleepGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

            {/* Target Sleep Benchmark Line */}
            <line 
              x1={paddingX} 
              y1={paddingY + 15} 
              x2={width - paddingX} 
              y2={paddingY + 15} 
              stroke="#A855F7" 
              strokeWidth="1.5" 
              strokeDasharray="4 4"
              className="opacity-40"
            />

            {/* Baseline area */}
            <path 
              d={`M ${paddingX} ${centerY} L ${width - paddingX} ${centerY} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`} 
              fill="url(#singleSleepGradient)" 
            />

            {/* Trajectory line */}
            <line 
              x1={paddingX} 
              y1={centerY} 
              x2={width - paddingX} 
              y2={centerY} 
              stroke="#A855F7" 
              strokeWidth="2" 
              strokeDasharray="4 4"
              className="opacity-75"
            />

            {/* Center Glowing Node */}
            <circle 
              cx={width / 2} 
              cy={centerY} 
              r={7} 
              fill="#A855F7" 
              fillOpacity="0.3" 
            />
            <circle 
              cx={width / 2} 
              cy={centerY} 
              r={4} 
              fill="#A855F7" 
              stroke="#070B14" 
              strokeWidth="2" 
            />
          </svg>
        </div>

        {/* Date bounds & details */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
          <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(single.date || '')}</span>
          <div className="flex items-center gap-2">
            <span className="text-purple-300 font-bold px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs">
              {hoursText} • {quality}%
            </span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">1 Log</span>
          </div>
        </div>
      </div>
    );
  }

  // Multi-point trendline calculation
  const sleepHours = sortedData.map(d => d.durationMinutes / 60);
  const minH = Math.max(Math.min(...sleepHours) - 1, 3);
  const maxH = Math.max(...sleepHours, targetSleepHours) + 1;
  const range = maxH - minH || 1;

  const points = sortedData.map((d, index) => {
    const hours = d.durationMinutes / 60;
    const x = paddingX + (index / (sortedData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((hours - minH) / range) * (height - 2 * paddingY);
    return { x, y, hours, raw: d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Target line Y coordinate
  const targetY = height - paddingY - ((targetSleepHours - minH) / range) * (height - 2 * paddingY);

  const latest = sortedData[sortedData.length - 1];
  const latestDurationText = `${Math.floor(latest.durationMinutes / 60)}h ${latest.durationMinutes % 60}m`;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="sleepGradientMulti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

          {/* Target Sleep Benchmark Line */}
          {targetY >= paddingY && targetY <= height - paddingY && (
            <g>
              <line 
                x1={paddingX} 
                y1={targetY} 
                x2={width - paddingX} 
                y2={targetY} 
                stroke="#C084FC" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
                className="opacity-60"
              />
              <text 
                x={width - paddingX - 4} 
                y={targetY - 4} 
                fill="#C084FC" 
                fontSize="9" 
                fontFamily="monospace"
                textAnchor="end"
                className="font-bold opacity-80"
              >
                Target: {targetSleepHours}h
              </text>
            </g>
          )}

          {/* Gradient area */}
          <path d={areaD} fill="url(#sleepGradientMulti)" />

          {/* Smooth Line */}
          <path d={pathD} fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              {idx === points.length - 1 && (
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={7} 
                  fill="#A855F7" 
                  fillOpacity="0.25" 
                  stroke="#A855F7" 
                  strokeWidth="1" 
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={idx === points.length - 1 ? 4 : 3}
                fill="#A855F7"
                stroke="#070B14"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Date bounds & summary */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
        <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(sortedData[0]?.date || '')}</span>
        <span className="text-purple-300 font-bold px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/25 text-xs">
          Latest: {latestDurationText} • {latest.qualityScore || 80}%
        </span>
        <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(sortedData[sortedData.length - 1]?.date || '')}</span>
      </div>
    </div>
  );
};
