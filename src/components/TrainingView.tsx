import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
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
  ListOrdered
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout, WorkoutSession, Exercise } from '../contexts/WorkoutContext';
import { getExerciseName, isMainLiftMatch, isTimedExercise } from '../utils/workoutUtils';
import { calculateTier } from '../lib/strength';
import { MissionBriefingModal } from './MissionBriefingModal';
import { ExerciseSwapModal } from './ExerciseSwapModal';
import { getWarmupForLift, COOL_DOWN_ROUTINE } from '../data/warmupLibrary';
import { getSwappableExercises, EXERCISE_DATABASE } from '../constants/exercises';
import { getBlockForWeek } from '../constants/periodization';

interface TrainingViewProps {
  onContinueSession?: () => void;
  isLifting?: boolean;
  onViewHistory?: (sessionId?: string) => void;
  onAddActivity?: () => void;
  onViewUpcomingMissions?: () => void;
}

export const TrainingView = ({ 
  onContinueSession, 
  isLifting, 
  onViewHistory, 
  onAddActivity,
  onViewUpcomingMissions
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

  useEffect(() => {
    setMounted(true);
  }, []);
  const [elapsedTime, setElapsedTime] = React.useState(() => {
    if (activeOrNext && currentSession?.startTime && isLifting) {
      const diff = Date.now() - currentSession.startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '00:00:00';
  });

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
        let w = parseFloat(s.weight) || 0;
        // Preview scaling for Redline
        if (!isActiveSession && calibration.isRedline) {
          w = Math.round((w * 0.75) / 5) * 5;
        }
        total += w * (parseInt(s.reps) || 0);
      });
    });
    return total.toLocaleString();
  };

  const displayTitle = activeOrNext.title;
  const getFocusText = (workout: any) => {
    if (workout.title.includes('Foundation')) return t('analysis.focusFoundation');
    if (workout.title.includes('Power')) return t('analysis.focusPower');
    if (workout.title.includes('Hypertrophy')) return t('analysis.focusHypertrophy');
    return t('analysis.focusingOn');
  };
  const focusText = getFocusText(activeOrNext);

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

  const filteredHistory = profile?.programResetAt
    ? history.filter(s => (s.completedAt || 0) > profile.programResetAt!)
    : history;

  const isMissionCompleted = (mNum: number) => {
    const f = profile?.trainingFrequency || 3;
    const w = Math.floor((mNum - 1) / f) + 1;
    const d = ((mNum - 1) % f) + 1;
    // Check if any history item matches this WwDd
    const prefix = `W${w}D${d}:`;
    return filteredHistory.some(s => s.title?.startsWith(prefix));
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

  // Use current session readiness if available, otherwise use dynamic calibration readiness
  const readinessScoreValue = currentSession?.readiness || calibration.readiness;
  const readinessScore = hasHistory || currentSession?.readiness ? readinessScoreValue : '–';
  const readinessY = 40 - (readinessScoreValue / 100) * 35;
  const totalLoad = calculateVolume(activeOrNext);
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  // Estimate duration: 12 mins per exercise + 15 mins warmup/cool
  const estDuration = ((activeOrNext?.exercises?.length || 0) * 12) + 15;

  // Calculate est calories
  const weightKg = profile?.weight ? (unit === 'imperial' ? profile.weight * 0.453592 : profile.weight) : 75;
  const sessionRpe = isActiveSession ? (currentSession?.targetRpe || 7) : (calibration.recommendedRpe || 7);

  // For total volume calculation, if it's 0 (nothing completed yet), use predicted volume for consistency with WelcomeModule
  let totalVolumeNum = parseFloat(totalLoad.replace(/,/g, '')) || 0;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-min w-full">
      {/* Active/Next Mission Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel px-4 py-6 md:p-8 relative overflow-hidden flex flex-col transition-all duration-500 w-full",
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
                      : `${calibration.readiness >= 90 ? t('analysis.primeCondition') : t('analysis.readiness')}: ${hasHistory ? `${calibration.readiness}%` : '–'}`}
                  </span>
                </div>
              )}
            </div>
            <h1 className="font-headline text-3xl md:text-3xl font-black uppercase tracking-tight mb-2">{displayTitle}</h1>
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
                <span className="font-mono text-xs font-bold uppercase">{isActiveSession ? elapsedTime : `${estDuration} MIN`}</span>
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
            <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tighter break-words line-clamp-none">{exName}</h2>
            <span aria-live="polite" className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-widest block mt-1">
              {isActiveSession
                ? <span aria-live="assertive">{t('analysis.setOfPattern', { current: currentSetIdx + 1, total: displayTotalSets, weight: displayTargetWeight, unit: weightUnit })}</span>
                : (isTimedExercise(mainLift?.name || '')
                  ? `${displayTotalSets} sets x ${displayTargetReps} sec @ ${displayTargetWeight}${weightUnit}`
                  : t('analysis.repsAtPattern', { sets: displayTotalSets, reps: displayTargetReps, weight: displayTargetWeight, unit: weightUnit }))}
            </span>
            <button
              onClick={() => setShowRoutineModal(true)}
              className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-volt hover:text-white transition-colors flex items-center gap-1.5 btn-tertiary"
            >
              <ListOrdered size={12} />
              Mission Briefing
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
          {!isActiveSession && calibration.isRedline ? (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={onContinueSession}
                  className="flex-[2] w-full min-h-[44px] px-4 sm:px-8 py-4 btn-destructive font-headline text-xs md:text-sm font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Play size={16} md:size={18} className="fill-white group-hover:scale-110 transition-transform" />
                    <span>{t('analysis.continueMissionAnyway')}</span>
                  </div>
                  <span className="text-[8px] opacity-70 font-black uppercase tracking-widest">{t('analysis.safetyPenaltyApplied')}</span>
                </button>
                <button
                  onClick={onAddActivity}
                  className="flex-1 btn-secondary min-h-[44px] w-full min-h-[44px] px-4 sm:px-8 py-4 text-xs md:text-sm"
                >
                  <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                  {t('analysis.logNonProgramActivity')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={onContinueSession}
                className="flex-[2] btn-primary w-full min-h-[44px] px-4 sm:px-8 py-4"
              >
                <Play size={16} md:size={18} className="fill-void group-hover:scale-110 transition-transform" />
                {isActiveSession ? t('analysis.continueSession') : t('analysis.startSession')}
              </button>

              <button
                onClick={onAddActivity}
                className="flex-1 btn-secondary w-full min-h-[44px] px-4 sm:px-8 py-4"
              >
                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                {t('analysis.logNonProgramActivity')}
              </button>
            </>
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
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel p-4 md:p-8 flex flex-col w-full"
      >
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight">{t('analysis.upcomingMissions')}</h2>
        </div>
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

            return (
              <div
                key={missionNum}
                onClick={() => setSelectedMission(getWorkoutTemplate(weekForThisMission, dayForThisMission))}
                className="p-4 bg-void/50 border border-white/5 group hover:border-volt/30 transition-all cursor-pointer flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-widest text-volt uppercase leading-none mb-1">Mission #{missionNum}</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Week {weekForThisMission} | Day {dayForThisMission}</span>
                    </div>
                    <div className="w-8 h-8 border border-white/5 flex items-center justify-center bg-zinc-900 group-hover:border-volt/30 transition-colors">
                      <ArrowRight size={14} className="text-zinc-600 group-hover:text-volt transition-colors" />
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
                        {blockForThisMission?.block.baseSets || 3}x{blockForThisMission?.block.baseReps || '8'} @ {intensity}%
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
          className="w-full btn-secondary mt-8 py-4"
        >
          <span>{t('analysis.viewMoreDetails')}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-volt" />
        </button>
      </motion.div>

      {/* My PRs Module */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: 0.3 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel p-4 md:p-8 flex flex-col w-full"
      >
        <div className="flex items-center gap-3">
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
                          onViewHistory?.(pr.workoutId);
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
                className="p-4 bg-white/5 border border-white/10 hover:bg-volt hover:text-void transition-all"
                aria-label="Previous PR"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button 
                onClick={() => setCurrentPRIndex((currentPRIndex + 1) % 3)}
                className="p-4 bg-white/5 border border-white/10 hover:bg-volt hover:text-void transition-all"
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
        className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel p-4 md:p-8 flex flex-col w-full"
      >
        <div className="flex items-center gap-3 mb-6 md:mb-10">
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight">{t('analysis.missionLogs')}</h2>
        </div>

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
                      <h3 className="font-headline text-xs md:text-sm font-bold uppercase tracking-tight text-white group-hover:text-volt transition-colors">{log.title}</h3>
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
