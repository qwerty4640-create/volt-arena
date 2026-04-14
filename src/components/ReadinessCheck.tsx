import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Brain, Battery, Moon, Heart, ChevronRight, AlertTriangle, Zap, ShieldCheck, Info, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface ReadinessCheckProps {
  onComplete: (score: number, modifier: number) => void;
  onCancel: () => void;
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
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const totalScore = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  const isComplete = Object.keys(scores).length === QUESTIONS.length;
  const readinessPercentage = Math.round((totalScore / 25) * 100);

  const getScenario = () => {
    if (totalScore >= 21) {
      return {
        type: 'green',
        title: 'High Performance',
        message: 'You’re recovered and ready. Today is a great day to push for the higher end of your RPE range.',
        color: 'text-volt',
        bg: 'bg-volt/10',
        border: 'border-volt',
        icon: Zap,
        modifier: 1.05 // 5% increase
      };
    } else if (totalScore >= 15) {
      return {
        type: 'yellow',
        title: 'Stay the Course',
        message: 'You\'re doing okay. Stick to the programmed weights and focus on technique.',
        color: 'text-[#FFD700]',
        bg: 'bg-[#FFD700]/10',
        border: 'border-[#FFD700]',
        icon: ShieldCheck,
        modifier: 1.0 // No change
      };
    } else {
      return {
        type: 'red',
        title: 'Low Energy Mode',
        message: 'Looks like recovery is low today. We’ve dialed back the intensity so you can stay in the game without burning out.',
        color: 'text-crimson',
        bg: 'bg-crimson/10',
        border: 'border-crimson',
        icon: AlertTriangle,
        modifier: 0.9 // 10% decrease
      };
    }
  };

  const scenario = getScenario();

  const handleComplete = () => {
    onComplete(readinessPercentage, scenario.modifier);
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
        <div className="p-6 md:p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={onCancel}
              className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="space-y-1">
              <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white">Pre-Training Questionnaire</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hooper-Mackinnon Scale</p>
            </div>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar"
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
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Readiness Score</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-headline text-6xl font-black italic text-white">{readinessPercentage}</span>
                    <span className="font-headline text-2xl font-black text-volt">%</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">({totalScore} / 25 Points)</p>
                </div>

                <div className={cn("p-6 border", scenario.bg, scenario.border)}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn("p-3 bg-white/10", scenario.color)}>
                      <scenario.icon size={24} />
                    </div>
                    <div>
                      <h3 className={cn("font-headline text-xl font-black uppercase italic tracking-tight", scenario.color)}>
                        {scenario.title}
                      </h3>
                      {scenario.type === 'red' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-crimson mt-1">Intensity Reduced by 10%</p>
                      )}
                      {scenario.type === 'green' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-volt mt-1">Intensity Increased by 5%</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {scenario.message}
                  </p>
                </div>

                {/* Trend Analysis Hint */}
                <div className="p-4 bg-surface-container-lowest border border-white/5 flex gap-4">
                  <Info className="text-zinc-500 shrink-0" size={16} />
                  <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">
                    <span className="text-white">Trend Analysis:</span> Persistent high stress levels may trigger a Deload Week. Chronic high soreness may result in permanent volume reduction.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 md:p-8 border-t border-white/5 shrink-0 bg-surface-container-lowest">
          {!showResult ? (
            <button
              onClick={() => setShowResult(true)}
              disabled={!isComplete}
              className="w-full py-4 bg-volt text-void font-headline text-sm font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_var(--primary-glow)] transition-all disabled:opacity-50 disabled:hover:bg-volt disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              Analyze Readiness <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-volt text-void font-headline text-sm font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_var(--primary-glow)] transition-all flex items-center justify-center gap-2"
            >
              Initialize Protocol <Zap size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
