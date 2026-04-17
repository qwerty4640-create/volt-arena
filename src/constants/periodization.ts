import { TrainingGoal } from '../contexts/SettingsContext';

export enum BlockType {
  FOUNDATION = 'Foundation',
  HYPERTROPHY = 'Hypertrophy',
  STRENGTH = 'Strength',
  POWER = 'Power',
  PEAKING = 'Peaking',
  DELOAD = 'Deload',
  MAX_EFFORT = 'Max Effort',
  OVERREACH = 'Overreach',
  COMPETITION = 'Competition / Taper',
  REGENERATION = 'Regeneration'
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  durationWeeks: number;
  baseIntensity: number; // 0.0 to 1.0
  baseReps: string;
  baseSets: number;
  intensityIncrementPerWeek: number;
}

export const getPlanForDuration = (totalWeeks: number, goal: TrainingGoal = 'powerbuilding'): BlockDefinition[] => {
  const deloadWeeks = 1;
  const peakingWeeks = goal === 'peaking' ? Math.max(4, Math.floor(totalWeeks * 0.33)) : Math.max(3, Math.floor(totalWeeks * 0.25));
  const remainingWeeks = totalWeeks - deloadWeeks - peakingWeeks;

  // Define block templates
  const blocks: Record<string, Partial<BlockDefinition>> = {
    [BlockType.FOUNDATION]: {
      type: BlockType.FOUNDATION,
      label: 'Foundation',
      durationWeeks: 0,
      baseIntensity: 0.60,
      baseReps: '12',
      baseSets: 3,
      intensityIncrementPerWeek: 0.02
    },
    [BlockType.HYPERTROPHY]: {
      type: BlockType.HYPERTROPHY,
      label: 'Hypertrophy',
      durationWeeks: 0,
      baseIntensity: 0.68,
      baseReps: '10',
      baseSets: 3,
      intensityIncrementPerWeek: 0.02
    },
    [BlockType.STRENGTH]: {
      type: BlockType.STRENGTH,
      label: 'Strength',
      durationWeeks: 0,
      baseIntensity: 0.78,
      baseReps: '5',
      baseSets: 4,
      intensityIncrementPerWeek: 0.025
    },
    [BlockType.POWER]: {
      type: BlockType.POWER,
      label: 'Power',
      durationWeeks: 0,
      baseIntensity: 0.85,
      baseReps: '3',
      baseSets: 5,
      intensityIncrementPerWeek: 0.025
    },
    [BlockType.PEAKING]: {
      type: BlockType.PEAKING,
      label: 'Peaking',
      durationWeeks: peakingWeeks,
      baseIntensity: 0.90,
      baseReps: '1',
      baseSets: 5,
      intensityIncrementPerWeek: 0.03
    },
    [BlockType.DELOAD]: {
      type: BlockType.DELOAD,
      label: 'Deload',
      durationWeeks: deloadWeeks,
      baseIntensity: 0.50,
      baseReps: '8',
      baseSets: 2,
      intensityIncrementPerWeek: 0
    }
  };

  // Adjust durations and labels based on goal
  const plan: BlockDefinition[] = [];

  switch (goal) {
    case 'pure_strength':
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: Math.floor(remainingWeeks * 0.6) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.POWER], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.6) } as BlockDefinition);
      break;
    case 'hypertrophy':
      plan.push({ ...blocks[BlockType.FOUNDATION], durationWeeks: Math.floor(remainingWeeks * 0.3) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.3) } as BlockDefinition);
      break;
    case 'peaking':
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: Math.floor(remainingWeeks * 0.4) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.POWER], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.4) } as BlockDefinition);
      break;
    case 'longevity':
      plan.push({ ...blocks[BlockType.FOUNDATION], durationWeeks: Math.floor(remainingWeeks * 0.5) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.5) } as BlockDefinition);
      break;
    case 'powerbuilding':
    default:
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: Math.floor(remainingWeeks * 0.5) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.5) } as BlockDefinition);
      break;
  }

  // Define Block 4 (Phase 4) label and config based on goal
  let block4: BlockDefinition;
  switch (goal) {
    case 'pure_strength':
      block4 = { ...blocks[BlockType.PEAKING], type: BlockType.PEAKING, label: 'PEAKING', baseReps: '2', baseIntensity: 0.92 } as BlockDefinition;
      break;
    case 'powerbuilding':
      block4 = { ...blocks[BlockType.PEAKING], type: BlockType.MAX_EFFORT, label: 'MAX EFFORT', baseReps: '3', baseIntensity: 0.88 } as BlockDefinition;
      break;
    case 'hypertrophy':
      block4 = { ...blocks[BlockType.PEAKING], type: BlockType.OVERREACH, label: 'OVERREACH', baseReps: '8', baseIntensity: 0.72, baseSets: 4, intensityIncrementPerWeek: 0.01 } as BlockDefinition;
      break;
    case 'peaking':
      block4 = { ...blocks[BlockType.PEAKING], type: BlockType.COMPETITION, label: 'COMPETITION / TAPER', baseReps: '1', baseIntensity: 0.95, intensityIncrementPerWeek: 0.02 } as BlockDefinition;
      break;
    case 'longevity':
      block4 = { ...blocks[BlockType.PEAKING], type: BlockType.REGENERATION, label: 'REGENERATION', baseIntensity: 0.60, baseReps: '12', baseSets: 3, intensityIncrementPerWeek: 0 } as BlockDefinition;
      break;
    default:
      block4 = { ...blocks[BlockType.PEAKING], label: 'PEAKING' } as BlockDefinition;
  }

  plan.push(block4);
  plan.push(blocks[BlockType.DELOAD] as BlockDefinition);

  return plan.filter(b => b.durationWeeks > 0);
};

export const getBlockForWeek = (totalWeek: number, totalDurationWeeks: number = 12, goal: TrainingGoal = 'powerbuilding') => {
  const plan = getPlanForDuration(totalDurationWeeks, goal);
  let accumulatedWeeks = 0;
  const cycleLength = plan.reduce((acc, block) => acc + block.durationWeeks, 0);
  const currentCycleWeek = ((totalWeek - 1) % cycleLength) + 1;

  for (const block of plan) {
    accumulatedWeeks += block.durationWeeks;
    if (currentCycleWeek <= accumulatedWeeks) {
      const weekInBlock = currentCycleWeek - (accumulatedWeeks - block.durationWeeks);
      return {
        block,
        weekInBlock,
        totalWeek,
        plan
      };
    }
  }

  // Fallback
  return {
    block: plan[0],
    weekInBlock: 1,
    totalWeek,
    plan
  };
};
