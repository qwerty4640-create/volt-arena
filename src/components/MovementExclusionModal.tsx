import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Search } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { getExerciseName } from '../utils/workoutUtils';

interface MovementExclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MovementExclusionModal: React.FC<MovementExclusionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, updateProfile, t } = useSettings();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleMovement = (movementName: string) => {
    const currentExclusions = profile?.excludedMovements || [];
    const updated = currentExclusions.includes(movementName)
      ? currentExclusions.filter(name => name !== movementName)
      : [...currentExclusions, movementName];

    updateProfile({ excludedMovements: updated });

    if (updated.includes(movementName)) {
      showToast(t('toast.movementRestricted', { name: movementName }), 3000, 'info');
    } else {
      showToast(t('toast.protocolUpdated', { name: movementName }), 3000, 'success');
    }
  };

  const filteredExercises = EXERCISE_DATABASE.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-panel p-3 md:p-6 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-volt/10 flex items-center justify-center text-volt border border-volt/20">
                <Activity size={24} />
              </div>
              <h2 className="font-sans text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                {t('settings.movementRestrictions')}
              </h2>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder={t('workout.searchPlaceholder') || "SEARCH..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border-none py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--primary-color)]/50 outline-none transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1 mb-6">
              {filteredExercises.map(mvmt => (
                <label
                  key={mvmt.name}
                  className={cn(
                    "flex items-center justify-between p-4 bg-void/20 border border-white/5 transition-all cursor-pointer group",
                    profile?.excludedMovements?.includes(mvmt.name) ? "border-volt/30 bg-volt/5" : "hover:border-volt/20 hover:bg-white/5"
                  )}
                >
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-sans text-sm font-black uppercase  tracking-tight transition-colors",
                      profile?.excludedMovements?.includes(mvmt.name) ? "text-volt" : "text-zinc-200 group-hover:text-white"
                    )}>
                      {getExerciseName(mvmt, t)}
                    </span>
                    <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                      {mvmt.category}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile?.excludedMovements?.includes(mvmt.name) || false}
                    onChange={() => handleToggleMovement(mvmt.name)}
                    className="accent-volt h-5 w-5 bg-transparent border-white/20 cursor-pointer"
                  />
                </label>
              ))}
              {filteredExercises.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/5 bg-void/20">
                  <Activity size={24} className="text-zinc-800 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">
                    {t('workout.noAltsFound') || "NO MOVEMENTS FOUND"}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-6 px-1 leading-relaxed opacity-60">
              {t('settings.deselectToEnable')}
            </p>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-5 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 hover:border-volt/50 hover:text-volt transition-all group active:scale-[0.99]"
            >
              <X size={14} className="text-zinc-500 group-hover:text-volt transition-colors" />
              {t('common.close')}
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
