import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Scale, Ruler, Dumbbell, ChevronRight, CheckCircle2, Trophy, ArrowLeft, Medal, Skull, Zap, Loader2, Info } from 'lucide-react';
import { useSettings, UserProfile, TrainingGoal } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { auth, logout } from '../firebase';

type OnboardingStep = 'biometrics' | 'goals' | 'objective' | 'complete';

export const OnboardingFlow = () => {
  const { profile, updateProfile, unit, setUnit, t } = useSettings();
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volt_onboarding_step');
      if (saved && ['biometrics', 'goals', 'objective', 'complete'].includes(saved)) {
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
    trainingDurationMonths: 3,
    trainingFrequency: 4,
    trainingStyle: '' as string,
    trainingAge: 'untrained' as 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite',
    squat1RM: '',
    bench1RM: '',
    deadlift1RM: '',
    gymProfile: 'commercial' as 'commercial' | 'powerlifting',
    injuryNoGoList: [] as string[],
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

  const handleNext = async () => {
    if (step === 'biometrics') {
      setStep('goals');
    } else if (step === 'goals') {
      setStep('objective');
    } else if (step === 'objective') {
      setLoading(true);
      try {
        const heightVal = unit === 'metric' 
          ? (parseFloat(formData.height) || 0)
          : ((parseFloat(formData.heightFeet) || 0) * 12) + (parseFloat(formData.heightInches) || 0);

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
          trainingDurationMonths: formData.trainingDurationMonths,
          trainingFrequency: formData.trainingFrequency,
          level: formData.trainingAge,
          squatPR: parseFloat(formData.squat1RM) || 0,
          benchPR: parseFloat(formData.bench1RM) || 0,
          deadliftPR: parseFloat(formData.deadlift1RM) || 0,
          gymProfile: formData.gymProfile,
          injuryNoGoList: formData.injuryNoGoList,
          onboardingCompleted: false, // Still need to click "Enter Arena"
        });
        setStep('complete');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({ onboardingCompleted: true });
      localStorage.removeItem('volt_onboarding_step');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedGoal = (): TrainingGoal => {
    const age = parseInt(formData.age) || 30;
    const weight = parseFloat(formData.weight) || 80;
    const height = unit === 'metric' 
      ? (parseFloat(formData.height) || 175) 
      : ((parseFloat(formData.heightFeet) || 5) * 30.48 + (parseFloat(formData.heightInches) || 9) * 2.54);
    
    const heightM = height / 100;
    const weightKg = unit === 'metric' ? weight : weight / 2.20462;
    const bmi = weightKg / (heightM * heightM);

    if (age > 55 || bmi > 35) return 'longevity';
    if (formData.trainingAge === 'untrained' || formData.trainingAge === 'novice') return 'hypertrophy';
    if (formData.trainingAge === 'intermediate') return 'powerbuilding';
    if ((formData.trainingAge === 'advanced' || formData.trainingAge === 'elite') && formData.trainingFrequency >= 5) return 'pure_strength';
    
    return 'powerbuilding';
  };

  const getRecommendationRationale = (goal: TrainingGoal): string => {
    const age = parseInt(formData.age) || 30;
    const weight = parseFloat(formData.weight) || 80;
    const height = unit === 'metric' 
      ? (parseFloat(formData.height) || 175) 
      : ((parseFloat(formData.heightFeet) || 5) * 30.48 + (parseFloat(formData.heightInches) || 9) * 2.54);
    
    const heightM = height / 100;
    const weightKg = unit === 'metric' ? weight : weight / 2.20462;
    const bmi = weightKg / (heightM * heightM);

    if (goal === 'longevity') {
      if (age > 55) return t('onboarding.rationale.longevity.age');
      if (bmi > 35) return t('onboarding.rationale.longevity.bmi');
      return t('onboarding.rationale.longevity.default');
    }
    if (goal === 'hypertrophy') {
      return t('onboarding.rationale.hypertrophy');
    }
    if (goal === 'powerbuilding') {
      return t('onboarding.rationale.powerbuilding');
    }
    if (goal === 'pure_strength') {
      return t('onboarding.rationale.pure_strength');
    }
    return "";
  };

  const recommendedGoal = getRecommendedGoal();
  const rationale = getRecommendationRationale(recommendedGoal);

  // Auto-select recommended goal when relevant data changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, trainingGoal: recommendedGoal }));
  }, [formData.trainingAge, formData.trainingFrequency, formData.age, formData.weight, formData.height, formData.heightFeet, formData.heightInches]);

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
      className="fixed inset-0 z-[100] bg-void flex justify-center p-2 md:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl my-auto py-4 md:py-8">
        <AnimatePresence mode="wait">
          {step === 'biometrics' && (
            <motion.div
              key="biometrics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel px-4 py-6 md:p-10 space-y-6 md:space-y-8"
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => logout()} // Back to Step 1 (Signup) means logging out
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex-1 space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight text-white">{t('onboarding.title')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step2')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.firstName')}</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white focus:border-volt outline-none transition-all"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.lastName')}</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white focus:border-volt outline-none transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.gender')}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={cn(
                          "p-3 border font-headline text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.gender === g ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                        )}
                      >
                        {t(`gender.${g}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.age')}</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white focus:border-volt outline-none transition-all"
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
                        <Ruler className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", isHeightError ? "text-crimson" : "text-zinc-500")} size={18} />
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          className={cn(
                            "w-full bg-surface-container-lowest border-b-2 p-4 pl-12 text-white outline-none transition-all",
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
                              "w-full bg-surface-container-lowest border-b-2 p-4 text-white outline-none transition-all text-center",
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
                              "w-full bg-surface-container-lowest border-b-2 p-4 text-white outline-none transition-all text-center",
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
                    <Scale className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", isWeightError ? "text-crimson" : "text-zinc-500")} size={18} />
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className={cn(
                        "w-full bg-surface-container-lowest border-b-2 p-4 pl-12 text-white outline-none transition-all",
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel px-4 py-6 md:p-10 space-y-6 md:space-y-8"
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setStep('biometrics')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight text-white">{t('onboarding.title')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step3')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.experience')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['untrained', 'novice', 'intermediate', 'advanced', 'elite'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFormData({ ...formData, trainingAge: level })}
                        className={cn(
                          "p-3 border font-headline text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.trainingAge === level ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                        )}
                      >
                        {t(`onboarding.level.${level}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.current1rm')}</label>
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
                      <label className={cn("text-[8px] font-black uppercase tracking-normal transition-colors", isSquatError ? "text-crimson" : "text-zinc-500")}>{t('onboarding.squat')}</label>
                      <input
                        type="number"
                        value={formData.squat1RM}
                        onChange={(e) => setFormData({ ...formData, squat1RM: e.target.value })}
                        className={cn(
                          "w-full bg-surface-container-lowest border-b-2 p-3 text-white outline-none transition-all text-center",
                          isSquatError ? "border-crimson" : "border-white/5 focus:border-volt"
                        )}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-[8px] font-black uppercase tracking-normal transition-colors", isBenchError ? "text-crimson" : "text-zinc-500")}>{t('onboarding.bench')}</label>
                      <input
                        type="number"
                        value={formData.bench1RM}
                        onChange={(e) => setFormData({ ...formData, bench1RM: e.target.value })}
                        className={cn(
                          "w-full bg-surface-container-lowest border-b-2 p-3 text-white outline-none transition-all text-center",
                          isBenchError ? "border-crimson" : "border-white/5 focus:border-volt"
                        )}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-[8px] font-black uppercase tracking-normal transition-colors", isDeadliftError ? "text-crimson" : "text-zinc-500")}>{t('onboarding.deadlift')}</label>
                      <input
                        type="number"
                        value={formData.deadlift1RM}
                        onChange={(e) => setFormData({ ...formData, deadlift1RM: e.target.value })}
                        className={cn(
                          "w-full bg-surface-container-lowest border-b-2 p-3 text-white outline-none transition-all text-center",
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

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.gymAccess')}</label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, gymProfile: 'powerlifting' })}
                      className={cn(
                        "p-3 border font-headline text-[10px] font-black uppercase tracking-widest transition-all text-left",
                        formData.gymProfile === 'powerlifting' ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                      )}
                    >
                      {t('onboarding.gymYes')}
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, gymProfile: 'commercial' })}
                      className={cn(
                        "p-3 border font-headline text-[10px] font-black uppercase tracking-widest transition-all text-left",
                        formData.gymProfile === 'commercial' ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                      )}
                    >
                      {t('onboarding.gymNo')}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.limitations')}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'squat_conventional', label: t('onboarding.movement.squat') },
                      { id: 'bench_flat', label: t('onboarding.movement.bench') },
                      { id: 'deadlift_conventional', label: t('onboarding.movement.deadlift') }
                    ].map((movement) => (
                      <label key={movement.id} className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-white/5 cursor-pointer hover:border-white/10 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.injuryNoGoList.includes(movement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, injuryNoGoList: [...formData.injuryNoGoList, movement.id] });
                            } else {
                              setFormData({ ...formData, injuryNoGoList: formData.injuryNoGoList.filter(id => id !== movement.id) });
                            }
                          }}
                          className="accent-volt w-4 h-4"
                        />
                        <span className="text-xs font-medium text-white">{movement.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.trainingPeriod')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setFormData({ ...formData, trainingDurationMonths: m })}
                        className={cn(
                          "py-3 border font-headline text-xs font-black uppercase tracking-widest transition-all",
                          formData.trainingDurationMonths === m ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                        )}
                      >
                        {m}{t('onboarding.months').charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.frequency')}</label>
                    <span className="text-volt font-headline text-xs font-black italic">{formData.trainingFrequency} {t('onboarding.daysPerWeek')}</span>
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
              </div>

              <button
                onClick={handleNext}
                disabled={loading || isSquatError || isBenchError || isDeadliftError}
                className="w-full bg-volt text-void font-headline font-black uppercase tracking-widest p-5 flex items-center justify-center gap-2 rounded-none hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,182,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? t('onboarding.calibrating') : t('onboarding.nextProtocol')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'objective' && (
            <motion.div
              key="objective"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel px-4 py-6 md:p-10 space-y-6 md:space-y-8"
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setStep('goals')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight text-white">{t('onboarding.title')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step4')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-normal text-zinc-500">{t('onboarding.objective')}</label>
                <div className="grid grid-cols-1 gap-3">
                  {(['pure_strength', 'powerbuilding', 'hypertrophy', 'peaking', 'longevity'] as TrainingGoal[]).map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setFormData({ ...formData, trainingGoal: goal })}
                      className={cn(
                        "p-4 border transition-all text-left flex flex-col gap-1 relative overflow-hidden",
                        formData.trainingGoal === goal ? "bg-volt/10 border-volt" : "bg-surface-variant border-white/5"
                      )}
                    >
                      {recommendedGoal === goal && (
                        <div className="absolute top-0 right-0 flex items-center">
                          <div className="bg-volt text-void text-[7px] font-black uppercase px-2 py-0.5 italic tracking-tighter">
                            {t('onboarding.recommended')}
                          </div>
                          <div className="bg-white/10 p-0.5 text-volt">
                            <Info size={8} />
                          </div>
                        </div>
                      )}
                      <span className={cn(
                        "font-headline text-xs font-black uppercase tracking-widest",
                        formData.trainingGoal === goal ? "text-white" : "text-zinc-400"
                      )}>
                        {t(`goal.${goal}`)}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">
                        {t(`goal.${goal}.desc`)}
                      </span>
                      {recommendedGoal === goal && (
                        <div className="mt-2 pt-2 border-t border-volt/20 flex gap-2 items-center">
                          <Info size={10} className="text-volt shrink-0" />
                          <p className="text-[8px] text-volt font-black uppercase tracking-tighter italic leading-tight opacity-80">
                            {t('onboarding.recommendationDesc')}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
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

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                duration: 0.6
              }}
              className="glass-panel px-6 py-10 md:p-12 text-center space-y-6 md:space-y-8 relative overflow-hidden"
            >
              <div className="flex items-center gap-6 text-left mb-4">
                <button 
                  onClick={() => setStep('objective')}
                  className="w-12 h-12 shrink-0 bg-surface-container-lowest border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-volt transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight text-white">{t('onboarding.protocolFinalized')}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('onboarding.step5')}</p>
                </div>
              </div>

              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-volt/10 flex items-center justify-center text-volt mx-auto border border-volt/20"
              >
                <CheckCircle2 size={48} className="drop-shadow-[0_0_15px_rgba(0,182,255,0.5)]" />
              </motion.div>

              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <h2 className="font-headline text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white text-glow-volt">
                    {t('onboarding.systemsOnline')}
                  </h2>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-4 items-center"
                >
                  <div className="flex items-center justify-center gap-3 font-headline text-sm font-black uppercase tracking-[0.2em] px-6 py-3 border border-volt/30 text-volt bg-volt/5 shadow-[0_0_20px_rgba(0,182,255,0.1)]">
                    <Medal size={20} />
                    {t(`goal.${formData.trainingGoal}`)}
                  </div>
                  
                  <p className="text-zinc-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
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
