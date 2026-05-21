import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Brain, Battery, Moon, Heart, ChevronRight, AlertTriangle, Zap, ShieldCheck, Info, ArrowLeft, Star, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';

interface ReadinessCheckProps {
  onComplete: (score: number, modifier: number, targetRpe: number, biometrics: { sleep: number; stress: number; fatigue: number }) => void;
  onCancel: () => void;
  key?: React.Key;
}

const QUESTIONS = [
  {
    id: 'sleep',
    category: 'Sleep',
    question: 'How was your sleep quality last night?',
    icon: Moon,
    labels: ['Insomnia / Restless', 'Deep / Restorative']
  },
  {
    id: 'fatigue',
    category: 'Fatigue',
    question: 'What is your general energy level right now?',
    icon: Battery,
    labels: ['Exhausted', 'Highly Energized']
  },
  {
    id: 'soreness',
    category: 'Soreness',
    question: 'How do your muscles and joints feel?',
    icon: Activity,
    labels: ['Very Sore / Achy', 'Fresh / No Pain']
  },
  {
    id: 'stress',
    category: 'Stress',
    question: 'What is your current life stress level?',
    icon: Brain,
    labels: ['Overwhelmed', 'Very Low Stress']
  },
  {
    id: 'mood',
    category: 'Mood',
    question: 'How is your motivation to train today?',
    icon: Heart,
    labels: ['Dreading it', 'Dialed in / Hyped']
  }
];

export const ReadinessCheck = ({ onComplete, onCancel }: ReadinessCheckProps) => {
  const { t } = useSettings();
  const { getCalibrationStatus, logDailyHealthCheck } = useWorkout();

  const QUESTIONS = useMemo(() => [
    {
      id: 'sleep',
      category: t('readiness.sleep.category'),
      question: t('readiness.sleep.question'),
      icon: Moon,
      labels: [t('readiness.sleep.label1'), t('readiness.sleep.label2')]
    },
    {
      id: 'fatigue',
      category: t('readiness.fatigue.category'),
      question: t('readiness.fatigue.question'),
      icon: Battery,
      labels: [t('readiness.fatigue.label1'), t('readiness.fatigue.label2')]
    },
    {
      id: 'soreness',
      category: t('readiness.soreness.category'),
      question: t('readiness.soreness.question'),
      icon: Activity,
      labels: [t('readiness.soreness.label1'), t('readiness.soreness.label2')]
    },
    {
      id: 'stress',
      category: t('readiness.stress.category'),
      question: t('readiness.stress.question'),
      icon: Brain,
      labels: [t('readiness.stress.label1'), t('readiness.stress.label2')]
    },
    {
      id: 'mood',
      category: t('readiness.mood.category'),
      question: t('readiness.mood.question'),
      icon: Heart,
      labels: [t('readiness.mood.label1'), t('readiness.mood.label2')]
    }
  ], [t]);
  const calibration = getCalibrationStatus();
  const { recommendedRpe: baselineRecommendedRpe, isRedline } = calibration;

  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const totalScore = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  const isComplete = Object.keys(scores).length === QUESTIONS.length;
  const readinessPercentage = Math.round((totalScore / 25) * 100);

  const adjustedRecommendedRpe = useMemo(() => {
    if (!showResult) return baselineRecommendedRpe;

    let adjusted = baselineRecommendedRpe;
    // Audible Rule: If readiness < 70 and baseline recommendation is high (>= 8), drop to 6
    if (readinessPercentage < 70 && baselineRecommendedRpe >= 8) {
      adjusted = 6;
    } else if (readinessPercentage < 50) {
      adjusted = 5;
    } else if (readinessPercentage < 70 && adjusted > 6) {
      adjusted = 6;
    }
    return adjusted;
  }, [showResult, baselineRecommendedRpe, readinessPercentage]);

  const [targetRpe, setTargetRpe] = useState(baselineRecommendedRpe);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Update targetRpe when adjustedRecommendedRpe changes (e.g. after calculation or showResult)
  useEffect(() => {
    if (adjustedRecommendedRpe) {
      setTargetRpe(adjustedRecommendedRpe);
    }
  }, [adjustedRecommendedRpe]);

  const getScenario = () => {
    if (totalScore >= 21) {
      return {
        type: 'green',
        title: 'readiness.scenario.green.title',
        message: 'readiness.scenario.green.message',
        color: 'text-volt',
        bg: 'bg-volt/10',
        border: 'border-volt',
        icon: Zap,
        modifier: 1.05 // 5% increase
      };
    } else if (totalScore >= 15) {
      return {
        type: 'yellow',
        title: 'readiness.scenario.yellow.title',
        message: 'readiness.scenario.yellow.message',
        color: 'text-[#FFD700]',
        bg: 'bg-[#FFD700]/10',
        border: 'border-[#FFD700]',
        icon: ShieldCheck,
        modifier: 1.0 // No change
      };
    } else {
      return {
        type: 'red',
        title: 'readiness.scenario.red.title',
        message: 'readiness.scenario.red.message',
        color: 'text-crimson',
        bg: 'bg-crimson/10',
        border: 'border-crimson',
        icon: AlertTriangle,
        modifier: 0.9 // 10% decrease
      };
    }
  };

  const scenario = getScenario();

  const handleAnalyze = async () => {
    // Log the HMS data for AI context and persistence immediately so that context calibration updates
    const biometrics = {
      sleep: scores.sleep,
      stress: scores.stress,
      fatigue: scores.fatigue,
      soreness: scores.soreness,
      mood: scores.mood
    };

    try {
      await logDailyHealthCheck(biometrics);
    } catch (e) {
      console.error("Failed to log daily health check:", e);
    }
    
    setShowResult(true);
  };

  const handleComplete = () => {
    onComplete(calibration.readiness, calibration.readinessModifier, baselineRecommendedRpe, {
      sleep: scores.sleep,
      stress: scores.stress,
      fatigue: scores.fatigue
    });
  };

  // Scroll to top when view changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
    window.scrollTo(0, 0);
  }, [showResult]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-void/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-panel border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-3 md:p-8 border-b border-white/5 shrink-0 relative">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight text-white">{t('readiness.title')}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('readiness.scale')}</p>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="p-3 md:p-8 overflow-y-auto flex-1 custom-scrollbar"
        >
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 text-volt">
                        <q.icon size={16} />
                      </div>
                      <div>
                        <h3 className="font-headline text-sm font-black uppercase tracking-widest text-white">{q.category}</h3>
                        <p className="text-xs text-zinc-400">{q.question}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setScores({ ...scores, [q.id]: val })}
                            className={cn(
                              "flex-1 py-3 border font-headline text-sm font-black transition-all",
                              scores[q.id] === val
                                ? "bg-volt/20 border-volt text-volt shadow-[0_0_15px_var(--primary-glow)]"
                                : "bg-surface-container-lowest border-white/5 text-zinc-500 hover:border-white/20 hover:text-white"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                        <span>{q.labels[0]}</span>
                        <span>{q.labels[1]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 py-4"
              >
                <div className={cn("p-4 md:p-6 border flex items-center gap-6 md:gap-8", scenario.bg, scenario.border)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={cn("p-2 bg-white/10", scenario.color)}>
                        <scenario.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-headline text-base md:text-lg font-black uppercase  tracking-tight leading-tight", isRedline ? "text-crimson" : scenario.color)}>
                          {t('readiness.score_result', { score: calibration.readiness })}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-2">
                          {t('readiness.recommendation_msg', { scenario: t(scenario.title).toLowerCase() })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-surface-container-lowest border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      System Readiness Formula
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Baseline Capacity</span>
                      <span className="font-mono text-white">100.0</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Sleep Deficit</span>
                      <span className="font-mono text-crimson">-{calibration.sleepDeficit?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Axial Fatigue Drain</span>
                      <span className="font-mono text-crimson">-{calibration.fatiguePenalty?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                      <span className="text-zinc-400">Systemic Stress</span>
                      <span className="font-mono text-crimson">-{calibration.stressPenalty?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-white font-bold uppercase tracking-widest text-[10px]">Net Readiness</span>
                      <span className="font-mono text-volt font-bold">{calibration.readiness}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div className="p-3 bg-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Modifier</span>
                      <span className="text-xl font-black text-volt">{Math.round(calibration.readinessModifier * 100)}%</span>
                    </div>
                    <div className="p-3 bg-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">sRPE Ceiling</span>
                      <span className="text-xl font-black text-volt">{baselineRecommendedRpe}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 uppercase font-bold mt-2 leading-relaxed">
                    The system automatically calculates exponential decay factors based on your last logged sessions. Manual override has been disabled to ensure autonomous progressive overload.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-3 md:p-6 border-t border-white/5 shrink-0 bg-surface-container-lowest">
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 btn-secondary py-4"
            >
              <X size={16} /> {t('common.close')}
            </button>
            {!showResult ? (
              <button
                onClick={handleAnalyze}
                disabled={!isComplete}
                className="flex-[2] btn-primary py-4 disabled:opacity-50"
              >
                {t('readiness.analyze')} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex-[2] btn-primary py-4"
              >
                {t('readiness.enter')} <Zap size={16} />
              </button>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};
