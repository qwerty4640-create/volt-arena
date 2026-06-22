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
import { InfoTooltip } from './InfoTooltip';
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
  onStartCustomSession?: () => void;
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
  onNavigateToFitnessTest,
  onStartCustomSession
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
    
    const isS = isMainLiftMatch(newDef.name, 'Squat');
    const isB = isMainLiftMatch(newDef.name, 'Bench Press');
    const isD = isMainLiftMatch(newDef.name, 'Deadlift');
    const isMain = isS || isB || isD;

    let newIntent = oldExercise.intent;
    if (!isMain && oldExercise.intent === "HEAVY PRIMARY") {
      newIntent = "HYPERTROPHY";
    }

    const cleanName = (name: string) => name.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?|\[?ACTIVE RECOVERY\]?|\[?MOVEMENT QUALITY\]?|\[?BLOOD FLOW\]?/gi, '').trim().toLowerCase();
    const searchTargetName = cleanName(newDef.name);

    let lastWeight = 0;
    if (history && history.length > 0) {
      const sessionsWithEx = history
        .filter((s) =>
          s.exercises?.some(
            (ex) =>
              ex.name &&
              cleanName(ex.name) === searchTargetName,
          ),
        )
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

      if (sessionsWithEx.length > 0) {
        const latestSession = sessionsWithEx[0];
        const targetEx = latestSession.exercises?.find(
          (ex) =>
            ex.name &&
            cleanName(ex.name) === searchTargetName,
        );
        if (targetEx && targetEx.sets) {
          // Screen out warm-up sets if there are any working sets, and find the maximum working weight
          const workingSets = targetEx.sets.filter((s: any) => 
            parseFloat(s.weight) > 0 && 
            !s.isWarmup && 
            s.isCompleted !== false && 
            s.completed !== false
          );
          const candidateSets = workingSets.length > 0 
            ? workingSets 
            : targetEx.sets.filter((s: any) => parseFloat(s.weight) > 0);
          if (candidateSets.length > 0) {
            const weights = candidateSets.map((s: any) => parseFloat(s.weight) || 0);
            lastWeight = Math.max(...weights);
          }
        }
      }
    }

    let updatedSets = oldExercise.sets ? [...oldExercise.sets] : [];
    if (lastWeight > 0) {
      updatedSets = updatedSets.map(s => ({
        ...s,
        weight: lastWeight.toString(),
        baseWeight: lastWeight.toString(),
      }));
    } else if (isMain && profile) {
      let pr = 0;
      if (isS) pr = profile.squatPR || 0;
      if (isB) pr = profile.benchPR || 0;
      if (isD) pr = profile.deadliftPR || 0;
      if (pr > 0) {
        const calculatedWeight = Math.round((pr * 0.75) / 5) * 5;
        updatedSets = updatedSets.map(s => ({
          ...s,
          weight: calculatedWeight.toString(),
          baseWeight: calculatedWeight.toString(),
        }));
      }
    } else {
      const isFinalWeek = activeOrNext.title?.toLowerCase().includes("w8") || activeOrNext.title?.toLowerCase().includes("final");
      const defaultWeightStr = !isMain ? (isFinalWeek ? "9.0" : "8.5") : "RPE 8";
      updatedSets = updatedSets.map(s => ({
        ...s,
        weight: defaultWeightStr,
        baseWeight: defaultWeightStr,
      }));
    }

    const isCalisthenic =
      newDef.isCalisthenics ||
      [
        "bodyweight_squat",
        "plank",
        "bicycle_crunch",
        "mountain_climbers",
        "flutter_kicks",
        "leg_raises_floor",
        "toe_touches",
        "side_plank",
      ].includes(newDef.id);

    if (isCalisthenic) {
      updatedSets = updatedSets.map(s => ({
        ...s,
        weight: "0",
        baseWeight: "0",
      }));
    }

    const updatedExercise: Exercise = {
      ...oldExercise,
      exerciseId: newDef.id,
      name: newDef.name,
      isSquat: isS,
      isBench: isB,
      isDeadlift: isD,
      intent: newIntent,
      sets: updatedSets
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

// Intentionally leaving out Library states and info exercise state to remove tactical library imports

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

  const activeExDef = currentEx ? EXERCISE_DATABASE.find(e => e.id === currentEx.exerciseId || e.name === currentEx.name || e.name.toLowerCase() === currentEx.name?.toLowerCase()) : undefined;
  const isEnduranceMode = activeExDef?.category === "Endurance" || 
                          activeExDef?.pattern === "impact" || 
                          currentEx?.name?.toLowerCase().includes("rowing") || 
                          currentEx?.name?.toLowerCase().includes("running") || 
                          currentEx?.name?.toLowerCase().includes("cycling") || 
                          currentEx?.name?.toLowerCase().includes("rucking") ||
                          currentEx?.sets?.some(s => s.phaseName !== undefined);

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
  const isPrimaryLift = currentEx?.isSquat || currentEx?.isBench || currentEx?.isDeadlift;

  // Revert target/sets to reference current exercise for active tracking, but exName is main lift
  const displayTotalSets = (isActiveSession ? mainLift?.sets?.length : totalSets) || 5;
  const displayTargetWeight = (isActiveSession ? mainLift?.sets?.[0]?.weight : currentTargetWeight);
  const displayTargetReps = isActiveSession
    ? (isEnduranceMode 
        ? (currentEx?.sets?.[currentSetIdx]?.baseReps || currentEx?.sets?.[currentSetIdx]?.reps || '?')
        : (mainLift?.sets?.[0]?.baseReps || mainLift?.sets?.[0]?.reps || '?')
      )
    : (currentEx?.sets?.[currentSetIdx]?.baseReps || currentEx?.sets?.[currentSetIdx]?.reps || currentReps || '?');

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
            <h1 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white mb-2">{displayTitle}</h1>
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
            {(() => {
              const rawName = exName;
              const originalEx = isActiveSession ? mainLift : currentEx;
              const originalName = (typeof originalEx === 'string' ? originalEx : originalEx?.name || "").toUpperCase();
              let intentTag = (isActiveSession ? mainLift?.intent : currentEx?.intent) || 
                (originalName.includes('HEAVY PRIMARY') ? 'HEAVY PRIMARY' : 
                 originalName.includes('HYPERTROPHY') ? 'HYPERTROPHY' : undefined);
              const cleanName = rawName.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?/g, '').trim();

              const isS = isMainLiftMatch(cleanName, "Squat");
              const isB = isMainLiftMatch(cleanName, "Bench Press");
              const isD = isMainLiftMatch(cleanName, "Deadlift");
              const isMain = isS || isB || isD;

              if (!isMain && intentTag?.toUpperCase().includes("HEAVY PRIMARY")) {
                intentTag = "HYPERTROPHY";
              }

              const isHeavyPrimary = intentTag?.toUpperCase().includes("HEAVY PRIMARY");
              const isHypertrophy = intentTag?.toUpperCase().includes("HYPERTROPHY");
              const isBloodFlow = intentTag?.toUpperCase().includes("BLOOD FLOW");

              let tooltipTerm: 'HeavyPrimary' | 'Hypertrophy' | 'BloodFlow' | undefined = undefined;
              if (isHeavyPrimary) tooltipTerm = 'HeavyPrimary';
              else if (isHypertrophy) tooltipTerm = 'Hypertrophy';
              else if (isBloodFlow) tooltipTerm = 'BloodFlow';

              return (
                <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                  <h2 className={cn(
                    "font-headline text-2xl md:text-3xl uppercase tracking-tighter line-clamp-none",
                    isMainLiftMatch(cleanName, "Deadlift") ? "font-semibold" : "font-black"
                  )}>
                    {cleanName}
                  </h2>
                  {intentTag && (
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-none ${
                        isHeavyPrimary 
                          ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" 
                          : "bg-volt/10 text-volt border-volt/30"
                      }`}>
                        {intentTag}
                      </span>
                      {tooltipTerm && (
                        <InfoTooltip term={tooltipTerm} className="ml-0 cursor-pointer text-[10px]" />
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            <span aria-live="polite" className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-widest block mt-1">
              {isActiveSession
                ? (isEnduranceMode ? (
                    <span aria-live="assertive">Phase {currentSetIdx + 1} of {displayTotalSets} • {displayTargetReps}</span>
                  ) : (
                    <span aria-live="assertive">{t('analysis.setOfPattern', { current: currentSetIdx + 1, total: displayTotalSets, weight: displayTargetWeight, unit: weightUnit })} RPE {sessionRpe}</span>
                  ))
                : (() => {
                    const l = mainLift || currentEx;
                    if (!l) return '';
                    if (isEnduranceMode) {
                      return `${displayTotalSets} sets x ${displayTargetReps}`;
                    }
                    const hasBackOff = l.sets && l.sets.length > 1;
                    const isWeightOrRpeDrop = hasBackOff && (
                      parseFloat(l.sets[0]?.rpe || "") > parseFloat(l.sets[1]?.rpe || "") ||
                      parseFloat(l.sets[0]?.weight || "") > parseFloat(l.sets[1]?.weight || "")
                    );
                    const isPrimaryMainLiftEx = l.isPrimaryMainLift || (
                      l.name && (
                        isMainLiftMatch(l.name, "Squat") ||
                        isMainLiftMatch(l.name, "Bench Press") ||
                        isMainLiftMatch(l.name, "Deadlift") ||
                        isMainLiftMatch(l.name.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?/g, '').trim(), "Squat") ||
                        isMainLiftMatch(l.name.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?/g, '').trim(), "Bench Press") ||
                        isMainLiftMatch(l.name.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?/g, '').trim(), "Deadlift")
                      )
                    );
                    const shouldGroup = hasBackOff && isPrimaryMainLiftEx && isWeightOrRpeDrop;
                    if (shouldGroup && l.sets && l.sets.length > 1) {
                      const topSet = l.sets[0];
                      const backOffSets = l.sets.slice(1);
                      const topReps = topSet.baseReps || topSet.reps;
                      const topWeight = topSet.weight;
                      const topRpe = topSet.rpe || topSet.baseRpe || sessionRpe;
                      const backReps = backOffSets[0].baseReps || backOffSets[0].reps;
                      const backWeight = backOffSets[0].weight;
                      const backRpe = backOffSets[0].rpe || backOffSets[0].baseRpe;
                      return `Top Set: 1x${topReps} @ ${topWeight}${weightUnit} (RPE ${topRpe}) + Back-Off: ${backOffSets.length}x${backReps} @ ${backWeight}${weightUnit} (RPE ${backRpe})`;
                    }
                    if (isTimedExercise(l.name || '')) {
                      return `${displayTotalSets} sets x ${displayTargetReps} sec @ ${displayTargetWeight}${weightUnit} RPE ${sessionRpe}`;
                    }
                    return `${t('analysis.repsAtPattern', { sets: displayTotalSets, reps: displayTargetReps, weight: displayTargetWeight, unit: weightUnit })} RPE ${sessionRpe}`;
                  })()
              }
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

        <h2 className="font-headline text-2xl md:text-3xl font-semibold uppercase tracking-widest mb-2 relative z-10">{t('analysis.upcomingMissions')}</h2>
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
            const isPrimaryLift = primaryEx?.isSquat || primaryEx?.isBench || primaryEx?.isDeadlift;
            const actualReps = primaryEx?.sets?.[0]?.baseReps || primaryEx?.sets?.[0]?.reps || blockForThisMission?.block.baseReps || '8';

            return (
              <div
                key={missionNum}
                onClick={() => setSelectedMission(workoutTemplate)}
                className="p-4 bg-void/50 border border-white/5 group hover:bg-white/5 hover:border-volt/30 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full"
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
                      <p className="text-xs md:text-sm font-bold text-white uppercase tracking-tight group-hover:text-volt transition-colors">
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
      


      {/* Custom Mission Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel border border-white/5 bg-void p-4 md:p-8 flex flex-col md:flex-row justify-between items-center w-full relative overflow-hidden group cursor-pointer hover:bg-white/5 hover:border-volt/30 transition-all duration-300"
        onClick={() => {
          const date = new Date().toISOString().split('T')[0];
          const customSession = {
            id: `custom_${Date.now()}`,
            uid: (profile as any)?.uid || (profile as any)?.id || 'guest',
            date,
            time: new Date().toTimeString().split(' ')[0],
            title: `Custom Mission - ${date}`,
            description: "Self-directed tactical operation. Does not advance standard deployment tracks.",
            exercises: [],
            isCustom: true, // ensures it doesn't bump W/D metrics
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            completed: false
          } as any;
          startNewSession(customSession);
          onStartCustomSession?.();
        }}
      >
        <div className="flex flex-col z-10 w-full mb-4 md:mb-0">
          <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-widest text-white group-hover:text-volt transition-colors mb-2">
            Make My Own
          </h2>
          <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed">
            Launch a blank canvas operation. Select your own parameters. Recorded to history, isolated from main schedule.
          </p>
        </div>
        
        <div className="flex items-center justify-center shrink-0 w-full md:w-auto">
          <div className="h-10 w-10 md:h-12 md:w-12 bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
            <ArrowRight size={20} className="group-hover:translate-x-1 group-hover:text-volt transition-all" />
          </div>
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

    </div>
  );
};
