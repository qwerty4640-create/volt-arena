import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, TrendingUp, BarChart3, Calendar, Filter, ChevronDown, Plus, Settings2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { ExternalActivityWidget } from './AnalysisView';
import { isMainLiftMatch, calculateE1RM } from '../utils/workoutUtils';
import { calculateExrxPercentile } from '../lib/strength';
import { InfoTooltip } from './InfoTooltip';
import { JointStressWidget } from './JointStressWidget';
import { CustomizeDashboardModal } from './CustomizeDashboardModal';
import { ConditioningTrackerWidget } from './ConditioningTrackerWidget';
import { MobilityMatrixWidget } from './MobilityMatrixWidget';
import { PerformanceWidgetId } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';

type TimeFrame = '1M' | '3M' | '6M' | 'ALL';

export const AnalyticsView = () => {
  const { t, unit, profile, performanceWidgets, setPerformanceWidgets } = useSettings();
  const { history } = useWorkout();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('6M');
  const [selectedLifts, setSelectedLifts] = useState<string[]>(['Squat', 'Bench Press', 'Deadlift']);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  const liftOptions = [
    { id: 'Squat', label: t('analytics.squat'), color: 'var(--primary-color)' },
    { id: 'Bench Press', label: t('analytics.bench'), color: 'var(--primary-color)' },
    { id: 'Deadlift', label: t('analytics.deadlift'), color: 'var(--primary-color)' }
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
        fullDate: new Date(session.completedAt || session.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
        rpe: session.rpe
      };

      selectedLifts.forEach(lift => {
        const exercise = session.exercises.find(ex => isMainLiftMatch(ex.name, lift));
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

    const weeks: Record<string, { volume: number, rpeSum: number, rpeCount: number, timestamp: number }> = {};

    history.forEach(session => {
      const date = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
      if (date < startDate) return;

      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekKey = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let sessionVolume = 0;
      let rpeSum = 0;
      let rpeCount = 0;

      session.exercises?.forEach(ex => {
        ex.sets?.forEach(s => {
          if (s.isCompleted) {
            sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
            const rpeVal = parseFloat(s.rpe);
            if (!isNaN(rpeVal)) {
              rpeSum += rpeVal;
              rpeCount += 1;
            }
          }
        });
      });

      if (!weeks[weekKey]) {
        weeks[weekKey] = { volume: 0, rpeSum: 0, rpeCount: 0, timestamp: startOfWeek.getTime() };
      }
      weeks[weekKey].volume += sessionVolume;
      weeks[weekKey].rpeSum += rpeSum;
      weeks[weekKey].rpeCount += rpeCount;
    });

    return Object.entries(weeks)
      .map(([week, data]) => ({
        week,
        volume: data.volume,
        avgRpe: data.rpeCount > 0 ? Number((data.rpeSum / data.rpeCount).toFixed(1)) : null,
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
              <p className="text-xs font-black uppercase text-white">{t('analysis.weekOf')} {data.week}</p>
            </div>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('analysis.totalVolume')}</span>
                <span className="text-sm font-black text-white">
                  {data.volume.toLocaleString()} <span className="text-[8px] uppercase not- text-zinc-500">{weightUnit}</span>
                </span>
              </div>
              {data.avgRpe !== null && data.avgRpe !== undefined && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Avg RPE</span>
                  <span className="text-sm font-black text-[#FF7162]">
                    {data.avgRpe}
                  </span>
                </div>
              )}
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
              <p className="text-xs font-black uppercase text-white">{data.fullDate}</p>
              <p className="text-[10px] font-black uppercase tracking-tight text-volt mt-1">{data.title}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/5">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {entry.value} <span className="text-[8px] uppercase not- text-zinc-500">{weightUnit}</span>
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mission RPE</span>
                <span className="text-sm font-black text-volt">{data.rpe ? (data.rpe as number).toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-12">
      <div className="w-full mb-4">
        <button
          onClick={() => setIsCustomizeModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-void border border-white/10 text-white font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-volt/50 transition-all group"
        >
          <Settings2 size={14} className="text-zinc-400 group-hover:text-volt" />
          {t('analysis.customizeDashboard')}
        </button>
      </div>

      <div className="flex flex-col gap-12">
        {performanceWidgets.map((widgetId) => {
          switch (widgetId) {
            case 'progression':
              return (
                <motion.div
                  key="progression"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel px-4 py-6 md:p-8 flex flex-col relative overflow-hidden min-w-0"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                      <h2 className="font-headline text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">{t('analysis.strengthTrend')}</h2>
                      <p className="text-zinc-400 text-xs font-medium max-w-md mb-8 leading-relaxed">
                        {t('analysis.strengthTrendDesc')}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {liftOptions.map(lift => (
                          <button
                            key={lift.id}
                            onClick={() => {
                              if (selectedLifts.includes(lift.id)) {
                                if (selectedLifts.length > 1) setSelectedLifts(selectedLifts.filter(id => id !== lift.id));
                              } else {
                                setSelectedLifts([...selectedLifts, lift.id]);
                              }
                            }}
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

                    <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap md:flex-nowrap shrink-0">
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

                  <div className="h-[300px] w-full mt-4 min-w-0">
                    {filteredData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fontFamily: 'Inter' }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          {liftOptions.map(lift => selectedLifts.includes(lift.id) && (
                            <Line
                              key={lift.id}
                              type="linear"
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
              );

            case 'volume-trend':
              return (
                <motion.div
                  key="volume-trend"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="glass-panel px-4 py-6 md:p-8 flex flex-col min-w-0 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                      <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">{t('analysis.weeklyVolumeTrend')}</h2>
                      <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
                        {t('analysis.weeklyVolumeTrendDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="h-[250px] w-full min-w-0">
                    {volumeTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={volumeTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 25 }}>
                          <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fontFamily: 'Inter' }}
                            dy={10}
                          />
                          <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 10]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#FF7162', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                          />
                          <Tooltip content={<VolumeTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area
                            yAxisId="left"
                            type="linear"
                            dataKey="volume"
                            stroke="var(--primary-color)"
                            fillOpacity={1}
                            fill="url(#colorVolume)"
                            strokeWidth={3}
                          />
                          <Line
                            yAxisId="right"
                            type="linear"
                            dataKey="avgRpe"
                            stroke="var(--primary-color)"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'var(--primary-color)', strokeWidth: 0 }}
                            activeDot={{ r: 6, stroke: 'var(--primary-color)', strokeWidth: 2, fill: '#131313' }}
                            animationDuration={1500}
                            connectNulls
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                        <TrendingUp size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('analysis.insufficientVolumeData')}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );

            case 'joint-stress':
              return <JointStressWidget key="joint-stress" />;

            case 'growth':
              return (
                <motion.div
                  key="growth"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel px-4 py-6 md:p-8 relative overflow-hidden min-w-0"
                >
                  <h3 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                    {t('Estimated 1rm')}
                  </h3>

                  {(() => {
                    const latestE1RMs = liftOptions.map(lift => {
                      const liftHistory = history.filter(s => s.exercises.some(ex => isMainLiftMatch(ex.name, lift.id)));
                      const e1rms = liftHistory.flatMap(s => s.exercises.find(ex => isMainLiftMatch(ex.name, lift.id))?.sets.map(set => calculateE1RM(parseFloat(set.weight) || 0, parseInt(set.reps) || 0)) || []);
                      return e1rms.length > 0 ? Math.round(Math.max(...e1rms)) : 0;
                    });
                    const totalSBD = latestE1RMs.reduce((a, b) => a + b, 0);

                    const p = calculateExrxPercentile(totalSBD, profile?.weight || 0, profile?.gender || 'male', profile?.age);

                    return (
                      <div className="mb-12">
                        <div className="text-zinc-400 text-xs font-medium mt-2">
                          {t('analysis.youAreTop')} <span className="text-volt font-bold">{p < 1 ? '<1' : p.toFixed(1)}%</span> {t('analysis.ofPopulation')} <InfoTooltip term="Percentile" className="inline-block z-10 relative" />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-8 md:gap-12">
                    {liftOptions.map((lift, i) => {
                      const liftHistory = [...history]
                        .filter(s => s.exercises.some(ex => isMainLiftMatch(ex.name, lift.id)))
                        .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

                      const e1rms = liftHistory.flatMap(s => s.exercises.find(ex => isMainLiftMatch(ex.name, lift.id))?.sets.map(set => calculateE1RM(parseFloat(set.weight) || 0, parseInt(set.reps) || 0)) || []);
                      const maxE1RM = e1rms.length > 0 ? Math.round(Math.max(...e1rms)) : 0;
                      const firstE1RM = e1rms.length > 0 ? Math.round(e1rms[0]) : 0;
                      const growth = firstE1RM > 0 ? ((maxE1RM - firstE1RM) / firstE1RM * 100).toFixed(1) : '0.0';
                      const diff = maxE1RM - firstE1RM;

                      return (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{lift.label}</span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-headline text-2xl md:text-3xl font-black text-white">{maxE1RM > 0 ? maxE1RM : '–'}</span>
                            <span className="font-headline text-xs font-black text-zinc-500">{weightUnit}</span>
                          </div>
                          <span className="text-[8px] font-bold text-volt tracking-widest mt-1 uppercase">
                            {liftHistory.length > 1 ? (
                              <>+{diff.toFixed(1)}{weightUnit} ({growth}%)</>
                            ) : (
                              <span className="text-zinc-600">{t('analysis.baseline')}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}

                    {(() => {
                      const liftStats = liftOptions.map(lift => {
                        const liftHistory = [...history]
                          .filter(s => s.exercises.some(ex => isMainLiftMatch(ex.name, lift.id)))
                          .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

                        const e1rms = liftHistory.flatMap(s => s.exercises.find(ex => isMainLiftMatch(ex.name, lift.id))?.sets.map(set => calculateE1RM(parseFloat(set.weight) || 0, parseInt(set.reps) || 0)) || []);

                        return {
                          max: e1rms.length > 0 ? Math.round(Math.max(...e1rms)) : 0,
                          first: e1rms.length > 0 ? Math.round(e1rms[0]) : 0,
                          hasHistory: liftHistory.length > 1
                        };
                      });

                      const total = liftStats.reduce((a, b) => a + b.max, 0);
                      const firstTotal = liftStats.reduce((a, b) => a + b.first, 0);
                      const hasMultiSession = liftStats.some(s => s.hasHistory);

                      const growth = firstTotal > 0 ? ((total - firstTotal) / firstTotal * 100).toFixed(1) : '0.0';
                      const diff = total - firstTotal;

                      return (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{t('analysis.sbd_total')}</span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-headline text-2xl md:text-3xl font-black text-white">{total > 0 ? total : '–'}</span>
                            <span className="font-headline text-xs font-black text-zinc-500">{weightUnit}</span>
                          </div>
                          <span className="text-[8px] font-bold text-volt tracking-widest mt-1 uppercase">
                            {hasMultiSession ? (
                              <>+{diff.toFixed(1)}{weightUnit} ({growth}%)</>
                            ) : (
                              <span className="text-zinc-600">{t('analysis.baseline')}</span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              );

            case 'tactical':
              return (
                <motion.div
                  key="tactical"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="glass-panel p-0 overflow-hidden border-none min-w-0"
                >
                  <ExternalActivityWidget />
                </motion.div>
              );

            case 'conditioning-tracker':
              return (
                <motion.div
                  key="conditioning-tracker"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="min-w-0 h-[300px]"
                >
                  <ConditioningTrackerWidget workoutHistory={history} />
                </motion.div>
              );

            case 'mobility-matrix':
              return (
                <motion.div
                  key="mobility-matrix"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="min-w-0 h-[300px]"
                >
                  <MobilityMatrixWidget workoutHistory={history} />
                </motion.div>
              );

            default:
              return null;
          }
        })}
      </div>

      <CustomizeDashboardModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentWidgets={performanceWidgets}
        onSave={setPerformanceWidgets}
        type="performance"
      />
    </div>
  );
};

