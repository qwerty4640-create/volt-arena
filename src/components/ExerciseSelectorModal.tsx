import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  Search,
  Check,
  Plus,
  X,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { EXERCISE_DATABASE, ExerciseDefinition } from '../constants/exercises';
import { ExerciseInfoModal } from './ExerciseInfoModal';
import { haptics } from '../lib/haptics';
import { InfoTooltip } from './InfoTooltip';

import { useWorkout } from '../contexts/WorkoutContext';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercises: { id: string, name: string }[], groupTitle?: string) => void;
}

export const ExerciseSelectorModal = ({ isOpen, onClose, onSelect }: ExerciseSelectorModalProps) => {
  const { t, profile } = useSettings();
  const { currentSession } = useWorkout();
  const [selectedInfoExercise, setSelectedInfoExercise] = useState<ExerciseDefinition | null>(null);
  const [lastInfoExercise, setLastInfoExercise] = useState<ExerciseDefinition | null>(null);
  const [isCircuitMode, setIsCircuitMode] = useState(false);
  const [selectedCircuitExercises, setSelectedCircuitExercises] = useState<{ id: string, name: string }[]>([]);
  const [circuitTitle, setCircuitTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const additionalCount = currentSession?.exercises.filter(ex => ex.isAdditional).length || 0;
  const level = profile?.level || 'untrained';

  let limit = Infinity;
  if (level === 'untrained' || level === 'novice') limit = 3;
  else if (level === 'intermediate') limit = 4;

  const remainingSlots = limit === Infinity ? Infinity : Math.max(0, limit - additionalCount);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const openInfo = (ex: ExerciseDefinition) => {
    haptics.button();
    setLastInfoExercise(ex);
    setSelectedInfoExercise(ex);
  };

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
            className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <h2 className="font-sans text-2xl font-black uppercase tracking-tight">
                  {isCircuitMode ? t('workout.createCircuit') : t('workout.addExercise')}
                </h2>
                {isCircuitMode && limit !== Infinity && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-volt/80 mt-1">
                    Select up to {remainingSlots} exercises
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsCircuitMode(!isCircuitMode);
                  setSelectedCircuitExercises([]);
                  setCircuitTitle('');
                }}
                className={cn(
                  "px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all",
                  isCircuitMode ? "bg-volt text-void" : "bg-white/5 text-zinc-400 hover:text-volt"
                )}
              >
                {isCircuitMode ? t('workout.switchSingle') : t('workout.switchCircuit')}
              </button>
            </div>

            {isCircuitMode && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder={t('workout.circuitTitlePlaceholder')}
                  value={circuitTitle}
                  onChange={(e) => setCircuitTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none py-3 px-4 text-xs text-white placeholder:text-zinc-600 focus:border-volt/50 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder={t('workout.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border-none py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-volt/50 outline-none transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              {(() => {
                const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
                
                const filtered = EXERCISE_DATABASE.filter(ex => {
                  if (searchTerms.length === 0) return true;
                  
                  const searchableString = [
                    ex.name.toLowerCase(),
                    ex.category.toLowerCase(),
                    ex.pattern.toLowerCase(),
                    ...(ex.muscles?.map(m => m.toLowerCase()) || []),
                    ...(ex.description ? [ex.description.toLowerCase()] : [])
                  ].join(' ');

                  return searchTerms.every(term => searchableString.includes(term));
                }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

                return (
                  <>
                    {filtered.map((ex) => {
                      const isSelected = selectedCircuitExercises.some(s => s.id === (ex.id || ex.name));
                      return (
                        <div key={ex.id || ex.name} className="relative group">
                          <button
                            onClick={() => {
                              if (isCircuitMode) {
                                setSelectedCircuitExercises(prev => {
                                  const alreadySelected = prev.some(s => s.id === (ex.id || ex.name));
                                  if (alreadySelected) {
                                    return prev.filter(s => s.id !== (ex.id || ex.name));
                                  }
                                  if (prev.length < remainingSlots) {
                                    return [...prev, { id: ex.id || ex.name, name: ex.name }];
                                  }
                                  return prev;
                                });
                              } else {
                                onSelect([{ id: ex.id || ex.name, name: ex.name }]);
                              }
                            }}
                            className={cn(
                              "w-full p-4 pr-14 border-none text-left transition-all flex justify-between items-center relative overflow-hidden",
                              isSelected ? "bg-volt/20 border-l-2 border-volt" : "bg-surface-container-low hover:bg-surface-container-high",
                              isCircuitMode && !isSelected && selectedCircuitExercises.length >= remainingSlots && "opacity-50 grayscale cursor-not-allowed"
                            )}
                          >
                            <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 w-full">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className={cn(
                                  "font-headline text-lg font-black uppercase tracking-tight transition-colors",
                                  isSelected ? "text-volt" : "group-hover:text-volt text-white"
                                )}>
                                  {ex.name}
                                </div>
                                <div className="relative z-20 shrink-0">
                                   <InfoTooltip term={ex.name as any} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                  {ex.category}
                                </div>
                                {ex.pattern && (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-volt/60">
                                      {ex.pattern.replace('_', ' ')}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="relative z-10">
                              {isCircuitMode && (
                                <div className={cn(
                                  "w-5 h-5 border-2 flex items-center justify-center transition-all",
                                  isSelected ? "border-volt bg-volt text-void" : "border-zinc-700",
                                  !isSelected && selectedCircuitExercises.length >= remainingSlots && "border-zinc-800 bg-zinc-900"
                                )}>
                                  {isSelected && <Check size={14} strokeWidth={4} />}
                                </div>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openInfo(ex);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-volt hover:border-volt/50 transition-all z-20"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      );
                    })}

                    {searchQuery && !filtered.some(ex => ex.name.toLowerCase() === searchQuery.toLowerCase()) && (
                      <button
                        onClick={() => {
                          const customEx = { id: searchQuery, name: searchQuery };
                          if (isCircuitMode) {
                            setSelectedCircuitExercises(prev => [...prev, customEx]);
                          } else {
                            onSelect([customEx]);
                          }
                          setSearchQuery('');
                        }}
                        className="w-full p-6 bg-volt/5 border border-dashed border-volt/30 hover:bg-volt/10 transition-all group flex flex-col items-center gap-2"
                      >
                        <PlusCircle size={24} className="text-volt" />
                        <div className="text-center">
                          <div className="text-[10px] font-black uppercase tracking-widest text-volt">{t('workout.createCustom')}</div>
                          <div className="text-lg font-black uppercase text-white">"{searchQuery}"</div>
                        </div>
                      </button>
                    )}

                    {filtered.length === 0 && !searchQuery && (
                      <div className="text-center py-8 text-zinc-600 text-sm">
                        {t('workout.searchEmpty')}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {isCircuitMode && selectedCircuitExercises.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={() => onSelect(selectedCircuitExercises, circuitTitle || t('workout.tacticalCircuit'))}
                  className="w-full py-4 bg-volt text-void font-headline text-sm font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3"
                >
                  <PlusCircle size={20} />
                  <span>Add Circuit ({selectedCircuitExercises.length} Exercises)</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-6 btn-secondary py-4"
            >
              Close
            </button>
            <ExerciseInfoModal 
              exercise={selectedInfoExercise || lastInfoExercise!}
              isOpen={!!selectedInfoExercise}
              onClose={() => setSelectedInfoExercise(null)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
