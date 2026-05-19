import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Scale, Ruler, Dumbbell, ChevronRight, CheckCircle2, Trophy, ArrowLeft, Medal, Skull, Zap, Loader2, Info, ChevronDown } from 'lucide-react';
import { useSettings, UserProfile, TrainingGoal, MissionPeriod, CustomBlock } from '../contexts/SettingsContext';
import { BlockType } from '../constants/periodization';
import { ProgramDesigner } from './ProgramDesigner';
import { cn } from '../lib/utils';
import { auth, logout } from '../firebase';

type OnboardingStep = 'biometrics' | 'goals' | 'objective' | 'advanced' | 'period_setup' | 'complete';

const EXPERIENCE_DESCRIPTIONS = {
  untrained: {
    title: 'Untrained',
    description: 'Starting from zero. Basic motor patterns are still being established. Focus on form and baseline conditioning.',
    qualifies: 'Individuals with less than 3 months of consistent training or those returning from a multi-year hiatus.'
  },
  novice: {
    title: 'Novice',
    description: 'Consistent training for 3-9 months. Linear progression is common. Solid understanding of basic compound lifts.',
    qualifies: 'Typically 3-12 months of consistent training. Can still make session-to-session progress.'
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Consistent training for 1-2 years. Progress requires more complex programming and periodization.',
    qualifies: '1-3 years of consistent training. Requires weekly or monthly progression models.'
  },
  advanced: {
    title: 'Advanced',
    description: 'Consistent training for 3-5 years. Highly developed technique and high work capacity. Requires specific peak phases.',
    qualifies: '3-5+ years of dedicated training. Competition-level intensity and technical proficiency.'
  },
  elite: {
    title: 'Elite',
    description: '5+ years of dedicated training. Near genetic limit. Competing at local or national levels.',
    qualifies: 'Professional or high-level competitive athletes. Marginal gains require extreme specialization.'
  }
};

const getProficiencyData = (level: string, gender: string, age: number, weight: number) => {
  const strengthRatios: Record<string, Record<string, number>> = {
    male: { untrained: 1.0, novice: 1.8, intermediate: 3.2, advanced: 4.8, elite: 6.5 },
    female: { untrained: 0.6, novice: 1.1, intermediate: 1.9, advanced: 2.9, elite: 4.0 },
    other: { untrained: 0.8, novice: 1.4, intermediate: 2.5, advanced: 3.8, elite: 5.2 }
  };

  const enduranceTimes: Record<string, Record<string, string>> = {
    male: { untrained: '12:00', novice: '9:00', intermediate: '7:00', advanced: '5:30', elite: '4:30' },
    female: { untrained: '14:00', novice: '11:00', intermediate: '8:30', advanced: '7:00', elite: '5:30' },
    other: { untrained: '13:00', novice: '10:00', intermediate: '7:45', advanced: '6:15', elite: '5:00' }
  };

  const g = gender === 'male' || gender === 'female' || gender === 'other' ? gender : 'male';
  let strengthRatio = strengthRatios[g]?.[level] || strengthRatios.male[level];
  
  // Age adjustment: -0.5% per year after 35
  if (age > 35) {
    const yearsAbove = age - 35;
    const reduction = Math.min(0.4, yearsAbove * 0.005);
    strengthRatio *= (1 - reduction);
  }

  const enduranceTime = enduranceTimes[g]?.[level] || enduranceTimes.male[level];

  return {
    strengthRatio: parseFloat(strengthRatio.toFixed(2)),
    enduranceTime,
    totalWeight: Math.round(weight * strengthRatio)
  };
};

export const OnboardingFlow = ({ 
  onCompleteHandler,
  onBack
}: { 
  onCompleteHandler?: (data: any) => void,
  onBack?: () => void
}) => {
  const { profile, updateProfile, unit, setUnit, t } = useSettings();
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volt_onboarding_step');
      if (saved && ['biometrics', 'goals', 'objective', 'advanced', 'complete'].includes(saved)) {
        return saved as OnboardingStep;
      }
    }
    return 'biometrics';
  });

  useEffect(() => {
    localStorage.setItem('volt_onboarding_step', step);
  }, [step]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    age: '',
    trainingGoal: 'powerbuilding' as TrainingGoal,
    trainingObjectives: ['powerbuilding'] as TrainingGoal[],
    trainingDurationMonths: 3,
    missionPeriod: '3M' as any, // Cast to any to avoid type issue if MissionPeriod not imported
    customProgramBlocks: [] as any[],
    trainingFrequency: 4,
    trainingStyle: '' as string,
    trainingAge: 'untrained' as 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite',
    squat1RM: '',
    bench1RM: '',
    deadlift1RM: '',
    gymProfile: 'commercial' as 'commercial' | 'powerlifting',
    injuryNoGoList: [] as string[],
    hasFullGymAccess: true,
    hasMedicalConditions: false,
    medicalConditionDetails: '',
    isExperiencedAthlete: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  const heightVal = parseFloat(formData.height) || 0;
  const heightFeetVal = parseFloat(formData.heightFeet) || 0;
  const heightInchesVal = parseFloat(formData.heightInches) || 0;
  const weightVal = parseFloat(formData.weight) || 0;

  const isHeightError = unit === 'metric'
    ? (formData.height !== '' && (heightVal < 50 || heightVal > 300))
    : ((formData.heightFeet !== '' && (heightFeetVal < 2 || heightFeetVal > 9)) ||
      (formData.heightInches !== '' && (heightInchesVal < 0 || heightInchesVal > 11)));

  const isWeightError = formData.weight !== '' && (
    unit === 'metric'
      ? (weightVal < 20 || weightVal > 600)
      : (weightVal < 40 || weightVal > 1300)
  );

  const squatVal = parseFloat(formData.squat1RM) || 0;
  const benchVal = parseFloat(formData.bench1RM) || 0;
  const deadliftVal = parseFloat(formData.deadlift1RM) || 0;

  const isSquatError = formData.squat1RM !== '' && (
    unit === 'metric' ? (squatVal < 0 || squatVal > 500) : (squatVal < 0 || squatVal > 1100)
  );
  const isBenchError = formData.bench1RM !== '' && (
    unit === 'metric' ? (benchVal < 0 || benchVal > 400) : (benchVal < 0 || benchVal > 900)
  );
  const isDeadliftError = formData.deadlift1RM !== '' && (
    unit === 'metric' ? (deadliftVal < 0 || deadliftVal > 600) : (deadliftVal < 0 || deadliftVal > 1300)
  );

  useEffect(() => {
    if (profile && !isInitialized) {
      const [first, ...last] = (profile.displayName || '').split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: profile.firstName || first || '',
        lastName: profile.lastName || last.join(' ') || '',
        gender: profile.gender || 'male',
        weight: profile.weight?.toString() || '',
        height: profile.height?.toString() || '',
      }));
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  const handleUnitChange = (newUnit: 'imperial' | 'metric') => {
    if (newUnit === unit) return;

    // Convert current formData values
    const weightVal = parseFloat(formData.weight);
    const heightVal = parseFloat(formData.height);
    const heightFeetVal = parseFloat(formData.heightFeet);
    const heightInchesVal = parseFloat(formData.heightInches);
    const squatVal = parseFloat(formData.squat1RM);
    const benchVal = parseFloat(formData.bench1RM);
    const deadliftVal = parseFloat(formData.deadlift1RM);

    const weightFactor = newUnit === 'metric' ? 1 / 2.20462 : 2.20462;

    const newFormData = { ...formData };

    if (!isNaN(weightVal)) {
      newFormData.weight = Math.round(weightVal * weightFactor).toString();
    }
    if (!isNaN(squatVal)) {
      newFormData.squat1RM = Math.round(squatVal * weightFactor).toString();
    }
    if (!isNaN(benchVal)) {
      newFormData.bench1RM = Math.round(benchVal * weightFactor).toString();
    }
    if (!isNaN(deadliftVal)) {
      newFormData.deadlift1RM = Math.round(deadliftVal * weightFactor).toString();
    }

    if (newUnit === 'metric') {
      // Imperial to Metric
      if (!isNaN(heightFeetVal) || !isNaN(heightInchesVal)) {
        const totalInches = (heightFeetVal || 0) * 12 + (heightInchesVal || 0);
        newFormData.height = Math.round(totalInches * 2.54).toString();
      }
    } else {
      // Metric to Imperial
      if (!isNaN(heightVal)) {
        const totalInches = heightVal / 2.54;
        newFormData.heightFeet = Math.floor(totalInches / 12).toString();
        newFormData.heightInches = Math.round(totalInches % 12).toString();
      }
    }

    setFormData(newFormData);
    setUnit(newUnit);
  };

  // Auto-fill custom blocks when reaching period_setup if empty
  useEffect(() => {
    if (step === 'period_setup' && (!formData.customProgramBlocks || formData.customProgramBlocks.length === 0)) {
      const totalWeeks = (parseInt(formData.missionPeriod) || 3) * 4;
      
      // Determine default block types based on goal
      let defaultType: string = BlockType.PURE_STRENGTH;
      if (formData.trainingGoal === 'hypertrophy') defaultType = BlockType.HYPERTROPHY;
      if (formData.trainingGoal === 'powerbuilding') defaultType = BlockType.POWERBUILDING;
      if (formData.trainingGoal === 'tactical') defaultType = BlockType.TACTICAL;
      if (formData.trainingGoal === 'endurance') defaultType = BlockType.ENDURANCE;
      
      const activeWeeks = totalWeeks - 1; // Reserve 1 week for deload
      const block1Weeks = Math.floor(activeWeeks / 2);
      const block2Weeks = activeWeeks - block1Weeks;

      const defaultBlocks = [
        { id: 'def-1', type: defaultType, durationWeeks: block1Weeks },
        { id: 'def-2', type: defaultType, durationWeeks: block2Weeks },
        { id: 'def-3', type: BlockType.DELOAD, durationWeeks: 1 }
      ];
      
      setFormData(prev => ({ ...prev, customProgramBlocks: defaultBlocks }));
    }
  }, [step, formData.missionPeriod, formData.trainingGoal]);

  const finalizeProfile = async () => {
    setLoading(true);
    try {
      const heightVal = unit === 'metric'
        ? (parseFloat(formData.height) || 0)
        : ((parseFloat(formData.heightFeet) || 0) * 12) + (parseFloat(formData.heightInches) || 0);

      // Ensure blocks are initialized if they haven't been yet (e.g. when skipping period_setup)
      let finalBlocks = formData.customProgramBlocks;
      if (!finalBlocks || finalBlocks.length === 0) {
        const totalWeeks = (parseInt(formData.missionPeriod) || 3) * 4;
        let defaultType: string = BlockType.PURE_STRENGTH;
        if (formData.trainingGoal === 'hypertrophy') defaultType = BlockType.HYPERTROPHY;
        if (formData.trainingGoal === 'powerbuilding') defaultType = BlockType.POWERBUILDING;
        if (formData.trainingGoal === 'tactical') defaultType = BlockType.TACTICAL;
        if (formData.trainingGoal === 'endurance') defaultType = BlockType.ENDURANCE;
        
        const activeWeeks = totalWeeks - 1;
        const block1Weeks = Math.floor(activeWeeks / 2);
        const block2Weeks = activeWeeks - block1Weeks;

        finalBlocks = [
          { id: 'def-1', type: defaultType, durationWeeks: block1Weeks },
          { id: 'def-2', type: defaultType, durationWeeks: block2Weeks },
          { id: 'def-3', type: BlockType.DELOAD, durationWeeks: 1 }
        ];
      }

      await updateProfile({
        uid: auth.currentUser?.uid || '',
        email: auth.currentUser?.email || '',
        unit: unit,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        age: parseInt(formData.age) || 0,
        height: heightVal,
        weight: parseFloat(formData.weight) || 0,
        trainingGoal: formData.trainingGoal,
        trainingObjectives: formData.trainingObjectives,
        trainingDurationMonths: formData.trainingDurationMonths,
        missionPeriod: formData.missionPeriod,
        customProgramBlocks: finalBlocks,
        isCustomProgram: true,
        trainingFrequency: formData.trainingFrequency,
        level: formData.trainingAge,
        squatPR: parseFloat(formData.squat1RM) || 0,
        benchPR: parseFloat(formData.bench1RM) || 0,
        deadliftPR: parseFloat(formData.deadlift1RM) || 0,
        gymProfile: formData.gymProfile,
        injuryNoGoList: formData.injuryNoGoList,
        hasFullGymAccess: formData.hasFullGymAccess,
        hasMedicalConditions: formData.hasMedicalConditions,
        medicalConditionDetails: formData.medicalConditionDetails,
        isExperiencedAthlete: formData.isExperiencedAthlete,
        onboardingCompleted: false,
        programResetAt: Date.now(),
      });
      setStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 'biometrics') {
      setStep('goals');
    } else if (step === 'goals') {
      setStep('objective');
    } else if (step === 'objective') {
      const advancedGoals = ['tactical', 'explosiveness', 'endurance', 'prehab'];
      const needsAdvancedSetup = formData.trainingObjectives.some(g => advancedGoals.includes(g));

      if (needsAdvancedSetup) {
        setStep('advanced');
      } else if (formData.trainingObjectives.length === 1) {
        await finalizeProfile();
      } else {
        setStep('period_setup');
      }
    } else if (step === 'advanced') {
      if (formData.trainingObjectives.length === 1) {
        await finalizeProfile();
      } else {
        setStep('period_setup');
      }
    } else if (step === 'period_setup') {
      await finalizeProfile();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (onCompleteHandler) {
        // Collect all data and pass to handler
        const heightVal = unit === 'metric'
          ? (parseFloat(formData.height) || 0)
          : ((parseFloat(formData.heightFeet) || 0) * 12) + (parseFloat(formData.heightInches) || 0);
          
        onCompleteHandler({
            unit: unit,
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender: formData.gender,
            age: parseInt(formData.age) || 0,
            height: heightVal,
            weight: parseFloat(formData.weight) || 0,
            trainingGoal: formData.trainingGoal,
            trainingObjectives: formData.trainingObjectives,
            trainingDurationMonths: formData.trainingDurationMonths,
            missionPeriod: formData.missionPeriod,
            customProgramBlocks: formData.customProgramBlocks,
            trainingFrequency: formData.trainingFrequency,
            level: formData.trainingAge,
            squatPR: parseFloat(formData.squat1RM) || 0,
            benchPR: parseFloat(formData.bench1RM) || 0,
            deadliftPR: parseFloat(formData.deadlift1RM) || 0,
            gymProfile: formData.gymProfile,
            injuryNoGoList: formData.injuryNoGoList,
            hasFullGymAccess: formData.hasFullGymAccess,
            hasMedicalConditions: formData.hasMedicalConditions,
            medicalConditionDetails: formData.medicalConditionDetails,
            isExperiencedAthlete: formData.isExperiencedAthlete,
        });
      } else {
        const heightVal = unit === 'metric'
          ? (parseFloat(formData.height) || 0)
          : ((parseFloat(formData.heightFeet) || 0) * 12) + (parseFloat(formData.heightInches) || 0);

        await updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          age: parseInt(formData.age) || 0,
          height: heightVal,
          weight: parseFloat(formData.weight) || 0,
          trainingGoal: formData.trainingGoal,
          trainingObjectives: formData.trainingObjectives,
          trainingDurationMonths: formData.trainingDurationMonths,
          missionPeriod: formData.missionPeriod,
          customProgramBlocks: formData.customProgramBlocks,
          isCustomProgram: true,
          trainingFrequency: formData.trainingFrequency,
          level: formData.trainingAge,
          squatPR: parseFloat(formData.squat1RM) || 0,
          benchPR: parseFloat(formData.bench1RM) || 0,
          deadliftPR: parseFloat(formData.deadlift1RM) || 0,
          hasFullGymAccess: formData.hasFullGymAccess,
          hasMedicalConditions: formData.hasMedicalConditions,
          medicalConditionDetails: formData.medicalConditionDetails,
          isExperiencedAthlete: formData.isExperiencedAthlete,
          onboardingCompleted: true,
          programResetAt: Date.now(),
        });
      }
      localStorage.removeItem('volt_onboarding_step');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[100] bg-void overflow-y-auto custom-scrollbar pt-safe"
    >
      <div className="w-full min-h-full flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'biometrics' && (
            <motion.div
              key="biometrics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-8 md:space-y-12"
            >
              <div className="flex items-center gap-6 md:mt-0">
                <button
                  onClick={() => onBack ? onBack() : logout()} // Back to Carousel if possible, else Step 1 (Signup) means logging out
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex-1 space-y-1">
                  <h2 className="font-headline text-2xl md:text-3xl font-black uppercase tracking-tight text-white">{t('onboarding.title')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step1')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.firstName')}</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-2 md:p-4 text-white focus:border-volt outline-none transition-all"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.lastName')}</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-2 md:p-4 text-white focus:border-volt outline-none transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.gender')}</label>
                  <div className="relative">
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                      className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-2 md:p-4 text-white focus:border-volt outline-none transition-all appearance-none"
                    >
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <option key={g} value={g}>{t(`gender.${g}`)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.age')}</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-2 md:p-4 text-white focus:border-volt outline-none transition-all"
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-surface-container-lowest border border-white/5 p-1">
                  <button
                    onClick={() => handleUnitChange('imperial')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                      unit === 'imperial' ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    LBS
                  </button>
                  <button
                    onClick={() => handleUnitChange('metric')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                      unit === 'metric' ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    KG
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    isHeightError ? "text-crimson" : "text-zinc-500"
                  )}>
                    {t('onboarding.height')} ({unit === 'metric' ? 'cm' : 'ft/in'})
                  </label>
                  <div className="relative flex gap-2">
                    {unit === 'metric' ? (
                      <div className="relative w-full">
                        {/*...icon hidden}<Ruler className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", isHeightError ? "text-crimson" : "text-zinc-500")} size={18} />{...*/}
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          className={cn(
                            "w-full bg-surface-container-lowest border-b-2 p-2 md:p-4 pl-12 text-white outline-none transition-all",
                            isHeightError ? "border-crimson" : "border-white/5 focus:border-volt"
                          )}
                          placeholder="180"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={formData.heightFeet}
                            onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                            className={cn(
                              "w-full bg-surface-container-lowest border-b-2 p-2 md:p-4 text-white outline-none transition-all text-center",
                              (formData.heightFeet !== '' && (heightFeetVal < 2 || heightFeetVal > 9)) ? "border-crimson" : "border-white/5 focus:border-volt"
                            )}
                            placeholder="5"
                          />
                          <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase transition-colors", (formData.heightFeet !== '' && (heightFeetVal < 2 || heightFeetVal > 9)) ? "text-crimson" : "text-zinc-500")}>ft</span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={formData.heightInches}
                            onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                            className={cn(
                              "w-full bg-surface-container-lowest border-b-2 p-2 md:p-4 text-white outline-none transition-all text-center",
                              (formData.heightInches !== '' && (heightInchesVal < 0 || heightInchesVal > 11)) ? "border-crimson" : "border-white/5 focus:border-volt"
                            )}
                            placeholder="9"
                          />
                          <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase transition-colors", (formData.heightInches !== '' && (heightInchesVal < 0 || heightInchesVal > 11)) ? "text-crimson" : "text-zinc-500")}>in</span>
                        </div>
                      </>
                    )}
                  </div>
                  {isHeightError && (
                    <p className="text-[8px] font-black uppercase tracking-widest text-crimson">{t('onboarding.invalidHeight')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    isWeightError ? "text-crimson" : "text-zinc-500"
                  )}>
                    {t('onboarding.weight')} ({unit === 'metric' ? 'kg' : 'LBS'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className={cn(
                        "w-full bg-surface-container-lowest border-b-2 p-2 md:p-4 text-white outline-none transition-all",
                        isWeightError ? "border-crimson" : "border-white/5 focus:border-volt"
                      )}
                      placeholder={unit === 'metric' ? "85" : "185"}
                    />
                  </div>
                  {isWeightError && (
                    <p className="text-[8px] font-black uppercase tracking-widest text-crimson">{t('onboarding.invalidWeight')}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!formData.firstName || !formData.lastName || (unit === 'metric' ? !formData.height : (!formData.heightFeet || !formData.heightInches)) || !formData.weight || isHeightError || isWeightError}
                className="w-full bg-volt text-void font-headline font-black uppercase tracking-widest p-5 flex items-center justify-center gap-2 rounded-none hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,182,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('onboarding.nextProtocol')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-8 md:space-y-12"
            >
              <div className="flex items-center gap-6 md:mt-0">
                <button
                  onClick={() => setStep('biometrics')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-white">{t('onboarding.title')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step2')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Experience Level</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
                    {(['untrained', 'novice', 'intermediate', 'advanced', 'elite'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          const bw = weightVal || (unit === 'metric' ? 80 : 180);
                          const age = parseInt(formData.age) || 30;
                          const data = getProficiencyData(level, formData.gender, age, bw);
                          
                          // Set default 1RMs based on level if they are empty
                          const total = data.totalWeight;
                          const squat = total * 0.45;
                          const bench = total * 0.25;
                          const deadlift = total * 0.30;

                          setFormData({ 
                            ...formData, 
                            trainingAge: level,
                            squat1RM: formData.squat1RM && formData.squat1RM !== '0' ? formData.squat1RM : Math.round(squat).toString(),
                            bench1RM: formData.bench1RM && formData.bench1RM !== '0' ? formData.bench1RM : Math.round(bench).toString(),
                            deadlift1RM: formData.deadlift1RM && formData.deadlift1RM !== '0' ? formData.deadlift1RM : Math.round(deadlift).toString()
                          });
                        }}
                        className={cn(
                          "py-3 border font-headline text-[8px] font-black uppercase tracking-widest transition-all",
                          formData.trainingAge === level ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Description Box */}
                  <div className="bg-surface-container-lowest border border-white/5 p-4 space-y-3">
                    {(() => {
                      const bw = weightVal || (unit === 'metric' ? 80 : 180);
                      const age = parseInt(formData.age) || 30;
                      const profData = getProficiencyData(formData.trainingAge, formData.gender, age, bw);
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <h3 className="font-headline text-sm font-black uppercase tracking-widest text-volt">
                              {EXPERIENCE_DESCRIPTIONS[formData.trainingAge].title}
                            </h3>
                            <div className="flex gap-2">
                              <div className="bg-volt/10 px-2 min-h-[20px] flex items-center justify-center border border-volt/20">
                                <span className="text-[8px] font-black text-volt uppercase leading-none">Strength: {profData.strengthRatio}x BW</span>
                              </div>
                              <div className="bg-volt/10 px-2 min-h-[20px] flex items-center justify-center border border-volt/20">
                                <span className="text-[8px] font-black text-volt uppercase leading-none">1 Mile: {profData.enduranceTime}</span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                            {EXPERIENCE_DESCRIPTIONS[formData.trainingAge].description}
                          </p>
                          
                          <div className="pt-2 border-t border-white/5">
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Target Proficiency</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Big 3 Total</p>
                                <p className="text-sm text-volt font-black">
                                  {profData.totalWeight} {unit === 'metric' ? 'kg' : 'lbs'}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Endurance Mark</p>
                                <p className="text-sm text-volt font-black">{profData.enduranceTime} 1 Mile</p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <div className="pt-2">
                      <p className="text-zinc-400 text-xs leading-relaxed font-medium italic">
                        {EXPERIENCE_DESCRIPTIONS[formData.trainingAge].qualifies}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional Override for 1RMs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fine-Tune 1RM Protocol (Optional)</label>
                    <div className="flex items-center gap-2 bg-surface-container-lowest border border-white/5 p-1 w-fit">
                      <button
                        onClick={() => handleUnitChange('imperial')}
                        className={cn(
                          "px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all",
                          unit === 'imperial' ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                        )}
                      >
                        LBS
                      </button>
                      <button
                        onClick={() => handleUnitChange('metric')}
                        className={cn(
                          "px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all",
                          unit === 'metric' ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                        )}
                      >
                        KG
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className={cn("text-[8px] font-black uppercase tracking-normal transition-colors", isSquatError ? "text-crimson" : "text-zinc-500")}>Squat</label>
                      <input
                        type="number"
                        value={formData.squat1RM}
                        onChange={(e) => setFormData({ ...formData, squat1RM: e.target.value })}
                        className={cn(
                          "w-full bg-surface-container-lowest border-b-2 p-3 text-white outline-none transition-all text-center text-xs font-black",
                          isSquatError ? "border-crimson" : "border-white/5 focus:border-volt"
                        )}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-[8px] font-black uppercase tracking-normal transition-colors", isBenchError ? "text-crimson" : "text-zinc-500")}>Bench</label>
                      <input
                        type="number"
                        value={formData.bench1RM}
                        onChange={(e) => setFormData({ ...formData, bench1RM: e.target.value })}
                        className={cn(
                          "w-full bg-surface-container-lowest border-b-2 p-3 text-white outline-none transition-all text-center text-xs font-black",
                          isBenchError ? "border-crimson" : "border-white/5 focus:border-volt"
                        )}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-[8px] font-black uppercase tracking-normal transition-colors", isDeadliftError ? "text-crimson" : "text-zinc-500")}>Deadlift</label>
                      <input
                        type="number"
                        value={formData.deadlift1RM}
                        onChange={(e) => setFormData({ ...formData, deadlift1RM: e.target.value })}
                        className={cn(
                          "w-full bg-surface-container-lowest border-b-2 p-3 text-white outline-none transition-all text-center text-xs font-black",
                          isDeadliftError ? "border-crimson" : "border-white/5 focus:border-volt"
                        )}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {(isSquatError || isBenchError || isDeadliftError) && (
                    <p className="text-[8px] font-black uppercase tracking-widest text-crimson">{t('onboarding.invalid1rm')}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={loading || isSquatError || isBenchError || isDeadliftError}
                className="w-full btn-primary p-5"
              >
                {loading ? t('onboarding.calibrating') : t('onboarding.next')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'objective' && (
            <motion.div
              key="objective"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-8 md:space-y-12"
            >
              <div className="flex items-center gap-6 md:mt-0">
                <button
                  onClick={() => setStep('goals')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-white">{t('onboarding.title')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step3')}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Deployment period</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['3M', '6M', '9M', '12M'] as MissionPeriod[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          const durationMonths = parseInt(m);
                          const maxObj = Math.floor(durationMonths / 3);
                          const updatedObjectives = formData.trainingObjectives.slice(0, maxObj);
                          
                          setFormData({ 
                          ...formData, 
                          missionPeriod: m,
                          trainingDurationMonths: durationMonths,
                          trainingObjectives: updatedObjectives.length > 0 ? updatedObjectives : formData.trainingObjectives.slice(0, 1),
                          trainingGoal: updatedObjectives.length > 0 ? updatedObjectives[0] : formData.trainingGoal
                        })}}
                        className={cn(
                          "py-3 border font-headline text-xs font-black uppercase tracking-widest transition-all",
                          formData.missionPeriod === m ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
                    {t('onboarding.periodDescription')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mission frequency</label>
                    <span className="text-volt font-headline text-xs font-black">{formData.trainingFrequency} {t('onboarding.daysPerWeek')}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="7"
                    step="1"
                    value={formData.trainingFrequency}
                    onChange={(e) => setFormData({ ...formData, trainingFrequency: parseInt(e.target.value) })}
                    className="w-full accent-volt bg-surface-variant h-2 appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                    <span>3 {t('onboarding.days')}</span>
                    <span>7 {t('onboarding.days')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.objective')}</label>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      {formData.trainingObjectives.length} / {Math.floor(formData.trainingDurationMonths / 3)} SELECTED
                    </span>
                  </div>
                <div className="grid grid-cols-1 gap-3">
                  {(['pure_strength', 'powerbuilding', 'hypertrophy', 'peaking', 'longevity', 'tactical', 'explosiveness', 'endurance', 'prehab'] as TrainingGoal[]).map((goal) => {
                    const goalIndex = formData.trainingObjectives.indexOf(goal);
                    const isSelected = goalIndex !== -1;
                    const priorityLabel = 
                      goalIndex === 0 ? 'PRIMARY' : 
                      goalIndex === 1 ? 'SECONDARY' : 
                      goalIndex === 2 ? 'TERTIARY' : 
                      goalIndex === 3 ? 'QUATERNARY' : '';
                    
                    return (
                      <button
                        key={goal}
                        onClick={() => {
                          const maxObjectives = Math.floor(formData.trainingDurationMonths / 3);
                          let newObjectives = [...formData.trainingObjectives];
                          if (isSelected) {
                            if (newObjectives.length > 1) {
                              newObjectives = newObjectives.filter(g => g !== goal);
                            }
                          } else {
                            if (newObjectives.length < maxObjectives) {
                              newObjectives.push(goal);
                            }
                          }
                          setFormData({ 
                            ...formData, 
                            trainingObjectives: newObjectives,
                            trainingGoal: newObjectives[0] 
                          });
                        }}
                        className={cn(
                          "p-4 border transition-all text-left flex flex-col gap-1 relative overflow-hidden",
                          isSelected ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                        )}
                      >
                        {/* recommended goal badge removed */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-headline text-xs font-black uppercase tracking-widest",
                              isSelected ? "text-white" : "text-zinc-400"
                            )}>
                              {t(`goal.${goal}`)}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 bg-volt text-void flex items-center justify-center">
                                <CheckCircle2 size={10} strokeWidth={4} />
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-[7px] font-black text-volt border border-volt/30 px-1.5 py-0.5">
                              {priorityLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">
                          {t(`goal.${goal}.desc`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
                onClick={handleNext}
                disabled={loading}
                className="w-full bg-volt text-void font-headline font-black uppercase tracking-widest p-5 flex items-center justify-center gap-2 rounded-none hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,182,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? t('onboarding.calibrating') : t('onboarding.analyzeProtocol')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'advanced' && (
            <motion.div
              key="advanced"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-8 md:space-y-12"
            >
              <div className="flex items-center gap-6 md:mt-0">
                <button
                  onClick={() => setStep('objective')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-white">Environment & Experience</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step4')}</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Gym Access */}
                <div className="space-y-4">
                  <label className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                    <Info size={14} className="text-volt" />
                    Do you have access to a fully equipped gym?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, hasFullGymAccess: true })}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 items-center justify-center",
                        formData.hasFullGymAccess ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      <span className="font-headline font-black tracking-widest uppercase">YES</span>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, hasFullGymAccess: false })}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 items-center justify-center",
                        !formData.hasFullGymAccess ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      <span className="font-headline font-black tracking-widest uppercase">NO</span>
                    </button>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div className="space-y-4">
                  <label className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                    <Skull size={14} className="text-volt" />
                    Do you have any medical conditions?
                  </label>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                    Let us know if you have any limitations or specific injuries we should be aware of.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, hasMedicalConditions: true })}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 items-center justify-center",
                        formData.hasMedicalConditions ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      <span className="font-headline font-black tracking-widest uppercase">YES</span>
                    </button>
                    <button
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          hasMedicalConditions: false,
                          medicalConditionDetails: ''
                        });
                      }}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 items-center justify-center",
                        !formData.hasMedicalConditions ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      <span className="font-headline font-black tracking-widest uppercase">NO</span>
                    </button>
                  </div>
                  
                  {formData.hasMedicalConditions && (
                    <div className="mt-4">
                      <label className="text-[10px] sm:text-xs font-black tracking-widest text-zinc-500 mb-2 sm:mb-3 block uppercase">
                        Please describe your condition(s) briefly
                      </label>
                      <textarea
                        value={formData.medicalConditionDetails}
                        onChange={(e) => setFormData({ ...formData, medicalConditionDetails: e.target.value })}
                        className="w-full bg-surface-container-lowest border border-white/5 p-4 text-white focus:border-volt focus:ring-1 focus:ring-volt transition-all text-sm outline-none resize-none h-24"
                        placeholder="e.g., Lower back pain when squatting heavy, torn right meniscus..."
                      />
                    </div>
                  )}
                </div>

                {/* Experience Level */}
                <div className="space-y-4">
                  <label className="text-xs font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                    <Zap size={14} className="text-volt" />
                    Are you an experienced athlete / soldier?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, isExperiencedAthlete: true })}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 items-center justify-center",
                        formData.isExperiencedAthlete ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      <span className="font-headline font-black tracking-widest uppercase">YES</span>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, isExperiencedAthlete: false })}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 items-center justify-center",
                        !formData.isExperiencedAthlete ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      <span className="font-headline font-black tracking-widest uppercase">NO</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full btn-primary py-4 uppercase font-black tracking-[0.2em] text-sm flex items-center justify-center gap-2"
              >
                {loading ? t('onboarding.calibrating') : t('onboarding.analyzeProtocol')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'period_setup' && (
            <motion.div
              key="period_setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-8 md:space-y-12"
            >
              <div className="flex items-center gap-6 md:mt-0">
                <button
                  onClick={() => setStep('objective')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-white">{t('onboarding.periodSetup')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step5')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                  {t('onboarding.choosePeriod')}
                </p>
                <ProgramDesigner 
                  missionPeriod={formData.missionPeriod || '3M'} 
                  onUpdate={(blocks) => setFormData({ ...formData, customProgramBlocks: blocks })}
                  initialBlocks={formData.customProgramBlocks}
                />
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full bg-volt text-void font-headline font-black uppercase tracking-widest p-5 flex items-center justify-center gap-2 rounded-none hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,182,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? t('onboarding.calibrating') : t('onboarding.finalize')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-8 md:space-y-12 text-center"
            >
              <div className="w-full flex items-center gap-6 text-left mb-4">
                <button
                  onClick={() => setStep('period_setup')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-white">{t('onboarding.protocolFinalized')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step6')}</p>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-volt/10 flex items-center justify-center text-volt mx-auto border border-volt/20"
              >
                <CheckCircle2 size={48} className="drop-shadow-[0_0_15px_var(--primary-glow)]" />
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <h2 className="font-headline text-3xl md:text-4xl font-black uppercase tracking-tighter text-white text-glow-volt">
                    {t('onboarding.systemsOnline')}
                  </h2>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-4 items-center"
                >
                  <div className="flex flex-wrap items-center justify-center gap-2 font-headline text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 border border-volt/30 text-volt bg-volt/5 shadow-[0_0_20px_rgba(0,182,255,0.1)]">
                    <Medal size={16} />
                    {formData.trainingObjectives.map(g => t(`goal.${g}`)).join(' + ')}
                  </div>

                  <p className="text-zinc-400 text-xs md:text-xs font-medium leading-relaxed max-w-sm mx-auto">
                    {t('onboarding.syncComplete')}
                  </p>
                </motion.div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-volt text-void font-headline font-black uppercase tracking-widest p-6 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(0,182,255,0.2)] disabled:opacity-50"
              >
                {loading ? t('onboarding.entering') : t('onboarding.enterArena')} <ChevronRight size={24} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
