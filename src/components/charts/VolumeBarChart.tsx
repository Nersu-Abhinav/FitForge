import React from 'react';

interface VolumeDataPoint {
  day: string;
  volumeKg: number;
  isToday?: boolean;
}

interface VolumeBarChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

export const VolumeBarChart: React.FC<VolumeBarChartProps> = ({ data, height = 160 }) => {
  const maxVolume = Math.max(...data.map(d => d.volumeKg), 4000);

  return (
    <div className="w-full flex flex-col gap-2 pt-2">
      <div className="flex items-end justify-between gap-2 px-1" style={{ height }}>
        {data.map((item, index) => {
          const rawPct = (item.volumeKg / maxVolume) * 100;
          const heightPct = item.volumeKg > 0 ? Math.max(rawPct, 12) : 6;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
              {/* Volume value tooltip / label on hover & active */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-xl whitespace-nowrap">
                {item.volumeKg > 0 ? `${item.volumeKg.toLocaleString()} kg` : '0 kg'}
              </div>

              {/* Bar Track & Fill */}
              <div className="w-full max-w-[28px] h-full flex flex-col justify-end bg-white/[0.04] rounded-t-xl overflow-hidden p-0.5 relative">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out relative ${
                    item.isToday
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                      : item.volumeKg > 0
                        ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                        : 'bg-white/10'
                  }`}
                  style={{
                    height: `${heightPct}%`,
                  }}
                >
                  {/* Subtle top shine */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/50" />
                </div>
              </div>

              {/* Day Label with Today Badge */}
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[11px] font-mono transition-colors ${
                  item.isToday 
                    ? 'text-emerald-400 font-black' 
                    : item.volumeKg > 0 
                      ? 'text-slate-200 font-bold' 
                      : 'text-slate-500 font-medium'
                }`}>
                  {item.day}
                </span>
                {item.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

