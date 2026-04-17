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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as TacticalChartDataPoint;
    
    return (
      <div className="glass-panel p-3 border-volt bg-void/90 min-w-[150px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
        <p className="text-xs font-black italic uppercase text-white mb-2">{dataPoint.types}</p>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 uppercase tracking-widest font-bold">Total Duration:</span>
            <span className="font-black text-white">{dataPoint.totalDuration}m</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 uppercase tracking-widest font-bold">Avg RPE:</span>
            <span className="font-black text-crimson">{dataPoint.weightedAvgRpe.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] pt-1 mt-1 border-t border-white/10">
            <span className="text-zinc-500 uppercase tracking-widest font-bold">Interference:</span>
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
    <div className="w-full h-full flex flex-col relative group min-h-[200px]">
      {/* High-Contrast A11y Data List */}
      <div className="sr-only" role="list" aria-label="Tactical Analytics Data">
        {data.map((d, i) => (
          <div 
            key={i} 
            role="listitem" 
            tabIndex={0}
            onFocus={(e) => {
              // Custom focus logic if needed, but standard browser behavior will announce its contents
            }}
          >
            {`Date: ${d.date}, Activities: ${d.types}, Duration: ${d.totalDuration} minutes, Avg Intensity RPE: ${d.weightedAvgRpe.toFixed(1)}, Cumulative Impact Score: ${d.cumulativeImpact.toFixed(1)}`}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
          style={{ userSelect: 'none' }}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="#52525b" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 900 }}
            dy={10}
            padding={{ left: 10, right: 10 }}
          />
          
          <YAxis 
            yAxisId="left" 
            stroke="#52525b" 
            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Space Grotesk', fontWeight: 900 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
            tickFormatter={(val) => `${val}m`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#52525b"
            tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Space Grotesk', fontWeight: 900 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            dx={10}
            tickFormatter={(val) => `IMP ${val}`}
            hide // Optionally hide right axis to keep it clean, but keep scaling
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          
          <Bar 
            yAxisId="left" 
            dataKey="totalDuration" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="var(--primary-color)" 
            strokeWidth={1}
            radius={[2, 2, 0, 0]} 
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="cumulativeImpact" 
            stroke="var(--crimson)" 
            strokeWidth={3}
            dot={{ r: 4, fill: 'var(--void)', stroke: 'var(--crimson)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--crimson)', stroke: 'var(--void)' }}
            filter="url(#glow)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
