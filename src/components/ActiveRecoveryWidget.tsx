import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Check, Clock, Zap, X, ChevronRight, RotateCcw } from 'lucide-react';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { RECOVERY_ACTIVITIES, RecoveryActivity } from '../data/recoveryLibrary';

const SwipeCard = ({
  activity,
  onSwipe,
  onDone,
  isTop
}: {
  activity: RecoveryActivity;
  onSwipe: (id: string, direction: 'left' | 'right') => void;
  onDone: (activity: RecoveryActivity) => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const { getCalibrationStatus } = useWorkout();
  const calibration = getCalibrationStatus();

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe(activity.id, 'right');
    } else if (info.offset.x < -100) {
      onSwipe(activity.id, 'left');
    }
  };

  const currentFatigueDeficit = 100 - (calibration.subjectiveScores?.fatigueScore ? calibration.subjectiveScores.fatigueScore * 20 : (100 - (calibration.cumulativeFatigueScore / 18 * 100)));
  const dynamicBoost = Math.round(activity.boostPercentage * (1 + (currentFatigueDeficit / 100)));

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full glass-panel p-6 md:p-8 flex flex-col border-volt/20 shadow-2xl relative overflow-hidden group/card bg-zinc-950 border">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/card:opacity-[0.05] transition-opacity duration-700"
          style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="p-3 bg-volt/10 border border-volt/20 text-volt">
            <Zap size={24} />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-volt mb-1 text-right">Recovery Impact</span>
            <span className="text-3xl font-black italic text-white leading-none">+{dynamicBoost}%</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h3 className="font-headline text-2xl md:text-3xl font-black uppercase italic leading-tight mb-2 tracking-tighter">
            {activity.label}
          </h3>
          <p className="text-[12px] text-zinc-500 font-medium mb-6 max-w-[280px]">
            {activity.description}
          </p>
          <div className="flex items-center gap-4 text-zinc-400 font-mono text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-volt" /> {activity.recommendedDuration}m
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-volt" /> RPE {activity.recommendedRpe}
            </span>
          </div>
        </div>

        <div className="mt-auto relative z-10 pt-8 flex gap-3">
          <button
            onClick={() => onDone(activity)}
            className="flex-1 py-4 btn-secondary"
          >
            <Check size={18} strokeWidth={3} /> DONE
          </button>
          <button
            onClick={() => onSwipe(activity.id, 'left')}
            className="p-4 bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            title="Next Routine"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: useTransform(x, [50, 150], [0, 1]) }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div className="w-32 h-32 rounded-full border-8 border-emerald-500 flex items-center justify-center bg-zinc-950/80 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
            <Check size={64} className="text-emerald-500" strokeWidth={5} />
          </div>
        </motion.div>
        <motion.div
          style={{ opacity: useTransform(x, [-50, -150], [0, 1]) }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div className="w-32 h-32 rounded-full border-8 border-zinc-500 flex items-center justify-center bg-zinc-950/80 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <X size={64} className="text-zinc-500" strokeWidth={5} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const ActiveRecoveryWidget = () => {
  const { t } = useSettings();
  const { showToast } = useToast();
  const { logNonProgramActivity, getCalibrationStatus } = useWorkout();
  const [activities, setActivities] = useState<RecoveryActivity[]>(RECOVERY_ACTIVITIES);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (id: string, direction: 'left' | 'right') => {
    if (direction === 'right') {
      const activity = activities.find(a => a.id === id);
      if (activity) handleMarkAsDone(activity);
    } else {
      setCurrentIndex(prev => (prev + 1) % activities.length);
    }
  };

  const handleMarkAsDone = async (activity: RecoveryActivity) => {
    try {
      await logNonProgramActivity({
        activityId: activity.id,
        rpe: activity.recommendedRpe,
        durationMinutes: activity.recommendedDuration,
        performedAt: new Date().toISOString(),
        note: `Active Recovery: ${activity.label}`
      });
      showToast('System Regenerated.', 2000, 'success');
      setCurrentIndex(prev => (prev + 1) % activities.length);
    } catch (error) {
      console.error('Error logging recovery:', error);
    }
  };

  const resetStack = () => setCurrentIndex(0);

  return (
    <div className="w-full mt-6 flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight">
            Active Recovery
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
            Regeneration Protocols • Swipe to Navigate
          </span>
        </div>
        <button
          onClick={resetStack}
          className="p-2 text-zinc-500 hover:text-volt transition-colors"
          title="Reset Stack"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="relative w-full aspect-[4/5] sm:aspect-video max-h-[500px] perspective-1000 mb-8">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => {
            if (index < currentIndex || index > currentIndex + 2) return null;

            const isTop = index === currentIndex;
            const position = index - currentIndex;

            return (
              <motion.div
                key={activity.id}
                initial={{ scale: 0.9, x: 20, y: 20, opacity: 0 }}
                animate={{
                  x: position * 20,
                  y: position * 15,
                  scale: 1 - position * 0.04,
                  opacity: 1 - position * 0.3,
                  zIndex: activities.length - index
                }}
                exit={{
                  x: 800,
                  opacity: 0,
                  transition: { duration: 0.4, ease: "easeIn" }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0"
              >
                <SwipeCard
                  activity={activity}
                  isTop={isTop}
                  onSwipe={handleSwipe}
                  onDone={handleMarkAsDone}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {currentIndex >= activities.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 glass-panel border-dashed border-white/10"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-full mb-4">
              <Check size={32} />
            </div>
            <h3 className="font-headline text-2xl font-black uppercase italic mb-2 text-white">All Protocols Cleared</h3>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Systems Fully Optimized for Tactical Performance</p>
            <button
              onClick={resetStack}
              className="mt-8 px-6 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
            >
              Restart Protocol Stack
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
