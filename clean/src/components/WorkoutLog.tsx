import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  ChevronLeft,
  CheckCircle2,
  Dumbbell,
  ClipboardList,
  Info,
  Check,
  XCircle,
  RefreshCw,
  Search,
  PlusCircle,
  Bot,
  Zap,
  AlertTriangle,
  Clock,
  HelpCircle,
  Flame,
  ChevronDown,
  ChevronRight,
  Timer
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { useSettings } from '../contexts/SettingsContext';
import { cn, isDumbbell } from '../lib/utils';
import { useWorkout, Exercise, Set as WorkoutSet, WorkoutSession } from '../contexts/WorkoutContext';
import { getExerciseName, isTimedExercise } from '../utils/workoutUtils';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';
import { getSwappableExercises, EXERCISE_DATABASE } from '../constants/exercises';
import { AICoach } from './AICoach';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';
import { ExerciseInfoModal } from './ExerciseInfoModal';
import { getWarmupForLift, COOL_DOWN_ROUTINE, RoutineProtocol } from '../data/warmupLibrary';
import { useWakeLock } from '../hooks/useWakeLock';
import { haptics } from '../lib/haptics';

const RoutineCard = ({
  routine,
  onSkip,
  onDone,
  isCompleted,
  isSkipped,
  t
}: {
  routine: RoutineProtocol;
  onSkip: () => void;
  onDone: () => void;
  isCompleted: boolean;
  isSkipped: boolean;
  t: (key: string) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isSkipped) return null;

  return (
    <div className={cn(
      "glass-panel mb-8 relative overflow-hidden transition-all shadow-lg mt-8",
      isCompleted ? "border-emerald-500/50 bg-zinc-950" : "border-volt/20 bg-zinc-950"
    )}>
      <div
        onClick={() => { haptics.button(); setIsExpanded(!isExpanded); }}
        className="flex items-center justify-between gap-x-4 mb-4 p-4 md:p-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
      >
        <div>
          <h3 className="font-sans text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">{routine.title}</h3>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">{routine.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            <Clock size={12} className="text-volt" /> {routine.estimatedDuration}m
          </span>
          <div className="p-2 text-zinc-400 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-4 md:pb-6">

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 mb-6"
            >
              {routine.items.map((item, idx) => (
                <div key={item.id} className="flex flex-col gap-1 pl-4 border-l-2 border-volt/30">
                  <span className="text-xs font-black uppercase text-white">{idx + 1}. {item.name}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{item.description} ({item.durationMinutes}m)</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <button
            onClick={() => { haptics.button(); onDone(); }}
            className={cn(
              "flex-1 py-3 font-headline text-[10px] font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2",
              isCompleted
                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500/30"
                : "bg-volt/10 text-white hover:bg-volt/20 border border-volt/20"
            )}
          >
            {isCompleted ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>{t('workout.completed')} (UNDO)</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse" />
                <span>{t('workout.markDone')}</span>
              </>
            )}
          </button>
          {!isCompleted && (
            <button
              onClick={() => { haptics.button(); onSkip(); }}
              className="px-6 py-3 bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 font-headline text-[10px] font-black uppercase tracking-widest transition-all rounded"
            >
              {t('workout.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ExerciseAccordion = ({
  exercise,
  updateSet,
  toggleSetCompletion,
  removeSet,
  addSet,
  addWarmupSet,
  setSwappingExerciseId,
  setExerciseToRemove,
  getExerciseName,
  getExerciseHistory,
  weightUnit,
  t,
  isDumbbell
}: any) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const exerciseDefinition = EXERCISE_DATABASE.find(e => e.name === exercise.name);

  useEffect(() => {
    if (exercise.sets.every(set => set.isCompleted)) {
      setIsExpanded(false);
    }
  }, [exercise.sets]);

  const sortedSets = [...exercise.sets].sort((a, b) => {
    if (a.isWarmup === b.isWarmup) return 0;
    return a.isWarmup ? -1 : 1;
  });

  return (
    <div id={`exercise-${exercise.id}`} className="glass-panel overflow-hidden bg-zinc-950 border border-white/5 shadow-lg">
      <div
        onClick={() => { haptics.button(); setIsExpanded(!isExpanded); }}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-volt/10 flex items-center justify-center text-volt shrink-0">
            <Dumbbell size={16} className="md:w-5 md:h-5" />
          </div>
          <h3 className="font-sans text-xl md:text-2xl font-black uppercase italic tracking-tight">{getExerciseName(exercise, t)}</h3>
        </div>
        <div className="text-zinc-500">
          <ChevronDown size={20} className={cn("transition-transform duration-300", isExpanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => { haptics.button(); setSwappingExerciseId(exercise.id); }}
                  className="flex-1 p-2 bg-surface-container-low hover:bg-volt/10 text-volt transition-all flex items-center justify-center gap-2 group"
                >
                  <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('workout.swap')}</span>
                </button>
                <button
                  onClick={() => { haptics.button(); setExerciseToRemove(exercise.id); }}
                  className="flex-1 p-2 bg-surface-container-low hover:bg-crimson/10 text-crimson transition-all flex items-center justify-center gap-2 group"
                >
                  <Trash2 size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('workout.remove')}</span>
                </button>
                <div className="flex-[2] flex items-center justify-start text-zinc-500 pl-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                    {t('workout.history')}: {getExerciseHistory(exercise.name) || '–'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { haptics.button(); addSet(exercise.id); }}
                  className="flex-1 py-3 bg-white/5 hover:bg-volt/10 border border-white/10 hover:border-volt/30 text-zinc-500 hover:text-volt transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('workout.addSet')}</span>
                </button>
                <button
                  onClick={() => { haptics.button(); addWarmupSet(exercise.id); }}
                  className="flex-1 py-3 bg-white/5 hover:bg-volt/10 border border-white/10 hover:border-volt/30 text-zinc-500 hover:text-volt transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">ADD WARM UP SET</span>
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {/* Headers */}
                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  <div className="w-8 sm:w-10 text-center">SET</div>
                  <div className="flex-1 min-w-0 text-center">LBS</div>
                  <div className="flex-1 min-w-0 text-center">REPS</div>
                  <div className="w-10 sm:w-12 text-center">RPE</div>
                  <div className="w-20 sm:w-28 shrink-0 text-center">ACTIONS</div>
                </div>
                
                {sortedSets.map((set: any) => {
                  const isWarmup = set.isWarmup;
                  let setLabel = '';
                  if (isWarmup) {
                    const warmupIdx = sortedSets.filter((s:any) => s.isWarmup).findIndex((s:any) => s.id === set.id);
                    setLabel = `${warmupIdx + 1}`;
                  } else {
                    const workIdx = sortedSets.filter((s:any) => !s.isWarmup).findIndex((s:any) => s.id === set.id);
                    setLabel = `${workIdx + 1}`;
                  }

                  return (
                    <div key={set.id} className={cn(
                      "flex items-center gap-1 sm:gap-2 p-1 sm:p-2 relative rounded",
                      set.isCompleted ? "bg-emerald-500/10" : "bg-white/5"
                    )}>
                      {isWarmup && (
                         <></>
                      )}
                      <div className={cn(
                        "w-8 sm:w-10 shrink-0 text-[10px] font-black uppercase flex items-center justify-center gap-0.5 sm:gap-1 break-keep whitespace-nowrap",
                        isWarmup ? "text-zinc-500" : "text-zinc-500"
                      )}>
                        {isWarmup && <Flame size={10} className="shrink-0" />}
                        <span>{setLabel}</span>
                      </div>

                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                        className="flex-1 w-0 min-w-0 bg-transparent border-b border-white/10 text-center text-sm md:text-lg font-black text-white focus:outline-none focus:border-volt/50 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.reps}
                        onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                        className="flex-1 w-0 min-w-0 bg-transparent border-b border-white/10 text-center text-sm md:text-lg font-black text-white focus:outline-none focus:border-volt/50 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.rpe}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            updateSet(exercise.id, set.id, 'rpe', val);
                          }
                        }}
                        className="w-10 sm:w-12 min-w-0 bg-transparent border-b border-white/10 text-center text-sm md:text-lg font-black text-white focus:outline-none focus:border-volt/50 shrink-0 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="w-20 sm:w-28 shrink-0 flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => { haptics.button(); toggleSetCompletion(exercise.id, set.id); }}
                          className={cn(
                            "w-8 sm:w-10 h-8 sm:h-10 shrink-0 flex items-center justify-center rounded transition-colors border border-white/20",
                            set.isCompleted
                              ? "bg-emerald-500 text-void border-emerald-500"
                              : "bg-surface-container text-zinc-400 hover:text-white"
                          )}
                        >
                          <Check size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => { haptics.button(); removeSet(exercise.id, set.id); }}
                          className="w-8 sm:w-10 h-8 sm:h-10 shrink-0 flex items-center justify-center text-zinc-500 hover:text-crimson bg-surface-container rounded border border-white/20 transition-colors"
                          title={t('workout.remove')}
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {exerciseDefinition && (
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={() => { haptics.button(); setShowInfo(true); }}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-volt transition-colors"
                    >
                        <HelpCircle size={14} />
                        How to do
                    </button>
                    {exerciseDefinition && <ExerciseInfoModal exercise={exerciseDefinition} isOpen={showInfo} onClose={() => setShowInfo(false)} />}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface WorkoutLogProps {
  onBack: () => void;
  onComplete: (avgRpe: number) => void;
  onEndSession: () => void;
}

export const WorkoutLog = ({ onBack, onComplete, onEndSession }: WorkoutLogProps) => {
  const { t, unit, profile, lastVoiceCommand, experimentalFeatures } = useSettings();
  const { showToast } = useToast();
  const { currentSession, updateCurrentSession, history, getCalibrationStatus, calculateProgramCalories, startRestTimer, restRemaining, setRestRemaining, discardSession } = useWorkout();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  const [isCompleting, setIsCompleting] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [showIntensityWarning, setShowIntensityWarning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(() => (currentSession?.startTime ? Date.now() - currentSession.startTime : 0));
  const lastAutoRegToastRef = useRef<{ [key: string]: number }>({});
  const { requestWakeLock, releaseWakeLock, isLocked } = useWakeLock();

  useEffect(() => {
    if (restRemaining !== null && restRemaining > 0) {
      if (!isLocked) {
        requestWakeLock();
      }
    } else {
      if (isLocked) {
        releaseWakeLock();
      }
    }
  }, [restRemaining, isLocked, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Rest timer effect - handled in WorkoutContext

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!currentSession?.startTime) return;
    const updateElapsed = () => {
      setElapsedMs(Date.now() - currentSession.startTime!);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [currentSession?.startTime]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentVolume = (() => {
    if (!currentSession) return 0;
    let volume = 0;
    currentSession.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.isCompleted) {
          volume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }
      });
    });
    return volume;
  })();

  const estimatedCalories = (() => {
    if (!currentSession) return 0;
    const durationMins = elapsedMs / 60000;
    const weightKg = profile?.weight ? (unit === 'imperial' ? profile.weight * 0.453592 : profile.weight) : 75;
    const activeRpe = currentSession.targetRpe || 7;
    return Math.round(calculateProgramCalories(weightKg, durationMins, activeRpe, currentVolume));
  })();

  // Voice command listener for AI Coach
  React.useEffect(() => {
    if (lastVoiceCommand && experimentalFeatures) {
      const text = lastVoiceCommand.text.toLowerCase();
      if (text.includes('coach') || text.includes('surprise me') || text.includes('help')) {
        setIsAICoachOpen(true);
      }
    }
  }, [lastVoiceCommand, experimentalFeatures]);

  if (!currentSession) return null;

  const isWarmupCompleted = currentSession.warmupCompleted || false;
  const isWarmupSkipped = currentSession.warmupSkipped || false;
  const isCooldownCompleted = currentSession.cooldownCompleted || false;
  const isCooldownSkipped = currentSession.cooldownSkipped || false;

  const setIsWarmupCompleted = (val: boolean) => updateCurrentSession({ ...currentSession, warmupCompleted: val });
  const setIsWarmupSkipped = (val: boolean) => updateCurrentSession({ ...currentSession, warmupSkipped: val });
  const setIsCooldownCompleted = (val: boolean) => updateCurrentSession({ ...currentSession, cooldownCompleted: val });
  const setIsCooldownSkipped = (val: boolean) => updateCurrentSession({ ...currentSession, cooldownSkipped: val });

  const exercises = currentSession.exercises || [];
  const completedSets = exercises.flatMap(ex => ex.sets || []).filter(s => s.isCompleted);
  const completedWorkingSets = completedSets.filter(s => !s.isWarmup);
  const currentAvgRpe = completedWorkingSets.length > 0
    ? completedWorkingSets.reduce((acc, s) => acc + parseFloat(s.rpe || '0'), 0) / completedWorkingSets.length
    : 0;

  const handleSwap = (exerciseId: string, newName: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, name: newName };
      }
      return ex;
    }));
    setSwappingExerciseId(null);
    showToast(t('toast.actionSuccessful'), 3000, 'info');
  };

  const getExerciseHistory = (exerciseName: string) => {
    const lastSession = history.find(session =>
      session.exercises?.some(ex => ex.name.toLowerCase() === exerciseName.toLowerCase())
    );
    if (!lastSession) return null;

    const lastEx = lastSession.exercises?.find(ex => ex.name === exerciseName);
    if (!lastEx || !lastEx.sets || lastEx.sets.length === 0) return null;

    // Find best set by volume
    const bestSet = lastEx.sets.reduce((best, current) => {
      const bestVol = (parseFloat(best.weight) || 0) * (parseInt(best.reps) || 0);
      const currentVol = (parseFloat(current.weight) || 0) * (parseInt(current.reps) || 0);
      return currentVol > bestVol ? current : best;
    }, lastEx.sets[0]);

    return `${bestSet.weight}${weightUnit} x ${bestSet.reps}${isTimedExercise(exerciseName) ? ' sec' : ''}`;
  };

  const setExercises = (updater: (prev: Exercise[]) => Exercise[], extraSessionUpdates?: Partial<WorkoutSession>) => {
    const newExercises = updater(exercises);

    // Derived tracking for HUD and TrainingView
    let currentExIdx = 0;
    const foundIdx = newExercises.findIndex(ex => ex.sets.some(s => !s.isCompleted));
    currentExIdx = foundIdx !== -1 ? foundIdx : Math.max(0, newExercises.length - 1);

    const currentSets = newExercises[currentExIdx]?.sets || [];
    const foundSetIdx = currentSets.findIndex(s => !s.isCompleted);
    const currentSetIdx = foundSetIdx !== -1 ? foundSetIdx : Math.max(0, currentSets.length - 1);

    updateCurrentSession({
      ...currentSession,
      ...extraSessionUpdates,
      exercises: newExercises,
      currentExerciseIndex: currentExIdx,
      currentSetIndex: currentSetIdx
    });
  };

  const addExercises = (exerciseNames: string[], groupTitle?: string) => {
    const additionalCount = exercises.filter(ex => ex.isAdditional).length;
    const level = profile?.level || 'untrained';

    let limit = Infinity;
    if (level === 'untrained' || level === 'novice') limit = 3;
    else if (level === 'intermediate') limit = 4;

    if (additionalCount + exerciseNames.length > limit) {
      return;
    }

    const groupId = groupTitle ? Math.random().toString(36).substr(2, 9) : undefined;

    const newExercises: Exercise[] = exerciseNames.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      isAdditional: true,
      groupId,
      groupTitle,
      sets: [
        {
          id: Math.random().toString(36).substr(2, 9),
          weight: '0',
          reps: '0',
          rpe: '0',
          isCompleted: false
        }
      ]
    }));

    setExercises(prev => [...prev, ...newExercises]);
    setIsAddExerciseOpen(false);
    showToast(t('toast.actionSuccessful'), 3000, 'success');
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    setExerciseToRemove(null);
    showToast(t('toast.actionSuccessful'), 3000, 'success');
  };

  const addSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets && ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
        return {
          ...ex,
          sets: [
            ...(ex.sets || []),
            {
              id: Math.random().toString(36).substr(2, 9),
              weight: lastSet?.weight || '0',
              reps: lastSet?.reps || '0',
              rpe: lastSet?.rpe || '0',
              isCompleted: false
            }
          ]
        };
      }
      return ex;
    }));
  };

  const addWarmupSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        // If there are existing sets, find the last warmup set to copy from, otherwise default 0
        const lastWarmup = ex.sets?.slice().reverse().find(s => s.isWarmup);
        const newWarmupSet = {
          id: Math.random().toString(36).substr(2, 9),
          weight: lastWarmup?.weight || '0',
          reps: lastWarmup?.reps || '0',
          rpe: lastWarmup?.rpe || '0',
          isCompleted: false,
          isWarmup: true
        };
        // Add warmup set before the first working set, or at the end if none
        const workingSetIndex = ex.sets?.findIndex(s => !s.isWarmup) ?? -1;
        
        let newSets = [...(ex.sets || [])];
        if (workingSetIndex !== -1) {
          // Find the index of the first working set and insert before it
          // Actually, inserting right before the first working set works well if it's the last warmup
          const insertIndex = workingSetIndex;
          newSets.splice(insertIndex, 0, newWarmupSet);
        } else {
          newSets.push(newWarmupSet);
        }

        return {
          ...ex,
          sets: newSets
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
    showToast(t('toast.actionSuccessful'), 3000, 'success');
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    setExercises(prev => {
      const newExercises = prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, isCompleted: !s.isCompleted } : s)
          };
        }
        return ex;
      });

      // Unified Toast Logic & Overrides
      const newlyCompletedSet = newExercises.find(ex => ex.id === exerciseId)?.sets.find(s => s.id === setId);
      if (newlyCompletedSet?.isCompleted) {
        haptics.success();
        
        // Auto-regulation trigger for toggleSetCompletion
        const exIndex = newExercises.findIndex(e => e.id === exerciseId);
        const ex = newExercises[exIndex];
        const targetRpe = currentSession.targetRpe || 7;
        const actualRpe = parseFloat(newlyCompletedSet.rpe || '');
        
        // Only trigger if completed AND RPE > targetRpe (Overshoot protection)
        if (!isNaN(actualRpe) && actualRpe > targetRpe) {
          const setIndex = ex.sets.findIndex(s => s.id === setId);
          if (setIndex !== -1 && setIndex < ex.sets.length - 1) {
            const actualWeight = parseFloat(newlyCompletedSet.weight) || 0;
            const prescribedWeight = parseFloat(newlyCompletedSet.baseWeight || newlyCompletedSet.weight) || 0;
            const actualReps = parseInt(newlyCompletedSet.reps) || 0;
            const prescribedReps = parseInt(newlyCompletedSet.baseReps || newlyCompletedSet.reps) || 0;

            let weightRatio = 1;
            if (prescribedWeight > 0 && actualWeight > 0) weightRatio = actualWeight / prescribedWeight;
            
            let repFactor = 1;
            if (prescribedReps > 0 && actualReps > 0) repFactor = 1 + (actualReps - prescribedReps) * 0.03;

            const rpeDiff = actualRpe - targetRpe;
            const adjustmentFactor = 1 - (rpeDiff * 0.04);
            let totalFactor = weightRatio * repFactor * adjustmentFactor;

            const isRepFailure = actualReps < prescribedReps && actualReps > 0;
            if (isRepFailure && rpeDiff >= 0) totalFactor *= 0.95;
            if (rpeDiff >= 2) totalFactor *= 0.90;

            // Only apply if it's a downward regulation per user request
            if (totalFactor < 1) {
              let updatedSets = [...ex.sets];
              let setsToKeep = updatedSets.length;
              if (isRepFailure && rpeDiff >= 0) setsToKeep = Math.max(setIndex + 1, updatedSets.length - 1);
              
              updatedSets = updatedSets.slice(0, setsToKeep).map((s, idx) => {
                if (idx > setIndex && !s.isCompleted) {
                  const refWeight = parseFloat(s.baseWeight || s.weight);
                  if (!isNaN(refWeight) && refWeight > 0) {
                    let newWeight = refWeight * totalFactor;
                    if (unit === 'metric') newWeight = Math.round(newWeight / 2.5) * 2.5;
                    else newWeight = Math.round(newWeight / 5) * 5;
                    return { ...s, baseWeight: s.baseWeight || s.weight, weight: Math.max(0, newWeight).toString() };
                  }
                }
                return s;
              });
              newExercises[exIndex] = { ...ex, sets: updatedSets };
              
              // Show toast for autoregulation since it's happening here now too
              showToast(t('toast.autoReg', { direction: t('workout.decreased' as any), rpe: targetRpe }), 5000, 'warning');
            }
          }
        }

        // Auto-scroll logic: 
        // We need to check AFTER state update if all sets for this exercise are done
        const exAfterCompletion = newExercises.find(e => e.id === exerciseId);
        if (exAfterCompletion && exAfterCompletion.sets.every(s => s.isCompleted)) {
            const idx = newExercises.findIndex(e => e.id === exerciseId);
            const nextEx = newExercises[idx + 1];
            if (nextEx) {
                setTimeout(() => {
                    const nextExEl = document.getElementById(`exercise-${nextEx.id}`);
                    nextExEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 500); // Wait for accordion collapse animation
            }
        }

        const totalSets = newExercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
        const completedSets = newExercises.flatMap(ex => ex.sets || []).filter(s => s.isCompleted).length;
        const remainingSets = totalSets - completedSets;

        // Use tactical green success toast
        showToast(t('toast.setCompleted', { remaining: remainingSets }), 3000, 'success');

        // Start rest timer (use exercise specific or 120s default)
        startRestTimer(ex.restPeriod || 120);

        // Set-Level Overrides: Check if first completed set of session is high RPE
        const allCompletedSets = newExercises.flatMap(ex => ex.sets).filter(s => s.isCompleted);
        if (allCompletedSets.length === 1 && !showIntensityWarning) {
          const firstSet = allCompletedSets[0];
          if (parseFloat(firstSet.rpe || '0') >= 9) {
            setShowIntensityWarning(true);
          }
        }
      }

      return newExercises;
    });
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
    let willAutoRegulate = false;
    let autoRegDirection = '';
    let autoRegMessage = '';

    // Predictive check prior to state update for toast logic
    const ex = exercises.find(e => e.id === exerciseId);
    const setIndex = ex?.sets.findIndex(s => s.id === setId) ?? -1;

    if (ex && setIndex !== -1 && (field === 'rpe' || field === 'weight' || field === 'reps')) {
      const currentSet = ex.sets[setIndex];
      const actualRpe = field === 'rpe' ? parseFloat(value) : parseFloat(currentSet.rpe);
      const targetRpe = currentSession.targetRpe || 7;

      // Only trigger TOAST if completed AND over sRPE
      if (currentSet.isCompleted && actualRpe > targetRpe) {
        const actualReps = field === 'reps' ? parseInt(value) : parseInt(currentSet.reps);
        const prescribedReps = parseInt(currentSet.baseReps || currentSet.reps) || 0;

        const actualWeight = field === 'weight' ? parseFloat(value) : parseFloat(currentSet.weight);
        const prescribedWeight = parseFloat(currentSet.baseWeight || currentSet.weight) || 0;

        // 1. FAIL DETECTION: Stopped early
        const isRepFailure = actualReps < prescribedReps && actualReps > 0;
        
        // 2. OVERSHOOT DETECTION: Hit reps but too hard
        const rpeDiff = actualRpe - targetRpe;
        const isSevereOvershoot = rpeDiff >= 2;

        if (!isNaN(actualRpe)) {
          let weightRatio = 1;
          if (prescribedWeight > 0 && actualWeight > 0) {
            weightRatio = actualWeight / prescribedWeight;
          }

          let repFactor = 1;
          if (prescribedReps > 0 && actualReps > 0) {
            repFactor = 1 + (actualReps - prescribedReps) * 0.03;
          }

          const adjustmentFactor = 1 - (rpeDiff * 0.04);
          let totalFactor = weightRatio * repFactor * adjustmentFactor;

          // TACTICAL AUDIBLE: Volume Truncation on Failure
          if (isRepFailure && rpeDiff >= 0) {
            totalFactor *= 0.95; // Extra 5% drop for stalling
            autoRegMessage = "RECOVERY CEILING HIT. TRUNCATING REMAINING VOLUME.";
          }

          // TACTICAL AUDIBLE: CNS Tax on Severe Overshoot
          if (isSevereOvershoot) {
            totalFactor *= 0.90; // Aggressive drop
            autoRegMessage = "CRITICAL CNS STRAIN. SCALING INTENSITY TO PREVENT INJURY.";
          }

          // Apply changes if intensity is off or parameters modified
          if (totalFactor < 0.99 || isRepFailure) {
            // Check if at least ONE future set weight will actually change after rounding
            let anyWeightChanges = false;
            
            for (let i = setIndex + 1; i < ex.sets.length; i++) {
              const s = ex.sets[i];
              if (!s.isCompleted) {
                const referenceWeightLocal = parseFloat(s.baseWeight || s.weight);
                if (!isNaN(referenceWeightLocal) && referenceWeightLocal > 0) {
                  let newWeight = referenceWeightLocal * totalFactor;
                  if (unit === 'metric') {
                    newWeight = Math.round(newWeight / 2.5) * 2.5;
                  } else {
                    newWeight = Math.round(newWeight / 5) * 5;
                  }
                  newWeight = Math.max(0, newWeight);

                  if (Math.abs(newWeight - (parseFloat(s.weight) || 0)) > 0.1) {
                    anyWeightChanges = true;
                    break;
                  }
                }
              }
            }

            if (anyWeightChanges || (isRepFailure && rpeDiff >= 0)) {
              willAutoRegulate = true;
              autoRegDirection = 'decreased';
            }
          }
        }
      }
    }

    const isSevereOvershootMaster = (() => {
      const ex = exercises.find(e => e.id === exerciseId);
      if (!ex || field !== 'rpe') return false;
      const currentSet = ex.sets.find(s => s.id === setId);
      const actualRpe = parseFloat(value);
      const targetRpe = currentSession.targetRpe || 7;
      // Only systemic reduce if completed set is severe overshoot
      return !isNaN(actualRpe) && currentSet?.isCompleted && (actualRpe - targetRpe >= 2);
    })();

    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        let updatedSets = ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
        
        // Carry over weight and reps to future uncompleted sets
        const setIndex = updatedSets.findIndex(s => s.id === setId);
        if (setIndex !== -1 && (field === 'weight' || field === 'reps')) {
          const newValue = value;
          const currentIsWarmup = ex.sets[setIndex].isWarmup;
          updatedSets = updatedSets.map((s, idx) => {
            // Decouple warmup sets from work sets for manual carry-over
            if (idx >= setIndex && !s.isCompleted && s.isWarmup === currentIsWarmup) {
              return { 
                ...s, 
                [field]: newValue,
                // Update base values to match manual input so future autoreg stays proportional to new baseline
                ...(field === 'weight' ? { baseWeight: newValue } : {}),
                ...(field === 'reps' ? { baseReps: newValue } : {})
              };
            }
            return s;
          });
        }

        // Autoregulation implementation (Feedback Loop)
        const currentSet = updatedSets.find(s => s.id === setId);
        const actualRpe = parseFloat(currentSet?.rpe || '');
        const targetRpe = currentSession.targetRpe || 7;

        // FEEDBACK TRIGGER: Only if completed AND over sRPE
        if (!isNaN(actualRpe) && currentSet?.isCompleted && actualRpe > targetRpe) {
          const setIndex = updatedSets.findIndex(s => s.id === setId);

          if (setIndex !== -1 && setIndex < updatedSets.length - 1) {
            const actualWeight = parseFloat(currentSet?.weight || '0') || 0;
            const prescribedWeight = parseFloat(currentSet?.baseWeight || currentSet?.weight || '0') || 0;

            const actualReps = parseInt(currentSet?.reps || '0') || 0;
            const prescribedReps = parseInt(currentSet?.baseReps || currentSet?.reps || '0') || 0;

            let weightRatio = 1;
            if (prescribedWeight > 0 && actualWeight > 0) {
              weightRatio = actualWeight / prescribedWeight;
            }

            let repFactor = 1;
            if (prescribedReps > 0 && actualReps > 0) {
              repFactor = 1 + (actualReps - prescribedReps) * 0.03;
            }

            const rpeDiff = actualRpe - targetRpe;
            const adjustmentFactor = 1 - (rpeDiff * 0.04);
            let totalFactor = weightRatio * repFactor * adjustmentFactor;

            const isRepFailure = actualReps < prescribedReps && actualReps > 0;
            if (isRepFailure && rpeDiff >= 0) totalFactor *= 0.95;
            if (rpeDiff >= 2) totalFactor *= 0.90;

            // Only downward regulation (Overshoot protection)
            if (totalFactor < 1) {
              // Volume Truncation check
              let setsToKeep = updatedSets.length;
              if (isRepFailure && rpeDiff >= 0) {
                // If failed a set at target intensity, drop LAST set
                setsToKeep = Math.max(setIndex + 1, updatedSets.length - 1);
              }

              updatedSets = updatedSets.slice(0, setsToKeep).map((s, idx) => {
                // Adjust only remaining, uncompleted sets
                if (idx > setIndex && !s.isCompleted) {
                  const referenceWeightLocal = parseFloat(s.baseWeight || s.weight);
                  if (!isNaN(referenceWeightLocal) && referenceWeightLocal > 0) {
                    let newWeight = referenceWeightLocal * totalFactor;
                    // Rounding rules based on unit
                    if (unit === 'metric') {
                      newWeight = Math.round(newWeight / 2.5) * 2.5;
                    } else {
                      newWeight = Math.round(newWeight / 5) * 5;
                    }
                    newWeight = Math.max(0, newWeight);

                    return {
                      ...s,
                      baseWeight: s.baseWeight || s.weight,
                      baseReps: s.baseReps || s.reps,
                      weight: newWeight.toString()
                    };
                  }
                }
                return s;
              });
            }
          }
        }

        return {
          ...ex,
          sets: updatedSets
        };
      }
      
      // Apply systemic reduction to other exercises if severe overshoot detected
      if (isSevereOvershootMaster) {
        const currentIndex = prev.findIndex(e => e.id === exerciseId);
        const thisIndex = prev.findIndex(e => e.id === ex.id);
        
        // Only apply to subsequent exercises that aren't fully completed
        if (thisIndex > currentIndex) {
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.isCompleted) return s;
              const refWeight = parseFloat(s.baseWeight || s.weight);
              if (isNaN(refWeight) || refWeight <= 0) return s;
              
              let newWeight = refWeight * 0.92; // 8% systemic tax
              if (unit === 'metric') newWeight = Math.round(newWeight / 2.5) * 2.5;
              else newWeight = Math.round(newWeight / 5) * 5;
              
              return {
                ...s,
                baseWeight: s.baseWeight || s.weight,
                weight: Math.max(0, newWeight).toString()
              };
            })
          };
        }
      }
      
      return ex;
    }), isSevereOvershootMaster ? { systemicFatigueModifier: 0.92 } : undefined);

    if (willAutoRegulate) {
      const toastKey = `${exerciseId}-${setId}`;
      const now = Date.now();
      const lastTrigger = lastAutoRegToastRef.current[toastKey] || 0;

      // Only show if haven't shown for this set in the last 1 second
      if (now - lastTrigger > 1000) {
        lastAutoRegToastRef.current[toastKey] = now;
        const targetRpe = currentSession.targetRpe || 7;
        const toastType = autoRegDirection === 'decreased' ? 'warning' : 'success';
        const message = autoRegMessage || t('toast.autoReg', { direction: t(`workout.${autoRegDirection}` as any), rpe: targetRpe });
        showToast(message, 5000, toastType);
      }
    }
  };

  const hasRpeErrors = exercises.some(ex =>
    ex.sets && ex.sets.some(s => s.rpe !== '' && (parseInt(s.rpe) < 1 || parseInt(s.rpe) > 10))
  );

  const handleComplete = () => {
    if (hasRpeErrors) return;
    setIsCompleting(true);

    // Calculate average RPE of completed sets
    const completedSets = exercises.flatMap(ex => ex.sets || []).filter(s => s.isCompleted);
    const completedWorkingSets = completedSets.filter(s => !s.isWarmup);
    const avgRpe = completedWorkingSets.length > 0
      ? completedWorkingSets.reduce((acc, s) => acc + parseFloat(s.rpe || '0'), 0) / completedWorkingSets.length
      : (completedSets.length > 0 ? completedSets.reduce((acc, s) => acc + parseFloat(s.rpe || '0'), 0) / completedSets.length : 8.0); // Fallback to all sets or 8.0

    setTimeout(() => {
      onComplete(avgRpe);
    }, 800);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-5xl mx-auto h-full flex flex-col pt-4 md:pt-8 pb-12 md:px-8"
      >
        {/* Header */}
        <div className="flex flex-col md:mb-12 gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={onBack}
              className="p-2.5 md:p-3 bg-surface-container-low hover:bg-surface-container-high text-zinc-400 hover:text-white transition-all"
            >
              <ChevronLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <div className="flex items-center gap-3">
              <ClipboardList className="text-volt" size={16} />
              <span className="text-volt font-sans text-[10px] font-black uppercase tracking-widest">{t('workout.missionLog')}</span>
            </div>
          </div>

          <div>
            <h1 className="font-sans text-3xl md:text-4xl font-black uppercase italic tracking-tight">{currentSession.title}</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 p-4 y-4 bg-surface-container-low">
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                {t('analysis.readiness')} <InfoTooltip term="Readiness" />
              </span>
              <span className={cn(
                "font-black tracking-tighter text-white text-xl md:text-2xl italic",
                getCalibrationStatus().readiness >= 85 ? "text-emerald-500" :
                  getCalibrationStatus().readiness >= 60 ? "text-amber-500" : "text-crimson"
              )}>{getCalibrationStatus().readiness}%</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                {t('workout.targetRpe')} <InfoTooltip term="sRPE" />
              </span>
              <span className="font-black text-white text-xl md:text-2xl italic">{currentSession.targetRpe || '–'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                {t('workout.time')} <Clock size={12} className="md:w-3.5 md:h-3.5" />
              </span>
              <span className="font-black text-white text-xl md:text-2xl italic">{formatDuration(elapsedMs)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                {t('workout.estBurn')} <Flame size={12} className="md:w-3.5 md:h-3.5" />
              </span>
              <span className="font-black text-white text-xl md:text-2xl italic">{estimatedCalories} {t('workout.kcal')}</span>
            </div>
          </div>
        </div>

        {/* Intensity Warning Banner */}
        <AnimatePresence>
          {showIntensityWarning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-4 bg-crimson/10 border border-crimson/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-crimson shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-[10px] text-crimson font-black uppercase tracking-widest">{t('workout.highIntensityDetected')}</p>
                    <p className="text-[10px] text-zinc-300 font-bold uppercase">
                      {t('workout.highIntensityDesc')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIntensityWarning(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warm-up Section */}
        {currentSession.exercises.length > 0 && (
          <RoutineCard
            routine={getWarmupForLift(currentSession.exercises[0].name)}
            onSkip={() => setIsWarmupSkipped(true)}
            onDone={() => setIsWarmupCompleted(!isWarmupCompleted)}
            isCompleted={isWarmupCompleted}
            isSkipped={isWarmupSkipped}
            t={t}
          />
        )}

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 md:space-y-12 pb-12">
          {(() => {
            const renderedGroups = new Set<string>();

            return exercises.map((exercise) => {
              if (exercise.groupId && renderedGroups.has(exercise.groupId)) return null;

              const isGrouped = !!exercise.groupId;
              if (isGrouped) renderedGroups.add(exercise.groupId!);

              const groupExercises = isGrouped
                ? exercises.filter(ex => ex.groupId === exercise.groupId)
                : [exercise];

              return (
                <div key={isGrouped ? exercise.groupId : exercise.id} className={cn(
                  "space-y-6",
                  isGrouped && "bg-volt/5 p-6 md:p-10 border border-volt/10"
                )}>
                  {isGrouped && (
                    <div className="flex items-center gap-3 mb-8">
                      <RefreshCw className="text-volt animate-spin-slow" size={20} />
                      <h2 className="font-sans text-2xl md:text-3xl font-black uppercase italic tracking-tight text-volt">
                        {t('workout.circuit')}: {exercise.groupTitle || t('workout.tacticalGroup')}
                      </h2>
                    </div>
                  )}

                  <div className="space-y-12">
                    {groupExercises.map((ex) => (
                      <ExerciseAccordion
                        key={ex.id}
                        exercise={ex}
                        updateSet={updateSet}
                        toggleSetCompletion={toggleSetCompletion}
                        removeSet={removeSet}
                        addSet={addSet}
                        addWarmupSet={addWarmupSet}
                        setSwappingExerciseId={setSwappingExerciseId}
                        setExerciseToRemove={setExerciseToRemove}
                        getExerciseName={getExerciseName}
                        getExerciseHistory={getExerciseHistory}
                        weightUnit={weightUnit}
                        t={t}
                        isDumbbell={isDumbbell}
                      />
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Add Exercise Button */}
        <div className="flex flex-col items-center gap-4">
          {(() => {
            const additionalCount = exercises.filter(ex => ex.isAdditional).length;
            const level = profile?.level || 'untrained';
            let limit = Infinity;
            if (level === 'untrained' || level === 'novice') limit = 3;
            else if (level === 'intermediate') limit = 4;
            const isAtLimit = additionalCount >= limit;

            return (
              <>
                <button
                  onClick={() => !isAtLimit && setIsAddExerciseOpen(true)}
                  disabled={isAtLimit}
                  className={cn(
                    "w-full py-4 group",
                    isAtLimit
                      ? "btn-secondary opacity-50 cursor-not-allowed"
                      : "btn-secondary"
                  )}
                >
                  <PlusCircle size={18} className={cn(!isAtLimit && "group-hover:scale-110 transition-transform")} />
                  <span>{t('workout.addExercise')} {limit !== Infinity && `(${additionalCount}/${limit})`}</span>
                </button>
                {isAtLimit && (
                  <p className="text-[8px] font-bold uppercase tracking-widest text-crimson animate-pulse">
                    {t('workout.maxExercises').replace('{level}', t(`onboarding.level.${level}`))}
                  </p>
                )}
              </>
            );
          })()}
        </div>

        {/* Cool-down Section */}
        <RoutineCard
          routine={COOL_DOWN_ROUTINE}
          onSkip={() => setIsCooldownSkipped(true)}
          onDone={() => setIsCooldownCompleted(!isCooldownCompleted)}
          isCompleted={isCooldownCompleted}
          isSkipped={isCooldownSkipped}
          t={t}
        />

        {/* Footer Action - Moved inside scrollable area at the bottom */}
        <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 pb-24 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEndConfirmOpen(true)}
            className="w-full md:w-auto px-8 py-4 md:py-5 border border-crimson/30 text-crimson hover:bg-crimson hover:text-white transition-all flex items-center justify-center gap-3 font-headline text-xs md:text-sm font-black uppercase tracking-widest"
          >
            <XCircle size={18} className="md:w-5 md:h-5" />
            <span>{t('workout.endSession')}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            animate={isCompleting ? {
              scale: [1, 0.9, 1.1, 1],
              backgroundColor: ['var(--primary-color)', '#ffffff', '#00ff88', 'var(--primary-color)'],
              boxShadow: [
                '0 0 30px var(--primary-glow)',
                '0 0 60px rgba(255,255,255,0.8)',
                '0 0 100px rgba(0,255,136,1)',
                '0 0 30px var(--primary-glow)'
              ]
            } : {}}
            onClick={handleComplete}
            disabled={isCompleting || hasRpeErrors}
            className={cn(
              "group relative w-full md:w-auto px-8 md:px-12 py-4 md:py-5 font-headline text-xs md:text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 overflow-hidden",
              (isCompleting || hasRpeErrors) ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-volt text-void hover:bg-white shadow-[0_0_30px_var(--primary-glow)]"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <AnimatePresence mode="wait">
              {isCompleting ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1.5, rotate: 0 }}
                  className="text-void"
                >
                  <Check size={24} className="md:w-7 md:h-7" strokeWidth={4} />
                </motion.div>
              ) : (
                <motion.div
                  key="check"
                  initial={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={20} strokeWidth={3} className="md:w-6 md:h-6 group-hover:scale-125 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
            <span>{isCompleting ? t('workout.sessionComplete') : t('workout.completeSession')}</span>
          </motion.button>
        </div>
      </motion.div>
      <ConfirmationModal
        isOpen={isEndConfirmOpen}
        title={t('workout.endSessionTitle')}
        message=""
        confirmLabel={t('workout.endSessionConfirm')}
        cancelLabel={t('workout.stay')}
        onConfirm={() => {
          setIsEndConfirmOpen(false);
          onEndSession();
        }}
        onCancel={() => setIsEndConfirmOpen(false)}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={!!exerciseToRemove}
        title={t('workout.removeExerciseTitle')}
        message={t('workout.removeExerciseMsg')}
        confirmLabel={t('workout.remove')}
        cancelLabel={t('workout.keep')}
        onConfirm={() => exerciseToRemove && removeExercise(exerciseToRemove)}
        onCancel={() => setExerciseToRemove(null)}
        variant="danger"
      />

      {/* AI Coach Floating Button */}
      {experimentalFeatures && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAICoachOpen(true)}
            className="fixed bottom-24 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 bg-volt text-void shadow-[0_0_30px_var(--primary-glow)] flex items-center justify-center z-40 group"
          >
            <Bot size={28} className="md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-void text-volt text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest border border-volt">EXP</span>
          </motion.button>

          <AICoach isOpen={isAICoachOpen} onClose={() => setIsAICoachOpen(false)} />
        </>
      )}

      {/* Floating Rest Timer */}
      <AnimatePresence>
        {restRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 md:right-10 z-[100]"
          >
            <div className="bg-void/95 backdrop-blur-xl border border-volt/30 p-3 shadow-[0_0_40px_rgba(0,182,255,0.2)] flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-volt mb-0.5">
                  <Timer size={10} className="animate-pulse" />
                  <span className="text-[7px] font-black uppercase tracking-[0.2em]">{t('workout.restTime')}</span>
                </div>
                <div className="text-2xl font-black italic text-white font-mono leading-none">
                  {formatRestTime(restRemaining)}
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="flex gap-1">
                <button 
                  onClick={() => setRestRemaining(prev => Math.max(0, (prev || 0) - 30))}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black border border-white/10 transition-colors"
                >
                  -30S
                </button>
                <button 
                  onClick={() => setRestRemaining(prev => (prev || 0) + 30)}
                  className="px-2 py-1.5 bg-volt/10 hover:bg-volt/20 text-volt text-[9px] font-black border border-volt/20 transition-colors font-mono"
                >
                  +30S
                </button>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <button 
                onClick={() => setRestRemaining(null)}
                className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors px-1"
              >
                SKIP
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Exercise Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {swappingExerciseId && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSwappingExerciseId(null)}
                className="absolute inset-0 bg-void/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <RefreshCw className="text-volt" size={24} />
                  <h2 className="font-sans text-2xl font-black uppercase italic tracking-tight">{t('workout.swapExercise')}</h2>
                </div>

                <p className="text-zinc-400 text-sm mb-8">
                  {t('workout.swapDesc').replace('{exercise}', exercises.find(ex => ex.id === swappingExerciseId)?.name || '')}
                </p>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
                  {getSwappableExercises(exercises.find(ex => ex.id === swappingExerciseId)?.name || '').map((alt) => (
                    <button
                      key={alt.name}
                      onClick={() => handleSwap(swappingExerciseId, alt.name)}
                      className="w-full p-4 bg-surface-container-low border-none hover:bg-surface-container-high text-left transition-all group"
                    >
                      <div className="font-sans text-lg font-black uppercase italic tracking-tight group-hover:text-volt transition-colors">
                        {alt.name}
                      </div>
                    </button>
                  ))}
                  {getSwappableExercises(exercises.find(ex => ex.id === swappingExerciseId)?.name || '').length === 0 && (
                    <div className="text-center py-8 text-zinc-600 italic text-sm">
                      {t('workout.noAltsFound')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSwappingExerciseId(null)}
                  className="w-full mt-8 py-4 border-none text-zinc-500 font-sans text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
                >
                  {t('workout.cancel')}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Add Exercise Modal */}
      <ExerciseSelectorModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelect={addExercises}
      />
    </>
  );
};
