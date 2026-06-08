import { ModalityStrategy, ReadinessImpact } from './ModalityStrategy';
import { Set } from '../../types/workout';

export class EnduranceModality implements ModalityStrategy {
  calculateVolume(sets: Set[], isCalisthenics?: boolean, bodyweight?: number): number {
    return 0; // Endurance does not calculate volume via tonnage
  }

  applyInterferencePenalty(baseWeight: number, readinessModifier: number): number {
    // Endurance largely ignores small readiness dips unless severe
    return readinessModifier < 0.8 ? baseWeight * 0.9 : baseWeight;
  }

  formatSetsForDisplay(sets: Set[]): string {
    if (sets.length === 1) {
      return `\${sets.length} zone effort`;
    }
    return `\${sets.length} continuous phases`;
  }

  getReadinessImpact(sets: Set[], rpe: number): ReadinessImpact {
    const totalDuration = sets.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60; // in minutes
    
    // Scale impact heavily by duration and RPE
    let drain = (totalDuration / 10) * (rpe / 5);
    return {
      fatigueImpact: drain * 1.5,
      readinessDrain: drain,
    };
  }
}
