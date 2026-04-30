import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Book, X, Info } from 'lucide-react';
import { TRAINING_TERMS } from '../data/trainingTerms';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface FieldManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FieldManual = ({ isOpen, onClose }: FieldManualProps) => {
  const { t } = useSettings();
  const [mounted, setMounted] = useState(false);
  const terms = Object.entries(TRAINING_TERMS);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/95 backdrop-blur-2xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl h-[85vh] glass-panel border-volt/30 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-volt/10 flex items-center justify-center text-volt border border-volt/20">
                  <Book size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">
                    {t('settings.fieldManual')}
                  </h2>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
                    {t('settings.fieldManualSubtitle')}
                  </p>
                </div>
              </div>
              {/*... X button hidden}
              <button 
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
                aria-label="Close Manual"
              >
                <X size={24} />
              </button>
              {...*/}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                {terms.map(([key, data], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                    <div className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-volt" />
                          <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                            {t(`tooltip.${key}.title`)}
                          </h4>
                        </div>
                        <div className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                          {t('common.id')}: {key.toUpperCase()}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-volt uppercase tracking-[0.2em] flex items-center gap-2">
                            {/*}<Info size={10} />{*/}
                            {t('fieldManual.summary')}
                          </p>
                          <p className="text-zinc-200 text-sm leading-relaxed font-medium pl-4 border-l border-volt/20">
                            {t(`tooltip.${key}.short`)}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                            {t('fieldManual.doctrine')}
                          </p>
                          <p className="text-zinc-400 text-xs leading-relaxed pl-4 border-l border-zinc-800">
                            {t(`tooltip.${key}.long`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-8 mt-4 border border-dashed border-white/5 text-center opacity-50">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                  {t('fieldManual.endOfDefinitions')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-950 border-t border-white/5">
              <button
                onClick={onClose}
                className="w-full btn-secondary py-4"
              >
                <X size={16} /> {t('tooltip.close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
