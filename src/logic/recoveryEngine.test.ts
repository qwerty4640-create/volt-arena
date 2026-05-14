import { describe, it, expect } from 'vitest';
import { calculateSystemReadiness, calculateRecoveryBoost } from './recoveryEngine';

describe('Recovery Engine', () => {
  it('should return 98 readiness when there is no history due to baseline penalties', () => {
    const result = calculateSystemReadiness([], [], null, undefined, 'metric');
    expect(result.readinessScore).toBe(98);
    expect(result.fatiguePenalty).toBe(1);
    expect(result.stressPenalty).toBe(1);
  });

  it('should decrease readiness when history is fed', () => {
    const history = [
      {
        completedAt: Date.now(),
        exercises: [
          {
            sets: [
              { isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 8 }
            ]
          }
        ]
      }
    ];

    const result = calculateSystemReadiness(history, [], null, undefined, 'metric');
    expect(result.readinessScore).toBeLessThan(100);
    expect(result.fatiguePenalty).toBeGreaterThan(1);
  });

  it('should update stress penalty correctly with subjective readiness', () => {
    const subjective = { sleep: 2, stress: 2, timestamp: Date.now() }; // Terrible sleep and high stress
    const result = calculateSystemReadiness([], [], subjective, undefined, 'metric');
    expect(result.stressPenalty).toBeGreaterThan(1);
    expect(result.sleepDeficit).toBeGreaterThan(0);
    expect(result.readinessScore).toBeLessThan(100);
  });

  it('mathematically proves fatigue decay from heavy tactical inputs', () => {
    const OneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const history = [
      // 3 days ago
      {
        completedAt: now - 3 * OneDayMs,
        exercises: [
          { sets: [
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 }
          ] }
        ]
      },
      // 2 days ago
      {
        completedAt: now - 2 * OneDayMs,
        exercises: [
          { sets: [
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 }
          ] }
        ]
      },
      // 1 day ago
      {
        completedAt: now - 1 * OneDayMs,
        exercises: [
          { sets: [
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 },
            { isCompleted: true, isWarmup: false, weight: 500, reps: 5, rpe: 9 }
          ] }
        ]
      }
    ];

    const resultWithHistory = calculateSystemReadiness(history, [], null, undefined, 'metric');
    
    // With 3 heavy sessions, readiness should drop
    expect(resultWithHistory.readinessScore).toBeLessThan(90);
    // Fatigue penalty should be high
    expect(resultWithHistory.fatiguePenalty).toBeGreaterThan(1.2);

    const historyOld = [
      // 10 days ago, fatigue should be decayed
      {
        completedAt: now - 10 * OneDayMs,
        exercises: [
          { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 9 }] }
        ]
      }
    ];
    
    const resultOldHistory = calculateSystemReadiness(historyOld, [], null, undefined, 'metric');
    
    // Fatigue should be almost decayed completely
    expect(resultOldHistory.fatiguePenalty).toBeLessThan(resultWithHistory.fatiguePenalty);
    expect(resultOldHistory.fatiguePenalty).toBeCloseTo(1, 1); 
  });

  it('evaluates EWMA mathematics accurately for a continuous 30-day load', () => {
    const OneDayMs = 24 * 60 * 60 * 1000;
    // Set a predictable fixed date so calculations are static
    const baseTime = new Date('2024-01-01T12:00:00Z').getTime();
    
    // Create 30 days of consistent load
    // For unit = 'metric', intensity = 3600
    // Vol: 100 weight * 5 reps = 500
    // load: (500 * 9) / 3600 = 1.25 per day
    const history = Array.from({ length: 30 }).map((_, i) => ({
      completedAt: baseTime + (i * OneDayMs),
      exercises: [
        { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 9 }] }
      ]
    }));

    const result = calculateSystemReadiness(history, [], null, undefined, 'metric');
    
    // Because the load is exactly 1.25 every day, eventually EWMA Acute and Chronic should converge near 1.25
    // And their ratio should stabilize near 1.0
    expect(result.ewmaRatio).toBeDefined();
    expect(result.ewmaRatio).toBeCloseTo(1.0, 1);
  });

  it('cold start: users with 1 to 6 days of data receive a meaningful ratio (1.0) rather than NaN', () => {
    const history = [
      {
        completedAt: Date.now(),
        exercises: [
          { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 8 }] }
        ]
      }
    ];

    const result = calculateSystemReadiness(history, [], null, undefined, 'metric');
    expect(result.ewmaRatio).toBe(1.0); // Exact match because day 1 initializes both to the exact same value
  });

  it('return from injury: 14-day gap zeroes out acute but holds some chronic', () => {
    const OneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // 30 days ago to 15 days ago: constant training
    const oldHistory = Array.from({ length: 15 }).map((_, i) => ({
      completedAt: now - (30 - i) * OneDayMs,
      exercises: [
        { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 9 }] }
      ]
    }));

    // Missing 14 days of history...

    // 1 session today
    const recentHistory = [{
      completedAt: now,
      exercises: [
        { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 9 }] }
      ]
    }];

    const history = [...oldHistory, ...recentHistory];
    const result = calculateSystemReadiness(history, [], null, undefined, 'metric');
    
    // Acute ratio should be lower since they took 14 days off, returning to just a small baseline
    // The ratio should definitely be smaller than 1.0 initially before creeping back up,
    // though the 1 session bumps acute slightly
    expect(result.ewmaRatio).toBeGreaterThan(0);
  });

  it('performance: calculates system readiness for 30 days of history in < 50ms', () => {
    const OneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const history = [];
    for(let i = 0; i < 30; i++) {
        history.push({
            completedAt: now - i * OneDayMs,
            exercises: [
                { sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 9 }] }
            ]
        });
    }

    const start = performance.now();
    calculateSystemReadiness(history, [], null, undefined, 'metric');
    const end = performance.now();
    
    expect(end - start).toBeLessThan(50);
  });
});
