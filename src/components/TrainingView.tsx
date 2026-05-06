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
  ChevronRight,
  RefreshCw,
  Search,
  X,
  ListOrdered,
  Book
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout, WorkoutSession, Exercise } from '../contexts/WorkoutContext';
import { getExerciseName, isMainLiftMatch, isTimedExercise } from '../utils/workoutUtils';
import { calculateTier } from '../lib/strength';
import { FieldManual } from './FieldManual';
import { getWarmupForLift, COOL_DOWN_ROUTINE } from '../data/warmupLibrary';
import { getSwappableExercises } from '../constants/exercises';
import { BlockWidget } from './AnalysisView';

interface TrainingViewProps {
  onContinueSession?: () => void;
  isLifting?: boolean;
  onViewHistory?: (sessionId?: string) => void;
  onAddActivity?: () => void;
}

export const TrainingView = ({ onContinueSession, isLifting, onViewHistory, onAddActivity }: TrainingViewProps) => {
  const { t, unit, profile } = useSettings();
  const { 
    currentSession, 
    startNewSession,
    replaceExerciseInSession,
    setNextWorkoutExercises,
    getNextWorkoutTemplate, 
    history, 
    getCalibrationStatus, 
    calculateProgramCalories 
  } = useWorkout();
  const calibration = getCalibrationStatus();

  const nextWorkout = getNextWorkoutTemplate();
  const activeOrNext = currentSession || nextWorkout;

  const isActiveSession = isLifting && !!currentSession;
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showFieldManual, setShowFieldManual] = useState(false);
  const [swappingExerciseIdx, setSwappingExerciseIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
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
            <h1 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-2">{displayTitle}</h1>
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
                  <span className="text-sm font-black italic text-white">{currentSession?.targetRpe || '–'}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.missionStatus')}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse shadow-[0_0_8px_var(--primary-glow)]" />
                    <span className="text-sm font-black italic text-volt uppercase">{t('analysis.active')}</span>
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
          <>
            {/*
            <div className="mb-6 md:mb-10 flex flex-wrap gap-8 md:gap-12">
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.mainLift')}</span>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black italic text-volt">
                      {hasHistory ? `${totalSets}x${currentReps} @ ${currentTargetWeight}${weightUnit}` : '–'}
                    </span>
                  </div>
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
            <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tighter break-words line-clamp-none">{exName}</h2>
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
            <button
              onClick={() => setShowFieldManual(true)}
              className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-volt hover:text-white transition-colors flex items-center gap-1.5 btn-tertiary"
            >
              <Book size={12} />
              Tactical Field Manual
            </button>
            {/*}
            <button
              onClick={() => setShowFieldManual(true)}
              className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-volt hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Book size={12} />
              {t('settings.fieldManual')}
            </button>
            {*/}
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
                  <span className="text-[8px] opacity-70 italic font-black uppercase tracking-widest">{t('analysis.safetyPenaltyApplied')}</span>
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

        {/* Block Progression Widget */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="col-span-1 md:col-span-2 lg:col-span-3 glass-panel p-4 md:p-8"
        >
          <BlockWidget />
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
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-2">{t('personal records')}</h2>

        </div>
        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-6 md:mb-12">Personal records measured per set.</p>

        {hasHistory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-1">
            {[
              { lift: t('stage.squat'), weight: squatPR.weight, date: squatPR.date, workoutId: squatPR.workoutId, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000' },
              { lift: t('stage.benchPress'), weight: benchPR.weight, date: benchPR.date, workoutId: benchPR.workoutId, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000' },
              { lift: t('stage.deadlift'), weight: deadliftPR.weight, date: deadliftPR.date, workoutId: deadliftPR.workoutId, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000' }
            ].map((pr, i) => (
              <div
                key={i}
                tabIndex={0}
                aria-label={`${pr.lift} personal record: ${pr.weight} ${weightUnit} on ${pr.date}`}
                className="bg-void/40 p-4 border border-white/5 relative group overflow-hidden transition-all hover:bg-white/5 flex flex-col h-full focus-visible:outline-volt focus-visible:outline-offset-2"
              >
                {/* Background Image */}
                <img
                  src={pr.image}
                  alt={`${pr.lift} PR`}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent" />

                <span className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 md:mb-6 relative z-10">{pr.lift}</span>

                <div className="flex items-baseline gap-2 mb-6 md:mb-8 relative z-10">
                  <span className="text-4xl md:text-6xl font-black italic tracking-tighter text-white">{pr.weight}</span>
                  <span className="text-[10px] md:text-sm font-black uppercase text-volt">{weightUnit}</span>
                </div>

                <div className="flex items-center justify-between mt-auto relative z-10">
                  <span className="text-[10px] md:text-xs font-medium text-zinc-400">{pr.date}</span>

                  <button onClick={() => onViewHistory?.(pr.workoutId)} className="flex items-center gap-2 bg-white/10 hover:bg-volt hover:text-void transition-colors px-6 py-3 border-none group/btn backdrop-blur-sm">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t('analysis.viewLog')}</span>
                    <ArrowRight size={14} className="text-volt group-hover/btn:text-void transition-colors" />
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
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight">{t('analysis.missionLogs')}</h2>
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
                      <h3 className="font-headline text-lg font-black uppercase italic tracking-tight text-white group-hover:text-volt transition-colors">{log.title}</h3>
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
            <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight mb-2 text-zinc-500">{t('analysis.noHistory')}</h3>
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
      {mounted && createPortal(
        <AnimatePresence>
          {showRoutineModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowRoutineModal(false);
                  setSwappingExerciseIdx(null);
                }}
                className="absolute inset-0 bg-void/90 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl h-[85vh] glass-panel border-volt/30 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[9999]"
              >
                <div className="flex items-center justify-between p-3 md:p-6 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-volt/10 border border-volt/20 flex items-center justify-center text-volt">
                      <ListOrdered size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">Mission Details</h2>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">{activeOrNext.title}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="space-y-12">
                    {/* Warm-up Section */}
                    <div className="space-y-6">
                      <div className="flex items-baseline gap-3 border-b border-white/10 pb-2">
                        <h3 className="font-headline text-lg font-black uppercase italic tracking-tight text-volt">
                          0. Warm-Up: {getWarmupForLift(activeOrNext.exercises[0].name).title}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {getWarmupForLift(activeOrNext.exercises[0].name).items.map((item) => (
                          <div key={item.id} className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50 group">
                            <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-6 bg-volt" />
                                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                                    {item.name}
                                  </h4>
                                </div>
                                <div className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                  {item.durationMinutes}m
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-black text-volt uppercase tracking-[0.2em]">Summary</p>
                                  <p className="text-zinc-200 text-sm leading-relaxed font-medium pl-4 border-l border-volt/20">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main Exercises Section */}
                    <div className="grid grid-cols-1 gap-6">
                      {activeOrNext.exercises.map((ex, exIdx) => (
                        <div key={ex.id || exIdx} className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50 group">
                          <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-volt" />
                                <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                                  {ex.name}
                                </h4>
                              </div>
                              <button
                                onClick={() => setSwappingExerciseIdx(exIdx)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-volt hover:border-volt/30 transition-all"
                              >
                                <RefreshCw size={10} />
                                Swap
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-volt uppercase tracking-[0.2em]">Mission Protocol</p>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pl-4 border-l border-volt/20">
                                  {ex.sets?.map((set, sIdx) => {
                                    const w = parseFloat(set.weight) || 0;
                                    const displayWeight = !isActiveSession && calibration.isRedline
                                      ? Math.round((w * 0.75) / 5) * 5
                                      : w;

                                    return (
                                      <div key={sIdx} className="bg-void/40 border border-white/5 p-3 flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Set {sIdx + 1}</span>
                                        <span className="text-[10px] sm:text-xs font-black text-white">{set.reps} Reps</span>
                                        <span className="text-[8px] sm:text-[10px] font-black text-volt">{displayWeight}{weightUnit}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cool-down Section */}
                    <div className="space-y-6">
                      <div className="flex items-baseline gap-3 border-b border-white/10 pb-2">
                        <h3 className="font-headline text-lg font-black uppercase italic tracking-tight text-zinc-500">
                          {activeOrNext.exercises.length + 1}. Cool-Down Protocol
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 opacity-70">
                        {COOL_DOWN_ROUTINE.items.map((item) => (
                          <div key={item.id} className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50 group">
                            <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-6 bg-zinc-500" />
                                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                                    {item.name}
                                  </h4>
                                </div>
                                <div className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                  {item.durationMinutes}m
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Summary</p>
                                  <p className="text-zinc-400 text-sm leading-relaxed font-medium pl-4 border-l border-zinc-800">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swapping Overlay */}
                <AnimatePresence>
                  {swappingExerciseIdx !== null && (
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="absolute inset-0 bg-black/95 z-[10000] flex flex-col"
                    >
                      <div className="p-4 md:p-8 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="text-volt" size={24} />
                          <h2 className="font-headline text-xl font-black uppercase italic tracking-tight text-white">Swap Exercise</h2>
                        </div>
                        <button
                          onClick={() => setSwappingExerciseIdx(null)}
                          className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-3">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">
                          Alternative movements for {activeOrNext.exercises[swappingExerciseIdx].name}:
                        </p>
                        {getSwappableExercises(activeOrNext.exercises[swappingExerciseIdx].name).map((alt) => (
                          <button
                            key={alt.name}
                            onClick={() => {
                              const exerciseId = activeOrNext.exercises[swappingExerciseIdx].id;
                              const newExercise = {
                                ...activeOrNext.exercises[swappingExerciseIdx],
                                name: alt.name
                              };

                              if (!currentSession) {
                                // Update template before starting
                                const newExercises = nextWorkout.exercises.map((ex, i) =>
                                  i === swappingExerciseIdx ? newExercise : ex
                                );
                                setNextWorkoutExercises(newExercises);
                              } else {
                                replaceExerciseInSession(exerciseId, newExercise);
                              }
                              setSwappingExerciseIdx(null);
                            }}
                            className="w-full p-4 bg-zinc-900 border border-white/5 hover:border-volt/30 text-left transition-all group"
                          >
                            <div className="font-headline text-lg font-black uppercase italic tracking-tight text-white group-hover:text-volt">
                              {alt.name}
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                              {alt.category}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4 bg-zinc-950 border-t border-white/5">
                  <button
                    onClick={() => {
                      setShowRoutineModal(false);
                      setSwappingExerciseIdx(null);
                    }}
                    className="w-full btn-secondary py-4 flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Close Briefing
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      <FieldManual isOpen={showFieldManual} onClose={() => setShowFieldManual(false)} />
    </div>
  );
};
