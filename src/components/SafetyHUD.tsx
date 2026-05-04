import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle, AlertOctagon, Heart, Zap } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SafetyHUDProps {
  onDismiss: () => void;
}

export const SafetyHUD = ({ onDismiss }: SafetyHUDProps) => {
  const { t } = useSettings();
  return (
    <div className="relative w-full h-full flex justify-center overflow-y-auto p-4">
      <div className="relative z-10 w-full max-w-4xl space-y-12 my-auto py-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 bg-crimson/20 text-crimson px-6 py-2 border-none backdrop-blur-md"
          >
            <ShieldAlert size={20} />
            <span className="font-headline text-sm font-black tracking-[0.2em] uppercase">{t('safety.alertActive')}</span>
          </motion.div>
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-headline text-7xl font-black italic tracking-tighter uppercase leading-none"
          >
            {t('safety.unusualMotion')} <br /> <span className="text-crimson text-glow-crimson">{t('safety.detected')}</span>
          </motion.h1>
        </div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="relative group"
        >
          <div className="absolute -inset-8 bg-crimson/20 blur-[100px] animate-pulse" />
          <div className="relative glass-panel bg-surface-variant/60 backdrop-blur-[60px] p-16 flex flex-col items-center text-center shadow-2xl">
            <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle className="text-white/10" cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" />
                <motion.circle 
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 150 }}
                  transition={{ duration: 8, ease: 'linear' }}
                  className="text-crimson" cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray="553"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="font-headline text-7xl font-black text-white">08</span>
                <span className="font-headline text-[10px] tracking-widest text-zinc-500 font-black uppercase">{t('safety.seconds')}</span>
              </div>
            </div>
            <h2 className="font-headline text-4xl font-black mb-4 tracking-tight uppercase italic">{t('safety.fallDetected')}</h2>
            <p className="text-zinc-400 max-w-md text-lg leading-relaxed font-medium">
              {t('safety.emergencyMessage')}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            className="flex flex-col items-center justify-center gap-4 bg-volt text-void p-8 shadow-[0_0_30px_var(--primary-glow)] transition-all"
          >
            <CheckCircle size={40} />
            <div className="text-center">
              <span className="block font-headline text-xl font-black uppercase italic">{t('safety.yesOk')}</span>
              <span className="block font-headline text-[10px] opacity-70 tracking-widest font-black uppercase">{t('safety.cancelAlert')}</span>
            </div>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-4 bg-surface-high/40 backdrop-blur-xl border-none text-crimson p-8 hover:bg-crimson hover:text-void transition-all"
          >
            <AlertOctagon size={40} />
            <div className="text-center">
              <span className="block font-headline text-xl font-black uppercase italic">{t('safety.noAlert')}</span>
              <span className="block font-headline text-[10px] opacity-70 tracking-widest font-black uppercase">{t('safety.immediateHelp')}</span>
            </div>
          </motion.button>
        </div>

        <div className="flex justify-center gap-12 text-zinc-500 font-headline text-xs tracking-[0.3em] font-black uppercase border-t border-white/5 pt-8">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-crimson" />
            <span>{t('safety.hr')}: 142 {t('safety.bpm')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-volt" />
            <span>{t('safety.kinetic')}: {t('safety.impactLogged')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
