import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Activity,
  Trophy,
  Video,
  ArrowRight,
  Clock,
  Flame,
  Zap,
  TrendingUp,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
  ListOrdered,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout, WorkoutSession, Exercise } from '../contexts/WorkoutContext';
import { getExerciseName, isMainLiftMatch, isTimedExercise, calculateVolume } from '../utils/workoutUtils';
import { calculateTier } from '../lib/strength';
import { MissionBriefingModal } from './MissionBriefingModal';
import { ExerciseSwapModal } from './ExerciseSwapModal';
import { ExerciseInfoModal } from './ExerciseInfoModal';
import { getWarmupForLift, COOL_DOWN_ROUTINE } from '../data/warmupLibrary';
import { getSwappableExercises, EXERCISE_DATABASE, ExerciseDefinition } from '../constants/exercises';
import { getBlockForWeek } from '../constants/periodization';
import { getFitnessTestInfo } from '../utils/fitnessTestUtils';
import { haptics } from '../lib/haptics';
import { TRAINING_TERMS } from '../data/trainingTerms';

interface TrainingViewProps {
  onContinueSession?: () => void;
  isLifting?: boolean;
  onViewHistory?: (sessionId?: string) => void;
  onAddActivity?: () => void;
  onViewUpcomingMissions?: () => void;
  onNavigateToFitnessTest?: () => void;
}

const MissionTimer = ({ startTime, isActiveSession, estDuration }: { startTime?: number, isActiveSession: boolean, estDuration: number }) => {
  const [elapsedTime, setElapsedTime] = React.useState(() => {
    if (isActiveSession && startTime) {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '';
  });

  React.useEffect(() => {
    if (!isActiveSession || !startTime) return;

    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isActiveSession, startTime]);

  if (isActiveSession) {
    return <span className="font-mono text-xs font-bold uppercase">{elapsedTime}</span>;
  }
  return <span className="font-mono text-xs font-bold uppercase">{estDuration} MIN</span>;
};

export const TrainingView = ({ 
  onContinueSession, 
  isLifting, 
  onViewHistory, 
  onAddActivity,
  onViewUpcomingMissions,
  onNavigateToFitnessTest
}: TrainingViewProps) => {
  const { t, unit, profile } = useSettings();
  const {
    currentSession,
    startNewSession,
    replaceExerciseInSession,
    setNextWorkoutExercises,
    getNextWorkoutTemplate,
    getWorkoutTemplate,
    history,
    getCalibrationStatus,
    calculateProgramCalories
  } = useWorkout();
  const calibration = getCalibrationStatus();

  const nextWorkout = getNextWorkoutTemplate();
  const activeOrNext = currentSession || nextWorkout;

  const isActiveSession = isLifting && !!currentSession;

  const handleSwap = (idx: number, newId: string) => {
    if (!activeOrNext) return;
    const oldExercises = [...(activeOrNext.exercises || [])];
    const oldExercise = oldExercises[idx];
    if (!oldExercise) return;

    const newDef = EXERCISE_DATABASE.find(e => e.id === newId || e.name.toLowerCase() === newId.toLowerCase());
    if (!newDef) return;
    
    const updatedExercise: Exercise = {
      ...oldExercise,
      exerciseId: newDef.id,
      name: newDef.name,
      isSquat: newDef.pattern === 'squat',
      isBench: newDef.pattern === 'push_horizontal',
      isDeadlift: newDef.pattern === 'hinge'
    };

    if (isActiveSession) {
      replaceExerciseInSession(oldExercise.id, updatedExercise);
    } else {
      // It's the template
      const newExercises = [...oldExercises];
      newExercises[idx] = updatedExercise;
      setNextWorkoutExercises(newExercises);
    }
    
    setSwappingExerciseIdx(null);
  };

  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [swappingExerciseIdx, setSwappingExerciseIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedMission, setSelectedMission] = useState<WorkoutSession | null>(null);
  const [currentPRIndex, setCurrentPRIndex] = useState(0);

  // Mission Library states & filter computations
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('All');
  const [libraryMuscle, setLibraryMuscle] = useState('All');
  const [libraryPattern, setLibraryPattern] = useState('All');
  const [libraryInfoExercise, setLibraryInfoExercise] = useState<ExerciseDefinition | null>(null);

  const libraryCategories = React.useMemo(() => {
    const cats = new Set<string>();
    EXERCISE_DATABASE.forEach(ex => {
      if (ex.category) cats.add(ex.category);
    });
    return Array.from(cats).sort();
  }, []);

  const libraryMuscles = React.useMemo(() => {
    const m = new Set<string>();
    EXERCISE_DATABASE.forEach(ex => {
      if (ex.muscles) {
        ex.muscles.forEach(muscle => m.add(muscle));
      }
    });
    return Array.from(m).sort();
  }, []);

  const libraryPatterns = React.useMemo(() => {
    const p = new Set<string>();
    EXERCISE_DATABASE.forEach(ex => {
      if (ex.pattern) p.add(ex.pattern);
    });
    return Array.from(p).sort();
  }, []);

  const filteredLibrary = React.useMemo(() => {
    const searchTerms = librarySearch.toLowerCase().split(/\s+/).filter(Boolean);
    return EXERCISE_DATABASE.filter(ex => {
      const matchSearch = searchTerms.length === 0 || searchTerms.every(term => {
        const searchableString = [
          ex.name.toLowerCase(),
          ex.category.toLowerCase(),
          ex.pattern.toLowerCase(),
          ...(ex.muscles?.map(m => m.toLowerCase()) || []),
          ...(ex.description ? [ex.description.toLowerCase()] : [])
        ].join(' ');
        return searchableString.includes(term);
      });

      const matchCategory = libraryCategory === 'All' || ex.category === libraryCategory;
      const matchPattern = libraryPattern === 'All' || ex.pattern === libraryPattern;
      const matchMuscle = libraryMuscle === 'All' || (ex.muscles && ex.muscles.includes(libraryMuscle));

      return matchSearch && matchCategory && matchPattern && matchMuscle;
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [librarySearch, libraryCategory, libraryPattern, libraryMuscle]);

  // Tactical Field Manual states & filter computations
  const [manualSearch, setManualSearch] = useState('');

  const filteredManualTerms = React.useMemo(() => {
    const searchTerms = manualSearch.toLowerCase().split(/\s+/).filter(Boolean);
    const allTerms = Object.entries(TRAINING_TERMS);

    return allTerms.filter(([key]) => {
      if (searchTerms.length === 0) return true;
      const titleTrans = t(`tooltip.${key}.title`);
      const shortTrans = t(`tooltip.${key}.short`);
      const longTrans = t(`tooltip.${key}.long`);

      const searchableString = [
        key.toLowerCase(),
        titleTrans.toLowerCase(),
        shortTrans.toLowerCase(),
        longTrans.toLowerCase()
      ].join(' ');

      return searchTerms.every(term => searchableString.includes(term));
    });
  }, [manualSearch, t]);

  useEffect(() => {
    setMounted(true);
  }, []);


  const currentTier = profile ? calculateTier(
    profile.squatPR || 0,
    profile.benchPR || 0,
    profile.deadliftPR || 0,
    profile.weight || 0,
    profile.gender || 'male'
  ) : 'untrained';

  const isElite = currentTier === 'elite';
  const isAdvanced = currentTier === 'advanced';



  // Volume calculation moved to workoutUtils

  const displayTitle = activeOrNext.title;
  const focusText = React.useMemo(() => {
    const workout = activeOrNext;
    if (!workout) return t('analysis.focusingOn');

    const title = workout.title || '';
    if (title.toUpperCase().includes('HYBRID')) {
      return t('analysis.focusHybrid');
    }

    // Use explicit blockType if available (from WorkoutSession)
    const bType = (workout as any).blockType;
    
    if (bType) {
      switch (bType) {
        case 'Foundation': return t('analysis.focusFoundation');
        case 'Power': return t('analysis.focusPower');
        case 'Hypertrophy': return t('analysis.focusHypertrophy');
        case 'Strength': return t('analysis.focusStrength');
        case 'Peaking': return t('analysis.focusPeaking');
        case 'Deload': return t('analysis.focusDeload');
        case 'Aerobic Base': return t('analysis.focusAerobicBase');
        case 'Threshold': return t('analysis.focusThreshold');
        case 'VO2 Max': return t('analysis.focusVO2Max');
        case 'Capacity': return t('analysis.focusCapacity');
        case 'Resiliency': return t('analysis.focusResiliency');
        case 'Regeneration': return t('analysis.focusRegeneration');
        case 'Max Effort': return t('analysis.focusMaxEffort');
        case 'Overreach': return t('analysis.focusOverreach');
        case 'Competition / Taper': return t('analysis.focusCompetition');
      }
    }

    // Fallback to title matching
    if (title.includes('Foundation')) return t('analysis.focusFoundation');
    if (title.includes('Power')) return t('analysis.focusPower');
    if (title.includes('Hypertrophy')) return t('analysis.focusHypertrophy');
    if (title.includes('Strength')) return t('analysis.focusStrength');
    if (title.includes('Peaking')) return t('analysis.focusPeaking');
    if (title.includes('Deload')) return t('analysis.focusDeload');
    if (title.includes('Aerobic Base')) return t('analysis.focusAerobicBase');
    if (title.includes('Threshold')) return t('analysis.focusThreshold');
    if (title.includes('VO2 Max')) return t('analysis.focusVO2Max');

    return t('analysis.focusingOn');
  }, [activeOrNext, t]);

  // Dynamic Exercise & Set Tracking
  const currentExIdx = isActiveSession && currentSession ? (currentSession.currentExerciseIndex || 0) : 0;
  const mainLift = activeOrNext?.exercises?.[0];
  const currentEx = (isActiveSession && currentSession)
    ? currentSession.exercises[currentExIdx]
    : activeOrNext?.exercises?.[0];

  const exName = (isActiveSession ? (mainLift ? getExerciseName(mainLift, t) : '') : (currentEx ? getExerciseName(currentEx, t) : '')) || t('analysis.barbellSquat');

  const getAbsoluteMissionNum = (title: string) => {
    const wMatch = title?.match(/W(\d+)/);
    const dMatch = title?.match(/D(\d+)/);
    if (!wMatch || !dMatch) return 0;
    const w = parseInt(wMatch[1]);
    const d = parseInt(dMatch[1]);
    const f = profile?.trainingFrequency || 3;
    return (w - 1) * f + d;
  };

  let filteredHistory = history;
  if (profile?.programResetAt) {
    const tempFiltered = history.filter(s => (s.completedAt || s.startTime || 0) > profile.programResetAt!);
    if (tempFiltered.length > 0) {
      filteredHistory = tempFiltered;
    } else {
      filteredHistory = history;
    }
  }

  const isMissionCompleted = (mNum: number) => {
    const f = profile?.trainingFrequency || 3;
    const w = Math.floor((mNum - 1) / f) + 1;
    const d = ((mNum - 1) % f) + 1;
    // Check if any history item matches this WwDd
    return filteredHistory.some(s => {
      if (!s.title) return false;
      const match = s.title.match(/^W(\d+)\s*D(\d+)/i);
      if (match) {
        const foundW = parseInt(match[1]);
        const foundD = parseInt(match[2]);
        return foundW === w && foundD === d;
      }
      const prefix = `W${w}D${d}`;
      return s.title.startsWith(`${prefix}:`) || s.title.startsWith(prefix);
    });
  };

  const nextMissionBase = getAbsoluteMissionNum(activeOrNext?.title || '');
  const upcomingMissionNums: number[] = [];
  let candidateNum = nextMissionBase + 1;
  // Safety break at 100 iterations, though we only need 3
  let iterations = 0;
  while (upcomingMissionNums.length < 3 && iterations < 100) {
    if (!isMissionCompleted(candidateNum)) {
      upcomingMissionNums.push(candidateNum);
    }
    candidateNum++;
    iterations++;
  }

  const totalSets = currentEx?.sets?.length || 5;
  const currentSetIdx = isActiveSession && currentSession ? (currentSession.currentSetIndex || 0) : 0;

  const currentTargetRaw = currentEx?.sets?.[currentSetIdx]?.weight || '0';
  const currentTargetValue = parseFloat(currentTargetRaw) || 0;
  const currentTargetWeight = !isActiveSession && calibration.isRedline
    ? (Math.round((currentTargetValue * 0.75) / 5) * 5).toString()
    : currentTargetRaw;

  const currentReps = currentEx?.sets?.[currentSetIdx]?.reps || '0';

  // Revert target/sets to reference current exercise for active tracking, but exName is main lift
  const displayTotalSets = (isActiveSession ? mainLift?.sets?.length : totalSets) || 5;
  const displayTargetWeight = (isActiveSession ? mainLift?.sets?.[0]?.weight : currentTargetWeight);
  const displayTargetReps = (isActiveSession ? mainLift?.sets?.[0]?.reps : currentReps);

  const hasHistory = (history?.length || 0) > 0;
  const hasSubjective = !!calibration.subjectiveScores;
  const showReadiness = hasHistory || hasSubjective;

  // Use current session readiness if available, otherwise use dynamic calibration readiness
  const readinessScoreValue = currentSession?.readiness || calibration.readiness;
  const readinessScore = showReadiness || currentSession?.readiness ? readinessScoreValue : '–';
  const readinessY = 40 - (readinessScoreValue / 100) * 35;
  const totalLoad = calculateVolume(activeOrNext, true, 'none', !isActiveSession && calibration.isRedline, profile?.weight || 0);
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  // Estimate duration: 12 mins per exercise + 15 mins warmup/cool
  const estDuration = ((activeOrNext?.exercises?.length || 0) * 12) + 15;

  // Calculate est calories
  const weightKg = profile?.weight ? (unit === 'imperial' ? profile.weight * 0.453592 : profile.weight) : 75;
  const sessionRpe = isActiveSession ? (currentSession?.targetRpe || 7) : (calibration.recommendedRpe || 7);

  // For total volume calculation, if it's 0 (nothing completed yet), use predicted volume for consistency with WelcomeModule
  let totalVolumeNum = parseFloat(totalLoad.toString().replace(/,/g, '')) || 0;
  if (totalVolumeNum === 0 && activeOrNext?.exercises) {
    totalVolumeNum = activeOrNext.exercises.reduce((acc, ex) => {
      if (!ex.sets) return acc;
      return acc + ex.sets.reduce((sAcc, s) => {
        let weight = parseFloat(s.weight || '0') || 0;
        // Apply Redline scaling if not started and redline is active
        if (!isActiveSession && calibration.isRedline) {
          weight = Math.round((weight * 0.75) / 5) * 5;
        }
        return sAcc + weight * (parseInt(s.reps || '0') || 0);
      }, 0);
    }, 0);
  }

  const estCalories = calculateProgramCalories(weightKg, estDuration, sessionRpe, totalVolumeNum);

  // Calculate dynamic PRs
  const getPR = (exerciseName: string, flag?: 'isSquat' | 'isBench' | 'isDeadlift') => {
    let maxWeight = 0;
    let prDate = '–';
    let prWorkoutId: string | null = null;

    history.forEach(session => {
      session.exercises?.forEach(ex => {
        const matchesFlag = flag ? ex[flag] : false;

        let matchesName = false;
        if (flag === 'isSquat') matchesName = isMainLiftMatch(ex.name, 'Squat');
        else if (flag === 'isBench') matchesName = isMainLiftMatch(ex.name, 'Bench Press');
        else if (flag === 'isDeadlift') matchesName = isMainLiftMatch(ex.name, 'Deadlift');
        else matchesName = ex.name.toLowerCase() === exerciseName.toLowerCase();

        if (matchesFlag || matchesName) {
          ex.sets?.forEach(set => {
            const w = parseFloat(set.weight) || 0;
            if (w > maxWeight) {
              maxWeight = w;
              prDate = session.date;
              prWorkoutId = session.id;
            }
          });
        }
      });
    });

    return { weight: maxWeight > 0 ? maxWeight.toString() : '–', date: prDate, workoutId: prWorkoutId };
  };

  // ... existing variables ...
  const squatPR = getPR('squat', 'isSquat');
  const benchPR = getPR('bench', 'isBench');
  const deadliftPR = getPR('deadlift', 'isDeadlift');

  const prCount = [squatPR, benchPR, deadliftPR].filter(p => p.weight !== '–').length;

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

  const fitnessTestInfo = getFitnessTestInfo(profile, activeOrNext?.title);
  const isTestRequiredAndLocked = fitnessTestInfo.daysRemaining <= 0 && !profile?.devOverrideFitnessTest && !isActiveSession;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-min w-full">
      {/* Active/Next Mission Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel dot-grid-bg px-4 py-6 md:p-8 relative overflow-hidden flex flex-col transition-all duration-500 w-full vanguard-tour-next-mission",
          isElite && "border-volt/50",
          isAdvanced && "border-yellow-500/30"
        )}
      >
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 relative z-10 gap-4 md:gap-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-4">
              {isActiveSession ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex h-3 w-3 bg-volt"></span>
                  </span>
                  <span className="text-volt font-headline text-[10px] font-black uppercase tracking-widest">{t('analysis.activeSession')}</span>
                  {currentSession?.penaltyType && (
                    <span className="text-zinc-400 font-headline text-[10px] font-black uppercase tracking-widest px-2 border-l border-white/10">
                      {currentSession.penaltyType === 'REDLINE' ? t('analysis.redlineOverride') : t('analysis.recoveryLimit')}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5",
                    calibration.isRedline ? "bg-crimson" : calibration.readiness >= 90 ? "bg-emerald-500" : calibration.readiness >= 70 ? "bg-volt" : "bg-crimson"
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    calibration.isRedline ? "text-crimson" : calibration.readiness >= 90 ? "text-emerald-500" : "text-zinc-400"
                  )}>
                    {calibration.isRedline
                      ? t('analysis.overriddenByRedline')
                      : `${calibration.readiness >= 90 ? t('analysis.primeCondition') : t('analysis.readiness')}: ${showReadiness ? `${calibration.readiness}%` : '–'}`}
                  </span>
                </div>
              )}
            </div>
            <h1 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">{displayTitle}</h1>
            <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
              {focusText}
            </p>

            {/* Authoritative Warning Banner - Context Driven */}
            {(isActiveSession ? currentSession?.penaltyType === 'REDLINE' : calibration.isRedline) && (
              <div
                aria-live="assertive"
                className="mt-4 bg-crimson/10 border border-crimson/30 p-4 flex items-start gap-4 transition-all animate-in fade-in slide-in-from-top-2 duration-500 w-full"
              >
                <AlertTriangle className="text-crimson shrink-0" size={18} />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-crimson">{t('analysis.redlineSafetyActive')}</span>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-[1.4]">
                    {t('analysis.redlineMechanicalFailureRisk')}
                  </p>
                </div>
              </div>
            )}

            {calibration.overtrainingRisk !== 'none' && !calibration.isRedline && (
              <div
                className={cn(
                  "mt-4 p-4 flex items-start gap-4 transition-all animate-in fade-in slide-in-from-top-2 duration-500 w-full border",
                  calibration.overtrainingRisk === 'critical' ? "bg-crimson/10 border-crimson/30" : "bg-amber-500/10 border-amber-500/30"
                )}
              >
                <AlertTriangle className={calibration.overtrainingRisk === 'critical' ? "text-crimson shrink-0" : "text-amber-500 shrink-0"} size={18} />
                <div className="flex flex-col gap-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    calibration.overtrainingRisk === 'critical' ? "text-crimson" : "text-amber-500"
                  )}>
                    {calibration.overtrainingRisk === 'critical' ? "CRITICAL OVERTRAINING RISK" : "FATIGUE DECAY OUTPACED"}
                  </span>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-[1.4]">
                    {calibration.overtrainingRisk === 'critical'
                      ? "YOUR CURRENT ACUTE LOAD IS >1.6X CHRONIC BASELINE. RECOVERY FAIL RISK IS HIGH."
                      : "DAILY STRAIN IS TRENDING ABOVE RECOVERY CAPACITY. MONITOR PERFORMANCE CLOSELY."}
                  </p>
                </div>
              </div>
            )}

            {(isActiveSession ? currentSession?.penaltyType === 'AEROBIC' : (calibration.hasAerobicInterference && !calibration.isRedline)) && (
              <div
                aria-live="assertive"
                className="mt-4 bg-crimson/10 border border-crimson/30 p-4 flex items-start gap-4 transition-all animate-in fade-in slide-in-from-top-2 duration-500 w-full"
              >
                <Activity className="text-crimson shrink-0" size={18} />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-crimson">{t('analysis.aerobicInterferenceActive')}</span>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-[1.4]">
                    {t('analysis.aerobicInterferenceWarning')}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="md:text-right flex flex-col gap-2">
            <div className="flex items-center gap-3 text-zinc-400 md:justify-end">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-volt" />
                <MissionTimer startTime={currentSession?.startTime} isActiveSession={!!isActiveSession} estDuration={estDuration} />
                <span className="text-zinc-700">•</span>
                <Flame size={14} className="text-volt" />
                <span className="font-mono text-xs font-bold">{estCalories} KCAL</span>
              </div>
            </div>

            {isActiveSession && (
              <div className="flex items-center gap-4 md:justify-end mt-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">sRPE</span>
                  <span className="text-sm font-black text-white">{currentSession?.targetRpe || '–'}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.missionStatus')}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse shadow-[0_0_8px_var(--primary-glow)]" />
                    <span className="text-sm font-black text-volt uppercase">{t('analysis.active')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar (Only show if active) */}
        {isActiveSession ? (
          <div className="mb-6 md:mb-10">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.sessionProgress')}</span>
              <span className="text-xl md:text-2xl font-black">{sessionProgress}%</span>
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
          <>
            {/*
            <div className="mb-6 md:mb-10 flex flex-wrap gap-8 md:gap-12">
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.mainLift')}</span>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black text-volt">
                      {hasHistory ? `${totalSets}x${currentReps} @ ${currentTargetWeight}${weightUnit}` : '–'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.totalLoad')}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black">{hasHistory ? totalLoad : '–'}</span>
                  <span className="text-xs font-black uppercase text-zinc-400">{weightUnit}</span>
                </div>
              </div>
            </div>
            */}
          </>
        )}

        {/* Current Movement */}
        <div className={cn(
          "w-full bg-void/40 p-4 md:p-6 border border-white/5 mt-auto mb-6 transition-all duration-500",
          isElite && "border-volt/20"
        )}>
          <div className="w-full">
            <span className={cn(
              "block text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1",
              isActiveSession ? "text-volt" : "text-zinc-500"
            )}>
              {t('analysis.mainLift')}
            </span>
            <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tighter line-clamp-none">{exName}</h2>
            <span aria-live="polite" className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-widest block mt-1">
              {isActiveSession
                ? <span aria-live="assertive">{t('analysis.setOfPattern', { current: currentSetIdx + 1, total: displayTotalSets, weight: displayTargetWeight, unit: weightUnit })}</span>
                : (isTimedExercise(mainLift?.name || '')
                  ? `${displayTotalSets} sets x ${displayTargetReps} sec @ ${displayTargetWeight}${weightUnit}`
                  : t('analysis.repsAtPattern', { sets: displayTotalSets, reps: displayTargetReps, weight: displayTargetWeight, unit: weightUnit }))}
            </span>
            <button
              onClick={() => setShowRoutineModal(true)}
              className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-volt hover:text-white transition-colors flex items-center gap-1.5 btn-tertiary min-h-[44px] px-2"
            >
              <ListOrdered size={12} />
              Mission Briefing
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full mt-6">
          {(!isActiveSession && isTestRequiredAndLocked) ? (
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={onNavigateToFitnessTest}
                  className="w-full sm:flex-1 min-h-[44px] px-4 sm:px-8 py-4 btn-primary font-headline text-xs md:text-sm font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-void" />
                    <span>FITNESS TEST REQUIRED</span>
                  </div>
                  <span className="text-[8px] opacity-70 font-black uppercase tracking-widest text-void">EVALUATION MUST BE COMPLETED TO PROCEED</span>
                </button>
                <button
                  onClick={onAddActivity}
                  className="w-full sm:flex-1 btn-secondary min-h-[44px] px-4 sm:px-8 py-4 text-xs md:text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                  {t('analysis.logNonProgramActivity')}
                </button>
            </div>
          ) : !isActiveSession && calibration.isRedline ? (
            <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={onContinueSession}
                  className="w-full min-h-[44px] px-4 sm:px-8 py-4 btn-destructive font-headline text-xs md:text-sm font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Play size={16} className="fill-white group-hover:scale-110 transition-transform" />
                    <span>{t('analysis.continueMissionAnyway')}</span>
                  </div>
                  <span className="text-[8px] opacity-70 font-black uppercase tracking-widest">{t('analysis.safetyPenaltyApplied')}</span>
                </button>
                <button
                  onClick={onAddActivity}
                  className="w-full btn-secondary min-h-[44px] px-4 sm:px-8 py-4 text-xs md:text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                  {t('analysis.logNonProgramActivity')}
                </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={onContinueSession}
                className="flex-1 btn-primary min-h-[44px] px-4 sm:px-8 py-4 flex items-center justify-center gap-2"
              >
                <Play size={16} className="fill-void group-hover:scale-110 transition-transform" />
                <span>{isActiveSession ? t('analysis.continueSession') : t('analysis.startSession')}</span>
              </button>

              <button
                onClick={onAddActivity}
                className="flex-1 btn-secondary min-h-[44px] px-4 sm:px-8 py-4 flex items-center justify-center gap-2"
              >
                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                <span>{t('analysis.logNonProgramActivity')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center px-1 opacity-60">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            SYS_STATUS: {t('analysis.active')} {currentSession?.penaltyType ? '[RECOVERY_RESTRICTED]' : ''}
          </span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">REF_ID: {activeOrNext.id}</span>
        </div>
      </motion.div>
      
      {/* Upcoming Missions Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden vanguard-tour-upcoming-missions"
      >
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 relative z-10">{t('analysis.upcomingMissions')}</h2>
        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">
          Preview upcoming mission details before next mission. Mission details can be changed depending on individual deployment progression.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {upcomingMissionNums.map((missionNum, i) => {
            const weekForThisMission = Math.floor((missionNum - 1) / (profile?.trainingFrequency || 3)) + 1;
            const blockForThisMission = profile ? getBlockForWeek(weekForThisMission, profile.missionPeriod || '3M', profile.trainingGoal || 'powerbuilding', profile.customProgramBlocks || []) : null;
            const intensity = (blockForThisMission && blockForThisMission.block) 
              ? Math.round((blockForThisMission.block.baseIntensity + ((blockForThisMission.weekInBlock - 1) * blockForThisMission.block.intensityIncrementPerWeek)) * 100) 
              : 0;

            const dayForThisMission = ((missionNum - 1) % (profile?.trainingFrequency || 3)) + 1;
            const workoutTemplate = getWorkoutTemplate(weekForThisMission, dayForThisMission);
            const primaryEx = workoutTemplate?.exercises?.[0];
            const actualSets = primaryEx?.sets?.filter(s => s.reps !== "1" || !s.id.includes("retention")).length || primaryEx?.sets?.length || blockForThisMission?.block.baseSets || 3;
            const actualReps = primaryEx?.sets?.[0]?.reps || blockForThisMission?.block.baseReps || '8';

            return (
              <div
                key={missionNum}
                onClick={() => setSelectedMission(workoutTemplate)}
                className="p-4 bg-void/50 border border-white/5 group hover:border-volt/30 transition-all cursor-pointer flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-widest text-volt uppercase leading-none mb-1">Mission #{missionNum}</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Week {weekForThisMission} | Day {dayForThisMission}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Objective</p>
                      <p className="text-xs md:text-sm font-bold text-white uppercase tracking-tight">
                        {blockForThisMission?.block.label || 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Prescription</p>
                      <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.1em]">
                        {actualSets}X{actualReps} @ {intensity}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onViewUpcomingMissions}
          className="w-full btn-secondary mt-8 py-4 vanguard-tour-upcoming-missions-details min-h-[44px]"
        >
          <span>{t('analysis.viewMoreDetails')}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-volt" />
        </button>

        <div className="mt-4 flex justify-between items-center px-1 opacity-60">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            SYS_STATUS: PROJECTED
          </span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            REF_ID: W{Math.floor(((upcomingMissionNums[0] || (nextMissionBase + 1)) - 1) / (profile?.trainingFrequency || 3)) + 1}D{(((upcomingMissionNums[0] || (nextMissionBase + 1)) - 1) % (profile?.trainingFrequency || 3)) + 1}
          </span>
        </div>
      </motion.div>

      {/* My PRs Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: 0.3 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden vanguard-tour-prs"
      >
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <div className="flex items-center gap-3 relative z-10">
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">{t('analysis.myPRs')}</h2>

        </div>
        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-6 md:mb-12">Personal records measured per set.</p>

        {hasHistory ? (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
            <div className="relative h-[240px] md:h-[320px] w-full max-w-2xl flex items-center justify-center">
              {[
                { lift: t('stage.squat'), weight: squatPR.weight, date: squatPR.date, workoutId: squatPR.workoutId, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000' },
                { lift: t('stage.benchPress'), weight: benchPR.weight, date: benchPR.date, workoutId: benchPR.workoutId, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000' },
                { lift: t('stage.deadlift'), weight: deadliftPR.weight, date: deadliftPR.date, workoutId: deadliftPR.workoutId, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000' }
              ].map((pr, i) => {
                // Calculate relative index based on currentPRIndex
                const relativeIdx = (i - currentPRIndex + 3) % 3;
                const isFront = relativeIdx === 0;

                return (
                  <motion.div
                    key={i}
                    style={{ zIndex: 3 - relativeIdx }}
                    animate={{
                      x: relativeIdx * 20,
                      y: relativeIdx * -10,
                      scale: 1 - relativeIdx * 0.05,
                      opacity: 1,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => !isFront ? setCurrentPRIndex(i) : undefined}
                    className={cn(
                      "absolute inset-0 bg-zinc-950 p-6 border border-white/5 group overflow-hidden transition-all flex flex-col h-full cursor-pointer",
                      isFront ? "shadow-2xl shadow-void/80 ring-1 ring-white/10" : "pointer-events-none"
                    )}
                  >
                    {/* Background Image */}
                    <img
                      src={pr.image}
                      alt={`${pr.lift} PR`}
                      className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

                    <span className="block text-xs md:text-sm font-black uppercase tracking-widest text-zinc-500 mb-4 md:mb-6 relative z-10">{pr.lift}</span>

                    <div className="flex items-baseline gap-2 mb-4 md:mb-6 relative z-10">
                      <span className="text-5xl md:text-7xl font-black tracking-tighter text-white">{pr.weight}</span>
                      <span className="text-sm md:text-lg font-black uppercase text-volt">{weightUnit}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto relative z-10">
                      <span className="text-xs md:text-sm font-medium text-zinc-500">{pr.date}</span>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewHistory?.(pr.workoutId || undefined);
                        }} 
                        className="flex items-center gap-2 bg-white/5 hover:bg-volt hover:text-void transition-colors px-6 py-3 border border-white/5 group/btn backdrop-blur-sm pointer-events-auto"
                      >
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('analysis.viewLog')}</span>
                        <ArrowRight size={14} className="text-volt group-hover/btn:text-void transition-colors" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <button 
                onClick={() => setCurrentPRIndex((currentPRIndex - 1 + 3) % 3)}
                className="p-4 bg-white/5 border border-white/10 hover:bg-volt hover:text-void transition-all min-h-[44px] min-w-[44px]"
                aria-label="Previous PR"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button 
                onClick={() => setCurrentPRIndex((currentPRIndex + 1) % 3)}
                className="p-4 bg-white/5 border border-white/10 hover:bg-volt hover:text-void transition-all min-h-[44px] min-w-[44px]"
                aria-label="Next PR"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-none bg-void/20 p-8 md:p-12 text-center">
            <span className="text-4xl md:text-6xl font-black text-zinc-800 mb-4">–</span>
            <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2 text-zinc-500">{t('analysis.noRecordsYet')}</h3>
            <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed">
              {t('analysis.startLiftingToTrack')}
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center px-1 opacity-60">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">{t('analysis.prDatabaseSynced')}</span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">{t('analysis.recordsCount', { count: prCount })}</span>
        </div>
      </motion.div>

      {/* Recent Logs Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden vanguard-tour-past-missions"
      >
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 relative z-10">{t('analysis.missionLogs')}</h2>
        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">{t('analysis.missionLogsDesc')}</p>

        {hasHistory ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {history.slice(0, 3).map((log, i) => (
                <button
                  key={log.id}
                  onClick={() => onViewHistory?.(log.id)}
                  className="bg-void/40 p-3 md:p-6 border border-white/5 relative group overflow-hidden transition-all hover:bg-white/5 flex flex-col h-full text-left"
                >
                  <div className="flex justify-between items-start mb-2 relative z-10 w-full">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{log.date}</span>
                      <h3 className="font-headline text-xs md:text-sm font-black uppercase tracking-tight text-white group-hover:text-volt transition-colors">{log.title}</h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex flex-wrap gap-1.5">
                      {log.exercises?.slice(0, 3).map((ex, idx) => (
                        <span key={idx} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 bg-white/5 px-1.5 py-0.5 whitespace-nowrap">
                          {getExerciseName(ex, t)}
                        </span>
                      ))}
                      {(log.exercises?.length || 0) > 3 && <span className="text-[8px] font-black text-zinc-600">+{log.exercises.length - 3}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => onViewHistory?.()}
              className="w-full btn-secondary py-4"
            >
              <span>{t('analysis.viewFullHistory')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-volt" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-none bg-void/20 p-8 md:p-12 text-center">
            <span className="text-4xl md:text-6xl font-black text-zinc-800 mb-4">–</span>
            <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2 text-zinc-500">{t('analysis.noHistory')}</h3>
            <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed">
              {t('analysis.completeFirstWorkout')}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center px-1 opacity-40">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">{t('analysis.logStreamActive')}</span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">{t('analysis.totalRecordsCount', { count: history.length })}</span>
        </div>
      </motion.div>

      {/* Mission Library Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden"
      >
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 relative z-10">{t('analysis.missionLibrary')}</h2>
        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">{t('analysis.missionLibraryDesc')}</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-void/30 p-4 border border-white/5">
          {/* Advanced Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="SEARCH CODEX..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="w-full bg-surface p-3 pl-10 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt/50 transition-colors placeholder:text-zinc-600 tracking-wider"
              style={{ borderRadius: 0 }}
            />
            {librarySearch && (
              <button
                onClick={() => setLibrarySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={libraryCategory}
              onChange={(e) => setLibraryCategory(e.target.value)}
              className="w-full bg-surface p-3 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt/50 transition-colors tracking-wider"
              style={{ borderRadius: 0 }}
            >
              <option value="All">ALL CATEGORIES</option>
              {libraryCategories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Movement Pattern Filter */}
          <div>
            <select
              value={libraryPattern}
              onChange={(e) => setLibraryPattern(e.target.value)}
              className="w-full bg-surface p-3 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt/50 transition-colors tracking-wider"
              style={{ borderRadius: 0 }}
            >
              <option value="All">ALL PATTERNS</option>
              {libraryPatterns.map(pattern => (
                <option key={pattern} value={pattern}>{pattern.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Muscle Target Filter */}
          <div>
            <select
              value={libraryMuscle}
              onChange={(e) => setLibraryMuscle(e.target.value)}
              className="w-full bg-surface p-3 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt/50 transition-colors tracking-wider"
              style={{ borderRadius: 0 }}
            >
              <option value="All">ALL MUSCLES</option>
              {libraryMuscles.map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredLibrary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredLibrary.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  haptics.button();
                  setLibraryInfoExercise(ex);
                }}
                className="bg-void/40 p-4 border border-white/5 hover:border-volt/20 hover:bg-white/5 cursor-pointer transition-all flex flex-col h-full group"
              >
                <div className="space-y-1 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    {ex.category}
                  </span>
                  <h3 className="font-headline text-sm font-black uppercase tracking-tight text-white group-hover:text-volt transition-colors">
                    {ex.name}
                  </h3>
                </div>

                <div className="flex-grow mb-4">
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {ex.description || 'No description available for this mission module.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-volt bg-volt/10 px-1.5 py-0.5">
                    Pattern: {ex.pattern.replace('_', ' ')}
                  </span>
                  {ex.muscles?.slice(0, 2).map((muscle, idx) => (
                    <span key={idx} className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-white/5 px-1.5 py-0.5 whitespace-nowrap">
                      {muscle}
                    </span>
                  ))}
                  {(ex.muscles?.length || 0) > 2 && (
                    <span className="text-[8px] font-black text-zinc-500">+{ex.muscles!.length - 2}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-void/20 border border-white/5">
            <span className="text-3xl font-black text-zinc-800 mb-2">—</span>
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-500">No matching search results</h3>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed mt-1">
              Refine your filters or queries to locate available exercise entries
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center px-1 opacity-40">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">ENCYCLOPEDIA INDEXING TERMINATION</span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">RECORDS RENDERED: {filteredLibrary.length} / {EXERCISE_DATABASE.length}</span>
        </div>
      </motion.div>

      {/* Tactical Field Manual Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden"
      >
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 relative z-10">{t('settings.fieldManual')}</h2>
        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">{t('analysis.fieldManualDesc')}</p>

        <div className="grid grid-cols-1 gap-4 mb-6 bg-void/30 p-4 border border-white/5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="SEARCH TERMINOLOGY..."
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              className="w-full bg-surface p-3 pl-10 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt/50 transition-colors placeholder:text-zinc-600 tracking-wider"
              style={{ borderRadius: 0 }}
            />
            {manualSearch && (
              <button
                onClick={() => setManualSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredManualTerms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredManualTerms.map(([key]) => {
              const title = t(`tooltip.${key}.title`);
              const shortDesc = t(`tooltip.${key}.short`);
              const longDesc = t(`tooltip.${key}.long`);

              return (
                <div
                  key={key}
                  className="bg-void/40 p-4 border border-white/5 hover:border-volt/20 hover:bg-white/5 transition-all flex flex-col h-full group"
                >
                  <div className="mb-4">
                    <h3 className="font-headline text-sm font-black uppercase tracking-tight text-white group-hover:text-volt transition-colors">
                      {title}
                    </h3>
                  </div>

                  <div className="flex-grow mb-4">
                    <p className="text-zinc-200 text-[11px] leading-relaxed font-medium pl-2.5 border-l border-volt/20">
                      {shortDesc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-zinc-700" />
                      {t('fieldManual.doctrine')}
                    </p>
                    <p className="text-zinc-400 text-[11px] leading-relaxed pl-2.5 border-l border-zinc-800 line-clamp-4 group-hover:line-clamp-none transition-all">
                      {longDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-void/20 border border-white/5">
            <span className="text-3xl font-black text-zinc-800 mb-2">—</span>
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-500">No matching terminologies</h3>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed mt-1">
              Refine your query to locate field manual tactical concepts
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center px-1 opacity-40">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">MANUAL INDEXING TERMINATION</span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">RECORDS RENDERED: {filteredManualTerms.length} / {Object.keys(TRAINING_TERMS).length}</span>
        </div>
      </motion.div>

      {/* Routine Detail Modal */}
      <MissionBriefingModal
        isOpen={showRoutineModal || !!selectedMission}
        onClose={() => {
          setShowRoutineModal(false);
          setSelectedMission(null);
          setSwappingExerciseIdx(null);
        }}
        session={selectedMission || activeOrNext}
        onSwapExercise={selectedMission ? undefined : setSwappingExerciseIdx}
        isLifting={isLifting}
        calibration={calibration}
      />

      <ExerciseSwapModal
        isOpen={swappingExerciseIdx !== null}
        onClose={() => setSwappingExerciseIdx(null)}
        onSwap={(newId) => handleSwap(swappingExerciseIdx!, newId)}
        currentExerciseId={swappingExerciseIdx !== null ? (activeOrNext?.exercises[swappingExerciseIdx]?.exerciseId || activeOrNext?.exercises[swappingExerciseIdx]?.name || '') : ''}
      />

      {libraryInfoExercise && (
        <ExerciseInfoModal
          exercise={libraryInfoExercise}
          isOpen={!!libraryInfoExercise}
          onClose={() => setLibraryInfoExercise(null)}
        />
      )}
    </div>
  );
};
