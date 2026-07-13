import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Lock,
  CheckCircle2,
  ListChecks,
  Map,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Circle,
  Trophy,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Timer,
  Activity,
  Check,
  X
} from 'lucide-react';
import { ImmersionMode } from '../types';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { Portal } from './Portal';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface StageViewProps {
  immersionMode?: ImmersionMode;
  isVoiceActive?: boolean;
  lastVoiceCommand?: { text: string, timestamp: number } | null;
  onReadyChange?: (isReady: boolean) => void;
}

type StageType = 'arnold' | 'uspl' | 'desert' | 'space';

const STAGES = [
  { id: 'arnold', label: 'stage.arnold', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070' },
  { id: 'uspl', label: 'stage.uspl', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070' },
  { id: 'desert', label: 'stage.desert', image: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070' },
  { id: 'space', label: 'stage.space', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2070' },
];

const LIFTS = ['stage.squat', 'stage.benchPress', 'stage.deadlift'];

const CHECKLIST_ITEMS = [
  'stage.beltTension',
  'stage.kneeSleeves',
  'stage.wristWraps',
  'stage.chalkApplied',
  'stage.mentalFocus',
  'stage.safetySpotters'
];

import { getFitnessTestInfo } from '../utils/fitnessTestUtils';
import { useWorkout } from '../contexts/WorkoutContext';

export const FitnessTestView = ({ immersionMode = 'immersive', isVoiceActive = false, lastVoiceCommand, onReadyChange }: StageViewProps) => {
  const { t, profile, updateProfile, unit, theme } = useSettings();
  const { getNextWorkoutTemplate, history } = useWorkout();
  const nextWorkout = getNextWorkoutTemplate();
  const { isUnlocked, daysRemaining, missionsRemaining, testLabel, testType, isFinalTest } = getFitnessTestInfo(profile, nextWorkout?.title, history);
  
  const [isReady, setIsReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2>(2);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [selectedStage, setSelectedStage] = useState<StageType>('arnold');
  const getInitialTargets = () => {
    switch (testType) {
      case 'endurance':
        return [
          { name: '5K Run', target: 25, unit: 'mins', step: 1 },
          { name: '2K Row', target: 8, unit: 'mins', step: 0.5 }
        ];
      case 'tactical':
        return [
          { name: 'Weighted Ruck (3mi)', target: 45, unit: 'mins', step: 1 },
          { name: 'Farmer Carry Max', target: unit === 'imperial' ? 220 : 100, unit: unit === 'imperial' ? 'stage.lbs' : 'stage.kg', step: unit === 'imperial' ? 10 : 5 },
          { name: 'Max Pullups', target: 15, unit: 'reps', step: 1 }
        ];
      case 'longevity':
        return [
          { name: 'Plank Hold Max', target: 3, unit: 'mins', step: 0.5 },
          { name: 'Resting Heart Rate', target: 55, unit: 'bpm', step: 1 }
        ];
      case 'explosiveness':
        return [
          { name: 'Vertical Jump', target: 30, unit: 'in', step: 0.5 },
          { name: 'Power Clean 1RM', target: unit === 'imperial' ? 220 : 100, unit: unit === 'imperial' ? 'stage.lbs' : 'stage.kg', step: unit === 'imperial' ? 5 : 2.5 },
          { name: 'Broad Jump', target: 100, unit: 'in', step: 1 }
        ];
      default: // big3
        const isImperial = unit === 'imperial';
        const squat1RM = profile?.squatPR || 0;
        const bench1RM = profile?.benchPR || 0;
        const deadlift1RM = profile?.deadliftPR || 0;

        const defaultSquat = isImperial ? 495 : 225;
        const defaultBench = isImperial ? 315 : 145;
        const defaultDeadlift = isImperial ? 585 : 265;

        const baseSquat = squat1RM > 0 ? squat1RM : defaultSquat;
        const baseBench = bench1RM > 0 ? bench1RM : defaultBench;
        const baseDeadlift = deadlift1RM > 0 ? deadlift1RM : defaultDeadlift;

        const step = isImperial ? 5 : 2.5;

        const sq1 = Math.round((baseSquat * 0.90) / step) * step;
        const sq2 = Math.round((baseSquat * 1.00) / step) * step;
        const sq3 = Math.round((baseSquat * 1.05) / step) * step;

        const bp1 = Math.round((baseBench * 0.90) / step) * step;
        const bp2 = Math.round((baseBench * 1.00) / step) * step;
        const bp3 = Math.round((baseBench * 1.05) / step) * step;

        const dl1 = Math.round((baseDeadlift * 0.90) / step) * step;
        const dl2 = Math.round((baseDeadlift * 1.00) / step) * step;
        const dl3 = Math.round((baseDeadlift * 1.05) / step) * step;

        return [
          { name: 'stage.squat', attempt: 1, target: sq1, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.squat', attempt: 2, target: sq2, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.squat', attempt: 3, target: sq3, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.benchPress', attempt: 1, target: bp1, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.benchPress', attempt: 2, target: bp2, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.benchPress', attempt: 3, target: bp3, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.deadlift', attempt: 1, target: dl1, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.deadlift', attempt: 2, target: dl2, unit: isImperial ? 'stage.lbs' : 'stage.kg', step },
          { name: 'stage.deadlift', attempt: 3, target: dl3, unit: isImperial ? 'stage.lbs' : 'stage.kg', step }
        ];
    }
  };

  const [testTargets, setTestTargets] = useState<{name: string, target: number, unit: string, step: number, attempt?: number, status?: 'success' | 'failed'}[]>(() => getInitialTargets());
  const [targetInputs, setTargetInputs] = useState<Record<number, string>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeRestType, setActiveRestType] = useState<'squat-to-bench' | 'bench-to-deadlift' | null>(null);

  React.useEffect(() => {
    if (activeRestType && timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (activeRestType && timerSeconds === 0) {
      if (activeRestType === 'squat-to-bench') {
        setCurrentTargetIndex(3); // Start Bench Press A1
      } else if (activeRestType === 'bench-to-deadlift') {
        setCurrentTargetIndex(6); // Start Deadlift A1
      }
      setActiveRestType(null);
    }
  }, [activeRestType, timerSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteAttemptWithStatus = (status: 'success' | 'failed') => {
    // 1. Mark status
    setTestTargets(prev => prev.map((l, idx) => idx === currentTargetIndex ? { ...l, status } : l));
    setAttemptCountdown(null);

    const isBig3 = testType === 'big3';
    
    if (isBig3) {
      if (currentTargetIndex === 2) {
        // Squat 3rd attempt completed -> trigger 30 min timer (1800 seconds)
        setTimerSeconds(1800);
        setActiveRestType('squat-to-bench');
        return;
      } else if (currentTargetIndex === 5) {
        // Bench Press 3rd attempt completed -> trigger 45 min timer (2700 seconds)
        setTimerSeconds(2700);
        setActiveRestType('bench-to-deadlift');
        return;
      }
    }
    
    // Default advancement
    if (currentTargetIndex < testTargets.length - 1) {
      setCurrentTargetIndex(prev => prev + 1);
    }
  };

  React.useEffect(() => {
    setTestTargets(getInitialTargets());
    setTargetInputs({});
    setTimerSeconds(0);
    setActiveRestType(null);
  }, [unit, profile?.squatPR, profile?.benchPR, profile?.deadliftPR, testType]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [localWeightInput, setLocalWeightInput] = useState('');
  const lastIndexRef = React.useRef<number>(currentTargetIndex);

  React.useEffect(() => {
    const currentItem = testTargets[currentTargetIndex];
    if (currentItem && (lastIndexRef.current !== currentTargetIndex || localWeightInput === '')) {
      setLocalWeightInput(currentItem.target.toString());
      lastIndexRef.current = currentTargetIndex;
    }
  }, [currentTargetIndex, testTargets, localWeightInput]);

  const [hoveredChecklistItem, setHoveredChecklistItem] = useState<string | null>(null);
  const lastProcessedCommandRef = React.useRef<number>(0);

  const [attemptCountdown, setAttemptCountdown] = useState<number | null>(null);
  const [attemptActiveMap, setAttemptActiveMap] = useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (attemptCountdown !== null && attemptCountdown > 0) {
      const interval = setInterval(() => {
        setAttemptCountdown(c => (c !== null && c > 0 ? c - 1 : null));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [attemptCountdown]);

  React.useEffect(() => {
    setAttemptCountdown(null);
  }, [currentTargetIndex]);

  React.useEffect(() => {
    if (!isReady) {
      setAttemptActiveMap({});
      setAttemptCountdown(null);
    }
  }, [isReady]);

  React.useEffect(() => {
    onReadyChange?.(isReady);
  }, [isReady, onReadyChange]);

  const handleReadyClick = () => {
    if (!attemptActiveMap[currentTargetIndex]) {
      setAttemptCountdown(90);
      setAttemptActiveMap(prev => ({ ...prev, [currentTargetIndex]: true }));
    } else {
      if (attemptCountdown !== null) {
        setAttemptCountdown(null);
      } else {
        setAttemptCountdown(90);
      }
    }
  };

  const updateTarget = (index: number, delta: number) => {
    setTestTargets(prev => prev.map((l, i) => i === index ? { ...l, target: Math.max(0, l.target + delta) } : l));
    setTargetInputs(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const adjustTargetWeight = (delta: number) => {
    const currentItem = testTargets[currentTargetIndex];
    if (currentItem) {
      const newVal = Math.max(0, currentItem.target + delta);
      const rounded = parseFloat(newVal.toFixed(1));
      setLocalWeightInput(rounded.toString());
      setTestTargets(prev => prev.map((l, i) => i === currentTargetIndex ? { ...l, target: rounded } : l));
    }
  };

  const handleTargetChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setLocalWeightInput(cleanValue);
    const parsed = parseFloat(cleanValue);
    if (!isNaN(parsed)) {
      setTestTargets(prev => prev.map((l, i) => i === currentTargetIndex ? { ...l, target: Math.max(0, parsed) } : l));
    }
  };

  const setTargetValue = (index: number, value: number) => {
    setTestTargets(prev => prev.map((l, i) => i === index ? { ...l, target: value } : l));
    setTargetInputs(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleInputChange = (index: number, strVal: string) => {
    // Treat comma as decimal point for international users
    const filteredVal = strVal.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    setTargetInputs(prev => ({ ...prev, [index]: filteredVal }));
    const parsed = parseFloat(filteredVal);
    if (!isNaN(parsed) && parsed >= 0) {
      setTestTargets(prev => prev.map((l, i) => i === index ? { ...l, target: parsed } : l));
    }
  };

  const handleInputBlur = (index: number) => {
    setTargetInputs(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  // Voice Recognition Logic
  React.useEffect(() => {
    if (!isVoiceActive || !lastVoiceCommand) return;
    if (lastVoiceCommand.timestamp <= lastProcessedCommandRef.current) return;
    
    lastProcessedCommandRef.current = lastVoiceCommand.timestamp;
    const transcript = lastVoiceCommand.text;

    // Handle Environment Selection (Step 1)
    if (setupStep === 1) {
      if (transcript.includes('arnold') || transcript.includes('classic') || transcript.includes('gym')) setSelectedStage('arnold');
      else if (transcript.includes('uspl') || transcript.includes('nationals') || transcript.includes('competition')) setSelectedStage('uspl');
      else if (transcript.includes('desert') || transcript.includes('dust bowl') || transcript.includes('dust')) setSelectedStage('desert');
      else if (transcript.includes('space') || transcript.includes('lunar') || transcript.includes('station')) setSelectedStage('space');
    }

    // Handle Weight Entry (Step 2)
    if (setupStep === 2) {
      const numberMatch = transcript.match(/\d+/);
      if (numberMatch) {
        const weight = parseFloat(numberMatch[0]);
        if (transcript.includes('squat')) setTargetValue(0, weight);
        else if (transcript.includes('bench')) setTargetValue(1, weight);
        else if (transcript.includes('deadlift')) setTargetValue(2, weight);
      }
    }

    // Global Commands (Redundant but kept for local context if needed)
    if (transcript.includes('next step')) {
      setIsTermsModalOpen(true);
    }
    if (transcript.includes('back')) {
      setHasEntered(false);
    }
    if (transcript.includes('enter arena') || transcript.includes('start competition')) {
      setIsTermsModalOpen(true);
    }
  }, [lastVoiceCommand, isVoiceActive, setupStep, hoveredChecklistItem]);

  // Scroll to top when step or view changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
    window.scrollTo(0, 0);
  }, [setupStep, isReady]);

  const currentTargetItem = testTargets[currentTargetIndex];

  const getNextDisciplineStartIndex = () => {
    const currentName = testTargets[currentTargetIndex]?.name;
    if (!currentName) return -1;
    for (let i = currentTargetIndex + 1; i < testTargets.length; i++) {
      if (testTargets[i].name !== currentName) {
        return i;
      }
    }
    return -1;
  };

  const hasNextDiscipline = getNextDisciplineStartIndex() !== -1;

  const handleNextDiscipline = () => {
    const nextIdx = getNextDisciplineStartIndex();
    if (nextIdx !== -1) {
      setCurrentTargetIndex(nextIdx);
      setActiveRestType(null); // Clear active timers on jump
    }
  };

  const getPrevDisciplineStartIndex = () => {
    const currentName = testTargets[currentTargetIndex]?.name;
    if (!currentName) return -1;
    let prevNameIndex = -1;
    for (let i = currentTargetIndex - 1; i >= 0; i--) {
      if (testTargets[i].name !== currentName) {
        prevNameIndex = i;
        break;
      }
    }
    if (prevNameIndex === -1) return -1;
    const prevName = testTargets[prevNameIndex].name;
    for (let i = 0; i < testTargets.length; i++) {
      if (testTargets[i].name === prevName) {
        return i;
      }
    }
    return -1;
  };

  const hasPrevDiscipline = getPrevDisciplineStartIndex() !== -1;

  const handlePrevDiscipline = () => {
    const prevIdx = getPrevDisciplineStartIndex();
    if (prevIdx !== -1) {
      setCurrentTargetIndex(prevIdx);
      setActiveRestType(null); // Clear active timers on jump
    }
  };

  const getLiftMax = (lift: string) => {
    if (lift === 'stage.squat') return profile?.squatPR || 0;
    if (lift === 'stage.benchPress') return profile?.benchPR || 0;
    if (lift === 'stage.deadlift') return profile?.deadliftPR || 0;
    return 0;
  };

  const renderSetup = () => (
    <motion.div 
      key="step-setup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-30 w-full max-w-screen-2xl flex flex-col gap-6 md:grid md:grid-cols-12 md:gap-8"
    >
      {/* Header */}
      <div className="col-span-12 mb-4 md:mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Trophy className="text-volt" size={24} />
          <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-volt">
            {t('stage.enterWeights')}
          </span>
        </div>
      </div>

      <div className="col-span-12 flex flex-col gap-6 md:gap-8">
        <section className="glass-panel p-4 md:p-8 border-none space-y-6">
          {testTargets.some(t => t.attempt !== undefined) ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
              {(['stage.squat', 'stage.benchPress', 'stage.deadlift']).map((liftName) => {
                const attempts = testTargets.filter(t => t.name === liftName);
                return (
                  <div key={liftName} className="glass-panel p-4 md:p-5 xl:p-6 border-white/5 bg-white/5 flex flex-col gap-5">
                    <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                      <h3 className="font-sans text-base md:text-lg font-black uppercase text-volt leading-none tracking-wider">
                        {t(liftName)}
                      </h3>
                      <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">
                        MAX: {getLiftMax(liftName)} {t(unit === 'imperial' ? 'stage.lbs' : 'stage.kg')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {attempts.map((attemptItem) => {
                        const globalIndex = testTargets.findIndex(t => t === attemptItem);
                        return (
                          <div key={`attempt-${attemptItem.attempt}`} className="flex flex-col gap-2 p-4 bg-void/40 border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                              <span>Attempt {attemptItem.attempt}</span>
                              {attemptItem.attempt === 3 && (
                                <span className="text-volt px-1.5 py-0.5 bg-volt/10 text-[8px] font-black tracking-[0.1em]">
                                  PR GOAL
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-4 mt-1">
                              <button
                                onClick={() => updateTarget(globalIndex, -attemptItem.step)}
                                className="w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 active:bg-volt/10 flex items-center justify-center text-zinc-400 hover:text-white font-black text-lg transition-colors"
                                id={`sub-btn-${globalIndex}`}
                              >
                                -
                              </button>
                              <div className="text-center flex-1 flex items-center justify-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={targetInputs[globalIndex] !== undefined ? targetInputs[globalIndex] : attemptItem.target.toString()}
                                  onChange={(e) => handleInputChange(globalIndex, e.target.value)}
                                  onBlur={() => handleInputBlur(globalIndex)}
                                  className="w-24 bg-void/50 text-center border border-white/10 font-sans text-2xl font-black text-white focus:border-volt/50 focus:outline-none py-1 leading-none selection:bg-volt/30"
                                  style={{ borderRadius: '0' }}
                                />
                                <span className="text-[10px] font-black text-zinc-500 uppercase leading-none">
                                  {t(attemptItem.unit)}
                                </span>
                              </div>
                              <button
                                onClick={() => updateTarget(globalIndex, attemptItem.step)}
                                className="w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 active:bg-volt/10 flex items-center justify-center text-zinc-400 hover:text-white font-black text-lg transition-colors"
                                id={`add-btn-${globalIndex}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {testTargets.map((targetItem, index) => (
                <div 
                  key={`${targetItem.name}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-white/5 border-none gap-4"
                >
                  <div>
                    <span className="font-sans text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Target {index + 1}</span>
                    <span className="font-sans text-lg md:text-xl font-black uppercase text-white leading-none">{t(targetItem.name)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <button 
                      onClick={() => updateTarget(index, -targetItem.step)}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors"
                    >
                      -
                    </button>
                    <div className="text-center min-w-[124px] flex items-center justify-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={targetInputs[index] !== undefined ? targetInputs[index] : targetItem.target.toString()}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onBlur={() => handleInputBlur(index)}
                        className="w-24 bg-void/50 text-center border border-white/10 font-sans text-2xl md:text-3xl font-black text-volt focus:border-volt focus:outline-none py-1 leading-none selection:bg-volt/30"
                        style={{ borderRadius: '0' }}
                      />
                      <span className="text-[10px] font-black text-zinc-500 uppercase leading-none">{t(targetItem.unit)}</span>
                    </div>
                    <button 
                      onClick={() => updateTarget(index, targetItem.step)}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            <button
              onClick={() => setHasEntered(false)}
              className="flex-1 py-3 btn-secondary"
            >
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.15em]">{t('stage.back')}</span>
            </button>
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="flex-[2] py-4 btn-primary group shadow-[0_0_30px_var(--primary-glow)]"
            >
              <span className="text-sm md:text-base font-black uppercase tracking-[0.15em]">{t('stage.enterTest')}</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );

  const renderReadyHUD = () => {
    if (activeRestType) {
      const totalDuration = activeRestType === 'squat-to-bench' ? 1800 : 2700;
      const progress = (timerSeconds / totalDuration) * 100;
      
      return (
        <div className="relative z-20 w-full max-w-screen-2xl h-full flex flex-col justify-between py-6 md:py-12 px-4 sm:px-8 md:px-12 pointer-events-auto">
          {/* Top Content: Main Status */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-8">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-8 md:p-12 border-volt/30 bg-void/85 w-full text-center space-y-8 shadow-[0_0_50px_rgba(0,182,255,0.15)]"
              style={{ borderRadius: '0' }}
            >
              <div className="flex flex-col items-center gap-2">
                <Timer className="text-volt animate-pulse" size={40} />
                <span className="font-sans text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-volt">
                  MANDATORY RECOVERY PROTOCOL
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="font-sans text-5xl md:text-8xl font-black tracking-tight text-white font-mono leading-none">
                  {formatTime(timerSeconds)}
                </h2>
                <p className="text-zinc-500 text-[10px] tracking-widest uppercase font-bold">
                  CNS REGEN & HYDRO-RESTORE SEQUENCE
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 h-2 relative overflow-hidden" style={{ borderRadius: '0' }}>
                <div 
                  className="bg-volt h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-xs md:text-sm text-zinc-400 font-medium leading-relaxed max-w-md mx-auto">
                {activeRestType === 'squat-to-bench' ? (
                  "Initiated a 30-Minute rest block following heavy Squat attempts to complete cellular ATP regeneration, lower heart rate variability, and prepare muscles for Flat Bench Press."
                ) : (
                  "Initiated a 45-Minute rest block following Bench Press attempts to relieve spinal loading, fully restore cellular glycogen status, and maximize motor system recruitment before pulling Deadlifts."
                )}
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    if (activeRestType === 'squat-to-bench') {
                      setCurrentTargetIndex(3); // Start Bench Press A1
                    } else {
                      setCurrentTargetIndex(6); // Start Deadlift A1
                    }
                    setActiveRestType(null);
                  }}
                  className="btn-primary py-4 px-8 tracking-widest uppercase font-black text-xs"
                  style={{ borderRadius: '0' }}
                >
                  Skip Rest & Start {activeRestType === 'squat-to-bench' ? 'Bench Press' : 'Deadlift'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Simple Withdraw/Abort Footer */}
          <div className="flex justify-between items-end mt-12">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-6 py-4 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white font-sans text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
              style={{ borderRadius: '0' }}
            >
              ABORT SEQUENCE
            </button>
            
            <button
              onClick={() => {
                const squatTargets = testTargets.filter(t => t.name.toLowerCase().includes('squat'));
                const benchTargets = testTargets.filter(t => t.name.toLowerCase().includes('bench'));
                const deadliftTargets = testTargets.filter(t => t.name.toLowerCase().includes('deadlift'));

                const maxSquatVal = squatTargets.filter(t => t.status === 'success').length > 0
                  ? Math.max(...squatTargets.filter(t => t.status === 'success').map(t => t.target))
                  : undefined;
                const maxBenchVal = benchTargets.filter(t => t.status === 'success').length > 0
                  ? Math.max(...benchTargets.filter(t => t.status === 'success').map(t => t.target))
                  : undefined;
                const maxDeadliftVal = deadliftTargets.filter(t => t.status === 'success').length > 0
                  ? Math.max(...deadliftTargets.filter(t => t.status === 'success').map(t => t.target))
                  : undefined;

                updateProfile({
                  pendingFitnessTest: false,
                  devOverrideFitnessTest: false,
                  lastFitnessTestAt: Date.now(),
                  ...(isFinalTest && { programResetAt: Date.now() }),
                  ...(maxSquatVal !== undefined && { squatPR: maxSquatVal }),
                  ...(maxBenchVal !== undefined && { benchPR: maxBenchVal }),
                  ...(maxDeadliftVal !== undefined && { deadliftPR: maxDeadliftVal }),
                });
                setIsReady(false);
                setSetupStep(2);
                setHasEntered(false);
                setActiveRestType(null);
              }}
              className="px-6 py-4 btn-secondary font-headline text-xs font-black uppercase tracking-widest"
              style={{ borderRadius: '0' }}
            >
              SUBMIT EARLY
            </button>
          </div>
        </div>
      );
    }

    const isActive = attemptActiveMap[currentTargetIndex];

    const renderReadyBoxContent = () => {
      if (!isActive) {
        return (
          <div className="flex flex-col items-center">
            <h1 className="font-sans text-3xl md:text-6xl font-black tracking-[0.2em] md:tracking-[0.4em] text-void text-center translate-x-[0.1em] md:translate-x-[0.2em] uppercase">
              {t('stage.ready')}
            </h1>
            <span className="text-[8px] md:text-[10px] tracking-[0.2em] font-extrabold text-void/70 font-mono uppercase mt-2">
              PRESS TO START ATTEMPT
            </span>
          </div>
        );
      }

      if (attemptCountdown !== null) {
        return (
          <div className="flex flex-col items-center">
            <h1 className="font-sans font-black text-3xl md:text-6xl tracking-[0.1em] text-void text-center font-mono">
              {formatTime(attemptCountdown)}
            </h1>
            <span className="text-[8px] md:text-[10px] tracking-[0.2em] font-extrabold text-void/85 font-mono uppercase mt-2">
              RESET TIMER
            </span>
            <span className="text-[8px] md:text-[10px] tracking-wider font-extrabold text-void/65 font-sans uppercase mt-2 text-center">
              You have 90 seconds to complete lift attempt
            </span>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center">
          <h1 className="font-sans text-xl md:text-3xl font-black tracking-[0.1em] text-void text-center uppercase">
            ATTEMPT ACTIVE
          </h1>
          <span className="text-[8px] md:text-[10px] tracking-[0.2em] font-extrabold text-void/70 font-mono uppercase mt-2">
            RESTART TIMER (90S)
          </span>
        </div>
      );
    };

    return (
      <div className="relative z-20 w-full max-w-screen-2xl h-full flex flex-col justify-between py-6 md:py-12 px-4 sm:px-8 md:px-12 pointer-events-none">
        {/* Top Content: Main Status */}
        <div className="flex-1 flex flex-col items-center justify-center gap-12">

          {/* Center: Target Load and Lift Selectors */}
          <div className="w-full max-w-md flex flex-col items-center gap-4 md:gap-8 pointer-events-auto">
            <motion.button 
              onClick={handleReadyClick}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                boxShadow: isActive ? "0 0 30px rgba(0, 182, 255, 0.15)" : "0 0 40px var(--primary-glow)"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="px-8 md:px-16 py-4 md:py-6 border-2 border-volt bg-volt text-void cursor-pointer hover:brightness-110 active:brightness-95 transition-all focus:outline-none focus:ring-1 focus:ring-volt block w-full outline-offset-0 select-none shadow-[0_0_20px_var(--primary-glow)]"
              style={{ borderRadius: '0' }}
            >
              {renderReadyBoxContent()}
            </motion.button>

            <div className="flex flex-col items-center gap-2 pointer-events-auto w-full">
              <span className="font-sans text-zinc-300 text-[8px] md:text-[10px] tracking-[0.2em] font-bold uppercase">{t('stage.targetLoad')}</span>
              
              <div className="flex flex-col items-center gap-2 w-full">
                {/* Steppers & Interactive Input Row */}
                <div className="flex items-center justify-between gap-3 bg-void/30 border border-zinc-800 p-1 md:p-2 w-full" style={{ borderRadius: '0' }}>
                  
                  {/* Left adjust buttons */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => adjustTargetWeight(-((currentTargetItem.step || 2.5) * 2))}
                      className="w-10 h-10 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-mono text-xs font-black transition-all flex items-center justify-center bg-zinc-900/40 cursor-pointer"
                      style={{ borderRadius: '0' }}
                      title={`-${(currentTargetItem.step || 2.5) * 2}`}
                    >
                      -{((currentTargetItem.step || 2.5) * 2).toFixed(1).replace('.0', '')}
                    </button>
                    <button 
                      onClick={() => adjustTargetWeight(-(currentTargetItem.step || 2.5))}
                      className="w-10 h-10 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-mono text-xs font-black transition-all flex items-center justify-center bg-zinc-900/40 cursor-pointer"
                      style={{ borderRadius: '0' }}
                      title={`-${currentTargetItem.step || 2.5}`}
                    >
                      -{(currentTargetItem.step || 2.5).toFixed(1).replace('.0', '')}
                    </button>
                  </div>

                  {/* Weight Input Box */}
                  <div className="flex items-baseline gap-1 md:gap-2 px-1 md:px-2">
                    <input
                      type="text"
                      pattern="[0-9]*\.?[0-9]*"
                      inputMode="decimal"
                      value={localWeightInput}
                      onChange={(e) => handleTargetChange(e.target.value)}
                      className="font-sans text-4xl md:text-6xl font-black tracking-tighter text-white bg-transparent border-b border-dashed border-zinc-700 hover:border-zinc-500 focus:border-volt focus:outline-none text-center w-24 md:w-36 select-all font-mono"
                      style={{ borderRadius: '0' }}
                    />
                    <span className="font-sans text-xs md:text-sm font-bold text-volt uppercase">{t(currentTargetItem.unit)}</span>
                  </div>

                  {/* Right adjust buttons */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => adjustTargetWeight(currentTargetItem.step || 2.5)}
                      className="w-10 h-10 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-mono text-xs font-black transition-all flex items-center justify-center bg-zinc-900/40 cursor-pointer"
                      style={{ borderRadius: '0' }}
                      title={`+${currentTargetItem.step || 2.5}`}
                    >
                      +{(currentTargetItem.step || 2.5).toFixed(1).replace('.0', '')}
                    </button>
                    <button 
                      onClick={() => adjustTargetWeight((currentTargetItem.step || 2.5) * 2)}
                      className="w-10 h-10 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-mono text-xs font-black transition-all flex items-center justify-center bg-zinc-900/40 cursor-pointer"
                      style={{ borderRadius: '0' }}
                      title={`+${(currentTargetItem.step || 2.5) * 2}`}
                    >
                      +{((currentTargetItem.step || 2.5) * 2).toFixed(1).replace('.0', '')}
                    </button>
                  </div>

                </div>

                <span className="text-[9px] text-zinc-300 tracking-wider uppercase font-extrabold text-center">
                  TAP VALUE TO MANUALLY KEY IN OR USE ADJUSTMENT CHIPS
                </span>

              </div>
            </div>

            {/* Attempt Succeeded / Failed Buttons */}
            {attemptActiveMap[currentTargetIndex] && (
              <div className="flex flex-row gap-3 w-full max-w-md mt-2 pointer-events-auto md:static">
                <button
                  onClick={() => handleCompleteAttemptWithStatus('success')}
                  className="flex-1 py-4 px-2 sm:px-6 tracking-widest uppercase font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-2 border-none shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500 text-void cursor-pointer hover:bg-emerald-400 active:scale-[0.98] transition-all md:fixed md:left-20 lg:left-32 xl:left-48 md:top-1/2 md:-translate-y-1/2 md:w-48 md:h-48 md:text-sm md:flex-col md:gap-4 md:shadow-[0_0_30px_rgba(16,185,129,0.2)] md:hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] md:z-50 md:pointer-events-auto"
                  style={{ borderRadius: '0' }}
                >
                  <Check className="stroke-[3px] text-void w-4 h-4 md:stroke-[4px] md:w-12 md:h-12" />
                  <span>Lifted</span>
                </button>
                
                <button
                  onClick={() => handleCompleteAttemptWithStatus('failed')}
                  className="flex-1 py-4 px-2 sm:px-6 tracking-widest uppercase font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-2 border-none shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-500 text-void transition-all cursor-pointer hover:bg-red-400 active:scale-[0.98] md:fixed md:right-20 lg:right-32 xl:right-48 md:top-1/2 md:-translate-y-1/2 md:w-48 md:h-48 md:text-sm md:flex-col md:gap-4 md:shadow-[0_0_30px_rgba(239,68,68,0.2)] md:hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] md:z-50 md:pointer-events-auto"
                  style={{ borderRadius: '0' }}
                >
                  <X className="stroke-[3px] text-void w-4 h-4 md:stroke-[4px] md:w-12 md:h-12" />
                  <span className="text-center text-void">Failed</span>
                </button>
              </div>
            )}

            <div className="w-full max-w-md mt-2">
              {testType === 'big3' ? (
                <div className="flex flex-col gap-3 border border-white/5 bg-void/50 p-4" style={{ borderRadius: '0' }}>
                  {(() => {
                    const currentDiscipline = testTargets[currentTargetIndex]?.name;
                    return (['stage.squat', 'stage.benchPress', 'stage.deadlift'])
                      .filter(liftKey => liftKey === currentDiscipline)
                      .map((liftKey) => {
                        const attempts = testTargets
                          .map((t, idx) => ({ ...t, originalIndex: idx }))
                          .filter(t => t.name === liftKey);
                        
                        return (
                          <div key={liftKey} className="flex flex-col gap-4 w-full">
                            <div className="flex flex-row items-center justify-between gap-4 w-full">
                              <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-black text-zinc-400 font-sans truncate w-24 text-left">
                                {t(liftKey).replace(' Press', '')}
                              </span>
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                {attempts.map((targetItem) => {
                                  const idx = targetItem.originalIndex;
                                  const isSelected = currentTargetIndex === idx;
                                  const isCompleted = idx < currentTargetIndex;
                                  const status = targetItem.status;
                                  
                                  const firstIncompleteIdx = testTargets.findIndex(t => t.status === undefined);
                                  const isFutureDisabled = firstIncompleteIdx !== -1 && idx > firstIncompleteIdx;
                                  
                                  return (
                                    <button
                                      key={idx}
                                      disabled={isFutureDisabled}
                                      onClick={() => {
                                        setCurrentTargetIndex(idx);
                                        setActiveRestType(null); // Clear active timers on manual jump
                                      }}
                                      className={cn(
                                        "py-2 px-1 text-xs font-black transition-all border outline-none flex items-center justify-center gap-1 cursor-pointer",
                                        isSelected
                                          ? "bg-volt text-void border-volt shadow-[0_0_15px_var(--primary-glow)]"
                                          : status === 'success'
                                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/60"
                                            : status === 'failed'
                                              ? "bg-red-950/40 text-red-400 border-red-500/30 hover:bg-red-950/60"
                                              : isCompleted
                                                ? "bg-white/10 text-zinc-400 border-white/5 opacity-60 hover:bg-white/15"
                                                : isFutureDisabled
                                                  ? (theme === 'light'
                                                    ? "bg-zinc-800/10 text-zinc-300 border-zinc-700/25 opacity-70 cursor-not-allowed"
                                                    : "bg-zinc-900/20 text-zinc-700 border-zinc-800/40 opacity-40 cursor-not-allowed")
                                                  : "bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10"
                                      )}
                                      style={{ borderRadius: '0' }}
                                      title={`${t(liftKey)} - Attempt ${targetItem.attempt}`}
                                    >
                                      <span>A{targetItem.attempt}</span>
                                      {status === 'success' && <Check size={10} className="stroke-[3px] text-emerald-400 shrink-0" />}
                                      {status === 'failed' && <X size={10} className="stroke-[3px] text-red-400 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Discipline Navigation Buttons */}
                            {(hasPrevDiscipline || hasNextDiscipline) && (
                              <div className="flex items-center justify-between pt-2 border-t border-white/5 w-full">
                                {hasPrevDiscipline ? (
                                  <button
                                    onClick={handlePrevDiscipline}
                                    className="btn-tertiary flex items-center gap-1 cursor-pointer"
                                    style={{ borderRadius: '0' }}
                                  >
                                    <ArrowLeft size={12} className="stroke-[2.5px]" />
                                    <span>Previous Discipline</span>
                                  </button>
                                ) : (
                                  <div />
                                )}
                                {hasNextDiscipline ? (
                                  <button
                                    onClick={handleNextDiscipline}
                                    className="btn-tertiary flex items-center gap-1 cursor-pointer"
                                    style={{ borderRadius: '0' }}
                                  >
                                    <span>Next Discipline</span>
                                    <ArrowRight size={12} className="stroke-[2.5px]" />
                                  </button>
                                ) : (
                                  <div />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {testTargets.map((targetItem, i) => {
                    const isSelected = currentTargetIndex === i;
                    const status = targetItem.status;
                    const firstIncompleteIdx = testTargets.findIndex(t => t.status === undefined);
                    const isFutureDisabled = firstIncompleteIdx !== -1 && i > firstIncompleteIdx;
                    return (
                      <button
                        key={`${targetItem.name}-${targetItem.attempt || i}`}
                        disabled={isFutureDisabled}
                        onClick={() => {
                          setCurrentTargetIndex(i);
                          setActiveRestType(null); // Clear active timers on manual jump
                        }}
                        className={cn(
                          "px-3 md:px-4 py-1.5 md:py-2 font-sans text-[10px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 border cursor-pointer",
                          isSelected 
                            ? "bg-volt text-void border-volt shadow-[0_0_15px_var(--primary-glow)]" 
                            : status === 'success'
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/60"
                              : status === 'failed'
                                ? "bg-red-950/40 text-red-400 border-red-500/30 hover:bg-red-950/60"
                                : isFutureDisabled
                                  ? (theme === 'light'
                                    ? "bg-zinc-800/10 text-zinc-300 border-zinc-700/25 opacity-70 cursor-not-allowed"
                                    : "bg-zinc-900/20 text-zinc-700 border-zinc-800/40 opacity-40 cursor-not-allowed")
                                  : "bg-white/5 text-zinc-500 border-transparent hover:bg-white/10"
                        )}
                        style={{ borderRadius: '0' }}
                      >
                        <span>{targetItem.attempt ? `${t(targetItem.name).split(' ')[0]} A${targetItem.attempt}` : t(targetItem.name)}</span>
                        {status === 'success' && <Check size={12} className="stroke-[3px] text-emerald-400 shrink-0" />}
                        {status === 'failed' && <X size={12} className="stroke-[3px] text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Content: Navigation and Action */}
        <div className="flex flex-row items-center justify-center gap-4 mt-12 pointer-events-auto w-full max-w-md mx-auto">
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="flex-1 py-4 btn-secondary-destructive font-headline text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            style={{ borderRadius: '0' }}
          >
            {t('stage.withdrawCompetition')}
          </button>
          
          <button
            onClick={() => {
              // Extract new PRs if applicable with multi-attempts support
              const squatTargets = testTargets.filter(t => t.name.toLowerCase().includes('squat'));
              const benchTargets = testTargets.filter(t => t.name.toLowerCase().includes('bench'));
              const deadliftTargets = testTargets.filter(t => t.name.toLowerCase().includes('deadlift'));

              const maxSquatVal = squatTargets.filter(t => t.status === 'success').length > 0
                ? Math.max(...squatTargets.filter(t => t.status === 'success').map(t => t.target))
                : undefined;
              const maxBenchVal = benchTargets.filter(t => t.status === 'success').length > 0
                ? Math.max(...benchTargets.filter(t => t.status === 'success').map(t => t.target))
                : undefined;
              const maxDeadliftVal = deadliftTargets.filter(t => t.status === 'success').length > 0
                ? Math.max(...deadliftTargets.filter(t => t.status === 'success').map(t => t.target))
                : undefined;

              updateProfile({
                pendingFitnessTest: false,
                devOverrideFitnessTest: false,
                lastFitnessTestAt: Date.now(),
                ...(isFinalTest && { programResetAt: Date.now() }), // Only restart timeline if it is the final test
                ...(maxSquatVal !== undefined && { squatPR: maxSquatVal }),
                ...(maxBenchVal !== undefined && { benchPR: maxBenchVal }),
                ...(maxDeadliftVal !== undefined && { deadliftPR: maxDeadliftVal }),
              });
              setIsReady(false);
              setSetupStep(2);
              setHasEntered(false);
              setActiveRestType(null);
            }}
            className="flex-1 py-4 btn-primary font-headline text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
            style={{ borderRadius: '0' }}
          >
            <span>COMPLETE TEST</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      </div>
    );
  };

  const currentStageImage = STAGES.find(s => s.id === selectedStage)?.image || STAGES[0].image;

  const getObjectiveDescription = () => {
    const goal = profile?.trainingGoal?.toLowerCase() || 'powerbuilding';
    switch (goal) {
      case 'powerbuilding':
        return "Because your current objective is powerbuilding, the system will test your Big 3 to ensure your strength gains are solidified and adapted.";
      case 'pure_strength':
      case 'strength':
        return "Because your current objective is strength development, the system will test your maximal force production on the primary lifts.";
      case 'hypertrophy':
        return "Because your current objective is hypertrophy, the system will evaluate your capacity to handle high-intensity loads while maintaining metabolic peak.";
      case 'tactical':
        return "Because your current objective is tactical performance, the system will test your work capacity, explosiveness, and foundational power.";
      case 'endurance':
        return "Because your current objective is endurance, the system will evaluate your cardiovascular efficiency and sustainable force production.";
      case 'longevity':
        return "Because your current objective is longevity, the system will test your mobility, core stability, and resting metabolic markers.";
      case 'explosiveness':
      case 'power':
        return "Because your current objective is explosiveness, the system will test your peak power output and vertical/horizontal displacement.";
      default:
        return "The system will evaluate your current physical state and performance markers to recalibrate your training deployment.";
    }
  };

  if (!isUnlocked || !hasEntered) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center pt-safe">
        <div className="absolute inset-0 bg-void/90 backdrop-blur-md z-0" />
        <div className="relative z-10 glass-panel p-4 md:p-8 max-w-lg border-white/5 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-volt/10 text-volt flex items-center justify-center rounded-sm">
            {isUnlocked ? <Activity size={32} /> : <Lock size={32} />}
          </div>
          <div>
            <h2 className="font-sans text-2xl font-semibold uppercase tracking-widest text-white mb-2">
              {isUnlocked ? "Ready to Level Up?" : (t('nav.fitnessTest') || 'TESTING BLOCKED')}
            </h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
              {getObjectiveDescription()}
            </p>
          </div>
          
          {isUnlocked ? (
            <div className="flex flex-col gap-6 w-full mt-2">
              <div className="w-full bg-white/5 p-5 border border-volt/20 relative overflow-hidden group">
                <span className="font-sans text-[10px] uppercase font-black text-volt tracking-[0.2em] block mb-2 underline decoration-volt/30 underline-offset-4">Upcoming Protocol Requirements</span>
                <span className="font-sans text-base font-black text-white uppercase tracking-wider block">{testLabel}</span>

                {testType === 'big3' && (
                  <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-white/5 pt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('onboarding.squat')}</span>
                      <span className="text-sm font-black text-white">{profile?.squatPR || 0}<span className="text-[10px] text-zinc-500 ml-0.5">{profile?.unit === 'imperial' ? 'LB' : 'KG'}</span></span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('onboarding.bench') === 'Bench' ? 'Bench Press' : t('onboarding.bench')}</span>
                      <span className="text-sm font-black text-white">{profile?.benchPR || 0}<span className="text-[10px] text-zinc-500 ml-0.5">{profile?.unit === 'imperial' ? 'LB' : 'KG'}</span></span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('onboarding.deadlift')}</span>
                      <span className="text-sm font-black text-white">{profile?.deadliftPR || 0}<span className="text-[10px] text-zinc-500 ml-0.5">{profile?.unit === 'imperial' ? 'LB' : 'KG'}</span></span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setIsPostponeModalOpen(true)}
                  className="flex-1 basis-1/2 min-w-0 py-4 btn-secondary font-headline text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  Postpone Test
                </button>
                <button
                  onClick={() => setHasEntered(true)}
                  className="flex-1 basis-1/2 min-w-0 py-4 btn-primary font-headline text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <span className="text-xs md:text-sm font-black uppercase tracking-[0.15em]">{t('stage.enterTest')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full bg-white/5 p-4 mt-2">
                <span className="font-sans text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">Time To Next Evaluation</span>
                <span className="font-sans text-3xl font-black text-volt tracking-tighter">{daysRemaining}</span>
                <span className="font-sans text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">DAYS REMAINING</span>
                <span className="font-sans text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mt-2 opacity-50">OR COMPLETE {missionsRemaining} SCHEDULED MISSIONS</span>
              </div>

              <div className="w-full bg-white/5 p-4 border border-volt/20">
                <span className="font-sans text-[10px] uppercase font-bold text-volt tracking-widest block mb-1">Upcoming Protocol Requirements</span>
                <span className="font-sans text-sm font-black text-white uppercase tracking-wider">{testLabel}</span>
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {isPostponeModalOpen && (
            <Portal>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-void/90 backdrop-blur-md z-0" onClick={() => setIsPostponeModalOpen(false)} />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative z-10 w-full max-w-sm glass-panel border-white/10 shadow-2xl p-6 flex flex-col items-center"
                  style={{ borderRadius: '0 !important' }}
                >
                  <div className="flex flex-col items-center text-center gap-6 w-full">
                    <div className="w-16 h-16 bg-volt/10 text-volt flex items-center justify-center border border-volt/20">
                      <Activity size={32} />
                    </div>
                    
                    <div>
                      <h3 className="font-sans text-xl font-black uppercase tracking-widest text-white mb-2">
                        Postpone Evaluation?
                      </h3>
                      <p className="text-zinc-400 text-sm font-medium leading-relaxed font-sans">
                        Completing this evaluation is required to accurately calibrate your next training cycle and ensure optimal progression.
                        <br/><br/>
                        Are you sure you want to bypass this test due to injury or severe fatigue? Your baseline 1RMs will remain stale.
                      </p>
                    </div>

                    <div className="w-full space-y-3">
                      <button
                        onClick={() => {
                          updateProfile({ lastFitnessTestAt: Date.now(), pendingFitnessTest: false, devOverrideFitnessTest: false });
                          setIsPostponeModalOpen(false);
                        }}
                        className="w-full py-5 btn-primary font-sans text-sm font-black uppercase tracking-widest transition-all shadow-lg"
                        style={{ borderRadius: '0 !important' }}
                      >
                        Bypass Evaluation
                      </button>
                      <button
                        onClick={() => setIsPostponeModalOpen(false)}
                        className="w-full py-5 btn-secondary font-sans text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                        style={{ borderRadius: '0 !important' }}
                      >
                        Return to Test
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Portal>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className={cn(
        "relative w-full flex flex-col items-center",
        isReady 
          ? "h-screen h-[100vh] w-screen w-[100vw] overflow-hidden p-0 m-0" 
          : "h-full overflow-y-auto custom-scrollbar pt-safe"
      )}
    >
      <div className={cn(
        "w-full flex-1 flex flex-col items-center",
        isReady 
          ? "h-screen h-[100vh] w-screen w-[100vw] p-0 m-0 justify-center select-none" 
          : "min-h-full py-20 px-0 sm:px-0 md:px-0 justify-center"
      )}>
        {/* Immersive Arena Background */}
        <AnimatePresence>
          {(immersionMode === 'immersive' && isReady) && (
            <motion.div 
              key={selectedStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 z-0"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent z-10" />
              <img 
                src={currentStageImage} 
                alt="Arena Stage" 
                className="w-full h-full object-cover brightness-[0.2] contrast-125 saturate-50"
                referrerPolicy="no-referrer"
              />
              {/* Virtual Floor Grid */}
              <div className="absolute inset-0 opacity-5 z-[5]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--primary-color) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isReady ? renderReadyHUD() : renderSetup()}
        </AnimatePresence>
      </div>



      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {isTermsModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTermsModalOpen(false)}
                className="absolute inset-0 bg-void/90 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="relative w-full max-w-2xl glass-panel p-4 md:p-8 border-white/10 shadow-2xl overflow-hidden min-h-[500px] h-auto max-h-[90vh] flex flex-col"
              >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-volt blur-[100px] opacity-10" />
              
              <div className="relative z-10 flex flex-col flex-1 min-h-0">
                <div className="flex items-center gap-4 mb-6 md:mb-8 shrink-0">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-volt/10 flex items-center justify-center text-volt">
                    <ListChecks size={20} className="md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none text-white">{t('stage.termsSafety')}</h3>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 md:mt-2">{t('stage.mandatoryReview')}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-6 md:space-y-8 custom-scrollbar mb-6 md:mb-8 scroll-smooth text-xs md:text-sm">
                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">1. {t('stage.terms.1.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.1.content')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">2. {t('stage.terms.2.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.2.content')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">3. {t('stage.terms.3.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.3.content')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">4. {t('stage.terms.4.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.4.content')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">5. {t('stage.terms.5.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.5.content')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">6. {t('stage.terms.6.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.6.content')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-volt">7. {t('stage.terms.7.title')}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {t('stage.terms.7.content')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5 shrink-0">
                  <button
                    onClick={() => setIsTermsModalOpen(false)}
                    className="flex-1 py-5 btn-secondary"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.15em]">{t('stage.decline')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsTermsModalOpen(false);
                      setIsReady(true);
                    }}
                    className="flex-[2] py-5 btn-primary shadow-[0_0_30px_var(--primary-glow)]"
                  >
                    <span className="text-sm md:text-base font-black uppercase tracking-[0.15em]">{t('stage.acceptStart')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Withdraw Confirmation Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 md:p-6">
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute inset-0 bg-void/95 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-md glass-panel p-6 md:p-10 border-crimson/20 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-crimson blur-[100px] opacity-10" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-crimson/10 flex items-center justify-center text-crimson mb-4 md:mb-6 border border-crimson/20">
                  <AlertTriangle size={24} className="md:w-8 md:h-8" />
                </div>
                
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none text-white mb-3 md:mb-4">{t('stage.confirmWithdraw')}</h3>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mb-6 md:mb-8">
                  {t('stage.withdrawWarning')}
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => {
                      setIsReady(false);
                      setSetupStep(2);
                      setCurrentTargetIndex(0);
                      setTestTargets(getInitialTargets());
                      setIsWithdrawModalOpen(false);
                      setHasEntered(false);
                      setActiveRestType(null);
                    }}
                    className="w-full py-5 btn-destructive font-sans text-sm font-bold uppercase tracking-widest transition-all shadow-lg"
                  >
                    {t('stage.yesWithdraw')}
                  </button>
                  <button
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="w-full py-5 border border-white/10 text-zinc-500 font-sans text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    {t('stage.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          </Portal>
        )}

        {isPostponeModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-void/90 backdrop-blur-md" onClick={() => setIsPostponeModalOpen(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-10 w-full max-w-sm glass-panel border-white/10 shadow-2xl p-6 flex flex-col items-center"
                style={{ borderRadius: '0 !important' }}
              >
                <div className="flex flex-col items-center text-center gap-6 w-full">
                  <div className="w-16 h-16 bg-volt/10 text-volt flex items-center justify-center border border-volt/20">
                    <Activity size={32} />
                  </div>
                  
                  <div>
                    <h3 className="font-sans text-xl font-black uppercase tracking-widest text-white mb-2">
                      Postpone Evaluation?
                    </h3>
                    <p className="text-zinc-400 text-sm font-medium leading-relaxed font-sans">
                      Completing this evaluation is required to accurately calibrate your next training cycle and ensure optimal progression.
                      <br/><br/>
                      Are you sure you want to bypass this test due to injury or severe fatigue? Your baseline 1RMs will remain stale.
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <button
                      onClick={() => {
                        updateProfile({ lastFitnessTestAt: Date.now(), pendingFitnessTest: false, devOverrideFitnessTest: false });
                        setIsPostponeModalOpen(false);
                      }}
                      className="w-full py-5 btn-primary font-sans text-sm font-black uppercase tracking-widest transition-all shadow-lg"
                      style={{ borderRadius: '0 !important' }}
                    >
                      Bypass Evaluation
                    </button>
                    <button
                      onClick={() => setIsPostponeModalOpen(false)}
                      className="w-full py-5 btn-secondary font-sans text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                      style={{ borderRadius: '0 !important' }}
                    >
                      Return to Test
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Background Ambience Glows */}
      {immersionMode === 'immersive' && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-radial-gradient from-volt/5 via-transparent to-transparent pointer-events-none -z-10" />
      )}
    </div>
  );
};
