import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Star, 
  MessageSquare, 
  TrendingDown, 
  Check,
  ChevronRight,
  Zap,
  Activity
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { cn } from '../lib/utils';

interface PostWorkoutSummaryProps {
  initialRpe: number;
  onFinish: (data: { rpe: number; note: string }) => void;
}

export const PostWorkoutSummary = ({ initialRpe, onFinish }: PostWorkoutSummaryProps) => {
  const { t } = useSettings();
  const { currentSession } = useWorkout();
  const [rpe, setRpe] = useState(Math.round(initialRpe));
  const [note, setNote] = useState('');
  const [prevReadiness] = useState(82); // Mocking previous readiness from AnalysisView
  const [estimatedReadiness, setEstimatedReadiness] = useState(82);

  useEffect(() => {
    // Simple estimation logic: Higher RPE = Lower next readiness
    // Base drop is RPE * 2.5
    const drop = rpe * 2.5;
    const estimated = Math.max(0, Math.min(100, Math.round(prevReadiness - drop)));
    setEstimatedReadiness(estimated);
  }, [rpe, prevReadiness]);

  const handleFinish = () => {
    onFinish({ rpe, note });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto glass-panel p-3 md:p-12 border-none shadow-[0_0_100px_var(--primary-glow)] relative overflow-hidden"
    >
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-volt/5 blur-[80px] -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-crimson/5 blur-[80px] -z-10" />

      <div className="text-center mb-8 md:mb-12">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-volt/10 text-volt border-none mb-4 md:mb-6"
        >
          <Trophy size={32} className="md:w-10 md:h-10" strokeWidth={2.5} />
        </motion.div>
        <h1 className="font-headline text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">Nice Job, Athlete!</h1>
        <p className="text-zinc-500 font-headline text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">
          Session Complete • {currentSession?.title || 'Heavy Legs W3D3'}
        </p>
      </div>

      <div className="space-y-8 md:space-y-10">
        {/* Session RPE */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-zinc-400">
              <Star size={14} className="text-volt md:w-4 md:h-4" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Session RPE</span>
            </div>
            <div className="flex items-baseline gap-4">
              {currentSession?.targetRpe && (
                <div className="text-right">
                  <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest">Target</span>
                  <span className="text-lg font-black italic text-zinc-400">{currentSession.targetRpe}</span>
                </div>
              )}
              <div className="text-right">
                <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest">Actual</span>
                <span className="text-2xl md:text-3xl font-black italic text-volt">{rpe}</span>
              </div>
            </div>
          </div>
          
          {currentSession?.targetRpe && (
            <div className={cn(
              "p-3 text-[8px] font-black uppercase tracking-widest text-center",
              rpe === currentSession.targetRpe ? "bg-volt/10 text-volt" :
              rpe > currentSession.targetRpe ? "bg-crimson/10 text-crimson" : "bg-zinc-800 text-zinc-500"
            )}>
              {rpe === currentSession.targetRpe ? "Bullseye! Perfect intensity regulation." :
               rpe > currentSession.targetRpe ? "Overshot target. Watch for fatigue accumulation." :
               "Undershot target. Consider pushing harder if recovery allows."}
            </div>
          )}

          <div className="relative h-10 md:h-12 flex items-center">
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              className="w-full h-2 bg-void appearance-none cursor-pointer accent-volt border border-white/5"
            />
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest">
              <span>{t('workout.easy')}</span>
              <span>{t('workout.moderate')}</span>
              <span>{t('workout.maxEffort')}</span>
            </div>
          </div>
        </div>

        {/* Workout Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <MessageSquare size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('workout.workoutNotes')}</span>
          </div>
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did it feel today? Any pain or breakthroughs?"
            className="w-full h-32 bg-void/40 border-none p-6 font-sans text-sm text-zinc-300 focus:outline-none focus:border-volt/50 transition-colors resize-none placeholder:text-zinc-700"
          />
        </div>

        {/* Finish Button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFinish}
          className="w-full py-6 bg-volt text-void font-headline text-lg font-black uppercase italic tracking-widest hover:bg-white transition-all shadow-[0_0_30px_var(--primary-glow)] flex items-center justify-center gap-3 group"
        >
          <span>{t('workout.saveAndFinish')}</span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
};
