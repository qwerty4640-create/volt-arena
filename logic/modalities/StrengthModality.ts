import { ModalityStrategy, ReadinessImpact } from './ModalityStrategy';
import { Set } from '../../types/workout';

export class StrengthModality implements ModalityStrategy {
  calculateVolume(sets: Set[], isCalisthenics?: boolean, bodyweight?: number): number {
    return sets.reduce((sum, s) => {
      let w = parseFloat(s.weight) || 0;
      if (isCalisthenics && bodyweight) w += bodyweight;
      return sum + w * (parseInt(s.reps) || 0);
    }, 0);
  }

  applyInterferencePenalty(baseWeight: number, readinessModifier: number): number {
    // Heavy strength is very sensitive to CNS fatigue 
    return Math.round(baseWeight * readinessModifier);
  }

  formatSetsForDisplay(sets: Set[]): string {
    const reps = sets[0]?.baseReps || sets[0]?.reps || '?';
    return `\${sets.length} sets x \${reps} reps`;
  }

  getReadinessImpact(sets: Set[], rpe: number): ReadinessImpact {
    const vol = this.calculateVolume(sets);
    const drain = (vol / 500) * (rpe / 7);
    return {
      fatigueImpact: drain,
      readinessDrain: drain * 1.2, // Strength hits CNS harder
    };
  }
}
