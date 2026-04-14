import React from 'react';
import { motion } from 'motion/react';
import { 
  Dumbbell, 
  Play, 
  Activity,
  Trophy,
  Video,
  Clock,
  Flame,
  Zap,
  TrendingUp,
  BarChart3,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout, WorkoutSession } from '../contexts/WorkoutContext';
import { BlockType, getPlanForDuration } from '../constants/periodization';
import { calculateTier } from '../lib/strength';

interface TrainingViewProps {
  onContinueSession?: () => void;
  isLifting?: boolean;
}

export const TrainingView = ({ onContinueSession, isLifting }: TrainingViewProps) => {
  const { t, unit, profile } = useSettings();
  const { currentSession, getNextWorkoutTemplate, history, getCalibrationStatus } = useWorkout();
  const calibration = getCalibrationStatus();
  
  const nextWorkout = getNextWorkoutTemplate();
  const activeOrNext = currentSession || nextWorkout;
  
  const isActiveSession = isLifting && !!currentSession;
  const [elapsedTime, setElapsedTime] = React.useState('00:00:00');

  const currentTier = profile ? calculateTier(
    profile.squatPR || 0,
    profile.benchPR || 0,
    profile.deadliftPR || 0,
    profile.weight || 0,
    profile.gender || 'male'
  ) : 'untrained';

  const isElite = currentTier === 'elite';
  const isAdvanced = currentTier === 'advanced';

  React.useEffect(() => {
    if (!isActiveSession || !currentSession?.startTime) return;

    const interval = setInterval(() => {
      const start = currentSession.startTime!;
      const diff = Date.now() - start;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isActiveSession, currentSession?.startTime]);

  // Calculate volume for the workout to show in the module
  const calculateVolume = (workout: any) => {
    if (!workout || !workout.exercises) return '0';
    let total = 0;
    workout.exercises.forEach((ex: any) => {
      if (!ex.sets) return;
      ex.sets.forEach((s: any) => {
        total += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
      });
    });
    return total.toLocaleString();
  };

  const displayTitle = activeOrNext.title;
  const getFocusText = (workout: any) => {
    if (workout.title.includes('Foundation')) return "Focusing on structural integrity and movement patterns.";
    if (workout.title.includes('Power')) return "Focusing on maximal force production and explosive concentric phases.";
    if (workout.title.includes('Hypertrophy')) return "Focusing on metabolic stress and muscle fiber recruitment.";
    return t('analysis.focusingOn');
  };
  const focusText = getFocusText(activeOrNext);
  const firstExercise = activeOrNext?.exercises?.[0];
  const firstExerciseName = firstExercise?.name || t('analysis.barbellSquat');
  const firstExerciseSets = firstExercise?.sets?.length || 5;
  const firstExerciseTarget = firstExercise?.sets?.[0]?.weight || '0';
  const firstExerciseReps = firstExercise?.sets?.[0]?.reps || '0';
  const hasHistory = (history?.length || 0) > 0;
  
  // Use current session readiness if available, otherwise use dynamic calibration readiness
  const readinessScoreValue = currentSession?.readiness || calibration.readiness;
  const readinessScore = hasHistory || currentSession?.readiness ? readinessScoreValue : '–';
  const readinessY = 40 - (readinessScoreValue / 100) * 35;
  const totalLoad = calculateVolume(activeOrNext);
  const weightUnit = unit === 'metric' ? 'Kg' : 'lbs';
  
  // Calculate dynamic PRs
  const getPR = (exerciseName: string) => {
    let maxWeight = 0;
    let prDate = '–';
    
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        if (ex.name.toLowerCase().includes(exerciseName.toLowerCase())) {
          ex.sets?.forEach(set => {
            const w = parseFloat(set.weight) || 0;
            if (w > maxWeight) {
              maxWeight = w;
              prDate = session.date;
            }
          });
        }
      });
    });
    
    return { weight: maxWeight > 0 ? maxWeight.toString() : '–', date: prDate };
  };

  const squatPR = getPR(t('stage.squat'));
  const benchPR = getPR(t('stage.benchPress'));
  const deadliftPR = getPR(t('stage.deadlift'));

  // Estimate duration: 15 mins per exercise + 15 mins warmup/cool
  const estDuration = ((activeOrNext?.exercises?.length || 0) * 15) + 15;

  const calculateProgress = (session: WorkoutSession | null) => {
    if (!session || !session.exercises) return 0;
    let totalSets = 0;
    let completedSets = 0;
    session.exercises.forEach(ex => {
      ex.sets?.forEach(s => {
        totalSets++;
        if (s.isCompleted) completedSets++;
      });
    });
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };
  const sessionProgress = calculateProgress(currentSession);

  // Block Progression Data
  const currentBlock = nextWorkout.blockType || BlockType.HYPERTROPHY;
  const weekInBlock = nextWorkout.weekInBlock || 1;
  const totalWeek = nextWorkout.totalWeek || 1;
  const plan = getPlanForDuration((profile?.trainingDurationMonths || 3) * 4);
  const cycleLength = plan.reduce((acc, b) => acc + b.durationWeeks, 0);
  const currentCycleWeek = ((totalWeek - 1) % cycleLength) + 1;

  const graphData = React.useMemo(() => {
    const data = [];
    let weekAcc = 0;
    for (const block of plan) {
      for (let w = 1; w <= block.durationWeeks; w++) {
        weekAcc++;
        const intensity = block.baseIntensity + (w - 1) * block.intensityIncrementPerWeek;
        data.push({
          week: weekAcc,
          intensity: Math.round(intensity * 100),
          block: block.type,
          isCurrent: weekAcc === currentCycleWeek
        });
      }
    }
    return data;
  }, [currentCycleWeek, plan]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 border-volt/30 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-volt mb-1">{data.block}</p>
          <p className="text-xs font-bold text-white">Week {data.week}</p>
          <p className="text-xs font-bold text-zinc-400">Intensity: {data.intensity}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row items-center">
      <div className="w-full overflow-x-auto lg:overflow-x-auto overflow-y-auto lg:overflow-y-hidden custom-scrollbar pb-12 pt-8 lg:pt-24 px-2 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-w-full lg:min-w-max h-auto lg:h-[75vh] items-stretch">
          
          {/* Active/Next Session Module */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "w-full lg:w-[700px] xl:w-[850px] shrink-0 glass-panel p-8 relative overflow-hidden flex flex-col transition-all duration-500",
              isElite && "border-volt/50",
              isAdvanced && "border-yellow-500/30"
            )}
          >
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 relative z-10 gap-4 md:gap-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-4">
                  {isActiveSession ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-tactical-pulse relative inline-flex h-3 w-3 bg-volt"></span>
                      </span>
                      <span className="text-volt font-headline text-[10px] font-black uppercase tracking-widest">{t('analysis.activeSession')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 animate-tactical-pulse",
                        calibration.readiness >= 90 ? "bg-emerald-500" : calibration.readiness >= 70 ? "bg-volt" : "bg-crimson"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        calibration.readiness >= 90 ? "text-emerald-500" : "text-zinc-500"
                      )}>
                        {calibration.readiness >= 90 ? t('analysis.primeCondition') : t('analysis.readiness')}: {hasHistory ? `${calibration.readiness}%` : '–'}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="font-headline text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-2">{displayTitle}</h2>
                <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
                  {focusText}
                </p>
              </div>
              <div className="md:text-right">
                <div className="flex items-center gap-2 text-zinc-400 mb-1 md:justify-end">
                  <Clock size={14} />
                  <span className="font-mono text-sm font-bold">{isActiveSession ? elapsedTime : `${estDuration} Min`}</span>
                </div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 md:mt-2">
                  {isActiveSession ? t('analysis.duration') : t('analysis.estDuration')}
                </span>
              </div>
            </div>

            {/* Progress Bar (Only show if active) */}
            {isActiveSession ? (
              <div className="mb-6 md:mb-10">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.sessionProgress')}</span>
                  <span className="text-xl md:text-2xl font-black italic">{sessionProgress}%</span>
                </div>
                <div className="w-full h-2 bg-void overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${sessionProgress}%` }}
                    className="h-full bg-volt shadow-[0_0_10px_var(--primary-glow)]"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6 md:mb-10 flex flex-wrap gap-8 md:gap-12">
                <div className="space-y-1">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.mainLift')}</span>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-black italic text-volt">
                        {hasHistory ? `${firstExerciseSets}x${firstExerciseReps} @ ${firstExerciseTarget}${weightUnit}` : '–'}
                      </span>
                    </div>
                    {(calibration.readinessModifier !== 1 || calibration.recoveryModifier !== 1) && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-volt/60 mt-0.5">
                        calibrated to {(calibration.readinessModifier * calibration.recoveryModifier * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.totalLoad')}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black italic">{hasHistory ? totalLoad : '–'}</span>
                    <span className="text-xs font-black uppercase text-zinc-400">{weightUnit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Movement */}
            <div className={cn(
              "bg-void/40 p-4 md:p-6 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 mt-auto mb-6 transition-all duration-500",
              isElite && "border-volt/20"
            )}>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-12 w-12 md:h-16 md:w-16 shrink-0 bg-white/5 flex items-center justify-center border border-white/10">
                  <Dumbbell className={isActiveSession ? "text-volt" : "text-zinc-500"} size={24} md:size={28} />
                </div>
                <div>
                  <span className={cn(
                    "block text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1",
                    isActiveSession ? "text-volt" : "text-zinc-500"
                  )}>
                    {isActiveSession ? t('analysis.currentExercise') : t('analysis.firstExercise')}
                  </span>
                  <h3 className="font-headline text-xl md:text-2xl font-black uppercase italic tracking-tight">{firstExerciseName}</h3>
                  <span className="text-zinc-400 text-[10px] md:text-xs font-medium">
                    {isActiveSession ? t('analysis.set4of5') : `${firstExerciseSets} ${t('analysis.5sets').split(' ')[1]}`}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t('analysis.target')}</span>
                <div className="flex items-baseline gap-1 sm:justify-end">
                  <span className="text-3xl md:text-4xl font-black italic tracking-tighter">{firstExerciseTarget}</span>
                  <span className="text-[10px] md:text-xs font-black uppercase text-zinc-400">{weightUnit}</span>
                  <span className="text-lg md:text-xl font-black italic tracking-tighter ml-2 text-zinc-600">x {firstExerciseReps}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={onContinueSession}
              className="w-full px-8 py-4 bg-volt text-void font-headline text-xs md:text-sm font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 group"
            >
              <Play size={16} md:size={18} className="fill-void group-hover:scale-110 transition-transform" />
              {isActiveSession ? t('analysis.continueSession') : t('analysis.startSession')}
            </button>

            <div className="mt-4 flex justify-between items-center px-1 opacity-30">
              <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">SYS_STATUS: ACTIVE</span>
              <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">REF_ID: {activeOrNext.id}</span>
            </div>
          </motion.div>

              {/* Readiness Module */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
                className="w-full lg:w-[350px] xl:w-[450px] shrink-0 glass-panel p-8 flex flex-col relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
                  <Activity className="text-volt" size={24} />
                  <h3 className="font-headline text-xl md:text-2xl font-black uppercase italic tracking-tight">{t('analysis.readiness')}</h3>
                </div>

                <div className="flex items-end gap-4 mb-2 relative z-10">
                  <span className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">{readinessScore}</span>
                  <span className="text-xl md:text-2xl font-black italic text-zinc-500 mb-1">%</span>
                </div>
                <span className="text-volt font-headline text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 md:mb-8 relative z-10">
                  {hasHistory ? t('analysis.optimalState') : t('analysis.awaitingData')}
                </span>

                {/* Readiness Graph */}
                <div className="mt-auto pt-4 md:pt-8 relative z-10 w-full">
                  {hasHistory ? (
                    <div className="h-24 md:h-32 w-full relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="readiness-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d={`M0,35 L15,28 L30,32 L45,15 L60,20 L75,8 L100,${readinessY} L100,40 L0,40 Z`} 
                          fill="url(#readiness-grad)" 
                        />
                        <polyline 
                          points={`0,35 15,28 30,32 45,15 60,20 75,8 100,${readinessY}`} 
                          fill="none" 
                          stroke="var(--primary-color)" 
                          strokeWidth="2"
                          className="drop-shadow-[0_0_8px_var(--primary-glow)]"
                          vectorEffect="non-scaling-stroke"
                        />
                        {/* Current point marker */}
                        <circle cx="100" cy={readinessY} r="3" fill="var(--primary-color)" className="drop-shadow-[0_0_8px_var(--primary-glow)]" />
                      </svg>
                    </div>
                  ) : (
                    <div className="h-24 md:h-32 w-full flex items-center justify-center border-none bg-void/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">
                        {t('analysis.completeFirstWorkout')}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between mt-4 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>{t('analysis.7daysAgo')}</span>
                    <span>{t('analysis.today')}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center px-1 opacity-20">
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">READINESS_INDEX: {readinessScore}{readinessScore !== '–' ? '%' : ''}</span>
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">CALIBRATION: {calibration.readinessModifier.toFixed(2)}</span>
                </div>
              </motion.div>

              {/* Block Progression Module */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.25 }}
                className="w-full lg:w-[700px] xl:w-[850px] shrink-0 glass-panel p-8 flex flex-col relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-volt" size={24} />
                    <h3 className="font-headline text-xl md:text-2xl font-black uppercase italic tracking-tight">Block Progression</h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-volt/10 border border-volt/20">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-volt">Week {totalWeek}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-6 md:gap-8 flex-1">
                  {/* Detailed Block Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Training Cycle</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                        {plan.map((block, idx) => {
                          const isCurrent = currentBlock === block.type;
                          if (!isCurrent) return null;
                          
                          let accumulated = 0;
                          for(let i=0; i<idx; i++) accumulated += plan[i].durationWeeks;
                          const startWeek = accumulated + 1;
                          const endWeek = accumulated + block.durationWeeks;
                          
                          return (
                            <div 
                              key={block.type}
                              className={cn(
                                "p-3 border-none transition-all duration-300",
                                isCurrent 
                                  ? "bg-white/10" 
                                  : "bg-white/5 opacity-40"
                              )}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  isCurrent ? "text-volt" : "text-zinc-400"
                                )}>
                                  Block {idx + 1}: {block.type}
                                </span>
                                {isCurrent && <Zap size={10} className="text-volt" />}
                              </div>
                              <div className="flex justify-between items-end">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                  Weeks {startWeek}-{endWeek}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-black italic text-white">
                                    {weekInBlock} / {block.durationWeeks}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-void/40 border-none mt-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={12} className="text-zinc-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Current Focus</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-widest">
                        {currentBlock === BlockType.HYPERTROPHY && "Building muscle mass and work capacity."}
                        {currentBlock === BlockType.STRENGTH && "Developing maximal strength and neural drive."}
                        {currentBlock === BlockType.PEAKING && "Realizing strength and preparing for 1RM."}
                        {currentBlock === BlockType.DELOAD && "Dissipating fatigue and recovery."}
                      </p>
                    </div>
                  </div>

                  {/* Intensity Graph */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Intensity Curve</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-volt">{cycleLength}-Week Cycle</span>
                    </div>
                    
                    <div className="flex-1 min-h-[180px] md:min-h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="intensity-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="week" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }}
                            interval={0}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }}
                            domain={[40, 100]}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area 
                            type="monotone" 
                            dataKey="intensity" 
                            stroke="var(--primary-color)" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#intensity-grad)" 
                            animationDuration={1500}
                          />
                          <ReferenceLine x={currentCycleWeek} stroke="var(--primary-color)" strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: 'var(--primary-color)', fontSize: 8, fontWeight: 900 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex justify-between items-center px-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-volt" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Intensity %</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 italic">
                        *Based on 1RM Percentage
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center px-1 opacity-20">
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">BLOCK_TYPE: {currentBlock}</span>
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">CYCLE_WEEK: {currentCycleWeek}/{cycleLength}</span>
                </div>
              </motion.div>

              {/* My PRs Module */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 }}
                className="w-full lg:w-[700px] xl:w-[850px] shrink-0 glass-panel p-8 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6 md:mb-10">
                  <Trophy className="text-volt" size={24} />
                  <h3 className="font-headline text-xl md:text-2xl font-black uppercase italic tracking-tight">{t('analysis.myPRs')}</h3>
                </div>
                
                {hasHistory ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-1">
                    {[
                      { lift: t('stage.squat'), weight: squatPR.weight, date: squatPR.date, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000' },
                      { lift: t('stage.benchPress'), weight: benchPR.weight, date: benchPR.date, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000' },
                      { lift: t('stage.deadlift'), weight: deadliftPR.weight, date: deadliftPR.date, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000' }
                    ].map((pr, i) => (
                      <div key={i} className="bg-void/40 p-6 md:p-8 border-none relative group overflow-hidden transition-all hover:bg-white/5 flex flex-col h-full">
                        {/* Background Image */}
                        <img 
                          src={pr.image} 
                          alt={`${pr.lift} PR`} 
                          className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent" />
                        
                        {/* Background accent removed for consistency */}
                        
                        <span className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 md:mb-6 relative z-10">{pr.lift}</span>
                        
                        <div className="flex items-baseline gap-2 mb-6 md:mb-8 relative z-10">
                          <span className="text-4xl md:text-6xl font-black italic tracking-tighter text-white">{pr.weight}</span>
                          <span className="text-[10px] md:text-sm font-black uppercase text-volt">{weightUnit}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto relative z-10">
                          <span className="text-[10px] md:text-xs font-medium text-zinc-400">{pr.date}</span>
                          
                          <button className="flex items-center gap-2 bg-white/10 hover:bg-volt hover:text-void transition-colors px-6 py-3 border-none group/btn backdrop-blur-sm">
                            <Video size={12} md:size={14} className="text-volt group-hover/btn:text-void transition-colors" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t('analysis.replay')}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border-none bg-void/20 p-8 md:p-12 text-center">
                    <span className="text-4xl md:text-6xl font-black text-zinc-800 mb-4">–</span>
                    <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight mb-2 text-zinc-500">{t('analysis.noRecordsYet')}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed">
                      {t('analysis.startLiftingToTrack')}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center px-1 opacity-20">
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">PR_DATABASE: SYNCED</span>
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">RECORDS: {hasHistory ? '3' : '0'}</span>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      );
    };
