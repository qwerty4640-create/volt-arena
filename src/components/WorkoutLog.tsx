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
  Flame,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { useSettings } from '../contexts/SettingsContext';
import { cn, isDumbbell } from '../lib/utils';
import { useWorkout, Exercise, Set as WorkoutSet } from '../contexts/WorkoutContext';
import { getExerciseName } from '../utils/workoutUtils';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';
import { getSwappableExercises } from '../constants/exercises';
import { AICoach } from './AICoach';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';
import { getWarmupForLift, COOL_DOWN_ROUTINE, RoutineProtocol } from '../data/warmupLibrary';

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
        onClick={() => setIsExpanded(!isExpanded)}
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
            onClick={onDone}
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
              onClick={onSkip}
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

const ExerciseSetsCarousel = ({
  exercise, updateSet, toggleSetCompletion, removeSet, addSet, weightUnit, t, isDumbbell
}: any) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= exercise.sets.length && exercise.sets.length > 0) {
      setActiveIndex(exercise.sets.length - 1);
    }
  }, [exercise.sets.length, activeIndex]);

  if (exercise.sets.length === 0) return null;

  const handleNext = () => {
    if (activeIndex < exercise.sets.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };
  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1);
  };

  const handleSkip = (setId: string) => {
    removeSet(exercise.id, setId);
  };

  const handleDone = (setId: string, isCompleted: boolean) => {
    toggleSetCompletion(exercise.id, setId);
    if (!isCompleted && activeIndex < exercise.sets.length - 1) {
      setTimeout(() => handleNext(), 300);
    }
  };

  return (
    <div className="relative w-full h-[300px] md:h-[340px] perspective-1000">
      <AnimatePresence initial={false}>
        {exercise.sets.slice(activeIndex, activeIndex + 3).map((set, index) => {
          const isTop = index === 0;
          const displayIndex = exercise.sets.findIndex((s: any) => s.id === set.id);

          return (
            <motion.div
              key={set.id}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_: any, info: any) => {
                if (info.offset.x > 100) handlePrev();
                else if (info.offset.x < -100) handleNext();
              }}
              style={{
                position: 'absolute',
                top: index * 8,
                left: index * 4,
                right: index * 4,
                zIndex: 10 - index,
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{
                opacity: 1 - index * 0.25,
                scale: 1 - index * 0.04,
                y: 0
              }}
              exit={{ opacity: 0, x: -200, transition: { duration: 0.3 } }}
              className={cn(
                "glass-panel overflow-hidden bg-zinc-950 border border-volt/20 p-4 md:p-6 shadow-lg h-full flex flex-col",
                !isTop && "pointer-events-none"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Set {displayIndex + 1} of {exercise.sets.length}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrev} disabled={activeIndex === 0} className="p-2 text-zinc-400 hover:text-white disabled:opacity-10 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={handleNext} disabled={activeIndex === exercise.sets.length - 1} className="p-2 text-zinc-400 hover:text-white disabled:opacity-10 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-6 flex-1">
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                    {t('workout.weight')} {isDumbbell(exercise.name) ? `(${t('workout.perSide')})` : `(${weightUnit})`}
                  </span>
                  <input
                    type="text"
                    value={set.weight}
                    onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                    className="bg-surface-container-lowest border border-white/5 px-2 py-4 font-sans text-xl md:text-3xl font-black text-white focus:outline-none focus:border-volt/50 transition-colors w-full text-center"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">{t('workout.reps')}</span>
                  <input
                    type="text"
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                    className="bg-surface-container-lowest border border-white/5 px-2 py-4 font-sans text-xl md:text-3xl font-black text-white focus:outline-none focus:border-volt/50 transition-colors w-full text-center"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">{t('workout.rpe')}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={set.rpe}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        updateSet(exercise.id, set.id, 'rpe', val);
                      }
                    }}
                    className="bg-surface-container-lowest border border-white/5 px-2 py-4 font-sans text-xl md:text-3xl font-black text-white focus:outline-none focus:border-volt/50 transition-colors w-full text-center"
                  />
                </div>
              </div>

              <div className="flex gap-3 relative z-10 mt-auto">
                <button
                  onClick={() => handleDone(set.id, set.isCompleted)}
                  className={cn(
                    "flex-1 py-4 font-headline text-[10px] md:text-xs font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2",
                    set.isCompleted ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50" : "bg-volt/10 text-white hover:bg-volt/20 border border-volt/20"
                  )}
                >
                  <Check size={16} strokeWidth={3} /> {set.isCompleted ? 'COMPLETED' : 'DONE'}
                </button>
                <button
                  onClick={() => handleSkip(set.id)}
                  className="px-6 py-4 bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 font-headline text-[10px] md:text-xs font-black uppercase tracking-widest transition-all rounded"
                >
                  SKIP
                </button>
              </div>
            </motion.div>
          );
        })}
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
  const { currentSession, updateCurrentSession, history, getCalibrationStatus, calculateProgramCalories } = useWorkout();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  const [isCompleting, setIsCompleting] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [showIntensityWarning, setShowIntensityWarning] = useState(false);
  const [isWarmupCompleted, setIsWarmupCompleted] = useState(false);
  const [isWarmupSkipped, setIsWarmupSkipped] = useState(false);
  const [isCooldownCompleted, setIsCooldownCompleted] = useState(false);
  const [isCooldownSkipped, setIsCooldownSkipped] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const lastAutoRegToastRef = useRef<{ [key: string]: number }>({});

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

  const exercises = currentSession.exercises || [];
  const completedSets = exercises.flatMap(ex => ex.sets || []).filter(s => s.isCompleted);
  const currentAvgRpe = completedSets.length > 0
    ? completedSets.reduce((acc, s) => acc + parseFloat(s.rpe || '0'), 0) / completedSets.length
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

    return `${bestSet.weight}${weightUnit} x ${bestSet.reps}`;
  };

  const setExercises = (updater: (prev: Exercise[]) => Exercise[]) => {
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
        const totalSets = newExercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
        const completedSets = newExercises.flatMap(ex => ex.sets || []).filter(s => s.isCompleted).length;
        const remainingSets = totalSets - completedSets;

        // Use tactical green success toast
        showToast(t('toast.setCompleted', { remaining: remainingSets }), 3000, 'success');

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

    // Predictive check prior to state update for toast logic
    const ex = exercises.find(e => e.id === exerciseId);
    const setIndex = ex?.sets.findIndex(s => s.id === setId) ?? -1;

    if (ex && setIndex !== -1 && (field === 'rpe' || field === 'weight' || field === 'reps')) {
      const currentSet = ex.sets[setIndex];
      const actualRpe = field === 'rpe' ? parseFloat(value) : parseFloat(currentSet.rpe);
      const targetRpe = currentSession.targetRpe || 7;

      if (!isNaN(actualRpe) && setIndex < ex.sets.length - 1) {
        const actualWeight = field === 'weight' ? parseFloat(value) : parseFloat(currentSet.weight);
        const prescribedWeight = parseFloat(currentSet.baseWeight || currentSet.weight) || 0;

        const actualReps = field === 'reps' ? parseInt(value) : parseInt(currentSet.reps);
        const prescribedReps = parseInt(currentSet.baseReps || currentSet.reps) || 0;

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
        const totalFactor = weightRatio * repFactor * adjustmentFactor;

        // Apply changes if intensity is off or parameters modified
        if (Math.abs(rpeDiff) >= 0.5 || Math.abs(weightRatio - 1) > 0.01 || Math.abs(repFactor - 1) > 0.01) {
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

          if (anyWeightChanges) {
            if (totalFactor < 0.98) {
              willAutoRegulate = true;
              autoRegDirection = 'decreased';
            } else if (totalFactor > 1.02) {
              willAutoRegulate = true;
              autoRegDirection = 'increased';
            }
          }
        }
      }
    }

    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        let updatedSets = ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);

        // Autoregulation implementation
        const currentSet = updatedSets.find(s => s.id === setId);
        const actualRpe = parseFloat(currentSet?.rpe || '');
        const targetRpe = currentSession.targetRpe || 7;

        if (!isNaN(actualRpe)) {
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
            const totalFactor = weightRatio * repFactor * adjustmentFactor;

            if (Math.abs(rpeDiff) >= 0.5 || Math.abs(weightRatio - 1) > 0.01 || Math.abs(repFactor - 1) > 0.01) {
              updatedSets = updatedSets.map((s, idx) => {
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
      return ex;
    }));

    if (willAutoRegulate) {
      const toastKey = `${exerciseId}-${setId}`;
      const now = Date.now();
      const lastTrigger = lastAutoRegToastRef.current[toastKey] || 0;

      // Only show if haven't shown for this set in the last 1 second
      if (now - lastTrigger > 1000) {
        lastAutoRegToastRef.current[toastKey] = now;
        const targetRpe = currentSession.targetRpe || 7;
        const toastType = autoRegDirection === 'decreased' ? 'warning' : 'success';
        showToast(t('toast.autoReg', { direction: t(`workout.${autoRegDirection}` as any), rpe: targetRpe }), 5000, toastType);
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
    const avgRpe = completedSets.length > 0
      ? completedSets.reduce((acc, s) => acc + parseFloat(s.rpe || '0'), 0) / completedSets.length
      : 8.0; // Default if none completed

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
                      <div key={ex.id} className="space-y-4 md:space-y-6">
                        <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-volt/10 flex items-center justify-center text-volt shrink-0">
                              <Dumbbell size={16} className="md:w-5 md:h-5" />
                            </div>
                            <h3 className="font-sans text-xl md:text-2xl font-black uppercase italic tracking-tight">{getExerciseName(ex, t)}</h3>
                          </div>

                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => setSwappingExerciseId(ex.id)}
                              className="flex-1 p-2 bg-surface-container-low hover:bg-volt/10 text-volt hover:text-volt transition-all flex items-center justify-center gap-2 group"
                              title={t('workout.swapExercise')}
                            >
                              <RefreshCw size={12} className="md:w-3.5 md:h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{t('workout.swap')}</span>
                            </button>

                            <button
                              onClick={() => setExerciseToRemove(ex.id)}
                              className="flex-1 p-2 bg-surface-container-low hover:bg-crimson/10 text-crimson hover:text-crimson transition-all flex items-center justify-center gap-2 group"
                              title={t('workout.removeExerciseTitle')}
                            >
                              <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{t('workout.remove')}</span>
                            </button>

                            <div className="flex-[2] flex items-center justify-start text-zinc-500 h-full pl-2 min-w-0">
                              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest truncate">
                                {t('workout.history')}: {getExerciseHistory(ex.name) || '–'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add Set Button - Full Width */}
                        <button
                          onClick={() => addSet(ex.id)}
                          className="w-full py-3 mb-4 bg-white/5 hover:bg-volt/10 border border-white/10 hover:border-volt/30 text-zinc-500 hover:text-volt transition-all flex items-center justify-center gap-2 group"
                        >
                          <Plus size={16} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('workout.addSet')}</span>
                        </button>

                        {/* Set Carousel UI */}
                        <ExerciseSetsCarousel
                          exercise={ex}
                          updateSet={updateSet}
                          toggleSetCompletion={toggleSetCompletion}
                          removeSet={removeSet}
                          addSet={addSet}
                          weightUnit={weightUnit}
                          t={t}
                          isDumbbell={isDumbbell}
                        />
                      </div>
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
