import { RecoveryActivity, RECOVERY_MAP } from '../data/recoveryActivities';

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

export const getSuggestedActivities = (readinessScore: number) => {
  return RECOVERY_MAP
    .filter(act => readinessScore >= act.minReadiness && readinessScore <= act.maxReadiness + 20)
    .sort((a, b) => b.minReadiness - a.minReadiness) // Prioritize highest intensity available
    .slice(0, 3);
};
