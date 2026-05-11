import React, { useMemo } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';

interface WelcomeModuleProps {
  onStart: () => void;
  onViewBriefing: () => void;
}

export const WelcomeModule = ({ onStart, onViewBriefing }: WelcomeModuleProps) => {
  const { profile, t } = useSettings();
  const { history, getCalibrationStatus, getNextWorkoutTemplate, calculateProgramCalories, currentSession } = useWorkout();

  const greeting = useMemo(() => {
    const greetings = [t('analysis.missionStart'), t('analysis.welcome'), t('analysis.systemsNominal'), t('analysis.goodDay')];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [t]);

  const tacticalName = useMemo(() => {
    if (!profile?.displayName) return t('analysis.operator');
    return profile.displayName.split(' ')[0];
  }, [profile?.displayName, t]);
  const calibration = getCalibrationStatus();
  const readinessScore = history.length > 0 ? calibration.readiness : 100;
  const nextWorkout = getNextWorkoutTemplate();

  const { predictedCalories, estimatedDuration } = React.useMemo(() => {
    const activeWorkout = currentSession || nextWorkout;
    if (!activeWorkout || !profile) return { predictedCalories: 0, estimatedDuration: 0 };

    // Check for Redline scaling
    const isRedline = calibration.isRedline;
    const finalIntensity = isRedline ? 0.75 : 1.0;

    let totalTonnage = 0;
    activeWorkout.exercises?.forEach(ex => {
      ex.sets?.forEach(s => {
        const weight = parseFloat(s.weight || '0') || 0;
        const reps = parseInt(s.reps || '0') || 0;
        totalTonnage += (weight * finalIntensity) * reps;
      });
    });

    const weightKg = profile.unit === 'imperial' ? (profile.weight || 75) * 0.453592 : (profile.weight || 75);

    // Unify duration estimation: 12 mins per exercise + 15 mins warmup/transition
    const estDuration = ((activeWorkout.exercises?.length || 0) * 12) + 15;

    // Use the current recommended RPE from calibration if available, otherwise default to 7
    const targetRpe = activeWorkout.targetRpe || calibration.recommendedRpe || 7;

    const calories = calculateProgramCalories(weightKg, estDuration, targetRpe, totalTonnage);
    return { predictedCalories: calories, estimatedDuration: estDuration };
  }, [nextWorkout, currentSession, profile, calibration, calculateProgramCalories]);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <div className="glass-panel p-4 md:p-8 border-none flex flex-col gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000 pointer-events-none">
          {/*}<Play size={240} className="fill-volt" />{*/}
        </div>

        <h1 className="text-3xl font-black uppercase leading-none">
          {greeting}, <span className="text-volt">{tacticalName}</span>
        </h1>
        <p
          className="font-mono text-xs text-zinc-400 leading-relaxed border-l border-zinc-700 pl-4 max-w-2xl"
          dangerouslySetInnerHTML={{
            __html: t('analysis.readinessGreeting', {
              score: `<span class="font-black text-white">${readinessScore}</span>`,
              workout: `<span class="font-black text-white">${nextWorkout?.title || t('analysis.activeRecoveryMission')}</span>`,
              duration: `<span class="font-black text-white">${estimatedDuration}</span>`,
              calories: `<span class="font-black text-white">${predictedCalories}</span>`
            })
          }}
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={onViewBriefing}
            className="flex-1 btn-secondary w-full min-h-[44px] px-4 sm:px-8 py-4 uppercase tracking-widest font-black"
          >
            {t('Mission Briefing')}
            <ChevronRight size={16} className="ml-2" />
          </button>
        </div>

      </div>
    </div>
  );
};
