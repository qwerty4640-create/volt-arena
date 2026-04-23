import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Zap, Clock, Info, Search, Flame, Dumbbell, User, Box } from 'lucide-react';
import { useWorkout, ActiveRecovery } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { ACTIVITY_LIBRARY, ActivityCategory } from '../data/activityLibrary';
import { getTierStyle } from '../lib/strength';

interface NonProgramActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ActiveRecovery | null;
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  Cardio: 'bg-volt/20 text-volt border-volt/30',
  Combat: 'bg-crimson/20 text-crimson border-crimson/30',
  Strength: 'bg-volt/20 text-volt border-volt/30',
  Sport: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Recovery: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

const getIcon = (name: string) => {
  switch (name) {
    case 'Flame': return Flame;
    case 'User': return User;
    case 'Zap': return Zap;
    case 'Activity': return Activity;
    case 'Box': return Box;
    case 'Dumbbell': return Dumbbell;
    default: return Activity;
  }
};

export const NonProgramActivityModal = ({ isOpen, onClose, initialData }: NonProgramActivityModalProps) => {
  const { logNonProgramActivity, updateActiveRecovery } = useWorkout();
  const { t, profile, unit } = useSettings();
  
  const [activityId, setActivityId] = useState<string>('cardio_running');
  const [rpe, setRpe] = useState(5);
  const [duration, setDuration] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'All'>('All');

  const [performedAt, setPerformedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState('');
  
  React.useEffect(() => {
    if (isOpen && initialData) {
      setActivityId(initialData.activityId || 'cardio_running');
      setRpe(initialData.rpe);
      setDuration(initialData.durationMinutes);
      setNote(initialData.note || '');
      if (initialData.performedAt) {
        const d = new Date(initialData.performedAt);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setPerformedAt(d.toISOString().slice(0, 16));
      }
    } else if (isOpen && !initialData) {
      setActivityId('cardio_running');
      setRpe(5);
      setDuration(30);
      setNote('');
      setSearchQuery('');
      setSelectedCategory('All');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setPerformedAt(now.toISOString().slice(0, 16));
    }
  }, [isOpen, initialData]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredActivities = useMemo(() => {
    return ACTIVITY_LIBRARY.filter(activity => {
      const matchesSearch = activity.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || activity.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const selectedActivity = ACTIVITY_LIBRARY.find(a => a.id === activityId) || ACTIVITY_LIBRARY[0];
  const tierStyle = getTierStyle(profile?.level || 'untrained');

  const estimatedCalories = useMemo(() => {
    if (!selectedActivity) return 0;
    let weightKg = 75;
    if (profile?.weight) {
      weightKg = unit === 'imperial' ? profile.weight * 0.453592 : profile.weight;
    }
    const intensityScalar = 1 + (rpe - 7) * 0.05;
    return Math.round((selectedActivity.baseMET * 3.5 * weightKg / 200) * duration * intensityScalar);
  }, [selectedActivity, rpe, duration, profile?.weight, unit]);

  const handleSubmit = async () => {
    const selectedTime = new Date(performedAt).getTime();
    const now = Date.now();
    
    if (selectedTime > now) {
      setError("Temporal Error: Cannot log activity in the future.");
      return;
    }

    if (!activityId) {
      setError("Please select an activity.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (initialData && initialData.id) {
        await updateActiveRecovery(initialData.id, {
          activityId,
          type: selectedActivity.label,
          rpe,
          durationMinutes: duration,
          note,
          performedAt: new Date(performedAt).toISOString(),
          caloriesBurned: estimatedCalories
        });
        
        const liveRegion = document.getElementById('a11y-live-region');
        if (liveRegion) liveRegion.textContent = 'Activity logged successfully updated.';
      } else {
        await logNonProgramActivity({
          activityId,
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
            className="relative w-full max-w-xl bg-black border border-zinc-800 rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 md:p-6 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className={cn("font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tighter", tierStyle.color)}>{t('Non-Program Activity')}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {t('Tactical Integration Log')}
                  </p>
                </div>
              </div>
              {/*...X button}
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors rounded-none">
                <X size={24} />
              </button>
              {...*/}
            </div>

            <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Activity Selection Area */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search operations..."
                    className="block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black text-white focus:outline-none focus:ring-1 focus:ring-volt focus:border-volt sm:text-sm transition-colors rounded-none placeholder-zinc-700 font-sans uppercase tracking-widest text-[11px] font-black"
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {(['All', 'Cardio', 'Combat', 'Strength', 'Sport', 'Recovery'] as const).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors rounded-none border border-zinc-800",
                        selectedCategory === category 
                          ? (category === 'All' ? 'bg-volt/20 text-volt border-volt/30' : CATEGORY_COLORS[category as ActivityCategory])
                          : "bg-black text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {filteredActivities.map(activity => {
                    const ActivityIcon = getIcon(activity.icon);
                    return (
                      <button
                        key={activity.id}
                        onClick={() => setActivityId(activity.id)}
                        className={cn(
                          "flex items-center gap-2 p-3 border transition-colors text-left rounded-none overflow-hidden",
                          activityId === activity.id 
                            ? "bg-volt/10 border-volt text-volt shadow-[0_0_10px_rgba(206,255,0,0.1)]" 
                            : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        )}
                      >
                        <ActivityIcon size={14} className="shrink-0" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">{activity.label}</span>
                      </button>
                    );
                  })}
                  {filteredActivities.length === 0 && (
                    <div className="col-span-full py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      No matching activities found.
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Estimated Burn */}
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-none flex items-center justify-between">
                <div>
                  <h4 className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1">Estimated Burn</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-headline font-black italic text-volt tracking-tight">{estimatedCalories}</span>
                    <span className="text-xs text-volt/70 uppercase tracking-widest font-black">kcal</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-black border border-zinc-800 flex items-center justify-center">
                   <Flame className="text-volt" size={24} />
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RPE Selector */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label htmlFor="intensity-range" className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Intensity (RPE)</label>
                    <span className="text-2xl font-black italic text-volt">{rpe}</span>
                  </div>
                  <input
                    id="intensity-range"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={rpe}
                    onChange={(e) => setRpe(parseInt(e.target.value))}
                    className="w-full tactical-range accent-volt h-1 bg-zinc-800 border-none outline-none appearance-none cursor-pointer rounded-none"
                  />
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Recovery</span>
                    <span>Max Effort</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Duration (Minutes)</label>
                    <span className="text-2xl font-black italic text-white">{duration}</span>
                  </div>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-black uppercase tracking-tight sm:tracking-widest border transition-all rounded-none",
                          duration === d
                            ? "bg-white text-black border-white"
                            : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                        )}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Temporal Anchor & Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label htmlFor="performedAt" className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('Performed At')}</label>
                  <div className="relative">
                    <input
                      id="performedAt"
                      type="datetime-local"
                      value={performedAt}
                      max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setPerformedAt(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-4 text-[11px] font-black uppercase tracking-widest text-white focus:border-volt outline-none transition-all [color-scheme:dark] rounded-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                      <Clock size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label htmlFor="sessionNote" className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Notes</label>
                  <textarea
                    id="sessionNote"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Terrain, conditions..."
                    className="w-full bg-black border border-zinc-800 p-4 text-xs text-white placeholder:text-zinc-700 focus:border-volt outline-none transition-all h-[54px] resize-none rounded-none font-sans"
                  />
                </div>
              </div>

              {/* Impact Information */}
              {rpe >= 7 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 bg-crimson/10 border border-crimson/30 p-4 rounded-none"
                >
                  <Info className="text-crimson shrink-0" size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-crimson">
                    High intensity aerobic load detected. Readiness scores for primary lifts will be adjusted for recovery bias.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 bg-zinc-900 border-t border-zinc-800 shrink-0">
              {error && (
                <div className="bg-crimson/10 border border-crimson/30 p-3 flex items-center gap-2 mb-4 animate-pulse rounded-none">
                  <span className="w-1.5 h-1.5 bg-crimson rounded-none" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-crimson">{error}</span>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 btn-secondary py-4"
                >
                  <X size={16} /> Close
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-[2] btn-primary py-4 rounded-none"
                >
                  {isSubmitting ? <Zap className="animate-spin" size={16} /> : <Zap size={16} />}
                  Log
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
