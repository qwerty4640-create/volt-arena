import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { TRAINING_TERMS, TermKey } from '../data/trainingTerms';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface InfoTooltipProps {
  term: TermKey;
  className?: string;
}

export const InfoTooltip = ({ term, className }: InfoTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useSettings();
  const data = TRAINING_TERMS[term];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data) return null;

  return (
    <>
      <div className={cn("inline-block ml-1.5 align-baseline", className)}>
        {/* Trigger Button: Tier-Dynamic Colors */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          aria-expanded={isOpen}
          aria-label={`${t('tooltip.showInfo')} ${data.title}`}
          className={cn(
            "w-4 h-4 flex items-center justify-center rounded-full border border-volt/30 text-volt hover:bg-volt hover:text-void transition-all duration-300"
          )}
        >
          <span className="text-[10px] font-black">i</span>
        </button>
      </div>

      {/* Full Screen Modal Overlay via Portal to bypass container transforms */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
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
                      {t(`tooltip.${term}.title`)}
                    </h2>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-volt/5 border border-volt/10">
                    <p className="text-xs font-bold text-volt uppercase tracking-widest mb-1">{t('tooltip.brief')}</p>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {t(`tooltip.${term}.short`)}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-900/50 border border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('tooltip.details')}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                      {t(`tooltip.${term}.long`)}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-8 btn-secondary py-4"
                >
                  <X size={16} /> {t('tooltip.close')}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
