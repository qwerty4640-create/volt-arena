import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useWorkout, WorkoutSession } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';
import { getBlockForWeek, getPlanFromCustomBlocks, getPlanForDuration, expandPlan } from '../constants/periodization';
import { MissionBriefingModal } from './MissionBriefingModal';

interface UpcomingMissionsViewProps {
  onBack: () => void;
}

export const UpcomingMissionsView: React.FC<UpcomingMissionsViewProps> = ({ onBack }) => {
  const { history, getWorkoutTemplate } = useWorkout();
  const { t, profile } = useSettings();
  const [selectedMission, setSelectedMission] = useState<WorkoutSession | null>(null);
  const [viewState, setViewState] = useState<{
    level: 'blocks' | 'phases' | 'missions';
    blockIndex: number | null;
    phaseIndex: number | null;
  }>({ level: 'blocks', blockIndex: null, phaseIndex: null });

  const missionsPerWeek = profile?.trainingFrequency || 3;
  const missionPeriod = profile?.missionPeriod || '3M';
  const cycleWeeks = typeof missionPeriod === 'string' ? (parseInt(missionPeriod) || 3) * 4 : missionPeriod * 4;
  const trainingGoal = profile?.trainingGoal || 'powerbuilding';
  const customBlocks = profile?.customProgramBlocks || [];

  // 1. Generate Hierarchical Data
  const topLevelPlan = customBlocks.length > 0 
    ? getPlanFromCustomBlocks(customBlocks)
    : getPlanForDuration(cycleWeeks, trainingGoal);

  const hierarchy = topLevelPlan.map((block, bIdx) => {
    // Expand this block specifically to get phases
    const phases = customBlocks.length > 0 ? [block] : expandPlan([block]);
    
    return {
      label: block.label,
      type: block.type,
      totalWeeks: block.durationWeeks,
      phases: phases.map((phase, pIdx) => {
        return {
          label: phase.label,
          type: phase.type,
          durationWeeks: phase.durationWeeks,
          // We need to calculate the absolute week offset for this phase
          // to correctly identify mission numbers and which missions are completed
          phaseStartWeekOffset: topLevelPlan.slice(0, bIdx).reduce((acc, b) => acc + b.durationWeeks, 0) + 
                               phases.slice(0, pIdx).reduce((acc, p) => acc + p.durationWeeks, 0)
        };
      })
    };
  });

  const handleBack = () => {
    if (viewState.level === 'missions') {
      setViewState(prev => ({ ...prev, level: 'phases', phaseIndex: null }));
    } else if (viewState.level === 'phases') {
      setViewState(prev => ({ ...prev, level: 'blocks', blockIndex: null }));
    } else {
      onBack();
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = ['Upcoming Cycle'];
    if (viewState.blockIndex !== null) crumbs.push(hierarchy[viewState.blockIndex].label);
    if (viewState.phaseIndex !== null && viewState.blockIndex !== null) {
      crumbs.push(hierarchy[viewState.blockIndex].phases[viewState.phaseIndex].label.split(' - ').pop() || '');
    }
    return crumbs.join(' / ');
  };

  return (
    <div className="flex flex-col min-h-full w-full max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-20">
      <header className="mb-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {viewState.level === 'blocks' ? 'Back to Mission' : 'Go Back'}
          </span>
        </button>
        <div className="flex flex-col mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">{getBreadcrumbs()}</span>
          <h1 className="font-headline text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
            {viewState.level === 'blocks' && <>Current <span className="text-volt">Strategy</span></>}
            {viewState.level === 'phases' && <>Operational <span className="text-volt">Phases</span></>}
            {viewState.level === 'missions' && <>Mission <span className="text-volt">Deployment</span></>}
          </h1>
        </div>
        <p className="text-zinc-500 text-sm font-medium max-w-xl">
          {viewState.level === 'blocks' && "View the high-level program blocks defining your current multi-month training cycle."}
          {viewState.level === 'phases' && `Drilling down into the specific tactical phases for the ${hierarchy[viewState.blockIndex!]?.label} block.`}
          {viewState.level === 'missions' && "Individual mission logistics and performance prescriptions for this operational phase."}
        </p>
      </header>

      {/* Level 1: Blocks */}
      {viewState.level === 'blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hierarchy.map((block, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setViewState({ level: 'phases', blockIndex: i, phaseIndex: null })}
              className="glass-panel p-6 bg-void/50 border border-white/5 group hover:border-volt/30 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="px-3 py-1 bg-zinc-900 border border-white/10">
                  <span className="text-[10px] font-black tracking-widest text-volt uppercase italic">Block #0{i + 1}</span>
                </div>
                <div className="w-10 h-10 border border-white/5 flex items-center justify-center bg-zinc-900 group-hover:border-volt/30 transition-colors">
                  <ArrowRight size={18} className="text-zinc-600 group-hover:text-volt transition-colors" />
                </div>
              </div>

              <h3 className="font-headline text-3xl font-black uppercase italic tracking-tight text-white mb-2">{block.label}</h3>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-xs font-black text-zinc-300 uppercase italic">{block.totalWeeks} Weeks</p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Tactical Sub-systems</p>
                  <p className="text-xs font-black text-zinc-300 uppercase italic">{block.phases.length} Phases</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Level 2: Phases */}
      {viewState.level === 'phases' && viewState.blockIndex !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hierarchy[viewState.blockIndex].phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setViewState(prev => ({ ...prev, level: 'missions', phaseIndex: i }))}
              className="glass-panel p-6 bg-void/50 border border-white/5 group hover:border-volt/30 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="px-3 py-1 bg-zinc-900 border border-white/10 uppercase italic">
                  <span className="text-[10px] font-black tracking-widest text-volt uppercase">Phase #0{i + 1}</span>
                </div>
                <div className="w-10 h-10 border border-white/5 flex items-center justify-center bg-zinc-900 group-hover:border-volt/30 transition-colors">
                  <ArrowRight size={18} className="text-zinc-600 group-hover:text-volt transition-colors" />
                </div>
              </div>

              <h3 className="font-headline text-2xl font-black uppercase italic tracking-tight text-white mb-2">
                {phase.label.split(' - ').pop()}
              </h3>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Window</p>
                  <p className="text-xs font-black text-zinc-300 uppercase italic">{phase.durationWeeks} Weeks</p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Engagements</p>
                  <p className="text-xs font-black text-zinc-300 uppercase italic">{phase.durationWeeks * missionsPerWeek} Missions</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Level 3: Missions */}
      {viewState.level === 'missions' && viewState.blockIndex !== null && viewState.phaseIndex !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: hierarchy[viewState.blockIndex].phases[viewState.phaseIndex].durationWeeks * missionsPerWeek }).map((_, i) => {
            const phase = hierarchy[viewState.blockIndex!].phases[viewState.phaseIndex!];
            const missionIdxInPhase = i;
            const weekInPhase = Math.floor(missionIdxInPhase / missionsPerWeek) + 1;
            const dayInWeek = (missionIdxInPhase % missionsPerWeek) + 1;
            const absoluteWeek = phase.phaseStartWeekOffset + weekInPhase;
            const absoluteMissionNum = (absoluteWeek - 1) * missionsPerWeek + dayInWeek;

            const blockForThisMission = profile ? getBlockForWeek(
              absoluteWeek, 
              missionPeriod, 
              trainingGoal, 
              customBlocks
            ) : null;
            
            const intensity = (blockForThisMission && blockForThisMission.block) 
              ? Math.round((blockForThisMission.block.baseIntensity + ((blockForThisMission.weekInBlock - 1) * blockForThisMission.block.intensityIncrementPerWeek)) * 100) 
              : 0;

            const isCompleted = absoluteMissionNum <= (history?.length || 0);

            return (
              <motion.div
                key={absoluteMissionNum}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedMission(getWorkoutTemplate(absoluteWeek, dayInWeek))}
                className={`glass-panel p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isCompleted ? 'bg-zinc-900/50 border-white/5 opacity-50 grayscale' : 'bg-void/50 border-white/5 group hover:border-volt/30'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-widest text-volt uppercase leading-none mb-1">Mission #{absoluteMissionNum}</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Week {absoluteWeek} | Day {dayInWeek}</span>
                    </div>
                    {isCompleted ? (
                      <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20">
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Completed</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 border border-white/5 flex items-center justify-center bg-zinc-900 group-hover:border-volt/30 transition-colors">
                        <ArrowRight size={14} className="text-zinc-600 group-hover:text-volt transition-colors" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Objective</p>
                      <p className="text-xs font-black text-white uppercase italic tracking-tight">
                        {blockForThisMission?.block.label || 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Prescription</p>
                      <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.1em]">
                        {blockForThisMission?.block.baseSets || 3}x{blockForThisMission?.block.baseReps || '8'} @ {intensity}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <MissionBriefingModal
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        session={selectedMission}
      />
    </div>
  );
};
