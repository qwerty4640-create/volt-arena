import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Star, ChevronRight, Zap, X } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '../lib/utils';
import { WorkoutSession } from '../contexts/WorkoutContext';

interface ReflectionModalProps {
  session: WorkoutSession;
  onSave: (rpe: number) => Promise<void>;
  onClose: () => void;
  key?: React.Key;
}

export const ReflectionModal = ({ session, onSave, onClose }: ReflectionModalProps) => {
  const [rpe, setRpe] = useState(() => {
    const raw = session.rpe || 7;
    return Math.round(raw * 2) / 2;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveReflection = async () => {
    setIsSaving(true);
    try {
      await onSave(rpe);
      localStorage.setItem(`reflected_${session.id}`, 'true');
    } catch (err) {
      console.error('Data sync failed, closing UI.', err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-void/95 backdrop-blur-xl cursor-default"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md glass-panel border-volt/20 p-8 shadow-[0_0_50px_var(--primary-glow)]"
      >
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-volt/10 text-volt border border-volt/20 mb-2">
            <MessageSquare size={32} />
          </div>
          <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight text-white">Post-Mission Reflection</h2>
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
            {session.title} • {new Date(session.completedAt || 0).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <div className="p-4 bg-surface-container-lowest border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-zinc-400">
                <Star size={14} className="text-volt" />
                <span className="text-[10px] font-black uppercase tracking-widest">Actual Mission RPE</span>
                <InfoTooltip term="sRPE" />
              </div>
              <span className="text-3xl font-black text-volt">{rpe.toFixed(1)}</span>
            </div>
            
            <div className="relative h-12 flex items-center">
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5"
                value={rpe}
                onChange={(e) => setRpe(parseFloat(e.target.value))}
                className="w-full h-2 bg-void appearance-none cursor-pointer accent-volt border border-white/5"
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              <span>Easy (1)</span>
              <span>Moderate (5)</span>
              <span>Max Effort (10)</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-zinc-400 font-medium max-w-md leading-relaxed text-center">
              Reflecting on your mission 15-30 minutes later provides a more accurate measure of the total physiological load.
            </p>
            
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary py-4"
            >
              <X size={16} /> Close
            </button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveReflection}
              disabled={isSaving}
              className="flex-[2] btn-primary py-4"
            >
              <span>{isSaving ? 'Saving...' : 'Save Reflection'}</span>
              <ChevronRight size={18} />
            </motion.button>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
