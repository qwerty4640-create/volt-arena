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
  targetRpe?: number;
  actualRpe?: number; // Post-session reflection
  readiness?: number;
  note?: string;
  duration?: string;
  volume?: string;
  blockType?: BlockType;
  blockLabel?: string;
  weekInBlock?: number;
  totalWeek?: number;
}

export type RecoveryType = 'Running' | 'Swimming' | 'Cycling' | 'Walking' | 'Boxing' | 'Muay Thai' | 'Jiu Jitsu' | 'Wrestling' | 'MMA' | 'Rucking' | 'Tactical Drills' | 'Parkour' | 'Yoga' | 'Pilates' | 'Other';

export interface ActiveRecovery {
  id: string;
  uid: string;
  type: RecoveryType;
  rpe: number;
  durationMinutes: number;
  date: string;
  timestamp: number;
  note?: string;
}

interface WorkoutContextType {
  history: WorkoutSession[];
  recoveryHistory: ActiveRecovery[];
  currentSession: WorkoutSession | null;
  startNewSession: (template?: WorkoutSession, readinessScore?: number, readinessModifier?: number, targetRpe?: number) => void;
  completeSession: (data: { rpe: number; note: string }) => void;
  logActiveRecovery: (data: Omit<ActiveRecovery, 'id' | 'uid' | 'timestamp' | 'date'>) => Promise<void>;
  updateCurrentSession: (session: WorkoutSession) => void;
  addExerciseToSession: (exercises: Exercise[]) => void;
  replaceExerciseInSession: (oldExerciseId: string, newExercise: Exercise) => void;
  discardSession: () => void;
  getNextWorkoutTemplate: () => WorkoutSession;
  getCalibrationStatus: () => {
    readiness: number;
    readinessModifier: number;
    recoveryModifier: number;
    hasAerobicInterference: boolean;
    isDeload: boolean;
    isPeak: boolean;
    recommendedRpe: number;
  };
  mockWorkoutCount: number | null;
  setMockWorkoutCount: (count: number | null) => void;
  resetProgress: () => Promise<void>;
  resetProgram: () => Promise<void>;
  updateHistoryWorkout: (workout: WorkoutSession) => Promise<void>;
  saveReflection: (workoutId: string, actualRpe: number) => Promise<void>;
  pendingReflection: WorkoutSession | null;
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
  currentReadiness: number,
  hasAerobicInterference?: boolean
): WorkoutSession => {
  const goal = profile?.trainingGoal || 'powerbuilding';
  const durationMonths = profile?.trainingDurationMonths || 3;
  const totalDurationWeeks = durationMonths * 4;
  const { block, weekInBlock } = getBlockForWeek(week, totalDurationWeeks, goal);
  const templateIndex = (day - 1) % WORKOUT_TEMPLATES.length;
  const template = WORKOUT_TEMPLATES[templateIndex];
  
  // 1. Base Intensity from Block + Weekly Progression
  let blockIntensity = block.baseIntensity + (weekInBlock - 1) * block.intensityIncrementPerWeek;
  
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

  // 4. Volume and Goal-Specific Logic
  let volumeModifier = 1.0;
  const isFinalWeek = weekInBlock === block.durationWeeks;

  if (goal === 'pure_strength' && block.type === BlockType.PEAKING && isFinalWeek) {
    volumeModifier *= 0.6; // 40% drop in volume for fatigue dissipation
  } else if (goal === 'peaking' && block.type === BlockType.COMPETITION) {
    volumeModifier *= 0.5; // Drastic set reduction for realization
  } else if (goal === 'longevity' && block.type === BlockType.REGENERATION) {
    blockIntensity = Math.min(blockIntensity, 0.75); // Hard cap intensity
  }

  // If the last sessions were overshoots (Actual RPE > Target RPE), reduce volume further
  const recentSessions = lastSession ? [lastSession] : []; 
  const overshoots = recentSessions.filter(s => s.rpe && s.targetRpe && s.rpe > s.targetRpe);
  if (overshoots.length >= 1) {
    volumeModifier *= 0.8; 
  }

  const finalIntensity = blockIntensity * readinessModifier * recoveryModifier;

  return {
    id: `w${week}d${day}`,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: `W${week}D${day}: ${template.title}`,
    startTime: Date.now(),
    blockType: block.type,
    blockLabel: block.label,
    weekInBlock,
    totalWeek: week,
    exercises: template.exercises.map((ex, i) => {
      let weight = 0;
      
      const isSquat = ex.name.toLowerCase().includes('squat');
      const isBench = ex.name.toLowerCase().includes('bench');
      const isDeadlift = ex.name.toLowerCase().includes('deadlift');
      const isMainLift = isSquat || isBench || isDeadlift;

      const currentTier = profile ? calculateTier(
        profile.squatPR || 0,
        profile.benchPR || 0,
        profile.deadliftPR || 0,
        profile.weight || 0,
        profile.gender || 'male'
      ) : 'untrained';

      if (profile && isMainLift) {
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

      // Apply penalty for high-intensity aerobic activity before lower body days
      if (hasAerobicInterference && (isSquat || isDeadlift)) {
        weight = Math.round((weight * 0.85) / 5) * 5;
      }

      // Adjust reps and sets
      let reps = isMainLift ? block.baseReps : ex.reps;
      let sets = isMainLift ? block.baseSets : ex.sets;
      let exerciseName = ex.name;
      
      if (volumeModifier < 1.0) {
        sets = Math.max(1, Math.floor(sets * volumeModifier));
      }

      // Longevity: Tempo/Pause work instead of weight increase
      if (goal === 'longevity' && block.type === BlockType.REGENERATION && isMainLift) {
        exerciseName = `${ex.name} (3s Tempo)`;
      }

      return {
        id: `e${i}`,
        name: exerciseName,
        sets: Array.from({ length: sets }).map((_, j) => {
          let targetSetRpe = '';
          
          // Apply RPE Logic based on Goal
          if (isMainLift) {
            if (block.type === BlockType.PEAKING || block.type === BlockType.MAX_EFFORT || block.type === BlockType.OVERREACH || block.type === BlockType.COMPETITION) {
              if (goal === 'pure_strength') {
                targetSetRpe = isFinalWeek ? '10' : '9';
              } else if (goal === 'hypertrophy') {
                targetSetRpe = isFinalWeek ? '10' : '9.5';
              } else if (goal === 'powerbuilding') {
                targetSetRpe = j === 0 ? '9' : '8'; // Top set vs Back-off sets
              } else if (goal === 'peaking') {
                targetSetRpe = isFinalWeek ? '10' : '7'; // Low RPE during taper for recovery realization
              } else if (goal === 'longevity') {
                targetSetRpe = '7.5';
              }
            } else if (goal === 'longevity') {
              targetSetRpe = '7.5';
            }
          } else {
            // Accessories
            if (block.type === BlockType.OVERREACH || block.type === BlockType.MAX_EFFORT) {
              if (goal === 'hypertrophy') {
                targetSetRpe = '9';
              } else if (goal === 'powerbuilding') {
                targetSetRpe = '7.5';
              }
            } else if (goal === 'longevity') {
              targetSetRpe = '7.0';
            }
          }

          return {
            id: `s${i}-${j}`,
            weight: weight.toString(),
            reps: reps,
            rpe: targetSetRpe,
            isCompleted: false
          };
        })
      };
    })
  };
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { unit, profile, updateProfile } = useSettings();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [recoveryHistory, setRecoveryHistory] = useState<ActiveRecovery[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [mockWorkoutCount, setMockWorkoutCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReflection, setPendingReflection] = useState<WorkoutSession | null>(null);

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
        const recoveryPath = `users/${user.uid}/active_recovery`;

        const q = query(
          collection(db, workoutsPath),
          orderBy('completedAt', 'desc')
        );

        const qRecovery = query(
          collection(db, recoveryPath),
          orderBy('timestamp', 'desc')
        );

        const unsubscribeRecovery = onSnapshot(qRecovery, (snapshot) => {
          const recoveries = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as ActiveRecovery));
          setRecoveryHistory(recoveries);
        }, (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.LIST, recoveryPath);
          }
        });

        const unsubscribeWorkouts = onSnapshot(q, (snapshot) => {
          const workouts = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as WorkoutSession));
          setHistory(workouts);
          
          // Check for pending reflections
          const now = Date.now();
          const fifteenMins = 15 * 60 * 1000;
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          const needsReflection = workouts.find(s => 
            s.completedAt && 
            !s.actualRpe && 
            (now - s.completedAt) > fifteenMins && 
            (now - s.completedAt) < twentyFourHours
          );
          
          setPendingReflection(needsReflection || null);
          setIsLoading(false);
        }, (error) => {
          if (auth.currentUser) {
            console.error("Auth: Firestore workouts listener error:", error);
            handleFirestoreError(error, OperationType.LIST, workoutsPath);
          }
          setIsLoading(false);
        });

        unsubscribeFirestore = () => {
          unsubscribeRecovery();
          unsubscribeWorkouts();
        };
      } else {
        setHistory([]);
        setRecoveryHistory([]);
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

  const logActiveRecovery = async (data: Omit<ActiveRecovery, 'id' | 'uid' | 'timestamp' | 'date'>) => {
    if (!auth.currentUser) return;

    const recoveryPath = `users/${auth.currentUser.uid}/active_recovery`;
    const docRef = doc(collection(db, recoveryPath));
    const newRecovery: ActiveRecovery = {
      ...data,
      id: docRef.id,
      uid: auth.currentUser.uid,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    try {
      await setDoc(docRef, newRecovery);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, recoveryPath);
    }
  };

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
      
      // Factor in Active Recovery
      const lastRecovery = recoveryHistory[0];
      const hoursSinceRecovery = lastRecovery ? (now - lastRecovery.timestamp) / 3600000 : Infinity;
      
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

      // Penalty for high intensity cardio in the last 24 hours
      const recentHighIntensityRecovery = recoveryHistory.find(r => 
        (now - r.timestamp) / 3600000 < 24 && r.rpe >= 7
      );
      if (recentHighIntensityRecovery) {
        currentReadiness = Math.round(currentReadiness * 0.85);
      }
      
      currentReadiness = Math.round(Math.max(0, Math.min(100, currentReadiness)));
    }

    // Calculate Recommended RPE
    let recommendedRpe = 7; // Baseline
    if (currentReadiness >= 90) recommendedRpe = 8;
    else if (currentReadiness < 50) recommendedRpe = 5;
    else if (currentReadiness < 70) recommendedRpe = 6;

    // Adjust based on recent intensity (last 7 days)
    const last7Days = history.filter(s => {
      const daysAgo = (Date.now() - (s.completedAt || 0)) / (24 * 60 * 60 * 1000);
      return daysAgo <= 7;
    });

    if (last7Days.length > 0) {
      const avgRecentRpe = last7Days.reduce((acc, s) => acc + (s.rpe || 7), 0) / last7Days.length;
      if (avgRecentRpe >= 8.5) recommendedRpe = Math.max(5, recommendedRpe - 1);
      if (avgRecentRpe <= 6.0 && currentReadiness > 80) recommendedRpe = Math.min(9, recommendedRpe + 1);
    }

    // CNS Recovery check (Last session intensity)
    const lastSession = history.length > 0 ? history[0] : null;
    if (lastSession && lastSession.rpe && lastSession.rpe >= 9) {
      recommendedRpe = Math.max(5, recommendedRpe - 1);
    }

    let readinessModifier = 1.0;
    if (currentReadiness >= 90) readinessModifier = 1.05;
    else if (currentReadiness < 70 && currentReadiness >= 50) readinessModifier = 0.90;
    else if (currentReadiness < 50) readinessModifier = 0.80;

    let recoveryModifier = 1.0;
    if (lastSession) {
      if (lastSession.rpe && lastSession.rpe >= 9) {
        recoveryModifier *= 0.95;
      }
      const hoursSinceLast = (Date.now() - (lastSession.completedAt || 0)) / 3600000;
      if (hoursSinceLast < 24) {
        recoveryModifier *= 0.90;
      }
    }

    // Heavy aerobic penalty modifier
    const recentHighIntensityRecovery = recoveryHistory.find(r => 
      (Date.now() - r.timestamp) / 3600000 < 24 && r.rpe >= 7
    );
    let hasAerobicInterference = false;
    if (recentHighIntensityRecovery) {
      recoveryModifier *= 0.85;
      hasAerobicInterference = true;
    }

    return {
      readiness: currentReadiness,
      readinessModifier,
      recoveryModifier,
      hasAerobicInterference,
      isDeload: currentReadiness < 50,
      isPeak: currentReadiness >= 90,
      recommendedRpe
    };
  };

  const getNextWorkoutTemplate = () => {
    const filteredHistory = profile?.programResetAt 
      ? history.filter(s => (s.completedAt || 0) > profile.programResetAt!)
      : history;

    const lastSession = filteredHistory.length > 0 ? filteredHistory[0] : null;
    const calibration = getCalibrationStatus();
    const currentReadiness = calibration.readiness;
    const hasAerobicInterference = calibration.hasAerobicInterference;

    if (filteredHistory.length === 0) {
      const startWeek = 1 + (profile?.trainingWeekOffset || 0);
      return createSessionFromTemplate(startWeek, 1, profile, unit, null, currentReadiness, hasAerobicInterference);
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
    return createSessionFromTemplate(finalWeek, nextDay, profile, unit, lastSession, currentReadiness, hasAerobicInterference);
  };

  const startNewSession = (template?: WorkoutSession, readinessScore?: number, readinessModifier?: number, targetRpe?: number) => {
    if (template) {
      setCurrentSession(template);
    } else {
      const newSession = getNextWorkoutTemplate();
      if (readinessScore !== undefined && readinessModifier !== undefined) {
        newSession.readiness = readinessScore;
        newSession.targetRpe = targetRpe;
        
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

  const saveReflection = async (workoutId: string, actualRpe: number) => {
    if (!auth.currentUser) return;
    const workout = history.find(s => s.id === workoutId);
    if (!workout) return;

    const workoutPath = `users/${auth.currentUser.uid}/workouts/${workoutId}`;
    try {
      await setDoc(doc(db, workoutPath), {
        ...workout,
        actualRpe
      });
      setPendingReflection(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, workoutPath);
    }
  };

  return (
    <WorkoutContext.Provider value={{ 
      history, 
      recoveryHistory,
      currentSession, 
      startNewSession, 
      completeSession, 
      logActiveRecovery,
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
      saveReflection,
      pendingReflection,
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
