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
    // Upgrade: Continuous proportional adaptation for intra-session discrepancies
    // Every 1.0 RPE deviation represents approximately a 1.25% strength adaptation
    if (Math.abs(rpeDiff) >= 0.5) {
      newMax += (currentMax * (rpeDiff * 0.0125)); 
    }
  }

  // 2. AMRAP-Based Adjustment
  if (performance.isAMRAP) {
    const repDiff = performance.actualReps - performance.targetReps;
    if (repDiff >= 3) {
      newMax += (currentMax * 0.05);
    } else if (repDiff < 0) {
      newMax -= (currentMax * 0.025);
    }
  }

  const maxAllowed = currentMax * (1 + MAX_INCREASE_PERCENT);
  if (newMax > maxAllowed) {
    newMax = maxAllowed;
  }

  return Math.round(newMax * 10) / 10;
}

export interface ObjectivePerformance {
  goal: string;
  targetReps?: number;
  actualReps?: number;
  weightUsed?: number;
  targetHeartRate?: number;
  actualHeartRate?: number;
  timeExceedingThreshold?: number; // percentage 0-100
  painScale?: number;
  exerciseName?: string;
}

export function generateAutoregulationFeedback(perf: ObjectivePerformance): { message: string, action: string, type: 'decrease' | 'swap' | 'none' } {
  if (perf.goal === 'pure_strength' || perf.goal === 'hypertrophy' || perf.goal === 'powerbuilding') {
    if (perf.targetReps !== undefined && perf.actualReps !== undefined) {
      const diff = perf.targetReps - perf.actualReps;
      if (diff >= 2) {
        return {
          message: `You missed your rep target by ${diff}, dropping weight by 5%.`,
          action: 'drop_weight_5_percent',
          type: 'decrease'
        };
      }
    }
  } else if (perf.goal === 'endurance' || perf.goal === 'tactical') {
    if (perf.timeExceedingThreshold !== undefined && perf.timeExceedingThreshold >= 40) {
      return {
        message: `Heart rate exceeded aerobic threshold for ${perf.timeExceedingThreshold}% of the movement; pace objective will be reduced by 30 seconds.`,
        action: 'reduce_pace_30s',
        type: 'decrease'
      };
    }
  } else if (perf.goal === 'prehab' || perf.goal === 'longevity') {
    if (perf.painScale !== undefined && perf.painScale > 4) {
      const exercise = perf.exerciseName || "movement";
      return {
        message: `Shoulder pain scale reported > 4 for ${exercise}. Automatically substituting with dumbbell neutral grip pressing.`,
        action: 'substitute_exercise_neutral_grip',
        type: 'swap'
      };
    }
  }
  
  return { message: "Performance within expected parameters. Maintaining current progression.", action: 'none', type: 'none' };
}

/**
 * Handles exercise substitution based on injury list and gym profile.
 */
export function getExerciseSubstitution(
  targetExerciseId: string, 
  injuryList: string[], 
  gymProfile: GymProfile
): string {
  // Mapping of primary movements to their swappable variations based on pattern and impact
  const substitutions: Record<string, string[]> = {
    'barbell_squat': ['squat_high_bar', 'squat_front', 'squat_safety_bar', 'squat_goblet'],
    'deadlift_conventional': ['deadlift_sumo', 'deadlift_hex_bar', 'rdl', 'stiff_leg_deadlift'],
    'bench_press': ['bench_press_close_grip', 'bench_press_incline', 'bench_press_dumbbell'],
    'overhead_press': ['push_press', 'seated_db_press', 'z_press', 'db_shoulder_press'],
    'pull_ups': ['lat_pulldowns', 'chin_ups', 'neutral_grip_pull_ups']
  };

  if (!injuryList.includes(targetExerciseId)) {
    return targetExerciseId; // No injury, proceed as normal
  }

  const alternatives = substitutions[targetExerciseId] || [];
  
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
