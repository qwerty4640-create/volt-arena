import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Info, Search } from 'lucide-react';
import { ExerciseDefinition, EXERCISE_DATABASE } from '../constants/exercises';
import { useSettings } from '../contexts/SettingsContext';
import { Portal } from './Portal';
import { ExerciseInfoModal } from './ExerciseInfoModal';
import { haptics } from '../lib/haptics';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '../lib/utils';

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
  
  const currentExercise = useMemo(() => {
    return EXERCISE_DATABASE.find(e => e.id === currentExerciseId || e.name.toLowerCase() === currentExerciseId.toLowerCase());
  }, [currentExerciseId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory(currentExercise?.category || 'All');
      setSelectedMuscle('All');
    }
  }, [isOpen, currentExercise]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    EXERCISE_DATABASE.forEach(ex => {
      if (ex.category) cats.add(ex.category);
    });
    return Array.from(cats).sort();
  }, []);

  const muscles = useMemo(() => {
    const m = new Set<string>();
    EXERCISE_DATABASE.forEach(ex => {
      if (ex.muscles) {
        ex.muscles.forEach(muscle => m.add(muscle));
      }
    });
    return Array.from(m).sort();
  }, []);

  const filteredExercises = useMemo(() => {
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    
    return EXERCISE_DATABASE.filter(ex => {
      if (ex.id === currentExerciseId || ex.name.toLowerCase() === currentExerciseId.toLowerCase()) return false;

      const matchSearch = searchTerms.length === 0 || searchTerms.every(term => {
        const searchableString = [
          ex.name.toLowerCase(),
          ex.category.toLowerCase(),
          ex.pattern.toLowerCase(),
          ...(ex.muscles?.map(m => m.toLowerCase()) || []),
          ...(ex.description ? [ex.description.toLowerCase()] : [])
        ].join(' ');
        return searchableString.includes(term);
      });

      const matchCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      const matchMuscle = selectedMuscle === 'All' || (ex.muscles && ex.muscles.includes(selectedMuscle));

      return matchSearch && matchCategory && matchMuscle;
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [searchQuery, selectedCategory, selectedMuscle, currentExerciseId]);

  const openInfo = (alt: ExerciseDefinition) => {
    haptics.button();
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
              className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] bg-zinc-950 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-volt" size={24} />
                  <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white">
                    {t('workout.swapExercise')}
                  </h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>

              <p className="text-zinc-400 text-sm mb-4 font-medium shrink-0">
                {t('workout.swapDesc').replace('{exercise}', currentExercise?.name || currentExerciseId)}
              </p>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder={t('workout.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-zinc-800 py-3 pl-12 pr-4 text-xs text-white placeholder:text-zinc-600 focus:border-volt/50 outline-none transition-all rounded-none"
                />
              </div>

              <div className="mb-4 space-y-2 shrink-0">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border border-zinc-800",
                      selectedCategory === 'All' ? 'bg-volt/20 text-volt border-volt/30' : 'bg-black text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border border-zinc-800",
                        selectedCategory === cat ? 'bg-volt/20 text-volt border-volt/30' : 'bg-black text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedMuscle('All')}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border border-zinc-800",
                      selectedMuscle === 'All' ? 'bg-volt/20 text-volt border-volt/30' : 'bg-black text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    All Muscles
                  </button>
                  {muscles.map(mus => (
                    <button
                      key={mus}
                      onClick={() => setSelectedMuscle(mus)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border border-zinc-800",
                        selectedMuscle === mus ? 'bg-volt/20 text-volt border-volt/30' : 'bg-black text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {mus}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 min-h-[200px]">
                {filteredExercises.map((alt) => (
                  <div key={alt.id} className="relative group">
                    <button
                      onClick={() => {
                        onSwap(alt.id || alt.name);
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
                      <div className="flex flex-wrap items-center gap-2 mt-1 relative">
                        <div className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {alt.category}
                        </div>
                        {alt.pattern && alt.pattern.toLowerCase() !== alt.category.toLowerCase() && (
                          <div className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            {alt.pattern.replace('_', ' ')}
                          </div>
                        )}
                        {alt.muscles?.map(m => {
                          if (m.toLowerCase() === alt.category.toLowerCase() || (alt.pattern && m.toLowerCase() === alt.pattern.toLowerCase().replace('_', ' '))) {
                            return null;
                          }
                          return (
                            <div key={m} className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                              {m}
                            </div>
                          );
                        })}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInfo(alt);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-volt hover:border-volt/50 transition-all z-10"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                ))}
                
                {filteredExercises.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/10">
                    <p className="text-zinc-500 text-sm">
                      {t('workout.noAltsFound')}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-6 py-4 border-none text-zinc-500 font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all shrink-0"
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
