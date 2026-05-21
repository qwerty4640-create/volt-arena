import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Zap, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';

interface TourStep {
  target?: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface UserTourProps {
  activeView: string;
}

export const UserTour: React.FC<UserTourProps> = ({ activeView }) => {
  const { t } = useSettings();
  const [completedViews, setCompletedViews] = useState<string[]>(() => {
    const stored = localStorage.getItem('vanguard_inducted_views_v4');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Define steps for each view
  const viewSteps: Record<string, TourStep[]> = useMemo(() => ({
    analysis: [
      {
        target: '.vanguard-tour-readiness',
        title: "BIO-READINESS TELEMETRY",
        content: "This is your primary readiness score. It integrates historical training volume, sleep debt, and stress markers to calculate your daily CNS capacity.",
        placement: 'bottom'
      },
      {
        target: '.vanguard-tour-readiness-trend',
        title: "TREND INTELLIGENCE",
        content: "Monitor your physiological readiness over time. These metrics help you identify recovery patterns and avoid systemic overtraining.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-active-recovery',
        title: "ACTIVE REGENERATION",
        content: "When readiness is compromised, deploy active recovery protocols. These targeted sessions accelerate systemic decay of fatigue.",
        placement: 'left'
      },
      {
        target: '.vanguard-tour-customize-dashboard',
        title: "OPERATIONAL INTERFACE",
        content: "You can reconfigure your mission dashboard by adding or removing telemetry modules here.",
        placement: 'bottom'
      }
    ],
    analytics: [
      {
        target: '.vanguard-tour-joint-stress',
        title: "JOINT STRESS BALANCE",
        content: "Monitor the ratio between high-impact training and restorative protocols. Keeping this balanced is critical for long-term orthopedic health.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-strength-trend',
        title: "STRENGTH EVOLUTION",
        content: "Track absolute strength gains across your primary lifts. This module visualizes your forced adaptation curve over time.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-weekly-volume',
        title: "VOLUME TELEMENTRY",
        content: "Weekly tonnage accumulation. Managing this curve prevents systemic crash and identifies the optimal training dose for your CNS.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-estimated-1rm',
        title: "CAPACITY ESTIMATION",
        content: "The system calculates your theoretical maximal force production based on current set-rep-RPE data.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-tactical-integration',
        title: "TACTICAL SYNERGY",
        content: "Analyze how non-lifting activities impact your recovery resources. The goal is to maximize performance while minimizing systemic interference.",
        placement: 'top'
      }
    ],
    training: [
      {
        target: '.vanguard-tour-next-mission',
        title: "NEXT MISSION",
        content: "This is your primary objective of the day. Review mission briefing and initiate mission when ready.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-upcoming-missions',
        title: "UPCOMING DEPLOYMENTS",
        content: "Preview future mission requirements. The system adapts these based on your current performance and recovery markers.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-upcoming-missions-details',
        title: "OPERATIONAL SUBPAGE",
        content: "Access a detailed breakdown of your entire training phase, including volume distribution and intensity projections.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-prs',
        title: "PERSONAL RECORDS",
        content: "Your peak output markers. Monitor absolute strength evolution across your primary lift variants. These records are measured per set, not 1 rep max.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-past-missions',
        title: "MISSION ARCHIVE",
        content: "Review previous deployment logs to analyze performance trends and subjective session feedback.",
        placement: 'top'
      }
    ],
    deployment: [
      {
        target: '.vanguard-tour-deployment-progress',
        title: "DEPLOYMENT PROGRESS",
        content: "Track your journey through the current mission cycle. Absolute completion markers keep you on schedule.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-deployment-cycle',
        title: "MISSION CYCLE",
        content: "A detailed breakdown of your strategic blocks. Expand each objective to see specific physiological focuses.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-intensity-curve',
        title: "INTENSITY CURVE",
        content: "Visualize planned vs. actual intensity. This helps identify overreaching or potential performance plateaus.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-recalibrate-deployment',
        title: "STRATEGIC OVERRIDE",
        content: "Modify your training objectives, duration, or frequency. Changes here will adapt your entire roadmap.",
        placement: 'bottom'
      }
    ],
    settings: [
      {
        title: "SYSTEM CONFIG",
        content: "Adjust unit preferences, biometrics, and tactical parameters in the settings panel.",
        placement: 'center'
      },
      {
        target: '.vanguard-tour-profile',
        title: "OPERATOR PROFILE",
        content: "Manage your biometric baseline and view historical performance benchmarks here.",
        placement: 'bottom'
      },
      {
        target: '.vanguard-tour-visual-output',
        title: "VISUAL OUTPUT",
        content: "Configure interface themes and color filters to optimize your tactical awareness.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-unit-measure',
        title: "METRIC STANDARDS",
        content: "Switch between Imperial and Metric standards for force and dimension telemetry.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-reset-program',
        title: "PROGRAM RECALIBRATION",
        content: "Terminate your current roadmap and re-initialize the tactical induction flow.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-account-mission',
        title: "ACCOUNT MISSION",
        content: "Manage your operational session and secure connection parameters.",
        placement: 'top'
      },
      {
        target: '.vanguard-tour-reset-induction',
        title: "INDUCTION PROTOCOL",
        content: "If any interface module requires further explanation, re-initialize the induction sequence for the current view.",
        placement: 'top'
      }
    ]
  }), [activeView]);

  const steps = viewSteps[activeView] || [];

  useEffect(() => {
    // If this view hasn't been seen, start tour
    if (steps.length > 0 && !completedViews.includes(activeView)) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsTourActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTourActive(false);
    }
  }, [activeView, completedViews, steps.length]);

  // Handle global reset event from settings
  useEffect(() => {
    const handleReset = () => {
      localStorage.removeItem('vanguard_inducted_views_v4');
      setCompletedViews([]);
      // Force trigger for current view if it has steps
      if (viewSteps[activeView]) {
        setCurrentStep(0);
        setIsTourActive(true);
      }
    };
    window.addEventListener('vanguard_reset_tour', handleReset);
    return () => window.removeEventListener('vanguard_reset_tour', handleReset);
  }, [activeView, viewSteps]);

  const handleComplete = useCallback(() => {
    setIsTourActive(false);
    const newCompleted = [...completedViews, activeView];
    setCompletedViews(newCompleted);
    localStorage.setItem('vanguard_inducted_views_v4', JSON.stringify(newCompleted));
  }, [activeView, completedViews]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  useEffect(() => {
    if (isTourActive && steps[currentStep]?.target) {
      const el = document.querySelector(steps[currentStep].target!);
      if (el) {
        // Scroll to element and center it
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const updateRect = () => {
          const currentEl = document.querySelector(steps[currentStep].target!);
          if (currentEl) {
            setTargetRect(currentEl.getBoundingClientRect());
          }
        };

        // Update rect continuously for a short duration to follow smooth scroll
        let animationId: number;
        const startTime = Date.now();
        const duration = 1000; // Duration to track smooth scroll

        const trackScroll = () => {
          updateRect();
          if (Date.now() - startTime < duration) {
            animationId = requestAnimationFrame(trackScroll);
          }
        };
        
        animationId = requestAnimationFrame(trackScroll);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
          cancelAnimationFrame(animationId);
          window.removeEventListener('resize', updateRect);
          window.removeEventListener('scroll', updateRect, true);
        };
      } else {
        // Target missing - skip to next or complete
        console.warn(`Tour target ${steps[currentStep].target} not found. Skipping.`);
        handleNext();
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isTourActive, steps, handleNext]);

  if (!isTourActive) return null;

  const currentStepData = steps[currentStep];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans">
      {/* Spotlight highlight border */}
      {targetRect && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.left - 10,
            top: targetRect.top - 10,
            width: targetRect.width + 20,
            height: targetRect.height + 20,
          }}
          className="absolute border-2 border-volt z-[10000]"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute z-[10001] pointer-events-auto w-[calc(100vw-32px)] max-w-sm sm:w-[320px]"
          style={
            targetRect 
              ? {
                  left: isMobile ? '16px' : Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 160)),
                  top: targetRect.bottom + 20 > window.innerHeight - 280 
                    ? Math.max(10, targetRect.top - 280) 
                    : targetRect.bottom + 30,
                  transform: isMobile ? 'none' : undefined
                }
              : {
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }
          }
        >
          <div className="bg-zinc-900 border border-white/10 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-volt to-void opacity-50" />
            
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-volt fill-volt" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-volt">
                  Step {currentStep + 1} / {steps.length}
                </span>
              </div>
              <button 
                onClick={handleSkip}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Skip Protocol"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white mb-2 sm:mb-3">
              {currentStepData.title}
            </h3>
            
            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 leading-relaxed uppercase tracking-wide mb-6 sm:mb-8">
              {currentStepData.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={handleSkip}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                Skip
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-1.5 sm:p-2 border border-white/10 hover:bg-white/5 transition-colors text-zinc-400"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-volt text-void font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,182,255,0.2)]"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Close
                      <Check size={14} />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};
