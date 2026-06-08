import { WorkoutSession, ActiveRecovery } from "../types/workout";
import { UserProfile } from "../contexts/SettingsContext";
import { EXERCISE_DATABASE } from "../constants/exercises";
import { ModalityRegistry } from "./modalities/ModalityRegistry";

export const applyIntensityModifications = (
  session: WorkoutSession,
  calibration: { isRedline: boolean, hasAerobicInterference: boolean }
): WorkoutSession => {
  let finalModifier = 1.0;
  let currentPenaltyType: "REDLINE" | "AEROBIC" | null = null;

  if (calibration.isRedline) {
    finalModifier = 0.75;
    currentPenaltyType = "REDLINE";
  } else if (calibration.hasAerobicInterference) {
    finalModifier = 0.85;
    currentPenaltyType = "AEROBIC";
  }

  if (finalModifier === 1.0) {
    return {
      ...session,
      penaltyType: null,
    };
  }

  const updatedExercises = (session.exercises || []).map((ex) => {
    // Prime Movers check
    const isPrimeMover =
      ex.isSquat ||
      ex.isDeadlift ||
      ex.name.toLowerCase().includes("squat") ||
      ex.name.toLowerCase().includes("deadlift");

    if (!isPrimeMover) return ex;

    const handler = ModalityRegistry.getHandler(ex.intent);

    const updatedSets = (ex.sets || []).map((set) => {
      if (set.isCompleted) return set;

      const baseWeightValue = parseFloat(set.baseWeight || set.weight) || 0;
      if (baseWeightValue <= 0) return set;

      // Apply Modality-Specific penalty (Volume vs Strength)
      const adjustedWeight = handler.applyInterferencePenalty(baseWeightValue, finalModifier);
      const updatedWeight = Math.round(adjustedWeight / 5) * 5;

      return {
        ...set,
        weight: updatedWeight.toString(),
        baseWeight: baseWeightValue.toString(), // Ensure baseWeight is preserved
      };
    });

    return {
      ...ex,
      sets: updatedSets,
    };
  });

  return {
    ...session,
    exercises: updatedExercises,
    penaltyApplied: true,
    isRedline: calibration.isRedline || session.isRedline,
    penaltyType: currentPenaltyType,
  };
};

export const calculateVolume = (session: WorkoutSession, profile?: UserProfile | null, unit: string = 'imperial'): string => {
  if (!session || !session.exercises) return `0 ${unit === "imperial" ? "LBS" : "kg"}`;
  
  let total = 0;
  session.exercises.forEach((ex) => {
    const isCalis = EXERCISE_DATABASE.find((e) => e.id === ex.exerciseId || e.name === ex.name)?.isCalisthenics;
    if (!ex.sets) return;
    
    // Use registry
    const completedSets = ex.sets.filter(s => s.isCompleted && !s.isWarmup);
    const handler = ModalityRegistry.getHandler(ex.intent);
    total += handler.calculateVolume(completedSets, isCalis, profile?.weight);
  });
  
  return `${total.toLocaleString()} ${unit === "imperial" ? "LBS" : "kg"}`;
};

export const calculateProgramCalories = (
  session: WorkoutSession,
  profile: UserProfile | null,
  unit: string
) => {
  if (!session || !session.exercises) return 0;
  // Based on estimated tonnage and HR intensity proxies
  // Metabolic equivalent for weightlifting: 1000 lbs moved ~ 0.5 kcal, just a proxy
  let totalVolume = 0;

  session.exercises.forEach((ex) => {
    const isCalis = EXERCISE_DATABASE.find(
      (e) => e.id === ex.exerciseId || e.name === ex.name,
    )?.isCalisthenics;
    if (!ex.sets) return;
    const completedSets = ex.sets.filter(s => s.isCompleted && !s.isWarmup);
    const handler = ModalityRegistry.getHandler(ex.intent);
    totalVolume += handler.calculateVolume(completedSets, isCalis, profile?.weight);
  });

  const tonnageInLbs =
    unit === "imperial" ? totalVolume : totalVolume * 2.20462;
  const volumeBurn = (tonnageInLbs / 100) * 0.05;

  let baseWeight = 75; // kg
  if (profile?.weight) {
    baseWeight =
      unit === "imperial" ? profile.weight * 0.453592 : profile.weight;
  }
  const sessionDurationMins =
    session.startTime && session.completedAt
      ? (session.completedAt - session.startTime) / 60000
      : 45; // Default 45 mins

  // Base BMR burn during the session
  const bmrBurn = (baseWeight * 24 * (sessionDurationMins / 60)) / 24;

  // Add the mechanical work completed
  return Math.round(bmrBurn + volumeBurn);
};
