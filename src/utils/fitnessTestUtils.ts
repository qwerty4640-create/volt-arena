import { UserProfile } from '../contexts/SettingsContext';
import { BlockType } from '../constants/periodization';

export interface FitnessTestInfo {
  testType: string;
  testLabel: string;
  daysRemaining: number;
  isUnlocked: boolean;
  targetDate: number;
}

export const getFitnessTestInfo = (profile: UserProfile | null): FitnessTestInfo => {
  if (!profile) {
    return {
      testType: 'none',
      testLabel: 'No Test',
      daysRemaining: 0,
      isUnlocked: false,
      targetDate: Date.now()
    };
  }

  // 1. Calculate program end date
  const resetTime = profile.programResetAt || Date.now();
  let totalWeeks = 0;

  if (profile.customProgramBlocks && profile.customProgramBlocks.length > 0) {
    totalWeeks = profile.customProgramBlocks.reduce((acc, block) => acc + (block.durationWeeks || 0), 0);
  } else {
    totalWeeks = (profile.trainingDurationMonths || 3) * 4;
  }

  const targetDate = resetTime + totalWeeks * 7 * 24 * 60 * 60 * 1000;
  const msRemaining = targetDate - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isUnlocked = profile.devOverrideFitnessTest || daysRemaining <= 0;

  // 2. Determine Test Type
  // Find the last block type in custom program, or use the primary training goal.
  let finalBlockTypeStr: string = (profile.trainingGoal as string) || 'powerbuilding';
  
  if (profile.customProgramBlocks && profile.customProgramBlocks.length > 0) {
    const lastBlock = profile.customProgramBlocks[profile.customProgramBlocks.length - 1];
    if (lastBlock && lastBlock.type) {
      finalBlockTypeStr = lastBlock.type;
    }
  }

  // Determine actual test type based on the rules
  let testType = 'none';
  let testLabel = 'No Test Requirement';

  const type = finalBlockTypeStr.toLowerCase();
  
  // Powerbuilding / Pure Strength / Hypertrophy / Peaking -> Big 3 1RM
  if (['powerbuilding', 'pure_strength', 'strength', 'hypertrophy', 'peaking', 'competition', 'max_effort'].includes(type)) {
    testType = 'big3';
    testLabel = '1RM Big 3 (Squat, Bench, Deadlift)';
  } 
  // Endurance / Capacity / Aerobic Base -> Max Output / Pacing / VO2 Estimation
  else if (['endurance', 'capacity', 'aerobic base', 'threshold', 'vo2_max', 'vo2 max'].includes(type) || type === BlockType.AEROBIC_BASE || type === BlockType.THRESHOLD || type === BlockType.VO2_MAX) {
    testType = 'endurance';
    testLabel = 'Pacing / VO2 Max Estimation';
  }
  // Tactical / Resiliency -> All-Rounded capability and conditioning challenge
  else if (['tactical', 'resiliency'].includes(type)) {
    testType = 'tactical';
    testLabel = 'All-Rounded Tactical / Resiliency ACFT';
  }
  // Longevity / Foundation -> Functional mobility and low-intensity baseline tests
  else if (['longevity', 'foundation'].includes(type)) {
    testType = 'longevity';
    testLabel = 'Functional Mobility Baseline';
  }
  // Explosiveness / Power -> Explosive output and velocity testing
  else if (['explosiveness', 'power'].includes(type)) {
    testType = 'explosiveness';
    testLabel = 'Explosive Output / Velocity';
  }
  // Prehab / Retention / Deload / Regeneration -> No test required
  else if (['prehab', 'retention', 'deload', 'regeneration'].includes(type)) {
    testType = 'none';
    testLabel = 'No test required for recovery/retention protocols.';
  } else {
    // Default fallback
    testType = 'big3';
    testLabel = '1RM Baseline Evaluation';
  }

  return {
    testType,
    testLabel,
    daysRemaining,
    isUnlocked,
    targetDate
  };
};
