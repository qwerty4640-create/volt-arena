import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Target, 
  Zap, 
  BarChart3, 
  ChevronRight, 
  Shield, 
  Activity,
  Dumbbell,
  Calendar
} from 'lucide-react';
import { useSettings, CustomBlock } from '../contexts/SettingsContext';
import { BlockType, getPlanFromCustomBlocks, getPlanForDuration, expandPlan } from '../constants/periodization';
import { cn } from '../lib/utils';
import { Portal } from './Portal';

interface ProgramDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionPeriod: string;
  trainingObjectives: string[];
  customProgramBlocks: CustomBlock[];
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  isOpen,
  onClose,
  missionPeriod,
  trainingObjectives,
  customProgramBlocks
}) => {
  const { t, unit } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalWeeks = parseInt(missionPeriod) * 4;
  
  const basicPlan = customProgramBlocks && customProgramBlocks.length > 0
    ? getPlanFromCustomBlocks(customProgramBlocks)
    : getPlanForDuration(totalWeeks, trainingObjectives as any);

  const plan = expandPlan(basicPlan);

  const content = null; // Removed unused content

  if (!mounted) return null;
  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-void/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] glass-panel border-volt/30 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 md:p-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-volt/10 text-volt">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="font-sans text-2xl font-black uppercase italic tracking-tight text-white">Full Protocol Detail</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Comprehensive Mission Roadmap</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/5 text-zinc-500 hover:text-white transition-all hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
  
              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Right: Phase Timeline */}
                  <div className="lg:col-span-12 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                        <Calendar size={12} className="text-volt" /> 
                        Phase Sequence Details
                    </h4>
                    
                    <div className="space-y-4">
                      {Array.isArray(plan) && plan.map((block, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group relative"
                        >
                           <div className="absolute -left-3 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-volt/40 transition-colors" />
                           
                           <div className={cn(
                               "glass-panel p-5 bg-surface-container-lowest border-white/5 flex flex-col md:flex-row items-center gap-6",
                               "hover:border-volt/30 transition-all"
                           )}>
                              {/* Block Type Badge */}
                              <div className="flex-1 flex items-center gap-6">
                                  <div className="w-12 h-12 flex flex-col items-center justify-center border border-white/10 bg-void">
                                      <span className="text-[14px] font-black italic text-white leading-none">{idx + 1}</span>
                                      <span className="text-[7px] font-black text-zinc-500 uppercase">BLOCK</span>
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <h5 className="font-headline text-lg font-black italic text-white uppercase tracking-tight">{block.label || block.type}</h5>
                                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 border border-white/10 px-1.5 py-0.5">
                                              {block.durationWeeks}W
                                          </span>
                                      </div>
                                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">
                                          Intensity Target: {Math.round(block.baseIntensity * 100)}% - {Math.round((block.baseIntensity + (block.intensityIncrementPerWeek * block.durationWeeks)) * 100)}%
                                      </p>
                                  </div>
                              </div>
  
                              {/* Block Specs */}
                              <div className="flex items-center justify-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                  <div className="flex flex-col items-center">
                                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-tighter">REP RANGE</span>
                                      <span className="text-sm font-black italic text-volt">{block.baseReps}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-tighter">SETS</span>
                                      <span className="text-sm font-black italic text-white">{block.baseSets}</span>
                                  </div>
                                  <div className="flex flex-col items-center min-w-[60px]">
                                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-tighter">EFFORT</span>
                                      <div className="flex gap-0.5 mt-1">
                                          {[1,2,3,4,5].map(i => (
                                              <div key={i} className={cn(
                                                  "w-1.5 h-3",
                                                  i <= Math.ceil(block.baseIntensity * 5) ? "bg-volt" : "bg-white/5"
                                              )} />
                                          ))}
                                      </div>
                                  </div>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-void/50 flex justify-end">
                <button
                  onClick={onClose}
                  className="btn-primary px-12 py-3"
                >
                  CLOSE DOSSIER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
