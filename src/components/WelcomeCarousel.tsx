import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";
import { cn } from "../lib/utils";

interface WelcomeCarouselProps {
  onSignUp: () => void;
  onSignIn: () => void;
  hideLogo?: boolean;
  isRelative?: boolean;
}

const CAROUSEL_STEPS = [
  {
    title: "Tactical training architecture",
    body: "Hardened programming engine built for results, not metrics. Raw, intent-based progression.",
    image: "/banner-1.jpg",
    mobileImage: "/banner-skinny/banner-skinny-1.jpg"
  },
  {
    title: "Operational ready state",
    body: "Real-time readiness tracking, fatigue decomposition, and joint health monitoring.",
    image: "/banner-2.jpg",
    mobileImage: "/banner-skinny/banner-skinny-2.jpg"
  },
  {
    title: "Mission Decomposition",
    body: "Strategic fatigue decay modeling to ensure you are primed for the next mission.",
    image: "/banner-3.jpg",
    mobileImage: "/banner-skinny/banner-skinny-3.jpg"
  }
];

const SCROLL_INTERVAL = 9000; // 9 seconds

const VanguardLogo = ({ className }: { className?: string }) => {
  const gradientId = React.useId().replace(/:/g, "");
  return (
  <svg 
    viewBox="0 0 134 26" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-full h-auto", className)}
  >
    <path d="M0.999999 6.98218L1.5 6.69312L10.5937 1.44312L11.0937 1.15503L11.5937 1.44312L20.6875 6.69312L21.1875 6.98218L21.1875 18.6365L20.6875 18.9255L11.5938 24.1755L11.0938 24.4636L10.5938 24.1755L1.5 18.9255L1 18.6365L0.999999 6.98218Z" fill={`url(#vanguard_gradient_${gradientId})`} stroke="white" strokeWidth="2"/>
    <path d="M11.0937 18.0587C13.9931 18.0587 16.3436 15.7084 16.3436 12.809C16.3436 9.9097 13.9931 7.55933 11.0937 7.55933C8.19421 7.55933 5.84375 9.9097 5.84375 12.809C5.84375 15.7084 8.19421 18.0587 11.0937 18.0587Z" stroke="white" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.3438 12.8093L13.7188 12.8093" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M8.46875 12.8091H5.84375" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M11.0938 10.1843V7.55933" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M11.0938 18.0593L11.0938 15.4343" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M32.7159 2.21826L34.804 9.39724H34.8835L36.9716 2.21826H40.0938L36.733 12.4001H32.9545L29.5938 2.21826H32.7159Z" fill="white"/>
    <path d="M47.0767 12.4001H44.0938L47.4545 2.21826H51.233L54.5938 12.4001H51.6108L49.3835 5.02224H49.304L47.0767 12.4001ZM46.5199 8.38304H52.1278V10.4512H46.5199V8.38304Z" fill="white"/>
    <path d="M67.4034 2.21826V12.4001H65.0966L61.4176 7.05065H61.358V12.4001H58.5938V2.21826H60.9403L64.5597 7.54781H64.6392V2.21826H67.4034Z" fill="white"/>
    <path d="M78.0553 5.5791C78.0122 5.40344 77.9443 5.24932 77.8515 5.11674C77.7587 4.98085 77.6427 4.86651 77.5035 4.7737C77.3676 4.67759 77.2085 4.60633 77.0262 4.55993C76.8472 4.51021 76.65 4.48535 76.4346 4.48535C75.9706 4.48535 75.5745 4.59638 75.2464 4.81845C74.9216 5.04051 74.673 5.36035 74.5006 5.77797C74.3316 6.19558 74.2471 6.69937 74.2471 7.28933C74.2471 7.88592 74.3283 8.39634 74.4907 8.82058C74.6531 9.24482 74.895 9.56963 75.2165 9.79501C75.538 10.0204 75.9374 10.1331 76.4147 10.1331C76.8356 10.1331 77.1853 10.0718 77.4637 9.94913C77.7454 9.8265 77.9559 9.65249 78.0951 9.42711C78.2343 9.20173 78.3039 8.93658 78.3039 8.63166L78.7812 8.68137H76.4545V6.71262H80.9687V8.12456C80.9687 9.05259 80.7715 9.84638 80.377 10.5059C79.9859 11.1622 79.4457 11.666 78.7563 12.0173C78.0702 12.3653 77.2831 12.5393 76.3948 12.5393C75.4038 12.5393 74.5338 12.3289 73.7847 11.9079C73.0357 11.487 72.4507 10.8871 72.0297 10.1082C71.6121 9.32934 71.4033 8.40297 71.4033 7.3291C71.4033 6.48725 71.5309 5.74151 71.7861 5.09189C72.0447 4.44226 72.4026 3.89373 72.86 3.44629C73.3174 2.99553 73.846 2.65581 74.4459 2.42711C75.0458 2.19511 75.6888 2.0791 76.3749 2.0791C76.9781 2.0791 77.5383 2.16528 78.0553 2.33762C78.5757 2.50666 79.0347 2.74861 79.4324 3.06348C79.8335 3.37503 80.1566 3.74458 80.4019 4.17214C80.6472 4.5997 80.7963 5.06868 80.8493 5.5791H78.0553Z" fill="white"/>
    <path d="M90.9943 2.15869H93.7585V8.68142C93.7585 9.45699 93.5729 10.1282 93.2017 10.6949C92.8338 11.2584 92.3201 11.6942 91.6605 12.0024C91.0009 12.3074 90.2353 12.4598 89.3636 12.4598C88.4853 12.4598 87.7164 12.3074 87.0568 12.0024C86.3973 11.6942 85.8835 11.2584 85.5156 10.6949C85.151 10.1282 84.9688 9.45699 84.9688 8.68142V2.15869H87.733V8.44278C87.733 8.75765 87.8026 9.03937 87.9418 9.28795C88.081 9.53322 88.2732 9.72545 88.5185 9.86466C88.767 10.0039 89.0488 10.0735 89.3636 10.0735C89.6818 10.0735 89.9635 10.0039 90.2088 9.86466C90.4541 9.72545 90.6463 9.53322 90.7855 9.28795C90.9247 9.03937 90.9943 8.75765 90.9943 8.44278V2.15869Z" fill="white"/>
    <path d="M100.742 12.4001H97.7588L101.12 2.21826H104.898L108.259 12.4001H105.276L103.049 5.02224H102.969L100.742 12.4001ZM100.185 8.38304H105.793V10.4512H100.185V8.38304Z" fill="white"/>
    <path d="M112.259 12.4001V2.21826H116.654C117.409 2.21826 118.071 2.35581 118.637 2.6309C119.204 2.906 119.645 3.30207 119.96 3.81911C120.275 4.33616 120.432 4.95595 120.432 5.67849C120.432 6.40766 120.27 7.02248 119.945 7.52295C119.623 8.02342 119.171 8.40126 118.588 8.65647C118.008 8.91168 117.33 9.03928 116.554 9.03928H113.929V6.89156H115.997C116.322 6.89156 116.599 6.85178 116.828 6.77224C117.06 6.68938 117.237 6.55846 117.36 6.37948C117.486 6.20051 117.549 5.96684 117.549 5.67849C117.549 5.38682 117.486 5.14984 117.36 4.96755C117.486 5.38682 117.486 5.14984 117.36 4.96755C117.486 5.38682 117.549 5.96684 117.549 5.67849C117.549 5.38682 117.486 5.14984 117.36 4.96755C117.486 5.38682 117.486 5.14984 117.36 4.96755C117.486 5.38682 117.549 5.96684 117.549 5.67849C117.549 5.38682 117.486 5.14984 117.36 4.96755C117.486 5.38682 117.486 5.14984 117.36 4.96755C117.486 5.38682 117.549 5.96684 117.549 5.67849C117.549 5.38682 117.486 5.14984 117.36 4.96755Z" fill="white"/>
    <path d="M128.687 12.4001H124.77V2.21826H128.647C129.695 2.21826 130.6 2.4221 131.362 2.82977C132.127 3.23412 132.717 3.81746 133.132 4.57977C133.549 5.33876 133.758 6.24857 133.758 7.30917C133.758 8.36978 133.551 9.28124 133.137 10.0435C132.722 10.8025 132.136 11.3859 131.377 11.7935C130.618 12.1979 129.721 12.4001 128.687 12.4001ZM127.534 10.0535H128.588C129.092 10.0535 129.521 9.97229 129.875 9.80988C130.233 9.64748 130.505 9.36741 130.691 8.96968C130.88 8.57195 130.974 8.01845 130.974 7.30917C130.974 6.59989 130.878 6.04639 130.686 5.64866C130.497 5.25093 130.218 4.97087 129.85 4.80846C129.486 4.64605 129.038 4.56485 128.508 4.56485H127.534V10.0535Z" fill="white"/>
    <defs>
      <linearGradient id={`vanguard_gradient_${gradientId}`} x1="0.927734" y1="3.37599" x2="13.7277" y2="16.176" gradientUnits="userSpaceOnUse">
        <stop offset="0.373835" stopColor="#E70000"/>
        <stop offset="1" stopColor="#810000"/>
      </linearGradient>
    </defs>
  </svg>
  );
};

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ onSignUp, onSignIn, hideLogo, isRelative }) => {
  const { t } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % CAROUSEL_STEPS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => (prev - 1 + CAROUSEL_STEPS.length) % CAROUSEL_STEPS.length);
  }, []);

  // Auto-scroll timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, SCROLL_INTERVAL);

    return () => clearTimeout(timer);
  }, [currentStep, handleNext]);

  const stepData = CAROUSEL_STEPS[currentStep] || CAROUSEL_STEPS[0];

  return (
    <div className={cn(
      "bg-black flex flex-col items-center text-white text-center",
      isRelative ? "h-full w-full relative" : "fixed inset-0 z-50"
    )}>
      {/* Background Banner Carousel */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              const vel = velocity.x;
              if (swipe < -50 || vel < -500) {
                handleNext();
              } else if (swipe > 50 || vel > 500) {
                handlePrev();
              }
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <picture className="w-full h-full">
              <source media="(max-width: 1023px)" srcSet={stepData.mobileImage} />
              <img 
                src={stepData.image} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Spacer - pointer-events-none to allow dragging background */}
      <div className="flex-1 pointer-events-none" />

      {/* Controls Overlay */}
      <div className="relative z-10 w-full max-w-sm px-6 pb-6 flex flex-col gap-6 pointer-events-none">
        <div className="flex gap-2 justify-center pointer-events-auto">
          {CAROUSEL_STEPS.map((_, index) => {
            const isActive = index === currentStep;
            return (
              <div 
                key={index} 
                className="h-[2px] w-12 bg-white/20 overflow-hidden relative" 
              >
                {isActive && (
                  <motion.div
                    key={currentStep}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SCROLL_INTERVAL / 1000, ease: "linear" }}
                    className="absolute inset-y-0 left-0 bg-volt shadow-[0_0_8px_rgba(0,182,255,0.6)]"
                  />
                )}
                {!isActive && index < currentStep && (
                  <div className="absolute inset-0 bg-white/60" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-col gap-3 lg:hidden pointer-events-auto">
          <button onClick={onSignUp} className="w-full btn-primary py-4 text-xs uppercase font-black tracking-widest shadow-2xl">
            {currentStep === CAROUSEL_STEPS.length - 1 ? "Sign me up" : "Get Started"}
          </button>
          <button 
            onClick={onSignIn} 
            className="w-full py-2 text-[10px] text-white/70 uppercase font-black tracking-widest hover:text-white transition-colors drop-shadow-md"
          >
            {currentStep === CAROUSEL_STEPS.length - 1 ? "Already have an account? Sign in" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>

  );
};
