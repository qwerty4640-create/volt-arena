import { describe, it, expect } from 'vitest';
import { calculateExrxPercentile, calculateTier } from './strength';

describe('Strength Lib', () => {
  it('calculates exrx percentile correctly', () => {
    // Basic male
    expect(calculateExrxPercentile(300, 80, 'male')).toBeLessThan(100);
    // Basic female
    expect(calculateExrxPercentile(200, 60, 'female')).toBeLessThan(100);
    
    // Invalid inputs
    expect(calculateExrxPercentile(0, 80, 'male')).toBe(100);
  });

  it('calculates tier correctly', () => {
    // Novice
    expect(calculateTier(100, 80, 120, 80, 'male')).toBe('intermediate');
    // Advanced
    expect(calculateTier(200, 150, 250, 80, 'male')).toBe('elite');
  });
});
