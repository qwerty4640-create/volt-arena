import React, { useState } from 'react';
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
  Plus,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout, WorkoutSession } from '../contexts/WorkoutContext';
import { calculateTier } from '../lib/strength';
import { LogsWidget, BlockWidget } from './AnalysisView';

interface TrainingViewProps {
  onContinueSession?: () => void;
  isLifting?: boolean;
  onViewHistory?: (sessionId?: string) => void;
  onAddActivity?: () => void;
}

export const TrainingView = ({ onContinueSession, isLifting, onViewHistory, onAddActivity }: TrainingViewProps) => {
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
    if (workout.title.includes('Foundation')) return "Focusing on structural integrity and movement patterns.";
    if (workout.title.includes('Power')) return "Focusing on maximal force production and explosive concentric phases.";
    if (workout.title.includes('Hypertrophy')) return "Focusing on metabolic stress and muscle fiber recruitment.";
    return t('analysis.focusingOn');
  };
  const focusText = getFocusText(activeOrNext);
  
  // Dynamic Exercise & Set Tracking
  const currentExIdx = isActiveSession && currentSession ? (currentSession.currentExerciseIndex || 0) : 0;
  const currentEx = (isActiveSession && currentSession) 
    ? currentSession.exercises[currentExIdx] 
    : activeOrNext?.exercises?.[0];
    
  const exName = currentEx?.name || t('analysis.barbellSquat');
  const totalSets = currentEx?.sets?.length || 5;
  const currentSetIdx = isActiveSession && currentSession ? (currentSession.currentSetIndex || 0) : 0;
  
  const currentTargetRaw = currentEx?.sets?.[currentSetIdx]?.weight || '0';
  const currentTargetValue = parseFloat(currentTargetRaw) || 0;
  const currentTargetWeight = !isActiveSession && calibration.isRedline 
    ? (Math.round((currentTargetValue * 0.75) / 5) * 5).toString()
    : currentTargetRaw;

  const currentReps = currentEx?.sets?.[currentSetIdx]?.reps || '0';

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
    let prWorkoutId = null;
    
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        if (ex.name.toLowerCase().includes(exerciseName.toLowerCase())) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-min w-full">
      {/* Active/Next Session Module */}
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
                          {currentSession.penaltyType === 'REDLINE' ? 'REDLINE OVERRIDE' : 'RECOVERY LIMIT'}
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
                          ? 'Overridden by Redline Safety' 
                          : `${calibration.readiness >= 90 ? t('analysis.primeCondition') : t('analysis.readiness')}: ${hasHistory ? `${calibration.readiness}%` : '–'}`}
                      </span>
                    </div>
                  )}
                </div>
                <h1 className="font-headline text-2xl sm:text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-2">{displayTitle}</h1>
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-crimson">Redline Safety Override Active</span>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-[1.4]">
                        Mechanical failure risk detected. System has enforced a 25% load reduction. 
                        Readiness scores have been suppressed in favor of structural integrity.
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-crimson">Aerobic Interference Active</span>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-[1.4]">
                        Recent high-intensity recovery activity detected. System has applied a 15% CNS tax.
                      </p>
                    </div>
                  </div>
                )}
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
                        {hasHistory ? `${totalSets}x${currentReps} @ ${currentTargetWeight}${weightUnit}` : '–'}
                      </span>
                    </div>

                    {/* Safety Override Messaging handled in header */}
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
              "w-full bg-void/40 p-4 md:p-6 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 mt-auto mb-6 transition-all duration-500",
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
                  <h2 className="font-headline text-lg sm:text-xl md:text-2xl font-black uppercase italic tracking-tight">{exName}</h2>
                  <span aria-live="polite" className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-widest">
                    {isActiveSession 
                      ? <span aria-live="assertive">Set {currentSetIdx + 1} of {totalSets}{sessionProgress > 0 ? ' • 3 Mins Rest Remaining' : ''}</span> 
                      : `${totalSets} ${t('analysis.5sets').split(' ')[1]}`}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t('analysis.target')}</span>
                <div className="flex items-baseline gap-1 sm:justify-end">
                  <span className="text-3xl md:text-4xl font-black italic tracking-tighter">{currentTargetWeight}</span>
                  <span className="text-[10px] md:text-xs font-black uppercase text-zinc-400">{weightUnit}</span>
                  <span className="text-lg md:text-xl font-black italic tracking-tighter ml-2 text-zinc-400">x {currentReps}</span>
                </div>
                {(isActiveSession ? currentSession?.penaltyType === 'REDLINE' : calibration.isRedline) && (
                  <div className="text-[8px] font-black uppercase tracking-widest text-crimson mt-1 flex items-center gap-1 justify-end">
                    <Zap size={8} /> 25% Redline Adjustment Applied
                  </div>
                )}
                {(isActiveSession ? currentSession?.penaltyType === 'AEROBIC' : (calibration.hasAerobicInterference && !calibration.isRedline)) && (
                  <div className="text-[8px] font-black uppercase tracking-widest text-crimson mt-1 flex items-center gap-1 justify-end">
                    <Activity size={8} /> 15% Recovery Adjustment Applied
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
              {!isActiveSession && calibration.isRedline ? (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button 
                      onClick={onContinueSession}
                      className="flex-[2] w-full min-h-[44px] px-4 sm:px-8 py-4 bg-crimson text-void font-headline text-xs md:text-sm font-black uppercase tracking-widest hover:bg-white hover:text-void transition-all flex flex-col items-center justify-center gap-1 group shadow-[0_0_30px_rgba(255,113,98,0.2)]"
                    >
                      <div className="flex items-center gap-2">
                        <Play size={16} md:size={18} className="fill-white group-hover:scale-110 transition-transform" />
                        <span>Continue Training Anyway</span>
                      </div>
                      <span className="text-[8px] opacity-70 italic font-black uppercase tracking-widest">25% Intensity Safety Penalty Applied</span>
                    </button>
                    <button 
                      onClick={onAddActivity}
                      className="flex-1 w-full min-h-[44px] px-4 sm:px-8 py-4 bg-void/40 border border-white/10 text-white font-headline text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                    >
                      <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                      Log Non-Program Activity
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    onClick={onContinueSession}
                    className="flex-[2] w-full min-h-[44px] px-4 sm:px-8 py-4 bg-volt text-void font-headline text-xs md:text-sm font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 group"
                  >
                    <Play size={16} md:size={18} className="fill-void group-hover:scale-110 transition-transform" />
                    {isActiveSession ? t('analysis.continueSession') : t('analysis.startSession')}
                  </button>
                  
                  <button 
                    onClick={onAddActivity}
                    className="flex-1 w-full min-h-[44px] px-4 sm:px-8 py-4 bg-void/40 border border-white/10 text-white font-headline text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                    Log Non-Program Activity
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center px-1 opacity-60">
              <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
                SYS_STATUS: ACTIVE {currentSession?.penaltyType ? '[RECOVERY_RESTRICTED]' : ''}
              </span>
              <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">REF_ID: {activeOrNext.id}</span>
            </div>
          </motion.div>

          {/* My PRs Module */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel p-4 flex flex-col w-full"
              >
                <div className="flex items-center gap-3 mb-6 md:mb-10">
                  <Trophy className="text-volt" size={24} />
                  <h2 className="font-headline text-lg sm:text-xl md:text-2xl font-black uppercase italic tracking-tight">{t('analysis.myPRs')}</h2>
                </div>
                
                {hasHistory ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-1">
                    {[
                      { lift: t('stage.squat'), weight: squatPR.weight, date: squatPR.date, workoutId: squatPR.workoutId, image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000' },
                      { lift: t('stage.benchPress'), weight: benchPR.weight, date: benchPR.date, workoutId: benchPR.workoutId, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000' },
                      { lift: t('stage.deadlift'), weight: deadliftPR.weight, date: deadliftPR.date, workoutId: deadliftPR.workoutId, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000' }
                    ].map((pr, i) => (
                      <div 
                        key={i} 
                        tabIndex={0}
                        aria-label={`${pr.lift} personal record: ${pr.weight} ${weightUnit} on ${pr.date}`}
                        className="bg-void/40 p-4 border-none relative group overflow-hidden transition-all hover:bg-white/5 flex flex-col h-full focus-visible:outline-volt focus-visible:outline-offset-2"
                      >
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
                          
                          <button onClick={() => onViewHistory?.(pr.workoutId)} className="flex items-center gap-2 bg-white/10 hover:bg-volt hover:text-void transition-colors px-6 py-3 border-none group/btn backdrop-blur-sm">
                            <Video size={12} md:size={14} className="text-volt group-hover/btn:text-void transition-colors" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">View Log</span>
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
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">PR_DATABASE: SYNCED</span>
                  <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">RECORDS: {hasHistory ? '3' : '0'}</span>
                </div>
              </motion.div>

              {/* Recent Logs Module */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.4 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 w-full"
              >
                <LogsWidget onViewHistory={onViewHistory} />
              </motion.div>
    </div>
  );
};
