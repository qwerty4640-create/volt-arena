import { ModalityStrategy, ReadinessImpact } from './ModalityStrategy';
import { Set } from '../../types/workout';

export class HypertrophyModality implements ModalityStrategy {
  calculateVolume(sets: Set[], isCalisthenics?: boolean, bodyweight?: number): number {
    return sets.reduce((sum, s) => {
      const w = parseFloat(s.weight) || 0;
      return sum + w * (parseInt(s.reps) || 0);
    }, 0);
  }

  applyInterferencePenalty(baseWeight: number, readinessModifier: number): number {
    // Hypertrophy tolerates fatigue better than absolute strength
    const adjustedModifier = 1 - ((1 - readinessModifier) * 0.75); 
    return Math.round(baseWeight * adjustedModifier);
  }

  formatSetsForDisplay(sets: Set[]): string {
    const reps = sets[0]?.baseReps || sets[0]?.reps || '?';
    return `\${sets.length} volume sets x \${reps} reps`;
  }

  getReadinessImpact(sets: Set[], rpe: number): ReadinessImpact {
    const vol = this.calculateVolume(sets);
    const drain = (vol / 400) * (rpe / 6);
    return {
      fatigueImpact: drain * 1.5, // High muscular fatigue
      readinessDrain: drain, // Moderate CNS drain
    };
  }
}
