import { describe, it, expect } from 'vitest';
import { assignLogicEngine, calculateReadinessModifier, autoregulateTrainingMax, generateAutoregulationFeedback, getExerciseSubstitution, evaluatePivotLogic } from './programmingEngine';

describe('Programming Engine', () => {
  it('assigns logic engine correctly', () => {
    expect(assignLogicEngine({ meetDate: 1234 } as any)).toBe('block_periodization');
    expect(assignLogicEngine({ trainingAge: 'novice' } as any)).toBe('linear_5x5');
    expect(assignLogicEngine({ trainingAge: 'intermediate' } as any)).toBe('submax_531');
  });

  it('calculates readiness modifier correctly', () => {
    expect(calculateReadinessModifier({ sleep: 2, stress: 2, soreness: 2 })).toBe(0.90);
    expect(calculateReadinessModifier({ sleep: 3, stress: 3, soreness: 3 })).toBe(0.95);
    expect(calculateReadinessModifier({ sleep: 5, stress: 5, soreness: 5 })).toBe(1.0);
  });

  it('autoregulates training max correctly', () => {
    // Normal case
    expect(autoregulateTrainingMax(100, { isAMRAP: false, targetRPE: 8, actualRPE: 6 } as any, 'submax_531')).toBe(102.5); // difference is 2
    expect(autoregulateTrainingMax(100, { isAMRAP: false, targetRPE: 8, actualRPE: 10 } as any, 'submax_531')).toBe(97.5); // difference is -2

    // AMRAP case
    expect(autoregulateTrainingMax(100, { isAMRAP: true, targetReps: 5, actualReps: 9 } as any, 'submax_531')).toBe(105);
    expect(autoregulateTrainingMax(100, { isAMRAP: true, targetReps: 5, actualReps: 4 } as any, 'submax_531')).toBe(97.5);
  });

  it('generates autoregulation feedback', () => {
    const feedback = generateAutoregulationFeedback({
      goal: 'pure_strength',
      targetReps: 5,
      actualReps: 2
    });
    expect(feedback.type).toBe('decrease');

    const tacticalFeedback = generateAutoregulationFeedback({
      goal: 'tactical',
      timeExceedingThreshold: 50
    });
    expect(tacticalFeedback.type).toBe('decrease');
  });

  it('handles exercise substitution correctly', () => {
    const sub = getExerciseSubstitution('barbell_squat', ['barbell_squat'], 'commercial');
    expect(sub).toBe('squat_high_bar');

    const rest = getExerciseSubstitution('barbell_squat', ['barbell_squat', 'squat_high_bar', 'squat_front', 'squat_safety_bar', 'squat_goblet'], 'home');
    expect(rest).toBe('rest');
  });
});
