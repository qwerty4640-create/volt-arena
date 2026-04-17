import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Zap, Clock, Info } from 'lucide-react';
import { useWorkout, RecoveryType, ActiveRecovery } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

interface ActiveRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ActiveRecovery | null;
}

export const ActiveRecoveryModal = ({ isOpen, onClose, initialData }: ActiveRecoveryModalProps) => {
  const { logActiveRecovery, updateActiveRecovery } = useWorkout();
  const { t } = useSettings();
  
  const [type, setType] = useState<RecoveryType>('Running');
  const [rpe, setRpe] = useState(5);
  const [duration, setDuration] = useState(30);
  const [performedAt, setPerformedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState('');
  
  React.useEffect(() => {
    if (isOpen && initialData) {
      setType(initialData.type);
      setRpe(initialData.rpe);
      setDuration(initialData.durationMinutes);
      setNote(initialData.note || '');
      if (initialData.performedAt) {
        const d = new Date(initialData.performedAt);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setPerformedAt(d.toISOString().slice(0, 16));
      }
    } else if (isOpen && !initialData) {
      // Reset logic
      setType('Running');
      setRpe(5);
      setDuration(30);
      setNote('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setPerformedAt(now.toISOString().slice(0, 16));
    }
  }, [isOpen, initialData]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const selectedTime = new Date(performedAt).getTime();
    const now = Date.now();
    
    if (selectedTime > now) {
      setError("Temporal Error: Cannot log activity in the future.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (initialData && initialData.id) {
        await updateActiveRecovery(initialData.id, {
          type,
          rpe,
          durationMinutes: duration,
          note,
          performedAt: new Date(performedAt).toISOString()
        });
        
        // Accessibility announcement
        const liveRegion = document.getElementById('a11y-live-region');
        if (liveRegion) liveRegion.textContent = 'Activity logged successfully updated.';
      } else {
        await logActiveRecovery({
          type,
          rpe,
          durationMinutes: duration,
          note,
          performedAt: new Date(performedAt).toISOString()
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to log active recovery:', err);
      setError("Sync Error: Failed to log activity to cloud storage.");
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
              {/* Temporal Anchor */}
              <div className="space-y-4">
                <label htmlFor="performedAt" className="block text-[10px] font-black uppercase tracking-normal text-zinc-500">Performed At</label>
                <div className="relative">
                  <input
                    id="performedAt"
                    type="datetime-local"
                    value={performedAt}
                    max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setPerformedAt(e.target.value)}
                    className="w-full bg-void border border-white/10 p-4 text-[11px] font-black uppercase tracking-widest text-volt focus:border-volt outline-none transition-all [color-scheme:dark]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                    <Clock size={16} />
                  </div>
                </div>
              </div>

              {/* Activity Type */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-normal text-zinc-500">Activity</label>
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
                  <label htmlFor="intensity-range" className="block text-[10px] font-black uppercase tracking-normal text-zinc-500">Intensity (RPE)</label>
                  <span className="text-3xl font-black italic text-volt">{rpe}</span>
                </div>
                <input
                  id="intensity-range"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rpe}
                  onChange={(e) => setRpe(parseInt(e.target.value))}
                  className="w-full tactical-range accent-volt h-1 bg-white/5 border-none outline-none appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-400">
                  <span>Recovery Effort</span>
                  <span>Max Effort</span>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-black uppercase tracking-normal text-zinc-500">Duration (Minutes)</label>
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
                <label htmlFor="sessionNote" className="block text-[10px] font-black uppercase tracking-normal text-zinc-500">Session Notes</label>
                <textarea
                  id="sessionNote"
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
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-crimson">
                    Tactical Impact: High intensity aerobic load detected. Readiness scores for primary lifts will be adjusted for recovery bias.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-surface-container-lowest border-t border-white/5 flex flex-col gap-4">
              {error && (
                <div className="bg-crimson/10 border border-crimson/20 p-3 flex items-center gap-2 mb-2 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-crimson rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-crimson">{error}</span>
                </div>
              )}
              <div className="flex gap-4">
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
                  {initialData ? "UPDATE ENTRY" : "LOG ACTIVITY"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
