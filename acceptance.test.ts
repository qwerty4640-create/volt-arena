import { describe, it, expect } from 'vitest';
import { calculateSystemReadiness } from './logic/recoveryEngine';
import { calculateReadinessModifier } from './logic/programmingEngine';

describe('Acceptance Testing (User Flow)', () => {
  it('Scenario: A user goes through a hardcore week, gets fatigued, rests, and recovers', () => {
    const OneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Day 1: User logs a heavy workout
    const day1History = [{
      completedAt: now - 3 * OneDayMs,
      exercises: [{ sets: [
        { isCompleted: true, isWarmup: false, weight: 400, reps: 5, rpe: 9 },
        { isCompleted: true, isWarmup: false, weight: 400, reps: 5, rpe: 9 },
        { isCompleted: true, isWarmup: false, weight: 400, reps: 5, rpe: 9 }
      ]}]
    }];
    
    const day1Subjective = { sleep: 5, stress: 5, fatigue: 5, timestamp: now - 3 * OneDayMs };
    const day1Readiness = calculateSystemReadiness(day1History, [], day1Subjective, undefined, 'metric');
    
    // Expect readiness to be good initially, but fatigue builds
    expect(day1Readiness.fatiguePenalty).toBeGreaterThan(1);
    
    // Day 2: User works out again heavily, with bad sleep (1 is terrible on the 1-5 scale)
    const day2History = [
      ...day1History,
      {
        completedAt: now - 2 * OneDayMs,
        exercises: [{ sets: [
          { isCompleted: true, isWarmup: false, weight: 350, reps: 10, rpe: 10 },
          { isCompleted: true, isWarmup: false, weight: 350, reps: 10, rpe: 10 }
        ]}]
      }
    ];
    const day2Subjective = { sleep: 1, stress: 1, fatigue: 1, timestamp: now - 2 * OneDayMs };
    const day2Readiness = calculateSystemReadiness(day2History, [], day2Subjective, undefined, 'metric');
    
    // User should be highly fatigued and have low readiness
    expect(day2Readiness.readinessScore).toBeLessThan(day1Readiness.readinessScore);
    expect(day2Readiness.stressPenalty).toBeGreaterThan(day1Readiness.stressPenalty);
    
    // Day 3: User rests (no new workout added to history), logs good subjective data
    const day3History = [...day2History]; // no new workouts
    const day3Subjective = { sleep: 5, stress: 5, fatigue: 5, timestamp: now - 1 * OneDayMs };
    const day3Readiness = calculateSystemReadiness(day3History, [], day3Subjective, undefined, 'metric');
    
    // User readiness should bounce back significantly
    expect(day3Readiness.readinessScore).toBeGreaterThan(day2Readiness.readinessScore);
    expect(day3Readiness.stressPenalty).toBeLessThan(day2Readiness.stressPenalty);
    
    // The auto-regulation modifier on day 3 should allow nearly full capacity
    const mod = calculateReadinessModifier({ sleep: day3Subjective.sleep, stress: day3Subjective.stress, soreness: day3Subjective.fatigue });
    expect(mod).toBeGreaterThanOrEqual(0.95);
  });
});
