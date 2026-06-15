import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  Search,
  Check,
  Plus,
  X,
  Info,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { EXERCISE_DATABASE, ExerciseDefinition } from '../constants/exercises';
import { ExerciseInfoModal } from './ExerciseInfoModal';
import { haptics } from '../lib/haptics';
import { InfoTooltip } from './InfoTooltip';
import { LibraryDropdown } from './LibraryDropdown';

import { useWorkout } from '../contexts/WorkoutContext';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

interface SavedCircuit {
  id: string;
  title: string;
  exercises: { id: string, name: string }[];
}

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isMuscleDropdownOpen, setIsMuscleDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [savedCircuits, setSavedCircuits] = useState<SavedCircuit[]>([]);

  const additionalCount = currentSession?.exercises.filter(ex => ex.isAdditional).length || 0;
  const level = profile?.level || 'untrained';

  let limit = Infinity;
  if (level === 'untrained' || level === 'novice') limit = 3;
  else if (level === 'intermediate') limit = 4;

  const remainingSlots = limit === Infinity ? Infinity : Math.max(0, limit - additionalCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsCatDropdownOpen(false);
      setIsMuscleDropdownOpen(false);
      return;
    }
    
    setIsCatDropdownOpen(false);
    setIsMuscleDropdownOpen(false);

    const loadCircuits = async () => {
      const local = localStorage.getItem('volt_saved_circuits');
      let localCircuits: SavedCircuit[] = [];
      if (local) {
        try {
          localCircuits = JSON.parse(local);
          setSavedCircuits(localCircuits);
        } catch (e) {}
      }

      if (auth.currentUser) {
        try {
          const snap = await getDocs(collection(db, `users/${auth.currentUser.uid}/circuits`));
          const fbCircuits = snap.docs.map(d => d.data() as SavedCircuit);
          
          const combined = [...localCircuits];
          fbCircuits.forEach(fbc => {
            if (!combined.some(c => c.id === fbc.id)) {
              combined.push(fbc);
            }
          });
          setSavedCircuits(combined);
          localStorage.setItem('volt_saved_circuits', JSON.stringify(combined));
        } catch (e) {
          console.error("Failed to load circuits from Firebase", e);
        }
      }
    };
    loadCircuits();
  }, [isOpen]);

  const handleSaveCircuit = async () => {
    if (selectedCircuitExercises.length === 0) return;
    const newCircuit: SavedCircuit = {
      id: Date.now().toString(),
      title: circuitTitle || 'Untitled Circuit',
      exercises: selectedCircuitExercises
    };

    const newCircuits = [...savedCircuits, newCircuit];
    setSavedCircuits(newCircuits);
    localStorage.setItem('volt_saved_circuits', JSON.stringify(newCircuits));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/circuits`, newCircuit.id), newCircuit);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/circuits`);
      }
    }
  };

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
  }, [searchQuery, selectedCategory, selectedMuscle]);

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
            className="relative w-full max-w-md md:max-w-4xl glass-panel p-4 md:p-8 border-volt/20 shadow-[0_0_50px_var(--primary-glow)] flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
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
                  "px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all shrink-0",
                  isCircuitMode ? "bg-volt text-void" : "bg-white/5 text-zinc-400 hover:text-volt"
                )}
              >
                {isCircuitMode ? t('workout.switchSingle') : t('workout.switchCircuit')}
              </button>
            </div>

            {isCircuitMode && (
              <div className="mb-4 shrink-0 flex flex-col gap-2">
                {savedCircuits.length > 0 && (
                  <div className="mb-2 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Saved Circuits</h3>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                      {savedCircuits.map(sc => (
                        <button
                          key={sc.id}
                          onClick={() => {
                            setCircuitTitle(sc.title);
                            // Only set up to remaining slots
                            setSelectedCircuitExercises(sc.exercises.slice(0, remainingSlots));
                          }}
                          className="whitespace-nowrap px-3 py-2 bg-white/5 border border-white/10 hover:border-volt/50 text-left transition-all max-w-[200px]"
                        >
                          <div className="text-[10px] font-bold text-white mb-1 truncate">{sc.title}</div>
                          <div className="text-[8px] text-zinc-400 truncate">
                            {sc.exercises.map(e => e.name).join(', ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('workout.circuitTitlePlaceholder')}
                    value={circuitTitle}
                    onChange={(e) => setCircuitTitle(e.target.value)}
                    className="flex-1 bg-surface-container-lowest border border-white/5 py-3 px-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-all"
                  />
                  <button 
                    onClick={handleSaveCircuit}
                    disabled={selectedCircuitExercises.length === 0}
                    className="px-4 py-2 bg-volt/20 text-volt text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:grayscale transition-all hover:bg-volt/30 shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="relative mb-4 shrink-0 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-volt transition-colors" size={18} />
              <input
                type="text"
                placeholder={t('workout.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-all"
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 shrink-0">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  Category
                </label>
                <LibraryDropdown
                  label="All Categories"
                  value={selectedCategory}
                  options={categories}
                  isOpen={isCatDropdownOpen}
                  onChange={(val) => setSelectedCategory(val)}
                  onToggle={() => {
                    setIsCatDropdownOpen(!isCatDropdownOpen);
                    setIsMuscleDropdownOpen(false);
                  }}
                  onClose={() => setIsCatDropdownOpen(false)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  Muscle Group
                </label>
                <LibraryDropdown
                  label="All Muscles"
                  value={selectedMuscle}
                  options={muscles}
                  isOpen={isMuscleDropdownOpen}
                  onChange={(val) => setSelectedMuscle(val)}
                  onToggle={() => {
                    setIsMuscleDropdownOpen(!isMuscleDropdownOpen);
                    setIsCatDropdownOpen(false);
                  }}
                  onClose={() => setIsMuscleDropdownOpen(false)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[200px] grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              <>
                {filteredExercises.map((ex) => {
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
                        <div className="relative z-10 w-full flex items-center gap-4">
                          {isCircuitMode && (
                            <div className={cn(
                              "w-5 h-5 border-2 flex items-center justify-center transition-all shrink-0",
                              isSelected ? "border-volt bg-volt text-void" : "border-zinc-700",
                              !isSelected && selectedCircuitExercises.length >= remainingSlots && "border-zinc-800 bg-zinc-900"
                            )}>
                              {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={cn(
                                "font-headline text-lg font-semibold uppercase tracking-tight transition-colors",
                                isSelected ? "text-volt" : "group-hover:text-volt text-white"
                              )}>
                                {ex.name}
                              </div>
                              <div className="relative z-20 shrink-0">
                                 <InfoTooltip term={ex.name as any} />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <div className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                {ex.category}
                              </div>
                              {ex.pattern && ex.pattern.toLowerCase() !== ex.category.toLowerCase() && (
                                <div className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                  {ex.pattern.replace('_', ' ')}
                                </div>
                              )}
                              {ex.muscles?.map(m => {
                                if (m.toLowerCase() === ex.category.toLowerCase() || (ex.pattern && m.toLowerCase() === ex.pattern.toLowerCase().replace('_', ' '))) {
                                  return null;
                                }
                                return (
                                  <div key={m} className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                    {m}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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

                {searchQuery && !filteredExercises.some(ex => ex.name.toLowerCase() === searchQuery.toLowerCase()) && (
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

                {filteredExercises.length === 0 && !searchQuery && (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    {t('workout.searchEmpty')}
                  </div>
                )}
              </>
            </div>

            {isCircuitMode && selectedCircuitExercises.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/5 shrink-0">
                <button
                  onClick={() => onSelect(selectedCircuitExercises, circuitTitle || t('workout.tacticalCircuit'))}
                  className="w-full py-4 bg-volt text-void font-headline text-sm font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3 shrink-0"
                >
                  <PlusCircle size={20} />
                  <span>Add Circuit ({selectedCircuitExercises.length} Exercises)</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-6 btn-secondary py-4 shrink-0"
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
