export type StrengthTier = 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite';

export const calculateExrxPercentile = (
  total: number,
  bw: number,
  gender: string,
  age?: number
): number => {
  if (!bw || bw <= 0 || !total || total <= 0) return 100;
  
  let thresholds = gender === 'female' 
    ? [0, 1.5, 2.3, 2.9, 3.8] 
    : [0, 2.4, 3.6, 4.5, 5.8];

  if (age && age > 40) {
    const ageFactor = 1 - ((age - 40) * 0.015);
    thresholds = thresholds.map(t => t * Math.max(0.7, ageFactor));
  }

  const percentiles = [100, 50, 20, 5, 1]; 
  const ratio = total / bw;

  if (ratio <= thresholds[0]) return 100;
  if (ratio >= thresholds[4]) {
    const extra = ratio - thresholds[4];
    return Math.max(0.1, 1 - (extra * 0.5)); 
  }

  for (let i = 0; i < 4; i++) {
    if (ratio >= thresholds[i] && ratio <= thresholds[i+1]) {
      const range = thresholds[i+1] - thresholds[i];
      const pRange = percentiles[i] - percentiles[i+1];
      const progress = (ratio - thresholds[i]) / range;
      const result = percentiles[i] - (progress * pRange);
      return Math.max(0.1, result);
    }
  }

  return 100;
};

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

export const getTierStyle = (tier: string) => {
  switch (tier) {
    case 'untrained': 
    case 'novice': 
    case 'newbie': 
      return { 
        color: 'text-volt', 
        bg: 'bg-volt/10',
        border: 'border-volt/30',
        glow: ''
      };
    case 'intermediate': 
      return { 
        color: 'text-white', 
        bg: 'bg-white/10',
        border: 'border-white/20',
        glow: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
      };
    case 'advanced': 
      return { 
        color: 'text-[#FFD700]', 
        bg: 'bg-[#FFD700]/10',
        border: 'border-[#FFD700]/30',
        glow: 'drop-shadow-[0_0_15px_#ff4500]'
      };
    case 'elite': 
      return { 
        color: 'text-[#9333EA]', 
        bg: 'bg-[#9333EA]/10',
        border: 'border-[#9333EA]/30',
        glow: 'drop-shadow-[0_0_20px_#3b82f6]'
      };
    default: 
      return { 
        color: 'text-zinc-500', 
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/20',
        glow: ''
      };
  }
};
