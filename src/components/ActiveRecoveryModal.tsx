import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Zap, Clock, Info } from 'lucide-react';
import { useWorkout, RecoveryType } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

interface ActiveRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveRecoveryModal = ({ isOpen, onClose }: ActiveRecoveryModalProps) => {
  const { logActiveRecovery } = useWorkout();
  const { t } = useSettings();
  
  const [type, setType] = useState<RecoveryType>('Running');
  const [rpe, setRpe] = useState(5);
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await logActiveRecovery({
        type,
        rpe,
        durationMinutes: duration,
        note
      });
      onClose();
    } catch (error) {
      console.error('Failed to log active recovery:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityTypes: RecoveryType[] = [
    'Running', 'Swimming', 'Cycling', 'Walking', 
    'Boxing', 'Muay Thai', 'Jiu Jitsu', 'Wrestling', 'MMA',
    'Rucking', 'Tactical Drills', 'Parkour',
    'Yoga', 'Pilates', 'Other'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg glass-panel border-volt/30 overflow-hidden shadow-[0_0_50px_rgba(0,182,255,0.1)]"
          >
            {/* Header */}
            <div className="p-6 bg-volt/10 border-b border-volt/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-volt flex items-center justify-center text-void shadow-[0_0_20px_rgba(0,182,255,0.3)]">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-headline text-xl font-black uppercase italic tracking-tighter text-white">Non-Program Activity</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-volt/70">External Tactical Integration Log</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {/* Activity Type */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Activity Class</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activityTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "px-3 py-3 text-[9px] font-black uppercase tracking-widest border transition-all duration-300 relative group overflow-hidden",
                        type === t 
                          ? "bg-volt text-void border-volt" 
                          : "bg-void/40 text-zinc-400 border-white/5 hover:border-white/20"
                      )}
                    >
                      {type === t && (
                        <motion.div 
                          layoutId="active-bg"
                          className="absolute inset-0 bg-volt"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RPE Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Intensity (RPE)</label>
                  <span className="text-3xl font-black italic text-volt">{rpe}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rpe}
                  onChange={(e) => setRpe(parseInt(e.target.value))}
                  className="w-full tactical-range accent-volt h-1 bg-white/5 border-none outline-none appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                  <span>Recovery Effort</span>
                  <span>Max Effort</span>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Duration (Minutes)</label>
                  <span className="text-2xl font-black italic">{duration}</span>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest border transition-all",
                        duration === d
                          ? "bg-white text-void border-white"
                          : "bg-void/40 text-zinc-400 border-white/10 hover:border-white/20"
                      )}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Session Notes</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Trail run, intervals, feeling sluggish..."
                  className="w-full bg-void border border-white/10 p-4 text-xs text-white placeholder:text-zinc-700 focus:border-volt outline-none transition-all h-24 resize-none"
                />
              </div>

              {/* Impact Information */}
              {rpe >= 7 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 bg-crimson/10 border border-crimson/20 p-4"
                >
                  <Info className="text-crimson shrink-0" size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-crimson/80">
                    Tactical Impact: High intensity aerobic load detected. Readiness scores for primary lifts will be adjusted for recovery bias.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-surface-container-lowest border-t border-white/5 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-volt text-void font-headline text-xs font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Zap className="animate-spin" size={16} /> : <Zap size={16} />}
                Log Activity
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
