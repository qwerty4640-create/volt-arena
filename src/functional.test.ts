import { describe, it, expect } from 'vitest';
import { autoregulateTrainingMax, generateAutoregulationFeedback, getExerciseSubstitution } from './logic/programmingEngine';

describe('Functional Testing', () => {
  it('Requirement: System must scale Training Max based on Actual vs Target RPE', () => {
    // For Submax 5/3/1, the scale is 2.5 lbs per RPE point deviation
    const baseMax = 200;
    const targetRPE = 8;
    
    // User overshoots RPE (struggled more than expected -> rpeDiff <= -2 needed) -> Max should decrease
    const overshotMax = autoregulateTrainingMax(baseMax, { isAMRAP: false, targetRPE, actualRPE: 10 } as any, 'submax_531');
    expect(overshotMax).toBeLessThan(baseMax);
    expect(overshotMax).toBeCloseTo(195);
    
    // User undershoots RPE (easier than expected) -> Max should increase
    const undershotMax = autoregulateTrainingMax(baseMax, { isAMRAP: false, targetRPE, actualRPE: 6 } as any, 'submax_531');
    expect(undershotMax).toBeGreaterThan(baseMax);
    expect(undershotMax).toBeCloseTo(205);
  });

  it('Requirement: System must provide actionable feedback when goals are not met', () => {
    const feedback = generateAutoregulationFeedback({
      goal: 'hypertrophy',
      targetReps: 10,
      actualReps: 5
    });
    
    expect(feedback.type).toBe('decrease');
    expect(feedback.action).toBe('drop_weight_5_percent');
    expect(feedback.message).toContain('dropping weight');
  });

  it('Requirement: System must substitute exercises based on equipment availability', () => {
    const substitution = getExerciseSubstitution('barbell_squat', ['barbell_squat'], 'dumbbells_only' as any);
    expect(substitution).toBeDefined();
  });
});
