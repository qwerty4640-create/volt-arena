import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, TrendingUp, BarChart3, Calendar, Filter, ChevronDown } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';

type TimeFrame = '1M' | '3M' | '6M' | 'ALL';

export const AnalyticsView = () => {
  const { t, unit } = useSettings();
  const { history } = useWorkout();
  const weightUnit = unit === 'metric' ? 'KG' : 'LB';

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('6M');
  const [selectedLifts, setSelectedLifts] = useState<string[]>(['Squat', 'Bench Press', 'Deadlift']);

  const liftOptions = [
    { id: 'Squat', label: t('analytics.squat'), color: '#00B6FF' },
    { id: 'Bench Press', label: t('analytics.bench'), color: '#FF7162' },
    { id: 'Deadlift', label: t('analytics.deadlift'), color: '#FFFFFF' }
  ];

  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // 1. Filter by TimeFrame
    const now = new Date();
    let startDate = new Date(0); // ALL

    if (timeFrame === '1M') startDate = new Date(now.setMonth(now.getMonth() - 1));
    else if (timeFrame === '3M') startDate = new Date(now.setMonth(now.getMonth() - 3));
    else if (timeFrame === '6M') startDate = new Date(now.setMonth(now.getMonth() - 6));

    const timeFilteredHistory = history.filter(session => {
      const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
      return sessionDate >= startDate;
    }).sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    // 2. Extract Max Weights for Selected Lifts
    return timeFilteredHistory.map(session => {
      const dataPoint: any = {
        date: session.date,
        title: session.title,
        timestamp: session.completedAt || new Date(session.date).getTime(),
        displayDate: new Date(session.completedAt || session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: new Date(session.completedAt || session.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
      };

      selectedLifts.forEach(lift => {
        const exercise = session.exercises.find(ex => ex.name.toLowerCase().includes(lift.toLowerCase()));
        if (exercise) {
          const maxWeight = Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0));
          dataPoint[lift] = maxWeight > 0 ? maxWeight : null;
        }
      });

      return dataPoint;
    }).filter(dp => selectedLifts.some(lift => dp[lift] !== undefined));
  }, [history, timeFrame, selectedLifts]);

  const volumeTrendData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const now = new Date();
    let startDate = new Date(0);
    if (timeFrame === '1M') startDate = new Date(now.setMonth(now.getMonth() - 1));
    else if (timeFrame === '3M') startDate = new Date(now.setMonth(now.getMonth() - 3));
    else if (timeFrame === '6M') startDate = new Date(now.setMonth(now.getMonth() - 6));

    const weeks: Record<string, { volume: number, timestamp: number }> = {};
    
    history.forEach(session => {
      const date = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
      if (date < startDate) return;

      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekKey = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let sessionVolume = 0;
      session.exercises?.forEach(ex => {
        ex.sets?.forEach(s => {
          if (s.isCompleted) {
            sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
          }
        });
      });
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { volume: 0, timestamp: startOfWeek.getTime() };
      }
      weeks[weekKey].volume += sessionVolume;
    });

    return Object.entries(weeks)
      .map(([week, data]) => ({
        week,
        volume: data.volume,
        timestamp: data.timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [history, timeFrame]);

  const toggleLift = (liftId: string) => {
    setSelectedLifts(prev => 
      prev.includes(liftId) 
        ? prev.filter(id => id !== liftId) 
        : [...prev, liftId]
    );
  };

  const VolumeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-void/95 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[200px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-volt" />
          <div className="space-y-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">{t('analysis.volumeTelemetry')}</p>
              <p className="text-xs font-black italic uppercase text-white">{t('analysis.weekOf')} {data.week}</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('analysis.totalVolume')}</span>
                <span className="text-sm font-black italic text-white">
                  {data.volume.toLocaleString()} <span className="text-[8px] uppercase not-italic text-zinc-500">{weightUnit}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-void/95 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[200px] relative overflow-hidden">
          {/* Tactical Accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-volt" />
          
          <div className="space-y-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">{t('analysis.telemetryLog')}</p>
              <p className="text-xs font-black italic uppercase text-white">{data.fullDate}</p>
              <p className="text-[10px] font-black uppercase tracking-tight text-volt mt-1">{data.title}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/5">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black italic text-white">
                    {entry.value} <span className="text-[8px] uppercase not-italic text-zinc-500">{weightUnit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-screen-2xl space-y-12 pb-20">
      <div className="grid grid-cols-12 gap-8">
        {/* Strength Trend Chart */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-8 glass-panel p-6 md:p-10 border-none bg-surface-container-high flex flex-col"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-volt animate-tactical-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-volt">{t('analysis.performanceTelemetry')}</span>
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-2">{t('analysis.strengthTrend')}</h2>
              <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">
                {t('analysis.strengthTrendDesc')}
              </p>
              <div className="flex flex-wrap gap-4">
                {liftOptions.map(lift => (
                  <button
                    key={lift.id}
                    onClick={() => toggleLift(lift.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 border transition-all duration-300",
                      selectedLifts.includes(lift.id) 
                        ? "bg-white/5 border-white/20" 
                        : "bg-transparent border-transparent opacity-40 grayscale"
                    )}
                  >
                    <div className="w-3 h-3" style={{ backgroundColor: lift.color }} />
                    <span className="font-headline text-[10px] font-black uppercase tracking-widest text-white">{lift.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-1 bg-void p-1 border border-white/5">
              {(['1M', '3M', '6M', 'ALL'] as TimeFrame[]).map((tf) => (
                <button 
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={cn(
                    "px-4 py-2 font-headline text-[10px] font-black uppercase tracking-widest transition-all",
                    timeFrame === tf ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[400px] w-full mt-4">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#00B6FF', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  {liftOptions.map(lift => selectedLifts.includes(lift.id) && (
                    <Line
                      key={lift.id}
                      type="monotone"
                      dataKey={lift.id}
                      stroke={lift.color}
                      strokeWidth={3}
                      dot={{ r: 4, fill: lift.color, strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: lift.color, strokeWidth: 2, fill: '#131313' }}
                      animationDuration={1500}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                <BarChart3 size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('analysis.insufficientData')}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Peak Intensity Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-4 glass-panel p-10 flex flex-col justify-between relative overflow-hidden border-none bg-surface-container-high"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-volt/5 blur-[60px] -z-10" />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-volt" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.intensityMetrics')}</span>
            </div>
            <h3 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-2">{t('analysis.peakIntensity')}</h3>
            <p className="text-zinc-400 text-xs font-medium leading-relaxed">{t('analysis.peakIntensityDesc')}</p>
          </div>
          <div className="my-12">
            <div className="font-headline text-7xl md:text-8xl font-black text-volt text-glow-volt leading-none italic">
              {history.length > 0 ? Math.max(...history.map(s => s.rpe || 0)).toFixed(1) : '0.0'}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-4 block">{t('analysis.rpeMax')}</span>
          </div>
          <div className="pt-6 border-t border-white/5">
            <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">
              {t('analysis.occurredOn')}: <span className="text-white">
                {history.length > 0 
                  ? new Date(history.reduce((prev, curr) => (curr.rpe || 0) > (prev.rpe || 0) ? curr : prev).completedAt || 0).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                  : '–'}
              </span>
            </span>
          </div>
        </motion.div>

        {/* Weekly Volume Trend */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="col-span-12 glass-panel p-10 border-none bg-surface-container-high flex flex-col"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-volt animate-tactical-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-volt">{t('analysis.volumeAccumulation')}</span>
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-2">{t('analysis.weeklyVolumeTrend')}</h2>
              <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
                {t('analysis.weeklyVolumeTrendDesc')}
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full mt-4">
            {volumeTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B6FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00B6FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                  />
                  <Tooltip content={<VolumeTooltip />} cursor={{ stroke: '#00B6FF', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#00B6FF" 
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                <TrendingUp size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('analysis.insufficientVolumeData')}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 1RM Growth Bento */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-12 glass-panel p-10 relative overflow-hidden border-none bg-surface-container-high"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy size={200} />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-crimson" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.growthAnalysis')}</span>
          </div>
          <h3 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-12">
            {t('analysis.est1rmGrowth')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {liftOptions.map((lift, i) => {
              const liftHistory = history.filter(s => s.exercises.some(ex => ex.name.toLowerCase().includes(lift.id.toLowerCase())));
              const weights = liftHistory.flatMap(s => s.exercises.find(ex => ex.name.toLowerCase().includes(lift.id.toLowerCase()))?.sets.map(set => parseFloat(set.weight) || 0) || []);
              const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
              const firstWeight = weights.length > 0 ? weights[0] : 0;
              const growth = firstWeight > 0 ? ((maxWeight - firstWeight) / firstWeight * 100).toFixed(1) : '0.0';
              const diff = maxWeight - firstWeight;

              return (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{lift.label}</span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-headline text-5xl md:text-6xl font-black italic">{maxWeight > 0 ? maxWeight : '–'}</span>
                    <span className="font-headline text-xl font-black text-zinc-400">{weightUnit}</span>
                  </div>
                  <span className="text-[10px] font-black text-volt tracking-widest mt-3 uppercase">
                    +{diff.toFixed(1)}{weightUnit} ({growth}%)
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
