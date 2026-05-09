export type TrainingAge = 'novice' | 'intermediate' | 'advanced';
export type GymProfile = 'commercial' | 'powerlifting' | 'home';

export interface ReadinessScore {
  sleep: number; // 1-5
  stress: number; // 1-5
  soreness: number; // 1-5
}

export interface LiftPerformance {
  exerciseId: string;
  targetRPE: number;
  actualRPE: number;
  targetReps: number;
  actualReps: number;
  weightUsed: number;
  isAMRAP: boolean;
}

export interface UserOnboardingData {
  trainingAge: TrainingAge;
  squat1RM: number;
  bench1RM: number;
  deadlift1RM: number;
  bodyweight: number;
  gymProfile: GymProfile;
  injuryNoGoList: string[]; // Array of exercise IDs to avoid
  meetDate?: number; // Unix timestamp
}

export type LogicEngineType = 'linear_5x5' | 'submax_531' | 'block_periodization';

export interface TrainingState {
  engineType: LogicEngineType;
  currentWeek: number;
  currentBlock: 'hypertrophy' | 'strength' | 'peaking' | 'deload';
  trainingMaxes: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  missedSessionsCounter: number;
}

// --- Core Logic Functions ---

/**
 * Assigns the appropriate Logic Engine based on onboarding data.
 */
export function assignLogicEngine(data: UserOnboardingData): LogicEngineType {
  if (data.meetDate) {
    // If they have a competition timeline, use Block Periodization to peak them
    return 'block_periodization';
  }
  
  if (data.trainingAge === 'novice') {
    return 'linear_5x5';
  }
  
  return 'submax_531';
}

/**
 * Calculates the readiness modifier based on the pre-session survey.
 * Returns a multiplier (e.g., 0.9 for a 10% reduction).
 */
export function calculateReadinessModifier(score: ReadinessScore): number {
  const total = score.sleep + score.stress + score.soreness;
  // Max score is 15. 
  // If score is very low (e.g., < 7), trigger Low Energy Mode
  if (total <= 7) {
    return 0.90; // 10% reduction
  } else if (total <= 10) {
    return 0.95; // 5% reduction
  }
  return 1.0; // Normal programming
}

/**
 * Autoregulates the Training Max for the next session based on intra-set feedback.
 */
export function autoregulateTrainingMax(
  currentMax: number, 
  performance: LiftPerformance,
  engine: LogicEngineType
): number {
  let newMax = currentMax;
  const MAX_INCREASE_PERCENT = 0.10; // 10% safety guardrail

  // 1. RPE-Based Adjustment
  if (!performance.isAMRAP) {
    const rpeDiff = performance.targetRPE - performance.actualRPE;
    if (rpeDiff >= 2) {
      // It was much easier than expected. Increase max slightly.
      newMax += (currentMax * 0.025); // 2.5% bump
    } else if (rpeDiff <= -2) {
      // It was much harder than expected. Decrease max.
      newMax -= (currentMax * 0.025);
    }
  }

  // 2. AMRAP-Based Adjustment
  if (performance.isAMRAP) {
    const repDiff = performance.actualReps - performance.targetReps;
    if (repDiff >= 3) {
      // Crushed the AMRAP. Significant bump.
      newMax += (currentMax * 0.05); // 5% bump
    } else if (repDiff < 0) {
      // Missed target reps.
      newMax -= (currentMax * 0.025);
    }
  }

  // Apply Safety Guardrail
  const maxAllowed = currentMax * (1 + MAX_INCREASE_PERCENT);
  if (newMax > maxAllowed) {
    newMax = maxAllowed;
  }

  return Math.round(newMax * 10) / 10; // Round to nearest decimal
}

/**
 * Handles exercise substitution based on injury list and gym profile.
 */
export function getExerciseSubstitution(
  targetExerciseId: string, 
  injuryList: string[], 
  gymProfile: GymProfile
): string {
  // Example Substitution Map
  const swapMap: Record<string, string[]> = {
    'squat_conventional': ['squat_high_bar', 'squat_safety_bar', 'leg_press'],
    'deadlift_conventional': ['deadlift_sumo', 'deadlift_hex_bar', 'rdl'],
    'bench_flat': ['bench_incline', 'dumbbell_press', 'machine_chest_press']
  };

  if (!injuryList.includes(targetExerciseId)) {
    return targetExerciseId; // No injury, proceed as normal
  }

  const alternatives = swapMap[targetExerciseId] || [];
  
  for (const alt of alternatives) {
    if (!injuryList.includes(alt)) {
      // Check gym profile constraints (e.g., commercial gyms might not have a safety bar)
      if (alt === 'squat_safety_bar' && gymProfile === 'commercial') {
        continue;
      }
      return alt;
    }
  }

  return 'rest'; // Fallback if all options are exhausted
}

/**
 * Evaluates if a Pivot Week (Deload) is needed.
 */
export function evaluatePivotLogic(state: TrainingState): boolean {
  if (state.missedSessionsCounter >= 3) {
    return true; // Trigger Pivot Week
  }
  return false;
}
