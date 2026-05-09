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
  VO2_MAX = 'VO2 Max',
  // Goal-based Blocks
  PURE_STRENGTH = 'pure_strength',
  POWERBUILDING = 'powerbuilding',
  LONGEVITY = 'longevity',
  TACTICAL = 'tactical',
  EXPLOSIVENESS = 'explosiveness',
  ENDURANCE = 'endurance',
  PREHAB = 'prehab',
  RETENTION = 'Retention'
}

export enum TrainingTrack {
  STRENGTH = 'strength',
  LONGEVITY = 'longevity',
  ENDURANCE = 'endurance',
  TACTICAL = 'tactical',
  EXPLOSION = 'explosion'
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

export const BLOCK_TEMPLATES: Record<string, Partial<BlockDefinition>> = {
  [BlockType.FOUNDATION]: { type: BlockType.FOUNDATION, label: 'Foundation', baseIntensity: 0.60, baseReps: '12', baseSets: 3, intensityIncrementPerWeek: 0.02 },
  [BlockType.HYPERTROPHY]: { type: BlockType.HYPERTROPHY, label: 'Hypertrophy', baseIntensity: 0.68, baseReps: '10', baseSets: 3, intensityIncrementPerWeek: 0.02 },
  [BlockType.STRENGTH]: { type: BlockType.STRENGTH, label: 'Strength', baseIntensity: 0.78, baseReps: '5', baseSets: 4, intensityIncrementPerWeek: 0.025 },
  [BlockType.POWER]: { type: BlockType.POWER, label: 'Power', baseIntensity: 0.85, baseReps: '3', baseSets: 5, intensityIncrementPerWeek: 0.025 },
  [BlockType.CAPACITY]: { type: BlockType.CAPACITY, label: 'Capacity', baseIntensity: 0.65, baseReps: '15', baseSets: 3, intensityIncrementPerWeek: 0.015 },
  [BlockType.RESILIENCY]: { type: BlockType.RESILIENCY, label: 'Resiliency', baseIntensity: 0.72, baseReps: '10', baseSets: 4, intensityIncrementPerWeek: 0.015 },
  [BlockType.AEROBIC_BASE]: { type: BlockType.AEROBIC_BASE, label: 'Aerobic Base', baseIntensity: 0.65, baseReps: '30 min', baseSets: 1, intensityIncrementPerWeek: 0.01 },
  [BlockType.THRESHOLD]: { type: BlockType.THRESHOLD, label: 'Threshold', baseIntensity: 0.80, baseReps: '5 min', baseSets: 4, intensityIncrementPerWeek: 0.02 },
  [BlockType.VO2_MAX]: { type: BlockType.VO2_MAX, label: 'VO2 Max', baseIntensity: 0.95, baseReps: '1 min', baseSets: 6, intensityIncrementPerWeek: 0.02 },
  [BlockType.PEAKING]: { type: BlockType.PEAKING, label: 'Peaking', baseIntensity: 0.90, baseReps: '1', baseSets: 5, intensityIncrementPerWeek: 0.03 },
  [BlockType.DELOAD]: { type: BlockType.DELOAD, label: 'Deload', baseIntensity: 0.50, baseReps: '8', baseSets: 2, intensityIncrementPerWeek: 0 },
  [BlockType.REGENERATION]: { type: BlockType.REGENERATION, label: 'Regeneration', baseIntensity: 0.55, baseReps: '12', baseSets: 3, intensityIncrementPerWeek: 0.01 },
  [BlockType.MAX_EFFORT]: { type: BlockType.MAX_EFFORT, label: 'Max Effort', baseIntensity: 0.92, baseReps: '1-3', baseSets: 3, intensityIncrementPerWeek: 0.03 },
  [BlockType.OVERREACH]: { type: BlockType.OVERREACH, label: 'Overreach', baseIntensity: 0.82, baseReps: '8', baseSets: 5, intensityIncrementPerWeek: 0.025 },
  [BlockType.COMPETITION]: { type: BlockType.COMPETITION, label: 'Competition', baseIntensity: 0.95, baseReps: '1', baseSets: 3, intensityIncrementPerWeek: 0 },
  [BlockType.PURE_STRENGTH]: { type: BlockType.PURE_STRENGTH as BlockType, label: 'Pure Strength', baseIntensity: 0.85, baseReps: '3', baseSets: 5, intensityIncrementPerWeek: 0.015 },
  [BlockType.POWERBUILDING]: { type: BlockType.POWERBUILDING as BlockType, label: 'Powerbuilding', baseIntensity: 0.75, baseReps: '8', baseSets: 4, intensityIncrementPerWeek: 0.015 },
  [BlockType.LONGEVITY]: { type: BlockType.LONGEVITY as BlockType, label: 'Longevity', baseIntensity: 0.65, baseReps: '12', baseSets: 3, intensityIncrementPerWeek: 0.01 },
  [BlockType.TACTICAL]: { type: BlockType.TACTICAL as BlockType, label: 'Tactical', baseIntensity: 0.75, baseReps: '10', baseSets: 4, intensityIncrementPerWeek: 0.015 },
  [BlockType.EXPLOSIVENESS]: { type: BlockType.EXPLOSIVENESS as BlockType, label: 'Explosiveness', baseIntensity: 0.80, baseReps: '3', baseSets: 5, intensityIncrementPerWeek: 0.02 },
  [BlockType.ENDURANCE]: { type: BlockType.ENDURANCE as BlockType, label: 'Endurance', baseIntensity: 0.65, baseReps: '20', baseSets: 3, intensityIncrementPerWeek: 0.01 },
  [BlockType.PREHAB]: { type: BlockType.PREHAB as BlockType, label: 'Prehab/Rehab', baseIntensity: 0.55, baseReps: '15', baseSets: 3, intensityIncrementPerWeek: 0.01 },
  [BlockType.RETENTION]: { type: BlockType.RETENTION as BlockType, label: 'Retention Protocol', baseIntensity: 0.85, baseReps: '3', baseSets: 2, intensityIncrementPerWeek: 0 }
};

const GOAL_EXPANSIONS: Record<string, { type: BlockType; ratio: number }[]> = {
  [BlockType.PURE_STRENGTH]: [
    { type: BlockType.FOUNDATION, ratio: 0.15 },
    { type: BlockType.STRENGTH, ratio: 0.55 },
    { type: BlockType.PEAKING, ratio: 0.2 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.POWERBUILDING]: [
    { type: BlockType.FOUNDATION, ratio: 0.15 },
    { type: BlockType.HYPERTROPHY, ratio: 0.35 },
    { type: BlockType.STRENGTH, ratio: 0.3 },
    { type: BlockType.MAX_EFFORT, ratio: 0.1 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.HYPERTROPHY]: [
    { type: BlockType.FOUNDATION, ratio: 0.2 },
    { type: BlockType.HYPERTROPHY, ratio: 0.6 },
    { type: BlockType.OVERREACH, ratio: 0.1 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.PEAKING]: [
    { type: BlockType.STRENGTH, ratio: 0.4 },
    { type: BlockType.PEAKING, ratio: 0.4 },
    { type: BlockType.COMPETITION, ratio: 0.1 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.LONGEVITY]: [
    { type: BlockType.FOUNDATION, ratio: 0.4 },
    { type: BlockType.CAPACITY, ratio: 0.3 },
    { type: BlockType.REGENERATION, ratio: 0.2 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.TACTICAL]: [
    { type: BlockType.FOUNDATION, ratio: 0.3 },
    { type: BlockType.CAPACITY, ratio: 0.3 },
    { type: BlockType.STRENGTH, ratio: 0.2 },
    { type: BlockType.RESILIENCY, ratio: 0.1 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.EXPLOSIVENESS]: [
    { type: BlockType.FOUNDATION, ratio: 0.2 },
    { type: BlockType.POWER, ratio: 0.4 },
    { type: BlockType.STRENGTH, ratio: 0.3 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.ENDURANCE]: [
    { type: BlockType.AEROBIC_BASE, ratio: 0.5 },
    { type: BlockType.THRESHOLD, ratio: 0.3 },
    { type: BlockType.VO2_MAX, ratio: 0.1 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.PREHAB]: [
    { type: BlockType.FOUNDATION, ratio: 0.5 },
    { type: BlockType.REGENERATION, ratio: 0.4 },
    { type: BlockType.DELOAD, ratio: 0.1 }
  ],
  [BlockType.RETENTION]: [
     { type: BlockType.STRENGTH, ratio: 0.8 },
     { type: BlockType.DELOAD, ratio: 0.2 }
  ]
};

export const expandPlan = (plan: BlockDefinition[]): BlockDefinition[] => {
  const expanded: BlockDefinition[] = [];
  
  plan.forEach(block => {
    const expansion = GOAL_EXPANSIONS[block.type];
    if (expansion) {
      let remainingWeeks = block.durationWeeks;
      expansion.forEach((sub, idx) => {
        const isLast = idx === expansion.length - 1;
        const subWeeks = isLast ? remainingWeeks : Math.max(1, Math.round(block.durationWeeks * sub.ratio));
        
        if (subWeeks > 0) {
          const template = BLOCK_TEMPLATES[sub.type] || BLOCK_TEMPLATES[BlockType.FOUNDATION];
          expanded.push({
            ...template,
            durationWeeks: subWeeks,
            label: `${block.label} - ${template.label}`
          } as BlockDefinition);
          remainingWeeks -= subWeeks;
        }
      });
    } else {
      expanded.push(block);
    }
  });
  
  return expanded;
};

export const getPlanForDuration = (totalWeeks: number, goalOrGoals: HybridGoal = 'powerbuilding'): BlockDefinition[] => {
  const goals: TrainingGoal[] = Array.isArray(goalOrGoals) ? goalOrGoals : [goalOrGoals];
  const plan: BlockDefinition[] = [];

  const baseGoalBlocks: Record<string, Partial<BlockDefinition>> = {
    'pure_strength': { type: BlockType.PURE_STRENGTH as BlockType, label: 'Pure Strength', baseIntensity: 0.85, baseReps: '3', baseSets: 5, intensityIncrementPerWeek: 0.015 },
    'powerbuilding': { type: BlockType.POWERBUILDING as BlockType, label: 'Powerbuilding', baseIntensity: 0.75, baseReps: '8', baseSets: 4, intensityIncrementPerWeek: 0.015 },
    'hypertrophy': { type: BlockType.HYPERTROPHY as BlockType, label: 'Hypertrophy', baseIntensity: 0.68, baseReps: '10', baseSets: 4, intensityIncrementPerWeek: 0.02 },
    'peaking': { type: BlockType.PEAKING as BlockType, label: 'Peaking', baseIntensity: 0.90, baseReps: '1', baseSets: 5, intensityIncrementPerWeek: 0.02 },
    'longevity': { type: BlockType.LONGEVITY as BlockType, label: 'Longevity', baseIntensity: 0.65, baseReps: '12', baseSets: 3, intensityIncrementPerWeek: 0.01 },
    'tactical': { type: BlockType.TACTICAL as BlockType, label: 'Tactical', baseIntensity: 0.75, baseReps: '10', baseSets: 4, intensityIncrementPerWeek: 0.015 },
    'explosiveness': { type: BlockType.EXPLOSIVENESS as BlockType, label: 'Explosiveness', baseIntensity: 0.80, baseReps: '3', baseSets: 5, intensityIncrementPerWeek: 0.02 },
    'endurance': { type: BlockType.ENDURANCE as BlockType, label: 'Endurance', baseIntensity: 0.65, baseReps: '20', baseSets: 3, intensityIncrementPerWeek: 0.01 },
    'prehab': { type: BlockType.PREHAB as BlockType, label: 'Prehab/Rehab', baseIntensity: 0.55, baseReps: '15', baseSets: 3, intensityIncrementPerWeek: 0.01 }
  };

  const weeksPerGoal = Math.floor(totalWeeks / goals.length);
  let remaining = totalWeeks;

  goals.forEach((goal, idx) => {
    const isLast = idx === goals.length - 1;
    let duration = isLast ? remaining : weeksPerGoal;
    
    // Insert Retention Protocol between distinct goal transitions
    let retentionWeeks = 0;
    if (idx > 0) {
      retentionWeeks = Math.min(2, Math.floor(duration * 0.2)); // up to 2 weeks of retention
      if (retentionWeeks > 0) {
        duration -= retentionWeeks;
        plan.push({
          type: BlockType.RETENTION as BlockType,
          label: 'Retention Protocol',
          baseIntensity: 0.85,
          baseReps: '3',
          baseSets: 2,
          intensityIncrementPerWeek: 0,
          durationWeeks: retentionWeeks
        });
        remaining -= retentionWeeks;
      }
    }

    if (duration > 0) {
      plan.push({
        ...(baseGoalBlocks[goal] || baseGoalBlocks['powerbuilding']),
        durationWeeks: duration
      } as BlockDefinition);
      remaining -= duration;
    }
  });

  return plan.filter(b => b.durationWeeks > 0);
};

export interface SequenceAdvisory {
  issue: string;
  recommendation: string;
  decayRisk: number; // 0 to 1
  actionType: 'INSERT' | 'REORDER' | 'SWAP' | 'NONE';
  suggestedBlock?: BlockType;
}

export const analyzeSequenceConflicts = (customProgramBlocks: any[]): SequenceAdvisory[] => {
  if (!customProgramBlocks || !Array.isArray(customProgramBlocks) || customProgramBlocks.length < 2) return [];
  
  const advisories: SequenceAdvisory[] = [];
  const types = customProgramBlocks.map(b => b.type);

  // 1. CNS Recruitment Decay: Power/Strength -> Long Gap/Deload -> Peaking
  const peakingIdx = types.indexOf(BlockType.PEAKING);
  if (peakingIdx !== -1 && peakingIdx > 0) {
    const priorBlock = customProgramBlocks[peakingIdx - 1];
    if (priorBlock.type === BlockType.DELOAD || priorBlock.type === BlockType.REGENERATION) {
      // Check if there was high intensity BEFORE the deload
      const beforeDeloadIdx = peakingIdx - 2;
      if (beforeDeloadIdx >= 0) {
        const beforeDeload = customProgramBlocks[beforeDeloadIdx];
        if (beforeDeload.type === BlockType.POWER || beforeDeload.type === BlockType.STRENGTH) {
          advisories.push({
            issue: "Direct transition from Deload to Peaking may result in a 15% CNS recruitment decay.",
            recommendation: "Insert a 2-week Strength-Maintenance phase between Deload and Peaking.",
            decayRisk: 0.15,
            actionType: 'INSERT',
            suggestedBlock: BlockType.STRENGTH
          });
        }
      }
    }
  }

  // 2. Structural Integrity: Long cycle without Hypertrophy/Foundation
  const totalWeeks = customProgramBlocks.reduce((acc, b) => acc + b.durationWeeks, 0);
  if (totalWeeks >= 24 && !types.includes(BlockType.HYPERTROPHY) && !types.includes(BlockType.FOUNDATION)) {
    advisories.push({
      issue: "Long-term force production focus without structural support may increase injury risk.",
      recommendation: "Add a HYPERTROPHY block to reset structural baseline.",
      decayRisk: 0.10,
      actionType: 'INSERT',
      suggestedBlock: BlockType.HYPERTROPHY
    });
  }

  // 3. Specific Conflict: Power -> Hypertrophy
  for (let i = 0; i < types.length - 1; i++) {
    if (types[i] === BlockType.POWER && types[i+1] === BlockType.HYPERTROPHY) {
      advisories.push({
        issue: "Metabolic conflict: Power focus immediately followed by high volume hypertrophy.",
        recommendation: "Insert a STRENGTH block to bridge metabolic pathways.",
        decayRisk: 0.05,
        actionType: 'INSERT',
        suggestedBlock: BlockType.STRENGTH
      });
    }
  }

  return advisories;
};

export const getRetentionProtocol = (profile: any) => {
  const frequency = profile?.trainingFrequency || 3;
  const period = parseInt(profile?.missionPeriod || '3') || 3;
  
  // Requirement: if frequency < 3 or period > 6M, trigger retention sets
  if (frequency < 3 || period >= 6) {
    return {
      active: true,
      reason: frequency < 3 ? 'LOW_FREQUENCY' : 'LONG_HORIZON',
      description: "Retention Sets active: Maintaining baseline force production during volume-sparse periods.",
      setsToInject: 1, // 1 set per primary lift
      type: 'intensity_retention'
    };
  }
  
  return { active: false };
};

export const getPlanFromCustomBlocks = (customProgramBlocks: any[]): BlockDefinition[] => {
  if (!customProgramBlocks || !Array.isArray(customProgramBlocks) || customProgramBlocks.length === 0) return [];
  
  const plan: BlockDefinition[] = customProgramBlocks.map(b => ({
    ...(BLOCK_TEMPLATES[b.type] || BLOCK_TEMPLATES[BlockType.FOUNDATION]),
    durationWeeks: b.durationWeeks,
  } as BlockDefinition));

  return plan;
};

export const getBlockForWeek = (totalWeek: number, totalDurationWeeks: number | string = 12, goalOrGoals: HybridGoal = 'powerbuilding', customProgramBlocks?: any[]) => {
  const normalizedDuration = typeof totalDurationWeeks === 'string' 
    ? (parseInt(totalDurationWeeks) || 3) * 4 
    : totalDurationWeeks;
    
  const hasCustomBlocks = customProgramBlocks && Array.isArray(customProgramBlocks) && customProgramBlocks.length > 0;
  
  const basicPlan = hasCustomBlocks
    ? getPlanFromCustomBlocks(customProgramBlocks)
    : getPlanForDuration(normalizedDuration, goalOrGoals);

  // Analyze: Why was Mission #9 Foundation during Hypertrophy?
  // Because 'expandPlan' was breaking down top-level objectives (like Hypertrophy) into sub-phases (Foundation -> Hypertrophy -> Overreach -> Deload).
  // A 6-month Hypertrophy block has a 20% Foundation phase (5 weeks). So week 3 (Mission #9) remained Foundation.
  // Fix: By bypassing 'expandPlan' for custom blocks, the timeline remains exactly as crafted by the user. If they drag Hypertrophy for 12 weeks, it stays Hypertrophy for 12 weeks.
  const plan = hasCustomBlocks ? basicPlan : expandPlan(basicPlan);

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
