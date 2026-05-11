import React, { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { WorkoutSession } from '../contexts/WorkoutContext';

interface MobilityMatrixWidgetProps {
  workoutHistory: WorkoutSession[];
}

export const MobilityMatrixWidget: React.FC<MobilityMatrixWidgetProps> = ({ workoutHistory }) => {
  const data = useMemo(() => {
    // We would parse workoutHistory sets for pain_scale and rom_quality across different movement patterns
    // Here we compute a mock matrix based on history length to represent the heatmap.
    return [
      { joint: 'Shoulder (L)', score: 85 + Math.random() * 15, fullMark: 100 },
      { joint: 'Shoulder (R)', score: 90 + Math.random() * 10, fullMark: 100 },
      { joint: 'Hips', score: 70 + Math.random() * 20, fullMark: 100 },
      { joint: 'Ankle (L)', score: 95, fullMark: 100 },
      { joint: 'Ankle (R)', score: 80 + Math.random() * 20, fullMark: 100 },
      { joint: 'Knee (L)', score: 85 + Math.random() * 10, fullMark: 100 },
      { joint: 'Knee (R)', score: 90 + Math.random() * 10, fullMark: 100 },
    ];
  }, [workoutHistory]);

  return (
    <div className="glass-panel p-4 h-full flex flex-col border border-white/5 relative overflow-hidden">
      {/* Tactical UI elements */}
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <div className="flex flex-col items-end gap-1">
          <div className="w-8 h-px bg-volt" />
          <div className="w-4 h-px bg-volt" />
        </div>
      </div>
      
      <div className="w-full flex items-center justify-between mb-8 relative z-10">
        <div className="flex flex-col">
          <h3 className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
            Integrity Scan
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="font-headline text-lg font-black uppercase tracking-tight text-white">
              Mobility Matrix
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-600 mb-1">Grid System v4.0</span>
          <div className="h-1 w-12 bg-zinc-800 overflow-hidden">
            <div className="h-full bg-volt w-2/3" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-[220px] z-10">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis 
                dataKey="joint" 
                tick={{ 
                  fill: '#71717a', 
                  fontSize: 8, 
                  fontWeight: 900, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false} 
                axisLine={false} 
              />
              <Radar
                name="Integrity"
                dataKey="score"
                stroke="#00b6ff"
                fill="#00b6ff"
                fillOpacity={0.2}
                dot={{ r: 2, fill: '#00b6ff' }}
                animationDuration={2000}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(13, 15, 11, 0.95)', 
                  border: '1px solid #00b6ff33',
                  padding: '8px 12px',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ display: 'none' }}
                itemStyle={{ 
                  color: '#00b6ff', 
                  fontSize: '10px', 
                  fontFamily: 'Inter', 
                  fontWeight: 900, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Signal Lost</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 border border-volt/50" />
          <span>Optimal Range</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-0.5 bg-volt/30" />
          <span>Active Matrix</span>
        </div>
      </div>
    </div>
  );
};
