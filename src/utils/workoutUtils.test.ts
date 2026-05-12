import { describe, it, expect } from 'vitest';
import { isMainLiftMatch, calculateE1RM, isTimedExercise, calculatePace, calculateWorkCapacity, calculateMobilityIntegrity } from './workoutUtils';

describe('Workout Utils', () => {
  it('identifies main lift matches', () => {
    expect(isMainLiftMatch('Squat', 'Squat')).toBe(true);
    expect(isMainLiftMatch('Barbell Bench Press', 'Bench Press')).toBe(true);
    expect(isMainLiftMatch('Deadlift', 'Squat')).toBe(false);
  });

  it('calculates E1RM', () => {
    expect(calculateE1RM(100, 1)).toBe(100); // 100 * (36/36)
    expect(calculateE1RM(100, 5)).toBe(100 * (36 / 32));
  });

  it('identifies timed exercises', () => {
    expect(isTimedExercise('Plank')).toBe(true);
    expect(isTimedExercise('Barbell Squat')).toBe(false);
  });

  it('calculates pace and work capacity', () => {
    expect(calculatePace(100, 10)).toBe(10);
    expect(calculateWorkCapacity(1000, 10)).toBe(100);
  });

  it('calculates mobility integrity', () => {
    const sets = [
      { pain_scale: 1 }, // 95
      { rom_quality: 'restricted' } // 80
    ];
    // avg: (95 + 80) / 2 = 87.5
    expect(calculateMobilityIntegrity(sets)).toBe(87.5);
  });
});
