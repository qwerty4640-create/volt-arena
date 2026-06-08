import { TrainingGoal } from '../contexts/SettingsContext';

export interface TrainingConstraint {
  id: string;
  condition: (goals: TrainingGoal[]) => boolean;
  apply: (exercise: any, goals: TrainingGoal[]) => void;
  message?: string;
}

export const TRAINING_CONSTRAINTS: TrainingConstraint[] = [
  {
    id: 'longevity_rpe_cap',
    condition: (goals) => goals.includes('longevity'),
    apply: (exercise) => {
      // If longevity is present, cap intensity/RPE
      if (exercise.pattern === 'hinge' || exercise.pattern === 'squat') {
        exercise.targetRPE = 8;
        exercise.intensityCap = 0.85;
      } else {
        exercise.targetRPE = 8.5;
        exercise.intensityCap = 0.90;
      }
    },
    message: 'Longevity protocol active: intensity capped at RPE 8.5'
  },
  {
    id: 'peaking_specificity',
    condition: (goals) => goals.includes('peaking'),
    apply: (exercise) => {
      if (['squat', 'push_horizontal', 'hinge'].includes(exercise.pattern)) {
        exercise.intensityBoost = 0.05;
        exercise.targetRPE = 9;
      }
    }
  },
  {
    id: 'strength_hypertrophy_conflict',
    condition: (goals) => goals.includes('pure_strength') && goals.includes('hypertrophy'),
    apply: (exercise, goals) => {
      // Conflict Resolution: If Strength is Primary and Hypertrophy is Secondary/Tertiary, 
      // reduce accessory RPE to preserve recovery for main lifts.
      const primary = goals[0];
      if (primary === 'pure_strength' && exercise.pattern === 'accessory') {
        exercise.targetRPE = 7.5; // Cap accessory intensity
      }
    }
  },
  {
    id: 'explosive_recovery_buffer',
    condition: (goals) => goals.includes('peaking') && goals.includes('pure_strength'),
    apply: (exercise) => {
      // If doing both peaking and pure strength, increase rest periods for main lifts
      if (['squat', 'hinge', 'push_horizontal'].includes(exercise.pattern)) {
        exercise.restPeriod = 300; // 5 minutes
      }
    }
  },
  {
    id: 'prehab_axial_fatigue_cap',
    condition: (goals) => goals.includes('prehab') || goals.includes('longevity'),
    apply: (exercise) => {
      if (exercise.axialFatigueScore && exercise.axialFatigueScore > 7) {
        exercise.targetRPE = Math.min(exercise.targetRPE || 10, 7.5);
        exercise.intensityCap = 0.8;
      }
    },
    message: 'Pre-Hab/Longevity protocol active: high axial fatigue movements restricted'
  },
  {
    id: 'connective_tissue_stress_management',
    condition: (goals) => true, // Apply globally based on exercise property
    apply: (exercise) => {
      if (exercise.connectiveTissueStressScore && exercise.connectiveTissueStressScore >= 8) {
        // Redline constraint for very high joint stress movements
        exercise.targetRPE = Math.min(exercise.targetRPE || 10, 8.0);
        exercise.restPeriod = Math.max(exercise.restPeriod || 120, 180); // Ensure adequate ATP/PCr recovery
      }
    },
    message: 'High connective tissue stress detected: managing RPE and rest'
  },
  {
    id: 'endurance_interference',
    condition: (goals) => goals.includes('endurance') && goals.includes('pure_strength'),
    apply: (exercise) => {
      if (exercise.pattern === 'squat' || exercise.pattern === 'hinge') {
        exercise.volumeAdjustment = -0.2; // Reduce leg volume by 20% to account for aerobic leg fatigue
      }
    },
    message: 'Concurrent Strength/Endurance training: lowering leg volume to manage interference'
  }
];

export const getInterferenceAdjustment = (goals: TrainingGoal[]): number => {
  // Volume adjustment based on competing goals
  let modifier = 1.0;
  
  const hasStrength = goals.includes('pure_strength') || goals.includes('peaking');
  const hasHypertrophy = goals.includes('hypertrophy') || goals.includes('powerbuilding');
  const hasLongevity = goals.includes('longevity');
  
  // Competing metabolic demands
  if (hasStrength && hasHypertrophy) modifier *= 0.95;
  if (hasStrength && hasLongevity) modifier *= 0.9;
  if (goals.length >= 3) modifier *= 0.85; // Massive systemic demand
  
  return modifier;
};

export const getSecondaryInjection = (goals: TrainingGoal[]): string[] => {
  const injections: string[] = [];
  const primary = goals[0];
  const remaining = goals.slice(1);

  remaining.forEach(goal => {
    if (goal === 'hypertrophy') injections.push('ACCESSORY_PUMP');
    if (goal === 'longevity') injections.push('MOBILITY_FLOW');
    if (goal === 'peaking') injections.push('POWER_PRIMER');
    if (goal === 'pure_strength') injections.push('STRENGTH_ACCESORY');
    if (goal === 'tactical') injections.push('TACTICAL_CONDITIONING');
    if (goal === 'explosiveness') injections.push('PLYOMETRICS');
    if (goal === 'endurance') injections.push('ZONE_2_CARDIO');
    if (goal === 'prehab') injections.push('REHAB_CIRCUIT');
  });

  return injections;
};
