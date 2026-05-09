export interface RoutineItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface RoutineProtocol {
  id: string;
  type: 'warmup' | 'cooldown';
  targetLift?: 'squat' | 'bench' | 'deadlift' | 'general';
  title: string;
  description: string;
  estimatedDuration: number;
  items: RoutineItem[];
}

export const WARMUP_ROUTINES: Record<string, RoutineProtocol> = {
  squat: {
    id: 'warmup_squat',
    type: 'warmup',
    targetLift: 'squat',
    title: 'Squat Protocol Primer',
    description: 'Mobilize hips, ankles, and activate the core to prepare for heavy axial loading.',
    estimatedDuration: 8,
    items: [
      { id: 'sq1', name: '90/90 Breathing', description: 'Diaphragmatic breathing to establish intra-abdominal pressure.', durationMinutes: 2 },
      { id: 'sq2', name: 'Hip Airplanes', description: 'Internal and external rotation of the hip joint.', durationMinutes: 2 },
      { id: 'sq3', name: 'Goblet Squats', description: 'Light kettlebell squats with a pause at the bottom to open hips.', durationMinutes: 2 },
      { id: 'sq4', name: 'McGill Big 3', description: 'Core activation (Curl-up, Side Plank, Bird Dog).', durationMinutes: 2 }
    ]
  },
  bench: {
    id: 'warmup_bench',
    type: 'warmup',
    targetLift: 'bench',
    title: 'Bench Press Primer',
    description: 'Activate the upper back, mobilize thoracic spine, and warm up the shoulder girdle.',
    estimatedDuration: 6,
    items: [
      { id: 'bp1', name: 'Band Pull-Aparts', description: 'High rep rear delt and rhomboid activation.', durationMinutes: 2 },
      { id: 'bp2', name: 'Thoracic Extensions', description: 'Foam roller extensions for the mid-back.', durationMinutes: 2 },
      { id: 'bp3', name: 'Dumbbell External Rotations', description: 'Rotator cuff activation.', durationMinutes: 2 }
    ]
  },
  deadlift: {
    id: 'warmup_deadlift',
    type: 'warmup',
    targetLift: 'deadlift',
    title: 'Deadlift Protocol Primer',
    description: 'Prime the posterior chain, hamstrings, and establish a rigid core brace.',
    estimatedDuration: 8,
    items: [
      { id: 'dl1', name: 'Cat-Cow', description: 'Spinal flexion and extension mobility.', durationMinutes: 2 },
      { id: 'dl2', name: 'Hamstring Sweeps', description: 'Dynamic hamstring stretch.', durationMinutes: 2 },
      { id: 'dl3', name: 'Kettlebell Swings', description: 'Explosive hip hinge pattern activation.', durationMinutes: 2 },
      { id: 'dl4', name: 'Planks', description: 'Isometric core rigidity.', durationMinutes: 2 }
    ]
  },
  general: {
    id: 'warmup_general',
    type: 'warmup',
    targetLift: 'general',
    title: 'General Readiness Primer',
    description: 'Increase core body temperature and general joint lubrication.',
    estimatedDuration: 5,
    items: [
      { id: 'gen1', name: 'Light Cardio', description: 'Bike or rower at a moderate pace.', durationMinutes: 3 },
      { id: 'gen2', name: 'Dynamic Stretching', description: 'Arm circles, leg swings, torso twists.', durationMinutes: 2 }
    ]
  }
};

export const COOL_DOWN_ROUTINE: RoutineProtocol = {
  id: 'cooldown_general',
  type: 'cooldown',
  title: 'System Recovery Protocol',
  description: 'Down-regulate the central nervous system and promote blood flow for recovery.',
  estimatedDuration: 7,
  items: [
    { id: 'cd1', name: 'Low Intensity Cardio', description: 'Walking or slow cycling to clear lactate.', durationMinutes: 5 },
    { id: 'cd2', name: 'Static Stretching', description: 'Targeted stretching of the trained muscle groups.', durationMinutes: 2 }
  ]
};

export const getWarmupForLift = (liftName: string): RoutineProtocol => {
  const name = liftName.toLowerCase();
  if (name.includes('squat')) return WARMUP_ROUTINES.squat;
  if (name.includes('bench')) return WARMUP_ROUTINES.bench;
  if (name.includes('deadlift')) return WARMUP_ROUTINES.deadlift;
  return WARMUP_ROUTINES.general;
};
