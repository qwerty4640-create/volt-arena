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

import type { Set, Exercise, WorkoutSession, RecoveryType, ActiveRecovery } from '../types/workout';
export type { Set, Exercise, WorkoutSession, RecoveryType, ActiveRecovery };

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

import { 
  applyIntensityModifications, 
  calculateVolume as calculateVolumeDirector
} from "../logic/programDirector";
import {
  FULL_BODY_TEMPLATES, UPPER_LOWER_TEMPLATES, PPL_UL_TEMPLATES, 
  ENDURANCE_TEMPLATES, TACTICAL_TEMPLATES, EXPLOSIVE_TEMPLATES, MEDICAL_TEMPLATES,
  calculateFallback1RM, getDailyMissionTitleAndDesc, createSessionFromTemplate
} from "../logic/sessionGeneratorEngine";
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
        let parsed = JSON.parse(savedSession) as WorkoutSession;
        
        // Auto-correct any legacy or incorrect 6-8 reps on main lifts during Strength blocks
        const isStrengthBlock = [
          BlockType.STRENGTH,
          BlockType.POWER,
          BlockType.PEAKING,
          BlockType.MAX_EFFORT,
          BlockType.PURE_STRENGTH,
          BlockType.STRENGTH_RETENTION,
        ].includes(parsed.blockType as BlockType) || (parsed.title && parsed.title.includes("W7"));

        if (isStrengthBlock && parsed.exercises) {
          parsed.exercises = parsed.exercises.map(ex => {
            const isMain = ex.isSquat || ex.isBench || ex.isDeadlift || 
              (ex.name && (ex.name.toLowerCase().includes("squat") || ex.name.toLowerCase().includes("bench") || ex.name.toLowerCase().includes("deadlift")));
            
            if (isMain && ex.sets) {
              const has6to8 = ex.sets.some(s => s.reps === "6-8" || s.baseReps === "6-8");
              if (has6to8) {
                ex.sets = ex.sets.map(s => {
                  if (s.reps === "6-8" || s.reps === "8" || s.reps === "6") {
                    return { ...s, reps: "4-6", baseReps: "4-6" };
                  }
                  return s;
                });
              }
            }
            return ex;
          });
        }

        setCurrentSession(parsed);
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



  const applyMidSessionPenalty = (
    recoveryHistoryOverride?: ActiveRecovery[],
  ) => {
    if (!currentSession || currentSession.penaltyApplied) return;
    const calibration = getCalibrationStatus(recoveryHistoryOverride);
    const penalizedSession = applyIntensityModifications(currentSession, calibration);
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

  const getNextWorkoutTemplate = useCallback((overrideReadinessScore?: number) => {
    let filteredHistory = history.filter(s => !(s as any).isCustom);

    // Mitigate bugged backfills: if programResetAt exists but wipes ALL history
    // when we clearly have history, it's likely a bugged timestamp. Ignore it.
    if (profile?.programResetAt) {
      const tempFiltered = filteredHistory.filter(
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
    const currentReadiness = overrideReadinessScore !== undefined ? overrideReadinessScore : 85;
    const hasAerobicInterference = overrideReadinessScore !== undefined ? calibration.hasAerobicInterference : false;

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
      let filteredHistory = history.filter(s => !(s as any).isCustom);
      if (profile?.programResetAt) {
        const tempFiltered = filteredHistory.filter(
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
      const finalReadinessToUse = 85;
      const hasAerobicInterference = false;

      return createSessionFromTemplate(
        week,
        day,
        profile,
        unit,
        lastSession,
        finalReadinessToUse,
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
          baseRpe: s.baseRpe || s.rpe,
          baseReps: s.baseReps || s.reps,
        })),
      }));
    } else {
      session = getNextWorkoutTemplate(readinessScore);
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

    session.prescribedRpe = calibration.recommendedRpe;
    if (targetRpe !== undefined) {
      session.targetRpe = targetRpe;
      
      session.exercises = (session.exercises || []).map((ex) => ({
        ...ex,
        sets: (ex.sets || []).map((s) => {
          let updatedRpeStr = s.rpe;
          let rpeVal = parseFloat(String(s.rpe));
          let setWeight = parseFloat(String(s.weight)) || 0;
          let baseSetWeight = parseFloat(String(s.baseWeight)) || setWeight;
          
          if (!isNaN(rpeVal) && rpeVal > targetRpe) {
            const rpeDrop = rpeVal - targetRpe;
            if (rpeDrop > 0 && ex.isPrimaryMainLift && setWeight > 0) {
              const dropFactor = 1 - (rpeDrop * 0.05);
              setWeight = Math.round((setWeight * dropFactor) / 5) * 5;
              baseSetWeight = Math.round((baseSetWeight * dropFactor) / 5) * 5;
            }
            updatedRpeStr = Math.max(5, targetRpe).toString();
          }
          return {
            ...s,
            rpe: updatedRpeStr,
            baseRpe: updatedRpeStr,
            weight: setWeight > 0 ? setWeight.toString() : String(s.weight),
            baseWeight: baseSetWeight > 0 ? baseSetWeight.toString() : String(s.baseWeight)
          };
        }),
      }));
    } else if (session.targetRpe === undefined) {
      session.targetRpe = calibration.recommendedRpe;
    }

    if (
      !calibration.isRedline &&
      readinessScore !== undefined
    ) {
      session.readiness = readinessScore;
    }

    const activeRpeLimit = session.targetRpe || 8.0;
    const goals = profile?.trainingObjectives || (profile?.trainingGoal ? [profile.trainingGoal] : ["powerbuilding"]);

    // Unified weight and prefilled RPE adjuster based on daily readiness limit
    session.exercises = (session.exercises || []).map((ex) => {
      const isMainLift =
        isMainLiftMatch(ex.name || "", "Squat") ||
        isMainLiftMatch(ex.name || "", "Bench Press") ||
        isMainLiftMatch(ex.name || "", "Deadlift");

      const isPrimaryMainLift = ex.isPrimaryMainLift !== false && isMainLift;

      let updatedSets = ex.sets || [];

      // Cut accessory volume if red light (modifier < 1.0)
      if (
        readinessModifier !== undefined &&
        !isMainLift &&
        readinessModifier < 1.0 &&
        updatedSets.length > 2
      ) {
        updatedSets = updatedSets.slice(0, updatedSets.length - 1);
      }

      const totalSetsNum = updatedSets.length;

      return {
        ...ex,
        sets: updatedSets.map((set, j) => {
          const baseValue = parseFloat(set.baseWeight || set.weight) || 0;
          let weightVal = baseValue;

          if (readinessModifier !== undefined) {
            weightVal = Math.round((baseValue * readinessModifier) / 5) * 5;
          }

          let setRpe = set.baseRpe || set.rpe || "8";
          let rpeVal = parseFloat(setRpe);

          const isEnduranceStr = (session.title || "").toLowerCase().includes("aerobic") || 
            (session.title || "").toLowerCase().includes("endurance") || 
            (session.title || "").toLowerCase().includes("capacity") ||
            (session.title || "").toLowerCase().includes("threshold") ||
            (session.title || "").toLowerCase().includes("vo2 max") ||
            ex.name.toLowerCase().includes("capacity") ||
            ex.name.toLowerCase().includes("rowing") ||
            ex.name.toLowerCase().includes("running") ||
            ex.name.toLowerCase().includes("cycling") ||
            ex.name.toLowerCase().includes("rucking");

          if (!isNaN(rpeVal)) {
            const isBifurcated =
              (session.title || "").toLowerCase().includes("strength") ||
              (session.title || "").toLowerCase().includes("effort") ||
              (session.title || "").toLowerCase().includes("peaking") ||
              goals.includes("pure_strength") ||
              goals.includes("powerbuilding");

            if (isPrimaryMainLift && isBifurcated && totalSetsNum > 1) {
              if (j === 0) {
                rpeVal = Math.min(rpeVal, activeRpeLimit);
              } else {
                // Maintain bifurcation drop
                const isFinalWeek = session.weekInBlock === 4;
                let originalTopSetRpe = 9.0;
                if (goals.includes("pure_strength") || goals.includes("peaking")) {
                  originalTopSetRpe = isFinalWeek ? 10.0 : 9.5;
                } else if (goals.includes("powerbuilding") || goals.includes("hypertrophy")) {
                  originalTopSetRpe = isFinalWeek ? 9.5 : 9.0;
                }
                const originalValue = rpeVal;
                const dropFromTop = Math.max(0, originalTopSetRpe - originalValue);
                const cappedTop = Math.min(originalTopSetRpe, activeRpeLimit);
                rpeVal = Math.min(originalValue, cappedTop - dropFromTop);
              }
            } else {
              rpeVal = Math.min(rpeVal, activeRpeLimit);
            }
            if (!isEnduranceStr) {
               rpeVal = Math.max(5, rpeVal);
            }
            setRpe = rpeVal.toString();
          }

          return {
            ...set,
            weight: weightVal.toString(),
            baseWeight: baseValue.toString(),
            rpe: setRpe,
            baseRpe: setRpe,
          };
        }),
      };
    });

    // Engineering Update: Applied penalized weights at birth if safety triggers active
    session = applyIntensityModifications(session, getCalibrationStatus());

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

          const totalTargetRpe = completedSets.reduce(
            (sum, s) =>
              sum + (parseFloat(String(s.baseRpe || s.rpe || "")) || 0),
            0,
          );
          const targetRpe = totalTargetRpe > 0 ? totalTargetRpe / completedSets.length : parseFloat(String(sessionToSave.targetRpe || "7"));


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

            let maxMissedReps = 0;
            completedSets.forEach((set) => {
              const setTargetStr = set.baseReps || set.reps;
              const setTarget = parseInt(setTargetStr.split("-")[0]) || 5;
              const setActual = parseInt(set.reps) || 0;
              if (setActual < setTarget) {
                const missed = setTarget - setActual;
                if (missed > maxMissedReps) {
                  maxMissedReps = missed;
                }
              }
            });

            const avgActualReps = targetRepsParsed - maxMissedReps;

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
                ex.name
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
    return calculateVolumeDirector(session, profile, unit);
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
