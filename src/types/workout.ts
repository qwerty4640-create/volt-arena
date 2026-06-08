import { BlockType } from '../constants/periodization';

export interface Set {
  id: string;
  weight: string;
  baseWeight?: string;
  reps: string;
  baseReps?: string;
  rpe: string;
  baseRpe?: string;
  actualRpe?: string;
  isCompleted: boolean;
  isWarmup?: boolean;
  phaseName?: string;
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
  isPrimaryMainLift?: boolean;
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
  prescribedRpe?: number;
  actualRpe?: number; // Post-session reflection
  isCustom?: boolean;
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

