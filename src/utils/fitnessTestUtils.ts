import { UserProfile } from '../contexts/SettingsContext';
import { BlockType } from '../constants/periodization';

export interface FitnessTestInfo {
  testType: string;
  testLabel: string;
  daysRemaining: number;
  isUnlocked: boolean;
  targetDate: number;
  isFinalTest: boolean;
}

const getPhase = (typeStr: string): number => {
  const t = (typeStr || '').toLowerCase();
  if (['peaking', 'max effort', 'max_effort', 'overreach', 'competition'].includes(t)) return 5;
  if (['power', 'explosiveness', 'tactical', 'resiliency', 'vo2 max', 'vo2_max'].includes(t)) return 4;
  if (['strength', 'pure_strength', 'powerbuilding', 'threshold', 'pure strength'].includes(t)) return 3;
  if (['hypertrophy', 'aerobic base', 'capacity', 'endurance', 'volume'].includes(t)) return 2;
  return 1; // foundation, deload, regeneration, prehab
};

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

  const resetTime = profile.programResetAt || profile.createdAt || Date.now();
  let nextTargetWeeks = 0;
  let finalBlockTypeStr = (profile.trainingGoal as string) || 'powerbuilding';

  let isFinalTest = false;

  if (profile.customProgramBlocks && profile.customProgramBlocks.length > 0) {
    const blocks = profile.customProgramBlocks;
    let cumulativeWeeks = 0;
    const msElapsed = Date.now() - resetTime;
    const weeksElapsed = msElapsed / (1000 * 60 * 60 * 24 * 7);

    for (let i = 0; i < blocks.length; i++) {
      cumulativeWeeks += (blocks[i].durationWeeks || 0);
      const currentPhase = getPhase(blocks[i].type);
      const isLast = i === blocks.length - 1;
      const nextPhase = isLast ? 0 : getPhase(blocks[i + 1].type);

      // Trigger condition: end of program OR (Peak -> Base transition)
      let trigger = false;
      if (isLast) {
        trigger = true;
      } else if (currentPhase >= 3 && nextPhase === 2) {
        // Immediate drop to volume without deload
        trigger = true; 
      } else if (currentPhase === 1 && nextPhase === 2) {
        // We are on a deload/regeneration block dropping into volume.
        // It's possible we just peaked. Test at the end of this deload block.
        trigger = true;
      } else if (currentPhase >= 3 && nextPhase === 1) {
        const afterDeloadPhase = i + 2 < blocks.length ? getPhase(blocks[i + 2].type) : 0;
        if (afterDeloadPhase === 2 || afterDeloadPhase === 1) {
           // We'll test after the upcoming deload block instead of now.
        } else {
           // Just keep looking
        }
      }

      if (trigger) {
        const potentialTargetDate = resetTime + cumulativeWeeks * 7 * 24 * 60 * 60 * 1000;
        if (profile.lastFitnessTestAt && profile.lastFitnessTestAt > potentialTargetDate - (7 * 24 * 60 * 60 * 1000)) {
           continue; 
        }

        if (cumulativeWeeks >= weeksElapsed || isLast) {
           nextTargetWeeks = cumulativeWeeks;
           finalBlockTypeStr = blocks[i].type;
           isFinalTest = isLast;
           break;
        }
      }
    }
    
    if (nextTargetWeeks === 0) {
      nextTargetWeeks = cumulativeWeeks;
      finalBlockTypeStr = blocks[blocks.length - 1].type;
      isFinalTest = true;
    }

  } else {
    nextTargetWeeks = (profile.trainingDurationMonths || 3) * 4;
    isFinalTest = true;
  }

  const targetDate = resetTime + nextTargetWeeks * 7 * 24 * 60 * 60 * 1000;
  const msRemaining = targetDate - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isUnlocked = profile.devOverrideFitnessTest || profile.pendingFitnessTest || daysRemaining <= 0;

  let testType = 'none';
  let testLabel = 'No Test Requirement';
  const type = finalBlockTypeStr.toLowerCase();
  
  if (['powerbuilding', 'pure_strength', 'strength', 'hypertrophy', 'peaking', 'competition', 'max_effort'].includes(type)) {
    testType = 'big3';
    testLabel = '1RM Big 3 (Squat, Bench, Deadlift)';
  } else if (['endurance', 'capacity', 'aerobic base', 'threshold', 'vo2_max', 'vo2 max'].includes(type) || type === BlockType.AEROBIC_BASE || type === BlockType.THRESHOLD || type === BlockType.VO2_MAX) {
    testType = 'endurance';
    testLabel = 'Pacing / VO2 Max Estimation';
  } else if (['tactical', 'resiliency'].includes(type)) {
    testType = 'tactical';
    testLabel = 'All-Rounded Tactical / Resiliency ACFT';
  } else if (['longevity', 'foundation'].includes(type)) {
    testType = 'longevity';
    testLabel = 'Functional Mobility Baseline';
  } else if (['explosiveness', 'power'].includes(type)) {
    testType = 'explosiveness';
    testLabel = 'Explosive Output / Velocity';
  } else if (['prehab', 'retention', 'deload', 'regeneration'].includes(type)) {
    testType = 'none';
    testLabel = 'No test required for recovery/retention protocols.';
  } else {
    testType = 'big3';
    testLabel = '1RM Baseline Evaluation';
  }

  return {
    testType,
    testLabel,
    daysRemaining: profile.pendingFitnessTest ? 0 : daysRemaining,
    isUnlocked,
    targetDate,
    isFinalTest
  };
};
