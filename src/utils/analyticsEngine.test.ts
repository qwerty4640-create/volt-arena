import { describe, it, expect } from 'vitest';
import { getTacticalImpact } from './analyticsEngine';

describe('Analytics Engine', () => {
  it('calculates tactical impact correctly for empty logs', () => {
    const result = getTacticalImpact([]);
    expect(result.weeklyCumulativeScore).toBe(0);
    expect(result.chartData).toEqual([]);
  });

  it('calculates tactical impact for valid logs', () => {
    const logs = [
      { timestamp: Date.now(), durationMinutes: 60, rpe: 5, type: 'Running' as any },
      { timestamp: Date.now(), durationMinutes: 30, rpe: 8, type: 'Boxing' as any }
    ];
    
    // Running (1.2) -> 1 * 5 * 1.2 = 6
    // Boxing (2.0) -> 0.5 * 8 * 2.0 = 8
    // Total = 14
    const result = getTacticalImpact(logs as any);
    expect(result.weeklyCumulativeScore).toBeCloseTo(14);
    expect(result.chartData.length).toBe(1);
    expect(result.chartData[0].cumulativeImpact).toBeCloseTo(14);
  });
});
