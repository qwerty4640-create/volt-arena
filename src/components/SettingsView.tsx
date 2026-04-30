import React from 'react';
import { motion } from 'motion/react';
import { Settings, Globe, Scale, CheckCircle2, Terminal, Mic, MicOff, Eye, Box, Zap, Trash2, Loader2, AlertTriangle, Power, Target, RotateCcw, Monitor, Sun, Moon, Paintbrush, Book, SunMoon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings, TrainingGoal } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { ConfirmationModal } from './ConfirmationModal';
import { FieldManual } from './FieldManual';

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: 'Mandarin (中文)' },
  { id: 'ko', label: 'Korean (한국어)' },
  { id: 'es', label: 'Spanish (Español)' },
] as const;

const UNITS = [
  { id: 'imperial', label: 'Imperial (LBS, in)' },
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
    theme, setTheme,
    lightColorScheme, setLightColorScheme,
    t
  } = useSettings();
  const { mockWorkoutCount, setMockWorkoutCount, history, resetProgress, resetProgram } = useWorkout();
  const [showFieldManual, setShowFieldManual] = React.useState(false);
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
    <div className="w-full max-w-7xl space-y-6 md:space-y-8 pb-20 pt-8">
      {/* Field Manual - Top Positioned Modal Trigger */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden border border-volt/40 bg-zinc-900/40 shadow-[0_0_30px_rgba(204,255,0,0.06)]"
      >
        <button
          onClick={() => setShowFieldManual(true)}
          className="w-full px-4 py-6 md:p-8 flex items-center justify-between hover:bg-volt/[0.06] transition-all group active:scale-[0.995]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-volt/10 flex items-center justify-center text-volt border border-volt/20 group-hover:border-volt/50 transition-colors">
              <Book size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-sans text-xl italic font-black uppercase tracking-tight text-white group-hover:text-volt transition-colors">{t('settings.fieldManual')}</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1 opacity-80">{t('settings.fieldManualSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 group-hover:text-white transition-colors">
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Open Archive</span>
            {/*...Icon hidden}}<Terminal size={18} />{...*/}
          </div>
        </button>
      </motion.div>

      <FieldManual isOpen={showFieldManual} onClose={() => setShowFieldManual(false)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Theme Settings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="glass-panel px-4 py-6 md:p-8 flex flex-col md:col-span-2 border-b border-white/5"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <SunMoon className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">Visual Output</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Theme Toggle */}
            <div className="space-y-4">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-zinc-500">Interface Theme</span>
              <div className="flex bg-surface-lowest p-1 border border-white/5">
                {(['dark', 'light'] as const).map(tOpt => (
                  <button
                    key={tOpt}
                    onClick={() => setTheme(tOpt)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 transition-colors",
                      theme === tOpt
                        ? "bg-volt text-void font-bold"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {tOpt === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    <span className="font-headline text-xs font-black uppercase tracking-widest">{tOpt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Light Color Scheme */}
            {theme === 'light' && (
              <div className="space-y-4">
                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Scheme (Light Mode)</span>
                <div className="grid grid-cols-1 gap-2">
                  {(['default', 'ocean', 'neon', 'solar', 'monochrome'] as const).map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => setLightColorScheme(scheme)}
                      className={cn(
                        "flex items-center justify-between p-3 transition-all",
                        lightColorScheme === scheme
                          ? "bg-volt/10 text-volt border-l-[3px] border-volt"
                          : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border-l-[3px] border-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Paintbrush size={16} className={lightColorScheme === scheme ? "text-volt" : "text-zinc-500"} />
                        <span className="font-headline text-sm font-black uppercase tracking-widest">{scheme}</span>
                      </div>
                      {lightColorScheme === scheme && <CheckCircle2 size={16} className="text-volt" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel px-4 py-6 md:p-8 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Globe className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.language')}</h3>
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
          className="glass-panel px-4 py-6 md:p-8 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Scale className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.unit')}</h3>
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
        {(profile?.role === 'admin' || profile?.role === 'engineer') && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-panel px-4 py-6 md:p-8 flex flex-col md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <Zap className="text-volt" size={20} />
              <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.experience')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Control */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mic className="text-volt" size={18} />
                  <span className="font-headline text-xs font-black uppercase tracking-widest text-zinc-400">{t('settings.voiceControl')}</span>
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
                      {isVoiceActive ? t('settings.voiceEnabled') : t('settings.voiceDisabled')}
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
                  <span className="font-headline text-xs font-black uppercase tracking-widest text-zinc-400">{t('settings.visualization')}</span>
                </div>
                <div className="flex gap-3">
                  {[
                    { id: 'immersive', label: t('settings.immersive'), icon: Box },
                    { id: 'ar', label: t('settings.arView'), icon: Eye }
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
        )}

        {/* Program Management */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="glass-panel px-4 py-6 md:p-8 flex flex-col md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Target className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.programManagement')}</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest">{t('settings.resetProgram')}</p>
              <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                {t('settings.resetProgramDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowResetProgramConfirm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 btn-destructive font-headline text-[10px] font-black uppercase tracking-widest shrink-0 transition-all rounded"
            >
              <RotateCcw size={14} />
              <span>{t('settings.resetProgramBtn')}</span>
            </button>
          </div>
        </motion.div>

        {/* System Operations */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel px-4 py-6 md:p-8 flex flex-col md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Settings className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.systemOps')}</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest">{t('settings.accountSession')}</p>
              <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                {t('settings.accountSessionDesc')}
              </p>
            </div>
            <button
              onClick={onExit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 btn-destructive font-headline text-[10px] font-black uppercase tracking-widest shrink-0 transition-all rounded"
            >
              <Power size={14} />
              <span>{t('nav.closeApp')}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Developer Tools */}
      {(profile?.role === 'admin' || profile?.role === 'engineer') && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel px-4 py-6 md:p-8 border-none"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Terminal className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.devTools')}</h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{t('settings.manualLevel')}</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-volt shadow-[0_0_10px_var(--primary-glow)]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-volt">{t('settings.themeSync')}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: t('settings.tier.reset'), value: null, color: 'text-zinc-500' },
                  { label: t('settings.tier.untrained'), value: 0, color: 'text-volt' },
                  { label: t('settings.tier.novice'), value: 10, color: 'text-volt' },
                  { label: t('settings.tier.intermediate'), value: 25, color: 'text-volt' },
                  { label: t('settings.tier.advanced'), value: 40, color: 'text-[#FFD700]' },
                  { label: t('settings.tier.elite'), value: 60, color: 'text-[#A855F7]' },
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
                {t('settings.effectiveCount')}: <span className="text-white ml-2">{currentCount}</span>
              </p>
              <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                {mockWorkoutCount !== null ? t('settings.usingManual') : t('settings.usingActual')}
              </p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-xs font-black uppercase tracking-widest">{t('settings.experimentalFeatures')}</p>
                  <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                    {t('settings.experimentalFeaturesDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setExperimentalFeatures(!experimentalFeatures)}
                  className={cn(
                    "w-12 h-6 shrink-0 relative transition-colors duration-300",
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-xs font-black uppercase tracking-widest">{t('settings.experimentalMenus')}</p>
                  <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                    {t('settings.experimentalMenusDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowExperimentalMenus(!showExperimentalMenus)}
                  className={cn(
                    "w-12 h-6 shrink-0 relative transition-colors duration-300",
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-crimson text-xs font-black uppercase tracking-widest">{t('settings.resetProgress')}</p>
                  <p className="text-zinc-500 text-[8px] font-medium uppercase tracking-widest mt-1">
                    {t('settings.resetProgressDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isResetting}
                  className={cn(
                    "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 btn-destructive font-headline text-[10px] font-black uppercase tracking-widest shrink-0 transition-all rounded",
                    isResetting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isResetting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{t('settings.resetting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>{t('settings.resetProgressBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={showResetProgramConfirm}
        title={t('settings.resetProgramTitle')}
        message={t('settings.resetProgramMsg')}
        confirmLabel={t('settings.resetProgramBtn')}
        cancelLabel={t('settings.keepProgress')}
        onConfirm={handleResetProgram}
        onCancel={() => setShowResetProgramConfirm(false)}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showResetConfirm}
        title={t('settings.resetProgressTitle')}
        message={t('settings.resetProgressMsg')}
        confirmLabel={t('settings.resetEverything')}
        cancelLabel={t('settings.keepProgress')}
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        variant="danger"
      />
    </div>
  );
};
