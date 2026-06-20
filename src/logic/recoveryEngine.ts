import { RecoveryActivity, RECOVERY_MAP } from '../data/recoveryActivities';
import { EXERCISE_DATABASE } from '../constants/exercises';

export const calculateRecoveryBoost = (
  activity: RecoveryActivity, 
  sessionCount: number
) => {
  // Randomize boost within the range
  const baseBoost = Math.random() * (activity.boostRange[1] - activity.boostRange[0]) + activity.boostRange[0];

  if (sessionCount === 0) {
    // Session 1: Full benefit
    return baseBoost;
  } else if (sessionCount === 1) {
    // Session 2: Diminishing returns (50% effectiveness)
    return baseBoost * 0.5;
  } else {
    // Session 3+: Overtraining Penalty (Physical/Neural Drain)
    return -5.0;
  }
};

export const calculateWeightedMetric = (scores: number[]) => {
  // scores should be ordered from most recent (index 0) to oldest
  const count = scores.length;

  if (count === 0) return 0; // Return 0 or a baseline if preferred
  
  if (count === 1) {
    // If only 1 log exists: Use S0 at 100% weight
    return scores[0];
  }
  
  if (count === 2) {
    // If only 2 logs exist: Rebalance to (S0 * 0.7) + (S-1 * 0.3)
    return (scores[0] * 0.7) + (scores[1] * 0.3);
  }
  
  // If 3 or more logs exist: Use (S0 * 0.6) + (S-1 * 0.3) + (S-2 * 0.1)
  return (scores[0] * 0.6) + (scores[1] * 0.3) + (scores[2] * 0.1);
};

export const calculateSleepDebt = calculateWeightedMetric;

export const calculateFatigueScore = (scores: number[]) => {
  // Fatigue uses a 2-day weighted decay (70/30) as per CNS recovery model
  if (scores.length === 0) return 0;
  const f0 = scores[0];
  const f1 = scores.length > 1 ? scores[1] : f0; // Fallback to f0 if no history
  return (f0 * 0.7) + (f1 * 0.3);
};

export const calculateRecoveryImpact = (
  currentScore: number, 
  activity: RecoveryActivity, 
  sessionCount: number
) => {
  const boost = calculateRecoveryBoost(activity, sessionCount);
  return Math.min(100, Math.max(0, currentScore + boost));
};

export const calculateSystemReadiness = (
  history: any[],
  recoveryHistory: any[],
  subjectiveReadiness: any | null,
  profileProgramResetAt: number | undefined,
  unit: 'metric' | 'imperial',
  userWeight?: number
) => {
  let systemReadiness = 100;

  const filteredHistory = profileProgramResetAt
    ? history.filter(s => (s.completedAt || 0) > profileProgramResetAt)
    : history;

  let cumulativeFatigueScore = 0;
  const last24hTotalHistory = recoveryHistory.filter(r =>
    (Date.now() - r.timestamp) / 3600000 < 24
  );
  cumulativeFatigueScore = last24hTotalHistory.reduce((sum, r) => sum + r.rpe, 0);

  let k_fatigue = 0.04;
  let k_stress = 0.04;

  const last72hRecovery = recoveryHistory.filter(r =>
    (Date.now() - r.timestamp) / 3600000 < 72
  );

  last72hRecovery.forEach(recovery => {
    const activityDef = RECOVERY_MAP.find(a => a.id === recovery.activityId);
    if (activityDef) {
      const avgBoost = (activityDef.boostRange[0] + activityDef.boostRange[1]) / 2;
      const multiplier = 1 + (avgBoost / 10);
      if (activityDef.targets.includes('fatigue')) k_fatigue *= multiplier;
      if (activityDef.targets.includes('stress')) k_stress *= multiplier;
    }
  });

  let currentFatigue = 0;
  const recentSessions = filteredHistory.slice(0, 5);
  
  recentSessions.forEach(session => {
    if (session.completedAt) {
      const t = Math.max(0, (Date.now() - session.completedAt) / 3600000);
      
      let volumeVal = 0;
      let rpeSum = 0;
      let rpeCount = 0;

      session.exercises?.forEach((ex: any) => {
        const isCalisthenics = EXERCISE_DATABASE.find(e => e.id === ex.exerciseId)?.isCalisthenics;
        ex.sets?.forEach((s: any) => {
          if (s.isCompleted && !s.isWarmup) {
            let weight = parseFloat(s.weight) || 0;
            if (isCalisthenics) {
              const bw = userWeight || (unit === 'imperial' ? 100 : 45);
              weight = weight + bw;
            } else if (weight <= 0) {
              weight = 0; // If they did 0 weight for a non-calisthenics, it shouldn't magically get bulk volume
            }
            const reps = parseInt(s.reps) || 0;
            volumeVal += weight * reps;
            const sRpe = parseFloat(s.rpe) || 0;
            if (sRpe > 0) {
              rpeSum += sRpe;
              rpeCount += 1;
            }
          }
        });
      });

      let avgRpe = 7;
      if (session.reflectionSaved && session.actualRpe !== undefined && session.actualRpe > 0) {
        avgRpe = session.actualRpe;
      } else if (session.rpe !== undefined && session.rpe > 0) {
        avgRpe = session.rpe;
      } else {
        avgRpe = rpeCount > 0 ? rpeSum / rpeCount : 7;
      }
      
      const rpeExertionFactor = Math.pow(avgRpe / 8, 2);
      
      // Sub-linear volume scaling: high volume shouldn't linearly destroy readiness.
      // E.g., 30000^0.8 ≈ 3804. 10000^0.8 ≈ 1584.
      const scaledVolume = Math.pow(volumeVal, 0.8);
      
      const intensityScale = unit === 'imperial' ? 1000 : 550;
      const normalizedIntensity = (scaledVolume * avgRpe * rpeExertionFactor) / intensityScale;
      
      currentFatigue += normalizedIntensity * Math.exp(-k_fatigue * t);
    }
  });

  currentFatigue = Math.min(70, currentFatigue);
  const fatiguePenalty = 1.0 + currentFatigue;

  let stressPenalty = 1.0;
  let sleepDeficit = 0;
  let subjectiveFatigueDeficit = 0;
  let sorenessMultiplier = 1.0;
  let moodMultiplier = 1.0;

  if (subjectiveReadiness) {
    const t_stress = Math.max(0, (Date.now() - (subjectiveReadiness.timestamp || Date.now())) / 3600000);
    const subjectiveStressDeficit = (5 - (subjectiveReadiness.stress || 5)) * 4;
    stressPenalty = 1.0 + subjectiveStressDeficit * Math.exp(-k_stress * t_stress);
    sleepDeficit = (5 - (subjectiveReadiness.sleep || 5)) * 5;
    subjectiveFatigueDeficit = (5 - (subjectiveReadiness.fatigue || 5)) * 4;

    const soreness = subjectiveReadiness.soreness !== undefined ? subjectiveReadiness.soreness : 5;
    if (soreness <= 1) sorenessMultiplier = 0.85;
    else if (soreness === 2) sorenessMultiplier = 0.90;
    else if (soreness === 3) sorenessMultiplier = 0.95;
    else if (soreness === 4) sorenessMultiplier = 1.00;
    else if (soreness >= 5) sorenessMultiplier = 1.02;

    const mood = subjectiveReadiness.mood !== undefined ? subjectiveReadiness.mood : 5;
    if (mood <= 1) moodMultiplier = 0.90;
    else if (mood === 2) moodMultiplier = 0.95;
    else if (mood === 3) moodMultiplier = 1.00;
    else if (mood === 4) moodMultiplier = 1.02;
    else if (mood >= 5) moodMultiplier = 1.05;
  }

  systemReadiness = 100 - sleepDeficit - fatiguePenalty - stressPenalty - subjectiveFatigueDeficit;
  systemReadiness = systemReadiness * sorenessMultiplier * moodMultiplier;
  const currentReadiness = Math.round(Math.max(0, Math.min(100, systemReadiness)));

  let readinessModifier = 1.0;
  if (currentReadiness >= 90) readinessModifier = 1.05;
  else if (currentReadiness >= 80) readinessModifier = 1.00;
  else if (currentReadiness >= 70) readinessModifier = 0.95;
  else if (currentReadiness >= 50) readinessModifier = 0.90;
  else readinessModifier = 0.80;

  const isRedline = cumulativeFatigueScore >= 18;
  let recommendedRpe = 7.5;
  
  if (currentReadiness >= 95) recommendedRpe = 9.5;
  else if (currentReadiness >= 90) recommendedRpe = 9.0;
  else if (currentReadiness >= 80) recommendedRpe = 8.5;
  else if (currentReadiness >= 70) recommendedRpe = 8.0;
  else if (currentReadiness >= 60) recommendedRpe = 7.5;
  else if (currentReadiness >= 50) recommendedRpe = 7.0;
  else recommendedRpe = 6.0;

  if (isRedline) {
    readinessModifier = 0.75;
    recommendedRpe = Math.min(recommendedRpe, 5);
  }

  // Engineering Update: Proximity Penalty
  // High intensity (RPE >= 9) is prohibited if the last session was within 36 hours 
  // to prevent neural burnout in high-frequency tactical athletes.
  const mostRecent = filteredHistory[0];
  if (mostRecent && mostRecent.completedAt) {
    const hoursSinceLast = (Date.now() - mostRecent.completedAt) / 3600000;
    if (hoursSinceLast < 36) {
      recommendedRpe = Math.min(recommendedRpe, 8.5);
    }
    // Severe proximity penalty for double-days
    if (hoursSinceLast < 12) {
      recommendedRpe = Math.min(recommendedRpe, 7.5);
    }
  }

  let overtrainingRisk: 'none' | 'warning' | 'critical' = 'none';
  let ewmaRatio: number | null = null;
  
  if (history.length > 0) {
    const dailyVolume: Record<string, number> = {};
    let minDate = Infinity;
    let maxDate = 0;

    history.forEach(session => {
        const date = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
        date.setHours(0, 0, 0, 0);
        const time = date.getTime();
        
        if (time < minDate) minDate = time;
        if (time > maxDate) maxDate = time;

        let sessionVolume = 0;
        session.exercises?.forEach((ex: any) => {
            ex.sets?.forEach((s: any) => {
                if (s.isCompleted && !s.isWarmup) {
                    sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
                }
            });
        });

        let sessionAverageRpe = 7;
        if (session.reflectionSaved && session.actualRpe !== undefined && session.actualRpe > 0) {
            sessionAverageRpe = session.actualRpe;
        } else if (session.rpe !== undefined && session.rpe > 0) {
            sessionAverageRpe = session.rpe;
        }
        
        const sessionScaledVolume = Math.pow(sessionVolume, 0.8);
        const intensity = unit === 'imperial' ? 1000 : 550;
        
        const rpeExertion = Math.pow(sessionAverageRpe / 8, 2);
        const load = (sessionScaledVolume * sessionAverageRpe * rpeExertion) / intensity;

        dailyVolume[time] = (dailyVolume[time] || 0) + load;
    });

    if (minDate !== Infinity) {
        const lambdaAcute = 2 / (7 + 1);
        const lambdaChronic = 2 / (28 + 1);

        let ewmaAcute = 0;
        let ewmaChronic = 0;

        for (let time = minDate; time <= maxDate; time += 86400000) {
            const loadToday = dailyVolume[time] || 0;
            
            if (time === minDate) {
                ewmaAcute = loadToday;
                ewmaChronic = loadToday;
            } else {
                ewmaAcute = loadToday * lambdaAcute + ewmaAcute * (1 - lambdaAcute);
                ewmaChronic = loadToday * lambdaChronic + ewmaChronic * (1 - lambdaChronic);
            }
        }

        ewmaRatio = ewmaChronic > 0 ? (ewmaAcute / ewmaChronic) : 1.0;
        ewmaRatio = Number(ewmaRatio.toFixed(2));

        if (ewmaRatio > 1.8 || currentReadiness < 20) overtrainingRisk = 'critical';
        else if (ewmaRatio > 1.55 || currentReadiness < 40) overtrainingRisk = 'warning';
    }
  }

  return {
    readinessScore: currentReadiness,
    readinessModifier,
    recommendedRpe,
    overtrainingRisk,
    isRedline,
    sleepDeficit,
    fatiguePenalty,
    stressPenalty,
    k_fatigue,
    k_stress,
    cumulativeFatigueScore,
    ewmaRatio
  };
};

export const getSuggestedActivities = (readinessScore: number) => {
  return RECOVERY_MAP
    .filter(act => readinessScore >= act.minReadiness && readinessScore <= act.maxReadiness + 20)
    .sort((a, b) => b.minReadiness - a.minReadiness) // Prioritize highest intensity available
    .slice(0, 3);
};
