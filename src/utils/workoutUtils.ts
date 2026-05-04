import { Exercise } from "../contexts/WorkoutContext";

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
