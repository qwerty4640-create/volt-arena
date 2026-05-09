import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListOrdered, X, RefreshCw } from 'lucide-react';
import { WorkoutSession } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { getExerciseName } from '../utils/workoutUtils';
import { getWarmupForLift, COOL_DOWN_ROUTINE } from '../data/warmupLibrary';
import { Portal } from './Portal';

interface MissionBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
  onSwapExercise?: (index: number) => void;
  isLifting?: boolean;
  calibration?: any;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  isOpen,
  onClose,
  session,
  onSwapExercise,
  isLifting = false,
  calibration = { isRedline: false }
}) => {
  const { t, unit } = useSettings();
  const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

  if (!session) return null;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-void/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl h-[85vh] glass-panel border-volt/30 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[9999] bg-zinc-950"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-volt/10 border border-volt/20 flex items-center justify-center text-volt">
                    <ListOrdered size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">Mission Details</h2>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">{session.title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="space-y-12">
                  {/* Warm-up Section */}
                  {session.exercises?.[0] && (
                    <div className="space-y-6">
                      <div className="flex items-baseline gap-3 border-b border-white/10 pb-2">
                        <h3 className="font-headline text-lg font-black uppercase italic tracking-tight text-volt">
                          0. Warm-Up: {getWarmupForLift(session.exercises[0].name).title}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {getWarmupForLift(session.exercises[0].name).items.map((item) => (
                          <div key={item.id} className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50 group">
                            <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-6 bg-volt" />
                                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                                    {item.name}
                                  </h4>
                                </div>
                                <div className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                  {item.durationMinutes}m
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-black text-volt uppercase tracking-[0.2em]">Summary</p>
                                  <p className="text-zinc-200 text-sm leading-relaxed font-medium pl-4 border-l border-volt/20">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Exercises Section */}
                  <div className="grid grid-cols-1 gap-6">
                    {session.exercises?.map((ex, exIdx) => (
                      <div key={ex.id || exIdx} className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50 group">
                        <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-6 bg-volt" />
                              <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                                {getExerciseName(ex, t)}
                              </h4>
                            </div>
                            {onSwapExercise && (
                              <button
                                onClick={() => onSwapExercise(exIdx)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-volt hover:border-volt/30 transition-all"
                              >
                                <RefreshCw size={10} />
                                Swap
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-black text-volt uppercase tracking-[0.2em]">Mission Protocol</p>
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pl-4 border-l border-volt/20">
                                {ex.sets?.map((set, sIdx) => {
                                  const w = parseFloat(set.weight) || 0;
                                  const displayWeight = !isLifting && calibration.isRedline
                                    ? Math.round((w * 0.75) / 5) * 5
                                    : w;

                                  return (
                                    <div key={set.id || sIdx} className="bg-void/40 border border-white/5 p-3 flex flex-col items-center justify-center">
                                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Set {sIdx + 1}</span>
                                      <span className="text-[10px] sm:text-xs font-black text-white">{set.reps} Reps</span>
                                      <span className="text-[8px] sm:text-[10px] font-black text-volt">{displayWeight}{weightUnit}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cool-down Section */}
                  <div className="space-y-6">
                    <div className="flex items-baseline gap-3 border-b border-white/10 pb-2">
                      <h3 className="font-headline text-lg font-black uppercase italic tracking-tight text-zinc-500">
                        {(session.exercises?.length || 0) + 1}. Cool-Down Protocol
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 opacity-70">
                      {COOL_DOWN_ROUTINE.items.map((item) => (
                        <div key={item.id} className="relative p-3 md:p-6 glass-panel border-white/5 hover:border-volt/30 transition-all duration-300 bg-void/50 group">
                          <div className="absolute inset-0 bg-volt/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-2" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-zinc-500" />
                                <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">
                                  {item.name}
                                </h4>
                              </div>
                              <div className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                {item.durationMinutes}m
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Summary</p>
                                <p className="text-zinc-400 text-sm leading-relaxed font-medium pl-4 border-l border-zinc-800">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-void/50 flex justify-end">
                <button
                  onClick={onClose}
                  className="btn-secondary w-full py-4 uppercase flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Close Briefing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
