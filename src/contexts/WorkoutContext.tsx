import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useSettings, UserProfile } from './SettingsContext';
import { BlockType, getBlockForWeek } from '../constants/periodization';
import { calculateTier } from '../lib/strength';

export interface Set {
  id: string;
  weight: string;
  reps: string;
  rpe: string;
  isCompleted: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  isAdditional?: boolean;
  groupId?: string;
  groupTitle?: string;
}

export interface WorkoutSession {
  id: string;
  uid?: string;
  date: string;
  time: string;
  title: string;
  exercises: Exercise[];
  startTime?: number;
  completedAt?: number;
  rpe?: number;
  readiness?: number;
  note?: string;
  duration?: string;
  volume?: string;
  blockType?: BlockType;
  weekInBlock?: number;
  totalWeek?: number;
}

interface WorkoutContextType {
  history: WorkoutSession[];
  currentSession: WorkoutSession | null;
  startNewSession: (template?: WorkoutSession, readinessScore?: number, readinessModifier?: number) => void;
  completeSession: (data: { rpe: number; note: string }) => void;
  updateCurrentSession: (session: WorkoutSession) => void;
  addExerciseToSession: (exercises: Exercise[]) => void;
  replaceExerciseInSession: (oldExerciseId: string, newExercise: Exercise) => void;
  discardSession: () => void;
  getNextWorkoutTemplate: () => WorkoutSession;
  getCalibrationStatus: () => {
    readiness: number;
    readinessModifier: number;
    recoveryModifier: number;
    isDeload: boolean;
    isPeak: boolean;
  };
  mockWorkoutCount: number | null;
  setMockWorkoutCount: (count: number | null) => void;
  resetProgress: () => Promise<void>;
  resetProgram: () => Promise<void>;
  updateHistoryWorkout: (workout: WorkoutSession) => Promise<void>;
  isLoading: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const WORKOUT_TEMPLATES = [
  {
    title: 'Foundation Alpha',
    exercises: [
      { name: 'Barbell Squat', weight: 60, reps: '8', sets: 3 },
      { name: 'Bench Press', weight: 40, reps: '10', sets: 3 },
      { name: 'Bent Over Rows', weight: 30, reps: '12', sets: 3 },
    ]
  },
  {
    title: 'Power Development',
    exercises: [
      { name: 'Deadlift', weight: 80, reps: '5', sets: 3 },
      { name: 'Overhead Press', weight: 30, reps: '8', sets: 3 },
      { name: 'Pull Ups', weight: 0, reps: '10', sets: 3 },
    ]
  },
  {
    title: 'Hypertrophy Focus',
    exercises: [
      { name: 'Leg Press', weight: 120, reps: '12', sets: 3 },
      { name: 'Incline DB Press', weight: 20, reps: '10', sets: 3 },
      { name: 'Lat Pulldowns', weight: 45, reps: '12', sets: 3 },
    ]
  }
];

const calculateFallback1RM = (
  exerciseName: string, 
  bodyweight: number | undefined, 
  level: string, 
  unit: string, 
  templateBaseWeight: number,
  age: number | undefined,
  gender: string | undefined,
  profileUnit?: string
) => {
  // Normalize bodyweight to current unit
  let bw = bodyweight;
  if (bw && profileUnit && profileUnit !== unit) {
    bw = unit === 'metric' ? bw / 2.20462 : bw * 2.20462;
  }

  // Default bodyweight if not provided: 80kg or 175lbs
  if (!bw) {
    bw = unit === 'imperial' ? 175 : 80;
  }
  
  // Cap bodyweight for multiplier logic to prevent absurd numbers for very heavy lifters
  const maxBw = unit === 'imperial' ? 250 : 115;
  const effectiveBw = Math.min(bw, maxBw);
  
  const name = exerciseName.toLowerCase();
  let multiplier = 0;
  const isFemale = gender === 'female';

  if (name.includes('squat')) {
    if (isFemale) {
      multiplier = { 'untrained': 0.5, 'novice': 0.8, 'intermediate': 1.0, 'advanced': 1.3, 'elite': 1.6 }[level] || 0.5;
    } else {
      multiplier = { 'untrained': 0.8, 'novice': 1.2, 'intermediate': 1.5, 'advanced': 2.0, 'elite': 2.4 }[level] || 0.8;
    }
  } else if (name.includes('bench')) {
    if (isFemale) {
      multiplier = { 'untrained': 0.4, 'novice': 0.5, 'intermediate': 0.7, 'advanced': 0.9, 'elite': 1.2 }[level] || 0.4;
    } else {
      multiplier = { 'untrained': 0.6, 'novice': 0.9, 'intermediate': 1.2, 'advanced': 1.5, 'elite': 1.9 }[level] || 0.6;
    }
  } else if (name.includes('deadlift')) {
    if (isFemale) {
      multiplier = { 'untrained': 0.6, 'novice': 1.0, 'intermediate': 1.2, 'advanced': 1.6, 'elite': 2.0 }[level] || 0.6;
    } else {
      multiplier = { 'untrained': 1.0, 'novice': 1.5, 'intermediate': 1.8, 'advanced': 2.3, 'elite': 2.8 }[level] || 1.0;
    }
  } else {
    // For accessories, scale the template base weight to an estimated 1RM
    const tierMultiplier = { 'untrained': 0.8, 'novice': 1, 'intermediate': 1.2, 'advanced': 1.4, 'elite': 1.6 }[level] || 0.8;
    const unitMultiplier = unit === 'imperial' ? 2.20462 : 1;
    const genderMultiplier = isFemale ? 0.65 : 1.0;
    multiplier = (templateBaseWeight / effectiveBw) * tierMultiplier * unitMultiplier * 1.33 * genderMultiplier;
  }

  let estimated1RM = effectiveBw * multiplier;

  // Apply Age Factor (ExRx Age Adjustments)
  const userAge = age || 30; // Default to prime age if not provided
  let ageFactor = 1.0;
  if (userAge >= 14 && userAge <= 17) ageFactor = 0.90;
  else if (userAge >= 40 && userAge <= 49) ageFactor = 0.90;
  else if (userAge >= 50 && userAge <= 59) ageFactor = 0.80;
  else if (userAge >= 60 && userAge <= 69) ageFactor = 0.70;
  else if (userAge >= 70) ageFactor = 0.60;

  return Math.round(estimated1RM * ageFactor);
};

const createSessionFromTemplate = (
  week: number, 
  day: number, 
  profile: UserProfile | null, 
  currentUnit: 'imperial' | 'metric',
  lastSession: WorkoutSession | null,
  currentReadiness: number
): WorkoutSession => {
  const durationMonths = profile?.trainingDurationMonths || 3;
  const totalDurationWeeks = durationMonths * 4;
  const { block, weekInBlock } = getBlockForWeek(week, totalDurationWeeks, profile?.trainingGoal || 'powerbuilding');
  const templateIndex = (day - 1) % WORKOUT_TEMPLATES.length;
  const template = WORKOUT_TEMPLATES[templateIndex];
  
  // 1. Base Intensity from Block + Weekly Progression
  const blockIntensity = block.baseIntensity + (weekInBlock - 1) * block.intensityIncrementPerWeek;
  
  // 2. Readiness Adjustment
  let readinessModifier = 1.0;
  if (currentReadiness >= 90) readinessModifier = 1.05;
  else if (currentReadiness < 70 && currentReadiness >= 50) readinessModifier = 0.90;
  else if (currentReadiness < 50) readinessModifier = 0.80;

  // 3. Recovery Adjustment
  let recoveryModifier = 1.0;
  if (lastSession) {
    if (lastSession.rpe && lastSession.rpe >= 9) {
      recoveryModifier *= 0.95;
    }
    const hoursSinceLast = (Date.now() - (lastSession.completedAt || 0)) / 3600000;
    if (hoursSinceLast < 24 && lastSession.title.includes(template.title.split(':')[0])) {
      recoveryModifier *= 0.90;
    }
  }

  const finalIntensity = blockIntensity * readinessModifier * recoveryModifier;

  return {
    id: `w${week}d${day}`,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: `W${week}D${day}: ${template.title}`,
    startTime: Date.now(),
    blockType: block.type,
    weekInBlock,
    totalWeek: week,
    exercises: template.exercises.map((ex, i) => {
      let weight = 0;
      
      const isSquat = ex.name.toLowerCase().includes('squat');
      const isBench = ex.name.toLowerCase().includes('bench');
      const isDeadlift = ex.name.toLowerCase().includes('deadlift');

      const currentTier = profile ? calculateTier(
        profile.squatPR || 0,
        profile.benchPR || 0,
        profile.deadliftPR || 0,
        profile.weight || 0,
        profile.gender || 'male'
      ) : 'untrained';

      if (profile && (isSquat || isBench || isDeadlift)) {
        let pr = 0;
        if (isSquat) pr = profile.squatPR || 0;
        if (isBench) pr = profile.benchPR || 0;
        if (isDeadlift) pr = profile.deadliftPR || 0;

        if (pr > 0) {
          let normalizedPR = pr;
          if (profile.unit !== currentUnit) {
            normalizedPR = currentUnit === 'metric' ? pr / 2.20462 : pr * 2.20462;
          }
          weight = Math.round(normalizedPR * finalIntensity);
        } else {
          const baseWeight = typeof ex.weight === 'string' ? parseFloat(ex.weight) : ex.weight;
          const estimated1RM = calculateFallback1RM(ex.name, profile.weight, currentTier, currentUnit, baseWeight, profile.age, profile.gender, profile.unit);
          weight = Math.round(estimated1RM * finalIntensity);
        }
      } else {
        const baseWeight = typeof ex.weight === 'string' ? parseFloat(ex.weight) : ex.weight;
        const estimated1RM = calculateFallback1RM(ex.name, profile?.weight, currentTier, currentUnit, baseWeight, profile?.age, profile?.gender, profile?.unit);
        weight = Math.round(estimated1RM * finalIntensity);
      }

      // Adjust reps and sets based on block
      const reps = (isSquat || isBench || isDeadlift) ? block.baseReps : ex.reps;
      const sets = (isSquat || isBench || isDeadlift) ? block.baseSets : ex.sets;

      return {
        id: `e${i}`,
        name: ex.name,
        sets: Array.from({ length: sets }).map((_, j) => ({
          id: `s${i}-${j}`,
          weight: weight.toString(),
          reps: reps,
          rpe: '',
          isCompleted: false
        }))
      };
    })
  };
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { unit, profile, updateProfile } = useSettings();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [mockWorkoutCount, setMockWorkoutCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('berserker_current_session');
    if (savedSession) {
      try {
        setCurrentSession(JSON.parse(savedSession));
      } catch (e) {
        console.error('Failed to parse saved session', e);
        localStorage.removeItem('berserker_current_session');
      }
    }
  }, []);

  // Persist current session to localStorage
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('berserker_current_session', JSON.stringify(currentSession));
    } else {
      localStorage.removeItem('berserker_current_session');
    }
  }, [currentSession]);

  // Handle unit conversion for current session
  const prevUnitRef = React.useRef(unit);
  useEffect(() => {
    if (prevUnitRef.current && prevUnitRef.current !== unit) {
      const weightFactor = unit === 'metric' ? 1 / 2.20462 : 2.20462;
      if (currentSession) {
        const updatedSession = { ...currentSession };
        updatedSession.exercises = updatedSession.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set => ({
            ...set,
            weight: set.weight ? String(Math.round(parseFloat(set.weight) * weightFactor)) : ''
          }))
        }));
        setCurrentSession(updatedSession);
      }
    }
    prevUnitRef.current = unit;
  }, [unit]);

  // Sync with Firestore
  useEffect(() => {
    console.log("Auth: Setting up onAuthStateChanged listener in WorkoutContext...");
    let unsubscribeFirestore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("Auth: State changed in WorkoutContext. User:", user ? user.email : "NULL");
      
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = undefined;
      }

      if (user) {
        const workoutsPath = `users/${user.uid}/workouts`;
        const q = query(
          collection(db, workoutsPath),
          orderBy('completedAt', 'desc')
        );

        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const workouts = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as WorkoutSession));
          setHistory(workouts);
          setIsLoading(false);
        }, (error) => {
          // Only report error if we still have a user (to avoid reporting permission errors on logout)
          if (auth.currentUser) {
            console.error("Auth: Firestore workouts listener error:", error);
            handleFirestoreError(error, OperationType.LIST, workoutsPath);
          }
          setIsLoading(false);
        });
      } else {
        setHistory([]);
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Auth: onAuthStateChanged error in WorkoutContext:", error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Save mock count to localStorage
  useEffect(() => {
    const savedMockCount = localStorage.getItem('berserker_mock_count');
    if (savedMockCount) {
      setMockWorkoutCount(parseInt(savedMockCount));
    }
  }, []);

  useEffect(() => {
    if (mockWorkoutCount !== null) {
      localStorage.setItem('berserker_mock_count', mockWorkoutCount.toString());
    } else {
      localStorage.removeItem('berserker_mock_count');
    }
  }, [mockWorkoutCount]);

  const getCalibrationStatus = () => {
    let currentReadiness = 85; // Default baseline

    if (history.length > 0) {
      const now = Date.now();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Calculate numerical volume for a session
      const getSessionLoad = (session: WorkoutSession) => {
        let totalVolume = 0;
        if (session.exercises) {
          session.exercises.forEach(ex => {
            if (ex.sets) {
              ex.sets.forEach(s => {
                if (s.isCompleted) {
                  totalVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
                }
              });
            }
          });
        }
        // Load = Volume * RPE (if RPE is missing, assume 7)
        return totalVolume * (session.rpe || 7);
      };

      // Calculate Acute Load (last 3 days)
      let acuteLoad = 0;
      // Calculate Chronic Load (last 7 days)
      let chronicLoadTotal = 0;
      
      history.forEach(session => {
        const completedAt = session.completedAt || 0;
        const daysAgo = (now - completedAt) / msPerDay;
        const load = getSessionLoad(session);
        
        if (daysAgo <= 3) {
          acuteLoad += load;
        }
        if (daysAgo <= 7) {
          chronicLoadTotal += load;
        }
      });
      
      // Chronic load is the average 3-day load over the 7 day period
      // (Total load in 7 days) / (7 / 3)
      const chronicLoad = chronicLoadTotal / (7 / 3);
      
      // Calculate ACWR (Acute:Chronic Workload Ratio)
      let acwr = 1.0;
      if (history.length >= 3) {
        if (chronicLoad > 0) {
          acwr = acuteLoad / chronicLoad;
        } else if (acuteLoad > 0) {
          acwr = 1.5; // High acute load with no chronic load = danger zone
        }
      }
      
      // Map ACWR to readiness score
      // Optimal ACWR is 0.8 - 1.3
      // If ACWR is optimal, readiness is high (85-100)
      // If ACWR is > 1.5, readiness drops significantly
      // If ACWR < 0.8, readiness is high but maybe detraining
      
      // Factor in the time since last session for acute recovery
      const lastSession = history[0];
      const hoursSinceLast = (now - (lastSession.completedAt || now)) / 3600000;
      const acuteRecoveryFactor = Math.min(1.0, hoursSinceLast / 48); // Full acute recovery at 48 hours
      
      if (history.length < 3) {
        // Not enough data for ACWR, rely purely on acute recovery
        currentReadiness = 60 + (40 * acuteRecoveryFactor); // 60-100
      } else if (acwr < 0.8) {
        currentReadiness = 90 + (10 * acuteRecoveryFactor); // 90-100
      } else if (acwr <= 1.3) {
        currentReadiness = 80 + (15 * acuteRecoveryFactor); // 80-95
      } else if (acwr <= 1.5) {
        currentReadiness = 60 + (20 * acuteRecoveryFactor); // 60-80
      } else {
        currentReadiness = 40 + (20 * acuteRecoveryFactor); // 40-60 (Danger zone)
      }
      
      currentReadiness = Math.round(Math.max(0, Math.min(100, currentReadiness)));
    }

    let readinessModifier = 1.0;
    if (currentReadiness >= 90) readinessModifier = 1.05;
    else if (currentReadiness < 70 && currentReadiness >= 50) readinessModifier = 0.90;
    else if (currentReadiness < 50) readinessModifier = 0.80;

    let recoveryModifier = 1.0;
    const lastSession = history.length > 0 ? history[0] : null;
    if (lastSession) {
      if (lastSession.rpe && lastSession.rpe >= 9) {
        recoveryModifier *= 0.95;
      }
      const hoursSinceLast = (Date.now() - (lastSession.completedAt || 0)) / 3600000;
      if (hoursSinceLast < 24) {
        recoveryModifier *= 0.90;
      }
    }

    return {
      readiness: currentReadiness,
      readinessModifier,
      recoveryModifier,
      isDeload: currentReadiness < 50,
      isPeak: currentReadiness >= 90
    };
  };

  const getNextWorkoutTemplate = () => {
    const filteredHistory = profile?.programResetAt 
      ? history.filter(s => (s.completedAt || 0) > profile.programResetAt!)
      : history;

    const lastSession = filteredHistory.length > 0 ? filteredHistory[0] : null;
    const currentReadiness = getCalibrationStatus().readiness;

    if (filteredHistory.length === 0) {
      const startWeek = 1 + (profile?.trainingWeekOffset || 0);
      return createSessionFromTemplate(startWeek, 1, profile, unit, null, currentReadiness);
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
    return createSessionFromTemplate(finalWeek, nextDay, profile, unit, lastSession, currentReadiness);
  };

  const startNewSession = (template?: WorkoutSession, readinessScore?: number, readinessModifier?: number) => {
    if (template) {
      setCurrentSession(template);
    } else {
      const newSession = getNextWorkoutTemplate();
      if (readinessScore !== undefined && readinessModifier !== undefined) {
        newSession.readiness = readinessScore;
        
        // Apply the modifier to the weights
        newSession.exercises = (newSession.exercises || []).map(ex => {
          const isMainLift = ex.name?.toLowerCase().includes('squat') || 
                             ex.name?.toLowerCase().includes('bench') || 
                             ex.name?.toLowerCase().includes('deadlift');
          
          let updatedSets = ex.sets || [];
          
          // Cut accessory volume if red light (modifier < 1)
          if (!isMainLift && readinessModifier < 1.0 && updatedSets.length > 2) {
            updatedSets = updatedSets.slice(0, updatedSets.length - 1);
          }

          return {
            ...ex,
            sets: updatedSets.map(set => ({
              ...set,
              weight: Math.round((parseFloat(set.weight) || 0) * readinessModifier).toString()
            }))
          };
        });
      }
      setCurrentSession(newSession);
    }
  };

  const updateCurrentSession = (session: WorkoutSession) => {
    setCurrentSession(session);
  };

  const addExerciseToSession = (newExercises: Exercise[]) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      exercises: [...(currentSession.exercises || []), ...newExercises]
    });
  };

  const replaceExerciseInSession = (oldExerciseId: string, newExercise: Exercise) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      exercises: (currentSession.exercises || []).map(ex => 
        ex.id === oldExerciseId ? newExercise : ex
      )
    });
  };

  const discardSession = () => {
    setCurrentSession(null);
  };

  const completeSession = async (data: { rpe: number; note: string }) => {
    if (!currentSession || !auth.currentUser) return;

    const completedSession: any = {
      ...currentSession,
      uid: auth.currentUser.uid,
      rpe: data.rpe,
      note: data.note,
      completedAt: Date.now(),
      duration: '1h 10m', // Mock duration for now
      volume: calculateVolume(currentSession),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    const workoutsPath = `users/${auth.currentUser.uid}/workouts`;
    try {
      await addDoc(collection(db, workoutsPath), completedSession);
      setCurrentSession(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, workoutsPath);
    }
  };

  const calculateVolume = (session: WorkoutSession) => {
    if (!session || !session.exercises) return `0 ${unit === 'imperial' ? 'lbs' : 'kg'}`;
    let total = 0;
    session.exercises.forEach(ex => {
      if (!ex.sets) return;
      ex.sets.forEach(s => {
        if (s.isCompleted) {
          total += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
        }
      });
    });
    return `${total.toLocaleString()} ${unit === 'imperial' ? 'lbs' : 'kg'}`;
  };

  const resetProgress = async () => {
    if (!auth.currentUser) return;
    
    const workoutsPath = `users/${auth.currentUser.uid}/workouts`;
    try {
      const { getDocs, deleteDoc, doc, writeBatch, collection } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const snapshot = await getDocs(collection(db, workoutsPath));
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((d) => {
        batch.delete(doc(db, workoutsPath, d.id));
      });
      
      // Commit the batch deletion
      await batch.commit();
      
      // Reset profile fields to start fresh
      await updateProfile({
        trainingWeekOffset: 0,
        squatPR: 0,
        benchPR: 0,
        deadliftPR: 0,
        programResetAt: 0
      });
      
      setCurrentSession(null);
      localStorage.removeItem('berserker_current_session');
      setMockWorkoutCount(null);
      localStorage.removeItem('berserker_mock_count');
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
        programResetAt: Date.now()
      });
      
      setCurrentSession(null);
      localStorage.removeItem('berserker_current_session');
    } catch (error) {
      console.error("Failed to reset program:", error);
    }
  };

  const updateHistoryWorkout = async (workout: WorkoutSession) => {
    if (!auth.currentUser) return;
    const workoutPath = `users/${auth.currentUser.uid}/workouts/${workout.id}`;
    try {
      // Recalculate volume
      const updatedWorkout = {
        ...workout,
        uid: auth.currentUser.uid, // Ensure UID is present
        volume: calculateVolume(workout)
      };
      
      await setDoc(doc(db, `users/${auth.currentUser.uid}/workouts`, workout.id), updatedWorkout);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, workoutPath);
    }
  };

  return (
    <WorkoutContext.Provider value={{ 
      history, 
      currentSession, 
      startNewSession, 
      completeSession, 
      updateCurrentSession,
      addExerciseToSession,
      replaceExerciseInSession,
      discardSession,
      getNextWorkoutTemplate,
      getCalibrationStatus,
      mockWorkoutCount,
      setMockWorkoutCount,
      resetProgress,
      resetProgram,
      updateHistoryWorkout,
      isLoading
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
