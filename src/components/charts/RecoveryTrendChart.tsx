import React from 'react';
import { RecoveryLog } from '@/types';
import { parseLocalDateString } from '@/utils/date';
import { Activity, Zap } from 'lucide-react';

interface RecoveryTrendChartProps {
  data: RecoveryLog[];
  height?: number;
}

export const RecoveryTrendChart: React.FC<RecoveryTrendChartProps> = ({
  data,
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
        <Activity className="w-6 h-6 text-emerald-400/50" />
        <span className="text-slate-400 font-mono">No recovery check-ins in this timeframe</span>
        <span className="text-[11px] text-slate-600 font-mono">Log your readiness & soreness to calculate recovery trends</span>
      </div>
    );
  }

  // Sort chronologically
  const sortedData = [...data].sort((a, b) => (a.date || a.recoveryDate || '').localeCompare(b.date || b.recoveryDate || ''));
  const width = 360;
  const paddingX = 24;
  const paddingY = 24;

  // Single-point state
  if (sortedData.length === 1) {
    const single = sortedData[0];
    const score = single.calculatedScore || single.recoveryScore || 85;
    const soreness = single.sorenessLevel || 3;
    const centerY = height / 2;

    return (
      <div className="w-full flex flex-col gap-2">
        <div className="relative w-full overflow-hidden" style={{ height }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="singleRecoveryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

            {/* Baseline area */}
            <path 
              d={`M ${paddingX} ${centerY} L ${width - paddingX} ${centerY} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`} 
              fill="url(#singleRecoveryGradient)" 
            />

            {/* Baseline trajectory line */}
            <line 
              x1={paddingX} 
              y1={centerY} 
              x2={width - paddingX} 
              y2={centerY} 
              stroke="#10B981" 
              strokeWidth="2" 
              strokeDasharray="4 4"
              className="opacity-75"
            />

            {/* Center Glowing Node */}
            <circle 
              cx={width / 2} 
              cy={centerY} 
              r={7} 
              fill="#10B981" 
              fillOpacity="0.3" 
            />
            <circle 
              cx={width / 2} 
              cy={centerY} 
              r={4} 
              fill="#10B981" 
              stroke="#070B14" 
              strokeWidth="2" 
            />
          </svg>
        </div>

        {/* Date bounds */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
          <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(single.date || single.recoveryDate || '')}</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
              Readiness {score}% • DOMS {soreness}/10
            </span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">1 Log</span>
          </div>
        </div>
      </div>
    );
  }

  // Multi-point trendline calculation (0-100% score)
  const scores = sortedData.map(d => d.calculatedScore || d.recoveryScore || 75);
  const minScore = Math.max(Math.min(...scores) - 10, 0);
  const maxScore = Math.min(Math.max(...scores) + 10, 100);
  const range = maxScore - minScore || 1;

  const points = sortedData.map((d, index) => {
    const score = d.calculatedScore || d.recoveryScore || 75;
    const x = paddingX + (index / (sortedData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((score - minScore) / range) * (height - 2 * paddingY);
    return { x, y, score, raw: d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // 80% Optimal Zone benchmark
  const optimalY = height - paddingY - ((80 - minScore) / range) * (height - 2 * paddingY);

  const latest = sortedData[sortedData.length - 1];
  const latestScore = latest.calculatedScore || latest.recoveryScore || 85;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="recoveryGradientMulti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" />

          {/* 80% Optimal Readiness Line */}
          {optimalY >= paddingY && optimalY <= height - paddingY && (
            <g>
              <line 
                x1={paddingX} 
                y1={optimalY} 
                x2={width - paddingX} 
                y2={optimalY} 
                stroke="#34D399" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
                className="opacity-50"
              />
              <text 
                x={width - paddingX - 4} 
                y={optimalY - 4} 
                fill="#34D399" 
                fontSize="9" 
                fontFamily="monospace"
                textAnchor="end"
                className="font-bold opacity-80"
              >
                Optimal Zone (80%+)
              </text>
            </g>
          )}

          {/* Gradient area */}
          <path d={areaD} fill="url(#recoveryGradientMulti)" />

          {/* Smooth Line */}
          <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              {idx === points.length - 1 && (
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={7} 
                  fill="#10B981" 
                  fillOpacity="0.25" 
                  stroke="#10B981" 
                  strokeWidth="1" 
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={idx === points.length - 1 ? 4 : 3}
                fill="#10B981"
                stroke="#070B14"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Date bounds */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 pt-1">
        <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(sortedData[0]?.date || sortedData[0]?.recoveryDate || '')}</span>
        <span className="text-emerald-400 font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-xs">
          Latest: {latestScore}% • DOMS {latest.sorenessLevel || 3}/10
        </span>
        <span className="font-semibold text-slate-300 shrink-0">{formatDateDisplay(sortedData[sortedData.length - 1]?.date || sortedData[sortedData.length - 1]?.recoveryDate || '')}</span>
      </div>
    </div>
  );
};
