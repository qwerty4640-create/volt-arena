import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { useSettings, UserProfile } from "./SettingsContext";
import { useToast } from "./ToastContext";
import {
  BlockType,
  getBlockForWeek,
  getRetentionProtocol,
} from "../constants/periodization";
import {
  getExercisesByPattern,
  ExerciseDefinition,
  getSwappableExercises,
  EXERCISE_DATABASE,
} from "../constants/exercises";
import {
  TRAINING_CONSTRAINTS,
  getInterferenceAdjustment,
} from "../constants/constraints";
import { calculateTier } from "../lib/strength";
import { ACTIVITY_LIBRARY } from "../data/activityLibrary";
import {
  isMainLiftMatch,
  isUnilateral,
  calculateE1RM,
} from "../utils/workoutUtils";
import { calculateSystemReadiness } from "../logic/recoveryEngine";
import { autoregulateTrainingMax } from "../logic/programmingEngine";
import { RECOVERY_ACTIVITIES } from "../data/recoveryLibrary";

const READINESS_STORAGE_KEY = "volt_readiness_scores";

export interface Set {
  id: string;
  weight: string;
  baseWeight?: string;
  reps: string;
  baseReps?: string;
  rpe: string;
  actualRpe?: string;
  isCompleted: boolean;
  isWarmup?: boolean;
  duration_seconds?: number;
  distance_meters?: number;
  heart_rate_avg?: number;
  pain_scale?: number;
  rom_quality?: "restricted" | "fluid";
}

export interface Exercise {
  id: string; // Session-specific unique ID
  exerciseId: string; // Permanent ID from EXERCISE_DATABASE
  name: string;
  sets: Set[];
  restPeriod?: number;
  isAdditional?: boolean;
  groupId?: string;
  groupTitle?: string;
  isSquat?: boolean;
  isBench?: boolean;
  isDeadlift?: boolean;
  intent?: string;
}

export interface WorkoutSession {
  id: string;
  uid?: string;
  date: string;
  time: string;
  title: string;
  description?: string;
  rulesOfEngagement?: string;
  exercises: Exercise[];
  startTime?: number;
  completedAt?: number;
  rpe?: number;
  targetRpe?: number;
  actualRpe?: number; // Post-session reflection
  reflectionSaved?: boolean;
  readiness?: number;
  sleep?: number;
  stress?: number;
  fatigue?: number;
  note?: string;
  duration?: string;
  volume?: string;
  caloriesBurned?: number;
  workCapacity?: number;
  blockType?: BlockType;
  blockLabel?: string;
  weekInBlock?: number;
  totalWeek?: number;
  penaltyApplied?: boolean;
  isRedline?: boolean;
  penaltyType?: "REDLINE" | "AEROBIC" | null;
  systemicFatigueModifier?: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  warmupCompleted?: boolean;
  warmupSkipped?: boolean;
  cooldownCompleted?: boolean;
  cooldownSkipped?: boolean;
}

export type RecoveryType = string;

export interface ActiveRecovery {
  id: string;
  uid: string;
  type: string; // To match ActivityType label
  activityId?: string;
  rpe: number;
  durationMinutes: number;
  date: string;
  timestamp: number;
  performedAt: string; // ISO8601 string
  note?: string;
  caloriesBurned?: number;
}

interface WorkoutContextType {
  history: WorkoutSession[];
  recoveryHistory: ActiveRecovery[];
  currentSession: WorkoutSession | null;
  startNewSession: (
    template?: WorkoutSession,
    readinessScore?: number,
    readinessModifier?: number,
    targetRpe?: number,
    biometrics?: { sleep: number; stress: number; fatigue: number },
  ) => void;
  completeSession: (data: { rpe: number; note: string }) => void;
  logNonProgramActivity: (
    data: Omit<
      ActiveRecovery,
      "id" | "uid" | "timestamp" | "date" | "caloriesBurned" | "type"
    > & { activityId: string },
  ) => Promise<void>;
  updateActiveRecovery: (
    id: string,
    data: Partial<ActiveRecovery>,
  ) => Promise<void>;
  deleteActiveRecovery: (id: string) => Promise<void>;
  updateCurrentSession: (session: WorkoutSession) => void;
  addExerciseToSession: (exercises: Exercise[]) => void;
  replaceExerciseInSession: (
    oldExerciseId: string,
    newExercise: Exercise,
  ) => void;
  setNextWorkoutExercises: (exercises: Exercise[]) => void;
  discardSession: () => void;
  getNextWorkoutTemplate: () => WorkoutSession;
  getWorkoutTemplate: (week: number, day: number) => WorkoutSession;
  getCalibrationStatus: () => {
    readiness: number;
    readinessModifier: number;
    recoveryModifier: number;
    hasAerobicInterference: boolean;
    isDeload: boolean;
    isPeak: boolean;
    isRedline: boolean;
    overtrainingRisk: "none" | "warning" | "critical";
    cumulativeFatigueScore: number;
    recommendedRpe: number;
    fatiguePenalty: number;
    stressPenalty: number;
    sleepDeficit: number;
    subjectiveScores: {
      sleepScore: number;
      stressScore: number;
      fatigueScore: number;
    } | null;
    ewmaRatio: number | null;
  };
  mockWorkoutCount: number | null;
  setMockWorkoutCount: (count: number | null) => void;
  resetProgress: () => Promise<void>;
  resetProgram: () => Promise<void>;
  updateHistoryWorkout: (workout: WorkoutSession) => Promise<void>;
  deleteHistoryWorkout: (id: string) => Promise<void>;
  saveReflection: (workoutId: string, actualRpe: number) => Promise<void>;
  pendingReflection: WorkoutSession | null;
  setPendingReflection: (workout: WorkoutSession | null) => void;
  recalibrateRecovery: (scores: {
    sleep: number;
    stress: number;
    fatigue: number;
  }) => void;
  logDailyHealthCheck: (data: {
    sleep: number;
    stress: number;
    fatigue: number;
    soreness: number;
    mood: number;
  }) => Promise<void>;
  isLoading: boolean;
  calculateProgramCalories: (
    weightKg: number,
    durationMins: number,
    sessionRpe: number,
    totalTonnage: number,
  ) => number;
  debugForceCritical: boolean;
  setDebugForceCritical: (val: boolean) => void;
  activeRestTarget: number | null;
  setActiveRestTarget: React.Dispatch<React.SetStateAction<number | null>>;
}

const cleanObject = (obj: any): any => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObject(item));
  }

  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    const value = cleanObject(obj[key]);
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const WORKOUT_TEMPLATES = [
  {
    title: "Foundation",
    slots: [
      { pattern: "squat", weight: 60, reps: "8", sets: 3 },
      { pattern: "push_horizontal", weight: 40, reps: "10", sets: 3 },
      { pattern: "pull_horizontal", weight: 30, reps: "12", sets: 3 },
    ],
  },
  {
    title: "Power",
    slots: [
      { pattern: "hinge", weight: 80, reps: "5", sets: 3 },
      { pattern: "push_vertical", weight: 30, reps: "8", sets: 3 },
      { pattern: "pull_vertical", weight: 0, reps: "10", sets: 3 },
    ],
  },
  {
    title: "Hybrid",
    slots: [
      { pattern: "squat", weight: 40, reps: "12", sets: 3, impact: "low" },
      {
        pattern: "push_horizontal",
        weight: 25,
        reps: "10",
        sets: 3,
        impact: "low",
      },
      {
        pattern: "pull_vertical",
        weight: 30,
        reps: "12",
        sets: 3,
        impact: "low",
      },
    ],
  },
];

const ENDURANCE_TEMPLATES = [
  {
    title: "Aerobic Base",
    slots: [
      { pattern: "impact", weight: 0, reps: "45 min", sets: 1 },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3 },
    ],
  },
  {
    title: "Threshold",
    slots: [
      { pattern: "impact", weight: 0, reps: "5 min", sets: 4 },
      { pattern: "mobility", weight: 0, reps: "10 min", sets: 1 },
    ],
  },
  {
    title: "Lactate",
    slots: [
      { pattern: "impact", weight: 0, reps: "1 min", sets: 8 },
      { pattern: "pull_horizontal", weight: 20, reps: "15", sets: 2 },
    ],
  },
];

const TACTICAL_TEMPLATES = [
  {
    title: "Combat Capacity",
    slots: [
      { pattern: "impact", weight: 40, reps: "30 min", sets: 1 },
      { pattern: "push_vertical", weight: 20, reps: "15", sets: 3 },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3 },
    ],
  },
  {
    title: "Functional Strength",
    slots: [
      { pattern: "hinge", weight: 60, reps: "8", sets: 4 },
      { pattern: "pull_vertical", weight: 0, reps: "AMRAP", sets: 3 },
      { pattern: "plyometric", weight: 0, reps: "5", sets: 4 },
    ],
  },
  {
    title: "Work Capacity",
    slots: [
      { pattern: "squat", weight: 30, reps: "15", sets: 4 },
      { pattern: "push_horizontal", weight: 30, reps: "20", sets: 3 },
      { pattern: "impact", weight: 0, reps: "10 min", sets: 1 },
    ],
  },
];

const EXPLOSIVE_TEMPLATES = [
  {
    title: "Rate of Force",
    slots: [
      { pattern: "plyometric", weight: 0, reps: "3", sets: 5 },
      { pattern: "squat", weight: 70, reps: "3", sets: 4 },
      { pattern: "pull_horizontal", weight: 40, reps: "8", sets: 3 },
    ],
  },
  {
    title: "Elasticity",
    slots: [
      { pattern: "plyometric", weight: 0, reps: "5", sets: 4 },
      { pattern: "hinge", weight: 60, reps: "5", sets: 3 },
      { pattern: "core", weight: 0, reps: "30 sec", sets: 4 },
    ],
  },
];

const MEDICAL_TEMPLATES = [
  {
    title: "Restoration",
    slots: [
      { pattern: "mobility", weight: 0, reps: "5 min", sets: 2 },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3 },
      { pattern: "accessory", weight: 10, reps: "15", sets: 3 },
    ],
  },
  {
    title: "Stability",
    slots: [
      { pattern: "core", weight: 0, reps: "45 sec", sets: 4 },
      { pattern: "accessory", weight: 15, reps: "12", sets: 3 },
      { pattern: "mobility", weight: 0, reps: "10 min", sets: 1 },
    ],
  },
];

const calculateFallback1RM = (
  exercise: ExerciseDefinition,
  bodyweight: number | undefined,
  level: string,
  unit: string,
  templateBaseWeight: number,
  age: number | undefined,
  gender: string | undefined,
  profileUnit?: string,
) => {
  // Normalize bodyweight to current unit
  let bw = bodyweight;
  if (bw && profileUnit && profileUnit !== unit) {
    bw = unit === "metric" ? bw / 2.20462 : bw * 2.20462;
  }

  // Default bodyweight if not provided: 80kg or 175LBS
  if (!bw) {
    bw = unit === "imperial" ? 175 : 80;
  }

  // Cap bodyweight for multiplier logic to prevent absurd numbers for very heavy lifters
  const maxBw = unit === "imperial" ? 250 : 115;
  const effectiveBw = Math.min(bw, maxBw);

  const name = exercise.name.toLowerCase();
  let multiplier = 0;
  const isFemale = gender === "female";

  if (exercise.pattern === "squat" && exercise.impact === "high") {
    if (isFemale) {
      multiplier =
        {
          untrained: 0.5,
          novice: 0.8,
          intermediate: 1.0,
          advanced: 1.3,
          elite: 1.6,
        }[level] || 0.5;
    } else {
      multiplier =
        {
          untrained: 0.8,
          novice: 1.2,
          intermediate: 1.5,
          advanced: 2.0,
          elite: 2.4,
        }[level] || 0.8;
    }
  } else if (
    exercise.pattern === "push_horizontal" &&
    exercise.impact === "medium"
  ) {
    // Bench Press equivalent
    if (isFemale) {
      multiplier =
        {
          untrained: 0.4,
          novice: 0.5,
          intermediate: 0.7,
          advanced: 0.9,
          elite: 1.2,
        }[level] || 0.4;
    } else {
      multiplier =
        {
          untrained: 0.6,
          novice: 0.9,
          intermediate: 1.2,
          advanced: 1.5,
          elite: 1.9,
        }[level] || 0.6;
    }
  } else if (exercise.pattern === "hinge" && exercise.impact === "high") {
    // Deadlift equivalent
    if (isFemale) {
      multiplier =
        {
          untrained: 0.6,
          novice: 1.0,
          intermediate: 1.2,
          advanced: 1.6,
          elite: 2.0,
        }[level] || 0.6;
    } else {
      multiplier =
        {
          untrained: 1.0,
          novice: 1.5,
          intermediate: 1.8,
          advanced: 2.3,
          elite: 2.8,
        }[level] || 1.0;
    }
  } else if (
    exercise.pattern === "push_vertical" &&
    exercise.impact === "high"
  ) {
    // Overhead Press equivalent
    if (isFemale) {
      multiplier =
        {
          untrained: 0.3,
          novice: 0.4,
          intermediate: 0.5,
          advanced: 0.7,
          elite: 0.9,
        }[level] || 0.3;
    } else {
      multiplier =
        {
          untrained: 0.5,
          novice: 0.7,
          intermediate: 0.9,
          advanced: 1.1,
          elite: 1.3,
        }[level] || 0.5;
    }
  } else {
    // For accessories, machine, or low-impact alternatives, scale the template base weight
    const tierMultiplier =
      {
        untrained: 0.8,
        novice: 1,
        intermediate: 1.2,
        advanced: 1.4,
        elite: 1.6,
      }[level] || 0.8;
    const unitMultiplier = unit === "imperial" ? 2.20462 : 1;
    const genderMultiplier = isFemale ? 0.65 : 1.0;

    // Goblet squat, DB presses, etc. require significantly reduced weight relative to barbells
    let exerciseTypeModifier = 1.0;
    if (name.includes("dumbbell") || name.includes("db"))
      exerciseTypeModifier = 0.45;
    else if (name.includes("goblet")) exerciseTypeModifier = 0.35;
    else if (
      name.includes("machine") ||
      name.includes("cable") ||
      name.includes("lat pulldown")
    )
      exerciseTypeModifier = 0.8;
    else if (name.includes("leg press"))
      exerciseTypeModifier = 1.8; // Leg press leverages differently
    else if (exercise.impact === "low") exerciseTypeModifier = 0.6;

    multiplier =
      (templateBaseWeight / effectiveBw) *
      tierMultiplier *
      unitMultiplier *
      1.33 *
      genderMultiplier *
      exerciseTypeModifier;
  }

  let estimated1RM = effectiveBw * multiplier;

  // Apply Age Factor (ExRx Age Adjustments)
  const userAge = age || 30; // Default to prime age if not provided
  let ageFactor = 1.0;
  if (userAge >= 14 && userAge <= 17) ageFactor = 0.9;
  else if (userAge >= 40 && userAge <= 49) ageFactor = 0.9;
  else if (userAge >= 50 && userAge <= 59) ageFactor = 0.8;
  else if (userAge >= 60 && userAge <= 69) ageFactor = 0.7;
  else if (userAge >= 70) ageFactor = 0.6;

  return Math.round(estimated1RM * ageFactor);
};

export const getDailyMissionTitleAndDesc = (
  blockType: string,
  day: number,
): { title: string; desc: string; rulesOfEngagement: string } => {
  const normBlock = (blockType || "").toLowerCase();

  // Decide the day index (normally we have days 1, 2, 3)
  const dIndex = ((day - 1) % 3) + 1;

  if (
    normBlock.includes("foundation") ||
    normBlock.includes("prehab") ||
    normBlock.includes("longevity")
  ) {
    if (dIndex === 1) {
      return {
        title: "Mechanics (Light/Tempo)",
        desc: "Focus on slow, controlled tempos and perfect movement form.",
        rulesOfEngagement:
          "Focus on building structural integrity and mastering movement mechanics. Prioritize control and stability over maximum rep counts.",
      };
    } else if (dIndex === 2) {
      return {
        title: "Structural (Accessories)",
        desc: "Build connective tissue density and support muscle accessories.",
        rulesOfEngagement:
          "Volume load management with target isolation. Move each rep with strict tension and zero kinetic leaks.",
      };
    } else {
      return {
        title: "Hybrid (Base Aerobics)",
        desc: "Develop aerobic glycolysis and active work capacity.",
        rulesOfEngagement:
          "Today's focus is joint lubrication, movement quality, and aerobic base. Heavy absolute loads are strictly prohibited today regardless of your physiological ceiling. Leave your ego at the door.",
      };
    }
  }

  if (
    normBlock.includes("hypertrophy") ||
    normBlock.includes("powerbuilding")
  ) {
    if (dIndex === 1) {
      return {
        title: "Volume Accumulation",
        desc: "Accumulate total mechanical tension with submaximal loads.",
        rulesOfEngagement:
          "Volume management is key. Aim for controlled repetitions with a focus on time under tension and muscle activation. Do not sacrifice form for ego load.",
      };
    } else if (dIndex === 2) {
      return {
        title: "Isolation/Pump",
        desc: "Maximize local vascularity and metabolic stress in targeted muscle groups.",
        rulesOfEngagement:
          "Force deliberate local hypoxia and focus purely on the target contractile tissue. Squeeze at the peak; do not use general biomechanical momentum.",
      };
    } else {
      return {
        title: "Functional Capacity",
        desc: "Maintain multi-planar structural movement and energy systems capacity.",
        rulesOfEngagement:
          "Strictly govern inter-set rest intervals. Optimize absolute density and work rate over absolute bar weight.",
      };
    }
  }

  if (normBlock.includes("strength") || normBlock.includes("pure_strength")) {
    if (dIndex === 1) {
      return {
        title: "Heavy Primary",
        desc: "Neuromuscular recruitment with high absolute load.",
        rulesOfEngagement:
          "Primary focus is absolute force production. Move the load with deliberate tension and grind through the sticking points. Rest periods must be strictly adhered to.",
      };
    } else if (dIndex === 2) {
      return {
        title: "Secondary Variation",
        desc: "Target movement weak points with targeted mechanical variations.",
        rulesOfEngagement:
          "Correct biomechanical deviations on complex multi-joint movements. Maintain high motor unit recruitment under strict technical execution.",
      };
    } else {
      return {
        title: "Weak-Point Development",
        desc: "Dedicated accessory and helper-muscle structural reinforcement.",
        rulesOfEngagement:
          "Strengthen the weakest link of your primary compound chain. Work through full active range of motion with high precision.",
      };
    }
  }

  if (
    normBlock.includes("peaking") ||
    normBlock.includes("max_effort") ||
    normBlock.includes("max effort") ||
    normBlock.includes("power") ||
    normBlock.includes("explosiveness") ||
    normBlock.includes("overreach") ||
    normBlock.includes("competition")
  ) {
    if (dIndex === 1) {
      return {
        title: "Max Effort (Heavy Singles/Doubles)",
        desc: "Test rate of force development and motor unit synchronization.",
        rulesOfEngagement:
          "High CNS strain with low total session volume. Prepare mentally for maximal motor-unit recruitment. Spotters and safety protocols are mandatory.",
      };
    } else if (dIndex === 2) {
      return {
        title: "Dynamic Effort (Speed/Power)",
        desc: "Move submaximal loads with maximum explosive velocity.",
        rulesOfEngagement:
          "Explosive intent is the objective. Maintain maximum velocity during the concentric phase with total control during the eccentric. Speed of the bar dictates set quality.",
      };
    } else {
      return {
        title: "Restoration (Active Recovery)",
        desc: "General blood flow, joint decompression, and targeted mobility work.",
        rulesOfEngagement:
          "Keep physical strain completely silent. The focus is flushing metabolic byproducts and down-regulating the autonomic nervous system.",
      };
    }
  }

  // Fallback / Deload or other Recovery blocks
  if (dIndex === 1) {
    return {
      title: "Restoration",
      desc: "Autonomic down-regulation, general mobility, and light motor patterns.",
      rulesOfEngagement:
        "Today is about accelerating recovery and restoration. Keep intensities and absolute loading minimal. The goal is blood flow, not fatigue accumulation.",
    };
  } else if (dIndex === 2) {
    return {
      title: "CNS Recovery",
      desc: "Deliberate neurological rest and joint decompression.",
      rulesOfEngagement:
        "Absolute avoidance of systemic failure or heavy structural fatigue. Rebuild neural drive and allow connective tissue reset.",
    };
  } else {
    return {
      title: "Light Aerobics",
      desc: "Low intensity steady state cardiopulmonary flushing.",
      rulesOfEngagement:
        "Maintain simple, low-impact base aerobic effort. Clear metabolic waste without sparking fresh systemic inflammation.",
    };
  }
};

const createSessionFromTemplate = (
  week: number,
  day: number,
  profile: UserProfile | null,
  currentUnit: "imperial" | "metric",
  lastSession: WorkoutSession | null,
  currentReadiness: number,
  hasAerobicInterference?: boolean,
  history: WorkoutSession[] = [],
  isNextWorkout: boolean = true,
): WorkoutSession => {
  const goals =
    profile?.trainingObjectives ||
    (profile?.trainingGoal ? [profile.trainingGoal] : ["powerbuilding"]);
  const primaryGoal = goals[0] || "powerbuilding";
  const customProgramBlocks = profile?.customProgramBlocks || [];
  const hasCustomPlan = customProgramBlocks.length > 0;

  const totalDurationWeeks = hasCustomPlan
    ? customProgramBlocks.reduce((acc, b) => acc + b.durationWeeks, 0)
    : (profile?.trainingDurationMonths || 3) * 4;

  const { block, weekInBlock } = getBlockForWeek(
    week,
    totalDurationWeeks,
    goals,
    profile?.customProgramBlocks,
  );

  // --- PHASE 1: INITIAL TEMPLATE SELECTION ---
  const currentPhaseStr = (block.type as string).toLowerCase();
  const missionInfo = getDailyMissionTitleAndDesc(block.type, day);

  let templatePool = WORKOUT_TEMPLATES;
  if (
    [
      "endurance",
      "aerobic base",
      "capacity",
      "vo2 max",
      "threshold",
      "endurance retention",
    ].includes(currentPhaseStr)
  ) {
    templatePool = ENDURANCE_TEMPLATES;
  } else if (["tactical"].includes(currentPhaseStr)) {
    templatePool = TACTICAL_TEMPLATES;
  } else if (
    ["explosiveness", "power", "peaking", "competition / taper"].includes(
      currentPhaseStr,
    )
  ) {
    templatePool = EXPLOSIVE_TEMPLATES;
  } else if (
    ["prehab", "longevity", "regeneration", "resiliency"].includes(
      currentPhaseStr,
    )
  ) {
    templatePool = MEDICAL_TEMPLATES;
  }

  const templateIndex = (day - 1) % templatePool.length;
  const initialTemplate = templatePool[templateIndex];

  // --- PHASE 2: BLENDING ENGINE ---
  // Using active phase goals prevents hybrid bleed from sequential programming blocks
  const activePhaseGoals = [currentPhaseStr as any];
  const interferenceModifier = getInterferenceAdjustment(activePhaseGoals);

  // Clone slots to avoid mutating constants
  let dynamicSlots = [...initialTemplate.slots];

  // Apply Medical Conditions filtering
  if (profile?.hasMedicalConditions && profile.medicalConditionDetails) {
    const details = profile.medicalConditionDetails.toLowerCase();

    dynamicSlots = dynamicSlots.map((slot) => {
      const conditionMatch =
        (details.includes("squat") && slot.pattern === "squat") ||
        (details.includes("hinge") && slot.pattern === "hinge") ||
        (details.includes("run") && slot.pattern === "impact") ||
        (details.includes("row") && slot.pattern === "impact") ||
        (details.includes("carry") && slot.pattern === "core");

      if (conditionMatch) {
        if (slot.pattern === "squat") return { ...slot, pattern: "core" };
        if (slot.pattern === "hinge") return { ...slot, pattern: "core" };
        if (slot.pattern === "impact") return { ...slot, pattern: "mobility" };
        return { ...slot, pattern: "core" };
      }
      return slot;
    });
  }

  // 1. Base Intensity from Block + Weekly Progression
  let blockIntensity =
    block.baseIntensity + (weekInBlock - 1) * block.intensityIncrementPerWeek;

  // 2. Readiness Adjustment
  let readinessModifier = 1.0;
  if (isNextWorkout) {
    if (currentReadiness >= 90) readinessModifier = 1.05;
    else if (currentReadiness < 70 && currentReadiness >= 50)
      readinessModifier = 0.9;
    else if (currentReadiness < 50) readinessModifier = 0.8;
  }

  // 3. Recovery Adjustment
  let recoveryModifier = 1.0;
  if (isNextWorkout && lastSession) {
    if (lastSession.rpe && lastSession.rpe >= 9) {
      recoveryModifier *= 0.95;
    }
    const hoursSinceLast =
      (Date.now() - (lastSession.completedAt || 0)) / 3600000;
    if (
      hoursSinceLast < 24 &&
      (lastSession.title.includes(missionInfo.title) ||
        lastSession.title.includes(initialTemplate.title))
    ) {
      recoveryModifier *= 0.9;
    }
  }

  // 4. Volume and Goal-Specific Logic
  let volumeModifier = 1.0 * interferenceModifier;

  // Intelligent Frequency Compensation: Scale volume per session if training more frequently
  // than the 3-day baseline to prevent excessive weekly load on repeated patterns.
  const frequency = profile?.trainingFrequency || 3;
  if (frequency > 3) {
    // If training 4 days, scale each session by ~82% (4 * 0.82 = 3.3 sessions worth of volume)
    // If training 5 days, scale each session by ~66% (5 * 0.66 = 3.3 sessions worth of volume)
    // This allows for a slight weekly increase (~10%) but prevents 100% hikes on repeated templates.
    const baselineDays = 3;
    const loadAllowance = 1.1; // 10% more weekly volume capacity allowed for higher frequency
    const scalingFactor = (baselineDays / frequency) * loadAllowance;
    volumeModifier *= Math.min(1.0, scalingFactor);
  }

  const isFinalWeek = weekInBlock === block.durationWeeks;

  if (
    goals.includes("pure_strength") &&
    block.type === BlockType.PEAKING &&
    isFinalWeek
  ) {
    volumeModifier *= 0.6; // 40% drop in volume for fatigue dissipation
  } else if (
    goals.includes("peaking") &&
    block.type === BlockType.COMPETITION
  ) {
    volumeModifier *= 0.5; // Drastic set reduction for realization
  } else if (
    goals.includes("longevity") &&
    block.type === BlockType.REGENERATION
  ) {
    blockIntensity = Math.min(blockIntensity, 0.75); // Hard cap intensity
  }

  // If the last sessions were overshoots (Actual RPE > Target RPE), reduce volume further
  const recentSessions = lastSession ? [lastSession] : [];
  const overshoots = recentSessions.filter(
    (s) => s.rpe && s.targetRpe && s.rpe > s.targetRpe,
  );
  if (overshoots.length >= 1) {
    volumeModifier *= 0.8;
  }

  const finalIntensity = blockIntensity * readinessModifier * recoveryModifier;
  const retentionProtocol = getRetentionProtocol(profile);

  return {
    id: `w${week}d${day}`,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    title: `W${week}D${day}: ${missionInfo.title}`,
    description: missionInfo.desc,
    rulesOfEngagement: missionInfo.rulesOfEngagement,
    startTime: Date.now(),
    blockType: block.type,
    blockLabel: block.label,
    weekInBlock,
    totalWeek: week,
    exercises: dynamicSlots.map((slot, i) => {
      const preferredImpact = goals.includes("longevity") ? "low" : "high";
      const selectedImpact = (slot as any).impact || preferredImpact;
      let availableExercises = getExercisesByPattern(
        slot.pattern as any,
        selectedImpact,
      );

      // Filter by gym access
      if (profile?.hasFullGymAccess === false) {
        const gymKeywords = [
          "Barbell",
          "Machine",
          "Cable",
          "Leg Press",
          "Hack Squat",
          "Assault Bike",
          "Rowing",
          "Sandbag",
          "Ammo Can",
          "Log ",
        ];
        const noGym = availableExercises.filter(
          (e) =>
            !gymKeywords.some((kw) =>
              e.name.toLowerCase().includes(kw.toLowerCase()),
            ),
        );
        if (noGym.length > 0) {
          availableExercises = noGym;
        }
      }

      // Select best fit exercise for the goal
      let selectedExercise = availableExercises[0];

      // If slot specifies a non-zero weight, avoid purely bodyweight squat if weighted alternatives are available in the list
      const slotWeight =
        typeof slot.weight === "string"
          ? parseFloat(slot.weight)
          : typeof slot.weight === "number"
            ? slot.weight
            : 0;
      if (slotWeight > 0 && selectedExercise?.id === "bodyweight_squat") {
        const weightedAlternative = availableExercises.find(
          (e) => e.id !== "bodyweight_squat",
        );
        if (weightedAlternative) {
          selectedExercise = weightedAlternative;
        }
      }

      // Secondary selection logic: if longevity, prefer non-barbell if available for certain patterns
      if (
        selectedExercise &&
        goals.includes("longevity") &&
        selectedExercise.name.includes("Barbell")
      ) {
        const safer = availableExercises.find(
          (e) => !e.name.includes("Barbell"),
        );
        if (safer) selectedExercise = safer;
      }

      // --- PHASE 2: Apply Constraints ---
      interface ConstraintExercise extends Partial<ExerciseDefinition> {
        intensityCap?: number;
        intensityBoost?: number;
        targetRPE?: number;
        restPeriod?: number;
        pattern?: any;
        weight?: any;
        reps?: any;
        sets?: any;
        name: string;
      }

      const constraintExercise = {
        ...slot,
        ...selectedExercise,
      } as ConstraintExercise;
      TRAINING_CONSTRAINTS.forEach((constraint) => {
        if (constraint.condition(activePhaseGoals)) {
          constraint.apply(constraintExercise, activePhaseGoals);
        }
      });

      let weight = 0;
      const isSquatPattern = slot.pattern === "squat";
      const isBenchPattern = slot.pattern === "push_horizontal";
      const isDeadliftPattern = slot.pattern === "hinge";

      const isSquat =
        isSquatPattern &&
        selectedExercise.impact === "high" &&
        !selectedExercise.name.toLowerCase().includes("dumbbell") &&
        !selectedExercise.name.toLowerCase().includes("goblet");
      const isBench =
        isBenchPattern &&
        selectedExercise.impact === "high" &&
        !selectedExercise.name.toLowerCase().includes("dumbbell");
      const isDeadlift =
        isDeadliftPattern &&
        selectedExercise.impact === "high" &&
        !selectedExercise.name.toLowerCase().includes("dumbbell");
      const isMainLift = isSquat || isBench || isDeadlift;

      const currentTier = profile
        ? calculateTier(
            profile.squatPR || 0,
            profile.benchPR || 0,
            profile.deadliftPR || 0,
            profile.weight || 0,
            profile.gender || "male",
          )
        : "untrained";

      // Apply Intensity Adjustments from constraints
      let adjustedIntensity = finalIntensity;
      if (constraintExercise.intensityCap)
        adjustedIntensity = Math.min(
          adjustedIntensity,
          constraintExercise.intensityCap,
        );
      if (constraintExercise.intensityBoost)
        adjustedIntensity += constraintExercise.intensityBoost;

      let estimated1RM = 0;
      let dynamicPR = 0;
      if (history && history.length > 0) {
        const sessionsWithEx = history
          .filter((s) =>
            s.exercises.some(
              (ex) =>
                ex.name.toLowerCase() === selectedExercise.name.toLowerCase(),
            ),
          )
          .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

        if (sessionsWithEx.length > 0) {
          const latestSession = sessionsWithEx[0];
          const targetEx = latestSession.exercises.find(
            (ex) =>
              ex.name.toLowerCase() === selectedExercise.name.toLowerCase(),
          );
          if (targetEx) {
            const e1rms = targetEx.sets
              .map((set: any) =>
                calculateE1RM(
                  parseFloat(set.weight) || 0,
                  parseInt(set.reps) || 0,
                  parseFloat(set.rpe || set.actualRpe || ""),
                ),
              )
              .filter((val) => val > 0);
            if (e1rms.length > 0) {
              dynamicPR = Math.max(...e1rms);
            }
          }
        }
      }

      if (profile && isMainLift) {
        let liftType = isSquat ? "Squat" : isBench ? "Bench Press" : "Deadlift";

        let profilePR = 0;
        if (isSquat) profilePR = profile.squatPR || 0;
        if (isBench) profilePR = profile.benchPR || 0;
        if (isDeadlift) profilePR = profile.deadliftPR || 0;

        // Autoregulation: heavily prioritize the E1RM generated from the LAST session, falling back to static profile PR.
        let pr = dynamicPR > 0 ? dynamicPR : profilePR;

        if (pr > 0) {
          let normalizedPR = pr;
          if (profile.unit !== currentUnit) {
            normalizedPR =
              currentUnit === "metric" ? pr / 2.20462 : pr * 2.20462;
          }
          estimated1RM = normalizedPR;
        } else {
          const baseWeight =
            typeof slot.weight === "string"
              ? parseFloat(slot.weight)
              : slot.weight;
          estimated1RM = calculateFallback1RM(
            selectedExercise,
            profile.weight,
            currentTier,
            currentUnit,
            baseWeight,
            profile.age,
            profile.gender,
            profile.unit,
          );
        }
      } else if (dynamicPR > 0) {
        estimated1RM = dynamicPR;
      } else {
        const baseWeight =
          typeof slot.weight === "string"
            ? parseFloat(slot.weight)
            : slot.weight;
        estimated1RM = calculateFallback1RM(
          selectedExercise,
          profile?.weight,
          currentTier,
          currentUnit,
          baseWeight,
          profile?.age,
          profile?.gender,
          profile?.unit,
        );
      }

      let baseFinalIntensity = blockIntensity * recoveryModifier;
      let adjustedBaseIntensity = baseFinalIntensity;
      if (constraintExercise.intensityCap)
        adjustedBaseIntensity = Math.min(
          adjustedBaseIntensity,
          constraintExercise.intensityCap,
        );
      if (constraintExercise.intensityBoost)
        adjustedBaseIntensity += constraintExercise.intensityBoost;

      // Phase 2: Autoregulatory Set & Rep Generation (Undulating Periodization)
      // Adapting Prilepin's Chart principles to maintain high-quality volume without excessive CNS/mechanical failure.
      let dynamicReps = block.baseReps;
      let dynamicSets = block.baseSets;
      if (isMainLift) {
        const isHypertrophyOriented = [
          BlockType.HYPERTROPHY,
          BlockType.FOUNDATION,
          BlockType.LONGEVITY,
          BlockType.RESILIENCY,
          BlockType.CAPACITY,
          BlockType.REGENERATION,
          BlockType.POWERBUILDING,
        ].includes(block.type as BlockType);

        const isDeloadOrRetention = [
          BlockType.DELOAD,
          BlockType.RETENTION,
          BlockType.STRENGTH_RETENTION,
          BlockType.ENDURANCE_RETENTION,
        ].includes(block.type as BlockType);

        if (isDeloadOrRetention) {
          // Keep base reps and sets to prevent accidental strength-zone loading
          dynamicReps = block.baseReps || "8";
          dynamicSets = block.baseSets || 2;
        } else if (isHypertrophyOriented) {
          if (adjustedIntensity < 0.65) {
            dynamicReps = "10-12";
            dynamicSets = 3;
          } else if (adjustedIntensity < 0.72) {
            dynamicReps = "8-12";
            dynamicSets = 4;
          } else if (adjustedIntensity < 0.78) {
            dynamicReps = "8-10";
            dynamicSets = 4;
          } else if (adjustedIntensity < 0.83) {
            dynamicReps = "6-8";
            dynamicSets = 4;
          } else {
            dynamicReps = "6-8";
            dynamicSets = 4;
          }
        } else {
          // Standard strength / peaking block mapping
          if (adjustedIntensity < 0.65) {
            dynamicReps = "8-10";
            dynamicSets = 3;
          } else if (adjustedIntensity < 0.75) {
            dynamicReps = "6-8";
            dynamicSets = 4;
          } else if (adjustedIntensity < 0.80) {
            dynamicReps = "4-6";
            dynamicSets = 5;
          } else if (adjustedIntensity < 0.85) {
            dynamicReps = "3-4";
            dynamicSets = 6;
          } else if (adjustedIntensity < 0.90) {
            dynamicReps = "2-3";
            dynamicSets = 7;
          } else if (adjustedIntensity < 0.95) {
            dynamicReps = "1-2";
            dynamicSets = 8;
          } else {
            dynamicReps = "1";
            dynamicSets = 10;
          }
        }
      }

      let reps = isMainLift ? dynamicReps : slot.reps;
      let sets = isMainLift ? dynamicSets : slot.sets;

      // Auto-Regulate the Intensity to prevent mechanical failure on high-readiness high-rep sets
      if (estimated1RM > 0) {
        let parsedMinReps = parseInt(reps.split("-")[0]) || 8;
        let targetRpeCeiling =
          constraintExercise.targetRPE || (isMainLift ? 8.5 : 8.0);
        let effectiveReps = parsedMinReps + (10 - targetRpeCeiling);
        let safeIntensityLimit = (37 - Math.min(effectiveReps, 12)) / 36;

        if (adjustedIntensity > safeIntensityLimit) {
          adjustedIntensity = safeIntensityLimit;
        }
        if (adjustedBaseIntensity > safeIntensityLimit) {
          adjustedBaseIntensity = safeIntensityLimit;
        }
      }

      let unmodifiedWeight =
        Math.round((estimated1RM * adjustedBaseIntensity) / 5) * 5;

      weight = Math.round((estimated1RM * adjustedIntensity) / 5) * 5;

      // Apply penalty for high-intensity aerobic activity before lower body days
      if (hasAerobicInterference && (isSquat || isDeadlift)) {
        weight = Math.round((weight * 0.85) / 5) * 5;
        unmodifiedWeight = Math.round((unmodifiedWeight * 0.85) / 5) * 5;
      }

      const isCalisthenic =
        selectedExercise?.isCalisthenics ||
        [
          "bodyweight_squat",
          "plank",
          "bicycle_crunch",
          "mountain_climbers",
          "flutter_kicks",
          "leg_raises_floor",
          "toe_touches",
          "side_plank",
        ].includes(selectedExercise?.id as string);

      if (isCalisthenic) {
        weight = 0;
        unmodifiedWeight = 0;
      }

      let exerciseName = selectedExercise.name;

      const unilateral =
        selectedExercise.isUnilateral || (slot as any).isUnilateral;
      if (unilateral) {
        sets = sets * 2;
      }

      if (volumeModifier < 1.0) {
        sets = Math.round(sets * volumeModifier);
        // Safeguard for main lifts to prevent excessive volume drop on frequency shifts
        if (isMainLift && sets < 2 && volumeModifier > 0.5) {
          sets = 2;
        }
        sets = Math.max(1, sets);
      }

      // Longevity: Tempo/Pause work instead of weight increase
      if (
        goals.includes("longevity") &&
        block.type === BlockType.REGENERATION &&
        isMainLift
      ) {
        exerciseName = `${selectedExercise.name} (3s Tempo)`;
      }

      let intent: string | undefined;
      if (!isMainLift) {
        const isHybrid =
          missionInfo.title.toLowerCase().includes("hybrid") ||
          initialTemplate.title.toLowerCase().includes("hybrid");
        const isRecovery =
          missionInfo.title.toLowerCase().includes("restoration") ||
          missionInfo.title.toLowerCase().includes("recovery") ||
          initialTemplate.title.toLowerCase().includes("restoration") ||
          block.type === BlockType.REGENERATION ||
          goals.includes("longevity");
        if (isRecovery) {
          intent = "[ACTIVE RECOVERY]";
        } else if (isHybrid) {
          intent = "[MOVEMENT QUALITY]";
        } else if (currentReadiness < 70) {
          intent = "[BLOOD FLOW]";
        }
      }

      return {
        id: `e${i}`,
        exerciseId: selectedExercise.id,
        name: exerciseName,
        isSquat,
        isBench,
        isDeadlift,
        intent,
        restPeriod: constraintExercise.restPeriod || (isMainLift ? 180 : 90),
        sets: [
          ...Array.from({ length: sets }).map((_, j) => {
            let targetSetRpe = constraintExercise.targetRPE
              ? constraintExercise.targetRPE.toString()
              : "";

            // Overwrite RPE Logic based on Goal if no constraint RPE
            if (!targetSetRpe) {
              if (isMainLift) {
                if (
                  block.type === BlockType.PEAKING ||
                  block.type === BlockType.MAX_EFFORT ||
                  block.type === BlockType.OVERREACH ||
                  block.type === BlockType.COMPETITION
                ) {
                  if (goals.includes("pure_strength")) {
                    targetSetRpe = isFinalWeek ? "10" : "9";
                  } else if (goals.includes("hypertrophy")) {
                    targetSetRpe = isFinalWeek ? "10" : "9.5";
                  } else if (goals.includes("peaking")) {
                    targetSetRpe = isFinalWeek ? "10" : "7";
                  } else if (goals.includes("longevity")) {
                    targetSetRpe = "7.5";
                  } else {
                    targetSetRpe = j === 0 ? "9" : "8"; // Top set vs Back-off sets (Powerbuilding fallback)
                  }
                } else if (goals.includes("longevity")) {
                  targetSetRpe = "7.5";
                }
              } else {
                // Accessories
                if (
                  block.type === BlockType.OVERREACH ||
                  block.type === BlockType.MAX_EFFORT
                ) {
                  if (goals.includes("hypertrophy")) {
                    targetSetRpe = "9";
                  } else if (
                    goals.includes("powerbuilding") ||
                    goals.includes("pure_strength")
                  ) {
                    targetSetRpe = "7.5";
                  }
                } else if (goals.includes("longevity")) {
                  targetSetRpe = "7.0";
                }
              }
            }

            return {
              id: `s${i}-${j}`,
              weight: weight.toString(),
              baseWeight: unmodifiedWeight.toString(),
              reps: reps,
              baseReps: reps,
              rpe: targetSetRpe,
              isCompleted: false,
            };
          }),
          ...(retentionProtocol.active && isMainLift
            ? [
                {
                  id: `s${i}-retention`,
                  weight: (Math.round((weight * 1.05) / 5) * 5).toString(),
                  baseWeight: (
                    Math.round((unmodifiedWeight * 1.05) / 5) * 5
                  ).toString(),
                  reps: "1",
                  baseReps: "1",
                  rpe: "9",
                  isCompleted: false,
                },
              ]
            : []),
        ],
      };
    }),
    currentExerciseIndex: 0,
    currentSetIndex: 0,
  };
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { unit, profile, updateProfile } = useSettings();
  const { showToast } = useToast();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [recoveryHistory, setRecoveryHistory] = useState<ActiveRecovery[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(
    null,
  );

  const [mockWorkoutCount, setMockWorkoutCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReflection, setPendingReflection] =
    useState<WorkoutSession | null>(null);
  const [activeRestTarget, setActiveRestTarget] = useState<number | null>(null);
  const [nextWorkoutOverrides, setNextWorkoutOverrides] = useState<
    Exercise[] | null
  >(() => {
    const saved = localStorage.getItem("berserker_template_overrides");
    return saved ? JSON.parse(saved) : null;
  });

  // Load current session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("berserker_current_session");
    if (savedSession) {
      try {
        setCurrentSession(JSON.parse(savedSession));
      } catch (e) {
        console.error("Failed to parse saved session", e);
        localStorage.removeItem("berserker_current_session");
      }
    }
  }, []);

  // Persist current session to localStorage
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem(
        "berserker_current_session",
        JSON.stringify(currentSession),
      );
    } else {
      localStorage.removeItem("berserker_current_session");
    }
  }, [currentSession]);

  // Handle unit conversion for current session
  const prevUnitRef = React.useRef(unit);
  useEffect(() => {
    if (prevUnitRef.current && prevUnitRef.current !== unit) {
      const weightFactor = unit === "metric" ? 1 / 2.20462 : 2.20462;
      if (currentSession) {
        const updatedSession = { ...currentSession };
        updatedSession.exercises = updatedSession.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((set) => ({
            ...set,
            weight: set.weight
              ? String(Math.round(parseFloat(set.weight) * weightFactor))
              : "",
          })),
        }));
        setCurrentSession(updatedSession);
      }
    }
    prevUnitRef.current = unit;
  }, [unit]);

  // Sync with Firestore
  useEffect(() => {
    console.log(
      "Auth: Setting up onAuthStateChanged listener in WorkoutContext...",
    );
    let unsubscribeFirestore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        console.log(
          "Auth: State changed in WorkoutContext. User:",
          user ? user.email : "NULL",
        );

        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = undefined;
        }

        if (user) {
          const workoutsPath = `users/${user.uid}/workouts`;
          const recoveryPath = `users/${user.uid}/active_recovery`;

          const q = query(
            collection(db, workoutsPath),
            orderBy("completedAt", "desc"),
          );

          const qRecovery = query(
            collection(db, recoveryPath),
            orderBy("timestamp", "desc"),
          );

          const unsubscribeRecovery = onSnapshot(
            qRecovery,
            (snapshot) => {
              const recoveries = snapshot.docs.map(
                (doc) =>
                  ({
                    ...doc.data(),
                    id: doc.id,
                  }) as ActiveRecovery,
              );
              setRecoveryHistory(recoveries);
            },
            (error) => {
              if (auth.currentUser) {
                handleFirestoreError(error, OperationType.LIST, recoveryPath);
              }
            },
          );

          const unsubscribeWorkouts = onSnapshot(
            q,
            (snapshot) => {
              const workouts = snapshot.docs.map(
                (doc) =>
                  ({
                    ...doc.data(),
                    id: doc.id,
                  }) as WorkoutSession,
              );
              setHistory(workouts);

              // Check for pending reflections
              const now = Date.now();
              const fifteenMins = 15 * 60 * 1000;
              const twentyFourHours = 24 * 60 * 60 * 1000;

              const needsReflection = workouts.find(
                (s) =>
                  s.completedAt &&
                  !s.reflectionSaved &&
                  now - s.completedAt > fifteenMins &&
                  now - s.completedAt < twentyFourHours,
              );

              setPendingReflection(needsReflection || null);
              setIsLoading(false);
            },
            (error) => {
              if (auth.currentUser) {
                console.error(
                  "Auth: Firestore workouts listener error:",
                  error,
                );
                handleFirestoreError(error, OperationType.LIST, workoutsPath);
              }
              setIsLoading(false);
            },
          );

          const biometricsPath = `users/${user.uid}/recovery_data/current`;
          const unsubscribeBiometrics = onSnapshot(
            doc(db, biometricsPath),
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                const isRecent =
                  Date.now() - (data.timestamp || 0) < 24 * 60 * 60 * 1000;
                if (isRecent) {
                  const parsed = {
                    sleep: Number(data.sleep) || 5,
                    stress: Number(data.stress) || 5,
                    fatigue: Number(data.fatigue) || 5,
                    soreness:
                      data.soreness !== undefined
                        ? Number(data.soreness)
                        : undefined,
                    mood:
                      data.mood !== undefined ? Number(data.mood) : undefined,
                    timestamp: Number(data.timestamp) || Date.now(),
                  };
                  setSubjectiveReadiness(parsed);
                  localStorage.setItem(
                    READINESS_STORAGE_KEY,
                    JSON.stringify(parsed),
                  );
                } else {
                  setSubjectiveReadiness(null);
                  localStorage.removeItem(READINESS_STORAGE_KEY);
                }
              } else {
                setSubjectiveReadiness(null);
                localStorage.removeItem(READINESS_STORAGE_KEY);
              }
            },
            (error) => {
              if (auth.currentUser) {
                console.error(
                  "Auth: Firestore biometrics reader error:",
                  error,
                );
                handleFirestoreError(error, OperationType.GET, biometricsPath);
              }
            },
          );

          unsubscribeFirestore = () => {
            unsubscribeRecovery();
            unsubscribeWorkouts();
            unsubscribeBiometrics();
          };
        } else {
          setHistory([]);
          setRecoveryHistory([]);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error(
          "Auth: onAuthStateChanged error in WorkoutContext:",
          error,
        );
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Save mock count to localStorage
  useEffect(() => {
    const savedMockCount = localStorage.getItem("berserker_mock_count");
    if (savedMockCount) {
      setMockWorkoutCount(parseInt(savedMockCount));
    }
  }, []);

  useEffect(() => {
    if (mockWorkoutCount !== null) {
      localStorage.setItem("berserker_mock_count", mockWorkoutCount.toString());
    } else {
      localStorage.removeItem("berserker_mock_count");
    }
  }, [mockWorkoutCount]);

  const applyIntensityModifications = (
    session: WorkoutSession,
    recoveryHistoryOverride?: ActiveRecovery[],
  ): WorkoutSession => {
    const calibration = getCalibrationStatus(recoveryHistoryOverride);

    // Logic: Redline takes precedence over aerobic interference
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

      const updatedSets = (ex.sets || []).map((set) => {
        if (set.isCompleted) return set;

        const baseWeightValue = parseFloat(set.baseWeight || set.weight) || 0;
        if (baseWeightValue <= 0) return set;

        // Apply penalty from baseWeight to prevent compounding
        // Rounding Check: Nearest 5 units
        const updatedWeight =
          Math.round((baseWeightValue * finalModifier) / 5) * 5;
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

  const applyMidSessionPenalty = (
    recoveryHistoryOverride?: ActiveRecovery[],
  ) => {
    if (!currentSession || currentSession.penaltyApplied) return;
    const penalizedSession = applyIntensityModifications(
      currentSession,
      recoveryHistoryOverride,
    );
    setCurrentSession(penalizedSession);
  };

  const logNonProgramActivity = async (
    data: Omit<
      ActiveRecovery,
      "id" | "uid" | "timestamp" | "date" | "caloriesBurned" | "type"
    > & { activityId: string },
  ) => {
    if (!auth.currentUser) return;

    // Search in both standard library and recovery library
    const activity =
      ACTIVITY_LIBRARY.find((a) => a.id === data.activityId) ||
      RECOVERY_ACTIVITIES.find((a) => a.id === data.activityId);

    if (!activity) {
      console.error("Activity not found in any library:", data.activityId);
      return;
    }

    let weightKg = 75;
    if (profile?.weight) {
      weightKg =
        unit === "imperial" ? profile.weight * 0.453592 : profile.weight;
    } else {
      showToast(
        "Profile weight missing. Using 75kg default for burn estimation.",
        5000,
        "warning",
      );
    }

    const intensityScalar = Math.max(0.4, data.rpe / 6);
    const MET = activity.baseMET;
    const durationMins = data.durationMinutes;
    const totalBurn = Math.round(
      ((MET * 3.5 * weightKg) / 200) * durationMins * intensityScalar,
    );

    const performedTime = new Date(data.performedAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isWithin24h = now - performedTime <= twentyFourHours;

    const activityData: Omit<
      ActiveRecovery,
      "id" | "uid" | "timestamp" | "date"
    > = {
      type: activity.label,
      activityId: activity.id,
      rpe: data.rpe,
      durationMinutes: durationMins,
      performedAt: data.performedAt,
      note: data.note,
      caloriesBurned: totalBurn,
    };

    // Trigger mid-session fatigue scaling ONLY if a session is active
    // AND the activity was performed within the relevant 24-hour physiological window
    if (currentSession && isWithin24h) {
      // Engineering Update: Pass the potential new state change immediately to prevent state-lag from Firestore
      const tentativeRecoveryHistory = [
        {
          ...activityData,
          id: "tentative",
          uid: auth.currentUser.uid,
          timestamp: performedTime,
          date: new Date(data.performedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        },
        ...recoveryHistory,
      ];

      applyMidSessionPenalty(tentativeRecoveryHistory);
    }

    const recoveryPath = `users/${auth.currentUser.uid}/active_recovery`;
    const docRef = doc(collection(db, recoveryPath));
    const newRecovery: ActiveRecovery = {
      ...activityData,
      id: docRef.id,
      uid: auth.currentUser.uid,
      timestamp: performedTime,
      date: new Date(data.performedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    try {
      await setDoc(docRef, newRecovery);
      showToast(`Activity Logged: ${totalBurn} kcal burned.`, 4000, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, recoveryPath);
    }
  };

  const updateActiveRecovery = async (
    id: string,
    data: Partial<ActiveRecovery>,
  ) => {
    if (!auth.currentUser) return;
    const recoveryPath = `users/${auth.currentUser.uid}/active_recovery/${id}`;

    // If the performedAt date changes, we need to recalculate the timestamp and date strings
    const updates = { ...data };
    if (updates.performedAt) {
      const performedTime = new Date(updates.performedAt).getTime();
      updates.timestamp = performedTime;
      updates.date = new Date(updates.performedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    try {
      // Use setDoc with merge to ensure partial updates work safely
      await setDoc(
        doc(db, `users/${auth.currentUser.uid}/active_recovery`, id),
        updates,
        { merge: true },
      );
      showToast("Action Successful.", 3000, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, recoveryPath);
    }
  };

  const deleteActiveRecovery = async (id: string) => {
    if (!auth.currentUser) return;
    const recoveryPath = `users/${auth.currentUser.uid}/active_recovery/${id}`;
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(
        doc(db, `users/${auth.currentUser.uid}/active_recovery`, id),
      );
      showToast("Action Successful.", 3000, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, recoveryPath);
    }
  };

  const [subjectiveReadiness, setSubjectiveReadiness] = useState<{
    sleep: number;
    stress: number;
    fatigue: number;
    soreness?: number;
    mood?: number;
    timestamp: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem(READINESS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      /* noop */
    }
    return null;
  });

  const logDailyHealthCheck = async (data: {
    sleep: number;
    stress: number;
    fatigue: number;
    soreness: number;
    mood: number;
  }) => {
    const newData = { ...data, timestamp: Date.now() };
    setSubjectiveReadiness(newData);
    localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify(newData));

    if (auth.currentUser) {
      const recoveryDocPath = `users/${auth.currentUser.uid}/recovery_data/current`;
      const historyDocPath = `users/${auth.currentUser.uid}/biometric_history/${newData.timestamp}`;
      try {
        await Promise.all([
          setDoc(doc(db, recoveryDocPath), newData),
          setDoc(doc(db, historyDocPath), newData),
        ]);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, recoveryDocPath);
      }
    }
  };

  const recalibrateRecovery = (
    scores: { sleep: number; stress: number; fatigue: number } | null,
  ) => {
    if (scores === null) {
      localStorage.removeItem(READINESS_STORAGE_KEY);
      setSubjectiveReadiness(null);
      // Optional: Clear active recovery history from the last 24h if "ignore" means clear
      setRecoveryHistory((prev) =>
        prev.filter((r) => (Date.now() - r.timestamp) / 3600000 >= 24),
      );
      showToast("System Reset: Using Objective Metrics.", 2000, "info");
      return;
    }
    const newData = { ...scores, timestamp: Date.now() };
    localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify(newData));
    setSubjectiveReadiness(newData);
    showToast("Recovery Profile Updated.", 2000, "success");
  };

  const [debugForceCritical, setDebugForceCritical] = useState(false);

  const getCalibrationStatus = (recoveryOverride?: ActiveRecovery[]) => {
    if (debugForceCritical) {
      return {
        readiness: 5,
        readinessModifier: 0.7,
        recoveryModifier: 1.0,
        hasAerobicInterference: false,
        isDeload: true,
        isPeak: false,
        isRedline: true,
        overtrainingRisk: "critical" as const,
        cumulativeFatigueScore: 25,
        recommendedRpe: 5,
        ewmaRatio: 1.8,
        fatiguePenalty: 1.0,
        stressPenalty: 1.0,
        sleepDeficit: 0,
        subjectiveScores: {
          sleepScore: 1,
          stressScore: 1,
          fatigueScore: 1,
        },
      };
    }
    const activeRecoveryHistory = recoveryOverride || recoveryHistory;
    // State Integrity Check: Ensure subjective readiness values are valid numbers before passing to logic engine
    const safeSubjectiveReadiness = subjectiveReadiness
      ? {
          ...subjectiveReadiness,
          sleep:
            isNaN(subjectiveReadiness.sleep) ||
            subjectiveReadiness.sleep === null
              ? 5
              : subjectiveReadiness.sleep,
          stress:
            isNaN(subjectiveReadiness.stress) ||
            subjectiveReadiness.stress === null
              ? 5
              : subjectiveReadiness.stress,
          fatigue:
            isNaN(subjectiveReadiness.fatigue) ||
            subjectiveReadiness.fatigue === null
              ? 5
              : subjectiveReadiness.fatigue,
          soreness:
            subjectiveReadiness.soreness === undefined ||
            isNaN(subjectiveReadiness.soreness) ||
            subjectiveReadiness.soreness === null
              ? 5
              : subjectiveReadiness.soreness,
          mood:
            subjectiveReadiness.mood === undefined ||
            isNaN(subjectiveReadiness.mood) ||
            subjectiveReadiness.mood === null
              ? 5
              : subjectiveReadiness.mood,
        }
      : null;

    const {
      readinessScore,
      readinessModifier,
      recommendedRpe,
      overtrainingRisk,
      isRedline,
      cumulativeFatigueScore,
      sleepDeficit,
      fatiguePenalty,
      stressPenalty,
      ewmaRatio,
    } = calculateSystemReadiness(
      history,
      activeRecoveryHistory,
      safeSubjectiveReadiness,
      profile?.programResetAt,
      unit,
      profile?.weight,
    );

    const hasSubjectiveData = subjectiveReadiness !== null;

    return {
      readiness: readinessScore,
      readinessModifier,
      recoveryModifier: 1.0,
      hasAerobicInterference: false,
      isDeload: readinessScore < 50,
      isPeak: readinessScore >= 90,
      isRedline,
      overtrainingRisk,
      cumulativeFatigueScore,
      recommendedRpe,
      sleepDeficit,
      fatiguePenalty,
      stressPenalty,
      ewmaRatio,
      subjectiveScores: hasSubjectiveData
        ? {
            sleepScore: subjectiveReadiness?.sleep || 5,
            stressScore: subjectiveReadiness?.stress || 5,
            fatigueScore: subjectiveReadiness?.fatigue || 5,
          }
        : null,
    };
  };

  const getNextWorkoutTemplate = useCallback(() => {
    let filteredHistory = history;

    // Mitigate bugged backfills: if programResetAt exists but wipes ALL history
    // when we clearly have history, it's likely a bugged timestamp. Ignore it.
    if (profile?.programResetAt) {
      const tempFiltered = history.filter(
        (s) => (s.completedAt || 0) > profile.programResetAt!,
      );
      if (tempFiltered.length > 0) {
        filteredHistory = tempFiltered;
      } else if (
        history.length > 0 &&
        Date.now() - profile.programResetAt < 24 * 60 * 60 * 1000
      ) {
        // Ignored buggy recent backfill that wiped everything
      } else if (tempFiltered.length === 0) {
        // A true manual reset with no items post-reset
        filteredHistory = [];
      }
    }

    const lastSession = filteredHistory.length > 0 ? filteredHistory[0] : null;
    const calibration = getCalibrationStatus();
    const currentReadiness = calibration.readiness;
    const hasAerobicInterference = calibration.hasAerobicInterference;

    if (filteredHistory.length === 0) {
      const startWeek = 1 + (profile?.trainingWeekOffset || 0);
      return createSessionFromTemplate(
        startWeek,
        1,
        profile,
        unit,
        null,
        currentReadiness,
        hasAerobicInterference,
        history,
      );
    }

    const lastWorkout = filteredHistory[0];
    const dayMatch = lastWorkout.title?.match(/D(\d+)/);
    const weekMatch = lastWorkout.title?.match(/W(\d+)/);

    let nextDay = dayMatch ? parseInt(dayMatch[1]) + 1 : 1;
    let nextWeek = weekMatch ? parseInt(weekMatch[1]) : 1;

    const frequency = profile?.trainingFrequency || 3;
    if (nextDay > frequency) {
      nextDay = 1;
      nextWeek += 1;
    }

    // Wrap week based on total duration
    const durationMonths = profile?.trainingDurationMonths || 3;
    const totalDurationWeeks = durationMonths * 4;
    if (nextWeek > totalDurationWeeks) {
      nextWeek = 1; // Restart cycle
    }

    const finalWeek = nextWeek + (profile?.trainingWeekOffset || 0);
    const session = createSessionFromTemplate(
      finalWeek,
      nextDay,
      profile,
      unit,
      lastSession,
      currentReadiness,
      hasAerobicInterference,
      history,
    );

    if (nextWorkoutOverrides) {
      session.exercises = nextWorkoutOverrides;
    }

    return session;
  }, [history, profile, unit, nextWorkoutOverrides]); // getCalibrationStatus reads from state correctly.

  const getWorkoutTemplate = useCallback(
    (week: number, day: number) => {
      let filteredHistory = history;
      if (profile?.programResetAt) {
        const tempFiltered = history.filter(
          (s) => (s.completedAt || 0) > profile.programResetAt!,
        );
        if (tempFiltered.length > 0) {
          filteredHistory = tempFiltered;
        } else if (
          history.length > 0 &&
          Date.now() - profile.programResetAt < 24 * 60 * 60 * 1000
        ) {
          // Ignored buggy backfill
        } else {
          filteredHistory = [];
        }
      }

      const lastSession =
        filteredHistory.length > 0 ? filteredHistory[0] : null;

      let nextWeek = 1;
      let nextDay = 1;

      if (filteredHistory.length > 0) {
        const lastWorkout = filteredHistory[0];
        const dayMatch = lastWorkout.title?.match(/D(\d+)/);
        const weekMatch = lastWorkout.title?.match(/W(\d+)/);
        nextDay = dayMatch ? parseInt(dayMatch[1]) + 1 : 1;
        nextWeek = weekMatch ? parseInt(weekMatch[1]) : 1;
        const frequency = profile?.trainingFrequency || 3;
        if (nextDay > frequency) {
          nextDay = 1;
          nextWeek += 1;
        }
      }
      const startWeek = nextWeek + (profile?.trainingWeekOffset || 0);
      const isNextWorkout = week === startWeek && day === nextDay;

      const calibration = getCalibrationStatus();
      const currentReadiness = isNextWorkout ? calibration.readiness : 100;
      const hasAerobicInterference = calibration.hasAerobicInterference;

      return createSessionFromTemplate(
        week,
        day,
        profile,
        unit,
        lastSession,
        currentReadiness,
        hasAerobicInterference,
        history,
        isNextWorkout,
      );
    },
    [history, profile, unit],
  );

  const startNewSession = (
    template?: WorkoutSession,
    readinessScore?: number,
    readinessModifier?: number,
    targetRpe?: number,
    biometrics?: { sleep: number; stress: number; fatigue: number },
  ) => {
    const calibration = getCalibrationStatus();
    let session: WorkoutSession;

    if (template) {
      session = {
        ...template,
        startTime: template.startTime || Date.now(),
        penaltyApplied: false,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
      };

      if (readinessScore !== undefined) session.readiness = readinessScore;
      if (biometrics) {
        session.sleep = biometrics.sleep;
        session.stress = biometrics.stress;
        session.fatigue = biometrics.fatigue;
      } else if (subjectiveReadiness) {
        session.sleep = subjectiveReadiness.sleep;
        session.stress = subjectiveReadiness.stress;
        session.fatigue = subjectiveReadiness.fatigue;
      }

      // Clear overrides when session starts
      setNextWorkoutOverrides(null);
      localStorage.removeItem("berserker_template_overrides");

      // Normalization check: Ensure baseWeight exists
      session.exercises = (session.exercises || []).map((ex) => ({
        ...ex,
        sets: (ex.sets || []).map((s) => ({
          ...s,
          baseWeight: s.baseWeight || s.weight,
        })),
      }));
    } else {
      session = getNextWorkoutTemplate();
      session.startTime = Date.now();
      // Clear overrides when session starts
      setNextWorkoutOverrides(null);
      localStorage.removeItem("berserker_template_overrides");

      session.penaltyApplied = false;
      session.currentExerciseIndex = 0;
      session.currentSetIndex = 0;

      // Ensure biometrics are attached regardless of readiness check outcome
      const finalBiometrics = biometrics || subjectiveReadiness;
      if (finalBiometrics) {
        session.sleep = finalBiometrics.sleep;
        session.stress = finalBiometrics.stress;
        session.fatigue = finalBiometrics.fatigue;
      }
    }

    if (
      !calibration.isRedline &&
      readinessScore !== undefined &&
      readinessModifier !== undefined
    ) {
      session.readiness = readinessScore;
      session.targetRpe = targetRpe;

      // Apply the modifier to the weights
      session.exercises = (session.exercises || []).map((ex) => {
        const isMainLift =
          isMainLiftMatch(ex.name || "", "Squat") ||
          isMainLiftMatch(ex.name || "", "Bench Press") ||
          isMainLiftMatch(ex.name || "", "Deadlift");

        let updatedSets = ex.sets || [];

        // Cut accessory volume if red light (modifier < 1.0)
        if (!isMainLift && readinessModifier < 1.0 && updatedSets.length > 2) {
          updatedSets = updatedSets.slice(0, updatedSets.length - 1);
        }

        return {
          ...ex,
          sets: updatedSets.map((set) => {
            const baseValue = parseFloat(set.baseWeight || set.weight) || 0;
            return {
              ...set,
              weight: (
                Math.round((baseValue * readinessModifier) / 5) * 5
              ).toString(),
              baseWeight: baseValue.toString(),
            };
          }),
        };
      });
    }

    // Engineering Update: Applied penalized weights at birth if safety triggers active
    session = applyIntensityModifications(session);

    setCurrentSession(session);
  };

  const updateCurrentSession = (session: WorkoutSession) => {
    setCurrentSession(session);
  };

  const addExerciseToSession = (newExercises: Exercise[]) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      exercises: [...(currentSession.exercises || []), ...newExercises],
    });
  };

  const replaceExerciseInSession = (
    oldExerciseId: string,
    newExercise: Exercise,
  ) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      exercises: (currentSession.exercises || []).map((ex) =>
        ex.id === oldExerciseId ? newExercise : ex,
      ),
    });
  };

  const setNextWorkoutExercises = (exercises: Exercise[]) => {
    setNextWorkoutOverrides(exercises);
    localStorage.setItem(
      "berserker_template_overrides",
      JSON.stringify(exercises),
    );
  };

  const discardSession = async () => {
    try {
      setCurrentSession(null);
      localStorage.removeItem("berserker_current_session");
      showToast("Action Successful.", 3000, "success");
    } catch (e) {
      console.warn("Session discard error: ", e);
    }
  };

  const completeSession = async (data: { rpe: number; note: string }) => {
    if (!currentSession) return;

    const currentUid = auth.currentUser ? auth.currentUser.uid : "guest";

    // Bug 1 Fix: Capture session data locally before state cleanup as requested
    const sessionToSave = { ...currentSession };

    // Adaptive dynamic adjustment of PRs based on the completed exercises' sets to prevent undertraining or overtraining
    let squatPRUpdate = profile?.squatPR || 0;
    let benchPRUpdate = profile?.benchPR || 0;
    let deadliftPRUpdate = profile?.deadliftPR || 0;
    let hasPRChanges = false;

    sessionToSave.exercises.forEach((ex) => {
      const isSquat = isMainLiftMatch(ex.name, "Squat");
      const isBench = isMainLiftMatch(ex.name, "Bench Press");
      const isDeadlift = isMainLiftMatch(ex.name, "Deadlift");

      if (isSquat || isBench || isDeadlift) {
        const completedSets = (ex.sets || []).filter(
          (s) => s.isCompleted && !s.isWarmup,
        );
        if (completedSets.length > 0) {
          const totalActualRpe = completedSets.reduce(
            (sum, s) =>
              sum + (parseFloat(s.rpe || (s as any).actualRpe || "") || 0),
            0,
          );
          const avgActualRpe = totalActualRpe / completedSets.length;

          const targetRpe = parseFloat(String(sessionToSave.targetRpe || "7"));

          const isHybridOrRecovery =
            sessionToSave.title.toLowerCase().includes("hybrid") ||
            sessionToSave.title.toLowerCase().includes("recovery") ||
            sessionToSave.title.toLowerCase().includes("restoration");

          if (avgActualRpe > 0 && targetRpe > 0 && !isHybridOrRecovery) {
            const currentPR = isSquat
              ? squatPRUpdate
              : isBench
                ? benchPRUpdate
                : deadliftPRUpdate;
            const targetRepsStr =
              completedSets[0].baseReps || completedSets[0].reps;
            const targetRepsParsed = parseInt(targetRepsStr.split("-")[0]) || 5;

            const totalActualReps = completedSets.reduce(
              (sum, s) => sum + (parseInt(s.reps) || 0),
              0,
            );
            const avgActualReps = totalActualReps / completedSets.length;

            const weightUsed = parseFloat(completedSets[0].weight) || 0;

            // If we have a current PR recorded, run autoregulation engine
            if (currentPR > 0) {
              const perf = {
                exerciseId: ex.exerciseId,
                targetRPE: targetRpe,
                actualRPE: avgActualRpe,
                targetReps: targetRepsParsed,
                actualReps: avgActualReps,
                weightUsed: weightUsed,
                isAMRAP: false,
              };
              const newMax = autoregulateTrainingMax(
                currentPR,
                perf,
                "submax_531",
              );
              if (newMax !== currentPR) {
                if (isSquat) squatPRUpdate = newMax;
                else if (isBench) benchPRUpdate = newMax;
                else if (isDeadlift) deadliftPRUpdate = newMax;
                hasPRChanges = true;
              }
            } else if (weightUsed > 0 && avgActualReps > 0) {
              // No baseline PR, bootstrap with RPE-adjusted E1RM of this session
              const calculatedMax = calculateE1RM(
                weightUsed,
                avgActualReps,
                avgActualRpe,
              );
              if (calculatedMax > 0) {
                if (isSquat) squatPRUpdate = calculatedMax;
                else if (isBench) benchPRUpdate = calculatedMax;
                else if (isDeadlift) deadliftPRUpdate = calculatedMax;
                hasPRChanges = true;
              }
            }
          }
        }
      }
    });

    if (hasPRChanges) {
      try {
        await updateProfile({
          squatPR: Math.round(squatPRUpdate),
          benchPR: Math.round(benchPRUpdate),
          deadliftPR: Math.round(deadliftPRUpdate),
        });
      } catch (err) {
        console.error("Auto-updating profile PRs erred:", err);
      }
    }

    // Calculate actual duration
    const sessionDurationMs =
      Date.now() - (sessionToSave.startTime || Date.now());
    const mins = Math.floor(sessionDurationMs / 60000);
    const secs = Math.floor((sessionDurationMs % 60000) / 1000);
    const hrs = Math.floor(mins / 60);
    const finalMins = mins % 60;

    let durationStr = "";
    if (hrs > 0) {
      durationStr = `${hrs}h ${finalMins}m`;
    } else if (finalMins > 0) {
      durationStr = `${finalMins}m ${secs}s`;
    } else {
      durationStr = `${secs}s`;
    }

    const totalVolume = sessionToSave.exercises.reduce((acc, ex) => {
      return (
        acc +
        (ex.sets?.reduce(
          (sAcc, s) =>
            s.isCompleted && !s.isWarmup
              ? sAcc + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)
              : sAcc,
          0,
        ) || 0)
      );
    }, 0);

    const weightKg =
      unit === "imperial"
        ? (profile?.weight || 75) * 0.453592
        : profile?.weight || 75;
    const durationMinutes = hrs * 60 + finalMins;
    const caloriesBurned = calculateProgramCalories(
      weightKg,
      durationMinutes,
      data.rpe,
      totalVolume,
    );

    const completedSession: any = cleanObject({
      ...sessionToSave,
      uid: currentUid,
      rpe: data.rpe,
      note: data.note || "",
      completedAt: Date.now(),
      duration: durationStr,
      volume: calculateVolume(sessionToSave),
      caloriesBurned,
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    });

    try {
      if (auth.currentUser) {
        const workoutsPath = `users/${currentUid}/workouts`;
        // Use setDoc with the local session ID to ensure id matching
        await setDoc(
          doc(db, workoutsPath, completedSession.id),
          completedSession,
        );
        showToast("Action Successful.", 3000, "success");
      }
    } catch (error) {
      if (auth.currentUser) {
        backupData(
          currentUid,
          `workout_${completedSession.id}.json`,
          completedSession,
        );
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `users/${currentUid}/workouts`,
        );
      }
    } finally {
      // Ensure state nullification and storage cleanup only happens after capture
      setCurrentSession(null);
      localStorage.removeItem("berserker_current_session");
    }
  };

  const calculateVolume = (session: WorkoutSession) => {
    if (!session || !session.exercises)
      return `0 ${unit === "imperial" ? "LBS" : "kg"}`;
    let total = 0;
    session.exercises.forEach((ex) => {
      const isCalis = EXERCISE_DATABASE.find(
        (e) => e.id === ex.exerciseId || e.name === ex.name,
      )?.isCalisthenics;
      if (!ex.sets) return;
      ex.sets.forEach((s) => {
        if (s.isCompleted && !s.isWarmup) {
          let w = parseFloat(s.weight) || 0;
          if (isCalis) w += profile?.weight || 0;
          total += w * (parseInt(s.reps) || 0);
        }
      });
    });
    return `${total.toLocaleString()} ${unit === "imperial" ? "LBS" : "kg"}`;
  };

  const backupData = async (uid: string, filename: string, data: any) => {
    try {
      await fetch("/api/backup-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, filename, data }),
      });
    } catch (e) {
      console.error("Backup failed", e);
    }
  };

  // Calculation for Program Workouts
  const calculateProgramCalories = (
    weightKg: number,
    durationMins: number,
    sessionRpe: number,
    totalTonnage: number,
  ) => {
    // 1. Time-based component (Base Metabolic Rate during workout)
    // We use a base MET of 3.5 (standard moderate weightlifting) to represent the general
    // time spent in the gym (rest periods, setup, etc.) rather than 6.0 (circuit training).
    // This prevents double-counting since we add volume-based work on top.
    const baseMET = 3.5;
    const intensityScalar = 1 + (Number(sessionRpe || 7) - 7) * 0.05;
    const timeBurn =
      ((baseMET * 3.5 * weightKg) / 200) * durationMins * intensityScalar;

    // 2. Volume-based bonus (The "Work" component)
    // Approx 0.05 kcal per 100 lbs moved is a standard empirical estimate for hypertrophy work.
    // Tonnage is intentionally converted to LBS here to match the historical empirical formula,
    // which harmonizes safely with the metric-based MET calculation above.
    const tonnageInLbs =
      unit === "metric" ? totalTonnage * 2.20462 : totalTonnage;
    const volumeBurn = (tonnageInLbs / 100) * 0.05;

    return Math.round(timeBurn + volumeBurn);
  };

  const resetProgress = async () => {
    if (!auth.currentUser) return;

    const workoutsPath = `users/${auth.currentUser.uid}/workouts`;
    try {
      const { getDocs, deleteDoc, doc, writeBatch, collection } =
        await import("firebase/firestore");
      const { db } = await import("../firebase");

      const snapshot = await getDocs(collection(db, workoutsPath));
      const batch = writeBatch(db);

      snapshot.docs.forEach((d) => {
        batch.delete(doc(db, workoutsPath, d.id));
      });

      // Commit the batch deletion
      await batch.commit();
      showToast("Action Successful.", 3000, "success");

      // Reset profile fields to start fresh
      await updateProfile({
        trainingWeekOffset: 0,
        squatPR: 0,
        benchPR: 0,
        deadliftPR: 0,
        programResetAt: Date.now(),
      });

      setCurrentSession(null);
      localStorage.removeItem("berserker_current_session");
      setMockWorkoutCount(null);
      localStorage.removeItem("berserker_mock_count");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, workoutsPath);
    }
  };

  const resetProgram = async () => {
    if (!auth.currentUser) return;
    try {
      // Reset training week offset to restart the cycle from Week 1
      // and set a reset timestamp to ignore previous history for template generation
      await updateProfile({
        trainingWeekOffset: 0,
        programResetAt: Date.now(),
      });

      setCurrentSession(null);
      localStorage.removeItem("berserker_current_session");
      showToast("Action Successful.", 3000, "success");
    } catch (error) {
      console.error("Failed to reset program:", error);
    }
  };

  const updateHistoryWorkout = async (workout: WorkoutSession) => {
    // Recalculate volume and clean object of undefined values
    const updatedWorkout = cleanObject({
      ...workout,
      volume: calculateVolume(workout),
      updatedAt: Date.now(),
    });

    // Do not include id and uid in the merge to avoid existing ID conflicts
    // where local ID differed from the auto-generated Firestore doc ID.
    const { logType, ...updatePayload } = updatedWorkout as any;
    console.log("UPDATE PAYLOAD:", JSON.stringify(updatePayload));

    if (auth.currentUser) {
      const workoutPath = `users/${auth.currentUser.uid}/workouts/${workout.id}`;
      try {
        await setDoc(
          doc(db, `users/${auth.currentUser.uid}/workouts`, workout.id),
          updatePayload,
          { merge: true },
        );
        showToast("Action Successful.", 3000, "success");
      } catch (error) {
        backupData(
          auth.currentUser.uid,
          `workout_update_${workout.id}.json`,
          updatePayload,
        );
        handleFirestoreError(error, OperationType.UPDATE, workoutPath);
        // Rethrow to allow UI to handle it if needed, but the handler logs it
        throw error;
      }
    }
  };

  const deleteHistoryWorkout = async (id: string) => {
    if (!auth.currentUser) return;

    const workoutPath = `users/${auth.currentUser.uid}/workouts/${id}`;
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/workouts`, id));
      showToast("Action Successful.", 3000, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, workoutPath);
    }
  };

  const saveReflection = async (workoutId: string, actualRpe: number) => {
    if (!workoutId || !auth.currentUser?.uid) return;

    const docRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "workouts",
      workoutId,
    );

    try {
      // We send ONLY the two fields we want to change.
      await updateDoc(docRef, {
        actualRpe: Number(actualRpe),
        reflectionSaved: true,
      });

      setPendingReflection(null);
      showToast("Action Successful.", 3000, "success");
    } catch (error) {
      backupData(auth.currentUser!.uid, `reflection_${workoutId}.json`, {
        actualRpe: Number(actualRpe),
        reflectionSaved: true,
      });
      // If it still fails, we MUST close the modal locally
      // so you can actually use the app.
      setPendingReflection(null);
    }
  };

  useEffect(() => {
    // If history updates and the pending workout is now reflected, kill the modal
    if (pendingReflection) {
      const isStillPending = history.find(
        (w) => w.id === pendingReflection.id && !w.reflectionSaved,
      );
      if (!isStillPending) {
        setPendingReflection(null);
      }
    }
  }, [history, pendingReflection]);

  return (
    <WorkoutContext.Provider
      value={{
        history,
        recoveryHistory,
        currentSession,
        startNewSession,
        completeSession,
        logNonProgramActivity,
        updateActiveRecovery,
        deleteActiveRecovery,
        updateCurrentSession,
        addExerciseToSession,
        replaceExerciseInSession,
        setNextWorkoutExercises,
        discardSession,
        getNextWorkoutTemplate,
        getWorkoutTemplate,
        getCalibrationStatus,
        mockWorkoutCount,
        setMockWorkoutCount,
        resetProgress,
        resetProgram,
        updateHistoryWorkout,
        deleteHistoryWorkout,
        saveReflection,
        pendingReflection,
        setPendingReflection,
        recalibrateRecovery,
        logDailyHealthCheck,
        isLoading,
        calculateProgramCalories,
        debugForceCritical,
        setDebugForceCritical,
        activeRestTarget,
        setActiveRestTarget,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};
