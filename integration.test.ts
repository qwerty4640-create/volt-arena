import { describe, it, expect } from 'vitest';
import { calculateSystemReadiness } from './logic/recoveryEngine';
import { generateAutoregulationFeedback } from './logic/programmingEngine';

describe('Integration: Logic Engines interaction', () => {
  it('correctly calculates readiness from context data and validates inter-engine flow', () => {
    const mockHistory = [{ 
      completedAt: Date.now(), 
      exercises: [{ sets: [{ isCompleted: true, isWarmup: false, weight: 100, reps: 5, rpe: 9 }] }] 
    }];
    const mockSubjective = { sleep: 8, stress: 2, fatigue: 2, timestamp: Date.now() };

    const readinessResult = calculateSystemReadiness(mockHistory, [], mockSubjective, undefined, 'metric');
    
    expect(readinessResult.readinessScore).toBeDefined();
    expect(readinessResult.readinessScore).toBeLessThan(100);

    // Using output of readiness algorithm to influence another system (simulating Context bridging)
    const feedback = generateAutoregulationFeedback({
      goal: 'tactical',
      timeExceedingThreshold: readinessResult.fatiguePenalty > 1.2 ? 60 : 10
    });

    expect(feedback).toBeDefined();
  });
});

