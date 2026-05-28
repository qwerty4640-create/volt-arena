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
  Timer,
  GripVertical
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { useSettings } from '../contexts/SettingsContext';
import { cn, isDumbbell } from '../lib/utils';
import { useWorkout, Exercise, Set as WorkoutSet, WorkoutSession } from '../contexts/WorkoutContext';
import { getExerciseName, isTimedExercise, isUnilateral } from '../utils/workoutUtils';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';
import { getSwappableExercises, EXERCISE_DATABASE } from '../constants/exercises';
import { ExerciseSwapModal } from './ExerciseSwapModal';
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
  const [isExpanded, setIsExpanded] = useState(!isCompleted);

  useEffect(() => {
    if (isCompleted) {
      setIsExpanded(false);
    }
  }, [isCompleted]);

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
          <h3 className="font-sans text-xl md:text-2xl font-black uppercase tracking-tight text-white">{routine.title}</h3>
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
  isDumbbell,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggingId,
  draggedOverId,
  draggingGroupId
}: any) => {
  const { profile } = useSettings();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const exerciseDefinition = EXERCISE_DATABASE.find(e => e.name === exercise.name);
  const unilateral = isUnilateral(exercise.name);
  const dumbbell = isDumbbell(exercise.name);
  const showPerSide = unilateral || dumbbell;
  const weightLabel = showPerSide ? `${weightUnit} PER SIDE` : weightUnit;
  // Apply calisthenics label specifically if isCalisthenics is true
  const displayWeightLabel = exerciseDefinition?.isCalisthenics ? `${weightUnit} + Bodyweight` : weightLabel;

  useEffect(() => {
    if (exercise.sets.every((set: any) => set.isCompleted)) {
      setIsExpanded(false);
    }
  }, [exercise.sets]);

  const sortedSets = [...exercise.sets].sort((a, b) => {
    if (a.isWarmup === b.isWarmup) return 0;
    return a.isWarmup ? -1 : 1;
  });

  const isCurrentlyDragged = draggingId === exercise.id;
  const isCurrentDragOver = draggedOverId === exercise.id && draggingGroupId === exercise.groupId && draggingId !== exercise.id;

  return (
    <div
      id={`exercise-${exercise.id}`}
      draggable={!!exercise.groupId}
      onDragStart={(e) => {
        if (!exercise.groupId) return;
        onDragStart?.(e, exercise.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (!exercise.groupId || draggingGroupId !== exercise.groupId) return;
        onDragOver?.(e, exercise.id);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (!exercise.groupId || draggingGroupId !== exercise.groupId) return;
        onDrop?.(e, exercise.id);
      }}
      className={cn(
        "glass-panel overflow-hidden bg-zinc-950 border transition-all duration-200 shadow-lg",
        isCurrentlyDragged ? "opacity-35 scale-[0.98] border-dashed border-zinc-700" : "border-white/5",
        isCurrentDragOver ? "border-volt ring-2 ring-volt/20 translate-y-1" : ""
      )}
    >
      <div
        onClick={() => { haptics.button(); setIsExpanded(!isExpanded); }}
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {exercise.groupId && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="text-zinc-500 hover:text-volt cursor-grab active:cursor-grabbing p-1 -ml-1 transition-colors shrink-0 flex items-center justify-center"
                title="Drag to reorder within circuit"
              >
                <GripVertical size={16} />
              </div>
            )}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-volt/10 flex items-center justify-center text-volt shrink-0">
              <Dumbbell size={16} className="md:w-5 md:h-5" />
            </div>
            <h3 className="font-sans text-xl md:text-2xl font-black uppercase tracking-tight">{getExerciseName(exercise, t)}</h3>
          </div>
          {exercise.intent && (
            <div className="pl-[2.75rem] md:pl-[3.25rem]">
              <span className="inline-block px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] font-black uppercase tracking-widest">{exercise.intent}</span>
            </div>
          )}
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
            <div className="p-4 space-y-4 md:p-6">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => { haptics.button(); setSwappingExerciseId(exercise.id); }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:border-volt/30 hover:bg-volt/10 text-volt transition-all flex items-center justify-center gap-2 group"
                >
                  <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('workout.swap')}</span>
                </button>
                <button
                  onClick={() => { haptics.button(); setExerciseToRemove(exercise.id); }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:border-crimson/30 hover:bg-crimson/10 text-crimson transition-all flex items-center justify-center gap-2 group"
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
                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 text-[10px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">
                  <div className="w-8 sm:w-10 text-center">SET</div>
                  <div className="flex-1 min-w-0 flex justify-center">{displayWeightLabel}</div>
                  <div className="w-10 sm:flex-1 min-w-0 text-center">REPS</div>
                  <div className="w-10 sm:w-12 text-center">RPE</div>
                  <div className="w-20 sm:w-28 shrink-0 text-center">ACTIONS</div>
                </div>
                
                {sortedSets.map((set: any, idx: number) => {
                  const isWarmup = set.isWarmup;
                  let setLabel = '';
                  
                  if (unilateral) {
                    if (isWarmup) {
                      const warmupSets = sortedSets.filter(s => s.isWarmup);
                      const warmupIdx = warmupSets.findIndex(s => s.id === set.id);
                      const side = warmupIdx % 2 === 0 ? 'L' : 'R';
                      const setNum = Math.floor(warmupIdx / 2) + 1;
                      setLabel = `${side}${setNum}`;
                    } else {
                      const workSets = sortedSets.filter(s => !s.isWarmup);
                      const workIdx = workSets.findIndex(s => s.id === set.id);
                      const side = workIdx % 2 === 0 ? 'L' : 'R';
                      const setNum = Math.floor(workIdx / 2) + 1;
                      setLabel = `${side}${setNum}`;
                    }
                  } else {
                    if (isWarmup) {
                      const warmupIdx = sortedSets.filter((s:any) => s.isWarmup).findIndex((s:any) => s.id === set.id);
                      setLabel = `${warmupIdx + 1}`;
                    } else {
                      const workIdx = sortedSets.filter((s:any) => !s.isWarmup).findIndex((s:any) => s.id === set.id);
                      setLabel = `${workIdx + 1}`;
                    }
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

                  <div className="flex-1 min-w-0 flex flex-row items-center gap-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={String(set.weight) === '0' || String(set.weight) === '0.0' ? '' : set.weight}
                        placeholder="0"
                        onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 text-center text-sm md:text-lg font-black text-white focus:outline-none focus:border-volt/50 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={String(set.reps) === '0' ? '' : set.reps}
                        placeholder="0"
                        onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                        className="w-10 sm:flex-1 w-0 min-w-0 bg-transparent border-b border-white/10 text-center text-sm md:text-lg font-black text-white focus:outline-none focus:border-volt/50 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        value={String(set.rpe) === '0' || String(set.rpe) === '0.0' ? '' : set.rpe}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+(\.\d+)?$/.test(val)) {
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

import { MissionHeader } from './MissionHeader';

interface WorkoutLogProps {
  onBack: () => void;
  onComplete: (avgRpe: number) => void;
  onEndSession: () => void;
}

const LiveMissionHeader = ({
  currentSession,
  currentVolume,
  onBack
}: {
  currentSession: any;
  currentVolume: number;
  onBack: () => void;
}) => {
  const { t, unit, profile } = useSettings();
  const { calculateProgramCalories, getCalibrationStatus } = useWorkout();

  const [elapsedMs, setElapsedMs] = useState(() => (currentSession?.startTime ? Date.now() - currentSession.startTime : 0));

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

  const calibration = getCalibrationStatus();
  const prescribedRpeValue = currentSession?.prescribedRpe || calibration.recommendedRpe || '–';

  const estimatedCalories = (() => {
    if (!currentSession) return 0;
    const durationMins = elapsedMs / 60000;
    const weightKg = profile?.weight ? (unit === 'imperial' ? profile.weight * 0.453592 : profile.weight) : 75;
    const activeRpe = currentSession.targetRpe || 7;
    return Math.round(calculateProgramCalories(weightKg, durationMins, activeRpe, currentVolume));
  })();

  return (
    <MissionHeader
      title={currentSession.title}
      breadcrumb={t('workout.missionLog')}
      readiness={calibration.readiness}
      targetRpe={currentSession.targetRpe || '–'}
      prescribedRpe={prescribedRpeValue}
      time={formatDuration(elapsedMs)}
      calories={estimatedCalories}
      onBack={onBack}
    />
  );
};

export const WorkoutLog = ({ onBack, onComplete, onEndSession }: WorkoutLogProps) => {
  const { t, unit, profile, lastVoiceCommand, experimentalFeatures } = useSettings();
  const { showToast } = useToast();
  const { currentSession, updateCurrentSession, history, getCalibrationStatus, calculateProgramCalories, discardSession, activeRestTarget, setActiveRestTarget } = useWorkout();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  const startRestTimer = (seconds: number) => {
    setActiveRestTarget(Date.now() + seconds * 1000);
  };

  const [isCompleting, setIsCompleting] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);
  const [circuitToRemove, setCircuitToRemove] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null);

  const draggingExercise = currentSession?.exercises?.find(ex => ex.id === draggingId);
  const draggingGroupId = draggingExercise?.groupId;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    haptics.button();
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDraggedOverId(id);
  };

  const handleDragLeave = () => {
    // Reset draggedOverId if user moves focus away
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
    
    if (sourceId && sourceId !== targetId) {
      const sourceEx = exercises.find(ex => ex.id === sourceId);
      const targetEx = exercises.find(ex => ex.id === targetId);

      // Only allow rearranging elements inside the SAME circuit/group
      if (sourceEx && targetEx && sourceEx.groupId === targetEx.groupId && sourceEx.groupId) {
        setExercises((prev) => {
          const sourceIndex = prev.findIndex(ex => ex.id === sourceId);
          const targetIndex = prev.findIndex(ex => ex.id === targetId);

          if (sourceIndex === -1 || targetIndex === -1) return prev;

          const result = [...prev];
          const [removed] = result.splice(sourceIndex, 1);
          result.splice(targetIndex, 0, removed);
          return result;
        });
        haptics.success();
      }
    }
    setDraggingId(null);
    setDraggedOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDraggedOverId(null);
  };
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [showIntensityWarning, setShowIntensityWarning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastAutoRegToastRef = useRef<{ [key: string]: number }>({});
  const { requestWakeLock, releaseWakeLock, isLocked } = useWakeLock();

  const isResting = activeRestTarget !== null;

  useEffect(() => {
    if (isResting) {
      if (!isLocked) {
        requestWakeLock();
      }
    } else {
      if (isLocked) {
        releaseWakeLock();
      }
    }
  }, [isResting, isLocked, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Rest timer effect - handled in WorkoutContext

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAutoregulatedExercises = (
    exerciseId: string, 
    setId: string, 
    exercises: Exercise[], 
    updatedWeight?: string, 
    updatedReps?: string, 
    updatedRpe?: string
  ): { nextExercises: Exercise[], willAutoRegulate: boolean } => {
    const exIndex = exercises.findIndex(e => e.id === exerciseId);
    if (exIndex === -1) return { nextExercises: exercises, willAutoRegulate: false };

    const ex = exercises[exIndex];
    const setIndex = ex.sets.findIndex(s => s.id === setId);
    if (setIndex === -1) return { nextExercises: exercises, willAutoRegulate: false };

    const currentSet = ex.sets[setIndex];
    const targetRpe = currentSession?.targetRpe || 7;
    
    // Determine values considering potential updates
    const actualRpe = parseFloat(updatedRpe ?? currentSet.rpe ?? '');
    const actualReps = parseInt(updatedReps ?? currentSet.reps ?? '0') || 0;
    
    const isCompleted = currentSet.isCompleted;

    // Trigger only if completed AND RPE > targetRpe (Overshoot protection)
    if (!isCompleted || isNaN(actualRpe) || actualRpe <= targetRpe) {
      return { nextExercises: exercises, willAutoRegulate: false };
    }

    const prescribedReps = parseInt(currentSet.baseReps || currentSet.reps) || 0;
    
    let repFactor = 1;
    if (prescribedReps > 0 && actualReps > 0) repFactor = 1 + (actualReps - prescribedReps) * 0.03;

    const rpeDiff = actualRpe - targetRpe;
    const adjustmentFactor = 1 - (rpeDiff * 0.05); // 5% drop per RPE point over
    let totalFactor = repFactor * adjustmentFactor;

    const isRepFailure = actualReps < prescribedReps && actualReps > 0;
    if (isRepFailure && rpeDiff >= 0) totalFactor *= 0.95;
    if (rpeDiff >= 2) totalFactor *= 0.90;

    // Only apply if it's a downward regulation
    if (totalFactor >= 0.99 && !isRepFailure) {
      return { nextExercises: exercises, willAutoRegulate: false };
    }

    let nextExercises = [...exercises];
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

    nextExercises[exIndex] = { ...ex, sets: updatedSets };
    return { nextExercises, willAutoRegulate: true };
  };

  const currentVolume = (() => {
    if (!currentSession) return 0;
    let volume = 0;
    currentSession.exercises.forEach(ex => {
      const isCalisthenics = EXERCISE_DATABASE.find(e => e.id === ex.exerciseId)?.isCalisthenics;
      ex.sets.forEach(set => {
        if (set.isCompleted) {
          const weight = parseFloat(set.weight) || 0;
          const bodyWeight = profile?.weight || 0;
          const calculatedWeight = isCalisthenics ? (weight + bodyWeight) : weight;
          volume += calculatedWeight * (parseInt(set.reps) || 0);
        }
      });
    });
    return volume;
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

  const handleSwap = (sessionExerciseId: string, templateExerciseId: string) => {
    const newDef = EXERCISE_DATABASE.find(e => e.id === templateExerciseId || e.name === templateExerciseId);
    
    setExercises(prev => prev.map(ex => {
      if (ex.id === sessionExerciseId) {
        return { 
          ...ex, 
          exerciseId: templateExerciseId,
          name: newDef?.name || templateExerciseId,
          isSquat: newDef?.pattern === 'squat',
          isBench: newDef?.pattern === 'push_horizontal',
          isDeadlift: newDef?.pattern === 'hinge'
        };
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

  const addExercises = (newExs: { id: string, name: string }[], groupTitle?: string) => {
    const additionalCount = exercises.filter(ex => ex.isAdditional).length;
    const level = profile?.level || 'untrained';

    let limit = Infinity;
    if (level === 'untrained' || level === 'novice') limit = 3;
    else if (level === 'intermediate') limit = 4;

    if (additionalCount + newExs.length > limit) {
      return;
    }

    const groupId = groupTitle ? Math.random().toString(36).substr(2, 9) : undefined;

    const newExercises: Exercise[] = newExs.map(exInfo => ({
      id: Math.random().toString(36).substr(2, 9),
      exerciseId: exInfo.id,
      name: exInfo.name,
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

  const removeCircuit = (groupId: string) => {
    setExercises(prev => prev.filter(ex => ex.groupId !== groupId));
    setCircuitToRemove(null);
    showToast(t('toast.actionSuccessful'), 3000, 'success');
  };

  const addSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets && ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
        const unilateral = isUnilateral(ex.name);
        
        const newSet = {
          id: Math.random().toString(36).substr(2, 9),
          weight: lastSet?.weight || '0',
          reps: lastSet?.reps || '0',
          rpe: lastSet?.rpe || '0',
          isCompleted: false
        };

        if (unilateral) {
          return {
            ...ex,
            sets: [
              ...(ex.sets || []),
              { ...newSet, id: Math.random().toString(36).substr(2, 9) },
              { ...newSet, id: Math.random().toString(36).substr(2, 9) }
            ]
          };
        }

        return {
          ...ex,
          sets: [
            ...(ex.sets || []),
            newSet
          ]
        };
      }
      return ex;
    }));
  };

  const addWarmupSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const unilateral = isUnilateral(ex.name);
        const lastWarmup = ex.sets?.slice().reverse().find(s => s.isWarmup);
        
        const baseWarmupSet = {
          weight: lastWarmup?.weight || '0',
          reps: lastWarmup?.reps || '0',
          rpe: lastWarmup?.rpe || '0',
          isCompleted: false,
          isWarmup: true
        };

        const newWarmupSets = unilateral 
          ? [
              { ...baseWarmupSet, id: Math.random().toString(36).substr(2, 9) },
              { ...baseWarmupSet, id: Math.random().toString(36).substr(2, 9) }
            ]
          : [{ ...baseWarmupSet, id: Math.random().toString(36).substr(2, 9) }];

        const workingSetIndex = ex.sets?.findIndex(s => !s.isWarmup) ?? -1;
        
        let newSets = [...(ex.sets || [])];
        if (workingSetIndex !== -1) {
          newSets.splice(workingSetIndex, 0, ...newWarmupSets);
        } else {
          newSets.push(...newWarmupSets);
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
      const updatedExercises = prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, isCompleted: !s.isCompleted } : s)
          };
        }
        return ex;
      });

      const exAfterCompletion = updatedExercises.find(ex => ex.id === exerciseId);
      const newlyCompletedSet = exAfterCompletion?.sets.find(s => s.id === setId);
      
      if (newlyCompletedSet?.isCompleted) {
        haptics.success();
        
        // Auto-regulation trigger
        const { nextExercises, willAutoRegulate } = getAutoregulatedExercises(exerciseId, setId, updatedExercises);
        
        if (willAutoRegulate) {
          showToast(t('toast.autoReg', { direction: t('workout.decreased' as any), rpe: (currentSession.targetRpe || 7) }), 5000, 'warning');
        }

        // Auto-scroll logic
        const targetExAfterReg = nextExercises.find(e => e.id === exerciseId);
        if (targetExAfterReg && targetExAfterReg.sets.every(s => s.isCompleted)) {
            const idx = nextExercises.findIndex(e => e.id === exerciseId);
            const nextEx = nextExercises[idx + 1];
            if (nextEx) {
                setTimeout(() => {
                    const nextExEl = document.getElementById(`exercise-${nextEx.id}`);
                    nextExEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 500);
            }
        }

        const ex = nextExercises.find(e => e.id === exerciseId);
        if (ex) {
          startRestTimer(ex.restPeriod || 120);
        }

        const allCompletedSets = nextExercises.flatMap(ex => ex.sets).filter(s => s.isCompleted);
        if (allCompletedSets.length === 1 && !showIntensityWarning) {
          const firstSet = allCompletedSets[0];
          if (parseFloat(firstSet.rpe || '0') >= 9) {
            setShowIntensityWarning(true);
          }
        }

        return nextExercises;
      }

      return updatedExercises;
    });
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
    let willAutoRegulateResult = false;
    let autoRegDirection = 'decreased';
    let autoRegMessage = '';

    const isSevereOvershootMaster = (() => {
      const ex = exercises.find(e => e.id === exerciseId);
      if (!ex || field !== 'rpe') return false;
      const currentSet = ex.sets.find(s => s.id === setId);
      const actualRpe = parseFloat(value);
      const targetRpe = currentSession.targetRpe || 7;
      return !isNaN(actualRpe) && currentSet?.isCompleted && (actualRpe - targetRpe >= 2);
    })();

    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        let updatedSets = ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
        
        // Carry over weight and reps to future uncompleted sets
        const setIndex = updatedSets.findIndex(s => s.id === setId);
        if (setIndex !== -1 && (field === 'weight' || field === 'reps')) {
          const currentIsWarmup = ex.sets[setIndex].isWarmup;
          updatedSets = updatedSets.map((s, idx) => {
            if (idx >= setIndex && !s.isCompleted && s.isWarmup === currentIsWarmup) {
              return { 
                ...s, 
                [field]: value,
                ...(field === 'weight' ? { baseWeight: value } : {}),
                ...(field === 'reps' ? { baseReps: value } : {})
              };
            }
            return s;
          });
        }

        // Apply Autoregulation logic
        const { nextExercises, willAutoRegulate } = getAutoregulatedExercises(
          exerciseId, 
          setId, 
          [{ ...ex, sets: updatedSets }],
          field === 'weight' ? value : undefined,
          field === 'reps' ? value : undefined,
          field === 'rpe' ? value : undefined
        );

        if (willAutoRegulate) {
          willAutoRegulateResult = true;
          // Determine message for Toast
          const rpe = parseFloat(field === 'rpe' ? value : updatedSets.find(s => s.id === setId)?.rpe || '0');
          const target = currentSession.targetRpe || 7;
          if (rpe - target >= 2) autoRegMessage = "CRITICAL CNS STRAIN. SCALING INTENSITY TO PREVENT INJURY.";
          else if (field === 'reps' && parseInt(value) < (parseInt(updatedSets.find(s => s.id === setId)?.baseReps || '0'))) {
             autoRegMessage = "RECOVERY CEILING HIT. TRUNCATING REMAINING VOLUME.";
          }
        }

        return nextExercises[0];
      }
      
      // Systemic reduction
      if (isSevereOvershootMaster) {
        const currentIndex = prev.findIndex(e => e.id === exerciseId);
        const thisIndex = prev.findIndex(e => e.id === ex.id);
        
        if (thisIndex > currentIndex) {
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.isCompleted) return s;
              const refWeight = parseFloat(s.baseWeight || s.weight);
              if (isNaN(refWeight) || refWeight <= 0) return s;
              
              let newWeight = refWeight * 0.92;
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

    if (willAutoRegulateResult) {
      const toastKey = `${exerciseId}-${setId}`;
      const now = Date.now();
      const lastTrigger = lastAutoRegToastRef.current[toastKey] || 0;

      if (now - lastTrigger > 1000) {
        lastAutoRegToastRef.current[toastKey] = now;
        const targetRpe = currentSession.targetRpe || 7;
        const message = autoRegMessage || t('toast.autoReg', { direction: t(`workout.${autoRegDirection}` as any), rpe: targetRpe });
        showToast(message, 5000, 'warning');
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
        className="w-full h-full flex flex-col pt-0 md:pt-4 pb-12"
      >
        <LiveMissionHeader
          currentSession={currentSession}
          currentVolume={currentVolume}
          onBack={onBack}
        />

        <div className="w-full max-w-5xl mx-auto">
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
            const circuitIds = Array.from(new Set(exercises.map(ex => ex.groupId).filter(Boolean))) as string[];

            return exercises.map((exercise) => {
              if (exercise.groupId && renderedGroups.has(exercise.groupId)) return null;

              const isGrouped = !!exercise.groupId;
              if (isGrouped) renderedGroups.add(exercise.groupId!);

              const circuitIndex = isGrouped ? circuitIds.indexOf(exercise.groupId!) + 1 : 0;

              const groupExercises = isGrouped
                ? exercises.filter(ex => ex.groupId === exercise.groupId)
                : [exercise];

              return (
                <div key={isGrouped ? exercise.groupId : exercise.id} className={cn(
                  "space-y-6",
                  isGrouped && "bg-volt/5 p-6 border border-volt/10"
                )}>
                  {isGrouped && (
                    <div className="flex items-center justify-between gap-3 mb-8">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="text-volt animate-spin-slow" size={20} />
                        <h2 className="font-sans text-2xl md:text-3xl font-black uppercase tracking-tight text-volt">
                          {exercise.groupTitle || `${t('workout.circuit')} ${circuitIndex}`}
                        </h2>
                      </div>
                      <button
                        onClick={() => { haptics.button(); setCircuitToRemove(exercise.groupId!); }}
                        className="flex items-center gap-2 px-3 py-2 bg-crimson/10 text-crimson hover:bg-crimson hover:text-white transition-all border border-crimson/20 group"
                      >
                        <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Remove Circuit</span>
                      </button>
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
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        draggingId={draggingId}
                        draggedOverId={draggedOverId}
                        draggingGroupId={draggingGroupId}
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-crimson animate-pulse">
                    {t('workout.maxExercises').replace('{level}', t(`nav.${level}`))}
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
            className="flex-1 px-8 py-4 md:py-5 btn-destructive transition-all flex items-center justify-center gap-3 font-headline text-xs md:text-sm font-black uppercase tracking-widest"
          >
            <XCircle size={18} className="md:w-5 md:h-5" />
            <span>{t('workout.endSession')}</span>
          </motion.button>

          <motion.button
            whileHover={(isCompleting || hasRpeErrors) ? {} : { scale: 1.02 }}
            whileTap={(isCompleting || hasRpeErrors) ? {} : { scale: 0.95 }}
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
              "relative flex-1 px-8 md:px-12 py-4 md:py-5 font-headline text-xs md:text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 overflow-hidden",
              !(isCompleting || hasRpeErrors) && "group",
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

      <ConfirmationModal
        isOpen={!!circuitToRemove}
        title="REMOVE CIRCUIT?"
        message="Are you sure you want to remove the entire circuit and all its exercises?"
        confirmLabel={t('workout.remove')}
        cancelLabel={t('workout.keep')}
        onConfirm={() => circuitToRemove && removeCircuit(circuitToRemove)}
        onCancel={() => setCircuitToRemove(null)}
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
            className="fixed bottom-24 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 bg-volt text-void shadow-[0_0_30px_var(--primary-glow)] flex items-center justify-center z-[110] group"
          >
            <Bot size={28} className="md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-void text-volt text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-widest border border-volt">EXP</span>
          </motion.button>

          <AICoach isOpen={isAICoachOpen} onClose={() => setIsAICoachOpen(false)} />
        </>
      )}

      {/* Swap Exercise Modal */}
      <ExerciseSwapModal
        isOpen={!!swappingExerciseId}
        onClose={() => setSwappingExerciseId(null)}
        onSwap={(newTemplateId) => handleSwap(swappingExerciseId!, newTemplateId)}
        currentExerciseId={(() => {
          const ex = exercises.find(e => e.id === swappingExerciseId);
          return ex?.exerciseId || ex?.name || '';
        })()}
      />

      {/* Add Exercise Modal */}
      <ExerciseSelectorModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelect={addExercises}
      />
    </>
  );
};
