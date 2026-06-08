import { ModalityStrategy } from './ModalityStrategy';
import { StrengthModality } from './StrengthModality';
import { EnduranceModality } from './EnduranceModality';
import { HypertrophyModality } from './HypertrophyModality';

export class ModalityRegistry {
  private static handlers = new Map<string, ModalityStrategy>();

  static {
    // Default mappings
    this.handlers.set('strength', new StrengthModality());
    this.handlers.set('powerbuilding', new StrengthModality()); // Treats powerbuilding primarily as strength
    this.handlers.set('hypertrophy', new HypertrophyModality());
    this.handlers.set('endurance', new EnduranceModality());
    this.handlers.set('aerobic capacity', new EnduranceModality());
  }

  static getHandler(intent?: string): ModalityStrategy {
    const normalizedIntent = (intent || 'strength').toLowerCase();
    
    // Check known matches
    for (const [key, handler] of this.handlers.entries()) {
      if (normalizedIntent.includes(key)) {
        return handler;
      }
    }

    // Fallbacks
    if (normalizedIntent.includes('zone') || normalizedIntent.includes('cardio') || normalizedIntent.includes('run')) {
      return this.handlers.get('endurance')!;
    }
    
    if (normalizedIntent.includes('pump') || normalizedIntent.includes('bodybuilding')) {
      return this.handlers.get('hypertrophy')!;
    }

    return this.handlers.get('strength')!;
  }
}
