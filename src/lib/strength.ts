export type StrengthTier = 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite';

export const calculateTier = (
  squat: number, 
  bench: number, 
  deadlift: number, 
  bw: number, 
  gender: string
): StrengthTier => {
  if (!bw || bw <= 0) return 'untrained';
  
  const total = squat + bench + deadlift;
  const ratio = total / bw;

  const isFemale = gender === 'female';

  // Thresholds (Total/BW ratio)
  // Female: Untrained (0), Novice (1.5), Intermediate (2.3), Advanced (2.9), Elite (3.8)
  // Male: Untrained (0), Novice (2.4), Intermediate (3.6), Advanced (4.5), Elite (5.8)
  
  const thresholds = isFemale 
    ? [0, 1.5, 2.3, 2.9, 3.8] 
    : [0, 2.4, 3.6, 4.5, 5.8];
  const tiers: StrengthTier[] = ['untrained', 'novice', 'intermediate', 'advanced', 'elite'];

  // Find the highest threshold reached
  let tierIndex = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) {
      tierIndex = i;
      break;
    }
  }

  return tiers[tierIndex];
};
