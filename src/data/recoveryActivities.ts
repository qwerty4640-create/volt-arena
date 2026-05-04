export interface RecoveryActivity {
  id: string;
  label: string;
  description: string;
  category: 'NEURAL' | 'PERIPHERAL';
  boostRange: [number, number]; // [Min %, Max %]
  minReadiness: number; // Suggested floor
  maxReadiness: number; // Suggested ceiling
  targets: ('fatigue' | 'sleep' | 'stress')[];
}

export const RECOVERY_MAP: RecoveryActivity[] = [
  {
    id: 'tactical-cycle',
    label: 'ZONE 2 TACTICAL CYCLE',
    description: '30 MIN AT 60% HR MAX. FLUSH PERIPHERAL METABOLITES.',
    category: 'PERIPHERAL',
    boostRange: [3, 5],
    minReadiness: 65,
    maxReadiness: 100,
    targets: ['fatigue'],
  },
  {
    id: 'mobility-flow',
    label: 'KINETIC MOBILITY',
    description: 'JOINT DECOMPRESSION AND ROM DRILLS. REPAIR TISSUE TENSION.',
    category: 'PERIPHERAL',
    boostRange: [2, 4],
    minReadiness: 45,
    maxReadiness: 85,
    targets: ['fatigue'],
  },
  {
    id: 'thermal-contrast',
    label: 'THERMAL CONTRAST',
    description: 'SAUNA/COLD PLUNGE CYCLES. NEURAL DOWN-REGULATION.',
    category: 'NEURAL',
    boostRange: [4, 6],
    minReadiness: 20,
    maxReadiness: 70,
    targets: ['stress', 'fatigue'],
  },
  {
    id: 'breathwork',
    label: 'COHERENCE BREATHING',
    description: 'BOX BREATHING PROTOCOL. PARASYMPATHETIC ACTIVATION.',
    category: 'NEURAL',
    boostRange: [1, 3],
    minReadiness: 0,
    maxReadiness: 50,
    targets: ['stress'],
  }
];
