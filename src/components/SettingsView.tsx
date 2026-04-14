import React from 'react';
import { motion } from 'motion/react';
import { Settings, Globe, Scale, CheckCircle2, Terminal, Mic, MicOff, Eye, Box, Zap, Trash2, Loader2, AlertTriangle, Power, Target, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings, TrainingGoal } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { ConfirmationModal } from './ConfirmationModal';

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: 'Mandarin (中文)' },
  { id: 'ko', label: 'Korean (한국어)' },
  { id: 'ja', label: 'Japanese (日本語)' },
  { id: 'es', label: 'Spanish (Español)' },
  { id: 'hi', label: 'Hindi (हिन्दी)' },
  { id: 'nl', label: 'Dutch (Nederlands)' },
] as const;

const UNITS = [
  { id: 'imperial', label: 'Imperial (lbs, in)' },
  { id: 'metric', label: 'Metric (kg, cm)' },
] as const;

export const SettingsView = ({ onExit }: { onExit?: () => void }) => {
  const { 
    language, setLanguage, 
    unit, setUnit, 
    isVoiceActive, setIsVoiceActive,
    immersionMode, setImmersionMode,
    showExperimentalMenus, setShowExperimentalMenus,
    experimentalFeatures, setExperimentalFeatures,
    profile, updateProfile,
    t 
  } = useSettings();
  const { mockWorkoutCount, setMockWorkoutCount, history, resetProgress, resetProgram } = useWorkout();
  const [isResetting, setIsResetting] = React.useState(false);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showResetProgramConfirm, setShowResetProgramConfirm] = React.useState(false);

  const currentCount = mockWorkoutCount !== null ? mockWorkoutCount : (history?.length || 0);

  const handleReset = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    await resetProgress();
    setIsResetting(false);
  };

  const handleResetProgram = async () => {
    setShowResetProgramConfirm(false);
    setIsResetting(true);
    await resetProgram();
    setIsResetting(false);
  };

  return (
    <div className="w-full max-w-7xl space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 bg-volt/10 flex items-center justify-center text-volt">
          <Settings size={32} />
        </div>
        <div>
          <h2 className="font-headline text-4xl font-black uppercase italic tracking-tight text-white">{t('settings.title')}</h2>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Language Settings */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel p-8 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-volt" size={24} />
            <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-widest text-white">{t('settings.language')}</h3>
          </div>
          <div className="flex flex-col gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={cn(
                  "flex items-center justify-between p-4 border-none transition-all",
                  language === lang.id 
                    ? "bg-volt/10 text-white" 
                    : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <span className="font-headline text-sm font-black uppercase tracking-widest">{lang.label}</span>
                {language === lang.id && <CheckCircle2 size={18} className="text-volt" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Unit Settings */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8">
            <Scale className="text-volt" size={24} />
            <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-widest text-white">{t('settings.unit')}</h3>
          </div>
          <div className="flex flex-col gap-3">
            {UNITS.map(u => (
              <button
                key={u.id}
                onClick={() => setUnit(u.id)}
                className={cn(
                  "flex items-center justify-between p-4 border-none transition-all",
                  unit === u.id 
                    ? "bg-volt/10 text-white" 
                    : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <span className="font-headline text-sm font-black uppercase tracking-widest">{t(`settings.${u.id}`)}</span>
                {unit === u.id && <CheckCircle2 size={18} className="text-volt" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Experience Settings */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-8 flex flex-col md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-8">
            <Zap className="text-volt" size={24} />
            <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-widest text-white">Experience & Interface</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voice Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="text-volt" size={18} />
                <span className="font-headline text-xs font-black uppercase tracking-widest text-zinc-400">Voice Control</span>
              </div>
              <button
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                className={cn(
                  "w-full flex items-center justify-between p-4 border-none transition-all",
                  isVoiceActive 
                    ? "bg-volt/10 text-white" 
                    : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  {isVoiceActive ? <Mic size={18} className="text-volt" /> : <MicOff size={18} />}
                  <span className="font-headline text-sm font-black uppercase tracking-widest">
                    {isVoiceActive ? "Voice Enabled" : "Voice Disabled"}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-5 relative transition-colors duration-300",
                  isVoiceActive ? "bg-volt" : "bg-zinc-700"
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white transition-all duration-300",
                    isVoiceActive ? "left-6" : "left-1"
                  )} />
                </div>
              </button>
            </div>

            {/* Immersion Mode */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="text-volt" size={18} />
                <span className="font-headline text-xs font-black uppercase tracking-widest text-zinc-400">Visualization Mode</span>
              </div>
              <div className="flex gap-3">
                {[
                  { id: 'immersive', label: 'Immersive', icon: Box },
                  { id: 'ar', label: 'AR View', icon: Eye }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setImmersionMode(mode.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 p-4 border-none transition-all",
                      immersionMode === mode.id 
                        ? "bg-volt/10 text-white" 
                        : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    )}
                  >
                    <mode.icon size={18} className={immersionMode === mode.id ? "text-volt" : ""} />
                    <span className="font-headline text-sm font-black uppercase tracking-widest">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Program Management */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="glass-panel p-8 flex flex-col md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-8">
            <Target className="text-volt" size={24} />
            <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-widest text-white">Program Management</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest">Reset Current Program</p>
              <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                Restart your training cycle from Week 1. Your lifting history and tier level will be preserved.
              </p>
            </div>
            <button
              onClick={() => setShowResetProgramConfirm(true)}
              className="flex items-center gap-2 px-8 py-4 border-none bg-crimson text-void font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all"
            >
              <RotateCcw size={14} />
              <span>Reset Program</span>
            </button>
          </div>
        </motion.div>

        {/* System Operations */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 flex flex-col md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-8">
            <Settings className="text-volt" size={24} />
            <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-widest text-white">System Operations</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest">Account Session</p>
              <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                Sign out of your account and end the current session
              </p>
            </div>
            <button
              onClick={onExit}
              className="flex items-center gap-2 px-8 py-4 border-none bg-crimson text-void font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all"
            >
              <Power size={14} />
              <span>{t('nav.closeApp')}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Developer Tools */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-8 border-none"
      >
        <div className="flex items-center gap-3 mb-8">
          <Terminal className="text-volt" size={24} />
          <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-widest text-white">Developer Tools</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Manual User Level Override</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-volt shadow-[0_0_10px_var(--primary-glow)]" />
                <span className="text-[8px] font-black uppercase tracking-widest text-volt">Theme Sync Active</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: 'Reset (Auto)', value: null, color: 'text-zinc-500' },
                { label: 'Untrained', value: 0, color: 'text-volt' },
                { label: 'Novice', value: 10, color: 'text-volt' },
                { label: 'Intermediate', value: 25, color: 'text-volt' },
                { label: 'Advanced', value: 40, color: 'text-[#FFD700]' },
                { label: 'Elite', value: 60, color: 'text-[#A855F7]' },
              ].map((tier) => (
                <button
                  key={tier.label}
                  onClick={() => setMockWorkoutCount(tier.value)}
                  className={cn(
                    "p-4 border-none transition-all font-headline text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2",
                    (mockWorkoutCount === tier.value)
                      ? "bg-volt/10 text-white ring-1 ring-volt/30" 
                      : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <span className={cn("text-[8px]", tier.color)}>●</span>
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-volt/5 border-none">
            <p className="text-volt text-[10px] font-black uppercase tracking-widest">
              Current Effective Workout Count: <span className="text-white ml-2">{currentCount}</span>
            </p>
            <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
              {mockWorkoutCount !== null ? "Using manual override" : "Using actual history"}
            </p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-black uppercase tracking-widest">Experimental Features</p>
                <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                  Enable drag-and-drop, module removal, and widget library on Dashboard
                </p>
              </div>
              <button
                onClick={() => setExperimentalFeatures(!experimentalFeatures)}
                className={cn(
                  "w-12 h-6 relative transition-colors duration-300",
                  experimentalFeatures ? "bg-volt" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white transition-all duration-300",
                  experimentalFeatures ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-black uppercase tracking-widest">Experimental Menus</p>
                <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                  Show/Hide the Competition module
                </p>
              </div>
              <button
                onClick={() => setShowExperimentalMenus(!showExperimentalMenus)}
                className={cn(
                  "w-12 h-6 relative transition-colors duration-300",
                  showExperimentalMenus ? "bg-volt" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white transition-all duration-300",
                  showExperimentalMenus ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-crimson text-xs font-black uppercase tracking-widest">Reset Lifting Progress</p>
                <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                  Permanently delete all workout history and reset training blocks
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isResetting}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 border-none bg-crimson text-void font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all",
                  isResetting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isResetting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Reset Progress</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={showResetProgramConfirm}
        title="Reset Training Program"
        message="Are you sure you want to restart your training cycle from Week 1? Your workout history and strength levels will be kept, but your current progress in the block will be reset."
        confirmLabel="Reset Program"
        cancelLabel="Keep Current"
        onConfirm={handleResetProgram}
        onCancel={() => setShowResetProgramConfirm(false)}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showResetConfirm}
        title="Reset Progress"
        message="Are you sure you want to reset all workout history and training blocks? This action is permanent and cannot be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Progress"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        variant="danger"
      />
    </div>
  );
};
