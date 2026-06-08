import { Set } from '../../types/workout';

export interface ReadinessImpact {
  fatigueImpact: number;
  readinessDrain: number;
}

export interface ModalityStrategy {
  calculateVolume(sets: Set[], isCalisthenics?: boolean, bodyweight?: number): number;
  applyInterferencePenalty(baseWeight: number, readinessModifier: number): number;
  formatSetsForDisplay(sets: Set[]): string;
  getReadinessImpact(sets: Set[], rpe: number): ReadinessImpact;
}
