import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { useWorkout, Exercise, Set as WorkoutSet } from '../contexts/WorkoutContext';
import { ConfirmationModal } from './ConfirmationModal';
import { getSwappableExercises, EXERCISE_DATABASE } from '../constants/exercises';
import { AICoach } from './AICoach';

interface WorkoutLogProps {
  onBack: () => void;
  onComplete: (avgRpe: number) => void;
  onEndSession: () => void;
}

export const WorkoutLog = ({ onBack, onComplete, onEndSession }: WorkoutLogProps) => {
  const { t, unit, profile, lastVoiceCommand, experimentalFeatures } = useSettings();
  const { currentSession, updateCurrentSession, history } = useWorkout();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  const [isCompleting, setIsCompleting] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);
  const [isCircuitMode, setIsCircuitMode] = useState(false);
  const [selectedCircuitExercises, setSelectedCircuitExercises] = useState<string[]>([]);
  const [circuitTitle, setCircuitTitle] = useState('');
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [showIntensityWarning, setShowIntensityWarning] = useState(false);

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
  };

  const getExerciseHistory = (exerciseName: string) => {
    const lastSession = history.find(session => 
      session.exercises?.some(ex => ex.name === exerciseName)
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
    setIsCircuitMode(false);
    setSelectedCircuitExercises([]);
    setCircuitTitle('');
    setSearchQuery('');
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    setExerciseToRemove(null);
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

      // Set-Level Overrides: Check if first completed set of session is high RPE
      const allCompletedSets = newExercises.flatMap(ex => ex.sets).filter(s => s.isCompleted);
      if (allCompletedSets.length === 1 && !showIntensityWarning) {
        const firstSet = allCompletedSets[0];
        if (parseFloat(firstSet.rpe || '0') >= 9) {
          setShowIntensityWarning(true);
        }
      }

      return newExercises;
    });
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
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
        className="w-full max-w-5xl mx-auto h-full flex flex-col pt-4 md:pt-8 pb-12 px-2 md:px-8"
      >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={onBack}
            className="p-2.5 md:p-3 bg-surface-container-low hover:bg-surface-container-high text-zinc-400 hover:text-white transition-all"
          >
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ClipboardList className="text-volt" size={16} />
              <span className="text-volt font-sans text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{t('workout.log')}</span>
            </div>
            <h1 className="font-sans text-2xl md:text-4xl font-black uppercase italic tracking-tight">{currentSession.title}</h1>
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
                  <p className="text-[10px] text-crimson font-black uppercase tracking-widest">High Intensity Detected</p>
                  <p className="text-[10px] text-zinc-300 font-bold uppercase">
                    First set RPE is high. We recommend lowering your Session Target to prioritize recovery.
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

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4 space-y-8 md:space-y-12 pb-12">
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-volt/10 flex items-center justify-center text-volt">
                            <Dumbbell size={16} className="md:w-5 md:h-5" />
                          </div>
                          <h3 className="font-sans text-xl md:text-2xl font-black uppercase italic tracking-tight">{ex.name}</h3>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSwappingExerciseId(ex.id)}
                              className="p-1.5 md:p-2 bg-surface-container-low hover:bg-volt/10 text-zinc-500 hover:text-volt transition-all flex items-center gap-2 group"
                              title={t('workout.swapExercise')}
                            >
                              <RefreshCw size={12} className="md:w-3.5 md:h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                              <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest">{t('workout.swap')}</span>
                            </button>
                            <button 
                              onClick={() => setExerciseToRemove(ex.id)}
                              className="p-1.5 md:p-2 bg-surface-container-low hover:bg-crimson/10 text-zinc-500 hover:text-crimson transition-all flex items-center gap-2 group"
                              title={t('workout.removeExerciseTitle')}
                            >
                              <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                              <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest">{t('workout.remove')}</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Info size={12} className="md:w-3.5 md:h-3.5" />
                          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                            {t('workout.history')}: {getExerciseHistory(ex.name) || '–'}
                          </span>
                        </div>
                      </div>

                      <div className="hidden md:grid md:grid-cols-[60px_1fr_1fr_1fr_60px_60px] gap-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        <div className="text-center">{t('workout.set')}</div>
                        <div>{t('workout.weight')} ({weightUnit})</div>
                        <div>{t('workout.reps')}</div>
                        <div>{t('workout.rpe')}</div>
                        <div className="text-center">{t('workout.done')}</div>
                        <div></div>
                      </div>

                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {ex.sets.map((set, index) => (
                            <motion.div 
                              key={set.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={cn(
                                "flex flex-col md:grid md:grid-cols-[60px_1fr_1fr_1fr_60px_60px] gap-3 md:gap-4 items-center p-4 md:p-2 transition-all",
                                set.isCompleted 
                                  ? "bg-volt/5" 
                                  : "bg-surface-container-low hover:bg-surface-container-high"
                              )}
                            >
                              <div className="flex items-center justify-between w-full md:w-auto md:justify-center">
                                <div className="md:hidden text-[8px] font-bold uppercase tracking-widest text-zinc-500">{t('workout.set')}</div>
                                <div className="font-sans text-sm md:text-sm font-bold text-zinc-500">
                                  {index + 1}
                                </div>
                              </div>
                              
                              <div className="flex flex-col w-full md:w-auto gap-1">
                                <div className="md:hidden text-[8px] font-bold uppercase tracking-widest text-zinc-500 ml-1">{t('workout.weight')} ({weightUnit})</div>
                                <input 
                                  type="text" 
                                  value={set.weight}
                                  onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)}
                                  className="bg-surface-container-lowest border-none px-4 py-2.5 md:py-3 font-sans text-base md:text-lg font-black text-white focus:outline-none focus:border-volt/50 transition-colors w-full"
                                />
                              </div>
                              
                              <div className="flex flex-col w-full md:w-auto gap-1">
                                <div className="md:hidden text-[8px] font-bold uppercase tracking-widest text-zinc-500 ml-1">{t('workout.reps')}</div>
                                <input 
                                  type="text" 
                                  value={set.reps}
                                  onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                                  className="bg-surface-container-lowest border-none px-4 py-2.5 md:py-3 font-sans text-base md:text-lg font-black text-white focus:outline-none focus:border-volt/50 transition-colors w-full"
                                />
                              </div>
                              
                              <div className="flex flex-col w-full md:w-auto gap-1">
                                <div className="md:hidden text-[8px] font-bold uppercase tracking-widest text-zinc-500 ml-1">{t('workout.rpe')}</div>
                                <div className="relative">
                                  <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={set.rpe}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d+$/.test(val)) {
                                        updateSet(ex.id, set.id, 'rpe', val);
                                      }
                                    }}
                                    placeholder="1-10"
                                    className={cn(
                                      "bg-surface-container-lowest border-none px-4 py-2.5 md:py-3 font-sans text-base md:text-lg font-black text-white focus:outline-none transition-all w-full",
                                      (set.rpe !== '' && (parseInt(set.rpe) < 1 || parseInt(set.rpe) > 10))
                                        ? "border-crimson text-crimson focus:border-crimson shadow-[0_0_15px_rgba(220,38,38,0.2)]" 
                                        : "border-transparent focus:border-volt/50"
                                    )}
                                  />
                                  {set.rpe !== '' && (parseInt(set.rpe) < 1 || parseInt(set.rpe) > 10) && (
                                    <div className="absolute -bottom-5 left-0 right-0 text-[8px] font-bold text-crimson uppercase tracking-widest text-center whitespace-nowrap">
                                      {t('workout.enterRpe')}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between w-full md:w-auto md:justify-center mt-2 md:mt-0">
                                <div className="md:hidden text-[8px] font-bold uppercase tracking-widest text-zinc-500">{t('workout.status')}</div>
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => toggleSetCompletion(ex.id, set.id)}
                                    className={cn(
                                      "flex items-center justify-center transition-all",
                                      set.isCompleted ? "text-volt scale-110" : "text-zinc-700 hover:text-zinc-500"
                                    )}
                                  >
                                    <CheckCircle2 size={24} className="md:w-7 md:h-7" strokeWidth={set.isCompleted ? 3 : 2} />
                                  </button>

                                  <button 
                                    onClick={() => removeSet(ex.id, set.id)}
                                    className="flex items-center justify-center text-zinc-700 hover:text-crimson transition-colors md:hidden"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>

                              <button 
                                onClick={() => removeSet(ex.id, set.id)}
                                className="hidden md:flex items-center justify-center text-zinc-700 hover:text-crimson transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        <button 
                          onClick={() => addSet(ex.id)}
                          className="w-full py-4 border border-dashed border-white/10 hover:border-volt/30 hover:bg-surface-container-high text-zinc-500 hover:text-volt transition-all flex items-center justify-center gap-2 group"
                        >
                          <Plus size={18} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('workout.addSet')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
      </div>

        {/* Add Exercise Button */}
        <div className="flex flex-col items-center mt-8 gap-4">
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
                    "px-8 py-4 border-none transition-all flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-widest group",
                    isAtLimit 
                      ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed" 
                      : "bg-volt/10 text-volt hover:bg-volt hover:text-void"
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

        {/* Footer Action - Moved inside scrollable area at the bottom */}
        <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 pb-24">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEndConfirmOpen(true)}
            className="w-full md:w-auto px-8 py-4 md:py-5 bg-crimson/10 border-none text-crimson hover:bg-crimson hover:text-void transition-all flex items-center justify-center gap-3 font-sans text-xs md:text-sm font-bold uppercase italic tracking-widest"
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
              "group relative w-full md:w-auto px-8 md:px-12 py-4 md:py-5 font-sans text-base md:text-lg font-black uppercase italic tracking-widest transition-all flex items-center justify-center gap-4 overflow-hidden",
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
      <AnimatePresence>
        {swappingExerciseId && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
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
              className="relative w-full max-w-md glass-panel p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="text-volt" size={24} />
                <h2 className="font-sans text-2xl font-black uppercase italic tracking-tight">{t('workout.swapExercise')}</h2>
              </div>
              
              <p className="text-zinc-400 text-sm mb-8">
                {t('workout.swapDesc').replace('{exercise}', exercises.find(ex => ex.id === swappingExerciseId)?.name || '')}
              </p>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
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
      </AnimatePresence>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {isAddExerciseOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddExerciseOpen(false)}
              className="absolute inset-0 bg-void/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-panel p-6 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <PlusCircle className="text-volt" size={24} />
                  <h2 className="font-sans text-2xl font-black uppercase italic tracking-tight">
                    {isCircuitMode ? t('workout.createCircuit') : t('workout.addExercise')}
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setIsCircuitMode(!isCircuitMode);
                    setSelectedCircuitExercises([]);
                    setCircuitTitle('');
                  }}
                  className={cn(
                    "px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all",
                    isCircuitMode ? "bg-volt text-void" : "bg-white/5 text-zinc-400 hover:text-volt"
                  )}
                >
                  {isCircuitMode ? t('workout.switchSingle') : t('workout.switchCircuit')}
                </button>
              </div>

              {isCircuitMode && (
                <div className="mb-6">
                  <input 
                    type="text"
                    placeholder={t('workout.circuitTitlePlaceholder')}
                    value={circuitTitle}
                    onChange={(e) => setCircuitTitle(e.target.value)}
                    className="w-full bg-surface-container-lowest border-none py-3 px-4 text-xs text-white placeholder:text-zinc-600 focus:border-volt/50 outline-none transition-all"
                  />
                </div>
              )}
              
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  placeholder={t('workout.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-volt/50 outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {(() => {
                  const filtered = EXERCISE_DATABASE.filter(ex => 
                    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  return (
                    <>
                      {filtered.map((ex) => {
                        const isSelected = selectedCircuitExercises.includes(ex.name);
                        return (
                          <button
                            key={ex.name}
                            onClick={() => {
                              if (isCircuitMode) {
                                setSelectedCircuitExercises(prev => 
                                  prev.includes(ex.name) 
                                    ? prev.filter(n => n !== ex.name) 
                                    : [...prev, ex.name]
                                );
                              } else {
                                addExercises([ex.name]);
                              }
                            }}
                            className={cn(
                              "w-full p-4 border-none text-left transition-all group flex justify-between items-center",
                              isSelected ? "bg-volt/20 border-l-2 border-volt" : "bg-surface-container-low hover:bg-surface-container-high"
                            )}
                          >
                            <div>
                              <div className={cn(
                                "font-headline text-lg font-black uppercase italic tracking-tight transition-colors",
                                isSelected ? "text-volt" : "group-hover:text-volt"
                              )}>
                                {ex.name}
                              </div>
                              <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                {ex.category}
                              </div>
                            </div>
                            {isCircuitMode ? (
                              <div className={cn(
                                "w-5 h-5 border-2 flex items-center justify-center transition-all",
                                isSelected ? "border-volt bg-volt text-void" : "border-zinc-700"
                              )}>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                              </div>
                            ) : (
                              <Plus size={16} className="text-zinc-500 group-hover:text-volt transition-colors" />
                            )}
                          </button>
                        );
                      })}
                      
                      {searchQuery && !filtered.some(ex => ex.name.toLowerCase() === searchQuery.toLowerCase()) && (
                        <button
                          onClick={() => {
                            if (isCircuitMode) {
                              setSelectedCircuitExercises(prev => [...prev, searchQuery]);
                            } else {
                              addExercises([searchQuery]);
                            }
                            setSearchQuery('');
                          }}
                          className="w-full p-6 bg-volt/5 border border-dashed border-volt/30 hover:bg-volt/10 transition-all group flex flex-col items-center gap-2"
                        >
                          <PlusCircle size={24} className="text-volt" />
                          <div className="text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-volt">{t('workout.createCustom')}</div>
                            <div className="text-lg font-black uppercase italic text-white">"{searchQuery}"</div>
                          </div>
                        </button>
                      )}

                      {filtered.length === 0 && !searchQuery && (
                        <div className="text-center py-8 text-zinc-600 italic text-sm">
                          {t('workout.searchEmpty')}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {isCircuitMode && selectedCircuitExercises.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => addExercises(selectedCircuitExercises, circuitTitle || t('workout.tacticalCircuit'))}
                    className="w-full py-4 bg-volt text-void font-headline text-sm font-black uppercase italic tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3"
                  >
                    <PlusCircle size={20} />
                    <span>Add Circuit ({selectedCircuitExercises.length} Exercises)</span>
                  </button>
                </div>
              )}

              <button 
                onClick={() => setIsAddExerciseOpen(false)}
                className="w-full mt-6 py-4 border-none text-zinc-500 font-headline text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
