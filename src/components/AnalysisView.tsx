import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InfoTooltip } from './InfoTooltip';
import { 
  Play, 
  TrendingUp, 
  Utensils, 
  ChevronRight, 
  Star, 
  Plus,
  GripVertical,
  X,
  LayoutDashboard,
  Calendar,
  Clock,
  Weight,
  Activity,
  Zap,
  History,
  Dumbbell,
  Info,
  BarChart3,
  Edit2,
  Trash2
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
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';

import { ConfirmationModal } from './ConfirmationModal';
import { NonProgramActivityModal } from './NonProgramActivityModal';
import { TacticalChart } from './TacticalChart';
import { getTacticalImpact } from '../utils/analyticsEngine';

import { useWorkout, WorkoutSession, ActiveRecovery } from '../contexts/WorkoutContext';
import { auth } from '../firebase';
import { BlockType, getPlanForDuration } from '../constants/periodization';

const WelcomeModule = ({ onStart, onViewBriefing }: { onStart: () => void, onViewBriefing: () => void }) => {
  const { profile } = useSettings();
  const { history, getCalibrationStatus, getNextWorkoutTemplate, calculateProgramCalories, currentSession } = useWorkout();
  
  const greeting = useMemo(() => {
    const greetings = ["Mission Start", "Welcome", "Systems Nominal", "Good Day"];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);
  
  const calibration = getCalibrationStatus();
  const readinessScore = history.length > 0 ? calibration.readiness : 100;
  const nextWorkout = getNextWorkoutTemplate();
  
  const predictedCalories = React.useMemo(() => {
    if (!nextWorkout || !profile) return 0;
    const totalTonnage = nextWorkout.exercises.reduce((acc, ex) => {
      return acc + (ex.sets?.reduce((sAcc, s) => sAcc + (parseFloat(ex.weight?.toString() || '0') || 0) * (parseInt(s.reps?.toString() || '0') || 0), 0) || 0);
    }, 0);
    const weightKg = profile.unit === 'imperial' ? (profile.weight || 75) * 0.453592 : (profile.weight || 75);
    // Rough estimate: sets * 3 mins, minimum 30 mins
    const estimatedDuration = Math.max(30, nextWorkout.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0) * 3, 0));
    // Assume average RPE for a template base is 7
    return calculateProgramCalories(weightKg, estimatedDuration, 7, totalTonnage);
  }, [nextWorkout, profile]);

  const tacticalName = useMemo(() => {
    if (profile?.gender === 'male') return 'Dominus';
    if (profile?.gender === 'female') return 'Domina';
    return profile?.displayName || 'Operator';
  }, [profile?.gender, profile?.displayName]);

  return (
    <div className="pt-6 pb-6 px-4 md:px-6 bg-black border-b border-zinc-900 mb-6">
      <div className="flex flex-col gap-6">
        <span className="font-mono text-[9px] tracking-[widest] text-zinc-500 uppercase mb-2">
          // STATUS REPORT
        </span>
        <h1 className="text-3xl font-black italic uppercase leading-none">
          {greeting}, <span className="text-volt">{tacticalName}</span>
        </h1>
        <p className="font-mono text-xs text-zinc-400 leading-relaxed border-l border-zinc-700 pl-4 max-w-2xl">
          Your readiness is sitting at <span className="text-white">{readinessScore}%</span> today. 
          When you're ready, we've got <span className="text-white">{nextWorkout?.title || 'an active recovery session'}</span> on the agenda. It should take about <span className="text-white">{nextWorkout?.duration || 'around 45 minutes'}</span> and burn roughly <span className="text-white">{predictedCalories} kcal</span>.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button 
            onClick={onStart}
            className="flex-[2] w-full min-h-[44px] px-4 sm:px-8 py-4 bg-volt text-void font-headline text-xs md:text-sm font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 group"
          >
            <Play size={16} className="fill-void group-hover:scale-110 transition-transform" />
            {currentSession ? 'Continue Mission' : 'Start Mission'}
          </button>
          
          <button 
            onClick={onViewBriefing}
            className="flex-[2] btn-secondary w-full min-h-[44px] px-4 sm:px-8 py-4"
          >
            Mission Briefing
            <ChevronRight size={16} className="ml-2" />
          </button>
        </div>
        
      </div>
    </div>
  );
};

type WidgetId = 'recovery-analysis' | 'pr' | 'macros' | 'block';

interface Widget {
  id: WidgetId;
  label: string;
  icon: any;
  span: string;
}

const ALL_WIDGETS: Widget[] = [
  { id: 'recovery-analysis', label: 'Recovery Analysis', icon: Activity, span: 'col-span-1 md:col-span-2 xl:col-span-3' },
  { id: 'pr', label: 'analysis.personalRecord', icon: Star, span: 'col-span-1 md:col-span-2 xl:col-span-1' },
  { id: 'macros', label: 'analysis.macroDistribution', icon: Utensils, span: 'col-span-1 md:col-span-2 xl:col-span-2' },
  { id: 'block', label: 'Block Progression', icon: Zap, span: 'col-span-1 md:col-span-2 xl:col-span-3' },
];


export const RecoveryAnalysisWidget = () => {
  const { t, unit } = useSettings();
  const { history, getCalibrationStatus } = useWorkout();
  
  const hasHistory = history && history.length > 0;
  const calibration = getCalibrationStatus();
  
  // Readiness Data
  const readinessScore = hasHistory ? calibration.readiness : '–';
  
  // Recovery Data
  const recoveryScoreValue = hasHistory ? calibration.readiness : 0;
  const recoveryScore = hasHistory ? recoveryScoreValue : '–';
  const getStatusColorText = (val: number) => {
    if (!hasHistory) return "text-zinc-500";
    if (val >= 85) return "text-emerald-500";
    if (val >= 60) return "text-amber-500";
    return "text-crimson";
  };
  const getStatusColorBg = (val: number) => {
    if (!hasHistory) return "bg-zinc-800";
    if (val >= 85) return "bg-emerald-500";
    if (val >= 60) return "bg-amber-500";
    return "bg-crimson";
  };
  const statusColor = getStatusColorText(recoveryScoreValue);
  const statusBg = getStatusColorBg(recoveryScoreValue);
  const statusBorderClass = hasHistory 
    ? (recoveryScoreValue >= 85 ? "border-emerald-500/30" : recoveryScoreValue >= 60 ? "border-amber-500/30" : "border-crimson/30") 
    : "border-zinc-800";
  
  // Volume Data
  const volumeData = React.useMemo(() => {
    if (!hasHistory) return [];

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekData = days.map(day => ({ day, val: 0, active: false }));
    const today = now.toDateString();

    history.forEach(session => {
      // Ensure we parse the date correctly whether it's a timestamp or a locale string
      const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
      
      if (sessionDate >= startOfWeek) {
        const dayIndex = sessionDate.getDay();
        let sessionVolume = 0;
        
        if (session.exercises) {
          session.exercises.forEach(ex => {
            ex.sets?.forEach(s => {
              if (s.isCompleted) {
                sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
              }
            });
          });
        }
        
        weekData[dayIndex].val += sessionVolume;
        
        if (sessionDate.toDateString() === today) {
          weekData[dayIndex].active = true;
        }
      }
    });

    const maxVolume = Math.max(...weekData.map(d => d.val), 1);
    return weekData.map(d => ({
      ...d,
      val: (d.val / maxVolume) * 100,
      displayVal: d.val
    }));
  }, [history, hasHistory]);

  const orderedVolumeData = React.useMemo(() => {
    if (volumeData.length === 0) return [];
    return [...volumeData.slice(1), volumeData[0]];
  }, [volumeData]);

  const totalWeeklyVolume = React.useMemo(() => {
    return orderedVolumeData.reduce((acc, curr) => acc + curr.displayVal, 0);
  }, [orderedVolumeData]);

  // Shared Box Container for Graphs
  const GraphContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full relative h-28 md:h-32 bg-surface-container-lowest border border-white/5 flex items-end justify-between p-3 mt-auto">
       {!hasHistory && (
         <div className="absolute inset-0 flex items-center justify-center p-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Awaiting Data</span>
         </div>
       )}
       {children}
    </div>
  );

  return (
    <div className="w-full h-full glass-panel px-4 py-6 md:p-8 flex flex-col relative overflow-hidden group/module min-h-[400px]">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700" 
           style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <div className="flex items-center justify-start mb-6 md:mb-10 relative z-10 w-full">
        <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight text-left">Recovery Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 relative z-10 w-full flex-1">
        
        {/* Readiness Section */}
        <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r border-white/5 pb-8 lg:pb-0 lg:pr-8 text-left justify-start items-start">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
            {t('analysis.readiness')}
            <InfoTooltip term="Readiness" />
          </span>
          <div className="flex items-end gap-3 mb-2 justify-start w-full">
            <span className="text-6xl md:text-7xl font-black italic tracking-tighter leading-none text-white">
              {readinessScore}
            </span>
            <span className="text-xl md:text-2xl font-black italic text-zinc-600 mb-1">%</span>
          </div>
          <span className="font-headline text-[10px] md:text-xs font-black uppercase tracking-widest border-l-2 pl-3 block mb-6 transition-colors text-zinc-600 border-zinc-800
">
            {hasHistory ? t('analysis.optimalState') : 'AWAITING DATA'}
          </span>
          
          <GraphContainer>
            {hasHistory && (
              <div className="w-full h-full flex flex-col justify-end pb-1 gap-2">
                <div className="w-full h-6 md:h-10 bg-zinc-800/50 relative overflow-hidden transform -skew-x-12">
                  <motion.div initial={{width:0}} animate={{width: `${readinessScore}%`}} className="h-full bg-volt shadow-[0_0_20px_var(--primary-glow)]" />
                </div>
                <div className="flex justify-between w-full text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </GraphContainer>
        </div>

        {/* Recovery Score Section */}
        <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r border-white/5 pb-8 lg:pb-0 lg:pr-8 lg:pl-4 text-left justify-start items-start">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
            {t('analysis.recoveryScore')}
            <InfoTooltip term="CNS" />
          </span>
          <div className="flex items-end gap-3 mb-2 justify-start w-full">
            <span className="text-6xl md:text-7xl font-black italic tracking-tighter leading-none text-white">
              {recoveryScore}
            </span>
            <span className="text-xl md:text-2xl font-black italic text-zinc-600 mb-1">%</span>
          </div>
          <span className={cn("font-headline text-[10px] md:text-xs font-black uppercase tracking-widest border-l-2 pl-3 block mb-6 transition-colors", hasHistory ? statusColor : "text-zinc-600", statusBorderClass)}>
            {hasHistory ? t('analysis.cnsReady') : 'AWAITING DATA'}
          </span>
          
          <GraphContainer>
            {hasHistory && (
               <div className="w-full h-full flex flex-col justify-end pb-1 gap-2">
                <div className="w-full h-6 md:h-10 bg-zinc-800/50 relative overflow-hidden transform -skew-x-12">
                  <motion.div
                    initial={{width:0}}
                    animate={{width: `${recoveryScoreValue}%`}}
                    className={cn("h-full", statusBg)}
                    style={{ boxShadow: `0 0 20px var(--primary-glow)` }}
                  />
                </div>
                <div className="flex justify-between w-full text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </GraphContainer>
        </div>

        {/* Volume Section */}
        <div className="flex flex-col h-full text-left justify-start items-start lg:pl-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
            {t('analysis.weeklyAccumulatedVolume')}
            <InfoTooltip term="Volume" />
          </span>
           <div className="flex items-end gap-3 mb-2 justify-start w-full">
            <span className="text-6xl md:text-7xl font-black italic tracking-tighter leading-none text-white">
              {hasHistory ? totalWeeklyVolume.toLocaleString() : '–'}
            </span>
            <span className="text-xl md:text-2xl font-black italic text-zinc-600 mb-1">{unit === 'metric' ? 'kg' : 'LBS'}</span>
          </div>
          <span className="font-headline text-[10px] md:text-xs font-black uppercase tracking-widest border-l-2 pl-3 block mb-6 transition-colors text-zinc-600 border-zinc-800
">
            {hasHistory ? '7-DAY LOAD' : 'AWAITING DATA'}
          </span>

          <GraphContainer>
            {hasHistory && (
              <div className="w-full h-full flex items-end justify-between gap-1 md:gap-2 pb-1 relative z-10 w-full overflow-hidden">
                {orderedVolumeData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full group/bar justify-end relative z-10">
                    <div className="w-full relative flex items-end justify-center h-full mb-1 border-b border-white/5 pb-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(d.val, 5)}%` }}
                        className={cn(
                          "w-full max-w-[24px] transition-all duration-500 transform -skew-x-6",
                          d.active ? "bg-volt shadow-[0_0_15px_var(--primary-glow)]" : "bg-zinc-700 group-hover/bar:bg-zinc-600"
                        )}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-void border border-white/10 px-2 py-1 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-50">
                        <span className="text-[8px] font-black text-white whitespace-nowrap leading-none">{d.displayVal.toLocaleString()} {unit === 'metric' ? 'kg' : 'LBS'}</span>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[8px] font-black tracking-widest transition-colors",
                      d.active ? "text-volt" : "text-zinc-600"
                    )}>
                      {d.day.charAt(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GraphContainer>
        </div>

      </div>
    </div>
  );
};

export const RecoveryWidget = () => {
  const { t } = useSettings();
  const { history, getCalibrationStatus } = useWorkout();
  const hasHistory = history.length > 0;
  
  const calibration = getCalibrationStatus();
  const scoreValue = hasHistory ? calibration.readiness : 0;
  const score = hasHistory ? scoreValue : '–';

  const getStatusColor = (val: number) => {
    if (!hasHistory) return "text-zinc-500";
    if (val >= 85) return "text-emerald-500";
    if (val >= 60) return "text-amber-500";
    return "text-crimson";
  };

  const statusColor = getStatusColor(scoreValue);

  return (
  <div className="glass-panel px-4 py-6 md:p-8 border-none flex flex-col items-center justify-between text-center h-full">
    <div className="w-full flex justify-between items-center mb-2 xl:mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          {t('analysis.recoveryScore')}
          <InfoTooltip term="CNS" />
        </span>
      </div>
    </div>

    <div className="relative w-24 h-24 xl:w-32 xl:h-32 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle 
          className="text-zinc-800/50" 
          cx="50" cy="50" r="45" 
          stroke="currentColor" strokeWidth="6" fill="transparent" 
        />
        {hasHistory && (
          <motion.circle 
            initial={{ strokeDashoffset: 282.7 }}
            animate={{ strokeDashoffset: 282.7 * (1 - scoreValue / 100) }}
            className={statusColor} 
            cx="50" cy="50" r="45" 
            stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray="282.7"
            strokeLinecap="round"
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl xl:text-4xl font-black italic text-white leading-none">{score}</span>
        {hasHistory && <span className="text-sm font-black italic text-zinc-500 mb-1">%</span>}
      </div>
    </div>

    <div className="mt-4 xl:mt-6 space-y-1 xl:space-y-2">
      <span className={cn(
        "block text-[10px] font-black uppercase tracking-[0.4em]",
        statusColor
      )}>
        {hasHistory ? t('analysis.optimalStrain') : t('analysis.awaitingData')}
      </span>
      <p className="text-[9px] xl:text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest max-w-[200px]">
        {hasHistory ? t('analysis.cnsReady') : t('analysis.completeFirstWorkout')}
      </p>
    </div>
  </div>
  );
};

export const BlockWidget = () => {
  const { t, profile } = useSettings();
  const { history, getNextWorkoutTemplate } = useWorkout();
  const nextWorkout = getNextWorkoutTemplate();
  const currentBlock = nextWorkout.blockType || BlockType.HYPERTROPHY;
  const weekInBlock = nextWorkout.weekInBlock || 1;
  const totalWeek = nextWorkout.totalWeek || 1;
  
  const plan = getPlanForDuration((profile?.trainingDurationMonths || 3) * 4, profile?.trainingGoal || 'powerbuilding');
  const blockDef = plan.find(b => b.type === currentBlock);
  const totalWeeks = blockDef?.durationWeeks || 4;
  const cycleLength = plan.reduce((acc, b) => acc + b.durationWeeks, 0);
  const hasHistory = (history?.length || 0) > 0;
  
  const [hoveredWeekData, setHoveredWeekData] = useState<any>(null);

  // Only show progress if they've actually started lifting
  // And calculate based on completed weeks (e.g., Week 1 = 0% complete)
  const programProgress = hasHistory ? ((totalWeek - 1) / cycleLength) * 100 : 0;
  const blockProgress = hasHistory ? ((weekInBlock - 1) / totalWeeks) * 100 : 0;
  
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
          block: block.label || block.type,
          blockType: block.type,
          isCurrent: weekAcc === currentCycleWeek
        });
      }
    }
    return data;
  }, [currentCycleWeek, plan]);

  const intensityCurveTicks = React.useMemo(() => {
    if (!graphData.length) return [];
    return graphData
      .map(d => d.week)
      .filter(w => w === 1 || w % 5 === 0);
  }, [graphData]);

  const activeFocus = hoveredWeekData || { 
    block: nextWorkout.blockLabel || currentBlock, 
    blockType: nextWorkout.blockType || currentBlock,
    week: totalWeek
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 border-volt/30 shadow-xl bg-void/90 backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-volt mb-1">{data.block}</p>
          <p className="text-xs font-bold text-white">Week {data.week}</p>
          <p className="text-xs font-bold text-zinc-400">Intensity: {data.intensity}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel px-4 py-6 md:p-8 border-none flex flex-col justify-between h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-volt/5 blur-[40px] -z-10" />
      
      <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <h3 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-2">{t('Block Progression')}</h3>
        </div>
        {/*...week number hidden}
        <div className="flex items-center gap-2 px-3 py-1 bg-volt/10 border border-volt/20">
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-volt">{t('analysis.weeks')} {totalWeek}</span>
        </div>
        {...*/}
      </div>

      <div className="flex flex-col gap-6 md:gap-8 flex-1">
        {/* Detailed Block Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.trainingCycle')}</span>
            <div className="grid grid-cols-1 gap-2">
              {plan.map((block, idx) => {
                const isCurrent = currentBlock === block.type;
                
                let accumulated = 0;
                for(let i=0; i<idx; i++) accumulated += plan[i].durationWeeks;
                const startWeek = accumulated + 1;
                const endWeek = accumulated + block.durationWeeks;
                
                return (
                  <div 
                    key={block.type + idx}
                    className={cn(
                      "p-3 border-none transition-all duration-300",
                      isCurrent 
                        ? "bg-white/10 ring-1 ring-volt/30" 
                        : "bg-white/5 opacity-40 hover:opacity-60"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isCurrent ? "text-volt" : "text-zinc-400"
                      )}>
                        Block {idx + 1}: {block.label || block.type}
                      </span>
                      {isCurrent && <Zap size={10} className="text-volt animate-pulse" />}
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                        Weeks {startWeek}-{endWeek}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-black italic text-white">
                          WK {weekInBlock} / {block.durationWeeks}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full h-2 bg-void overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${programProgress}%` }}
                className="h-full bg-volt shadow-[0_0_10px_var(--primary-glow)]"
              />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
              <span>{t('analysis.start')}</span>
              <span>{Math.round(programProgress)}% {t('analysis.complete')}</span>
              <span>{t('analysis.peak')}</span>
            </div>
          </div>

          <div className="p-4 bg-void/40 border-none mt-auto">
            <div className="flex items-center gap-2 mb-2">
              <Info size={12} className="text-zinc-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                {hoveredWeekData ? `Week ${hoveredWeekData.week} Focus` : 'Current Focus'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-widest">
              {(activeFocus.block === 'PEAKING' || activeFocus.blockType === BlockType.PEAKING) && t('analysis.focusRealizing')}
              {(activeFocus.block === 'MAX EFFORT' || activeFocus.blockType === BlockType.MAX_EFFORT) && t('analysis.focusingOn')}
              {(activeFocus.block === 'OVERREACH' || activeFocus.blockType === BlockType.OVERREACH) && t('analysis.focusHypertrophy')}
              {(activeFocus.block === 'COMPETITION' || activeFocus.blockType === BlockType.COMPETITION) && t('analysis.focusRealizing')}
              {(activeFocus.block === 'REGENERATION' || activeFocus.blockType === BlockType.REGENERATION) && t('analysis.focusRecovery')}
              {activeFocus.blockType === BlockType.HYPERTROPHY && activeFocus.block === 'Hypertrophy' && t('analysis.focusBuilding')}
              {activeFocus.blockType === BlockType.STRENGTH && activeFocus.block === 'Strength' && t('analysis.focusStrength')}
              {activeFocus.blockType === BlockType.FOUNDATION && t('analysis.focusFoundation')}
              {activeFocus.blockType === BlockType.POWER && t('analysis.focusPower')}
              {activeFocus.blockType === BlockType.DELOAD && t('analysis.focusRecovery')}
              {/* Fallback if labels are different but types match */}
              {activeFocus.blockType === BlockType.HYPERTROPHY && activeFocus.block !== 'Hypertrophy' && t('analysis.focusBuilding')}
              {activeFocus.blockType === BlockType.STRENGTH && activeFocus.block !== 'Strength' && t('analysis.focusStrength')}
            </p>
          </div>
        </div>

        {/* Intensity Graph */}
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {t('analysis.intensityCurve')}
              <InfoTooltip term="RPE" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-volt">{cycleLength}-Week Cycle</span>
          </div>
          
          <div className="flex-1 min-h-[180px] md:min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={graphData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload) {
                    setHoveredWeekData(e.activePayload[0].payload);
                  }
                }}
                onMouseLeave={() => setHoveredWeekData(null)}
              >
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
                  tick={{ fill: '#71717a', fontSize: 9, fontWeight: 900, fontFamily: 'Inter' }}
                  ticks={intensityCurveTicks}
                  tickFormatter={(val) => `${t('workout.week').toUpperCase()} ${val}`}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
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
              {t('analysis.basedOn1rm')}
              <InfoTooltip term="1RM" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center px-1 opacity-20">
        <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">BLOCK_LABEL: {nextWorkout.blockLabel || currentBlock}</span>
        <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">CYCLE_WEEK: {currentCycleWeek}/{cycleLength}</span>
      </div>
    </div>
  );
};

const PRWidget = () => {
  const { t, unit } = useSettings();
  const { history } = useWorkout();
  const hasHistory = (history?.length || 0) > 0;
  
  // Find the highest weight lifted in history
  let bestLift = { name: t('analysis.deadlift'), weight: 0, date: '' };
  
  if (hasHistory) {
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          const w = parseFloat(set.weight) || 0;
          if (w > bestLift.weight) {
            bestLift = { name: ex.name, weight: w, date: session.date };
          }
        });
      });
    });
  }

  const prWeight = hasHistory ? bestLift.weight.toFixed(1) : '–';
  const prDiff = hasHistory ? (unit === 'metric' ? '+2.5' : '+5.0') : '0.0';
  const weightUnit = unit === 'metric' ? 'Kg' : 'LBS';

  const getBackgroundImage = (liftName: string) => {
    const name = liftName.toLowerCase();
    if (name.includes('squat')) return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop";
    if (name.includes('bench')) return "https://images.unsplash.com/photo-1534367507873-d2d7e249a3f2?q=80&w=2070&auto=format&fit=crop";
    if (name.includes('deadlift')) return "https://images.unsplash.com/photo-1583454110551-21f2fa2943f3?q=80&w=2070&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop";
  };

  return (
  <div className="relative overflow-hidden group h-full">
    <div className={cn("absolute inset-0 transition-colors duration-500", hasHistory ? "bg-crimson/90" : "bg-zinc-900/90")} />
    <img 
      src={hasHistory ? getBackgroundImage(bestLift.name) : "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"} 
      alt="Personal Record" 
      className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-1000"
      referrerPolicy="no-referrer"
    />
    <div className="absolute inset-0 px-4 py-6 md:p-8 flex flex-col justify-between">
      <div className="space-y-2 xl:space-y-4">
        <div className="flex items-center justify-between text-white/80">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              {hasHistory ? t('analysis.newPersonalRecord') : t('analysis.personalRecord')}
            </span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-white bg-white/10 px-1.5 py-0.5 border border-white/20">EXP</span>
        </div>
        <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight">
          {hasHistory ? (
            <>
              {bestLift.name}: <br />
              {prWeight} {weightUnit}
            </>
          ) : (
            t('analysis.noRecordsYet')
          )}
        </h2>
        <p className="text-[9px] xl:text-[10px] font-black uppercase tracking-widest text-white/60">
          {hasHistory ? `${prDiff} ${weightUnit} from last session • RPE 9.0` : t('analysis.startLiftingToTrack')}
        </p>
      </div>
      {hasHistory && (
        <button className="self-start bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 text-white px-6 py-3 font-headline text-[9px] xl:text-[10px] font-black uppercase tracking-widest transition-all">
          {t('analysis.viewClip')}
        </button>
      )}
    </div>
  </div>
  );
};

const VolumeWidget = () => {
  const { t, unit } = useSettings();
  const { history } = useWorkout();
  const hasHistory = (history?.length || 0) > 0;

  const volumeData = React.useMemo(() => {
    if (!hasHistory) return [];

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekData = days.map(day => ({ day, val: 0, active: false }));
    const today = now.toDateString();

    history.forEach(session => {
      const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
      if (sessionDate >= startOfWeek) {
        const dayIndex = sessionDate.getDay();
        let sessionVolume = 0;
        
        if (session.exercises) {
          session.exercises.forEach(ex => {
            ex.sets?.forEach(s => {
              if (s.isCompleted) {
                sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
              }
            });
          });
        }
        
        weekData[dayIndex].val += sessionVolume;
        
        if (sessionDate.toDateString() === today) {
          weekData[dayIndex].active = true;
        }
      }
    });

    // Normalize values to percentages for the bars
    const maxVolume = Math.max(...weekData.map(d => d.val), 1);
    return weekData.map(d => ({
      ...d,
      val: (d.val / maxVolume) * 100,
      displayVal: d.val
    }));
  }, [history, hasHistory]);

  // Reorder to start from Monday if preferred, but the mock started from MON
  const orderedVolumeData = React.useMemo(() => {
    if (volumeData.length === 0) return [];
    const monToSun = [...volumeData.slice(1), volumeData[0]];
    return monToSun;
  }, [volumeData]);

  return (
  <div className="glass-panel px-4 py-6 md:p-8 border-none space-y-4 xl:space-y-8 h-full">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('analysis.weeklyAccumulatedVolume')}</span>
    </div>
    
    <div className="flex items-end justify-between h-32 xl:h-48 gap-2">
      {hasHistory ? (
        orderedVolumeData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
            <div className="w-full relative flex items-end justify-center h-full">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(d.val, 5)}%` }}
                className={cn(
                  "w-full max-w-[40px] transition-all duration-500",
                  d.active ? "bg-volt shadow-[0_0_20px_var(--primary-glow)]" : "bg-zinc-800 group-hover/bar:bg-zinc-700"
                )}
              />
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-void border border-white/10 px-2 py-1 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                <span className="text-[8px] font-black text-white">{d.displayVal.toLocaleString()} {unit === 'metric' ? 'kg' : 'LBS'}</span>
              </div>
            </div>
            <span className={cn(
              "text-[9px] font-black tracking-widest transition-colors",
              d.active ? "text-volt" : "text-zinc-600"
            )}>
              {d.day}
            </span>
          </div>
        ))
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/5 bg-void/20">
          <span className="text-4xl font-black text-zinc-800 mb-2">–</span>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">
            {t('analysis.awaitingData')}
          </p>
        </div>
      )}
    </div>
  </div>
  );
};

const MacrosWidget = () => {
  const { t } = useSettings();
  const { history } = useWorkout();
  const hasHistory = (history?.length || 0) > 0;

  const macrosData = hasHistory ? [
    { label: t('analysis.protein'), current: 180 + ((history?.length || 0) * 5) % 50, target: 220, color: 'bg-volt' },
    { label: t('analysis.carbs'), current: 300 + ((history?.length || 0) * 10) % 100, target: 450, color: 'bg-white' },
    { label: t('analysis.fats'), current: 60 + ((history?.length || 0) * 2) % 20, target: 85, color: 'bg-white' },
  ] : [];

  return (
  <div className="glass-panel px-4 py-6 md:p-8 border-none space-y-4 xl:space-y-8 h-full flex flex-col">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-volt drop-shadow-[0_0_8px_rgba(215,255,0,0.4)]">{t('analysis.macroDistribution')}</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-volt bg-volt/10 px-1.5 py-0.5 border border-volt/20">EXP</span>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center">
      {hasHistory ? (
        <div className="space-y-3 xl:space-y-6">
          {macrosData.map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-xs font-black", m.label === t('analysis.protein') ? 'text-volt' : 'text-white')}>{m.current}g</span>
                  <span className="text-[9px] font-bold text-zinc-600">/ {m.target}g</span>
                </div>
              </div>
              <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.current / m.target) * 100}%` }}
                  className={cn("h-full", m.color)} 
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/5 bg-void/20 py-8">
          <span className="text-2xl font-black text-zinc-800 mb-1">–</span>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">
            {t('analysis.awaitingData')}
          </p>
        </div>
      )}
    </div>

    <div className="pt-2 xl:pt-4 border-t border-white/5 flex justify-between items-center">
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.totalCalories')}</span>
      <span className="text-xs xl:text-sm font-black italic">{hasHistory ? '2,815 Kcal' : '–'}</span>
    </div>
  </div>
  );
};


export const ExternalActivityWidget = () => {

  const { recoveryHistory, getCalibrationStatus } = useWorkout();
  const calibration = getCalibrationStatus();
  
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  const thisWeek = recoveryHistory.filter(r => r.timestamp > now - oneWeek);
  const thisMonth = recoveryHistory.filter(r => r.timestamp > now - oneMonth);
  const thisYear = recoveryHistory.filter(r => r.timestamp > now - oneYear);

  const hoursWeek = thisWeek.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / 60;
  const hoursMonth = thisMonth.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / 60;
  const hoursYear = thisYear.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / 60;

  const avgRpeWeek = thisWeek.length > 0 ? (thisWeek.reduce((acc, curr) => acc + curr.rpe, 0) / thisWeek.length) : 0;
  
  const { weeklyCumulativeScore, chartData } = getTacticalImpact(recoveryHistory);
  
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
    <div className="glass-panel px-4 py-6 md:p-8 border-none h-full flex flex-col relative overflow-hidden group/module w-full">
      {/* Tactical Grid Background overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700" 
           style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
        <h2 className="font-headline text-2xl font-black uppercase italic tracking-tight">Tactical Integration</h2>
      </div>
      
      <div className="grid grid-cols-3 mb-6 relative z-10 w-full max-w-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Weekly</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl lg:text-4xl font-black italic">{hoursWeek.toFixed(1)}</span>
            <span className="text-xs font-bold text-zinc-600 mb-1">hrs</span>
          </div>
        </div>
        <div className="flex flex-col border-l border-white/10 pl-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Monthly</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl lg:text-4xl font-black italic">{hoursMonth.toFixed(1)}</span>
            <span className="text-xs font-bold text-zinc-600 mb-1">hrs</span>
          </div>
        </div>
        <div className="flex flex-col border-l border-white/10 pl-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Yearly</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl lg:text-4xl font-black italic">{hoursYear.toFixed(1)}</span>
            <span className="text-xs font-bold text-zinc-600 mb-1">hrs</span>
          </div>
        </div>
      </div>
      
      <div className="bg-void/40 border border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center mb-6 relative z-10">
         <div className="flex flex-col justify-center min-w-[70px]">
           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">AVG RPE</span>
           <span className="text-2xl md:text-3xl font-black italic text-volt">{avgRpeWeek > 0 ? avgRpeWeek.toFixed(1) : '–'}</span>
         </div>
         <div className="sm:border-l sm:border-white/5 pt-2 sm:pt-0 sm:pl-4 flex-1 w-full border-t border-white/5 sm:border-t-0 mt-2 sm:mt-0">
           <div className="flex items-center gap-2 mb-1 cursor-help group/tooltip">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block relative">
               Program Impact
               {/* Custom Tooltip */}
               <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-white text-void text-[10px] uppercase font-bold tracking-wider z-50 shadow-2xl">
                 mTOR Interference: High-intensity aerobic work competes with hypertrophy pathways, potentially blunting maximum strength gains if programmed too closely together.
                 <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-white rotate-45" />
               </div>
             </span>
             <Info size={12} className="text-zinc-500" />
           </div>
           <span className={`text-xs font-black uppercase tracking-widest ${impactColor}`}>
             {impactLabel} ({weeklyCumulativeScore.toFixed(1)})
           </span>
         </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full relative z-10 mb-6">
        <TacticalChart data={chartData} />
      </div>

      <div className="mt-auto border-t border-volt/20 pt-4 relative z-10">
        <div className="flex items-start gap-3">
           <Zap className="text-volt shrink-0 mt-0.5" size={16} />
           <div>
             <span className="block text-[10px] font-black uppercase tracking-widest text-volt mb-1">Volt Arena AI Tip</span>
             <p className="text-xs text-zinc-400">
               {calibration.hasAerobicInterference 
                 ? "You're accumulating too much systemic fatigue from extracurricular activities. Consider lowering the RPE of your tactical sessions or reducing duration to preserve force production for the barbell."
                 : "Keep tactical sessions at an RPE of 7 or lower on days prior to lower-body training to prevent central nervous system fatigue."}
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const WIDGET_COMPONENTS: Record<WidgetId, React.FC<any>> = {
  'recovery-analysis': RecoveryAnalysisWidget,
  pr: PRWidget,
  macros: MacrosWidget,
  block: BlockWidget,
};

interface SortableWidgetProps {
  id: WidgetId;
  span: string;
  onRemove: (id: WidgetId) => void;
  onContinueSession?: () => void;
  onViewHistory?: (sessionId?: string) => void;
  isLifting?: boolean;
  experimentalFeatures?: boolean;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ 
  id, span, onRemove, onContinueSession, onViewHistory, isLifting, experimentalFeatures 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !experimentalFeatures });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const Component = WIDGET_COMPONENTS[id];

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        span, 
        "relative group/widget transition-all duration-300",
        isDragging ? "opacity-20 scale-95 grayscale" : "opacity-100"
      )}
    >
      {/* Immersive Controls (Appear on Hover) */}
      {!isDragging && experimentalFeatures && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-300">
          <div 
            {...attributes} 
            {...listeners}
            className="w-10 h-10 bg-void/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-volt hover:border-volt/50 cursor-grab active:cursor-grabbing transition-all"
          >
            <GripVertical size={16} />
          </div>
          <button 
            onClick={() => onRemove(id)}
            className="w-10 h-10 bg-crimson/10 backdrop-blur-xl border border-crimson/20 flex items-center justify-center text-crimson/50 hover:text-crimson hover:bg-crimson/20 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* @ts-ignore */}
      <Component onContinueSession={onContinueSession} onViewHistory={onViewHistory} isLifting={isLifting} />
    </div>
  );
};

interface AnalysisViewProps {
  onContinueSession?: () => void;
  onViewBriefing?: () => void;
  onViewHistory?: (sessionId?: string) => void;
  isLifting?: boolean;
}

export const AnalysisView = ({ onContinueSession, onViewBriefing, onViewHistory, isLifting }: AnalysisViewProps) => {
  const { t, experimentalFeatures } = useSettings();
  const [widgets, setWidgets] = useState<WidgetId[]>(['recovery-analysis', 'pr', 'macros', 'block']);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [widgetToRemove, setWidgetToRemove] = useState<WidgetId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as WidgetId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.indexOf(active.id as WidgetId);
        const newIndex = items.indexOf(over.id as WidgetId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const removeWidget = (id: WidgetId) => {
    setWidgetToRemove(id);
  };

  const confirmRemoveWidget = () => {
    if (widgetToRemove) {
      setWidgets(widgets.filter(w => w !== widgetToRemove));
      setWidgetToRemove(null);
    }
  };

  const cancelRemoveWidget = () => {
    setWidgetToRemove(null);
  };

  const addWidget = (id: WidgetId) => {
    if (!widgets.includes(id)) {
      setWidgets([...widgets, id]);
    }
    setIsLibraryOpen(false);
  };

  const availableWidgets = ALL_WIDGETS.filter(w => !widgets.includes(w.id));
  const visibleWidgets = widgets.filter(id => {
    if (id === 'macros' || id === 'pr') {
      return experimentalFeatures;
    }
    return true;
  });

  return (
    <>
      <WelcomeModule onStart={() => onContinueSession?.()} onViewBriefing={() => onViewBriefing?.()} />
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 xl:gap-8 auto-rows-min w-full">
            <SortableContext 
              items={visibleWidgets}
              strategy={verticalListSortingStrategy}
            >
              {visibleWidgets.map((id) => {
                const widget = ALL_WIDGETS.find(w => w.id === id);
                if (!widget) return null;
                return (
                  <SortableWidget 
                    key={id} 
                    id={id} 
                    span={widget.span} 
                    onRemove={removeWidget} 
                    onContinueSession={onContinueSession}
                    onViewHistory={onViewHistory}
                    isLifting={isLifting}
                    experimentalFeatures={experimentalFeatures}
                  />
                );
              })}
            </SortableContext>
          </div>

          <DragOverlay adjustScale={true} dropAnimation={{
            duration: 400,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}>
            {activeId ? (
              <div className="z-50 pointer-events-none w-full max-w-[calc(100vw-4rem)]">
                <div className="scale-105 shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden ring-2 ring-volt/20">
                  {React.createElement(WIDGET_COMPONENTS[activeId])}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Spatial Widget Library Menu - Moved to end of flow */}
        {experimentalFeatures && (
          <div className="mt-12 mb-8 flex flex-col items-center gap-4 shrink-0 px-2 lg:px-0">
            <AnimatePresence>
              {isLibraryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.8 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="glass-panel p-2 border-volt/20 flex flex-wrap justify-center gap-2 shadow-[0_0_60px_var(--primary-glow)] max-w-full"
                  >
                    {availableWidgets.length > 0 ? (
                      availableWidgets.map((w, i) => {
                        const Icon = w.icon;
                        return (
                          <motion.button
                            key={w.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => addWidget(w.id)}
                            className="flex flex-col items-center gap-2 p-3 md:p-4 hover:bg-volt text-zinc-400 hover:text-void transition-all group relative min-w-[70px] md:min-w-[80px]"
                          >
                            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-transform group-hover:scale-110">
                              <Icon size={24} className="md:w-6 md:h-6 w-5 h-5" />
                            </div>
                            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 text-center">
                              {t(w.label).split(' ')[0]}
                            </span>
                          </motion.button>
                        );
                      })
                    ) : (
                      <div className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic text-center">
                        {t('analysis.allModulesDeployed')}
                      </div>
                    )}
                  </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              className={cn(
                "w-16 h-16 flex items-center justify-center transition-all duration-500 shadow-2xl",
                isLibraryOpen 
                  ? "bg-white text-void rotate-45 scale-90" 
                  : "bg-volt text-void hover:scale-110 hover:shadow-[0_0_30px_var(--primary-glow)]"
              )}
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>
        )}

      <ConfirmationModal 
        isOpen={!!widgetToRemove}
        title={t('analysis.removeModule')}
        message={t('analysis.removeModuleMessage', { module: widgetToRemove ? t(ALL_WIDGETS.find(w => w.id === widgetToRemove)?.label || '') : '' })}
        confirmLabel={t('analysis.remove')}
        cancelLabel={t('analysis.keep')}
        onConfirm={confirmRemoveWidget}
        onCancel={cancelRemoveWidget}
      />
    </>
  );
};


