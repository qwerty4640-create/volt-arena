import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";

interface WelcomeCarouselProps {
  onSkip: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}

const CAROUSEL_STEPS = [
  {
    title: "Tactical training architecture",
    body: "Hardened programming engine built for results, not metrics. No AI, just raw, intent-based progression.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc48?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Operational ready state",
    body: "Real-time readiness tracking, fatigue decomposition, and joint health monitoring.",
    image: "https://images.unsplash.com/photo-1551288049-bbda4833effb?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Decomposition & Recomposition",
    body: "Strategic fatigue decay modeling to ensure you are primed for the next mission.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Progressive mission echelons",
    body: "Advance through tactical echelons as you crush PRs. Earn your rank.",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Hardened offline utility",
    body: "No signal? No problem. Full system accessibility in theater, no internet required.",
    image: "https://images.unsplash.com/photo-1639069422496-03416b5daa28?q=80&w=2728&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    title: "Ready to roll out?",
    body: "Begin your tactical assessment.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop"
  }
];

const SCROLL_INTERVAL = 30000; // 30 seconds

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ onSkip, onSignUp, onSignIn }) => {
  const { t } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < CAROUSEL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onSkip(); // Transition to OnboardingFlow directly
    }
  }, [currentStep, onSkip]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Auto-scroll timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, SCROLL_INTERVAL);

    return () => clearTimeout(timer);
  }, [currentStep, handleNext]);

  return (
    <div className="fixed inset-0 z-50 bg-void flex flex-col items-center px-6 pb-6 text-white text-center pt-safe">
      {/* Branding Header */}
      <header className="w-full pt-8 pb-4 flex items-center justify-center">
        <img src="/vanguard-logo.svg" alt="Vanguard Logo" className="h-auto w-[40vw] drop-shadow-[0_0_10px_var(--primary-glow)]" />
      </header>

      <div className="flex-1 flex flex-col justify-center w-full">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center h-[400px] justify-center relative text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -50) {
                  handleNext();
                } else if (swipe > 50) {
                  handlePrev();
                }
              }}
              className="flex flex-col items-center gap-4 w-full cursor-grab active:cursor-grabbing text-center"
            >
              <div className="w-full aspect-square bg-surface-variant border border-white/5 overflow-hidden relative group max-w-[280px]">
                <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent z-10" />
                <img 
                  src={CAROUSEL_STEPS[currentStep].image} 
                  alt="" 
                  className="w-full h-full object-cover opacity-100" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-0 left-0 w-full h-full border-[15px] border-void/30 pointer-events-none" />
                <div className="absolute top-4 left-4 h-3 w-3 border-t-2 border-l-2 border-volt z-20" />
                <div className="absolute bottom-4 right-4 h-3 w-3 border-b-2 border-r-2 border-volt z-20" />
              </div>

              <div className="space-y-2 text-center">
                <h1 className="font-headline text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight w-full text-center">
                  {CAROUSEL_STEPS[currentStep].title}
                </h1>
                <p className="text-zinc-400 text-[10px] sm:text-xs font-medium leading-relaxed max-w-[260px] mx-auto text-center">
                  {CAROUSEL_STEPS[currentStep].body}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full max-w-sm mt-auto flex flex-col gap-3">
        <div className="flex gap-2 justify-center">
          {CAROUSEL_STEPS.map((_, index) => {
            const isActive = index === currentStep;
            return (
              <div 
                key={index} 
                className="h-[2px] w-10 bg-zinc-900 overflow-hidden relative" 
              >
                {isActive && (
                  <motion.div
                    key={currentStep} // Forces animation to restart when currentStep changes
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SCROLL_INTERVAL / 1000, ease: "linear" }}
                    className="absolute inset-y-0 left-0 bg-volt shadow-[0_0_8px_rgba(0,182,255,0.4)]"
                  />
                )}
                {!isActive && index < currentStep && (
                  <div className="absolute inset-0 bg-zinc-700" />
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onSignUp} className="w-full btn-primary py-3 text-xs uppercase font-black tracking-widest">
          {currentStep === CAROUSEL_STEPS.length - 1 ? "Sign me up" : "Sign Up"}
        </button>
        <button 
          onClick={onSignIn} 
          className="w-full py-3 text-[10px] text-zinc-500 uppercase font-black tracking-widest hover:text-white transition-colors"
        >
          {currentStep === CAROUSEL_STEPS.length - 1 ? "Already have an account? Sign in" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};
