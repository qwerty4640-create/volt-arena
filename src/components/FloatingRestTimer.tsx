import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';

export const FloatingRestTimer: React.FC = () => {
  const { t } = useSettings();
  const { activeRestTarget, setActiveRestTarget } = useWorkout();
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (activeRestTarget === null) {
      setRestRemaining(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.ceil((activeRestTarget - Date.now()) / 1000));
      if (diff <= 0) {
        setRestRemaining(null);
        setActiveRestTarget(null);
      } else {
        setRestRemaining(diff);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeRestTarget, setActiveRestTarget]);

  const addTime = (seconds: number) => {
    if (activeRestTarget !== null) {
      const newTarget = activeRestTarget + (seconds * 1000);
      if (newTarget <= Date.now()) {
        setActiveRestTarget(null);
        setRestRemaining(null);
      } else {
        setActiveRestTarget(newTarget);
        setRestRemaining(Math.ceil((newTarget - Date.now()) / 1000));
      }
    }
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {restRemaining !== null && (
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-6 md:right-10 z-[200] cursor-move touch-none"
        >
          <div className="bg-void/95 backdrop-blur-xl border border-volt/30 p-3 shadow-[0_0_40px_rgba(0,182,255,0.2)] flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-volt mb-0.5">
                <Timer size={10} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('workout.restTime')}</span>
              </div>
              <div className="text-2xl font-black text-white font-mono leading-none">
                {formatRestTime(restRemaining)}
              </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex gap-1">
              <button 
                onClick={() => addTime(-30)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black border border-white/10 transition-colors cursor-pointer"
              >
                -30S
              </button>
              <button 
                onClick={() => addTime(30)}
                className="px-2 py-1.5 bg-volt/10 hover:bg-volt/20 text-volt text-[10px] font-black border border-volt/20 transition-colors font-mono cursor-pointer"
              >
                +30S
              </button>
            </div>

            <div className="h-8 w-px bg-white/10" />

            <button 
              onClick={() => setActiveRestTarget(null)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors px-1 cursor-pointer"
            >
              SKIP
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
