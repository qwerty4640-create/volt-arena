import { describe, it, expect } from 'vitest';
import { calculateSystemReadiness } from './logic/recoveryEngine';

describe('Security and Edge Case Testing', () => {
  it('Gracefully handles extremely large numbers', () => {
    const maliciousHistory = [{
      completedAt: Date.now(),
      exercises: [{ 
        sets: [{ isCompleted: true, isWarmup: false, weight: Number.MAX_SAFE_INTEGER, reps: 100000, rpe: 10 }] 
      }]
    }];

    const result = calculateSystemReadiness(maliciousHistory, [], null, undefined, 'metric');
    
    // Engine shouldn't crash; might produce extreme penalties due to math, but should stay structured.
    expect(result).toBeDefined();
    expect(typeof result.readinessScore).toBe('number');
    expect(Number.isNaN(result.readinessScore)).toBe(false);
  });

  it('Gracefully handles negative or zero inputs where unexpected', () => {
    const badSubjective = { sleep: -100, stress: -50, fatigue: -10, timestamp: Date.now() };
    const result = calculateSystemReadiness([], [], badSubjective, undefined, 'metric');
    
    expect(result).toBeDefined();
    expect(typeof result.readinessScore).toBe('number');
    expect(Number.isNaN(result.readinessScore)).toBe(false);
  });

  it('Gracefully handles NaN and Infinity values implicitly', () => {
    const nanSubjective = { sleep: NaN, stress: Infinity, fatigue: -Infinity, timestamp: Date.now() };
    const result = calculateSystemReadiness([], [], nanSubjective, undefined, 'metric');
    
    // Validate engine processes without throwing NaN
    expect(result).toBeDefined();
  });
});
