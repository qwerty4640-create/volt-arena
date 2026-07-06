import { EXERCISE_DATABASE_TYPED } from "../constants/exercises";
import { Exercise } from "../contexts/WorkoutContext";

export function cleanExerciseName(name: string): string {
  if (!name) return "";
  return name
    .replace(/\[?(HEAVY PRIMARY|HYPERTROPHY|ACTIVE RECOVERY|MOVEMENT QUALITY|BLOOD FLOW)\]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function isExerciseMatch(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  return cleanExerciseName(nameA) === cleanExerciseName(nameB);
}

export function isUnilateral(exName: string): boolean {
  if (!exName) return false;
  const ex = EXERCISE_DATABASE_TYPED.find(
    (e) => e.name.toLowerCase() === exName.toLowerCase(),
  );
  if (ex?.isUnilateral) return true;

  // Fallback for custom names or missing tags
  const lowerName = exName.toLowerCase();
  return (
    lowerName.includes("one arm") ||
    lowerName.includes("single arm") ||
    lowerName.includes("single leg") ||
    lowerName.includes("pistol") ||
    lowerName.includes("shrimp") ||
    (lowerName.includes("archer") && !lowerName.includes("pull ups"))
  ); // Archer pull ups are already tagged but just in case
}

export function getExerciseName(ex: any, t?: any): string {
  let nameStr = typeof ex === "string" ? ex : ex?.name || "Unknown";

  // Strip tags
  nameStr = nameStr.replace(/HEAVY PRIMARY|HYPERTROPHY/gi, '').trim();

  if (!t) return nameStr;

  // Try dynamic key based on name
  const dynamicKey = `exercise.${nameStr.toLowerCase().replace(/\s+/g, "_")}`;
  const translated = t(dynamicKey);
  if (translated !== dynamicKey) return translated;

  const lowerName = nameStr.toLowerCase();

  if (lowerName === "squat" || lowerName === "barbell squat")
    return t("onboarding.squat");
  if (
    lowerName === "bench press" ||
    lowerName === "bench" ||
    lowerName === "barbell bench press"
  )
    return t("onboarding.bench");
  if (lowerName === "deadlift" || lowerName === "barbell deadlift")
    return t("onboarding.deadlift");

  return nameStr;
}

export function isMainLiftMatch(
  exName: string,
  liftType: "Squat" | "Bench Press" | "Deadlift" | string,
): boolean {
  if (!exName) return false;
  
  // Clean off heavy primary label if appended
  let nameStr = exName.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?/g, '').trim();
  const lowerName = nameStr.toLowerCase();
  
  if (liftType === "Squat") {
    return (
      (lowerName === "squat" || 
       lowerName === "barbell squat" || 
       lowerName === "back squat" ||
       lowerName === "squat (high bar)" ||
       lowerName === "squat (low bar)" ||
       lowerName === "low bar squat" ||
       lowerName === "high bar squat" ||
       lowerName === "front squat" ||
       lowerName === "safety bar squat" ||
       lowerName === "sbb squat") &&
       !lowerName.includes("goblet") &&
       !lowerName.includes("db") &&
       !lowerName.includes("dumbbell") &&
       !lowerName.includes("split") &&
       !lowerName.includes("pistol") &&
       !lowerName.includes("hack") &&
       !lowerName.includes("bodyweight")
    );
  }
  if (liftType === "Bench Press") {
    return (
      (lowerName === "bench press" ||
       lowerName === "bench" ||
       lowerName === "barbell bench press" ||
       lowerName === "flat barbell bench press" ||
       lowerName === "close grip bench press" ||
       lowerName === "close-grip bench press") &&
       !lowerName.includes("db") &&
       !lowerName.includes("dumbbell") &&
       !lowerName.includes("incline") &&
       !lowerName.includes("decline")
    );
  }
  if (liftType === "Deadlift") {
    return (
      (lowerName === "deadlift" ||
       lowerName === "barbell deadlift" ||
       lowerName === "conventional deadlift" ||
       lowerName === "sumo deadlift") &&
       !lowerName.includes("romanian") &&
       !lowerName.includes("rdl") &&
       !lowerName.includes("single-leg") &&
       !lowerName.includes("single leg") &&
       !lowerName.includes("db") &&
       !lowerName.includes("dumbbell")
    );
  }
  return false;
}

export function calculateE1RM(
  weight: number,
  reps: number,
  rpe?: number,
  exName?: string,
): number {
  if (weight <= 0 || reps <= 0) return 0;
  let rir = 0;
  if (rpe !== undefined && rpe > 0 && rpe < 10) {
    rir = 10 - rpe;
  }
  // Heavily dampen RIR inflation on higher rep sets to prevent E1RM runaway
  // For reps > 8, RIR is notoriously unreliable for E1RM translation.
  let rirMultiplier = 1.0;
  if (reps >= 12) rirMultiplier = 0.25;
  else if (reps >= 8) rirMultiplier = 0.5;

  let effectiveReps = reps + rir * rirMultiplier;

  let isPrimary = false;
  if (exName) {
    isPrimary =
      isMainLiftMatch(exName, "Squat") ||
      isMainLiftMatch(exName, "Bench Press") ||
      isMainLiftMatch(exName, "Deadlift");
  }

  let e1rm: number;

  // Use the Wathen equation for primary lifts across all rep ranges.
  // Scientifically validated (Wathen, 1994) to better account for non-linear exponential
  // fatigue compared to the linear Brzycki formula, now continuous across all reps.
  if (isPrimary) {
    e1rm = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * effectiveReps));
  } else {
    // Standard Brzycki formula for non-primary accessories
    const cappedReps = Math.min(effectiveReps, 12);
    e1rm = weight * (36 / (37 - cappedReps));
  }

  return e1rm;
}

export function calculateWeightFromE1RM(
  e1rm: number,
  reps: number,
  rpe?: number,
  exName?: string,
): number {
  if (e1rm <= 0 || reps <= 0) return 0;
  let rir = 0;
  if (rpe !== undefined && rpe > 0 && rpe < 10) {
    rir = 10 - rpe;
  }
  let rirMultiplier = 1.0;
  if (reps >= 12) rirMultiplier = 0.25;
  else if (reps >= 8) rirMultiplier = 0.5;

  let effectiveReps = reps + rir * rirMultiplier;
  
  let isPrimary = false;
  if (exName) {
    isPrimary =
      isMainLiftMatch(exName, "Squat") ||
      isMainLiftMatch(exName, "Bench Press") ||
      isMainLiftMatch(exName, "Deadlift");
  }

  let targetWeight: number;

  // Use the inverse Wathen equation for primary lifts across all rep ranges to ensure mathematical continuity.
  if (isPrimary) {
    targetWeight = (e1rm * (48.8 + 53.8 * Math.exp(-0.075 * effectiveReps))) / 100;
  } else {
    // Standard inverse Brzycki formula for accessories
    const cappedReps = Math.min(effectiveReps, 12);
    targetWeight = e1rm * ((37 - cappedReps) / 36);
  }

  return targetWeight;
}

export function isTimedExercise(exName: string): boolean {
  if (!exName) return false;
  const lowerName = exName.toLowerCase();
  return (
    lowerName.includes("plank") ||
    lowerName.includes("hold") ||
    lowerName.includes("l-sit") ||
    lowerName.includes("lever")
  );
}

export function calculatePace(
  distance_meters?: number,
  time_seconds?: number,
): number {
  if (!distance_meters || !time_seconds || time_seconds <= 0) return 0;
  // returns Pace in m/s
  return distance_meters / time_seconds;
}

export function calculateWorkCapacity(
  volume: number,
  duration_minutes: number,
): number {
  if (duration_minutes <= 0) return 0;
  return volume / duration_minutes; // e.g. Tonnage per minute
}

export function calculateVolume(
  workout: any,
  countAllSets: boolean = false,
  unit: "metric" | "imperial" | "none" = "none",
  redlineScale: boolean = false,
  userWeight: number = 0,
): number | string {
  if (!workout || !workout.exercises)
    return unit === "none" ? 0 : `0 ${unit === "imperial" ? "LBS" : "kg"}`;
  let total = 0;
  workout.exercises.forEach((ex: any) => {
    if (!ex.sets) return;
    const isCalis = EXERCISE_DATABASE_TYPED.find(
      (e) => e.id === ex.exerciseId || e.name === ex.name,
    )?.isCalisthenics;
    ex.sets.forEach((s: any) => {
      // If countAllSets is true (like in TrainingView), bypass completed/warmup check
      if (countAllSets || (s.isCompleted && !s.isWarmup)) {
        let w = parseFloat(s.weight) || 0;
        if (redlineScale) {
          w = Math.round((w * 0.75) / 5) * 5;
        }
        total += w * (parseFloat(s.reps) || 0);
      }
    });
  });
  if (unit === "none") return total; // Return number directly if none
  return `${total.toLocaleString()} ${unit === "imperial" ? "LBS" : "kg"}`;
}

export function calculateMobilityIntegrity(sets: any[]): number {
  if (!sets || sets.length === 0) return 100;
  let totalScore = 0;
  let validSets = 0;

  sets.forEach((set) => {
    // Both pain scale and rom_quality can adjust the baseline 100
    if (set.pain_scale !== undefined || set.rom_quality) {
      let setScore = 100;
      if (set.pain_scale !== undefined) {
        // Pain is 1-10. Each point of pain reduces score by 5
        setScore -= set.pain_scale * 5;
      }
      if (set.rom_quality === "restricted") {
        setScore -= 20;
      }
      totalScore += Math.max(0, setScore);
      validSets++;
    }
  });

  if (validSets === 0) return 100;
  return totalScore / validSets;
}
