import { UserProfile } from '../contexts/SettingsContext';
import { BlockType } from '../constants/periodization';

export interface FitnessTestInfo {
  testType: string;
  testLabel: string;
  daysRemaining: number;
  missionsRemaining: number;
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

export const getFitnessTestInfo = (profile: UserProfile | null, currentMissionTitle?: string): FitnessTestInfo => {
  if (!profile) {
    return {
      testType: 'none',
      testLabel: 'No Test',
      daysRemaining: 0,
      missionsRemaining: 0,
      isUnlocked: false,
      targetDate: Date.now(),
      isFinalTest: false
    };
  }

  let resetTime = Date.now();
  const rawReset = profile.programResetAt || profile.createdAt;
  if (rawReset) {
    if (typeof rawReset === 'number') {
      resetTime = rawReset;
    } else if (typeof rawReset === 'string') {
      resetTime = new Date(rawReset).getTime() || Date.now();
    } else if (typeof (rawReset as any).seconds === 'number') {
      resetTime = (rawReset as any).seconds * 1000;
    } else if (typeof (rawReset as any).toDate === 'function') {
      resetTime = (rawReset as any).toDate().getTime();
    }
  }

  let currentMissionWeek = 1;
  let currentMissionDay = 1;
  const frequency = profile.trainingFrequency || 3;
  if (currentMissionTitle) {
    const match = currentMissionTitle.match(/W(\d+)D(\d+)/);
    if (match) {
      currentMissionWeek = parseInt(match[1]);
      currentMissionDay = parseInt(match[2]);
    }
  }

  let nextTargetWeeks = 0;
  let finalBlockTypeStr = (profile.trainingGoal as string) || 'powerbuilding';

  let isFinalTest = false;

  if (profile.customProgramBlocks && profile.customProgramBlocks.length > 0) {
    const blocks = profile.customProgramBlocks;
    let cumulativeWeeks = 0;
    const weeksElapsed = Math.max(0, currentMissionWeek - 1);

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
        // If we recently did a fitness test (within 1 week physical time), skip this trigger
        if (profile.lastFitnessTestAt && profile.lastFitnessTestAt > Date.now() - (7 * 24 * 60 * 60 * 1000)) {
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

  const totalMissions = nextTargetWeeks * frequency;
  const completedMissions = ((currentMissionWeek - 1) * frequency) + (currentMissionDay - 1);
  const missionsRemaining = Math.max(0, totalMissions - completedMissions);

  // Calculate physical target date. We subtract trainingWeekOffset so that if they skipped ahead, 
  // the calendar target date correctly shrinks, while still ticking down in real physical time.
  const weekOffset = profile.trainingWeekOffset || 0;
  const targetDate = resetTime + (nextTargetWeeks - weekOffset) * 7 * 24 * 60 * 60 * 1000;
  const msRemaining = targetDate - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  
  const isUnlocked = profile.devOverrideFitnessTest || profile.pendingFitnessTest || daysRemaining <= 0 || missionsRemaining <= 0;

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
  } else if (['prehab', 'retention', 'Strength Retention', 'Endurance Retention', 'deload', 'regeneration'].includes(type) || ['Strength Retention', 'Endurance Retention'].some(r => type.includes(r))) {
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
    missionsRemaining: profile.pendingFitnessTest ? 0 : missionsRemaining,
    isUnlocked,
    targetDate,
    isFinalTest
  };
};
