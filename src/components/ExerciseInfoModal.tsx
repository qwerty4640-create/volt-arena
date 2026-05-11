import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ExerciseDefinition } from '../constants/exercises';
import { haptics } from '../lib/haptics';
import { Portal } from './Portal';

interface ExerciseInfoModalProps {
  exercise: ExerciseDefinition;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseInfoModal = ({ exercise, isOpen, onClose }: ExerciseInfoModalProps) => {
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
                {exercise.name}
              </h2>
            </div>
            <button onClick={() => { haptics.button(); onClose(); }} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 bg-zinc-900/50 border border-white/5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {exercise.description || 'No description available.'}
              </p>
            </div>

            {exercise.muscles && exercise.muscles.length > 0 && (
              <div className="p-4 bg-volt/5 border border-volt/10">
                <p className="text-xs font-bold text-volt uppercase tracking-widest mb-1">Muscles Targeted</p>
                <div className="flex flex-wrap gap-2">
                    {exercise.muscles.map((muscle, i) => (
                        <span key={i} className="text-xs text-white bg-volt/20 px-2 py-1 rounded">{muscle}</span>
                    ))}
                </div>
              </div>
            )}

            {exercise.instructions && exercise.instructions.length > 0 && (
              <div className="p-4 bg-zinc-900/50 border border-white/5">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">How To Perform</p>
                <ul className="list-decimal list-inside space-y-1">
                    {exercise.instructions.map((step, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed">{step}</li>
                    ))}
                </ul>
              </div>
            )}

            {exercise.tips && exercise.tips.length > 0 && (
              <div className="p-4 bg-zinc-900/50 border border-white/5">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Cues & Tips</p>
                <ul className="list-disc list-inside space-y-1">
                    {exercise.tips.map((tip, i) => (
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
