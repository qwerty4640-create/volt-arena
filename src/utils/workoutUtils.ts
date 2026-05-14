import { EXERCISE_DATABASE_TYPED } from "../constants/exercises";
import { Exercise } from "../contexts/WorkoutContext";

export function isUnilateral(exName: string): boolean {
  if (!exName) return false;
  const ex = EXERCISE_DATABASE_TYPED.find(e => e.name.toLowerCase() === exName.toLowerCase());
  if (ex?.isUnilateral) return true;

  // Fallback for custom names or missing tags
  const lowerName = exName.toLowerCase();
  return lowerName.includes('one arm') || 
         lowerName.includes('single arm') || 
         lowerName.includes('single leg') || 
         lowerName.includes('pistol') || 
         lowerName.includes('shrimp') || 
         (lowerName.includes('archer') && !lowerName.includes('pull ups')); // Archer pull ups are already tagged but just in case
}

export function getExerciseName(ex: any, t?: any): string {
  const nameStr = typeof ex === "string" ? ex : ex?.name || "Unknown";
  if (!t) return nameStr;
  
  // Try dynamic key based on name
  const dynamicKey = `exercise.${nameStr.toLowerCase().replace(/\s+/g, '_')}`;
  const translated = t(dynamicKey);
  if (translated !== dynamicKey) return translated;

  const lowerName = nameStr.toLowerCase();
  
  if (lowerName === "squat" || lowerName === "barbell squat") return t("onboarding.squat");
  if (lowerName === "bench press" || lowerName === "bench" || lowerName === "barbell bench press") return t("onboarding.bench");
  if (lowerName === "deadlift" || lowerName === "barbell deadlift") return t("onboarding.deadlift");
  
  return nameStr;
}

export function isMainLiftMatch(exName: string, liftType: 'Squat' | 'Bench Press' | 'Deadlift' | string): boolean {
  const lowerName = exName.toLowerCase();
  if (liftType === 'Squat') {
    return lowerName === 'squat' || lowerName === 'barbell squat';
  }
  if (liftType === 'Bench Press') {
    return lowerName === 'bench press' || lowerName === 'bench' || lowerName === 'barbell bench press';
  }
  if (liftType === 'Deadlift') {
    return lowerName === 'deadlift' || lowerName === 'barbell deadlift';
  }
  return false;
}

export function calculateE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  // Brzycki formula: 1RM = weight * (36 / (37 - reps))
  const effectiveReps = Math.min(reps, 12);
  return weight * (36 / (37 - effectiveReps));
}

export function isTimedExercise(exName: string): boolean {
  if (!exName) return false;
  const lowerName = exName.toLowerCase();
  return lowerName.includes('plank') || 
         lowerName.includes('hold') || 
         lowerName.includes('l-sit') || 
         lowerName.includes('lever');
}

export function calculatePace(distance_meters?: number, time_seconds?: number): number {
  if (!distance_meters || !time_seconds || time_seconds <= 0) return 0;
  // returns Pace in m/s
  return distance_meters / time_seconds;
}

export function calculateWorkCapacity(volume: number, duration_minutes: number): number {
  if (duration_minutes <= 0) return 0;
  return volume / duration_minutes; // e.g. Tonnage per minute
}

export function calculateVolume(workout: any, countAllSets: boolean = false, unit: 'metric' | 'imperial' | 'none' = 'none', redlineScale: boolean = false): number | string {
  if (!workout || !workout.exercises) return unit === 'none' ? 0 : `0 ${unit === 'imperial' ? 'LBS' : 'kg'}`;
  let total = 0;
  workout.exercises.forEach((ex: any) => {
    if (!ex.sets) return;
    ex.sets.forEach((s: any) => {
      // If countAllSets is true (like in TrainingView), bypass completed/warmup check
      if (countAllSets || (s.isCompleted && !s.isWarmup)) {
        let w = parseFloat(s.weight) || 0;
        if (redlineScale) {
          w = Math.round((w * 0.75) / 5) * 5;
        }
        total += w * (parseInt(s.reps) || 0);
      }
    });
  });
  if (unit === 'none') return total.toLocaleString();
  return `${total.toLocaleString()} ${unit === 'imperial' ? 'LBS' : 'kg'}`;
}

export function calculateMobilityIntegrity(sets: any[]): number {
  if (!sets || sets.length === 0) return 100;
  let totalScore = 0;
  let validSets = 0;

  sets.forEach(set => {
    // Both pain scale and rom_quality can adjust the baseline 100
    if (set.pain_scale !== undefined || set.rom_quality) {
      let setScore = 100;
      if (set.pain_scale !== undefined) {
        // Pain is 1-10. Each point of pain reduces score by 5
        setScore -= (set.pain_scale * 5); 
      }
      if (set.rom_quality === 'restricted') {
        setScore -= 20;
      }
      totalScore += Math.max(0, setScore);
      validSets++;
    }
  });

  if (validSets === 0) return 100;
  return totalScore / validSets;
}
