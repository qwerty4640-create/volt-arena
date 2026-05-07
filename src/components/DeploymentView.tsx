import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Dumbbell, 
  CheckCircle2, 
  Info, 
  Loader2, 
  Calendar,
  Activity,
  ArrowRight,
  Settings,
  X
} from 'lucide-react';
import { useSettings, TrainingGoal, MissionPeriod, CustomBlock } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';
import { getBlockForWeek, getPlanForDuration } from '../constants/periodization';
import { ProgramDesigner } from './ProgramDesigner';
import { ProgramDetailModal } from './ProgramDetailModal';
import { Portal } from './Portal';
import { ConfirmationModal } from './ConfirmationModal';
import { InfoTooltip } from './InfoTooltip';
import { BlockWidget } from './BlockWidget';

export const DeploymentView = () => {
  const { profile, updateProfile, t } = useSettings();
  const { history, resetProgram } = useWorkout();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showProgramDetail, setShowProgramDetail] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any | null>(null);

  // States for adjustment
  const [adjustingObjectives, setAdjustingObjectives] = useState<TrainingGoal[]>(
    profile?.trainingObjectives || (profile?.trainingGoal ? [profile.trainingGoal] : ['powerbuilding'])
  );
  const [adjustingMissionPeriod, setAdjustingMissionPeriod] = useState<MissionPeriod>(
    profile?.missionPeriod || '3M'
  );
  const [adjustingDuration, setAdjustingDuration] = useState<number>(
    profile?.trainingDurationMonths || 3
  );
  const [adjustingFrequency, setAdjustingFrequency] = useState<number>(
    profile?.trainingFrequency || 3
  );
  const [adjustingCustomProgramBlocks, setAdjustingCustomProgramBlocks] = useState<CustomBlock[]>(
    profile?.customProgramBlocks && profile.customProgramBlocks.length > 0
      ? profile.customProgramBlocks 
      : []
  );
  
  const [isCustomizingProgram, setIsCustomizingProgram] = useState<boolean>(
    profile?.customProgramBlocks && profile.customProgramBlocks.length > 0 ? true : false
  );

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Helper to get max objectives based on period
  const getMaxObjectives = (period: MissionPeriod) => {
    switch (period) {
      case '3M': return 1;
      case '6M': return 2;
      case '9M': return 3;
      case '12M': return 4;
      default: return 1;
    }
  };

  const currentMaxObjectives = getMaxObjectives(adjustingMissionPeriod);

  const getRankLabel = (index: number) => {
    const labels = ['Primary', 'Secondary', 'Tertiary', 'Quaternary'];
    return labels[index] || `${index + 1}th`;
  };

  // Helper to get default blocks for a goal
  const getDefaultBlocks = (goals: TrainingGoal[], period: MissionPeriod): CustomBlock[] => {
    const weeks = (parseInt(period) || 3) * 4;
    const plan = getPlanForDuration(weeks, goals);
    return plan.map(b => ({
      id: Math.random().toString(36).substr(2, 9),
      type: b.type,
      durationWeeks: b.durationWeeks
    }));
  };

  // Sync states if profile changes
  useEffect(() => {
    if (profile) {
      setAdjustingObjectives(profile.trainingObjectives || (profile.trainingGoal ? [profile.trainingGoal] : ['powerbuilding']));
      setAdjustingMissionPeriod(profile.missionPeriod || '3M');
      setAdjustingDuration(profile.trainingDurationMonths || 3);
      setAdjustingFrequency(profile.trainingFrequency || 3);
      
      if (profile.customProgramBlocks && profile.customProgramBlocks.length > 0) {
        setAdjustingCustomProgramBlocks(profile.customProgramBlocks);
        setIsCustomizingProgram(true);
      } else {
        // Pre-populate with defaults based on current goal
        const goals = profile.trainingObjectives || (profile.trainingGoal ? [profile.trainingGoal] : ['powerbuilding']);
        setAdjustingCustomProgramBlocks(getDefaultBlocks(goals, profile.missionPeriod || '3M'));
        setIsCustomizingProgram(false);
      }
    }
  }, [profile]);

  const handleAdjustProtocol = () => {
    if (!profile || !hasChanges) return;
    setShowConfirmationModal(true);
  };

  const commitAdjustProtocol = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Calculate new competition date based on duration from now
      const newCompetitionDate = Date.now() + (adjustingDuration * 30 * 24 * 60 * 60 * 1000);

      // If duration or goals changed, we reset the program cycle
      const objectivesChanged = JSON.stringify(adjustingObjectives) !== JSON.stringify(profile.trainingObjectives || (profile.trainingGoal ? [profile.trainingGoal] : ['powerbuilding']));
      if (adjustingDuration !== profile.trainingDurationMonths || objectivesChanged) {
        await resetProgram();
      }

      await updateProfile({
        trainingDurationMonths: adjustingDuration,
        missionPeriod: adjustingMissionPeriod,
        customProgramBlocks: isCustomizingProgram ? adjustingCustomProgramBlocks : [],
        trainingFrequency: adjustingFrequency,
        trainingGoal: adjustingObjectives[0] || 'powerbuilding',
        trainingObjectives: adjustingObjectives,
        competitionDate: newCompetitionDate,
        trainingWeekOffset: 0
      });
      showToast(t('toast.actionSuccessful'), 3000, 'success');
      setShowConfirmationModal(false);
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Failed to adjust protocol:", error);
      showToast(t('common.error'), 3000, 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentWeek = history ? Math.floor(history.length / (profile?.trainingFrequency || 3)) : 0;
  const currentBlock = profile ? getBlockForWeek(currentWeek, profile.missionPeriod || '3M', profile.trainingGoal || 'powerbuilding', profile.customProgramBlocks || []) : null;

  const hasChanges = profile && (
    adjustingMissionPeriod !== (profile.missionPeriod || '3M') ||
    adjustingFrequency !== (profile.trainingFrequency || 3) ||
    isCustomizingProgram !== (!!profile.customProgramBlocks && profile.customProgramBlocks.length > 0) ||
    (isCustomizingProgram && JSON.stringify(adjustingCustomProgramBlocks) !== JSON.stringify(profile.customProgramBlocks || [])) ||
    JSON.stringify(adjustingObjectives) !== JSON.stringify(profile.trainingObjectives || (profile.trainingGoal ? [profile.trainingGoal] : ['powerbuilding']))
  );

  return (
    <div className="w-full space-y-8 pb-24 pt-4 md:pt-8">


      <div className="w-full">
        <BlockWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Widget 1: Deployment Status */}
        <div className="glass-panel px-4 py-4 md:p-4 border-white/5 bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <h2 className="font-sans text-xl font-black uppercase italic tracking-tight text-white mb-2">
              Deployment Status
            </h2>
            <p className="text-xs text-zinc-500 mb-8 font-medium">
              See your deployment details and progression over time.
            </p>

            <div className="space-y-6">
              <div className="flex flex-col items-start py-3 border-b border-white/5 gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Current Deployment Plan</span>
                <span className="text-xs font-black uppercase tracking-widest text-white mt-0.5">
                  {(profile?.trainingObjectives && profile.trainingObjectives.length > 0) 
                    ? profile.trainingObjectives.map(g => t(`goal.${g}`)).join(' + ')
                    : t(`goal.${profile?.trainingGoal || 'powerbuilding'}`)}
                </span>
              </div>
              <div className="flex flex-col items-start py-3 border-b border-white/5 gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Current Block</span>
                <span className="text-xs font-black uppercase tracking-widest text-volt mt-0.5">{currentBlock?.block.label || 'Loading...'}</span>
              </div>
              <div className="flex flex-col items-start py-3 border-b border-white/5 gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Mission Frequency</span>
                <span className="text-xs font-black uppercase tracking-widest text-white mt-0.5">{profile?.trainingFrequency || 3}x Sessions / Week</span>
              </div>
              <div className="flex flex-col items-start py-3 border-b border-white/5 mb-8 gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Mission Period</span>
                <span className="text-xs font-black uppercase tracking-widest text-white mt-0.5">{profile?.missionPeriod || '3M'} Horizon</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-volt text-void font-headline text-xs font-black uppercase tracking-widest transition-all hover:bg-white"
          >
            <Settings size={16} />
            <span>Configure Deployment</span>
          </button>
        </div>

        {/* Widget 2: Upcoming Missions */}
        <div className="glass-panel px-4 py-4 md:p-4 border-white/5 bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <h2 className="font-sans text-xl font-black uppercase italic tracking-tight text-white mb-2">
              Upcoming missions
            </h2>
            <p className="text-xs text-zinc-500 mb-8 font-medium">
              Preview upcoming mission details before next mission. Mission details can be changed depending on individual deployment progression.
            </p>

            <div className="space-y-3 mb-8">
              {[0, 1, 2].map((i) => {
                const missionNum = (history?.length || 0) + i + 1;
                const weekForThisMission = Math.floor((missionNum - 1) / (profile?.trainingFrequency || 3)) + 1;
                const blockForThisMission = profile ? getBlockForWeek(weekForThisMission, profile.missionPeriod || '3M', profile.trainingGoal || 'powerbuilding', profile.customProgramBlocks || []) : null;
                const intensity = blockForThisMission ? Math.round((blockForThisMission.block.baseIntensity + (blockForThisMission.weekInBlock * blockForThisMission.block.intensityIncrementPerWeek)) * 100) : 0;

                const missionDetails = {
                    missionNum,
                    weekForThisMission,
                    block: blockForThisMission?.block,
                    intensity,
                    weekInBlock: blockForThisMission?.weekInBlock
                };

                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedMission(missionDetails)}
                    className="p-4 bg-void/50 border border-white/5 group hover:border-volt/30 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black tracking-widest text-volt uppercase leading-none">Mission #{missionNum}</span>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Week {weekForThisMission}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-none mb-1">
                          Objective: {blockForThisMission?.block.label || 'TBD'}
                        </p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                          {blockForThisMission?.block.baseSets || 3}x{blockForThisMission?.block.baseReps || '8'} @ {intensity}% Load
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} className="text-volt" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowProgramDetail(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-800 border border-white/5 text-white font-headline text-xs font-black uppercase tracking-widest transition-all hover:bg-zinc-700"
          >
            <span>View Full Details</span>
          </button>
        </div>
      </div>

      {/* Deployment Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettingsModal(false)}
                className="absolute inset-0 bg-void/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden glass-panel border-volt/30 flex flex-col bg-zinc-950 shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-void/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-volt/10 text-volt border border-volt/20">
                      <Settings size={20} />
                    </div>
                    <div>
                      <h2 className="font-sans text-xl font-black uppercase italic tracking-tight text-white">Deployment Setting</h2>
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Recalibrate Program Architecture</p>
                    </div>
                  </div>
                </div>
  
                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Direct Inputs */}
                    <div className="lg:col-span-4 space-y-10">
                      {/* Mission Period */}
                      <section className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Deployment Period</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['3M', '6M', '9M', '12M'] as MissionPeriod[]).map((m) => (
                            <button
                              key={m}
                              onClick={() => {
                                const newMax = getMaxObjectives(m);
                                let newObjs = [...adjustingObjectives];
                                if (newObjs.length > newMax) {
                                  newObjs = newObjs.slice(0, newMax);
                                }
                                setAdjustingMissionPeriod(m);
                                setAdjustingDuration(parseInt(m));
                                if (newObjs.length !== adjustingObjectives.length) {
                                  setAdjustingObjectives(newObjs);
                                }
                                setAdjustingCustomProgramBlocks(getDefaultBlocks(newObjs, m));
                              }}
                              className={cn(
                                "py-3 border-none font-sans text-xs font-bold uppercase tracking-widest transition-all",
                                adjustingMissionPeriod === m 
                                  ? "bg-volt text-void shadow-[0_0_15px_var(--primary-glow)]" 
                                  : "bg-surface-variant text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* Training Frequency */}
                      <section className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Mission Frequency</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[3, 4, 5, 6, 7].map((f) => (
                            <button
                              key={f}
                              onClick={() => setAdjustingFrequency(f)}
                              className={cn(
                                "py-3 border-none font-sans text-[10px] font-bold uppercase tracking-widest transition-all",
                                adjustingFrequency === f 
                                  ? "bg-volt text-void shadow-[0_0_15px_var(--primary-glow)]" 
                                  : "bg-surface-variant text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* Objectives Selection */}
                      <section className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">Deployment Objectives <InfoTooltip term="DeploymentObjectives" /></label>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                            {adjustingObjectives.length} / {currentMaxObjectives} SELECTED
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['pure_strength', 'powerbuilding', 'hypertrophy', 'longevity', 'tactical', 'explosiveness', 'endurance', 'prehab'] as TrainingGoal[]).map(goal => {
                            const goalIndex = adjustingObjectives.indexOf(goal);
                            const isSelected = goalIndex !== -1;
                            const isDisabled = adjustingMissionPeriod === '3M' && !isSelected && adjustingObjectives.length >= 1;
                            return (
                              <button
                                key={goal}
                                disabled={isDisabled}
                                onClick={() => {
                                  let newObjectives = [...adjustingObjectives];
                                  if (isSelected) {
                                    if (newObjectives.length > 1) {
                                      newObjectives = newObjectives.filter(g => g !== goal);
                                    }
                                  } else {
                                    if (newObjectives.length < currentMaxObjectives) {
                                      newObjectives.push(goal);
                                    }
                                  }
                                  setAdjustingObjectives(newObjectives);
                                  setAdjustingCustomProgramBlocks(getDefaultBlocks(newObjectives, adjustingMissionPeriod));
                                }}
                                className={cn(
                                  "p-3 border-none transition-all text-center relative group min-h-[52px] flex flex-col items-center justify-center gap-0.5",
                                  isSelected
                                    ? "bg-volt/10 text-white ring-1 ring-volt/30"
                                    : "bg-surface-variant text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                                  isDisabled && "opacity-50 cursor-not-allowed hover:bg-surface-variant hover:text-zinc-500"
                                )}
                              >
                                <span className={cn(
                                  "font-sans text-[9px] font-bold uppercase tracking-widest transition-colors",
                                  isSelected ? "text-white" : "text-zinc-500"
                                )}>
                                  {t(`goal.${goal}`)}
                                </span>
                                {isSelected && (
                                  <>
                                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-volt mt-0.5 leading-none">
                                      {getRankLabel(goalIndex)}
                                    </span>
                                    <div className="absolute top-1 right-1">
                                      <CheckCircle2 size={7} className="text-volt" />
                                    </div>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    </div>
  
                    {/* Right Column: Timeline Designer */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-col items-start gap-2">
                          <h3 className="font-sans text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            Strategic Timeline Designer
                          </h3>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => {
                                setIsCustomizingProgram(!isCustomizingProgram);
                                if (!isCustomizingProgram) {
                                  // When turning ON, populate with current default or existing
                                  if (adjustingCustomProgramBlocks.length === 0) {
                                    setAdjustingCustomProgramBlocks(getDefaultBlocks(adjustingObjectives, adjustingMissionPeriod));
                                  }
                                }
                              }}
                              className={cn(
                                "text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 px-3 py-1.5 border",
                                isCustomizingProgram 
                                  ? "bg-volt/10 text-volt border-volt/30" 
                                  : "bg-void hover:bg-white/5 text-zinc-500 border-white/10"
                              )}
                            >
                              <div className={cn("w-1.5 h-1.5 rounded-full", isCustomizingProgram ? "bg-volt shadow-[0_0_8px_var(--primary-glow)]" : "bg-zinc-600")} />
                              {isCustomizingProgram ? "Disable Customization" : "Enable Customization"}
                            </button>
                            {isCustomizingProgram && (
                              <button 
                                onClick={() => setAdjustingCustomProgramBlocks(getDefaultBlocks(adjustingObjectives, adjustingMissionPeriod))}
                                className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                              >
                                <Loader2 size={10} className={loading ? "animate-spin" : ""} />
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className={cn(
                          "bg-void/50 rounded-none transition-all duration-500",
                          !isCustomizingProgram && "opacity-75 pointer-events-none select-none"
                        )}>
                          <ProgramDesigner 
                            missionPeriod={adjustingMissionPeriod}
                            onUpdate={setAdjustingCustomProgramBlocks}
                            initialBlocks={isCustomizingProgram ? adjustingCustomProgramBlocks : getDefaultBlocks(adjustingObjectives, adjustingMissionPeriod)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Modal Footer */}
                <div className="p-6 md:p-8 border-t border-white/5 bg-void/50">
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      className="flex-1 btn-secondary py-4"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleAdjustProtocol}
                      disabled={loading || !hasChanges}
                      className="flex-1 btn-primary py-4 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <Zap size={16} />
                          <span>Recalibrate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      <ProgramDetailModal 
        isOpen={showProgramDetail} 
        onClose={() => setShowProgramDetail(false)}
        initialDuration={profile?.trainingDurationMonths || 3}
        customProgramBlocks={adjustingCustomProgramBlocks}
      />

      {/* Mission Detail Modal */}
      <AnimatePresence>
        {selectedMission && (
          <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMission(null)}
                className="fixed inset-0 bg-void/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-panel border-volt/30 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-void/50">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-volt uppercase leading-none">Mission Dossier</span>
                    <h3 className="font-sans text-2xl font-black uppercase italic tracking-tight text-white mt-1">Mission #{selectedMission.missionNum}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedMission(null)}
                    className="p-2 bg-white/5 text-zinc-500 hover:text-white transition-all hover:bg-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Timeline</span>
                    <span className="text-sm font-black text-white uppercase text-right">Week {selectedMission.weekForThisMission}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Objective</span>
                    <span className="text-sm font-black text-volt uppercase italic text-right">{selectedMission.block?.label || 'TBD'}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Prescription</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">{selectedMission.block?.baseSets || 3} SETS × {selectedMission.block?.baseReps || '8'} REPS</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base Target</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Load Intensity</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-volt uppercase italic block">{selectedMission.intensity}%</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">of 1RM Focus</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Block Progress</span>
                    <span className="text-sm font-black text-white uppercase text-right">Wk {selectedMission.weekInBlock} / {selectedMission.block?.durationWeeks}</span>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-void/50 flex justify-end">
                  <button
                    onClick={() => setSelectedMission(null)}
                    className="btn-primary w-full py-4 tracking-[0.2em]"
                  >
                    ACKNOWLEDGE
                  </button>
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      <Portal>
        <ConfirmationModal
          isOpen={showConfirmationModal}
          title="Recalibrate Protocol"
          message="Adjusting your protocol will recalibrate your training cycle. History and PRs are always preserved. Changing duration or objectives will restart your cycle from week 1."
          confirmLabel="Recalibrate"
          cancelLabel="Cancel"
          onConfirm={commitAdjustProtocol}
          onCancel={() => setShowConfirmationModal(false)}
          variant="danger"
        />
      </Portal>
    </div>
  );
};
