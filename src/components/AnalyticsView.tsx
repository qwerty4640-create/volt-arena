import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, BarChart3, Settings2, Info, BicepsFlexed, Navigation } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { filterDataByRange, getTacticalImpact } from '../utils/analyticsEngine';
import { isMainLiftMatch, calculateE1RM, isExerciseMatch } from '../utils/workoutUtils';
import { calculateExrxPercentile } from '../lib/strength';
import { InfoTooltip } from './InfoTooltip';
import { JointStressWidget } from './JointStressWidget';
import { CustomizeDashboardModal } from './CustomizeDashboardModal';
import { ConditioningTrackerWidget } from './ConditioningTrackerWidget';
import { MobilityMatrixWidget } from './MobilityMatrixWidget';
import { TacticalChart } from './TacticalChart';
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

const TacticalIntegration = ({ activeRange, onRangeChange }: { activeRange: string, onRangeChange: (tf: any) => void }) => {
  const { t } = useSettings();
  const { recoveryHistory, getCalibrationStatus } = useWorkout();
  const calibration = getCalibrationStatus();
  
  // Force a re-calculation when activeRange changes
  const filteredData = useMemo(() => {
    return filterDataByRange(recoveryHistory || [], activeRange);
  }, [activeRange, recoveryHistory]);

  const avgHours = useMemo(() => {
    if (filteredData.length === 0) return '0';
    // Using durationMinutes from ActiveRecovery, user snippet used .duration
    const total = filteredData.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    return (total / 60 / filteredData.length).toFixed(1);
  }, [filteredData]);

  const totalHours = useMemo(() => {
    return (filteredData.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / 60).toFixed(1);
  }, [filteredData]);

  const avgRpe = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return (filteredData.reduce((acc, curr) => acc + curr.rpe, 0) / filteredData.length);
  }, [filteredData]);

  const { weeklyCumulativeScore, chartData } = getTacticalImpact(filteredData);

  let impactColor = "text-volt";
  let impactLabel = "Optimal";
  if (weeklyCumulativeScore > 5 && weeklyCumulativeScore <= 12) {
    impactColor = "text-zinc-400";
    impactLabel = "Moderate";
  } else if (weeklyCumulativeScore > 12) {
    impactColor = "text-crimson";
    impactLabel = "High Interference";
  }

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 w-full relative">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="text-volt" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-volt">FIELD PROTOCOL</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white mb-2">{t('analysis.tacticalIntegration')}</h2>
          <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
            {t('analysis.tacticalIntegrationDesc')}
          </p>
        </div>

        <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap md:flex-nowrap shrink-0 md:mt-0">
          {(['1M', '3M', '6M', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onRangeChange(tf)}
              className={cn(
                "px-3 py-1.5 md:px-4 md:py-2 font-headline text-[10px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                activeRange === tf ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 mb-6 relative z-10 w-full gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            {activeRange === '1M' ? t('analysis.monthly') :
              activeRange === '3M' ? '3 MONTHS' :
                activeRange === '6M' ? '6 MONTHS' : 'TOTAL'} HOURS
          </span>
          <div className="flex items-end gap-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black">{totalHours}</span>
            <span className="text-xs font-bold text-zinc-600 mb-1">hrs</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Avg {avgHours}h / Session</p>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">AVG RPE</span>
          <div className="flex items-end gap-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-volt">{avgRpe > 0 ? avgRpe.toFixed(1) : '–'}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block relative">
              Program Impact
            </span>
            <InfoTooltip term="ProgramImpact" />
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
              {weeklyCumulativeScore.toFixed(1)}
            </span>
          </div>
          <p className={`text-[10px] font-bold uppercase mt-1 ${impactColor}`}>
            {impactLabel}
          </p>
        </div>
      </div>

      <div className="h-[200px] w-full relative z-10 mb-6 min-w-0">
        <TacticalChart data={chartData} />
      </div>

      <div className="mt-auto border-t border-volt/20 pt-4 relative z-10">
        <div className="flex items-start gap-3">
          <Info className="text-volt shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-xs text-zinc-400">
              {calibration.hasAerobicInterference
                ? "You're accumulating too much systemic fatigue from extracurricular activities. Consider lowering the RPE of your tactical missions or reducing duration to preserve force production for the barbell."
                : "Keep tactical missions at an RPE of 7 or lower on days prior to lower-body training to prevent central nervous system fatigue."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsView = () => {
  const { t, unit, profile, performanceWidgets, setPerformanceWidgets, isCustomizeModalOpen, setIsCustomizeModalOpen } = useSettings();
  const { history } = useWorkout();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('6M');
  const [selectedLifts, setSelectedLifts] = useState<string[]>(['Squat', 'Bench Press', 'Deadlift']);
  const [customLifts, setCustomLifts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vanguard_custom_lifts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [exerciseSearchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('vanguard_custom_lifts', JSON.stringify(customLifts));
    } catch (e) {
      console.error('Failed to save custom lifts to localStorage', e);
    }
  }, [customLifts]);

  const getDecayedE1RMFromHistory = (liftHistory: typeof history, liftId: string) => {
    const sortedLiftHistory = [...liftHistory].sort((a, b) => {
      const timeA = a.completedAt || (a.date ? new Date(a.date).getTime() : 0);
      const timeB = b.completedAt || (b.date ? new Date(b.date).getTime() : 0);
      return timeA - timeB;
    });

    let rollingMax = 0;
    sortedLiftHistory.forEach(s => {
      const ex = s.exercises?.find(e => {
        if (['Squat', 'Bench Press', 'Deadlift'].includes(liftId)) {
          return isMainLiftMatch(e.name, liftId);
        }
        return isExerciseMatch(e.name, liftId);
      });
      if (!ex || !ex.sets) return;

      const sessionE1RMs = ex.sets.map(set => calculateE1RM(
        parseFloat(set.weight) || 0,
        parseInt(set.reps) || 0,
        parseFloat(set.rpe || set.actualRpe || ''),
        ex.name
      )).filter(v => v > 0);

      if (sessionE1RMs.length > 0) {
        const sessionMax = Math.max(...sessionE1RMs);
        if (sessionMax > rollingMax) {
          rollingMax = sessionMax;
        }
      }

      // Decay logic for missed reps
      const workingSets = ex.sets.filter((st: any) => 
        !st.isWarmup && 
        st.isCompleted !== false && 
        st.completed !== false
      );
      if (workingSets.length > 0) {
        let maxMissedReps = 0;
        workingSets.forEach((set: any) => {
          const setTargetStr = set.baseReps || set.reps;
          const setTarget = parseInt(setTargetStr.split("-")[0]) || 5;
          const setActual = parseInt(set.reps) || 0;
          if (setActual < setTarget) {
            const missed = setTarget - setActual;
            if (missed > maxMissedReps) {
              maxMissedReps = missed;
            }
          }
        });

        if (maxMissedReps > 0) {
          rollingMax = rollingMax * (1 - maxMissedReps * 0.02);
        }
      }
    });
    return rollingMax;
  };

  const allExercisesInHistory = useMemo(() => {
    if (!history) return [];
    const names = new Set<string>();
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        if (ex.name) {
          const clean = ex.name
            .replace(/\[?(HEAVY PRIMARY|HYPERTROPHY|ACTIVE RECOVERY|MOVEMENT QUALITY|BLOOD FLOW)\]?/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (clean) {
            names.add(clean);
          }
        }
      });
    });
    return Array.from(names).sort();
  }, [history]);

  const customColors = ['#A855F7', '#10B981', '#3B82F6', '#EC4899', '#F97316', '#6366F1', '#14B8A6'];

  const liftOptions = [
    { id: 'Squat', label: t('analytics.squat'), color: '#00b6ff' },
    { id: 'Bench Press', label: t('analytics.bench'), color: '#EAB308' },
    { id: 'Deadlift', label: t('analytics.deadlift'), color: '#FF8D7A' }
  ];

  const filteredData = useMemo(() => {
    const timeFilteredHistory = filterDataByRange(history || [], timeFrame)
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    // 2. Extract Max Weights for Selected Lifts
    return timeFilteredHistory.map(session => {
      const dateVal = session.completedAt || session.date || Date.now();
      const parsedDate = new Date(dateVal);
      const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      const dataPoint: any = {
        date: session.date || '',
        title: session.title || '',
        timestamp: safeDate.getTime(),
        displayDate: safeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: safeDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
        rpe: session.rpe || 0
      };

      selectedLifts.forEach(lift => {
        const exercise = session.exercises?.find((ex: any) => ex?.name && isMainLiftMatch(ex.name, lift));
        if (exercise) {
          const sMap = (exercise.sets || []).map((s: any) => parseFloat(s.weight) || 0);
          const maxWeight = sMap.length > 0 ? Math.max(...sMap) : 0;
          dataPoint[lift] = maxWeight > 0 ? maxWeight : null;
        }
      });

      return dataPoint;
    }).filter(dp => selectedLifts.some(lift => dp[lift] !== undefined && dp[lift] !== null));
  }, [history, timeFrame, selectedLifts]);



  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-void/95 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[200px] relative overflow-hidden">
          {/* Tactical Accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-volt" />

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">{t('analysis.telemetryLog')}</p>
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
                    {entry.value} <span className="text-[10px] uppercase not- text-zinc-500">{weightUnit}</span>
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
      <div className="md:hidden w-full mb-4">
        <button
          onClick={() => setIsCustomizeModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-void border border-white/10 text-white font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-volt/50 transition-all group"
        >
          <Settings2 size={14} className="text-zinc-400 group-hover:text-volt" />
          {t('analysis.customizeDashboard')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
        {performanceWidgets.map((widgetId) => {
          switch (widgetId) {
            case 'progression':
              return (
                <motion.div
                  key="progression"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel px-4 py-6 md:p-8 flex flex-col relative overflow-hidden min-w-0 group/module vanguard-tour-strength-trend lg:col-span-2"
                >
                  {/* Decorative corner elements for tactical feel */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700"
                    style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="flex flex-col mb-12 w-full gap-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <BicepsFlexed className="text-volt" size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-volt">STRENGTH PROTOCOL</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white mb-2">{t('analysis.strengthTrend')}</h2>
                        <p className="text-zinc-400 text-xs font-medium w-full leading-relaxed">
                          {t('analysis.strengthTrendDesc')}
                        </p>
                      </div>

                      {/* Dynamic Range Toggle on the top right */}
                      <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap sm:flex-nowrap shrink-0 md:mt-8">
                        {(['1M', '3M', '6M', 'ALL'] as TimeFrame[]).map((tf) => (
                          <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={cn(
                              "px-3 py-1.5 md:px-4 md:py-2 font-headline text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all text-center",
                              timeFrame === tf ? "bg-volt text-void shadow-[0_0_15px_rgba(0,182,255,0.3)]" : "text-zinc-500 hover:text-white"
                            )}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 w-full">
                      <div className="flex flex-wrap gap-4 w-full sm:w-auto">
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
                            tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
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
                              dot={false}
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

                  <div className="mt-4 flex justify-between items-center px-1 opacity-60">
                    <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                      SYS_STATUS: CALIBRATED
                    </span>
                    <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                      REF_ID: STR_TREND
                    </span>
                  </div>
                </motion.div>
              );



            case 'joint-stress':
              return <JointStressWidget key="joint-stress" className="vanguard-tour-joint-stress lg:col-span-2" />;

            case 'growth':
              return (
                <motion.div
                  key="growth"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel px-4 py-6 md:p-8 flex flex-col relative overflow-hidden min-w-0 group/module vanguard-tour-estimated-1rm lg:col-span-2"
                >
                  {/* Decorative corner elements for tactical feel */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700"
                    style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <div className="relative z-10 flex flex-col">
                    {(() => {
                      const latestE1RMs = liftOptions.map(lift => {
                        const liftHistory = history.filter(s => s.exercises?.some(ex => {
                          if (['Squat', 'Bench Press', 'Deadlift'].includes(lift.id)) {
                            return isMainLiftMatch(ex.name, lift.id);
                          }
                          return isExerciseMatch(ex.name, lift.id);
                        }) || false);
                        return Math.round(getDecayedE1RMFromHistory(liftHistory, lift.id));
                      });
                      const sqMax = latestE1RMs[0] || 0;
                      const bpMax = latestE1RMs[1] || 0;
                      const dlMax = latestE1RMs[2] || 0;
                      const totalSBD = latestE1RMs.reduce((a, b) => a + b, 0);
 
                      const p = calculateExrxPercentile(totalSBD, profile?.weight || 0, profile?.gender || 'male', profile?.age);
 
                      // Calculate E1RM history data points
                      const sortedSessions = [...history]
                        .filter(s => {
                          if (!s) return false;
                          const dateVal = s.completedAt || s.date;
                          if (!dateVal) return false;
                          return !isNaN(new Date(dateVal).getTime());
                        })
                        .sort((a, b) => {
                          const timeA = a.completedAt || (a.date ? new Date(a.date).getTime() : 0);
                          const timeB = b.completedAt || (b.date ? new Date(b.date).getTime() : 0);
                          return timeA - timeB;
                        });
 
                      const filteredSessionsByRange = filterDataByRange(sortedSessions, timeFrame);
 
                      const getLiftE1RM = (session: typeof history[0], liftName: string) => {
                        const ex = session.exercises?.find(e => {
                          if (['Squat', 'Bench Press', 'Deadlift'].includes(liftName)) {
                            return isMainLiftMatch(e.name, liftName);
                          }
                          return isExerciseMatch(e.name, liftName);
                        });
                        if (!ex) return null;
                        const e1rms = (ex.sets || []).map(set => calculateE1RM(parseFloat(set.weight) || 0, parseInt(set.reps) || 0, parseFloat(set.rpe || set.actualRpe || ''), ex.name));
                        const valid = e1rms.filter(v => v > 0);
                        return valid.length > 0 ? Math.round(Math.max(...valid)) : null;
                      };
 
                      const chartPoints = filteredSessionsByRange.map(session => {
                        const dateVal = session.completedAt || session.date || Date.now();
                        const parsedDate = new Date(dateVal);
                        const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
                        const displayDate = safeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const fullDate = safeDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                        
                        const point: any = {
                          date: displayDate,
                          fullDate,
                          title: session.title || '',
                          'Squat': getLiftE1RM(session, 'Squat'),
                          'Bench Press': getLiftE1RM(session, 'Bench Press'),
                          'Deadlift': getLiftE1RM(session, 'Deadlift'),
                        };

                        customLifts.forEach(lift => {
                          point[lift] = getLiftE1RM(session, lift);
                        });
 
                        return point;
                      }).filter(pt => {
                        const hasStandard = pt.Squat !== null || pt['Bench Press'] !== null || pt.Deadlift !== null;
                        const hasCustom = customLifts.some(lift => pt[lift] !== null);
                        return hasStandard || hasCustom;
                      });
 
                      interface E1RMTooltipPayloadEntry {
                        name: string;
                        value: number;
                        color: string;
                        payload: {
                          fullDate: string;
                          title: string;
                        };
                      }
 
                      interface E1RMTooltipProps {
                        active?: boolean;
                        payload?: E1RMTooltipPayloadEntry[];
                      }
 
                      const E1RMTooltip = ({ active, payload }: E1RMTooltipProps) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-void/95 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[200px] relative overflow-hidden font-mono select-none">
                              <div className="absolute top-0 left-0 w-1 h-full bg-volt" />
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">E1RM TELEMETRY</p>
                                  <p className="text-xs font-black uppercase text-white">{data.fullDate}</p>
                                  <p className="text-[10px] font-black uppercase tracking-tight text-volt mt-1">{data.title}</p>
                                </div>
                                <div className="space-y-2 pt-3 border-t border-white/5">
                                  {payload.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{entry.name}</span>
                                      </div>
                                      <span className="text-sm font-black text-white">
                                        {entry.value} <span className="text-[8px] uppercase text-zinc-500">{weightUnit}</span>
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
 
                      return (<div className="flex flex-col gap-8 w-full">
                          {/* Header section with title and time range toggle */}
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4 w-full">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 mb-4">
                                <BicepsFlexed className="text-volt" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-volt">STRENGTH PROTOCOL</span>
                              </div>
                              <h3 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white">
                                {t('Estimated 1rm')}
                              </h3>
                              <div className="text-zinc-400 text-xs font-medium leading-relaxed mt-1">
                                {t('analysis.youAreTop')} <span className="text-volt font-black">{p < 1 ? '<1' : p.toFixed(1)}%</span> {t('analysis.ofPopulation')} <InfoTooltip term="Percentile" className="inline-block z-10 relative" />
                              </div>
                            </div>

                            {/* Time range toggle inside Estimated 1RM header */}
                            <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap sm:flex-nowrap shrink-0 md:mt-8">
                              {(['1M', '3M', '6M', 'ALL'] as TimeFrame[]).map((tf) => (
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

                          {/* Current E1RMs in elegant stats blocks - 4 column, 2+ row grid layout */}
                          <div className="grid grid-cols-4 gap-y-6 gap-x-4 bg-void/50 border border-white/10 p-4 font-mono w-full">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">SQUAT</span>
                              <span className="text-sm font-black text-white">{sqMax > 0 ? `${sqMax} ${weightUnit}` : '–'}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-4">
                              <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">BENCH</span>
                              <span className="text-sm font-black text-white">{bpMax > 0 ? `${bpMax} ${weightUnit}` : '–'}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-4">
                              <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">DEADLIFT</span>
                              <span className="text-sm font-black text-white">{dlMax > 0 ? `${dlMax} ${weightUnit}` : '–'}</span>
                            </div>
                            <div className="flex flex-col border-l border-volt/35 pl-4">
                              <span className="text-[9px] font-black tracking-widest text-volt uppercase">SBD TOTAL</span>
                              <span className="text-sm font-black text-volt font-mono">{totalSBD > 0 ? `${totalSBD} ${weightUnit}` : '–'}</span>
                            </div>
                            {customLifts.map((lift, idx) => {
                              const liftHistory = history.filter(s => s.exercises?.some(e => e.name && isExerciseMatch(e.name, lift)) || false);
                              const maxVal = Math.round(getDecayedE1RMFromHistory(liftHistory, lift));
                              const color = customColors[idx % customColors.length];
                              const isFirstCol = idx % 4 === 0;
                              return (
                                <div key={lift} className={`flex flex-col ${isFirstCol ? '' : 'border-l border-white/10 pl-4'}`}>
                                  <span style={{ color }} className="text-[9px] font-black tracking-widest uppercase">{lift}</span>
                                  <span className="text-sm font-black text-white">{maxVal > 0 ? `${maxVal} ${weightUnit}` : '–'}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Right: Search bar */}
                          <div className="relative font-mono flex flex-col justify-center w-full">
                            <div className="w-full">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">SEARCH EXERCISE TO PLOT ESTIMATED 1RM TREND:</label>
                              <div className="flex gap-2">
                                <div className="relative flex-grow">
                                  <input
                                    type="text"
                                    value={exerciseSearchQuery}
                                    onChange={(e) => setExerciseSearchQuery(e.target.value)}
                                    placeholder="Type exercise name (e.g., Overhead Press)..."
                                    className="w-full bg-void/55 border border-white/10 text-white px-3 py-2 text-xs focus:outline-none focus:border-volt/60 font-mono tracking-wider placeholder-zinc-700"
                                  />
                                  {exerciseSearchQuery && (
                                    <button 
                                      onClick={() => setExerciseSearchQuery('')}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                                    >
                                      ✕
                                    </button>
                                  )}

                                  {/* Suggestions Dropdown */}
                                  {exerciseSearchQuery && (() => {
                                    const query = exerciseSearchQuery.toLowerCase();
                                    const coreLifts = ['squat', 'bench press', 'deadlift', 'barbell squat', 'barbell bench press', 'barbell deadlift'];
                                    const suggestions = allExercisesInHistory.filter(name => {
                                      const nameLower = name.toLowerCase();
                                      return nameLower.includes(query) && 
                                             !coreLifts.includes(nameLower) && 
                                             !customLifts.some(cl => isExerciseMatch(cl, name));
                                    }).slice(0, 5);

                                    return (
                                      <div className="absolute left-0 right-0 top-full mt-1 bg-void border border-white/10 z-50 divide-y divide-white/5 shadow-2xl">
                                        {suggestions.map((name, index) => (
                                          <button
                                            key={name}
                                            onClick={() => {
                                              setCustomLifts(prev => [...prev, name]);
                                              setExerciseSearchQuery('');
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                  setCustomLifts(prev => [...prev, name]);
                                                  setExerciseSearchQuery('');
                                              }
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs transition-colors font-mono uppercase flex justify-between items-center ${index === selectedIndex ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-volt hover:bg-white/5'}`}
                                          >
                                            <span>{name}</span>
                                            <span className="text-[9px] text-volt font-black">+ ADD LIFT</span>
                                          </button>
                                        ))}
                                        {!customLifts.some(cl => isExerciseMatch(cl, exerciseSearchQuery)) && query && (
                                          <button
                                            onClick={() => {
                                              const cleanedQuery = exerciseSearchQuery.trim().replace(/\[?(HEAVY PRIMARY|HYPERTROPHY|ACTIVE RECOVERY|MOVEMENT QUALITY|BLOOD FLOW)\]?/gi, '').replace(/\s+/g, ' ').trim();
                                              setCustomLifts(prev => [...prev, cleanedQuery]);
                                              setExerciseSearchQuery('');
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                  const cleanedQuery = exerciseSearchQuery.trim().replace(/\[?(HEAVY PRIMARY|HYPERTROPHY|ACTIVE RECOVERY|MOVEMENT QUALITY|BLOOD FLOW)\]?/gi, '').replace(/\s+/g, ' ').trim();
                                               setCustomLifts(prev => [...prev, cleanedQuery]);
                                                  setExerciseSearchQuery('');
                                              }
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs transition-colors font-mono uppercase flex justify-between items-center ${suggestions.length === selectedIndex ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-volt hover:bg-white/5'}`}
                                          >
                                            <span>ADD "{exerciseSearchQuery}"</span>
                                            <span className="text-[9px] text-volt font-black">+ FORCE ADD</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Active Custom Lifts Badges */}
                          {customLifts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {customLifts.map((lift, idx) => {
                                const color = customColors[idx % customColors.length];
                                return (
                                  <div 
                                    key={lift} 
                                    style={{ borderColor: `${color}33`, backgroundColor: `${color}0D` }}
                                    className="flex items-center gap-2 px-2 py-1 border text-[10px] font-black uppercase tracking-widest font-mono select-none"
                                  >
                                    <span style={{ color }}>●</span>
                                    <span className="text-[#fff]">{lift}</span>
                                    <button 
                                      onClick={() => setCustomLifts(prev => prev.filter(l => l !== lift))}
                                      className="text-zinc-500 hover:text-crimson transition-colors ml-1 font-sans text-xs font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
 
                          <div className="h-[280px] w-full mt-4 min-w-0">
                            {chartPoints.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                  <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                                    dy={10}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                                  />
                                  <Tooltip content={<E1RMTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                  
                                  <Line
                                    type="linear"
                                    dataKey="Squat"
                                    name="Squat"
                                    stroke="var(--primary-color)"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, stroke: 'var(--primary-color)', strokeWidth: 2, fill: '#131313' }}
                                    animationDuration={1500}
                                    connectNulls
                                  />
                                  <Line
                                    type="linear"
                                    dataKey="Bench Press"
                                    name="Bench"
                                    stroke="#FF7162"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, stroke: '#FF7162', strokeWidth: 2, fill: '#131313' }}
                                    animationDuration={1500}
                                    connectNulls
                                  />
                                  <Line
                                    type="linear"
                                    dataKey="Deadlift"
                                    name="Deadlift"
                                    stroke="#F59E0B"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: '#131313' }}
                                    animationDuration={1500}
                                    connectNulls
                                  />
                                  {customLifts.map((lift, idx) => {
                                    const color = customColors[idx % customColors.length];
                                    return (
                                      <Line
                                        key={lift}
                                        type="linear"
                                        dataKey={lift}
                                        name={lift}
                                        stroke={color}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#131313' }}
                                        animationDuration={1500}
                                        connectNulls
                                      />
                                    );
                                  })}
                                </LineChart>
                              </ResponsiveContainer>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                  <div className="mt-6 flex justify-between items-center px-1 opacity-60">
                    <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                      SYS_STATUS: STATISTICAL_ESTIMATE
                    </span>
                    <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                      REF_ID: EST_1RM
                    </span>
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
                  className="glass-panel px-4 py-6 md:p-8 flex flex-col relative overflow-hidden min-w-0 group/module vanguard-tour-tactical-integration lg:col-span-2"
                >
                  {/* Decorative corner elements for tactical feel */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700"
                    style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <div className="relative z-10 flex flex-col">
                    <TacticalIntegration 
                      activeRange={timeFrame} 
                      onRangeChange={(tf) => setTimeFrame(tf)} 
                    />
                  </div>

                  <div className="mt-6 flex justify-between items-center px-1 opacity-60 relative z-10">
                    <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                      SYS_STATUS: INTEGRATED
                    </span>
                    <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                      REF_ID: TAC_INT_MATRIX
                    </span>
                  </div>
                </motion.div>
              );

            case 'conditioning-tracker':
              return (
                <motion.div
                  key="conditioning-tracker"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="min-w-0 h-[300px] lg:col-span-2"
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
                  className="min-w-0 h-[300px] lg:col-span-2"
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

