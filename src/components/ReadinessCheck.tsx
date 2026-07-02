import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Brain,
  Battery,
  Moon,
  Heart,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Info,
  ArrowLeft,
  Star,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useSettings } from "../contexts/SettingsContext";
import { useWorkout } from "../contexts/WorkoutContext";

interface ReadinessCheckProps {
  onComplete: (
    score: number,
    modifier: number,
    targetRpe: number,
    biometrics: { sleep: number; stress: number; fatigue: number },
  ) => void;
  onCancel: () => void;
  key?: React.Key;
}

const QUESTIONS = [
  {
    id: "sleep",
    category: "Sleep",
    question: "How was your sleep quality last night?",
    icon: Moon,
    labels: ["Insomnia / Restless", "Deep / Restorative"],
  },
  {
    id: "fatigue",
    category: "Fatigue",
    question: "What is your general energy level right now?",
    icon: Battery,
    labels: ["Exhausted", "Highly Energized"],
  },
  {
    id: "soreness",
    category: "Soreness",
    question: "How do your muscles and joints feel?",
    icon: Activity,
    labels: ["Very Sore / Achy", "Fresh / No Pain"],
  },
  {
    id: "stress",
    category: "Stress",
    question: "What is your current life stress level?",
    icon: Brain,
    labels: ["Overwhelmed", "Very Low Stress"],
  },
  {
    id: "mood",
    category: "Mood",
    question: "How is your motivation to train today?",
    icon: Heart,
    labels: ["Dreading it", "Dialed in / Hyped"],
  },
];

export const ReadinessCheck = ({
  onComplete,
  onCancel,
}: ReadinessCheckProps) => {
  const { t } = useSettings();
  const { getCalibrationStatus, logDailyHealthCheck, getNextWorkoutTemplate } =
    useWorkout();

  const nextWorkout = useMemo(
    () => getNextWorkoutTemplate(),
    [getNextWorkoutTemplate],
  );
  const isHybridOrRecovery = useMemo(() => {
    if (!nextWorkout) return false;
    const title = nextWorkout.title.toLowerCase();
    return (
      title.includes("hybrid") ||
      title.includes("recovery") ||
      title.includes("restoration")
    );
  }, [nextWorkout]);

  const QUESTIONS = useMemo(
    () => [
      {
        id: "sleep",
        category: t("readiness.sleep.category"),
        question: t("readiness.sleep.question"),
        icon: Moon,
        labels: [t("readiness.sleep.label1"), t("readiness.sleep.label2")],
      },
      {
        id: "fatigue",
        category: t("readiness.fatigue.category"),
        question: t("readiness.fatigue.question"),
        icon: Battery,
        labels: [t("readiness.fatigue.label1"), t("readiness.fatigue.label2")],
      },
      {
        id: "soreness",
        category: t("readiness.soreness.category"),
        question: t("readiness.soreness.question"),
        icon: Activity,
        labels: [
          t("readiness.soreness.label1"),
          t("readiness.soreness.label2"),
        ],
      },
      {
        id: "stress",
        category: t("readiness.stress.category"),
        question: t("readiness.stress.question"),
        icon: Brain,
        labels: [t("readiness.stress.label1"), t("readiness.stress.label2")],
      },
      {
        id: "mood",
        category: t("readiness.mood.category"),
        question: t("readiness.mood.question"),
        icon: Heart,
        labels: [t("readiness.mood.label1"), t("readiness.mood.label2")],
      },
    ],
    [t],
  );
  const calibration = getCalibrationStatus();
  const { recommendedRpe: baselineRecommendedRpe, isRedline } = calibration;

  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    sorenessVal,
    sorenessMult,
    moodVal,
    moodMult,
    subjectiveFatigueDeficit,
    calculatedSubtotal
  } = useMemo(() => {
    const sorenessVal = scores.soreness !== undefined ? scores.soreness : 5;
    let sorenessMult = 1.0;
    if (sorenessVal <= 1) sorenessMult = 0.85;
    else if (sorenessVal === 2) sorenessMult = 0.90;
    else if (sorenessVal === 3) sorenessMult = 0.95;
    else if (sorenessVal === 4) sorenessMult = 1.00;

    const moodVal = scores.mood !== undefined ? scores.mood : 5;
    let moodMult = 1.0;
    if (moodVal <= 1) moodMult = 0.90;
    else if (moodVal === 2) moodMult = 0.95;
    else if (moodVal === 3) moodMult = 1.00;
    else if (moodVal === 4) moodMult = 1.00;

    const subjectiveFatigueDeficit = (5 - (scores.fatigue || 5)) * 4;
    const rawReadiness = 100 - (calibration.sleepDeficit || 0) - (calibration.fatiguePenalty || 0) - (calibration.stressPenalty || 0) - subjectiveFatigueDeficit;
    const calculatedSubtotal = Math.max(0, rawReadiness);

    return {
      sorenessVal,
      sorenessMult,
      moodVal,
      moodMult,
      subjectiveFatigueDeficit,
      calculatedSubtotal
    };
  }, [scores, calibration]);

  const dynamicReadinessScore = Math.round(Math.max(0, Math.min(100, calculatedSubtotal * sorenessMult * moodMult)));

  const dynamicReadinessModifier = useMemo(() => {
    let finalReadinessModifier = 1.0;
    if (dynamicReadinessScore >= 80) {
      finalReadinessModifier = 1.0;
    } else if (dynamicReadinessScore >= 50) {
      finalReadinessModifier = 0.90 + ((dynamicReadinessScore - 50) / 30) * 0.10;
    } else {
      finalReadinessModifier = 0.75 + (dynamicReadinessScore / 50) * 0.15;
    }
    // Note: To match recoveryEngine accurately, we would need historyFatigueDiscount. 
    // But since HMS is an authoritative override, we just pass this base modifier.
    return finalReadinessModifier;
  }, [dynamicReadinessScore]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalScore = (Object.values(scores) as number[]).reduce(
    (a, b) => a + b,
    0,
  );
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

    if (isHybridOrRecovery) {
      // 3. Cap Session RPE ceiling for Hybrid/Recovery missions, disregarding high readiness
      adjusted = Math.min(adjusted, 7.5);
    }

    return adjusted;
  }, [
    showResult,
    baselineRecommendedRpe,
    readinessPercentage,
    isHybridOrRecovery,
  ]);

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
        type: "green",
        title: "readiness.scenario.green.title",
        message: "readiness.scenario.green.message",
        color: "text-volt",
        bg: "bg-volt/10",
        border: "border-volt",
        icon: Zap,
        modifier: 1.05, // 5% increase
      };
    } else if (totalScore >= 15) {
      return {
        type: "yellow",
        title: "readiness.scenario.yellow.title",
        message: "readiness.scenario.yellow.message",
        color: "text-[#FFD700]",
        bg: "bg-[#FFD700]/10",
        border: "border-[#FFD700]",
        icon: ShieldCheck,
        modifier: 1.0, // No change
      };
    } else {
      return {
        type: "red",
        title: "readiness.scenario.red.title",
        message: "readiness.scenario.red.message",
        color: "text-crimson",
        bg: "bg-crimson/10",
        border: "border-crimson",
        icon: AlertTriangle,
        modifier: 0.9, // 10% decrease
      };
    }
  };

  const scenario = getScenario();

  const handleAnalyze = () => {
    // Log the HMS data for AI context and persistence immediately so that context calibration updates
    const biometrics = {
      sleep: scores.sleep,
      stress: scores.stress,
      fatigue: scores.fatigue,
      soreness: scores.soreness,
      mood: scores.mood,
    };

    // Fire and forget to prevent UI block if network/Firebase hangs on iPad
    logDailyHealthCheck(biometrics).catch((e) => {
      console.error("Failed to log daily health check background:", e);
    });

    setShowResult(true);
  };

  const handleComplete = () => {
    onComplete(
      dynamicReadinessScore,
      dynamicReadinessModifier,
      targetRpe,
      {
        sleep: scores.sleep,
        stress: scores.stress,
        fatigue: scores.fatigue,
      },
    );
  };

  // Scroll to top when view changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [showResult]);

  return (
    <>
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
              <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                {t("readiness.title")}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {t("readiness.scale")}
              </p>
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
                        <h3 className="font-headline text-sm font-black uppercase tracking-widest text-white">
                          {q.category}
                        </h3>
                        <p className="text-xs text-zinc-400">{q.question}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() =>
                              setScores({ ...scores, [q.id]: val })
                            }
                            className={cn(
                              "flex-1 py-3 border font-headline text-sm font-black transition-all",
                              scores[q.id] === val
                                ? "bg-volt/20 border-volt text-volt shadow-[0_0_15px_var(--primary-glow)]"
                                : "bg-surface-container-lowest border-white/5 text-zinc-500 hover:border-white/20 hover:text-white",
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
                <div
                  className={cn(
                    "p-4 md:p-6 border flex items-start gap-4 md:gap-6",
                    scenario.bg,
                    scenario.border,
                  )}
                >
                  <div className={cn("p-2.5 bg-white/5 mt-0.5 shrink-0", scenario.color)}>
                    <scenario.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-headline text-base md:text-lg font-black uppercase tracking-tight leading-tight",
                        isRedline ? "text-crimson" : scenario.color,
                      )}
                    >
                      YOUR READINESS IS {dynamicReadinessScore}%.
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Based on your response, you are ready for {t(scenario.title)}. Take it easy on the warm ups and focus on technique.
                    </p>
                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      Stay at modified weight to prevent excessive neural fatigue.
                    </p>
                  </div>
                </div>

                {(() => {
                  return (
                    <div className="space-y-6">
                      {/* Metrics Side-by-Side Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-900/40 border border-white/5 flex flex-col justify-between h-full">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              WEIGHT MODIFIER
                            </span>
                            <span className="text-2xl font-black text-volt font-headline mt-1.5 mb-2 block leading-none">
                              {Math.round(dynamicReadinessModifier * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 leading-relaxed block">
                            Your target training weights are auto-scaled by {Math.round(dynamicReadinessModifier * 100)}% to align with current neurological drive for primary lift.
                          </span>
                        </div>

                        <div className="p-4 bg-zinc-900/40 border border-white/5 flex flex-col justify-between h-full">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              SRPE CEILING
                            </span>
                            <span className="text-2xl font-black text-volt font-headline mt-1.5 mb-2 block leading-none">
                              {targetRpe}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 leading-relaxed block">
                            Your Session RPE is capped at {targetRpe} to prevent excessive muscular/neural fatigue. Stay at or under RPE {targetRpe} on each set.
                          </span>
                        </div>
                      </div>

                      {/* Expandable Accordion for Diagnostics */}
                      <div className="border border-white/5 bg-surface-container-lowest overflow-hidden">
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="w-full py-4 bg-white/[0.02] hover:bg-white/5 flex items-center justify-between px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all rounded-none"
                        >
                          <span className="flex items-center gap-2">
                            <Info size={14} className="text-volt" />
                            {showDetails ? "Hide Calculation Breakdown" : "View Calculation Breakdown"}
                          </span>
                          <ChevronDown
                            size={14}
                            className={cn(
                              "transition-transform duration-300 text-zinc-400",
                              showDetails && "rotate-180 text-volt"
                            )}
                          />
                        </button>

                        <AnimatePresence>
                          {showDetails && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="border-t border-white/5 overflow-hidden"
                            >
                              <div className="p-4 space-y-6 text-xs leading-relaxed text-zinc-300">
                                {/* Section 1: Why It Matters */}
                                <div>
                                  <h4 className="font-headline font-bold text-base text-volt mb-1.5">
                                    1. Why these metrics matter
                                  </h4>
                                  <p className="text-xs text-zinc-400">
                                    These numbers serve as automatic regulators for your workout. Instead of forcing fixed loads, the system scales weights, sets, and reps in real-time to align with your current neurological and recovery capacities. This optimizes strength progression while preventing central nervous system (CNS) burnout.
                                  </p>
                                </div>

                                {/* Section 2: Why Applied */}
                                <div>
                                  <h4 className="font-headline font-bold text-base text-volt mb-1.5">
                                    2. Why scaling was applied
                                  </h4>
                                  <p className="text-xs text-zinc-400">
                                    The system tracks accumulated fatigue decay from the last 5 sessions and combines it with today’s subjective biometrics, such as sleep, stress, fatigue, soreness, and motivation to map your overall recovery state.
                                  </p>
                                </div>

                                {/* Section 3: Diagnostic Calculation Breakdown */}
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="font-headline font-bold text-base text-volt">
                                      3. Net readiness calculation
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowFormulaTooltip(true);
                                      }}
                                      className="text-zinc-500 hover:text-white transition-colors"
                                      title="Explain metrics"
                                    >
                                      <Info size={14} className="text-volt" />
                                    </button>
                                  </div>

                                  <div className="bg-void/40 border border-white/5 p-4 space-y-4 font-mono text-xs text-zinc-400">
                                    {/* Subtraction Table */}
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span>Baseline Capacity</span>
                                        <span className="text-white">100.0</span>
                                      </div>
                                      {(calibration.sleepDeficit || 0) > 0 && (
                                        <div className="flex justify-between text-crimson">
                                          <span>- Sleep Deficit</span>
                                          <span>-{calibration.sleepDeficit?.toFixed(1)}</span>
                                        </div>
                                      )}
                                      {(calibration.fatiguePenalty || 0) > 0 && (
                                        <div className="flex justify-between text-crimson">
                                          <span>- Axial Fatigue Drain</span>
                                          <span>-{calibration.fatiguePenalty?.toFixed(1)}</span>
                                        </div>
                                      )}
                                      {(calibration.stressPenalty || 0) > 0 && (
                                        <div className="flex justify-between text-crimson">
                                          <span>- Systemic Life Stress</span>
                                          <span>-{calibration.stressPenalty?.toFixed(1)}</span>
                                        </div>
                                      )}
                                      {subjectiveFatigueDeficit > 0 && (
                                        <div className="flex justify-between text-crimson">
                                          <span>- Subjective Fatigue</span>
                                          <span>-{subjectiveFatigueDeficit.toFixed(1)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between border-t border-b border-white/10 py-2.5 font-bold text-white items-center">
                                        <div className="flex items-center gap-1.5">
                                          <span>Raw Subtotal</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setShowFormulaTooltip(true);
                                            }}
                                            className="text-zinc-500 hover:text-white transition-colors"
                                            title="Explain calculation"
                                          >
                                            <Info size={14} className="text-volt cursor-pointer" />
                                          </button>
                                        </div>
                                        <span>{calculatedSubtotal.toFixed(1)}</span>
                                      </div>
                                    </div>

                                    {/* Multipliers */}
                                    <div className="space-y-2 py-1">
                                      <div className="flex justify-between">
                                        <span>x Soreness Multiplier</span>
                                        <span className="text-volt">x{sorenessMult.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>x Motivation Multiplier</span>
                                        <span className="text-volt">x{moodMult.toFixed(2)}</span>
                                      </div>
                                    </div>

                                    {/* Final equation */}
                                    <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                                      <span className="text-volt font-headline font-bold text-base tracking-wider">Net Readiness</span>
                                      <span className="text-volt font-headline font-black text-2xl tracking-tight">{dynamicReadinessScore}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-3 md:p-6 border-t border-white/5 shrink-0 bg-surface-container-lowest">
          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 btn-secondary py-4">
              <X size={16} /> {t("common.close")}
            </button>
            {!showResult ? (
              <button
                onClick={handleAnalyze}
                disabled={!isComplete}
                className="flex-[2] btn-primary py-4 disabled:opacity-50"
              >
                {t("readiness.analyze")} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex-[2] btn-primary py-4"
              >
                {t("readiness.enter")} <Zap size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>

    {mounted && createPortal(
      <AnimatePresence>
        {showFormulaTooltip && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormulaTooltip(false)}
              className="absolute inset-0 bg-void/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-panel border-volt/30 p-6 shadow-[0_0_50px_var(--primary-glow)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-volt" />
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">
                    Calculation Breakdown
                  </h2>
                </div>
                <button
                  onClick={() => setShowFormulaTooltip(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-4 bg-volt/5 border border-volt/10 space-y-3">
                  <p className="text-xs font-bold text-volt uppercase tracking-widest">
                    Formula & Drains
                  </p>
                  <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
                    <div>
                      <strong className="text-white">Sleep Deficit:</strong> Score reduction calculated from difference between targeted sleep hours and actual logged sleep.
                    </div>
                    <div>
                      <strong className="text-white">Axial Fatigue Drain:</strong> Cumulative fatigue calculated from your last 5 workouts to protect CNS.
                    </div>
                    <div>
                      <strong className="text-white">Systemic Life Stress:</strong> CNS load penalty mapped directly from current subjective mental/work stress.
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/50 border border-white/5 space-y-3">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Autoregulation Multipliers
                  </p>
                  <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
                    <div>
                      <strong className="text-white">Soreness Multiplier:</strong> Muscle recovery factor (soreness 1-5 scales from 0.85x up to 1.02x).
                    </div>
                    <div>
                      <strong className="text-white">Motivation Multiplier:</strong> CNS output scale based on neurological drive (motivation 1-5 scales from 0.90x up to 1.05x).
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-volt/10 border border-volt/30 space-y-2">
                  <p className="text-xs font-bold text-volt uppercase tracking-widest">
                    Raw Subtotal Adjustment
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-100 font-mono">
                    the raw subtotal is adjusted by your muscle soreness score ({sorenessVal}/5) and motivation level ({moodVal}/5) to yield the final net readiness of {dynamicReadinessScore}%
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowFormulaTooltip(false)}
                className="w-full mt-6 btn-secondary py-4"
              >
                <X size={16} className="inline mr-2" /> {t('common.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
  );
};
