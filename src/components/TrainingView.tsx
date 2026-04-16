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
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout, WorkoutSession } from '../contexts/WorkoutContext';
import { calculateTier } from '../lib/strength';
import { RecoveryWidget, LogsWidget, BlockWidget } from './AnalysisView';
import { ActiveRecoveryModal } from './ActiveRecoveryModal';

interface TrainingViewProps {
  onContinueSession?: () => void;
  isLifting?: boolean;
  onViewHistory?: (sessionId?: string) => void;
}

export const TrainingView = ({ onContinueSession, isLifting, onViewHistory }: TrainingViewProps) => {
  const { t, unit, profile } = useSettings();
  const { currentSession, getNextWorkoutTemplate, history, getCalibrationStatus } = useWorkout();
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
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

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <div className="w-full overflow-y-auto custom-scrollbar pb-32 pt-8 lg:pt-24 px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1600px] mx-auto auto-rows-min">
          
          {/* Active/Next Session Module */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel p-8 relative overflow-hidden flex flex-col transition-all duration-500",
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
                      <div className="flex flex-col mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-volt/60">
                          calibrated to {(calibration.readinessModifier * calibration.recoveryModifier * 100).toFixed(0)}%
                        </span>
                        {calibration.hasAerobicInterference && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson"></span>
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-crimson">Low Recovery Warning: Aerobic Interference</span>
                          </div>
                        )}
                      </div>
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

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onContinueSession}
                className="flex-[2] px-8 py-4 bg-volt text-void font-headline text-xs md:text-sm font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 group"
              >
                <Play size={16} md:size={18} className="fill-void group-hover:scale-110 transition-transform" />
                {isActiveSession ? t('analysis.continueSession') : t('analysis.startSession')}
              </button>
              
              {!isActiveSession && (
                <button 
                  onClick={() => setIsRecoveryModalOpen(true)}
                  className="flex-1 px-8 py-4 bg-void/40 border border-white/10 text-white font-headline text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                  Non-Program Activity
                </button>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center px-1 opacity-30">
              <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">SYS_STATUS: ACTIVE</span>
              <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">REF_ID: {activeOrNext.id}</span>
            </div>
          </motion.div>

          {/* Modal */}
          <ActiveRecoveryModal 
            isOpen={isRecoveryModalOpen} 
            onClose={() => setIsRecoveryModalOpen(false)} 
          />

          {/* My PRs Module */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0 glass-panel p-8 flex flex-col"
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

              {/* Recent Logs Module */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.4 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 shrink-0"
              >
                <LogsWidget onViewHistory={onViewHistory} />
              </motion.div>

            </div>
          </div>
        </div>
      );
    };
