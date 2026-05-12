import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Info, HelpCircle } from 'lucide-react';
import { getSwappableExercises, ExerciseDefinition, EXERCISE_DATABASE } from '../constants/exercises';
import { useSettings } from '../contexts/SettingsContext';
import { Portal } from './Portal';
import { ExerciseInfoModal } from './ExerciseInfoModal';
import { haptics } from '../lib/haptics';
import { InfoTooltip } from './InfoTooltip';

interface ExerciseSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwap: (newId: string) => void;
  currentExerciseId: string;
}

export const ExerciseSwapModal: React.FC<ExerciseSwapModalProps> = ({
  isOpen,
  onClose,
  onSwap,
  currentExerciseId
}) => {
  const { t } = useSettings();
  const [selectedInfoExercise, setSelectedInfoExercise] = useState<ExerciseDefinition | null>(null);
  const [lastInfoExercise, setLastInfoExercise] = useState<ExerciseDefinition | null>(null);
  const alternatives = getSwappableExercises(currentExerciseId);

  const openInfo = (alt: ExerciseDefinition) => {
    setLastInfoExercise(alt);
    setSelectedInfoExercise(alt);
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8">
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
              className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] bg-zinc-950"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-volt" size={24} />
                  <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white">
                    {t('workout.swapExercise')}
                  </h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <p className="text-zinc-400 text-sm mb-8 font-medium">
                {t('workout.swapDesc').replace('{exercise}', 
                  (currentExerciseId && currentExerciseId !== 'undefined') 
                    ? (EXERCISE_DATABASE.find(e => e.id === currentExerciseId || e.name.toLowerCase() === currentExerciseId.toLowerCase())?.name || currentExerciseId)
                    : t('workout.currentMovement')
                )}
              </p>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {alternatives.map((alt) => (
                  <div key={alt.id} className="relative group">
                    <button
                      onClick={() => {
                        onSwap(alt.id);
                        onClose();
                      }}
                      className="w-full p-4 pr-16 bg-void/50 border border-white/5 hover:border-volt/30 text-left transition-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative font-headline text-lg font-black uppercase tracking-tight group-hover:text-volt transition-colors text-white">
                          {alt.name}
                        </div>
                        <div className="relative z-20 shrink-0">
                          <InfoTooltip term={alt.name as any} />
                        </div>
                      </div>
                      {alt.pattern && (
                        <div className="relative text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">
                          {alt.pattern.replace('_', ' ')}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.button();
                        openInfo(alt);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-volt hover:border-volt/50 transition-all z-10"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                ))}
                
                {alternatives.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/10">
                    <p className="text-zinc-500 text-sm">
                      {t('workout.noAltsFound')}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-8 py-4 border-none text-zinc-500 font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                {t('workout.cancel')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ExerciseInfoModal 
        exercise={selectedInfoExercise || lastInfoExercise!}
        isOpen={!!selectedInfoExercise}
        onClose={() => setSelectedInfoExercise(null)}
      />
    </Portal>
  );
};
