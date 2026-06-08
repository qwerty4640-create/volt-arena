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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                    {t('settings.fieldManual')}
                  </h2>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
                    {t('settings.fieldManualSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {terms.map(([key, data], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative cursor-pointer"
                    onClick={() => setSelectedKey(key)}
                  >
                    <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                    <div className="relative p-4 md:p-6 glass-panel border border-white/5 hover:border-volt/30 hover:bg-white/5 group-hover:border-volt/30 group-hover:bg-white/5 transition-all duration-300 bg-void/50 flex flex-col justify-between min-h-[140px]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-5 bg-volt" />
                          <h4 className="text-base md:text-lg font-black uppercase tracking-tighter text-white group-hover:text-volt transition-colors">
                            {t(`tooltip.${key}.title`)}
                          </h4>
                        </div>
                        <div className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 rounded-none">
                          {key.toUpperCase()}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-volt/80 uppercase tracking-[0.2em]">
                          {t('fieldManual.summary')}
                        </p>
                        <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-medium pl-3 border-l border-volt/20">
                          {t(`tooltip.${key}.short`)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-8 mt-4 border border-dashed border-white/5 text-center opacity-50">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
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

          {/* Core Doctrine Overlay Detail Modal */}
          <AnimatePresence>
            {selectedKey && (
              <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedKey(null)}
                  className="absolute inset-0 bg-void/98 backdrop-blur-xl"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-md glass-panel border-volt/40 bg-void p-6 md:p-8 space-y-6 shadow-[0_0_80px_rgba(0,182,255,0.15)] rounded-none z-[3001]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close trigger top-right */}
                  <button
                    onClick={() => setSelectedKey(null)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  {/* Header/Title */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-volt" />
                      <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                        {t(`tooltip.${selectedKey}.title`)}
                      </h3>
                    </div>
                    <div className="inline-block px-2 py-0.5 bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 rounded-none">
                      {t('common.id')}: {selectedKey.toUpperCase()}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black text-volt uppercase tracking-[0.2em]">
                        {t('fieldManual.summary')}
                      </h4>
                      <p className="text-zinc-100 text-sm md:text-base leading-relaxed font-semibold pl-4 border-l-2 border-volt">
                        {t(`tooltip.${selectedKey}.short`)}
                      </p>
                    </div>

                    {/* Detailed Doctrine */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                        {t('fieldManual.doctrine')}
                      </h4>
                      {selectedKey.toLowerCase() === 'deploymentobjectives' ? (
                        <ul className="space-y-2 pl-4 border-l border-zinc-800 text-zinc-300 text-xs md:text-sm font-medium list-none">
                          {t(`tooltip.${selectedKey}.long`)
                            .split('.')
                            .map((item: string) => item.trim())
                            .filter(Boolean)
                            .map((item: string, idx: number) => {
                              const parts = item.split(':');
                              if (parts.length > 1) {
                                return (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-volt shrink-0 mt-1">▪</span>
                                    <span>
                                      <strong className="text-white uppercase tracking-wider text-[11px] md:text-xs">{parts[0].trim()}:</strong>
                                      <span className="text-zinc-300"> {parts.slice(1).join(':').trim()}</span>
                                    </span>
                                  </li>
                                );
                              }
                              return (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-volt shrink-0 mt-1">▪</span>
                                  <span>{item}</span>
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <p className="text-zinc-300 text-xs md:text-sm leading-relaxed pl-4 border-l border-zinc-800 font-medium">
                          {t(`tooltip.${selectedKey}.long`)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Close button action */}
                  <div className="pt-4">
                    <button
                      onClick={() => setSelectedKey(null)}
                      className="w-full btn-secondary py-3.5 text-xs font-black uppercase tracking-widest"
                    >
                      CLOSE DETAILS
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
