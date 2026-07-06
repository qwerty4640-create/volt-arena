import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ExerciseDefinition, EXERCISE_DATABASE } from '../constants/exercises';
import { haptics } from '../lib/haptics';
import { Portal } from './Portal';

interface ExerciseInfoModalProps {
  exercise: ExerciseDefinition;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseInfoModal = ({ exercise, isOpen, onClose }: ExerciseInfoModalProps) => {
  // Find the master definition to safeguard against incomplete objects or null/missing gifUrls
  const masterDef = exercise ? EXERCISE_DATABASE.find(e => {
    if (exercise.id && e.id === exercise.id) return true;
    if ((exercise as any).exerciseId && e.id === (exercise as any).exerciseId) return true;
    if (e.name && exercise.name && e.name.toLowerCase().trim() === exercise.name.toLowerCase().trim()) return true;
    const cleanStr = (s: string) => s?.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?|\[?ACTIVE RECOVERY\]?|\[?MOVEMENT QUALITY\]?|\[?BLOOD FLOW\]?/gi, '').trim().toLowerCase() || '';
    return exercise.name && cleanStr(e.name) === cleanStr(exercise.name);
  }) : undefined;

  const rawGifUrl = (exercise?.gifUrl && exercise.gifUrl !== 'null') ? exercise.gifUrl : (masterDef?.gifUrl || null);
  const correctedGifUrl = rawGifUrl;

  const resolved = {
    ...masterDef,
    ...exercise,
    gifUrl: correctedGifUrl,
    description: exercise?.description || masterDef?.description || '',
    tips: (exercise?.tips && exercise.tips.length > 0) ? exercise.tips : (masterDef?.tips || []),
    instructions: (exercise?.instructions && exercise.instructions.length > 0) ? exercise.instructions : (masterDef?.instructions || []),
    muscles: (exercise?.muscles && exercise.muscles.length > 0) ? exercise.muscles : (masterDef?.muscles || []),
    bodyPart: exercise?.bodyPart || masterDef?.bodyPart || '',
    equipment: exercise?.equipment || masterDef?.equipment || '',
    targetMuscle: exercise?.targetMuscle || masterDef?.targetMuscle || '',
    secondaryMuscles: (exercise?.secondaryMuscles && exercise.secondaryMuscles.length > 0) ? exercise.secondaryMuscles : (masterDef?.secondaryMuscles || []),
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { haptics.button(); onClose(); }}
          className="absolute inset-0 bg-void/90 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm glass-panel border-volt/30 p-6 shadow-[0_0_50px_var(--primary-glow)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-volt" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">
                {resolved.name}
              </h2>
            </div>
            <button onClick={() => { haptics.button(); onClose(); }} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {resolved.gifUrl && (
              <div className="p-1 bg-zinc-950 border border-white/10 flex items-center justify-center">
                <img 
                  src={resolved.gifUrl} 
                  alt={resolved.name} 
                  className="w-full aspect-square object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="p-4 bg-zinc-900/50 border border-white/5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 font-sans">Description</p>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {resolved.description || 'No description available.'}
              </p>
            </div>

            {(resolved.bodyPart || resolved.equipment || resolved.targetMuscle) && (
              <div className="p-4 bg-zinc-950/40 border border-white/5 space-y-2 font-mono text-xs text-zinc-400">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-sans mb-2">Technical Specs</p>
                {resolved.bodyPart && (
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Body Part</span>
                    <span className="text-volt font-bold uppercase">{resolved.bodyPart}</span>
                  </div>
                )}
                {resolved.targetMuscle && (
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Target Muscle</span>
                    <span className="text-volt font-bold uppercase">{resolved.targetMuscle}</span>
                  </div>
                )}
                {resolved.equipment && (
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Equipment</span>
                    <span className="text-zinc-200 uppercase">{resolved.equipment}</span>
                  </div>
                )}
                {resolved.secondaryMuscles && resolved.secondaryMuscles.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-zinc-500 text-[10px] uppercase">Secondary Muscles</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {resolved.secondaryMuscles.map((m, idx) => (
                        <span key={idx} className="bg-zinc-900 border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300 uppercase">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {resolved.muscles && resolved.muscles.length > 0 && (
              <div className="p-4 bg-volt/5 border border-volt/10">
                <p className="text-xs font-bold text-volt uppercase tracking-widest mb-1">Muscles Targeted</p>
                <div className="flex flex-wrap gap-2">
                    {resolved.muscles.map((muscle, i) => (
                        <span key={i} className="text-xs text-white bg-volt/20 px-2 py-1">{muscle}</span>
                    ))}
                </div>
              </div>
            )}


            {resolved.instructions && resolved.instructions.length > 0 && (
              <div className="p-4 bg-zinc-900/50 border border-white/5">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">How To Perform</p>
                <ul className="list-decimal list-inside space-y-1">
                    {resolved.instructions.map((step, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed">{step}</li>
                    ))}
                </ul>
              </div>
            )}

            {resolved.tips && resolved.tips.length > 0 && (
              <div className="p-4 bg-zinc-900/50 border border-white/5">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Cues & Tips</p>
                <ul className="list-disc list-inside space-y-1">
                    {resolved.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed">{tip}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <button 
            onClick={() => { haptics.button(); onClose(); }}
            className="w-full mt-8 btn-secondary py-4"
          >
            Close
          </button>
        </motion.div>
      </div>
      )}
      </AnimatePresence>
    </Portal>
  );
};
