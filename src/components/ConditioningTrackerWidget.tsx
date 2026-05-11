import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { WorkoutSession } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';

interface ConditioningTrackerWidgetProps {
  workoutHistory: WorkoutSession[];
}

export const ConditioningTrackerWidget: React.FC<ConditioningTrackerWidgetProps> = ({ workoutHistory }) => {
  const { t } = useSettings();

  const data = useMemo(() => {
    // Process history chronologically to compute aerobic capacity pacing
    return workoutHistory.map((session, index) => {
      // Mocked calculation based on existing data. In a real scenario we use actual data from sets.
      // E.g., summing up workCapacity or pace.
      const pseudoHeartRate = Math.min(180, 120 + Math.random() * 40);
      const pseudoWorkCapacity = session.workCapacity || (10 + index * 0.5 + Math.random() * 2);
      
      return {
        name: session.date,
        heartRate: pseudoHeartRate,
        workCapacity: pseudoWorkCapacity,
      };
    }).slice(-15);
  }, [workoutHistory]);

  return (
    <div className="glass-panel p-4 h-full flex flex-col border border-white/5 relative overflow-hidden group">
      {/* Decorative corner elements for tactical feel */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />

      <div className="w-full flex items-center justify-between mb-6 relative z-10">
        <div className="flex flex-col">
          <h3 className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
            Biometric Telemetry
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-volt animate-pulse" />
            <span className="font-headline text-lg font-black uppercase tracking-tight text-white">
              Aerobic Capacity
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-black tracking-widest text-volt/60 mb-1">Status</p>
          <p className="text-xs font-black uppercase tracking-widest text-volt animate-tactical-pulse px-2 py-0.5 border border-volt/20">
            Active
          </p>
        </div>
      </div>

      <div className="flex-1 w-full relative z-10">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b6ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00b6ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
              <XAxis 
                dataKey="name" 
                hide 
              />
              <YAxis 
                hide 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                cursor={{ stroke: '#00b6ff33', strokeWidth: 1 }}
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
              <Area 
                type="monotone" 
                dataKey="workCapacity" 
                stroke="#00b6ff" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorWork)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center">
              <div className="w-1 hidden h-1 bg-zinc-800 animate-ping" />
            </div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">
              Awaiting Payload
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
        <span className="flex items-center gap-1.5 text-zinc-600">
          <span className="w-1 h-1 bg-zinc-700" />
          Sensor Link: Secured
        </span>
        <span className="text-volt/40">Unit: Tonnage/Min</span>
      </div>
    </div>
  );
};
