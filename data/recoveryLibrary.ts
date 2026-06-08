import { ActivityType } from './activityLibrary';

export interface RecoveryActivity extends ActivityType {
  description: string;
  instructions: string[];
  recommendedDuration: number; // in minutes
  recommendedRpe: number;
  boostPercentage: number; // base readiness boost
  tips: string[];
}

export const RECOVERY_ACTIVITIES: RecoveryActivity[] = [
  {
    id: 'recovery_walking_active',
    label: 'LISS Walking',
    description: 'Low Intensity Steady State walking for metabolic clearance and active rest.',
    baseMET: 3.5,
    category: 'Recovery',
    icon: 'Activity',
    recommendedDuration: 20,
    recommendedRpe: 2,
    boostPercentage: 4,
    instructions: [
      'Maintain a steady, brisk pace where you can easily hold a conversation.',
      'Focus on nasal breathing throughout the walk.',
      'Swing arms naturally to promote lymphatic drainage.',
      'Avoid hills or challenging terrain to keep heart rate low.'
    ],
    tips: [
      'Increases blood flow to lower extremities without CNS strain.',
      'Promotes active clearance of metabolic byproducts.'
    ]
  },
  {
    id: 'recovery_mobility_flow',
    label: 'Tactical Mobility',
    description: 'Joint restoration flow to improve range of motion and parasympathetic tone.',
    baseMET: 2.5,
    category: 'Recovery',
    icon: 'Activity',
    recommendedDuration: 15,
    recommendedRpe: 1,
    boostPercentage: 5,
    instructions: [
      'Focus on joint controlled articular rotations (CARs).',
      'Move through full ranges of motion slowly and under control.',
      'Target hips, thoracic spine, and shoulders specifically.',
      'Do not push into painful ranges.'
    ],
    tips: [
      'Reduces muscle tension and improves parasympathetic tone.',
      'Restores joint mechanics after heavy loading.'
    ]
  },
  {
    id: 'recovery_foam_rolling',
    label: 'SMR / Foam Rolling',
    description: 'Self-myofascial release to optimize tissue quality and reduce muscle tension.',
    baseMET: 2.0,
    category: 'Recovery',
    icon: 'Activity',
    recommendedDuration: 10,
    recommendedRpe: 3,
    boostPercentage: 3,
    instructions: [
      'Spend 2 minutes on each major muscle group (Quads, Lats, Calves).',
      'Roll slowly, searching for "trigger points" or tight areas.',
      'Pause on tight spots for 30 seconds while breathing deeply.',
      'Avoid rolling directly over joints or bony prominences.'
    ],
    tips: [
      'Improves local tissue quality and range of motion.',
      'Helps downregulate the nervous system post-training.'
    ]
  },
  {
    id: 'recovery_cold_plunge',
    label: 'Contrast / Cold Exposure',
    description: 'Acute inflammation reduction and CNS reset via cold immersion therapy.',
    baseMET: 1.5,
    category: 'Recovery',
    icon: 'Activity',
    recommendedDuration: 5,
    recommendedRpe: 8, // Subjective intensity of cold
    boostPercentage: 6,
    instructions: [
      'Submerge to the neck in water between 10°C - 15°C.',
      'Focus on controlling your initial gasping reflex.',
      'Maintain slow, rhythmic breathing to suppress the "fight or flight" response.',
      'Maximum 5 minutes; longer is not necessarily better for recovery.'
    ],
    tips: [
      'Triggers vasoconstriction followed by vasodilation for a "flushing" effect.',
      'Reduces acute inflammation and muscle soreness.'
    ]
  },
  {
    id: 'recovery_sauna',
    label: 'Heat Therapy / Sauna',
    description: 'Heat-induced cellular repair and plasma volume expansion for cardiovascular health.',
    baseMET: 1.5,
    category: 'Recovery',
    icon: 'Activity',
    recommendedDuration: 15,
    recommendedRpe: 4,
    boostPercentage: 4,
    instructions: [
      'Maintain temperature between 70°C - 90°C.',
      'Sit or lie comfortably; exit immediately if feeling lightheaded.',
      'Hydrate with electrolytes before and after the session.',
      'Limit session to 20 minutes max if used for pure recovery.'
    ],
    tips: [
      'Increases plasma volume and red blood cell count over time.',
      'Promotes heat shock protein production for cellular repair.'
    ]
  }
];
