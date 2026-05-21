import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Lock,
  CheckCircle2,
  ListChecks,
  Map,
  Dumbbell,
  ArrowRight,
  ChevronRight,
  Circle,
  Trophy,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Timer,
  Activity
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
  const { t, profile, updateProfile } = useSettings();
  const { getNextWorkoutTemplate } = useWorkout();
  const nextWorkout = getNextWorkoutTemplate();
  const { isUnlocked, daysRemaining, missionsRemaining, testLabel, testType, isFinalTest } = getFitnessTestInfo(profile, nextWorkout?.title);
  
  const [isReady, setIsReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
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
          { name: 'Farmer Carry Max', target: 100, unit: 'kg', step: 5 },
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
          { name: 'Power Clean 1RM', target: 100, unit: 'kg', step: 2.5 },
          { name: 'Broad Jump', target: 100, unit: 'in', step: 1 }
        ];
      default: // big3
        return [
          { name: 'stage.squat', target: 225, unit: 'kg', step: 2.5 },
          { name: 'stage.benchPress', target: 145, unit: 'kg', step: 2.5 },
          { name: 'stage.deadlift', target: 265, unit: 'kg', step: 2.5 }
        ];
    }
  };

  const [testTargets, setTestTargets] = useState<{name: string, target: number, unit: string, step: number}[]>(getInitialTargets());
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  
  // Voice Recognition State
  const [hoveredChecklistItem, setHoveredChecklistItem] = useState<string | null>(null);
  const lastProcessedCommandRef = React.useRef<number>(0);

  React.useEffect(() => {
    onReadyChange?.(isReady);
  }, [isReady, onReadyChange]);

  const toggleCheck = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const updateTarget = (index: number, delta: number) => {
    setTestTargets(prev => prev.map((l, i) => i === index ? { ...l, target: Math.max(0, l.target + delta) } : l));
  };

  const setTargetValue = (index: number, value: number) => {
    setTestTargets(prev => prev.map((l, i) => i === index ? { ...l, target: value } : l));
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

    // Handle Checklist (Step 3)
    if (setupStep === 3 && hoveredChecklistItem) {
      if (transcript.includes('yes') || transcript.includes('ready') || transcript.includes('check')) {
        setCheckedItems(prev => prev.includes(hoveredChecklistItem) ? prev : [...prev, hoveredChecklistItem]);
      }
    }

    // Global Commands (Redundant but kept for local context if needed)
    if (transcript.includes('next step')) {
      if (setupStep === 1) setSetupStep(2);
      else if (setupStep === 2) setSetupStep(3);
    }
    if (transcript.includes('back')) {
      if (setupStep === 2) setSetupStep(1);
      else if (setupStep === 3) setSetupStep(2);
    }
    if (transcript.includes('enter arena') || transcript.includes('start competition')) {
      if (setupStep === 3) setIsTermsModalOpen(true);
    }
  }, [lastVoiceCommand, isVoiceActive, setupStep, hoveredChecklistItem]);

  // Scroll to top when step or view changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
    window.scrollTo(0, 0);
  }, [setupStep, isReady]);

  const isSetupComplete = checkedItems.length === CHECKLIST_ITEMS.length;

  const currentTargetItem = testTargets[currentTargetIndex];

  const renderSetup = () => (
    <motion.div 
      key={`step-${setupStep}`}
      initial={{ opacity: 0, x: setupStep === 1 ? -20 : setupStep === 2 ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: setupStep === 1 ? 20 : setupStep === 2 ? 0 : -20 }}
      className="relative z-30 w-full max-w-screen-2xl flex flex-col gap-6 md:grid md:grid-cols-12 md:gap-8"
    >
      {/* Header */}
      <div className="col-span-12 mb-4 md:mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Trophy className="text-volt" size={24} />
          <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-volt">
            {t('stage.stepCount', { step: setupStep, total: 3 })}: {setupStep === 1 ? t('stage.selectArena') : setupStep === 2 ? t('stage.enterWeights') : t('stage.safetyProtocol')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn("w-8 md:w-12 h-1 transition-colors", setupStep === 1 ? "bg-volt" : "bg-volt/20")} />
          <div className={cn("w-8 md:w-12 h-1 transition-colors", setupStep === 2 ? "bg-volt" : "bg-volt/20")} />
          <div className={cn("w-8 md:w-12 h-1 transition-colors", setupStep === 3 ? "bg-volt" : "bg-volt/20")} />
        </div>
      </div>

      {setupStep === 1 && (
        <div className="col-span-12">
          <section className="glass-panel p-6 md:p-12 border-white/5 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id as StageType)}
                  className={cn(
                    "relative h-28 md:h-36 lg:h-44 overflow-hidden border-2 transition-all group",
                    selectedStage === stage.id 
                      ? "border-volt ring-4 ring-volt/20" 
                      : "border-white/5 hover:border-white/20"
                  )}
                >
                  <img 
                    src={stage.image} 
                    alt={stage.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-left">
                    <span className={cn(
                      "font-sans text-sm font-bold uppercase tracking-widest",
                      selectedStage === stage.id ? "text-volt" : "text-white"
                    )}>
                      {t(stage.label)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setSetupStep(2)}
              className="w-full py-4 btn-primary group shadow-[0_0_30px_var(--primary-glow)]"
            >
              <span className="text-sm md:text-base font-black uppercase tracking-[0.15em]">{t('stage.nextStep')}</span>
              <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </section>
        </div>
      )}

      {setupStep === 2 && (
        <div className="col-span-12 flex flex-col gap-6 md:gap-8">
          <section className="glass-panel p-6 md:p-8 border-none space-y-6">
            <div className="space-y-3 md:space-y-4">
              {testTargets.map((targetItem, index) => (
                <div 
                  key={targetItem.name}
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
                    <div className="text-center min-w-[80px] md:min-w-[100px]">
                      <span className="text-2xl md:text-3xl font-black text-volt leading-none">{targetItem.target.toFixed(1)}</span>
                      <span className="text-[10px] font-black text-zinc-500 ml-1 uppercase">{t(targetItem.unit)}</span>
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
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setSetupStep(1)}
                className="flex-1 py-3 btn-secondary"
              >
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.15em]">{t('stage.back')}</span>
              </button>
              <button
                onClick={() => setSetupStep(3)}
                className="flex-[2] py-4 btn-primary group shadow-[0_0_30px_var(--primary-glow)]"
              >
                <span className="text-sm md:text-base font-black uppercase tracking-[0.15em]">{t('stage.nextStep')}</span>
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </section>
        </div>
      )}

      {setupStep === 3 && (
        <div className="col-span-12">
          <div className="glass-panel p-6 md:p-12 border-none flex flex-col gap-6 md:gap-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {CHECKLIST_ITEMS.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleCheck(item)}
                  onMouseEnter={() => setHoveredChecklistItem(item)}
                  onMouseLeave={() => setHoveredChecklistItem(null)}
                  className={cn(
                    "flex items-center justify-between p-4 md:p-6 border-none transition-all group relative",
                    checkedItems.includes(item)
                      ? "bg-volt/10 text-volt"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10",
                    hoveredChecklistItem === item && !checkedItems.includes(item) && "ring-2 ring-volt/40"
                  )}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest">{t(item)}</span>
                    {hoveredChecklistItem === item && !checkedItems.includes(item) && isVoiceActive && (
                      <span className="text-[10px] font-bold text-volt/60 uppercase tracking-widest mt-1 animate-pulse">{t('stage.voiceReady')}</span>
                    )}
                  </div>
                  {checkedItems.includes(item) ? (
                    <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                  ) : (
                    <Circle size={20} className="md:w-6 md:h-6 opacity-20 group-hover:opacity-40" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => setSetupStep(2)}
                className="flex-1 py-3 btn-secondary"
              >
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.15em]">{t('stage.back')}</span>
              </button>
              <button
                disabled={!isSetupComplete}
                onClick={() => setIsTermsModalOpen(true)}
                className={cn(
                  "flex-[2] py-4 group relative overflow-hidden",
                  isSetupComplete 
                    ? "btn-primary shadow-[0_0_40px_var(--primary-glow)]" 
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 relative z-10">
                  <div className={cn(
                    "px-2 md:px-3 py-1 font-headline text-[10px] font-black flex items-center gap-2",
                    isSetupComplete ? "bg-void/20 text-void" : "bg-white/5 text-zinc-500"
                  )}>
                    <span className="text-[10px] md:text-xs">{checkedItems.length}/{CHECKLIST_ITEMS.length}</span>
                    <span className="uppercase tracking-widest opacity-60 hidden sm:inline">{t('stage.verified')}</span>
                  </div>
                  <span className="text-sm md:text-base font-black uppercase tracking-[0.1em] md:tracking-[0.15em]">{t('stage.startCompetition')}</span>
                </div>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderReadyHUD = () => (
    <div className="relative z-20 w-full max-w-screen-2xl h-full flex flex-col justify-between py-6 md:py-12 px-2 md:px-12 pointer-events-none">
      {/* Top Content: Main Status and Biometrics */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-0">
        
        {/* Left Side: Phase Information */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:flex-1 flex flex-col gap-4 md:gap-6 items-center lg:items-start pointer-events-auto order-2 lg:order-1"
        >
          {/* Phase Card */}
          <div className="glass-panel p-6 md:p-8 w-full max-w-xs md:w-80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-6 text-volt">
              <Timer size={20} className="md:w-6 md:h-6 animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-4 md:gap-6">
              <div>
                <p className="font-sans text-[10px] md:text-[10px] tracking-[0.2em] text-volt uppercase font-bold mb-2">{t('stage.currentPhase')}</p>
                <h2 className="font-sans text-2xl md:text-4xl font-black tracking-tight text-white uppercase">{t(currentTargetItem.name)}</h2>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-sans text-[10px] md:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold">{t('stage.stabilityLock')}</p>
                  <span className="font-sans text-[10px] md:text-[10px] font-bold text-volt">98%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800/50 overflow-hidden">
                  <div 
                    style={{ width: '98%' }}
                    className="h-full bg-volt shadow-[0_0_15px_var(--primary-glow)]" 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="font-sans text-[8px] md:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold">{t('stage.gripTension')}</p>
                <span className="font-sans text-[8px] md:text-[10px] font-bold text-volt uppercase tracking-widest">{t('stage.active')}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsReady(false)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
          >
            <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="font-sans text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{t('stage.backProtocol')}</span>
          </button>
        </motion.div>

          <div className="w-full lg:w-auto flex flex-col items-center gap-4 md:gap-8 order-1 lg:order-2">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: 1,
                boxShadow: [
                  "0 0 40px var(--primary-glow)",
                  "0 0 60px var(--primary-glow)",
                  "0 0 40px var(--primary-glow)"
                ]
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.5 }
              }}
              className="px-8 md:px-16 py-4 md:py-6 border-2 border-volt/40 bg-volt/5 backdrop-blur-xl"
            >
              <h1 className="font-sans text-3xl md:text-6xl font-black tracking-[0.2em] md:tracking-[0.4em] text-volt text-glow-volt text-center translate-x-[0.1em] md:translate-x-[0.2em]">
                {t('stage.ready')}
              </h1>
            </motion.div>

            <div className="flex flex-col items-center gap-1 md:gap-2">
              <span className="font-sans text-zinc-500 text-[8px] md:text-[10px] tracking-[0.2em] font-bold uppercase">{t('stage.targetLoad')}</span>
              <div className="flex items-baseline gap-2 md:gap-3">
                <span className="font-sans text-4xl md:text-7xl font-black tracking-tighter text-white">{currentTargetItem.target.toFixed(1)}</span>
                <span className="font-sans text-lg md:text-2xl font-bold text-volt">{t(currentTargetItem.unit)}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-2 md:mt-4 pointer-events-auto">
              {testTargets.map((targetItem, i) => (
                <button
                  key={targetItem.name}
                  onClick={() => setCurrentTargetIndex(i)}
                  className={cn(
                    "px-3 md:px-4 py-1.5 md:py-2 font-sans text-[10px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                    currentTargetIndex === i 
                      ? "bg-volt text-void shadow-[0_0_15px_var(--primary-glow)]" 
                      : "bg-white/5 text-zinc-500 hover:bg-white/10"
                  )}
                >
                  {t(targetItem.name).split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

        {/* Right Side: Biometrics */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:flex-1 flex flex-col gap-4 md:gap-6 items-center lg:items-end pointer-events-auto order-3"
        >
          {/* Biometric Data Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-xs md:w-auto">
            <div className="glass-panel p-4 md:p-6 w-full md:w-40 shadow-xl border-white/5">
              <p className="font-sans text-[10px] md:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold mb-2 md:mb-3">{t('stage.heartRate')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xl md:text-3xl font-black text-white">142</span>
                <span className="font-sans text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase">{t('stage.bpm')}</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-900 overflow-hidden">
                <div className="h-full bg-crimson w-3/4 shadow-[0_0_10px_rgba(255,0,0,0.3)]" />
              </div>
            </div>

            <div className="glass-panel p-4 md:p-6 w-full md:w-40 shadow-xl border-white/5">
              <p className="font-sans text-[10px] md:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold mb-2 md:mb-3">{t('stage.vo2Max')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xl md:text-3xl font-black text-white">58.2</span>
                <span className="font-sans text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase">{t('stage.peak')}</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-900 overflow-hidden">
                <div className="h-full bg-volt w-4/5 shadow-[0_0_10px_var(--primary-glow)]" />
              </div>
            </div>

            <div className="glass-panel p-4 md:p-6 w-full md:w-40 shadow-xl border-white/5">
              <p className="font-sans text-[10px] md:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold mb-2 md:mb-3">{t('stage.bodyTemp')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xl md:text-3xl font-black text-white">37.2</span>
                <span className="font-sans text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase">{t('stage.celsius')}</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-900 overflow-hidden">
                <div className="h-full bg-white/40 w-1/2" />
              </div>
            </div>

            <div className="glass-panel p-4 md:p-6 w-full md:w-40 shadow-xl border-white/5">
              <p className="font-sans text-[10px] md:text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold mb-2 md:mb-3">{t('stage.bloodOxygen')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xl md:text-3xl font-black text-white">99</span>
                <span className="font-sans text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase">%</span>
              </div>
              <div className="mt-2 h-1 w-full bg-zinc-900 overflow-hidden">
                <div className="h-full bg-volt w-[99%]" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Content: Navigation and Action */}
      <div className="flex items-end justify-between mt-12 pointer-events-auto">
        <div className="flex-1" />
        <div className="flex-1 flex justify-center">
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => {
              // Extract new PRs if applicable
              const squatTarget = testTargets.find(t => t.name.toLowerCase().includes('squat'));
              const benchTarget = testTargets.find(t => t.name.toLowerCase().includes('bench'));
              const deadliftTarget = testTargets.find(t => t.name.toLowerCase().includes('deadlift'));

              updateProfile({
                pendingFitnessTest: false,
                devOverrideFitnessTest: false,
                lastFitnessTestAt: Date.now(),
                ...(isFinalTest && { programResetAt: Date.now() }), // Only restart timeline if it is the final test
                ...(squatTarget && { squatPR: squatTarget.target }),
                ...(benchTarget && { benchPR: benchTarget.target }),
                ...(deadliftTarget && { deadliftPR: deadliftTarget.target }),
              });
              setIsReady(false);
              setSetupStep(1);
              setCheckedItems([]);
              setHasEntered(false);
            }}
            className="px-6 py-4 btn-primary font-headline text-xs font-black uppercase tracking-widest flex items-center gap-2 group"
          >
            <span>SUBMIT RESULTS</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

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
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center pt-safe">
        <div className="absolute inset-0 bg-void/90 backdrop-blur-md z-0" />
        <div className="relative z-10 glass-panel p-8 md:p-12 max-w-lg border-white/5 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-volt/10 text-volt flex items-center justify-center rounded-sm">
            {isUnlocked ? <Activity size={32} /> : <Lock size={32} />}
          </div>
          <div>
            <h2 className="font-sans text-2xl font-black uppercase tracking-widest text-white mb-2">
              {isUnlocked ? "Ready to Level Up?" : (t('nav.fitnessTest') || 'TESTING BLOCKED')}
            </h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
              {getObjectiveDescription()}
            </p>
          </div>
          
          {isUnlocked ? (
            <div className="flex flex-col gap-6 w-full mt-2">
              <div className="w-full bg-white/5 p-5 border border-volt/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                  <Trophy size={48} className="text-volt" />
                </div>
                <span className="font-sans text-[10px] uppercase font-black text-volt tracking-[0.2em] block mb-2 underline decoration-volt/30 underline-offset-4">Upcoming Protocol Requirements</span>
                <span className="font-sans text-base font-black text-white uppercase tracking-wider block">{testLabel}</span>

                {testType === 'big3' && (
                  <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-white/5 pt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('onboarding.movement.squat').split(' ')[0]}</span>
                      <span className="text-sm font-black text-white">{profile?.squatPR || 0}<span className="text-[10px] text-zinc-500 ml-0.5">{profile?.unit === 'imperial' ? 'LB' : 'KG'}</span></span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('onboarding.movement.bench').split(' ')[0]}</span>
                      <span className="text-sm font-black text-white">{profile?.benchPR || 0}<span className="text-[10px] text-zinc-500 ml-0.5">{profile?.unit === 'imperial' ? 'LB' : 'KG'}</span></span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('onboarding.movement.deadlift').split(' ')[0]}</span>
                      <span className="text-sm font-black text-white">{profile?.deadliftPR || 0}<span className="text-[10px] text-zinc-500 ml-0.5">{profile?.unit === 'imperial' ? 'LB' : 'KG'}</span></span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setHasEntered(true)}
                  className="flex-1 py-4 btn-primary font-headline text-xs font-black uppercase tracking-widest"
                >
                  Enter Test
                </button>
                <button
                  onClick={() => setIsPostponeModalOpen(true)}
                  className="flex-1 py-4 btn-secondary font-headline text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-white/10"
                >
                  Postpone Due to Fatigue/Injury
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
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="relative w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar pt-safe"
    >
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-full py-20 px-3 md:px-12">
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

      {/* Withdraw from Competition Button */}
      <AnimatePresence>
        {isReady && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-8 py-3 btn-destructive font-sans text-[10px] font-bold uppercase tracking-[0.3em] transition-all backdrop-blur-md"
            >
              {t('stage.withdrawCompetition')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                className="relative w-full max-w-2xl glass-panel p-6 md:p-10 border-white/10 shadow-2xl overflow-hidden min-h-[500px] h-auto max-h-[90vh] flex flex-col"
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
                      setSetupStep(1);
                      setCheckedItems([]);
                      setCurrentTargetIndex(0);
                      setTestTargets(getInitialTargets());
                      setIsWithdrawModalOpen(false);
                      setHasEntered(false);
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
              className="relative w-full max-w-sm glass-panel border-white/10 shadow-2xl p-6"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-volt/10 text-volt flex items-center justify-center rounded-sm">
                  <Activity size={32} />
                </div>
                
                <div>
                  <h3 className="font-sans text-xl font-black uppercase tracking-widest text-white mb-2">
                    Postpone Evaluation?
                  </h3>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">
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
                    className="w-full py-5 bg-white text-void font-sans text-sm font-black uppercase tracking-widest transition-all shadow-lg"
                  >
                    Bypass Evaluation
                  </button>
                  <button
                    onClick={() => setIsPostponeModalOpen(false)}
                    className="w-full py-5 border border-white/10 text-zinc-500 font-sans text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
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
