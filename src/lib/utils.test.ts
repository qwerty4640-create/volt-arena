import { describe, it, expect } from 'vitest';
import { isDumbbell } from './utils';

describe('Utils Lib', () => {
  it('identifies dumbbells correctly', () => {
    expect(isDumbbell('Dumbbell Press')).toBe(true);
    expect(isDumbbell('DB Row')).toBe(true);
    expect(isDumbbell('Barbell Squat')).toBe(false);
  });
});
