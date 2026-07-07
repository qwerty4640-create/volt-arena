import { BlockType, getBlockForWeek, getRetentionProtocol } from "../constants/periodization";
import { getExercisesByPattern, ExerciseDefinition, EXERCISE_DATABASE } from "../constants/exercises";
import { TRAINING_CONSTRAINTS, getInterferenceAdjustment } from "../constants/constraints";
import { calculateTier } from "../lib/strength";
import { isMainLiftMatch, calculateE1RM } from "../utils/workoutUtils";
import { UserProfile } from "../contexts/SettingsContext";

// Types derived from WorkoutContext (import them from types file if moved later)
import type { WorkoutSession, Exercise, Set as WorkoutSet } from "../types/workout";

const isCompetitionBlock = (type?: string): boolean => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t === "comp prep" || t === "competition" || t === "competition / taper" || t === "comp prep / taper";
};

export const FULL_BODY_TEMPLATES = [
  {
    title: "Full Body 1",
    slots: [
      { pattern: "squat", weight: 60, reps: "8", sets: 3, impact: "high" },
      { pattern: "push_horizontal", weight: 50, reps: "8", sets: 3, impact: "high" },
      { pattern: "pull_vertical", weight: 0, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 20, reps: "12", sets: 3, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 2, impact: "low" },
    ],
  },
  {
    title: "Full Body 2",
    slots: [
      { pattern: "hinge", weight: 70, reps: "5", sets: 3, impact: "high" },
      { pattern: "push_vertical", weight: 40, reps: "8", sets: 3, impact: "high" },
      { pattern: "pull_horizontal", weight: 40, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 10, reps: "15", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Full Body 3",
    slots: [
      { pattern: "squat", weight: 50, reps: "10", sets: 3, impact: "medium" },
      { pattern: "push_horizontal", weight: 40, reps: "10", sets: 3, impact: "medium" },
      { pattern: "hinge", weight: 50, reps: "10", sets: 2, impact: "medium" },
      { pattern: "accessory", weight: 15, reps: "15", sets: 3, impact: "low" },
    ],
  },
];

export const UPPER_LOWER_TEMPLATES = [
  {
    title: "Lower Body 1",
    slots: [
      { pattern: "squat", weight: 60, reps: "8", sets: 3, impact: "high" },
      { pattern: "hinge", weight: 50, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", focus: "lower", weight: 20, reps: "12-15", sets: 4, impact: "low" },
      { pattern: "accessory", focus: "lower", weight: 20, reps: "12-15", sets: 3, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Upper Body 1",
    slots: [
      { pattern: "push_horizontal", weight: 60, reps: "8", sets: 3, impact: "high" },
      { pattern: "pull_vertical", weight: 0, reps: "8", sets: 3, impact: "high" },
      { pattern: "push_vertical", weight: 40, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", focus: "upper", weight: 15, reps: "12-15", sets: 4, impact: "low" },
      { pattern: "accessory", focus: "upper", weight: 15, reps: "12-15", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Lower Body 2",
    slots: [
      { pattern: "hinge", weight: 70, reps: "6", sets: 3, impact: "high" },
      { pattern: "squat", weight: 50, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", focus: "lower", weight: 30, reps: "10-12", sets: 4, impact: "low" },
      { pattern: "accessory", focus: "lower", weight: 20, reps: "12-15", sets: 3, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Upper Body 2",
    slots: [
      { pattern: "push_vertical", weight: 50, reps: "8", sets: 3, impact: "high" },
      { pattern: "pull_horizontal", weight: 50, reps: "8", sets: 3, impact: "high" },
      { pattern: "push_horizontal", weight: 40, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", focus: "upper", weight: 20, reps: "10-12", sets: 4, impact: "low" },
      { pattern: "accessory", focus: "upper", weight: 15, reps: "12-15", sets: 3, impact: "low" },
    ],
  },
];

export const PPL_UL_TEMPLATES = [
  {
    title: "Push",
    slots: [
      { pattern: "push_horizontal", weight: 60, reps: "8", sets: 3, impact: "high" },
      { pattern: "push_vertical", weight: 40, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 10, reps: "15", sets: 3, impact: "low" },
      { pattern: "accessory", weight: 20, reps: "12", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Pull",
    slots: [
      { pattern: "pull_vertical", weight: 0, reps: "8", sets: 3, impact: "high" },
      { pattern: "pull_horizontal", weight: 40, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 15, reps: "15", sets: 3, impact: "low" },
      { pattern: "accessory", weight: 25, reps: "12", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Legs",
    slots: [
      { pattern: "squat", weight: 60, reps: "8", sets: 3, impact: "high" },
      { pattern: "hinge", weight: 50, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 0, reps: "15", sets: 3, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Upper",
    slots: [
      { pattern: "push_horizontal", weight: 50, reps: "10", sets: 3, impact: "medium" },
      { pattern: "pull_horizontal", weight: 50, reps: "10", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 15, reps: "12", sets: 3, impact: "low" },
      { pattern: "push_vertical", weight: 30, reps: "12", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Lower",
    slots: [
      { pattern: "hinge", weight: 70, reps: "5", sets: 3, impact: "high" },
      { pattern: "squat", weight: 40, reps: "12", sets: 3, impact: "medium" },
      { pattern: "accessory", weight: 20, reps: "15", sets: 3, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3, impact: "low" },
    ],
  },
];

export const ENDURANCE_TEMPLATES = [
  {
    title: "Long Slow Distance (Zone 2)",
    isUnifiedEndurance: true,
    slots: [],
    phases: [
      { name: "Warmup", duration: 10, reps: "10 min ramping to RPE 2", rpe: "2", isWarmup: true },
      { name: "Main Work", duration: 50, reps: "50 min continuous Zone 2 @ RPE 2", rpe: "2", isWarmup: false },
      { name: "Cooldown", duration: 10, reps: "10 min light flush @ RPE 1", rpe: "1", isWarmup: false }
    ],
  },
  {
    title: "Lactate Threshold Intervals",
    isUnifiedEndurance: true,
    slots: [],
    phases: [
      { name: "Warmup", duration: 10, reps: "10 min progressive ramping @ RPE 3-4", rpe: "3", isWarmup: true },
      { name: "Main Work", duration: 30, reps: "3x10 min threshold effort @ RPE 7.5 (3 min active recovery)", rpe: "7.5", isWarmup: false },
      { name: "Cooldown", duration: 10, reps: "10 min active flush @ RPE 2", rpe: "2", isWarmup: false }
    ],
  },
  {
    title: "Aerobic Recovery",
    isUnifiedEndurance: true,
    slots: [],
    phases: [
      { name: "Warmup", duration: 10, reps: "10 min easy entry @ RPE 2", rpe: "2", isWarmup: true },
      { name: "Main Work", duration: 25, reps: "25 min continuous easy flow @ RPE 2", rpe: "2", isWarmup: false },
      { name: "Cooldown", duration: 10, reps: "10 min light spin @ RPE 1", rpe: "1", isWarmup: false }
    ],
  },
  {
    title: "VO2 Max Energy System",
    isUnifiedEndurance: true,
    slots: [],
    phases: [
      { name: "Warmup", duration: 10, reps: "10 min progressive ramping with 15s bursts @ RPE 3", rpe: "3", isWarmup: true },
      { name: "Main Work", duration: 12, reps: "4x3 min maximal stroke/step rate @ RPE 9.5 (3 min active rest)", rpe: "9.5", isWarmup: false },
      { name: "Cooldown", duration: 10, reps: "10 min light restoration flush @ RPE 2", rpe: "2", isWarmup: false }
    ],
  },
  {
    title: "Tempo Run",
    isUnifiedEndurance: true,
    slots: [],
    phases: [
      { name: "Warmup", duration: 10, reps: "10 min easy entry @ RPE 3", rpe: "3", isWarmup: true },
      { name: "Main Work", duration: 25, reps: "25 min sustained tempo pacing @ RPE 7", rpe: "7", isWarmup: false },
      { name: "Cooldown", duration: 10, reps: "10 min active flush @ RPE 2", rpe: "2", isWarmup: false }
    ]
  }
];

export const TACTICAL_TEMPLATES = [
  {
    title: "Ruck March (Heavy Duty)",
    slots: [
      { pattern: "impact", weight: 20, reps: "60-120 min @ RPE 5", sets: 1, impact: "high" },
      { pattern: "core", weight: 0, reps: "20 reps", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Combat Capacity Intervals",
    slots: [
      { pattern: "impact", weight: 0, reps: "400m sprint", sets: 6, impact: "high" },
      { pattern: "pull_vertical", weight: 0, reps: "10-15 reps", sets: 4, impact: "medium" },
      { pattern: "plyometric", weight: 0, reps: "10 reps", sets: 4, impact: "medium" },
    ],
  },
  {
    title: "Tactical Base Endurance",
    slots: [
      { pattern: "impact", weight: 20, reps: "45-60 min Ruck @ RPE 4", sets: 1, impact: "medium" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 4, impact: "low" },
    ],
  },
  {
    title: "Resiliency / Carry Work",
    slots: [
      { pattern: "core", weight: 60, reps: "100m Carry", sets: 5, impact: "high" },
      { pattern: "hinge", weight: 0, reps: "10 reps", sets: 5, impact: "medium" },
      { pattern: "impact", weight: 0, reps: "15 min easy cooldown", sets: 1, impact: "low" },
    ],
  }
];

export const EXPLOSIVE_TEMPLATES = [
  {
    title: "Rate of Force",
    slots: [
      { pattern: "plyometric", weight: 0, reps: "3", sets: 5, impact: "high" },
      { pattern: "squat", weight: 70, reps: "3", sets: 4, impact: "high" },
      { pattern: "pull_horizontal", weight: 40, reps: "8", sets: 3, impact: "medium" },
    ],
  },
  {
    title: "Elasticity",
    slots: [
      { pattern: "plyometric", weight: 0, reps: "5", sets: 4, impact: "medium" },
      { pattern: "hinge", weight: 60, reps: "5", sets: 3, impact: "high" },
      { pattern: "core", weight: 0, reps: "30 sec", sets: 4, impact: "low" },
    ],
  },
  {
    title: "Dynamic Effort Lower",
    slots: [
      { pattern: "squat", weight: 40, reps: "2", sets: 8, impact: "medium" },
      { pattern: "plyometric", weight: 0, reps: "3", sets: 4, impact: "low" },
      { pattern: "push_vertical", weight: 30, reps: "8", sets: 3, impact: "medium" },
    ],
  },
  {
    title: "Dynamic Effort Upper",
    slots: [
      { pattern: "push_horizontal", weight: 40, reps: "3", sets: 8, impact: "medium" },
      { pattern: "hinge", weight: 45, reps: "6", sets: 3, impact: "medium" },
      { pattern: "core", weight: 0, reps: "45 sec", sets: 3, impact: "low" },
    ],
  },
];

export const MEDICAL_TEMPLATES = [
  {
    title: "Restoration",
    slots: [
      { pattern: "mobility", weight: 0, reps: "5 min", sets: 2, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3, impact: "low" },
      { pattern: "accessory", weight: 10, reps: "15", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Stability",
    slots: [
      { pattern: "core", weight: 0, reps: "45 sec", sets: 4, impact: "low" },
      { pattern: "accessory", weight: 15, reps: "12", sets: 3, impact: "low" },
      { pattern: "mobility", weight: 0, reps: "10 min", sets: 1, impact: "low" },
    ],
  },
  {
    title: "Joint Integrity",
    slots: [
      { pattern: "accessory", weight: 10, reps: "15", sets: 4, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 3, impact: "low" },
    ],
  },
  {
    title: "Active Recovery",
    slots: [
      { pattern: "mobility", weight: 0, reps: "15 min", sets: 1, impact: "low" },
      { pattern: "accessory", weight: 10, reps: "20", sets: 2, impact: "low" },
    ],
  },
];

export const RETENTION_NEUROMUSCULAR_TEMPLATES = [
  {
    title: "Neuromuscular Preserver - Upper",
    slots: [
      { pattern: "push_horizontal", weight: 60, reps: "1-3", sets: 2, impact: "high" },
      { pattern: "pull_vertical", weight: 0, reps: "1-3", sets: 2, impact: "high" },
      { pattern: "mobility", weight: 0, reps: "2 min", sets: 1, impact: "low" },
    ],
  },
  {
    title: "Neuromuscular Preserver - Lower",
    slots: [
      { pattern: "squat", weight: 60, reps: "1-3", sets: 2, impact: "high" },
      { pattern: "hinge", weight: 70, reps: "1-3", sets: 2, impact: "high" },
      { pattern: "core", weight: 0, reps: "30s", sets: 2, impact: "low" },
    ],
  },
];

export const RETENTION_FORCE_VELOCITY_TEMPLATES = [
  {
    title: "Force-Velocity Stabilizer - Push/Pull",
    slots: [
      { pattern: "push_vertical", weight: 50, reps: "5", sets: 3, impact: "medium" },
      { pattern: "pull_horizontal", weight: 40, reps: "5", sets: 3, impact: "medium" },
      { pattern: "impact", weight: 0, reps: "5 jumps", sets: 2, impact: "medium" },
    ],
  },
  {
    title: "Force-Velocity Stabilizer - Legs/Core",
    slots: [
      { pattern: "squat", weight: 50, reps: "5", sets: 3, impact: "medium" },
      { pattern: "impact", weight: 0, reps: "5 jumps", sets: 2, impact: "medium" },
      { pattern: "core", weight: 0, reps: "45s", sets: 3, impact: "medium" },
    ],
  },
];

export const RETENTION_METABOLIC_TEMPLATES = [
  {
    title: "Metabolic Phase-Shift - Circuit A",
    slots: [
      { pattern: "squat", weight: 30, reps: "15", sets: 2, impact: "low" },
      { pattern: "push_horizontal", weight: 30, reps: "15", sets: 2, impact: "low" },
      { pattern: "pull_vertical", weight: 0, reps: "15", sets: 2, impact: "low" },
      { pattern: "core", weight: 0, reps: "1 min", sets: 2, impact: "low" },
    ],
  },
  {
    title: "Metabolic Phase-Shift - Circuit B",
    slots: [
      { pattern: "hinge", weight: 40, reps: "15", sets: 2, impact: "low" },
      { pattern: "push_vertical", weight: 30, reps: "15", sets: 2, impact: "low" },
      { pattern: "pull_horizontal", weight: 30, reps: "15", sets: 2, impact: "low" },
      { pattern: "carry", weight: 20, reps: "40m", sets: 2, impact: "low" },
    ],
  },
];

export const RETENTION_STRUCTURAL_AEROBIC_TEMPLATES = [
  {
    title: "Structural Aerobic Bridge - Modality I",
    isUnifiedEndurance: true,
    slots: [{ pattern: "unified_zone_2", weight: 0, reps: "20 min", sets: 1, impact: "low" }],
  },
  {
    title: "Structural Aerobic Bridge - Modality II",
    isUnifiedEndurance: true,
    slots: [{ pattern: "unified_zone_2", weight: 0, reps: "30 min", sets: 1, impact: "low" }],
  },
];

export const getMuscleDominance = (exercise: any): "quads" | "hamstrings" | "calves" | "other" => {
  if (!exercise) return "other";
  const nameLower = (exercise.name || "").toLowerCase();
  const descLower = (exercise.description || "").toLowerCase();
  const muscles = (exercise.muscles || []).map((m: string) => m.toLowerCase());
  
  if (
    muscles.includes("quads") || 
    muscles.includes("quadriceps") || 
    nameLower.includes("extension") || 
    nameLower.includes("sissy") || 
    nameLower.includes("hack squat") || 
    nameLower.includes("leg press") ||
    nameLower.includes("reverse nordic")
  ) {
    return "quads";
  }
  if (
    muscles.includes("hamstrings") || 
    muscles.includes("hamstring") || 
    nameLower.includes("curl") || 
    nameLower.includes("rdl") || 
    nameLower.includes("good morning") ||
    exercise.pattern === "hinge"
  ) {
    return "hamstrings";
  }
  if (
    muscles.includes("calves") || 
    muscles.includes("calf") || 
    nameLower.includes("calf")
  ) {
    return "calves";
  }
  return "other";
};

export const calculateFallback1RM = (
  exercise: ExerciseDefinition | undefined,
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

  if (!exercise) {
    return Math.round(templateBaseWeight);
  }

  const name = exercise.name ? exercise.name.toLowerCase() : "";
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
  frequency: number = 3,
  week?: number
): { title: string; desc: string; rulesOfEngagement: string } => {
  const normBlock = (blockType || "").toLowerCase();

  // Decide the day index based on frequency mapping
  let dIndex = 1;
  if (frequency === 4) {
    if (day === 1 || day === 2 || day === 3) dIndex = 1;
    else dIndex = 2; // Day 4 is often secondary variation like overhead press
  } else if (frequency === 5) {
    if (day <= 3) dIndex = 1;
    else if (day === 4) dIndex = 2;
    else dIndex = 3;
  } else {
    dIndex = ((day - 1) % 3) + 1;
  }

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
    normBlock.includes("competition") ||
    normBlock.includes("comp prep")
  ) {
    if (dIndex === 1) {
      const isCompPrep = week === 12;
      return {
        title: isCompPrep ? "Comp Prep" : "Max Effort",
        desc: isCompPrep ? "Prepare for maximal output in competition settings." : "Test rate of force development and motor unit synchronization.",
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

  if (
    normBlock.includes("endurance") ||
    normBlock.includes("aerobic") ||
    normBlock.includes("capacity") ||
    normBlock.includes("vo2 max") ||
    normBlock.includes("threshold")
  ) {
    if (dIndex === 1) {
      return {
        title: "Aerobic Engine",
        desc: "Cardiovascular output and sustained performance.",
        rulesOfEngagement:
          "Maintain your assigned zones. Do not drift into higher intensities. The objective is cellular adaptation to sustained effort.",
      };
    } else if (dIndex === 2) {
      return {
        title: "Threshold / Intervals",
        desc: "Expand metabolic tolerance and lactate clearance.",
        rulesOfEngagement:
          "Push the intensity to the threshold limit, then recover completely. Focus on output consistency across all intervals.",
      };
    } else {
      return {
        title: "Active Capacity",
        desc: "General endurance volume to build a robust conditioning base.",
        rulesOfEngagement:
          "Accumulate time under tension. Manage your RPE strictly to allow for prolonged continuous output without mechanical breakdown.",
      };
    }
  }

  if (normBlock.includes("tactical")) {
    if (dIndex === 1) {
      return {
        title: "Combat Chassis",
        desc: "Heavy structural stabilization and absolute strength.",
        rulesOfEngagement:
          "Build the foundational strength needed to carry heavy loads over unpredictable terrain. Form under tension is paramount.",
      };
    } else if (dIndex === 2) {
      return {
        title: "Tactical Capacity",
        desc: "Conditioning tailored for operational readiness.",
        rulesOfEngagement:
          "Survive the metabolic demand. Replicate the physical stress of an operational theater and push past the comfort barrier.",
      };
    } else {
      return {
        title: "Resiliency under Load",
        desc: "Specific structural movement under adverse loading conditions.",
        rulesOfEngagement:
          "This is pure mental and physical hardening. Stay resilient and maintain optimal movement patterns under adverse load.",
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

export const createSessionFromTemplate = (
  week: number,
  day: number,
  profile: UserProfile | null,
  currentUnit: "imperial" | "metric",
  lastSession: WorkoutSession | null,
  currentReadiness: number,
  hasAerobicInterference?: boolean,
  history: WorkoutSession[] = [],
  isNextWorkout: boolean = true,
  hasCompletedReadinessCheck: boolean = false,
  readinessModifierOverride?: number,
  isSimulatedForDeduplication: boolean = false
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

  const { block, weekInBlock, plan } = getBlockForWeek(
    week,
    totalDurationWeeks,
    goals,
    profile?.customProgramBlocks,
  );

  const currentBlockIndex = plan ? plan.findIndex(b => b === block) : -1;
  const previousBlock = currentBlockIndex > 0 ? plan[currentBlockIndex - 1] : undefined;

  // --- PHASE 1: INITIAL TEMPLATE SELECTION ---
  const currentPhaseStr = (block.type as string).toLowerCase();

  const frequency = profile?.trainingFrequency || 3;
  const missionInfo = getDailyMissionTitleAndDesc(block.type, day, frequency, week);

  let templatePool = UPPER_LOWER_TEMPLATES;
  
  if (
    !currentPhaseStr || 
    ["hypertrophy", "foundation", "powerbuilding", "strength", "pure_strength", "max_effort", "overreach", "deload"].includes(
      currentPhaseStr
    ) ||
    ((currentPhaseStr === "competition / taper" || currentPhaseStr === "comp prep" || currentPhaseStr === "comp prep / taper" || currentPhaseStr === "competition") && (goals.includes("powerbuilding") || goals.includes("pure_strength")))
  ) {
    if (frequency === 3) {
      templatePool = FULL_BODY_TEMPLATES;
    } else if (frequency === 4) {
      templatePool = UPPER_LOWER_TEMPLATES;
    } else {
      templatePool = PPL_UL_TEMPLATES;
    }
  }

  if (
    [
      "endurance",
      "aerobic base",
      "capacity",
      "vo2 max",
      "threshold",
    ].includes(currentPhaseStr)
  ) {
    templatePool = ENDURANCE_TEMPLATES;
  } else if (["tactical"].includes(currentPhaseStr)) {
    templatePool = TACTICAL_TEMPLATES;
  } else if (
    ["explosiveness", "power", "peaking"].includes(currentPhaseStr) ||
    ((currentPhaseStr === "competition / taper" || currentPhaseStr === "comp prep" || currentPhaseStr === "comp prep / taper" || currentPhaseStr === "competition") && !goals.includes("powerbuilding") && !goals.includes("pure_strength"))
  ) {
    templatePool = EXPLOSIVE_TEMPLATES;
  } else if (
    ["prehab", "longevity", "regeneration", "resiliency"].includes(
      currentPhaseStr,
    )
  ) {
    templatePool = MEDICAL_TEMPLATES;
  } else if (["strength retention", "endurance retention", "retention"].includes(currentPhaseStr)) {
    // Intelligent Mapping for Retention Blocks based on the specific rationale
    const templateLabel = block.label || "";
    if (templateLabel.includes("Neuromuscular Preserver")) {
      templatePool = RETENTION_NEUROMUSCULAR_TEMPLATES;
    } else if (templateLabel.includes("Force-Velocity Stabilizer")) {
      templatePool = RETENTION_FORCE_VELOCITY_TEMPLATES;
    } else if (templateLabel.includes("Metabolic Phase-Shift")) {
      templatePool = RETENTION_METABOLIC_TEMPLATES;
    } else if (templateLabel.includes("Structural Aerobic Bridge")) {
      templatePool = RETENTION_METABOLIC_TEMPLATES;
    } else {
      // Fallback for generic retention without a specific label
      if (currentPhaseStr === "endurance retention") {
        templatePool = RETENTION_STRUCTURAL_AEROBIC_TEMPLATES;
      } else {
        templatePool = RETENTION_NEUROMUSCULAR_TEMPLATES;
      }
    }
  }

  const globalSessionIndex = (week - 1) * frequency + (day - 1);
  const templateIndex = globalSessionIndex % templatePool.length;
  const initialTemplate = templatePool[templateIndex];

  if ((initialTemplate as any).isUnifiedEndurance) {
    let preferredModality = "Rowing";
    if (profile?.hasMedicalConditions && profile.medicalConditionDetails) {
      const det = profile.medicalConditionDetails.toLowerCase();
      if (det.includes("joint") || det.includes("knee") || det.includes("shin") || det.includes("run") || det.includes("impact")) {
        preferredModality = day % 2 === 0 ? "Cycling" : "Rowing";
      } else {
        const modalities = ["Rowing", "Cycling", "Running"];
        preferredModality = modalities[(day - 1) % modalities.length];
      }
    } else {
      const modalities = ["Rowing", "Cycling", "Running", "Rucking"];
      if (profile?.hasFullGymAccess === false) {
        preferredModality = day % 2 === 0 ? "Running" : "Rucking";
      } else {
        preferredModality = modalities[(day - 1) % modalities.length];
      }
    }

    const template = initialTemplate as any;
    const volumeMultiplier = 1 + ((weekInBlock - 1) * 0.1);

    // Calculate readiness RPE limit according to sum of drains / readiness logic
    let readinessRpeLimit = 7.5;
    if (currentReadiness >= 95) readinessRpeLimit = 9.5;
    else if (currentReadiness >= 90) readinessRpeLimit = 9.0;
    else if (currentReadiness >= 80) readinessRpeLimit = 8.5;
    else if (currentReadiness >= 70) readinessRpeLimit = 8.0;
    else if (currentReadiness >= 60) readinessRpeLimit = 7.5;
    else if (currentReadiness >= 50) readinessRpeLimit = 7.0;
    else readinessRpeLimit = 6.0;

    if (isNextWorkout && lastSession && lastSession.completedAt) {
      const hoursSinceLast = (Date.now() - lastSession.completedAt) / 3600000;
      if (hoursSinceLast < 36) {
        readinessRpeLimit = Math.min(readinessRpeLimit, 8.5);
      }
      if (hoursSinceLast < 12) {
        readinessRpeLimit = Math.min(readinessRpeLimit, 7.5);
      }
    }

    const exSets = template.phases.map((phase: any, j: number) => {
      let repsString = phase.reps;
      
      // Scale Main Work phase duration
      if (j === 1) {
        const baseDuration = phase.duration;
        const scaledDuration = Math.round(baseDuration * volumeMultiplier);
        
        if (template.title.includes("Long Slow Distance") || template.title.includes("Zone 2")) {
          repsString = `${scaledDuration} min continuous Zone 2 flow (RPE 2-3)`;
        } else if (template.title.includes("Lactate Threshold")) {
          const intervalBase = 10;
          const scaledInterval = Math.round(intervalBase * volumeMultiplier);
          repsString = `3x${scaledInterval} min threshold effort (with 3-5 min easy back-off recovery between work sets) @ RPE 7.5-8`;
        } else if (template.title.includes("Aerobic Recovery") || template.title.includes("Zone 1-2")) {
          repsString = `${scaledDuration} min continuous easy Zone 1-2 effort @ RPE 2`;
        } else if (template.title.includes("VO2 Max")) {
          const intervalBase = 3;
          const scaledInterval = Math.round(intervalBase * volumeMultiplier);
          repsString = `4x${scaledInterval} min maximal effort stroke/step rate (with equal duration active back-off rest) @ RPE 9.5`;
        } else if (template.title.includes("Tempo")) {
          repsString = `${scaledDuration} min sustained pacing @ RPE 7 (Tempo)`;
        } else {
          repsString = `${scaledDuration} min main work phase @ RPE ${phase.rpe}`;
        }
      }
      
      let targetRpe = phase.rpe;
      let rpeVal = parseFloat(targetRpe);
      if (!isNaN(rpeVal)) {
        rpeVal = Math.min(rpeVal, readinessRpeLimit);
        targetRpe = rpeVal.toString();
      }

      return {
        id: `s0-${j}`,
        weight: "0",
        baseWeight: "0",
        reps: repsString,
        baseReps: repsString,
        rpe: targetRpe,
        baseRpe: targetRpe,
        isCompleted: false,
        isWarmup: phase.isWarmup || false,
        phaseName: phase.name,
      };
    });

    return {
      id: `w${week}d${day}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      title: `W${week}D${day}: ${missionInfo.title}`,
      description: `${template.title} - ${preferredModality} Monostructural Session. ${missionInfo.desc}`,
      rulesOfEngagement: `Maintain strict metabolic targets. Progressive overload active. ${missionInfo.rulesOfEngagement || ""}`,
      startTime: Date.now(),
      targetRpe: (block.type === BlockType.DELOAD || isCompetitionBlock(block.type)) ? (parseFloat(exSets[0]?.rpe) || readinessRpeLimit) : readinessRpeLimit,
      blockType: block.type,
      blockLabel: block.label,
      weekInBlock,
      totalWeek: week,
      exercises: [
        {
          id: "e0",
          exerciseId: `${preferredModality.toLowerCase()}_steady_state`,
          name: preferredModality,
          isSquat: false,
          isBench: false,
          isDeadlift: false,
          isPrimaryMainLift: false,
          intent: "AEROBIC CAPACITY",
          sets: exSets,
          restPeriod: 120,
        }
      ],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    };
  }

  // --- PHASE 2: BLENDING ENGINE ---
  // Using active phase goals prevents hybrid bleed from sequential programming blocks
  const activePhaseGoals = [currentPhaseStr as any];
  const interferenceModifier = getInterferenceAdjustment(activePhaseGoals);

  // Clone slots to avoid mutating constants
  let dynamicSlots: any[] = initialTemplate.slots.map((s) => ({ ...s }));

  // Apply Medical Conditions filtering
  if (profile?.hasMedicalConditions && profile.medicalConditionDetails) {
    const details = profile.medicalConditionDetails.toLowerCase();

    dynamicSlots = dynamicSlots.map((slot) => {
      const conditionMatch =
        (details.includes("squat") && slot.pattern === "squat") ||
        (details.includes("hinge") && slot.pattern === "hinge") ||
        (details.includes("carry") && slot.pattern === "core");

      if (conditionMatch) {
        if (slot.pattern === "squat") return { ...slot, pattern: "core" };
        if (slot.pattern === "hinge") return { ...slot, pattern: "core" };
        return { ...slot, pattern: "core" };
      }
      return slot;
    });
  }

  // Taper Strategy (Phase 1): Split CNS Priming and Active Recovery
  if (isCompetitionBlock(block.type)) {
    if (day === 1) {
      dynamicSlots = [
        {
          pattern: "squat",
          exerciseId: "squat_conventional",
          nameOverride: "Competition Squat",
          impact: "high",
          customSets: [
            { reps: "1", intensity: 0.80, rpe: "6" },
            { reps: "3", intensity: 0.70, rpe: "6" },
            { reps: "3", intensity: 0.70, rpe: "6" }
          ]
        },
        {
          pattern: "hinge",
          exerciseId: "rdl",
          nameOverride: "Romanian Deadlift",
          impact: "medium",
          customSets: [
            { reps: "6", rpe: "6" },
            { reps: "6", rpe: "6" }
          ]
        },
        {
          pattern: "core",
          exerciseId: "hanging_leg_raises",
          nameOverride: "Hanging Leg Raise",
          impact: "low",
          customSets: [
            { reps: "10" },
            { reps: "10" }
          ]
        },
      ];
    } else if (day === 2) {
      dynamicSlots = [
        {
          pattern: "push_horizontal",
          exerciseId: "bench_press_conventional",
          nameOverride: "Competition Bench Press",
          impact: "high",
          customSets: [
            { reps: "1", intensity: 0.80, rpe: "6" },
            { reps: "3", intensity: 0.70, rpe: "6" },
            { reps: "3", intensity: 0.70, rpe: "6" }
          ]
        },
        {
          pattern: "pull_horizontal",
          exerciseId: "chest_supported_rows",
          nameOverride: "Chest-Supported Row",
          impact: "medium",
          customSets: [
            { reps: "8", rpe: "6" },
            { reps: "8", rpe: "6" }
          ]
        },
        {
          pattern: "accessory",
          exerciseId: "db_lateral_raise",
          nameOverride: "Dumbbell Lateral Raise",
          impact: "low",
          customSets: [
            { reps: "12" },
            { reps: "12" }
          ]
        },
      ];
    } else if (day === 3) {
      dynamicSlots = [
        {
          pattern: "hinge",
          exerciseId: "deadlift_conventional",
          nameOverride: "Competition Deadlift",
          impact: "high",
          customSets: [
            { reps: "2", intensity: 0.78, rpe: "6" }
          ]
        },
        {
          pattern: "pull_vertical",
          exerciseId: "lat_pulldowns",
          nameOverride: "Lat Pulldown",
          impact: "medium",
          customSets: [
            { reps: "8-10", rpe: "5.5" },
            { reps: "8-10", rpe: "5.5" }
          ]
        },
        {
          pattern: "push_vertical",
          exerciseId: "db_overhead_press",
          nameOverride: "Dumbbell Overhead Press",
          impact: "low",
          customSets: [
            { reps: "8", rpe: "6" },
            { reps: "8", rpe: "6" }
          ]
        },
      ];
    } else if (day === 4) {
      dynamicSlots = [
        {
          pattern: "squat",
          exerciseId: "squat_conventional",
          nameOverride: "Squat (Technique)",
          impact: "medium",
          customSets: [
            { reps: "2", intensity: 0.55, rpe: "5" },
            { reps: "2", intensity: 0.55, rpe: "5" },
            { reps: "2", intensity: 0.55, rpe: "5" }
          ]
        },
        {
          pattern: "push_horizontal",
          exerciseId: "bench_press_conventional",
          nameOverride: "Bench Press (Technique)",
          impact: "medium",
          customSets: [
            { reps: "3", intensity: 0.55, rpe: "5" },
            { reps: "3", intensity: 0.55, rpe: "5" },
            { reps: "3", intensity: 0.55, rpe: "5" }
          ]
        },
        {
          pattern: "pull_horizontal",
          exerciseId: "face_pulls",
          nameOverride: "Face Pulls",
          impact: "low",
          customSets: [
            { reps: "15" },
            { reps: "15" }
          ]
        },
      ];
    } else {
      dynamicSlots = [
        { pattern: "mobility", reps: "10-15", sets: 2, weight: 0, impact: "low" },
      ];
    }
  }

  // 1. Base Intensity from Block + Weekly Progression
  let blockIntensity =
    block.baseIntensity + (weekInBlock - 1) * block.intensityIncrementPerWeek;

  // 2. Readiness Adjustment
  let readinessModifier = 1.0;
  let recoveryModifier = 1.0;
  let historyFatigueDiscount = 1.0;

  if (isNextWorkout && hasCompletedReadinessCheck) {
    if (readinessModifierOverride !== undefined) {
      // If we are given an authoritative modifier from the HMS UI, it ALREADY includes
      // recoveryModifier, historyFatigueDiscount, redline penalties, and readiness.
      // We just adopt it cleanly to avoid hidden double dipping.
      readinessModifier = readinessModifierOverride;
    } else {
      if (currentReadiness >= 80) readinessModifier = 1.0;
      else if (currentReadiness >= 70) readinessModifier = 0.95;
      else if (currentReadiness >= 50) readinessModifier = 0.9;
      else readinessModifier = 0.8;
    }
  }

  // Calculate readiness RPE limit according to sum of drains / readiness logic
  let readinessRpeLimit = 10.0;
  
  if (readinessModifierOverride !== undefined && readinessModifierOverride > 0.95) {
    // If user manually overrides intensity high, trust them. No restrictive RPE cap.
    readinessRpeLimit = 10.0;
  } else {
    if (currentReadiness >= 80) readinessRpeLimit = 10.0;
    else if (currentReadiness >= 60) readinessRpeLimit = 9.5;
    else if (currentReadiness >= 40) readinessRpeLimit = 9.0;
    else readinessRpeLimit = 8.5;

    if (isNextWorkout && lastSession && lastSession.completedAt) {
      const hoursSinceLast = (Date.now() - lastSession.completedAt) / 3600000;
      if (hoursSinceLast < 24) {
        readinessRpeLimit = Math.min(readinessRpeLimit, 9.0);
      }
      if (hoursSinceLast < 12) {
        readinessRpeLimit = Math.min(readinessRpeLimit, 8.5);
      }
    }
  }

  // 3. Recovery Adjustment
  if (isNextWorkout && lastSession && readinessModifierOverride === undefined) {
    if (lastSession.rpe && lastSession.rpe >= 9) {
      recoveryModifier *= 0.95;
    }
    const hoursSinceLast =
      (Date.now() - (lastSession.completedAt || 0)) / 3600000;
    // 24hr turnaround penalty:
    // Only apply if they are actually repeating the exact same session (week and day)
    if (
      hoursSinceLast < 24 &&
      (lastSession.id === `w${week}d${day}` || lastSession.title === `W${week}D${day}: ${missionInfo.title}`)
    ) {
      recoveryModifier *= 0.9;
    }
  }

  // Tactical Autoregulation: Granular history-driven fatigue calculation
  const fatigueReasons: string[] = [];

  if (history && history.length > 0 && isNextWorkout) {
    const sortedCompleted = [...history]
      .filter((s) => s.completedAt)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    // A. Check for extreme recent overshoots in the last 3 sessions
    let recentOvershootCount = 0;
    sortedCompleted.slice(0, 3).forEach((session) => {
      let sessionOvershot = false;
      if (session.actualRpe && session.targetRpe && session.actualRpe > session.targetRpe) {
        sessionOvershot = true;
      }
      session.exercises?.forEach((ex) => {
        ex.sets?.forEach((s) => {
          if (s.isCompleted && s.actualRpe && s.rpe) {
            const actRpe = parseFloat(s.actualRpe);
            const tgtRpe = parseFloat(s.rpe);
            if (!isNaN(actRpe) && !isNaN(tgtRpe) && actRpe > tgtRpe + 0.5) {
              sessionOvershot = true;
            }
          }
        });
      });
      if (sessionOvershot) {
        recentOvershootCount++;
      }
    });

    if (recentOvershootCount >= 2) {
      historyFatigueDiscount *= 0.94; // 6% discount for multiple recent overshoots
      fatigueReasons.push("Multiple recent sessions overshot target intensity/RPE.");
    } else if (recentOvershootCount === 1) {
      historyFatigueDiscount *= 0.97; // 3% discount
      fatigueReasons.push("Recent RPE overshoot detected.");
    }

    // B. density/short recovery window check
    const now = Date.now();
    const lastSessionTime = sortedCompleted[0]?.completedAt || 0;
    const hoursSinceLast = (now - lastSessionTime) / 3600000;

    if (hoursSinceLast > 0 && hoursSinceLast < 36) {
      const lastSessionRpe = sortedCompleted[0]?.actualRpe || sortedCompleted[0]?.rpe || 7;
      if (lastSessionRpe >= 8.5) {
        historyFatigueDiscount *= 0.95; // 5% discount for short turnaround after heavy training
        fatigueReasons.push(`High-intensity session completed within last ${Math.round(hoursSinceLast)} hours.`);
      } else {
        historyFatigueDiscount *= 0.98; // 2% discount for density
        fatigueReasons.push(`Session density high: last workout completed within last ${Math.round(hoursSinceLast)} hours.`);
      }
    }

    // C. Cumulative heavy sessions from last 7 days
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
    const lastWeekSessions = sortedCompleted.filter(
      (s) => (s.completedAt || 0) > sevenDaysAgo
    );
    const heavySessionsLastWeek = lastWeekSessions.filter(
      (s) => (s.actualRpe || s.rpe || 0) >= 8.5
    ).length;

    if (heavySessionsLastWeek >= 3) {
      historyFatigueDiscount *= 0.94; // 6% discount
      fatigueReasons.push("Accumulated CNS fatigue from high density of weekly heavy compounds.");
    } else if (heavySessionsLastWeek === 2) {
      historyFatigueDiscount *= 0.97; // 3% discount
      fatigueReasons.push("Moderate accumulation of heavy compound sessions.");
    }
  }

  historyFatigueDiscount = Math.max(0.85, historyFatigueDiscount);

  // 4. Volume and Goal-Specific Logic
  let volumeModifier = 1.0 * interferenceModifier;

  // Intelligent Frequency Compensation: Scale volume per session if training more frequently
  const isHypertrophyBlock = [BlockType.HYPERTROPHY, BlockType.FOUNDATION, BlockType.POWERBUILDING].includes(block.type as any);
  let frequencyScale = 1.0;

  if (frequency > 3 && isHypertrophyBlock) {
    const baselineDays = 3;
    const loadAllowance = 1.25;
    frequencyScale = (baselineDays / frequency) * loadAllowance;
  } else if (frequency > 3) {
    const baselineDays = 3;
    const loadAllowance = 1.1;
    frequencyScale = (baselineDays / frequency) * loadAllowance;
  }
  frequencyScale = Math.min(1.0, frequencyScale);

  const isFinalWeek = weekInBlock === block.durationWeeks;

  if (
    goals.includes("pure_strength") &&
    block.type === BlockType.PEAKING &&
    isFinalWeek
  ) {
    volumeModifier *= 0.6; // 40% drop in volume for fatigue dissipation
  } else if (
    (goals.includes("peaking") || goals.includes("powerbuilding") || goals.includes("pure_strength")) &&
    isCompetitionBlock(block.type)
  ) {
    volumeModifier *= 0.5; // Drastic set reduction for realization/taper
    blockIntensity = 0.75; // 75% intensity for CNS priming
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
  const retentionProtocol = getRetentionProtocol(profile, block, previousBlock);

  // Initialize a set of chosen exercise IDs to prevent duplicates in the SAME session
  const chosenIds = new Set<string>();
  
  // Pre-calculate recent exercise IDs from the previous days in the SAME week to prevent consecutive duplication
  const recentDayExerciseIds = new Set<string>();
  if (!isSimulatedForDeduplication && day > 1) {
    for (let back = 1; back <= 2; back++) {
        if (day - back > 0) {
            const prevSession = createSessionFromTemplate(
                week, day - back, profile, currentUnit, lastSession, 
                currentReadiness, hasAerobicInterference, history, 
                false, hasCompletedReadinessCheck, readinessModifierOverride, 
                true // isSimulatedForDeduplication
            );
            prevSession.exercises.forEach(e => recentDayExerciseIds.add(e.id));
        }
    }
  }

  let hasPassedStrengthThreshold = false;
  const lowerBodySelections: Array<{ id: string; target: "quads" | "hamstrings" | "calves" | "other" }> = [];

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
    targetRpe: isCompetitionBlock(block.type) ? 5.5 : (block.type === BlockType.DELOAD ? 7.0 : readinessRpeLimit),
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

      const slotFocus = (slot as any).focus;
      if (slotFocus === "lower") {
        const lowerKw = ["leg", "glute", "quad", "hamstring", "calf"];
        const filtered = availableExercises.filter(e => 
          lowerKw.some(kw => e.category?.toLowerCase().includes(kw)) || 
          e.muscles?.some((m: string) => lowerKw.some(kw => m.toLowerCase().includes(kw)))
        );
        if (filtered.length > 0) availableExercises = filtered;
      } else if (slotFocus === "upper") {
        const upperKw = ["chest", "back", "shoulder", "arm", "bicep", "tricep", "row", "deltoid"];
        const filtered = availableExercises.filter(e => 
          upperKw.some(kw => e.category?.toLowerCase().includes(kw)) || 
          e.muscles?.some((m: string) => upperKw.some(kw => m.toLowerCase().includes(kw)))
        );
        if (filtered.length > 0) availableExercises = filtered;
      }

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

      // Ultra-premium bodybuilding/powerbuilding prioritization of specific exercises
      if (goals.includes("powerbuilding") || goals.includes("hypertrophy")) {
        if (slot.pattern === "squat") {
          if (slot.impact === "medium" || slot.impact === "low") {
            const secondaryQuads = ["leg_press", "hack_squat", "front_squat", "goblet_squat"];
            availableExercises = [
              ...availableExercises.filter(e => secondaryQuads.includes(e.id)),
              ...availableExercises.filter(e => !secondaryQuads.includes(e.id))
            ];
          }
        } else if (slot.pattern === "hinge") {
          if (slot.impact === "medium" || slot.impact === "low") {
            const secondaryHinges = ["rdl", "db_rdl"];
            availableExercises = [
              ...availableExercises.filter(e => secondaryHinges.includes(e.id)),
              ...availableExercises.filter(e => !secondaryHinges.includes(e.id))
            ];
          }
        } else if (slot.pattern === "push_horizontal") {
          if (slot.impact === "medium" || slot.impact === "low") {
            const secondaryPress = ["incline_dumbbell_press", "dumbbell_press", "dips"];
            availableExercises = [
              ...availableExercises.filter(e => secondaryPress.includes(e.id)),
              ...availableExercises.filter(e => !secondaryPress.includes(e.id))
            ];
          }
        } else if (slot.pattern === "push_vertical") {
          if (slot.impact === "medium" || slot.impact === "low") {
            const secondaryVerticalPress = ["db_shoulder_press", "overhead_press"];
            availableExercises = [
              ...availableExercises.filter(e => secondaryVerticalPress.includes(e.id)),
              ...availableExercises.filter(e => !secondaryVerticalPress.includes(e.id))
            ];
          }
        } else if (slot.pattern === "accessory") {
          if (slotFocus === "lower") {
            const targetLowerAcc = ["leg_extension", "leg_curl_seated", "standing_calf_raise"];
            availableExercises = [
              ...availableExercises.filter(e => targetLowerAcc.includes(e.id)),
              ...availableExercises.filter(e => !targetLowerAcc.includes(e.id))
            ];
          } else if (slotFocus === "upper") {
            const targetUpperAcc = ["db_lateral_raise", "triceps_pushdowns", "db_bicep_curl", "incline_dumbbell_curls", "barbell_skullcrushers", "lateral_raise_db", "db_front_raise", "db_rear_delt_fly"];
            availableExercises = [
              ...availableExercises.filter(e => targetUpperAcc.includes(e.id)),
              ...availableExercises.filter(e => !targetUpperAcc.includes(e.id))
            ];
          }
        }
      }

      // Joint health logic for endurance impact modalities
      if (slot.pattern === "impact" && profile?.hasMedicalConditions && profile.medicalConditionDetails) {
        const det = profile.medicalConditionDetails.toLowerCase();
        if (det.includes("joint") || det.includes("knee") || det.includes("run") || det.includes("shin") || det.includes("impact")) {
          // Exclude high-impact modalities like running/rucking, fallback to low-impact (cycling/rowing)
          const lowImpact = availableExercises.filter(e => e.impact === "low" || e.id.includes("cycling") || e.id.includes("rowing"));
          if (lowImpact.length > 0) {
            availableExercises = lowImpact;
          }
        }
      }

      // Explicit endurance filtering
      if (["endurance", "aerobic base", "capacity", "vo2 max", "threshold", "endurance retention"].includes(currentPhaseStr)) {
        if (slot.pattern === "core" || slot.pattern === "accessory") {
           availableExercises = availableExercises.filter(e => e.category !== "Tactical");
        }
        if (slot.pattern === "impact") {
          const enduranceOnly = availableExercises.filter(e => e.category === "Endurance");
          if (enduranceOnly.length > 0) availableExercises = enduranceOnly;
          
          if (slotFocus === "steady_state" || slotFocus === "warmup") {
            const steady = availableExercises.filter(e => e.id.includes("steady_state"));
            if (steady.length > 0) availableExercises = steady;
          } else if (slotFocus === "intervals" || slotFocus === "sprint") {
            // For longer intervals, prefer running, rowing, cycling over battle ropes
            const interval = availableExercises.filter(e => e.id.includes("steady_state") || e.id.includes("intervals") || e.id.includes("sprints"));
            const excludeExtremeShort = interval.filter(e => !e.id.includes("rope") && !e.id.includes("assault"));
            if (excludeExtremeShort.length > 0) availableExercises = excludeExtremeShort;
          }
        }
      } else if (["tactical"].includes(currentPhaseStr)) {
        if (slot.pattern === "impact") {
          const tacticalOnly = availableExercises.filter(e => e.category === "Tactical" || e.name.toLowerCase().includes("ruck"));
          if (tacticalOnly.length > 0) availableExercises = tacticalOnly;
        }
      }

      // Select best fit exercise for the goal, rotating through available exercises based on week, day and index to ensure variety per session
      const isLowerBodySlot = slot.pattern === "squat" || slot.pattern === "hinge" || (slot.pattern === "accessory" && slotFocus === "lower");
      let preferredDominance: "quads" | "hamstrings" | "calves" | null = null;
      
      if (isLowerBodySlot && lowerBodySelections.length > 0) {
        const lastLower = lowerBodySelections[lowerBodySelections.length - 1];
        const lastDominance = lastLower.target;
        if (lastDominance === "quads") {
          preferredDominance = "hamstrings";
        } else if (lastDominance === "hamstrings") {
          preferredDominance = "quads";
        }
      }

      const stablePatterns = ['squat', 'hinge', 'push_horizontal', 'pull_vertical', 'push_vertical', 'pull_horizontal'];
      
      const getRotationIndexForList = (list: any[]) => {
        if (!stablePatterns.includes(slot.pattern as string)) {
          // Give it high variety based on week, day, and index. Coprime multipliers 13, 17, 5 prevent cyclic collisions
          return ((week - 1) * 13 + (day - 1) * 17 + i * 5) % Math.max(1, list.length);
        } else if (i > 1 && !slot.weight) {
          // If it's a main movement pattern but it's an unweighted secondary movement late in the workout, rotate it slightly
          return ((week - 1) + (day - 1) + i) % Math.max(1, list.length);
        }
        return 0;
      };

      const selectExerciseFromList = (list: any[], strictUnique: boolean) => {
        if (list.length === 0) return null;
        const rIndex = getRotationIndexForList(list);
        let selected = list[rIndex] || list[0];
        
        let pOffset = 0;
        const isImpact = ["impact"].includes(slot.pattern as string);
        
        while (selected && (chosenIds.has(selected.id) || recentDayExerciseIds.has(selected.id)) && pOffset < list.length && !isImpact) {
          pOffset++;
          selected = list[(rIndex + pOffset) % list.length];
        }
        
        if (strictUnique && selected && (chosenIds.has(selected.id) || recentDayExerciseIds.has(selected.id)) && !isImpact) {
          return null;
        }
        return selected;
      };

      let selectedExercise = null;

      if ((slot as any).exerciseId) {
        selectedExercise = EXERCISE_DATABASE.find((e: any) => e.id === (slot as any).exerciseId) || null;
      }

      if (!selectedExercise && preferredDominance) {
        const matchingPreferred = availableExercises.filter(e => getMuscleDominance(e) === preferredDominance);
        selectedExercise = selectExerciseFromList(matchingPreferred, true);
      }

      if (!selectedExercise) {
        selectedExercise = selectExerciseFromList(availableExercises, true);
      }

      if (!selectedExercise) {
        selectedExercise = selectExerciseFromList(availableExercises, false);
      }
      
      if (selectedExercise) {
        chosenIds.add(selectedExercise.id);
        if (isLowerBodySlot) {
          const target = getMuscleDominance(selectedExercise);
          if (target === "quads" || target === "hamstrings" || target === "calves") {
            lowerBodySelections.push({ id: selectedExercise.id, target });
          }
        }
      }

      // Safe fallback if no exercises are available for this pattern/impact combo
      if (!selectedExercise) {
        selectedExercise = EXERCISE_DATABASE.find((e: any) => e.pattern === slot.pattern) || EXERCISE_DATABASE[0];
      }

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
        selectedExercise.name &&
        selectedExercise.name.includes("Barbell")
      ) {
        const safer = availableExercises.find(
          (e) => e.name && !e.name.includes("Barbell"),
        );
        if (safer) selectedExercise = safer;
      }

      // Posterior Chain Flushing during Taper week
      if (
        isCompetitionBlock(block.type) &&
        i > 0 &&
        (slot.pattern === "hinge" || (selectedExercise && selectedExercise.pattern === "hinge")) &&
        !(slot as any).exerciseId
      ) {
        const flushingOptions = EXERCISE_DATABASE.filter(e => 
          e.id === "kettlebell_swings" || e.id === "db_rdl"
        );
        if (flushingOptions.length > 0) {
          selectedExercise = flushingOptions[Math.floor(Math.random() * flushingOptions.length)];
        }
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

      let weight: number | string = 0;
      let unmodifiedWeight: number | string = 0;
      const isSquatPattern = slot.pattern === "squat";
      const isBenchPattern = slot.pattern === "push_horizontal";
      const isDeadliftPattern = slot.pattern === "hinge";

      const isSquat = !!(
        selectedExercise?.name &&
        isMainLiftMatch(selectedExercise.name, "Squat")
      );
      const isBench = !!(
        selectedExercise?.name &&
        isMainLiftMatch(selectedExercise.name, "Bench Press")
      );
      const isDeadlift = !!(
        selectedExercise?.name &&
        isMainLiftMatch(selectedExercise.name, "Deadlift")
      );
      const isMainLift = isSquat || isBench || isDeadlift;
      const subsequentNonMain = !isMainLift && hasPassedStrengthThreshold;
      if (isMainLift) {
        hasPassedStrengthThreshold = true;
      }
      const isPrimaryMainLift = i === 0 && !!(
        selectedExercise?.name && (
          isMainLiftMatch(selectedExercise.name, "Squat") ||
          isMainLiftMatch(selectedExercise.name, "Bench Press") ||
          isMainLiftMatch(selectedExercise.name, "Deadlift")
        )
      );

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

      // Secondary Compound scaling: If it is a main lift pattern but programmed in a medium impact slot,
      // it is a secondary lift for the day (e.g., Day 1 Trap Bar Deadlift / Squat variation).
      // Scale its intensity down by 15% (multiplier of 0.85) to manage fatigue and prevent high axial loading on repeated patterns.
      // NOTE: Squat, Bench Press, and Deadlift are heavy primary movements and always high impact. Do not scale down their intensity.
      /*
      if (isMainLift && slot.impact === "medium") {
        adjustedIntensity *= 0.85;
      }
      */

      let estimated1RM = 0;
      let dynamicPR = 0;
      let lastWeight = 0;
      if (history && history.length > 0 && selectedExercise?.name) {
        const cleanName = (name: string) => name.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?|\[?ACTIVE RECOVERY\]?|\[?MOVEMENT QUALITY\]?|\[?BLOOD FLOW\]?/gi, '').trim().toLowerCase();
        const searchTargetName = cleanName(selectedExercise.name);

        const sessionsWithEx = history
          .filter((s) =>
            s.exercises.some(
              (ex) =>
                ex.name &&
                cleanName(ex.name) === searchTargetName,
            ),
          )
          .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

        if (sessionsWithEx.length > 0) {
          // Calculate dynamic PR with 2% reactive missed-rep decay across chronological history chain (oldest to newest)
          const chronologicalSessions = [...sessionsWithEx].reverse();
          chronologicalSessions.forEach(session => {
            const ex = session.exercises.find(
              (e) => e.name && cleanName(e.name) === searchTargetName
            );
            if (!ex || !ex.sets) return;

            const sessionE1RMs = ex.sets.map((set: any) => calculateE1RM(
              parseFloat(set.weight) || 0,
              parseInt(set.reps) || 0,
              parseFloat(set.rpe || set.actualRpe || ""),
              ex.name
            )).filter(val => val > 0);

            if (sessionE1RMs.length > 0) {
              const sessionMaxE1RM = Math.max(...sessionE1RMs);
              if (sessionMaxE1RM > dynamicPR) {
                dynamicPR = sessionMaxE1RM;
              }
            }

            // Check if there are missed reps on completed working sets in this session
            const workingSets = ex.sets.filter((s: any) => 
              !s.isWarmup && 
              s.isCompleted !== false && 
              s.completed !== false
            );
            if (workingSets.length > 0) {
              let maxMissedReps = 0;
              workingSets.forEach((set: any) => {
                const setTargetStr = set.baseReps || set.reps;
                const setTarget = (setTargetStr && typeof setTargetStr === "string")
                  ? (parseInt(setTargetStr.split("-")[0]) || 5)
                  : (parseInt(setTargetStr) || 5);
                const setActual = parseInt(set.reps) || 0;
                if (setActual < setTarget) {
                  const missed = setTarget - setActual;
                  if (missed > maxMissedReps) {
                    maxMissedReps = missed;
                  }
                }
              });

              if (maxMissedReps > 0) {
                // Apply 2% reduction per missed rep to dynamicPR reactively to simulate decay
                dynamicPR = dynamicPR * (1 - maxMissedReps * 0.02);
              }
            }
          });

          // Get last weight for progression continuity
          const latestSession = sessionsWithEx[0];
          const targetEx = latestSession.exercises.find(
            (ex) =>
              ex.name &&
              cleanName(ex.name) === searchTargetName,
          );
          if (targetEx && targetEx.sets) {
            // Screen out warm-up sets if there are any working sets, and find the maximum working weight
            const workingSets = targetEx.sets.filter((s: any) => 
              parseFloat(s.weight) > 0 && 
              !s.isWarmup && 
              s.isCompleted !== false && 
              s.completed !== false
            );
            const candidateSets = workingSets.length > 0 
              ? workingSets 
              : targetEx.sets.filter((s: any) => parseFloat(s.weight) > 0);
            if (candidateSets.length > 0) {
              const weights = candidateSets.map((s: any) => parseFloat(s.weight) || 0);
              lastWeight = Math.max(...weights);
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

        // Autoregulation: prioritize the highest historical E1RM generated from past sessions, falling back to static profile PR.
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

      const baseFinalIntensity = blockIntensity * recoveryModifier;
      let adjustedBaseIntensity = baseFinalIntensity;
      if (constraintExercise.intensityCap)
        adjustedBaseIntensity = Math.min(
          adjustedBaseIntensity,
          constraintExercise.intensityCap,
        );
      if (constraintExercise.intensityBoost)
        adjustedBaseIntensity += constraintExercise.intensityBoost;

      // Secondary Compound scaling for base intensity
      // NOTE: Squat, Bench Press, and Deadlift are heavy primary movements and always high impact. Do not scale down their base intensity.
      /*
      if (isMainLift && slot.impact === "medium") {
        adjustedBaseIntensity *= 0.85;
      }
      */

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

        // Deadlift specific Rep adjustment based on Shimano et al. (2006).
        // Deadlifts inherently possess a steeper physiological drop-off curve at higher percentages compared to squats/bench.
        // Therefore, we determine its rep targets using the fully adjusted prescribed weight (adjustedIntensity)
        // rather than the static block intensity, ensuring dynamic 1.05x readiness jumps properly reduce the target reps.
        const targetIntensityForReps = (isPrimaryMainLift && !isDeadlift) 
          ? blockIntensity 
          : adjustedIntensity;

        const isDeloadOrRetention = [
          BlockType.DELOAD,
          BlockType.RETENTION,
          BlockType.STRENGTH_RETENTION,
          BlockType.ENDURANCE_RETENTION,
        ].includes(block.type as BlockType);

        if (isDeloadOrRetention) {
          // Prefer slot specific reps and sets since retention templates are precisely programmed
          dynamicReps = slot.reps;
          dynamicSets = slot.sets;
        } else if (goals.includes("powerbuilding")) {
          // Powerbuilding strictly mandates exactly 3 heavy working sets for the main lift
          dynamicSets = 3;
          if (isCompetitionBlock(block.type)) {
            if (isDeadlift) {
              dynamicSets = 1;
              dynamicReps = "1";
            } else {
              dynamicSets = 3; // 3 single reps
              dynamicReps = "1"; // Taper reps for freshness
            }
          } else if (targetIntensityForReps < 0.75) {
            dynamicReps = "6-8";
          } else if (targetIntensityForReps < 0.85) {
            dynamicReps = "4-6";
          } else if (targetIntensityForReps < 0.90 && (block.type as any) !== BlockType.MAX_EFFORT && (block.type as any) !== BlockType.PEAKING) {
            dynamicReps = "3-4";
          } else {
            dynamicReps = "1-3"; // Max effort / true peaking zone safety cap
          }
        } else if (isHypertrophyOriented) {
          if (targetIntensityForReps < 0.65) {
            dynamicReps = "10-12";
            dynamicSets = 3;
          } else if (targetIntensityForReps < 0.72) {
            dynamicReps = "8-12";
            dynamicSets = 4;
          } else if (targetIntensityForReps < 0.78) {
            dynamicReps = "8-10";
            dynamicSets = 4;
          } else if (targetIntensityForReps < 0.83) {
            dynamicReps = "6-8";
            dynamicSets = 4;
          } else {
            dynamicReps = "6-8";
            dynamicSets = 4;
          }
        } else {
          // Standard strength / peaking block mapping
          if (isCompetitionBlock(block.type)) {
            if (isDeadlift) {
              dynamicSets = 1;
              dynamicReps = "1";
            } else {
              dynamicSets = 3; // 3 single reps
              dynamicReps = "1"; // Taper reps for freshness
            }
          } else if (targetIntensityForReps < 0.65) {
            dynamicReps = "8-10";
            dynamicSets = 3;
          } else if (targetIntensityForReps < 0.75) {
            dynamicReps = "6-8";
            dynamicSets = 4;
          } else if (targetIntensityForReps < 0.80) {
            dynamicReps = "4-6";
            dynamicSets = 5;
          } else if (targetIntensityForReps < 0.85) {
            dynamicReps = "3-4";
            dynamicSets = 6;
          } else if (targetIntensityForReps < 0.90) {
            dynamicReps = "2-3";
            dynamicSets = 7;
          } else if (targetIntensityForReps < 0.95) {
            dynamicReps = "1-3";
            dynamicSets = 8;
          } else {
            dynamicReps = "1";
            dynamicSets = 10;
          }
        }

        const isStrengthBlock = [
          BlockType.STRENGTH,
          BlockType.POWER,
          BlockType.PEAKING,
          BlockType.MAX_EFFORT,
          BlockType.PURE_STRENGTH,
          BlockType.STRENGTH_RETENTION,
        ].includes(block.type as BlockType);

        if (isStrengthBlock) {
          if (dynamicReps === "6-8" || dynamicReps === "6" || dynamicReps === "8") {
            dynamicReps = "4-6";
          } else if (dynamicReps === "8-10" || dynamicReps === "8-12" || dynamicReps === "10-12") {
            dynamicReps = "5";
          }
        }

        dynamicSets = Math.min(dynamicSets, 5);
      }

      let useDynamic = isPrimaryMainLift || (isCompetitionBlock(block.type) && isMainLift);
      if ((slot as any).exerciseId) {
        useDynamic = false;
      }
      let reps = useDynamic ? dynamicReps : slot.reps;
      let sets = useDynamic ? dynamicSets : slot.sets;

      // Progressive Volume For Endurance (Increase duration by 10% per week in block)
      if (["endurance", "aerobic base", "capacity", "vo2 max", "threshold", "endurance retention"].includes(currentPhaseStr)) {
        if (slot.pattern === "impact" && String(reps).includes("min")) {
          const volumeMultiplier = 1 + ((weekInBlock - 1) * 0.1);
          reps = String(reps).replace(/(\d+)(?:-(\d+))?\s*min/, (match, p1, p2) => {
            if (p2) {
              const base = parseInt(p1);
              const top = parseInt(p2);
              return `${Math.round(base * volumeMultiplier)}-${Math.round(top * volumeMultiplier)} min`;
            } else {
              const val = parseInt(p1);
              return `${Math.round(val * volumeMultiplier)} min`;
            }
          });
        }
      }

      if (!isMainLift && goals.includes("powerbuilding") && slot.pattern !== "impact" && slot.pattern !== "mobility" && slot.pattern !== "core" && !(slot as any).exerciseId) {
        if (isCompetitionBlock(block.type)) {
          reps = "8-10";
          sets = 2; // Reduce accessory volume during taper
        } else {
          // Enforce purely hypertrophy focus for all accessories (ignore cardio/impact slots)
          reps = "10-15";
          sets = Math.max(3, Number(sets) || 3);
        }
      }

      if (isCompetitionBlock(block.type) && isDeadlift && !(slot as any).exerciseId) {
        adjustedIntensity = 0.55;
        adjustedBaseIntensity = 0.55;
      }

      // Auto-Regulate the Intensity to prevent mechanical failure on high-readiness high-rep sets
      if (estimated1RM > 0 && !isMainLift) {
        let parsedMinReps = (reps && typeof reps === "string")
          ? (parseInt(reps.split("-")[0]) || 8)
          : (parseInt(reps as any) || 8);
        let targetRpeCeiling =
          constraintExercise.targetRPE || 8.0;
        let effectiveReps = parsedMinReps + (10 - targetRpeCeiling);
        let safeIntensityLimit = (37 - Math.min(effectiveReps, 12)) / 36;

        // We remove the hard mathematical clamping on intensity 
        // to allow periodization (e.g. strength blocks) to function
        // unmodified while relying on natural target RPE to dictate stress.
        if (adjustedIntensity > safeIntensityLimit) {
          // Soften the intensity bump over safe limits instead of flat-capping
          adjustedIntensity = safeIntensityLimit + (adjustedIntensity - safeIntensityLimit) * 0.5;
        }
        if (adjustedBaseIntensity > safeIntensityLimit) {
          adjustedBaseIntensity = safeIntensityLimit + (adjustedBaseIntensity - safeIntensityLimit) * 0.5;
        }
      }

      if (isMainLift) {
        unmodifiedWeight = Math.round((estimated1RM * adjustedBaseIntensity) / 5) * 5;
        weight = Math.round((estimated1RM * adjustedIntensity) / 5) * 5;
      } else {
        // Nullify strict % math for accessories, use exact last weight or fall back to RPE
        if (lastWeight > 0) {
          weight = lastWeight;
          unmodifiedWeight = lastWeight;
        } else if (slot.pattern === "impact" || slot.pattern === "mobility" || slot.pattern === "core") {
          weight = slot.weight || 0;
          unmodifiedWeight = slot.weight || 0;
        } else {
          if (subsequentNonMain) {
            if (goals.includes("powerbuilding")) {
              weight = isFinalWeek ? "8.5" : "8.0";
              unmodifiedWeight = isFinalWeek ? "8.5" : "8.0";
            } else {
              weight = isFinalWeek ? "9.0" : "8.5";
              unmodifiedWeight = isFinalWeek ? "9.0" : "8.5";
            }
          } else {
            weight = "RPE 8";
            unmodifiedWeight = "RPE 8";
          }
        }
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

      if (isCalisthenic && lastWeight === 0 && dynamicPR === 0) {
        weight = 0;
        unmodifiedWeight = 0;
      }

      let exerciseName = (slot as any).nameOverride || selectedExercise.name;

      const unilateral =
        selectedExercise.isUnilateral || (slot as any).isUnilateral;

      // User Spec: During strength block, primary squat/deadlift gets 3 sets, primary bench press gets 4 sets.
      if (block.type === BlockType.STRENGTH && isPrimaryMainLift) {
        if (isSquat || isDeadlift) {
          sets = 3;
        } else if (isBench) {
          sets = 4;
        }
      }

      let slotVolumeModifier = volumeModifier;
      
      if (frequencyScale < 1.0) {
        if (slot.impact === 'high' || isMainLift) {
           slotVolumeModifier *= frequencyScale;
        } else if (slot.impact === 'medium') {
           slotVolumeModifier *= Math.max(0.7, frequencyScale);
        } else {
           // isolate accessories: bypass frequency penalty entirely
        }
      }

      if (slotVolumeModifier < 1.0 && !useDynamic && !(slot as any).exerciseId) {
        sets = Math.round(sets * slotVolumeModifier);
        // Safeguard for main lifts to prevent excessive volume drop on frequency shifts
        if (isMainLift && sets < 2 && slotVolumeModifier > 0.5) {
          sets = 2;
        }
        // Preserve 2 sets for accessory, hypertrophy, and mobility work during taper/competition week
        if (isCompetitionBlock(block.type) && !isMainLift && slot.pattern !== "impact") {
          sets = Math.max(2, sets);
        }
        sets = Math.max(1, sets);
      }

      // Defer unilateral sets calculation until all volume adjustments and overriding is done
      // ensuring that L1/R1, L2/R2 ... matches the calculated bilateral sets.
      if (unilateral) {
        sets = sets * 2;
      }

      // Longevity: Tempo/Pause work instead of weight increase
      if (
        goals.includes("longevity") &&
        block.type === BlockType.REGENERATION &&
        isMainLift
      ) {
        exerciseName = `${selectedExercise.name} (3s Tempo)`;
      }

      const isBifurcatedBlock =
        (block.type as any) === BlockType.STRENGTH ||
        (block.type as any) === BlockType.MAX_EFFORT ||
        (block.type as any) === BlockType.PEAKING;

      let intent: string | undefined;
      if (isMainLift) {
        intent = "HEAVY PRIMARY";
      } else if (isBifurcatedBlock) {
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
          intent = "ACTIVE RECOVERY";
        } else if (isHybrid) {
          intent = "MOVEMENT QUALITY";
        } else if (currentReadiness < 70) {
          intent = "BLOOD FLOW";
        } else {
          if (["endurance", "aerobic base", "capacity", "vo2 max", "threshold", "endurance retention"].includes(currentPhaseStr) || selectedExercise.pattern === "impact") {
            intent = "AEROBIC CAPACITY";
          } else {
            intent = "HYPERTROPHY";
          }
        }
      } else {
        // Non-bifurcated blocks (Foundation, Hypertrophy, Deload, etc.)
        // No heavy primary or strict hypertrophy flagging logic. Other intents like recovery/hybrid/blood flow can still hold if suitable.
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
          intent = "ACTIVE RECOVERY";
        } else if (isHybrid) {
          intent = "MOVEMENT QUALITY";
        } else if (currentReadiness < 70) {
          intent = "BLOOD FLOW";
        } else {
          if (["endurance", "aerobic base", "capacity", "vo2 max", "threshold", "endurance retention"].includes(currentPhaseStr) || selectedExercise.pattern === "impact") {
            intent = "AEROBIC CAPACITY";
          } else {
            intent = "HYPERTROPHY";
          }
        }
      }

      // Automatically append certain high-priority intents to the display name
      if (intent === "HEAVY PRIMARY" || intent === "HYPERTROPHY") {
        exerciseName = `${exerciseName} ${intent}`;
      }

      return {
        id: `e${i}`,
        exerciseId: selectedExercise.id,
        name: exerciseName,
        isSquat,
        isBench,
        isDeadlift,
        isPrimaryMainLift,
        intent,
        restPeriod: constraintExercise.restPeriod || (isMainLift ? 180 : 90),
        sets: (() => {
          let mappedSets: any[] = [];
          if ((slot as any).customSets) {
            mappedSets = (slot as any).customSets.map((customSet: any, j: number) => {
              let setWeight: number | string = 0;
              let setUnmodifiedWeight: number | string = 0;

              if (isMainLift && estimated1RM > 0) {
                const setIntensity = customSet.intensity || 0.70;
                setUnmodifiedWeight = Math.round((estimated1RM * setIntensity) / 5) * 5;
                setWeight = Math.round((estimated1RM * setIntensity * readinessModifier * recoveryModifier) / 5) * 5;
              } else {
                if (customSet.weight !== undefined) {
                  setWeight = customSet.weight;
                  setUnmodifiedWeight = customSet.weight;
                } else if (lastWeight > 0) {
                  setWeight = lastWeight;
                  setUnmodifiedWeight = lastWeight;
                } else if (slot.pattern === "impact" || slot.pattern === "mobility" || slot.pattern === "core") {
                  setWeight = slot.weight || 0;
                  setUnmodifiedWeight = slot.weight || 0;
                } else {
                  if (customSet.rpe) {
                    setWeight = `RPE ${customSet.rpe}`;
                    setUnmodifiedWeight = `RPE ${customSet.rpe}`;
                  } else {
                    setWeight = slot.weight || "RPE 6";
                    setUnmodifiedWeight = slot.weight || "RPE 6";
                  }
                }
              }

              const targetSetRpe = customSet.rpe ? customSet.rpe.toString() : "";

              return {
                id: `s${i}-${j}`,
                weight: setWeight.toString(),
                baseWeight: setUnmodifiedWeight.toString(),
                reps: customSet.reps || "1",
                baseReps: customSet.reps || "1",
                rpe: targetSetRpe,
                baseRpe: targetSetRpe,
                isCompleted: false,
              };
            });
          } else {
            let topSetRpeNum = 0;
            mappedSets = Array.from({ length: sets }).map((_, j) => {
              let targetSetRpe = constraintExercise.targetRPE
                ? constraintExercise.targetRPE.toString()
                : "";

              // Taper/Competition week sets RPE strictly to 5.5 unless explicitly set in the slot
              if (isCompetitionBlock(block.type)) {
                targetSetRpe = constraintExercise.targetRPE ? constraintExercise.targetRPE.toString() : "5.5";
              } else if (["endurance", "aerobic base", "capacity", "vo2 max", "threshold", "endurance retention"].includes(currentPhaseStr) || selectedExercise.pattern === "impact") {
                if (String(reps).toLowerCase().includes("warmup")) {
                  targetSetRpe = "2";
                } else if (String(reps).toLowerCase().includes("max effort") || String(reps).toLowerCase().includes("sprint")) {
                  targetSetRpe = "9.5";
                } else if (String(reps).toLowerCase().includes("tempo") || String(reps).toLowerCase().includes("threshold")) {
                  targetSetRpe = "8";
                } else {
                  targetSetRpe = "3"; // Base building default
                }
              } else if ([BlockType.RETENTION, BlockType.STRENGTH_RETENTION, BlockType.ENDURANCE_RETENTION].includes(block.type as BlockType)) {
                if (block.type === BlockType.ENDURANCE_RETENTION) {
                   targetSetRpe = "7";
                } else {
                   // Strength retention keeps tension high but avoids excessive RPE build up
                   targetSetRpe = j === 0 ? "8" : "7.5";
                }
              } else if (subsequentNonMain) {
                if (goals.includes("powerbuilding")) {
                  targetSetRpe = isFinalWeek ? "8.5" : "8.0";
                } else {
                  targetSetRpe = isFinalWeek ? "9.0" : "8.5";
                }
              } else if (isPrimaryMainLift) {
                 const isBifurcated =
                  (block.type as any) === BlockType.STRENGTH ||
                  (block.type as any) === BlockType.MAX_EFFORT ||
                  (block.type as any) === BlockType.PEAKING;

                if (isBifurcated) {
                  if (goals.includes("pure_strength")) {
                    targetSetRpe = j === 0 ? (isFinalWeek ? "10" : "9.5") : (isFinalWeek ? "9" : "8.5");
                  } else if (goals.includes("powerbuilding")) {
                    targetSetRpe = j === 0 ? (isFinalWeek ? "9.5" : "9") : (isFinalWeek ? "8.5" : "8");
                  } else if (goals.includes("hypertrophy")) {
                    targetSetRpe = j === 0 ? (isFinalWeek ? "9.5" : "9") : (isFinalWeek ? "8.5" : "8");
                  } else if (goals.includes("peaking")) {
                    targetSetRpe = j === 0 ? (isFinalWeek ? "10" : "9") : (isFinalWeek ? "8.5" : "8");
                  } else if (goals.includes("longevity")) {
                    targetSetRpe = "7.5";
                  } else {
                    targetSetRpe = j === 0 ? "9" : "8"; // Top set vs Back-off sets (Strength fallback)
                  }
                } else {
                  // Straight sets during foundation, hypertrophy, deload, etc. (no bifurcation RPE drop)
                  if (block.type === BlockType.DELOAD) {
                    targetSetRpe = "7";
                  } else if (goals.includes("longevity")) {
                    targetSetRpe = "7.5";
                  } else if (block.type === BlockType.HYPERTROPHY || block.type === BlockType.FOUNDATION) {
                    if (goals.includes("hypertrophy")) {
                      targetSetRpe = isFinalWeek ? "9" : "8.5";
                    } else {
                      targetSetRpe = isFinalWeek ? "8.5" : "8";
                    }
                  } else {
                    targetSetRpe = isFinalWeek ? "8.5" : "8";
                  }
                }
              } else if (!targetSetRpe) {
                // Accessories
                if (
                  (block.type as any) === BlockType.OVERREACH ||
                  (block.type as any) === BlockType.MAX_EFFORT
                ) {
                  if (goals.includes("hypertrophy")) {
                    targetSetRpe = "9";
                  } else if (goals.includes("powerbuilding")) {
                    targetSetRpe = "8.5";
                  } else if (goals.includes("pure_strength")) {
                    targetSetRpe = "7.5";
                  }
                } else if (goals.includes("longevity")) {
                  targetSetRpe = "7.0";
                } else if (goals.includes("powerbuilding") && ((block.type as any) === BlockType.STRENGTH || (block.type as any) === BlockType.MAX_EFFORT || (block.type as any) === BlockType.PEAKING)) {
                  // Strict bodybuilding rules for remaining back-offs/accessories
                  targetSetRpe = isFinalWeek ? "8.5" : "8.0";
                } else {
                  targetSetRpe = goals.includes("hypertrophy") ? (isFinalWeek ? "9" : "8") : "7.5";
                }
              }

              if (targetSetRpe) {
                let rpeVal = parseFloat(targetSetRpe);
                if (!isNaN(rpeVal)) {
                  const isBifurcated =
                    (block.type as any) === BlockType.STRENGTH ||
                    (block.type as any) === BlockType.MAX_EFFORT ||
                    (block.type as any) === BlockType.PEAKING;

                  if (isPrimaryMainLift && isBifurcated) {
                    if (j === 0) {
                      rpeVal = Math.min(rpeVal, readinessRpeLimit);
                    } else {
                      let originalTopSetRpe = 9;
                      if (goals.includes("pure_strength") || goals.includes("peaking")) {
                        originalTopSetRpe = isFinalWeek ? 10 : 9.5;
                      } else if (goals.includes("powerbuilding") || goals.includes("hypertrophy")) {
                        originalTopSetRpe = isFinalWeek ? 9.5 : 9;
                      }
                      const originalValue = rpeVal;
                      const dropFromTop = Math.max(0, originalTopSetRpe - originalValue);
                      const cappedTop = Math.min(originalTopSetRpe, readinessRpeLimit);
                      rpeVal = Math.min(originalValue, cappedTop - dropFromTop);
                    }
                  } else {
                    rpeVal = Math.min(rpeVal, readinessRpeLimit);
                  }
                  rpeVal = Math.max(5, rpeVal);
                  targetSetRpe = rpeVal.toString();
                }
              }

              let setWeight = typeof weight === "number" ? weight : parseFloat(weight as string) || 0;
              let setUnmodifiedWeight = typeof unmodifiedWeight === "number" ? unmodifiedWeight : parseFloat(unmodifiedWeight as string) || 0;

              if (j === 0) {
                topSetRpeNum = parseFloat(targetSetRpe) || 8;
              } else if (j > 0 && targetSetRpe) {
                const currentRpeNum = parseFloat(targetSetRpe) || 8;
                const rpeDrop = topSetRpeNum - currentRpeNum;
                const isBifurcated =
                  (block.type as any) === BlockType.STRENGTH ||
                  (block.type as any) === BlockType.MAX_EFFORT ||
                  (block.type as any) === BlockType.PEAKING;

                if (rpeDrop > 0 && isMainLift && isBifurcated) {
                  // Each point of RPE drop reduces weight by ~5% (0.05) to maintain the rep target
                  const dropFactor = 1 - (rpeDrop * 0.05);
                  setWeight = Math.round((setWeight * dropFactor) / 5) * 5;
                  setUnmodifiedWeight = Math.round((setUnmodifiedWeight * dropFactor) / 5) * 5;
                }
              }

              return {
                id: `s${i}-${j}`,
                weight: setWeight.toString(),
                baseWeight: setUnmodifiedWeight.toString(),
                reps: reps,
                baseReps: reps,
                rpe: targetSetRpe,
                baseRpe: targetSetRpe,
                isCompleted: false,
              };
            });
          }

          let isTargetForMed = false;
          if (retentionProtocol.active) {
            const pt = retentionProtocol.medPayload?.patternTarget || 'main_lift';
            if (pt === 'main_lift' && isPrimaryMainLift) isTargetForMed = true;
            if (pt === 'compound_accessory' && subsequentNonMain && (slot.impact === 'heavy' || slot.impact === 'medium')) isTargetForMed = true;
            if (pt === 'aerobic_base' && selectedExercise.pattern === 'impact') isTargetForMed = true;
            if (pt === 'intra_set_recovery' && (selectedExercise.pattern === 'core' || selectedExercise.pattern === 'mobility')) isTargetForMed = true;
          }

          const numSetsToInject = retentionProtocol.medPayload?.setsToInject || 1;
          const injectedMedSets = [];
          
          if (isTargetForMed) {
             for (let m = 0; m < numSetsToInject; m++) {
               let medWeight = typeof weight === 'number' ? weight : 0;
               let medBaseWeight = typeof unmodifiedWeight === 'number' ? unmodifiedWeight : 0;
               if (medWeight > 0) {
                  const finalInt = blockIntensity * readinessModifier * recoveryModifier;
                  const intScale = finalInt > 0 ? finalInt : 1;
                  const medInt = Math.max(0.1, retentionProtocol.medPayload?.intensity || 0.85); // Avoid div by zero
                  medWeight = Math.round(((medWeight / intScale) * medInt) / 5) * 5;
                  
                  const baseIntScale = blockIntensity > 0 ? blockIntensity : 1;
                  medBaseWeight = Math.round(((medBaseWeight / baseIntScale) * medInt) / 5) * 5;
               }

               injectedMedSets.push({
                    id: `s${i}-retention-${m}`,
                    weight: medWeight > 0 ? medWeight.toString() : weight.toString(),
                    baseWeight: medBaseWeight > 0 ? medBaseWeight.toString() : unmodifiedWeight.toString(),
                    reps: retentionProtocol.medPayload?.reps || "1",
                    baseReps: retentionProtocol.medPayload?.reps || "1",
                    rpe: "8.5",
                    baseRpe: "8.5",
                    isCompleted: false,
               });
             }
          }

          return [
            ...mappedSets,
            ...injectedMedSets
          ];
        })(),
      };
    }),
    currentExerciseIndex: 0,
    currentSetIndex: 0,
  };
};
