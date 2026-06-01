import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TacticalChartDataPoint } from '../utils/analyticsEngine';

interface TacticalChartProps {
  data: TacticalChartDataPoint[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TacticalChartDataPoint }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    
    return (
      <div className="glass-panel p-3 border-volt bg-void/90 min-w-[150px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
        <p className="text-xs font-black uppercase text-white mb-2">{dataPoint.types}</p>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 uppercase tracking-widest font-bold">Avg Duration:</span>
            <span className="font-black text-white">{dataPoint.totalDuration}m</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 uppercase tracking-widest font-bold">Avg RPE:</span>
            <span className="font-black text-crimson">{dataPoint.weightedAvgRpe.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] pt-1 mt-1 border-t border-white/10">
            <span className="text-zinc-500 uppercase tracking-widest font-bold">Avg Interference:</span>
            <span className="font-black text-volt">{dataPoint.cumulativeImpact.toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const TacticalChart: React.FC<TacticalChartProps> = ({ data }) => {
  // Add a glow filter for the Line
  return (
    <div className="w-full h-full flex flex-col relative group min-h-[220px]">
      {/* Tactical Interactive Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-white/5 border border-zinc-700" />
          <span>DURATION</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-[3px] bg-[#FF8D7A]" />
          <span>AVG RPE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-0 border-t border-dashed border-[#00b6ff]" />
          <span>INTERFERENCE</span>
        </div>
      </div>

      {/* High-Contrast A11y Data List */}
      <div className="sr-only" role="list" aria-label="Tactical Analytics Data">
        {data.map((d, i) => (
          <div 
            key={i} 
            role="listitem" 
            tabIndex={0}
          >
            {`Date: ${d.date}, Activities: ${d.types}, Duration: ${d.totalDuration} minutes, Avg Intensity RPE: ${d.weightedAvgRpe.toFixed(1)}, Cumulative Impact Score: ${d.cumulativeImpact.toFixed(1)}`}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 25, left: -20 }}
          style={{ userSelect: 'none' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="#52525b" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'Inter', fontWeight: 900 }}
            dy={10}
            padding={{ left: 10, right: 10 }}
          />
          
          <YAxis 
            yAxisId="left" 
            stroke="#52525b" 
            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Inter', fontWeight: 900 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
            tickFormatter={(val) => `${val}m`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#52525b"
            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Inter', fontWeight: 900 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            dx={10}
            tickFormatter={(val) => `${val}`}
            hide={false}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          
          <Bar 
            yAxisId="left" 
            dataKey="totalDuration" 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth={1}
            radius={[0, 0, 0, 0]} 
          />
          <Line 
            yAxisId="right" 
            type="linear" 
            dataKey="weightedAvgRpe" 
            stroke="#FF8D7A" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#FF8D7A', stroke: 'var(--void)' }}
          />
          <Line 
            yAxisId="right" 
            type="linear" 
            dataKey="cumulativeImpact" 
            stroke="#00b6ff" 
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, fill: '#00b6ff', stroke: 'var(--void)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
