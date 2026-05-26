import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '../lib/utils';
import { EXERCISE_DATABASE } from '../constants/exercises';

export const JointStressWidget = ({ className }: { className?: string }) => {
  const { t, unit } = useSettings();
  const { history, recoveryHistory } = useWorkout();
  const [timeFrame, setTimeFrame] = React.useState<'1M' | '3M' | '6M' | 'ALL'>('6M');

  const stressData = useMemo(() => {
    if (!history && !recoveryHistory) return [];

    const weeks: Record<string, { highImpact: number, lowImpact: number, timestamp: number }> = {};
    const now = Date.now();
    let cutoffTime = 0;
    if (timeFrame === '1M') {
      cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
    } else if (timeFrame === '3M') {
      cutoffTime = now - (90 * 24 * 60 * 60 * 1000);
    } else if (timeFrame === '6M') {
      cutoffTime = now - (180 * 24 * 60 * 60 * 1000);
    }

    // Process Workouts (High Impact)
    history.forEach(session => {
      const date = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
      if (cutoffTime > 0 && date.getTime() < cutoffTime) return;

      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekKey = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let sessionHighImpact = 0;
      session.exercises?.forEach(ex => {
        // Find exercise definition to obtain connectiveTissueStressScore
        const exerciseId = (ex as any).exerciseId || '';
        const exerciseName = ex.name || '';
        const definition = EXERCISE_DATABASE.find(
          e => (exerciseId && e.id === exerciseId) || e.name.toLowerCase() === exerciseName.toLowerCase()
        );
        const stressScore = definition?.connectiveTissueStressScore || 3; // default: 3

        ex.sets?.forEach(s => {
          if (s.isCompleted) {
            const rawWeight = parseFloat(s.weight) || 0;
            const reps = parseInt(s.reps) || 0;

            // Unit conversion guard: if raw weight is in LBs, normalize it to KG equivalent
            // So that calculations remain completely unit-independent
            const normWeight = unit === 'metric' ? rawWeight : rawWeight / 2.20462;
            
            // For bodyweight exercises without added load, assume an effective skeletal/bodyweight loading of 15kg
            const effectiveWeight = normWeight > 0 ? normWeight : 15;

            const rpe = parseFloat(s.rpe) || 7;
            const rpeStressFactor = rpe >= 9.5 ? 2.5 : rpe >= 8.5 ? 1.8 : rpe >= 7 ? 1.2 : 1.0;

            // Calculate Equivalent Joint Impact Strain
            // Scaled elegantly to match active recovery minutes (lowImpact) points
            const setStressPoints = (effectiveWeight * reps * stressScore * rpeStressFactor) / 20;
            sessionHighImpact += setStressPoints;
          }
        });
      });

      if (!weeks[weekKey]) {
        weeks[weekKey] = { highImpact: 0, lowImpact: 0, timestamp: startOfWeek.getTime() };
      }
      weeks[weekKey].highImpact += sessionHighImpact;
    });

    // Process Recovery (Low Impact)
    recoveryHistory.forEach(log => {
      const date = new Date(log.timestamp);
      if (cutoffTime > 0 && date.getTime() < cutoffTime) return;

      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekKey = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Low impact is restorative
      // Only count actual restorative activities as "Low Impact" for this metric
      const restorativeTypes = ['Walking', 'Yoga', 'Pilates', 'Mobility', 'Stretching'];
      const isRestorative = restorativeTypes.includes(log.type);

      let impactValue = 0;
      if (isRestorative) {
        // High duration low intensity = good for joints
        impactValue = log.durationMinutes * (11 - log.rpe);
      }

      if (!weeks[weekKey]) {
        weeks[weekKey] = { highImpact: 0, lowImpact: 0, timestamp: startOfWeek.getTime() };
      }
      weeks[weekKey].lowImpact += impactValue;
    });

    return Object.entries(weeks)
      .map(([week, data]) => {
        // Normalize for visualization
        // We'll use a relative scale for the bars
        return {
          week,
          highImpact: data.highImpact,
          lowImpact: data.lowImpact,
          timestamp: data.timestamp,
          // Ratio: Low / High (Higher is more "longevity" focused)
          ratio: data.highImpact > 0 ? (data.lowImpact / (data.highImpact / 100)) : 100
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [history, recoveryHistory, timeFrame]);

  const latestStats = useMemo(() => {
    if (stressData.length === 0) return { ratio: 0, status: 'N/A', color: 'text-zinc-500' };
    const latest = stressData[stressData.length - 1];

    let status = 'BALANCED';
    let color = 'text-volt';

    if (latest.ratio < 20) {
      status = 'HIGH STRESS';
      color = 'text-crimson';
    } else if (latest.ratio > 80) {
      status = 'RECOVERY BIASED';
      color = 'text-emerald-500';
    }

    return {
      ratio: latest.ratio,
      status,
      color
    };
  }, [stressData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-void/95 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[200px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-volt" />
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">{t('analysis.jointStressTelemetry').toUpperCase()}</p>
              <p className="text-xs font-black uppercase text-white">{t('analysis.weekOf')} {data.week}</p>
            </div>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('analysis.highImpact')}</span>
                <span className="text-sm font-black text-crimson">{Math.round(data.highImpact).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('analysis.lowImpact')}</span>
                <span className="text-sm font-black text-emerald-500">{Math.round(data.lowImpact).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.jointStressRatio')}</span>
                <span className="text-sm font-black text-volt">{data.ratio.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn("glass-panel px-4 py-6 md:p-8 flex flex-col relative overflow-hidden min-w-0 group/module", className)}
    >
      {/* Decorative corner elements for tactical feel */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700"
        style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-volt" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-volt">{t('analysis.longevityProtocol')}</span>
          </div>
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">{t('analysis.jointStress')}</h2>
          <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
            {t('analysis.jointStressDesc')}
          </p>
        </div>

        {/* Dynamic Range Toggle on the top right */}
        <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap sm:flex-nowrap shrink-0 ml-auto lg:ml-0">
          {(['1M', '3M', '6M', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={cn(
                "px-3 py-1.5 md:px-4 md:py-2 font-headline text-[10px] md:text-[10px] font-black uppercase tracking-widest transition-all text-center",
                timeFrame === tf ? "bg-volt text-void shadow-[0_0_15px_rgba(0,182,255,0.3)]" : "text-zinc-500 hover:text-white"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[250px] w-full min-w-0">
        {stressData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stressData} margin={{ top: 5, right: 5, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                hide
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Bar dataKey="highImpact" stackId="a" fill="#FF8D7A" radius={[0, 0, 0, 0]} />
              <Bar dataKey="lowImpact" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
            <Activity size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('analysis.awaitingTelemetry')}</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-void/40 border border-white/5 relative flex flex-col justify-between min-h-[86px]">
          <div className="flex items-center gap-1 h-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">{t('analysis.jointStressRatio')}</span>
            <InfoTooltip term="jointStress" className="ml-0" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline text-2xl font-black text-white">{latestStats.ratio.toFixed(1)}</span>
            <span className="text-[10px] font-black text-zinc-600 uppercase">%</span>
          </div>
        </div>
        <div className="p-4 bg-void/40 border border-white/5 flex flex-col justify-between min-h-[86px]">
          <div className="flex items-center gap-1 h-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">{t('onboarding.recommended')} Zone</span>
          </div>
          <div className="w-full h-3 bg-zinc-900 border border-white/5 relative mt-2 mb-1">
            <div className="absolute left-[30%] right-[30%] h-full bg-volt/20" />
            <motion.div
              initial={{ left: 0 }}
              animate={{ left: `${Math.min(latestStats.ratio, 100)}%` }}
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"
            />
          </div>
        </div>
        <div className="p-4 bg-void/40 border border-white/5 flex flex-col justify-between min-h-[86px]">
          <div className="flex items-center gap-1 h-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">{t('workout.status')}</span>
          </div>
          <span className={cn("font-headline text-2xl font-black uppercase mt-2 mb-0.5", latestStats.color)}>
            {latestStats.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center px-1 opacity-60">
        <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
          SYS_STATUS: CALIBRATED
        </span>
        <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
          REF_ID: JNT_STRESS
        </span>
      </div>
    </motion.div>
  );
};
