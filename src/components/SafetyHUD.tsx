import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Biohazard, AlertOctagon, Heart, Zap } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SafetyHUDProps {
  onDismiss: () => void;
}

export const SafetyHUD = ({ onDismiss }: SafetyHUDProps) => {
  const { t } = useSettings();
  return (
    <div className="relative w-full h-full flex justify-center overflow-y-auto overflow-x-hidden p-4">
      <div className="relative z-10 w-full max-w-lg space-y-6 my-auto py-8">
        <div className="text-center space-y-3">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 bg-crimson/20 text-crimson px-4 py-1.5 border-none backdrop-blur-md"
          >
            <ShieldAlert size={18} />
            <span className="font-headline text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase">SYSTEM CRITICAL</span>
          </motion.div>
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-headline text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none"
          >
            READINESS FAILURE <br /> <span className="text-crimson text-glow-crimson">DETECTED</span>
          </motion.h1>
        </div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-crimson/20 blur-[80px] animate-pulse" />
          <div className="relative glass-panel bg-surface-variant/60 backdrop-blur-[60px] p-8 sm:p-12 flex flex-col items-center text-center shadow-2xl">
            <h2 className="font-headline text-2xl sm:text-3xl font-black mb-3 tracking-tight uppercase italic text-crimson">NEURAL DRAIN LIMIT REACHED</h2>
            <p className="text-zinc-300 max-w-sm text-sm sm:text-base leading-relaxed font-medium">
              System readiness has dropped below the safety threshold of 20%. Cognitive and physical output is restricted to prevent structural degradation. 
            </p>
          </div>
        </motion.div>

        <div className="flex justify-center w-full">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDismiss}
            className="w-full flex flex-col items-center justify-center gap-3 bg-volt text-void p-6 shadow-[0_0_30px_var(--primary-glow)] transition-all"
          >
            <Biohazard size={32} />
            <div className="text-center">
              <span className="block font-headline text-xl font-black uppercase italic tracking-wider">ACKNOWLEDGE MANUAL OVERRIDE</span>
              <span className="block font-headline text-[9px] opacity-70 tracking-widest font-black uppercase mt-1">RESTORE SYSTEM ACCESS</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
