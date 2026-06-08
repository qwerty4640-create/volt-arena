import { BlockType } from '../constants/periodization';
import { UserProfile } from '../contexts/SettingsContext';

/**
 * Retention Protocol Design Engine
 * Evaluates transitions between training goals, macro-cycles, and individual user constraints
 * to generate optimal retention protocols (Static Blocks or MED injections).
 */

export type RetentionModality = 'STRENGTH' | 'ENDURANCE' | 'HYPERTROPHY' | 'POWER' | 'NONE';
export type RetentionMethod = 'STATIC_BLOCK' | 'MED_INJECTION' | 'NONE';

export interface RetentionDecision {
  method: RetentionMethod;
  modality: RetentionModality;
  durationWeeks?: number;       // For STATIC_BLOCK
  setsToInject?: number;        // For MED_INJECTION
  intensity?: number;           // The intensity of the retention sets
  reason: string;
  suggestedBlockType?: BlockType;
  customBlockPayload?: {
    baseIntensity: number;
    baseReps: string;
    baseSets: number;
    label: string;
  };
  medPayload?: {
    reps: string;
    intensity: number;
    setsToInject: number;
    patternTarget?: string;
  };
}

// Logical grouping of training objectives for transition analysis
const STRENGTH_OBJECTIVES = ['pure_strength', 'powerbuilding', 'peaking', 'explosiveness'];
const ENDURANCE_OBJECTIVES = ['endurance', 'tactical', 'longevity'];
const HYPERTROPHY_OBJECTIVES = ['hypertrophy', 'powerbuilding'];

/**
 * Determines whether a transition spans functionally opposing domains
 */
const isOpposingTransition = (prev: string, curr: string, groupA: string[], groupB: string[]) => {
  return groupA.includes(prev) && groupB.includes(curr);
};

const normalizeBlockToDomain = (b: string | null): string => {
  if (!b) return 'none';
  const clean = b.toLowerCase().trim();
  
  // Specific retention blocks
  if (clean === 'strength retention' || clean === 'strength_retention') return 'strength_retention';
  if (clean === 'endurance retention' || clean === 'endurance_retention') return 'endurance_retention';
  if (clean === 'retention') return 'retention';

  // Strength Objectives
  if (
    clean === 'strength' ||
    clean === 'pure_strength' ||
    clean === 'peaking' ||
    clean === 'max_effort' ||
    clean === 'explosiveness' ||
    clean === 'power'
  ) {
    return 'strength';
  }

  // Endurance Objectives
  if (
    clean === 'endurance' ||
    clean === 'capacity' ||
    clean === 'aerobic_base' ||
    clean === 'threshold' ||
    clean === 'vo2_max' ||
    clean === 'vo2 max'
  ) {
    return 'endurance';
  }

  // Hypertrophy Objectives
  if (
    clean === 'hypertrophy' ||
    clean === 'powerbuilding' ||
    clean === 'foundation'
  ) {
    return 'hypertrophy';
  }

  if (clean === 'tactical') return 'tactical';
  if (clean === 'longevity' || clean === 'prehab' || clean === 'resiliency') return 'longevity';
  if (clean === 'deload' || clean === 'regenerat' || clean === 'taper' || clean === 'competition / taper') return 'recovery';

  return clean;
};

/**
 * Calculates the required retention strategy when shifting between macrocycles or when
 * limited by external constraints like frequency.
 */
export const calculateRetentionProtocol = (
  prevGoal: string | null,
  currGoal: string,
  totalWeeksInProgram: number,
  profile?: UserProfile | any
): RetentionDecision => {
  
  // 1. Evaluate baseline constraints (Low Frequency or Horizon)
  const frequency = profile?.trainingFrequency || 3;
  const period = parseInt(profile?.missionPeriod || '3') || 3;

  const normalizedCurr = normalizeBlockToDomain(currGoal);
  const normalizedPrev = normalizeBlockToDomain(prevGoal);

  // If there's no previous block
  if (!prevGoal) {
    if (frequency < 3 || period >= 6) {
      if (['hypertrophy', 'endurance', 'recovery'].includes(normalizedCurr)) {
        return {
          method: 'NONE',
          modality: 'NONE',
          reason: 'Initial cycle is not strength-focused, and no previous high-tension training base exists. Strength MED is withheld to align with phase constraints.'
        };
      }
      if (normalizedCurr === 'strength') {
        return { method: 'NONE', modality: 'NONE', reason: 'Current phase is already strength; no MED injection needed.' };
      }
      return {
        method: 'MED_INJECTION',
        modality: 'STRENGTH',
        setsToInject: 1,
        intensity: 0.85,
        medPayload: {
          reps: '1-2',
          intensity: 0.85,
          setsToInject: 1,
          patternTarget: 'main_lift'
        },
        reason: frequency < 3 
          ? 'Low training frequency dictates MED injection to maintain baseline force production.'
          : 'Long mission horizon requires structural retention via MED injection.'
      };
    }
    return { method: 'NONE', modality: 'NONE', reason: 'No distinct phase transition.' };
  }

  // Guard against injecting strength MEDs during non-strength phases if there's no pre-existing strength base
  if (['hypertrophy', 'endurance', 'recovery'].includes(normalizedCurr)) {
    const hasStrengthBase = ['strength', 'strength_retention'].includes(normalizedPrev);
    if (!hasStrengthBase) {
      return {
        method: 'NONE',
        modality: 'NONE',
        reason: `Target ${normalizedCurr.toUpperCase()} phase following ${normalizedPrev.toUpperCase()} does not present a high-tension baseline to preserve. Mechanical stimulus is focused strictly on the current phase objectives.`
      };
    }
  }

  // Phase Transition Matrix using normalized domains:
  
  // 1. Endurance ➡️ Pure Strength / Peaking
  if (normalizedPrev === 'endurance' && normalizedCurr === 'strength') {
    return {
      method: 'STATIC_BLOCK',
      modality: 'ENDURANCE',
      durationWeeks: 2,
      suggestedBlockType: BlockType.ENDURANCE_RETENTION,
      customBlockPayload: {
        label: 'Structural Aerobic Bridge',
        baseIntensity: 0.60,
        baseReps: '20-30 min',
        baseSets: 1
      },
      reason: 'Neuromuscular Shock Shield: High-volume oxidative work degrades tendon stiffness and joint force-tolerance. A dedicated 2-week structural bridge conditions joints and stabilizes the aerobic baseline before introducing maximum neural load.'
    };
  }

  // 2. Pure Strength / Peaking ➡️ Endurance
  if (normalizedPrev === 'strength' && normalizedCurr === 'endurance') {
    return {
      method: 'STATIC_BLOCK',
      modality: 'STRENGTH',
      durationWeeks: 2,
      suggestedBlockType: BlockType.STRENGTH_RETENTION,
      customBlockPayload: {
        label: 'Neuromuscular Preserver',
        baseIntensity: 0.85,
        baseReps: '1-3',
        baseSets: 2
      },
      reason: 'Absolute Tension Preservation: A sudden halt in heavy mechanical tension triggers rapid neural recruitment decay. A dedicated 2-week block locks in neuromuscular recruitment efficiency using high-intensity, low-volume "priming" sets.'
    };
  }

  // 3. Endurance ➡️ Hypertrophy
  if (normalizedPrev === 'endurance' && normalizedCurr === 'hypertrophy') {
    return {
      method: 'STATIC_BLOCK',
      modality: 'ENDURANCE',
      durationWeeks: 2,
      suggestedBlockType: BlockType.ENDURANCE_RETENTION,
      customBlockPayload: {
        label: 'Metabolic Phase-Shift',
        baseIntensity: 0.70,
        baseReps: '15 reps (active recovery)',
        baseSets: 2
      },
      reason: 'Cortisol Control: Moving from chronic systemic depletion straight to dense myofibrillar volume risks severe muscle damage and elevated cortisol, blocking initial muscle growth. A dedicated transition phase resets metabolic homeostasis.'
    };
  }

  // 4. Force-Velocity shift: Explosiveness / Strength ➡️ Hypertrophy
  if (normalizedPrev === 'strength' && normalizedCurr === 'hypertrophy') {
    return {
      method: 'STATIC_BLOCK',
      modality: 'STRENGTH',
      durationWeeks: 2,
      suggestedBlockType: BlockType.STRENGTH_RETENTION,
      customBlockPayload: {
        label: 'Force-Velocity Stabilizer',
        baseIntensity: 0.75,
        baseReps: '5',
        baseSets: 3
      },
      reason: 'Rate of Force Stabilization: Moving from low-fatigue ballistic velocity work directly to high mechanical damage (hypertrophy) causes conflicting motor unit demands. A 2-week strength-bridge transitions high-velocity motor units to mechanical tension.'
    };
  }

  // 5. Powerbuilding ➡️ Pure Strength / Hypertrophy ➡️ Strength
  if (normalizedPrev === 'hypertrophy' && normalizedCurr === 'strength') {
    return {
      method: 'NONE',
      modality: 'NONE',
      reason: 'Transitioning to a Strength phase removes the need for retention sets, as the primary objective itself provides the required mechanical tension.'
    };
  }

  // 6. Hypertrophy ➡️ Powerbuilding
  if (normalizedPrev === 'hypertrophy' && normalizedCurr === 'hypertrophy' && prevGoal !== currGoal) {
    return {
      method: 'MED_INJECTION',
      modality: 'STRENGTH',
      setsToInject: 1,
      intensity: 0.85,
      medPayload: {
        reps: '1-3',
        intensity: 0.80,
        setsToInject: 1,
        patternTarget: 'compound_accessory'
      },
      reason: 'Concurrent Preservation: Because mechanical volume is already high, introducing 1–2 background heavy single/double sets maintains neurological familiarity with absolute load, locking in cross-sectional muscle gains.'
    };
  }

  // 7. Tactical ➡️ Endurance
  if (normalizedPrev === 'tactical' && normalizedCurr === 'endurance') {
    return {
      method: 'MED_INJECTION',
      modality: 'ENDURANCE',
      setsToInject: 1,
      medPayload: {
        reps: '30 min zone 2',
        intensity: 0.65,
        setsToInject: 1,
        patternTarget: 'aerobic_base'
      },
      reason: 'Work Capacity Conservation: Tactical profiles emphasize General Physical Preparedness (GPP). Endurance pathways are sustained concurrently using a background conditioning line (e.g., 1–2 weekly aerobic threshold sessions) within the main training track.'
    };
  }

  // 8. Longevity / Prehab ➡️ Any Track
  if (normalizedPrev === 'longevity') {
    return {
      method: 'MED_INJECTION',
      modality: 'ENDURANCE',
      setsToInject: 1,
      medPayload: {
        reps: '10-15',
        intensity: 0.50,
        setsToInject: 1,
        patternTarget: 'intra_set_recovery'
      },
      reason: 'Active Recovery Integration: Due to the low systemic load of prehab, these movements are executed continuously as low-stress intra-set recovery fillers or warm-up primers during any block.'
    };
  }

  // Default fallback for constraints if no specific transitions matched
  if (frequency < 3 || period >= 6) {
    if (normalizedCurr === 'strength') {
      return { method: 'NONE', modality: 'NONE', reason: 'Current phase is already strength; no MED injection needed.' };
    }
    return {
      method: 'MED_INJECTION',
      modality: 'STRENGTH',
      setsToInject: 1,
      intensity: 0.85,
      medPayload: {
        reps: '1',
        intensity: 0.85,
        setsToInject: 1,
        patternTarget: 'main_lift'
      },
      reason: frequency < 3 
        ? 'Low training frequency dictates MED injection to maintain baseline force production.'
        : 'Long mission horizon requires structural retention via MED injection.'
    };
  }

  return { 
    method: 'NONE', 
    modality: 'NONE', 
    reason: `Transitions between ${prevGoal} and ${currGoal} do not present significant morphological divergence requiring specific protocol.` 
  };
};
