import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  Search,
  Check,
  Plus,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { EXERCISE_DATABASE } from '../constants/exercises';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exerciseNames: string[], groupTitle?: string) => void;
}

export const ExerciseSelectorModal = ({ isOpen, onClose, onSelect }: ExerciseSelectorModalProps) => {
  const { t } = useSettings();
  const [isCircuitMode, setIsCircuitMode] = useState(false);
  const [selectedCircuitExercises, setSelectedCircuitExercises] = useState<string[]>([]);
  const [circuitTitle, setCircuitTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
            className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/*}<PlusCircle className="text-volt" size={24} />{*/}
                <h2 className="font-sans text-2xl font-black uppercase italic tracking-tight">
                  {isCircuitMode ? t('workout.createCircuit') : t('workout.addExercise')}
                </h2>
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
                const filtered = EXERCISE_DATABASE.filter(ex =>
                  ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ex.category.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <>
                    {filtered.map((ex) => {
                      const isSelected = selectedCircuitExercises.includes(ex.name);
                      return (
                        <button
                          key={ex.name}
                          onClick={() => {
                            if (isCircuitMode) {
                              setSelectedCircuitExercises(prev =>
                                prev.includes(ex.name)
                                  ? prev.filter(n => n !== ex.name)
                                  : [...prev, ex.name]
                              );
                            } else {
                              onSelect([ex.name]);
                            }
                          }}
                          className={cn(
                            "w-full p-4 border-none text-left transition-all group flex justify-between items-center",
                            isSelected ? "bg-volt/20 border-l-2 border-volt" : "bg-surface-container-low hover:bg-surface-container-high"
                          )}
                        >
                          <div>
                            <div className={cn(
                              "font-headline text-lg font-black uppercase italic tracking-tight transition-colors",
                              isSelected ? "text-volt" : "group-hover:text-volt"
                            )}>
                              {ex.name}
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                              {ex.category}
                            </div>
                          </div>
                          {isCircuitMode ? (
                            <div className={cn(
                              "w-5 h-5 border-2 flex items-center justify-center transition-all",
                              isSelected ? "border-volt bg-volt text-void" : "border-zinc-700"
                            )}>
                              {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>
                          ) : (
                            <Plus size={16} className="text-zinc-500 group-hover:text-volt transition-colors" />
                          )}
                        </button>
                      );
                    })}

                    {searchQuery && !filtered.some(ex => ex.name.toLowerCase() === searchQuery.toLowerCase()) && (
                      <button
                        onClick={() => {
                          if (isCircuitMode) {
                            setSelectedCircuitExercises(prev => [...prev, searchQuery]);
                          } else {
                            onSelect([searchQuery]);
                          }
                          setSearchQuery('');
                        }}
                        className="w-full p-6 bg-volt/5 border border-dashed border-volt/30 hover:bg-volt/10 transition-all group flex flex-col items-center gap-2"
                      >
                        <PlusCircle size={24} className="text-volt" />
                        <div className="text-center">
                          <div className="text-[10px] font-black uppercase tracking-widest text-volt">{t('workout.createCustom')}</div>
                          <div className="text-lg font-black uppercase italic text-white">"{searchQuery}"</div>
                        </div>
                      </button>
                    )}

                    {filtered.length === 0 && !searchQuery && (
                      <div className="text-center py-8 text-zinc-600 italic text-sm">
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
                  className="w-full py-4 bg-volt text-void font-headline text-sm font-black uppercase italic tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
