import { TrainingGoal } from '../contexts/SettingsContext';

export enum BlockType {
  FOUNDATION = 'Foundation',
  HYPERTROPHY = 'Hypertrophy',
  STRENGTH = 'Strength',
  POWER = 'Power',
  PEAKING = 'Peaking',
  DELOAD = 'Deload'
}

export interface BlockDefinition {
  type: BlockType;
  durationWeeks: number;
  baseIntensity: number; // 0.0 to 1.0
  baseReps: string;
  baseSets: number;
  intensityIncrementPerWeek: number;
}

export const getPlanForDuration = (totalWeeks: number, goal: TrainingGoal = 'powerbuilding'): BlockDefinition[] => {
  const deloadWeeks = 1;
  const peakingWeeks = goal === 'peaking' ? Math.max(4, Math.floor(totalWeeks * 0.3)) : Math.max(2, Math.floor(totalWeeks * 0.15));
  const remainingWeeks = totalWeeks - deloadWeeks - peakingWeeks;

  // Define block templates
  const blocks: Record<BlockType, BlockDefinition> = {
    [BlockType.FOUNDATION]: {
      type: BlockType.FOUNDATION,
      durationWeeks: 0,
      baseIntensity: 0.60,
      baseReps: '12',
      baseSets: 3,
      intensityIncrementPerWeek: 0.02
    },
    [BlockType.HYPERTROPHY]: {
      type: BlockType.HYPERTROPHY,
      durationWeeks: 0,
      baseIntensity: 0.68,
      baseReps: '10',
      baseSets: 3,
      intensityIncrementPerWeek: 0.02
    },
    [BlockType.STRENGTH]: {
      type: BlockType.STRENGTH,
      durationWeeks: 0,
      baseIntensity: 0.78,
      baseReps: '5',
      baseSets: 4,
      intensityIncrementPerWeek: 0.025
    },
    [BlockType.POWER]: {
      type: BlockType.POWER,
      durationWeeks: 0,
      baseIntensity: 0.85,
      baseReps: '3',
      baseSets: 5,
      intensityIncrementPerWeek: 0.025
    },
    [BlockType.PEAKING]: {
      type: BlockType.PEAKING,
      durationWeeks: peakingWeeks,
      baseIntensity: 0.90,
      baseReps: '1',
      baseSets: 5,
      intensityIncrementPerWeek: 0.03
    },
    [BlockType.DELOAD]: {
      type: BlockType.DELOAD,
      durationWeeks: deloadWeeks,
      baseIntensity: 0.50,
      baseReps: '8',
      baseSets: 2,
      intensityIncrementPerWeek: 0
    }
  };

  // Adjust durations based on goal
  const plan: BlockDefinition[] = [];

  switch (goal) {
    case 'pure_strength':
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: Math.floor(remainingWeeks * 0.6) });
      plan.push({ ...blocks[BlockType.POWER], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.6) });
      break;
    case 'hypertrophy':
      plan.push({ ...blocks[BlockType.FOUNDATION], durationWeeks: Math.floor(remainingWeeks * 0.3) });
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.3) });
      break;
    case 'peaking':
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: Math.floor(remainingWeeks * 0.4) });
      plan.push({ ...blocks[BlockType.POWER], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.4) });
      break;
    case 'longevity':
      plan.push({ ...blocks[BlockType.FOUNDATION], durationWeeks: Math.floor(remainingWeeks * 0.5) });
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.5) });
      break;
    case 'powerbuilding':
    default:
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: Math.floor(remainingWeeks * 0.5) });
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.5) });
      break;
  }

  plan.push(blocks[BlockType.PEAKING]);
  plan.push(blocks[BlockType.DELOAD]);

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
