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
  REGENERATION = 'Regeneration',
  CAPACITY = 'Capacity',
  RESILIENCY = 'Resiliency',
  AEROBIC_BASE = 'Aerobic Base',
  THRESHOLD = 'Threshold',
  VO2_MAX = 'VO2 Max'
}

export enum TrainingTrack {
  TACTICAL = 'tactical',
  LONGEVITY = 'longevity',
  ENDURANCE = 'endurance'
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

export type HybridGoal = TrainingGoal | TrainingGoal[];

const getTrackForGoals = (goals: TrainingGoal[]): TrainingTrack => {
  if (goals.includes('longevity')) return TrainingTrack.LONGEVITY;
  // Future: if (goals.includes('endurance')) return TrainingTrack.ENDURANCE;
  return TrainingTrack.TACTICAL;
};

export const getPlanForDuration = (totalWeeks: number, goalOrGoals: HybridGoal = 'powerbuilding'): BlockDefinition[] => {
  const goals: TrainingGoal[] = Array.isArray(goalOrGoals) ? goalOrGoals : [goalOrGoals];
  const primaryGoal = goals[0] || 'powerbuilding';
  const track = getTrackForGoals(goals);
  
  const deloadWeeks = 1;
  const peakingWeeks = track === TrainingTrack.LONGEVITY ? 2 : (primaryGoal === 'peaking' ? Math.max(4, Math.floor(totalWeeks * 0.33)) : Math.max(3, Math.floor(totalWeeks * 0.25)));
  const remainingWeeks = totalWeeks - deloadWeeks - peakingWeeks;

  // Define block templates
  const blocks: Record<string, Partial<BlockDefinition>> = {
    [BlockType.FOUNDATION]: { type: BlockType.FOUNDATION, label: 'Foundation', baseIntensity: 0.60, baseReps: '12', baseSets: 3, intensityIncrementPerWeek: 0.02 },
    [BlockType.HYPERTROPHY]: { type: BlockType.HYPERTROPHY, label: 'Hypertrophy', baseIntensity: 0.68, baseReps: '10', baseSets: 3, intensityIncrementPerWeek: 0.02 },
    [BlockType.STRENGTH]: { type: BlockType.STRENGTH, label: 'Strength', baseIntensity: 0.78, baseReps: '5', baseSets: 4, intensityIncrementPerWeek: 0.025 },
    [BlockType.POWER]: { type: BlockType.POWER, label: 'Power', baseIntensity: 0.85, baseReps: '3', baseSets: 5, intensityIncrementPerWeek: 0.025 },
    [BlockType.CAPACITY]: { type: BlockType.CAPACITY, label: 'Capacity', baseIntensity: 0.65, baseReps: '15', baseSets: 3, intensityIncrementPerWeek: 0.015 },
    [BlockType.RESILIENCY]: { type: BlockType.RESILIENCY, label: 'Resiliency', baseIntensity: 0.72, baseReps: '10', baseSets: 4, intensityIncrementPerWeek: 0.015 },
    [BlockType.PEAKING]: { type: BlockType.PEAKING, label: 'Peaking', durationWeeks: peakingWeeks, baseIntensity: 0.90, baseReps: '1', baseSets: 5, intensityIncrementPerWeek: 0.03 },
    [BlockType.DELOAD]: { type: BlockType.DELOAD, label: 'Deload', durationWeeks: deloadWeeks, baseIntensity: 0.50, baseReps: '8', baseSets: 2, intensityIncrementPerWeek: 0 }
  };

  const plan: BlockDefinition[] = [];

  // Track-aware sequencing
  if (track === TrainingTrack.LONGEVITY) {
    plan.push({ ...blocks[BlockType.FOUNDATION], durationWeeks: Math.floor(remainingWeeks * 0.4) } as BlockDefinition);
    plan.push({ ...blocks[BlockType.CAPACITY], durationWeeks: Math.floor(remainingWeeks * 0.3) } as BlockDefinition);
    plan.push({ ...blocks[BlockType.RESILIENCY], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.7) } as BlockDefinition);
    plan.push({ ...blocks[BlockType.PEAKING], type: BlockType.REGENERATION, label: 'REGENERATION', baseIntensity: 0.60, baseReps: '12', baseSets: 3, durationWeeks: peakingWeeks } as BlockDefinition);
  } else {
    // TACTICAL / STRENGTH Track
    const hasStrength = goals.includes('pure_strength') || goals.includes('powerbuilding');
    const hasHypertrophy = goals.includes('hypertrophy') || goals.includes('powerbuilding');

    if (hasHypertrophy && hasStrength) {
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: Math.floor(remainingWeeks * 0.5) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.5) } as BlockDefinition);
    } else if (hasStrength) {
      plan.push({ ...blocks[BlockType.STRENGTH], durationWeeks: Math.floor(remainingWeeks * 0.6) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.POWER], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.6) } as BlockDefinition);
    } else {
      plan.push({ ...blocks[BlockType.FOUNDATION], durationWeeks: Math.floor(remainingWeeks * 0.3) } as BlockDefinition);
      plan.push({ ...blocks[BlockType.HYPERTROPHY], durationWeeks: remainingWeeks - Math.floor(remainingWeeks * 0.3) } as BlockDefinition);
    }

    // Dynamic Block 4 (Phase 4)
    let block4Label = 'PEAKING';
    let block4Type = BlockType.PEAKING;
    if (goals.includes('peaking')) {
      block4Label = 'COMPETITION';
      block4Type = BlockType.COMPETITION;
    } else if (goals.includes('hypertrophy')) {
      block4Label = 'OVERREACH';
      block4Type = BlockType.OVERREACH;
    } else if (goals.includes('powerbuilding')) {
      block4Label = 'MAX EFFORT';
      block4Type = BlockType.MAX_EFFORT;
    }

    plan.push({ ...blocks[BlockType.PEAKING], label: block4Label, type: block4Type, durationWeeks: peakingWeeks } as BlockDefinition);
  }

  plan.push(blocks[BlockType.DELOAD] as BlockDefinition);

  return plan.filter(b => b.durationWeeks > 0);
};

export const getBlockForWeek = (totalWeek: number, totalDurationWeeks: number = 12, goalOrGoals: HybridGoal = 'powerbuilding') => {
  const plan = getPlanForDuration(totalDurationWeeks, goalOrGoals);

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
