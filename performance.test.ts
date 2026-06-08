import { describe, it, expect } from 'vitest';
import { calculateSystemReadiness } from './logic/recoveryEngine';
import { getTacticalImpact } from './utils/analyticsEngine';

describe('Performance Testing', () => {
  it('System Readiness: should process 5 years of daily history in under 100ms', () => {
    const OneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const massiveHistory = Array.from({ length: 365 * 5 }).map((_, i) => ({
      completedAt: now - i * OneDayMs,
      exercises: [
        { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 8 }] },
        { sets: [{ isCompleted: true, isWarmup: false, weight: 150, reps: 5, rpe: 8 }] }
      ]
    }));

    const start = performance.now();
    calculateSystemReadiness(massiveHistory, [], null, undefined, 'metric');
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100);
  });

  it('Tactical Impact: should process massive activity logs in under 50ms', () => {
    const massiveLogs = Array.from({ length: 5000 }).map((_, i) => ({
      timestamp: Date.now() - i * 10000,
      durationMinutes: 60,
      rpe: 8,
      type: 'Running' as any
    }));

    const start = performance.now();
    getTacticalImpact(massiveLogs as any);
    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });
});
