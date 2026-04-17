import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, Flame, AlertTriangle, Wind } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';

interface BerserkerHUDProps {
  onComplete: () => void;
  onAddActivity: () => void;
}

export const BerserkerHUD = ({ onComplete, onAddActivity }: BerserkerHUDProps) => {
  const { t } = useSettings();
  const { currentSession } = useWorkout();
  
  const isRedline = currentSession?.isRedline;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-[1600px] px-3 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center mx-auto">
        {/* Left: Aggression Metrics */}
        <div className="col-span-3 flex flex-col gap-8">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-panel p-8 border-l-8 border-crimson shadow-[0_0_40px_rgba(255,113,98,0.2)]"
          >
            <span className="font-headline text-[10px] tracking-[0.4em] text-zinc-500 uppercase font-black mb-2 block">{t('berserker.state')}</span>
            <h2 className="font-headline text-5xl font-black italic text-crimson text-glow-crimson uppercase tracking-tighter">
              {isRedline ? 'CRITICAL RECOVERY' : t('berserker.active')}
            </h2>
          </motion.div>

          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 border-l-8 border-volt shadow-[0_0_40px_var(--primary-glow)]"
          >
            <span className="font-headline text-[10px] tracking-[0.4em] text-zinc-500 uppercase font-black mb-2 block">{t('berserker.heartRate')}</span>
            <div className="flex items-baseline gap-3">
              <span className="font-headline text-7xl font-black italic leading-none">188</span>
              <span className="font-headline text-xl font-black text-volt">{t('berserker.bpm')}</span>
            </div>
            <div className="mt-6 h-2 w-full bg-zinc-900 overflow-hidden">
              <div 
                style={{ width: '95%' }}
                className="h-full bg-crimson" 
              />
            </div>
          </motion.div>
        </div>

        {/* Center: The Kinetic Core */}
        <div className="col-span-6 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-12"
          >
            <h1 className="font-headline text-7xl font-black italic text-white tracking-tighter leading-none">{t('berserker.kineticSurge')}</h1>
            <h2 className="font-headline text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-volt -mt-4 tracking-tighter">{t('berserker.mode')}</h2>
          </motion.div>

          <div className="relative w-64 h-64 flex items-center justify-center mb-12">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-4 border-dashed border-volt/30"
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 bg-volt shadow-[0_0_80px_var(--primary-glow)] flex items-center justify-center z-20"
            >
              <Zap size={64} fill="currentColor" className="text-void" />
            </motion.div>
          </div>
          
          <div className="flex flex-col gap-4 w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              className="group relative px-12 py-4 bg-void border-2 border-volt text-volt font-headline font-black uppercase italic tracking-[0.3em] hover:bg-volt hover:text-void transition-all shadow-[0_0_30px_var(--primary-glow)]"
            >
              <span className="relative z-10">{t('berserker.completeLift')}</span>
              <div className="absolute inset-0 bg-volt opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddActivity}
              className="px-8 py-3 bg-void/40 border border-white/10 text-white font-headline text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
            >
              <Activity size={14} className="group-hover:animate-pulse" />
              <span>Log Non-Program Activity</span>
            </motion.button>
          </div>

          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-12 font-headline text-xs tracking-[0.6em] text-volt font-black uppercase text-center"
          >
            {t('berserker.maxCapacity')}
          </motion.div>

          {/* Tactical Status Line */}
          <div className="mt-8 flex gap-6 opacity-30 justify-center">
            <span className="font-headline text-[8px] font-black uppercase tracking-[0.3em]">
              SYS_STATUS: ACTIVE {currentSession?.penaltyType ? '[RECOVERY_RESTRICTED]' : ''}
            </span>
            <span className="font-headline text-[8px] font-black uppercase tracking-[0.3em]">
              REF_ID: {currentSession?.id?.substring(0, 8) || 'INITIALIZING'}
            </span>
          </div>
        </div>

        {/* Right: Output & Stability */}
        <div className="col-span-3 flex flex-col gap-8 items-end">
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-panel p-8 border-r-8 border-volt shadow-[0_0_40px_var(--primary-glow)] text-right w-full"
          >
            <span className="font-headline text-[10px] tracking-[0.4em] text-zinc-500 uppercase font-black mb-2 block">{t('berserker.peakPower')}</span>
            <div className="flex items-baseline justify-end gap-3">
              <span className="font-headline text-7xl font-black italic leading-none">2,800</span>
              <span className="font-headline text-xl font-black text-volt">{t('berserker.watts')}</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 border border-crimson/40 bg-crimson/10 animate-pulse w-full"
          >
            <div className="flex items-center gap-4 text-crimson mb-4 justify-end">
              <span className="font-headline text-xs tracking-[0.3em] font-black uppercase">{t('berserker.cnsLoad')}: {t('berserker.critical')}</span>
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'berserker.neuralLink', val: 'berserker.stable', color: 'text-volt' },
                { label: 'berserker.gravityDef', val: 'berserker.active', color: 'text-volt' },
                { label: 'berserker.tempDist', val: '4.2MS', color: 'text-crimson' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-black font-headline uppercase tracking-widest">
                  <span className="text-zinc-500">{t(item.label)}</span>
                  <span className={item.color}>{t(item.val)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
