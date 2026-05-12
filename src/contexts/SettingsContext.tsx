import { getTranslation, SupportedLanguage } from '../i18n';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, writeBatch, collection, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ImmersionMode, WidgetId, PerformanceWidgetId } from '../types';
import { calculateTier } from '../lib/strength';

export type Language = SupportedLanguage;
type Unit = 'imperial' | 'metric';
type Gender = 'male' | 'female' | 'other';

export type TrainingGoal = 'pure_strength' | 'powerbuilding' | 'hypertrophy' | 'peaking' | 'longevity' | 'tactical' | 'explosiveness' | 'endurance' | 'prehab';

export type MissionPeriod = '3M' | '6M' | '9M' | '12M';

export interface CustomBlock {
  id: string;
  type: string; // From BlockType in periodization.ts
  durationWeeks: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  age?: number;
  height?: number;
  weight?: number;
  squatPR?: number;
  benchPR?: number;
  deadliftPR?: number;
  trainingGoal?: TrainingGoal;
  trainingObjectives?: TrainingGoal[];
  trainingFrequency?: number;
  onboardingCompleted?: boolean;
  level: 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite';
  trainingWeekOffset?: number;
  trainingDurationMonths?: number;
  missionPeriod?: MissionPeriod;
  isCustomProgram?: boolean;
  customProgramBlocks?: CustomBlock[];
  competitionDate?: number;
  gymProfile?: 'commercial' | 'powerlifting' | 'home';
  injuryNoGoList?: string[];
  excludedMovements?: string[];
  hasFullGymAccess?: boolean;
  hasMedicalConditions?: boolean;
  medicalConditionDetails?: string;
  isExperiencedAthlete?: boolean;
  unit: Unit;
  language: Language;
  isVoiceActive: boolean;
  immersionMode: ImmersionMode;
  showExperimentalMenus: boolean;
  experimentalFeatures: boolean;
  dashboardWidgets?: WidgetId[];
  performanceWidgets?: PerformanceWidgetId[];
  programResetAt?: number;
  createdAt: number;
  role?: 'user' | 'admin' | 'engineer';
}

export type Theme = 'light' | 'dark' | 'fantasy';
export type LightColorScheme = 'default' | 'ocean' | 'neon' | 'solar' | 'monochrome';
export type FantasyColorScheme = 'hud' | 'sovereign' | 'stained' | 'helios' | 'blues' | 'grays' | 'peerless';

export const THEME_LOCKS: Record<string, string[]> = {
  untrained: ['sovereign', 'peerless', 'blues', 'grays', 'stained'],
  novice: ['sovereign', 'peerless', 'blues', 'grays', 'stained'],
  intermediate: ['sovereign', 'peerless'],
  advanced: ['sovereign'],
  elite: []
};

// Precise scheme mapping based on request
export const getLockedSchemes = (level: UserProfile['level'], role?: string) => {
  if (role === 'admin' || role === 'engineer') return [];
  
  switch (level) {
    case 'elite': return [];
    case 'advanced': return ['sovereign'];
    case 'intermediate': return ['sovereign', 'peerless'];
    case 'novice': return ['sovereign', 'peerless', 'blues', 'grays', 'stained'];
    case 'untrained': return ['sovereign', 'peerless', 'blues', 'grays', 'stained'];
    default: return [];
  }
};

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  lightColorScheme: LightColorScheme;
  setLightColorScheme: (scheme: LightColorScheme) => void;
  fantasyColorScheme: FantasyColorScheme;
  setFantasyColorScheme: (scheme: FantasyColorScheme) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  immersionMode: ImmersionMode;
  setImmersionMode: (mode: ImmersionMode) => void;
  showExperimentalMenus: boolean;
  setShowExperimentalMenus: (show: boolean) => void;
  experimentalFeatures: boolean;
  setExperimentalFeatures: (show: boolean) => void;
  dashboardWidgets: WidgetId[];
  setDashboardWidgets: (widgets: WidgetId[]) => Promise<void>;
  performanceWidgets: PerformanceWidgetId[];
  setPerformanceWidgets: (widgets: PerformanceWidgetId[]) => Promise<void>;
  lastVoiceCommand: { text: string; timestamp: number } | null;
  setLastVoiceCommand: (command: { text: string; timestamp: number } | null) => void;
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isProfileLoading: boolean;
  isCustomizeModalOpen: boolean;
  setIsCustomizeModalOpen: (open: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}



const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [unit, setUnitState] = useState<Unit>('imperial');
  const [theme, setThemeState] = useState<Theme>(
    (localStorage.getItem('volt_theme') as Theme) || 'dark'
  );
  const [lightColorScheme, setLightColorSchemeState] = useState<LightColorScheme>(
    (localStorage.getItem('volt_light_scheme') as LightColorScheme) || 'default'
  );
  const [fantasyColorScheme, setFantasyColorSchemeState] = useState<FantasyColorScheme>(
    (localStorage.getItem('volt_fantasy_scheme') as FantasyColorScheme) || 'hud'
  );
  const [isVoiceActive, setIsVoiceActiveState] = useState(false);
  const [immersionMode, setImmersionModeState] = useState<ImmersionMode>('immersive');
  const [showExperimentalMenus, setShowExperimentalMenusState] = useState(false);
  const [experimentalFeatures, setExperimentalFeaturesState] = useState(false);
  const [dashboardWidgets, setDashboardWidgetsState] = useState<WidgetId[]>(['recovery-analysis', 'pr', 'macros']);
  const [performanceWidgets, setPerformanceWidgetsState] = useState<PerformanceWidgetId[]>(['progression', 'volume-trend', 'growth', 'tactical']);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<{ text: string; timestamp: number } | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Sync with Firestore
  useEffect(() => {
    console.log("Auth: Setting up onAuthStateChanged listener in SettingsContext...");
    let unsubscribeFirestore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("Auth: State changed in SettingsContext. User:", user ? user.email : "NULL");
      
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = undefined;
      }

      if (user) {
        setIsProfileLoading(true);
        const userDocPath = `users/${user.uid}`;
        unsubscribeFirestore = onSnapshot(doc(db, userDocPath), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            
            // Auto-elevate admin for current user if not already set
            if ((user.email === 'qwerty4640@gmail.com' || user.email === 'admin@volt.com') && data.role !== 'admin') {
              updateDoc(doc(db, userDocPath), { role: 'admin' });
            }

            setProfile(data);
            if (data.language) setLanguageState(data.language as Language);
            if (data.unit) setUnitState(data.unit as Unit);
            if (data.isVoiceActive !== undefined) setIsVoiceActiveState(data.isVoiceActive);
            if (data.immersionMode) setImmersionModeState(data.immersionMode as ImmersionMode);
            if (data.showExperimentalMenus !== undefined) setShowExperimentalMenusState(data.showExperimentalMenus);
            if (data.experimentalFeatures !== undefined) setExperimentalFeaturesState(data.experimentalFeatures);
            if (data.dashboardWidgets) setDashboardWidgetsState(data.dashboardWidgets);
            if (data.performanceWidgets) setPerformanceWidgetsState(data.performanceWidgets);
            setIsProfileLoading(false);
          } else {
            // Initialize user profile
            console.log("Auth: Initializing new user profile in Firestore...");
            let pendingOnboarding: any = {};
            const savedOnboarding = localStorage.getItem('volt_pending_onboarding');
            if (savedOnboarding) {
              try {
                pendingOnboarding = JSON.parse(savedOnboarding);
                pendingOnboarding.onboardingCompleted = true;
              } catch(e) {
                console.error("Failed to parse pending onboarding data");
              }
            }

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              language: 'en', // Default to 'en' for new profiles
              unit: 'imperial', // Default to 'imperial' for new profiles
              isVoiceActive: false,
              immersionMode: 'immersive',
              showExperimentalMenus: false,
              experimentalFeatures: false,
              dashboardWidgets: ['recovery-analysis', 'pr', 'macros'],
              performanceWidgets: ['progression', 'volume-trend', 'growth', 'tactical'],
              onboardingCompleted: false, // fallback
              level: 'untrained',
              createdAt: Date.now(),
              role: (user.email === 'qwerty4640@gmail.com' || user.email === 'admin@volt.com') ? 'admin' : 'user',
              ...pendingOnboarding
            };
            setDoc(doc(db, userDocPath), newProfile).then(() => {
              if (savedOnboarding) localStorage.removeItem('volt_pending_onboarding');
              setIsProfileLoading(false);
            }).catch(err => {
              console.error("Auth: Failed to initialize user profile:", err);
              handleFirestoreError(err, OperationType.CREATE, userDocPath);
              setIsProfileLoading(false);
            });
          }
        }, (error) => {
          // Only report error if we still have a user (to avoid reporting permission errors on logout)
          if (auth.currentUser) {
            console.error("Auth: Firestore profile listener error:", error);
            handleFirestoreError(error, OperationType.GET, userDocPath);
          }
          setIsProfileLoading(false);
        });
      } else {
        const isGuestMode = localStorage.getItem('volt_guest_mode') === 'true';
        if (isGuestMode) {
          const ghostHistoryStr = localStorage.getItem('volt_ghost_history');
          const hasHistory = ghostHistoryStr && ghostHistoryStr.length > 5;
          const initialLevel = hasHistory ? 'intermediate' : 'untrained';

          const ghostProfile: UserProfile = {
            uid: 'guest',
            email: 'guest@example.com',
            displayName: 'Guest Athlete',
            language: 'en',
            unit: 'imperial',
            isVoiceActive: false,
            immersionMode: 'immersive',
            showExperimentalMenus: false,
            experimentalFeatures: false,
            dashboardWidgets: ['recovery-analysis', 'pr', 'macros'],
            performanceWidgets: ['progression', 'volume-trend', 'growth', 'tactical'],
            onboardingCompleted: false,
            level: initialLevel,
            trainingGoal: 'powerbuilding',
            weight: 175,
            createdAt: Date.now(),
            role: 'user'
          };
          const savedGhost = localStorage.getItem('volt_ghost_profile');
          if (savedGhost) {
            try {
               setProfile({...ghostProfile, ...JSON.parse(savedGhost)});
            } catch(e) {
               setProfile(ghostProfile);
            }
          } else {
            setProfile(ghostProfile);
          }
        } else {
          setProfile(null);
        }
        setIsProfileLoading(false);
      }
    }, (error) => {
      console.error("Auth: onAuthStateChanged error in SettingsContext:", error);
      setIsProfileLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []); // Removed 'language' dependency

  // Background sync for strength level - ONLY auto-elevate
  useEffect(() => {
    if (profile && auth.currentUser) {
      const calculatedLevel = calculateTier(
        profile.squatPR || 0,
        profile.benchPR || 0,
        profile.deadliftPR || 0,
        profile.weight || 0,
        profile.gender || 'male'
      );

      const tierOrder = ['untrained', 'novice', 'intermediate', 'advanced', 'elite'];
      const currentIdx = tierOrder.indexOf(profile.level);
      const calcIdx = tierOrder.indexOf(calculatedLevel);

      if (calcIdx > currentIdx) {
        console.log(`Sync: Auto-elevating level from ${profile.level} to ${calculatedLevel}`);
        updateProfile({ level: calculatedLevel as any });
      }
    }
  }, [profile?.squatPR, profile?.benchPR, profile?.deadliftPR, profile?.weight, profile?.gender, profile?.level]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { language: lang }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    }
  };

  const setUnit = async (u: Unit) => {
    const oldUnit = unit;
    setUnitState(u);
    
    if (auth.currentUser && oldUnit !== u) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      const weightFactor = u === 'metric' ? 1 / 2.20462 : 2.20462;
      const heightFactor = u === 'metric' ? 2.54 : 1 / 2.54;

      // Optimistic update for instantaneous UI feedback
      if (profile) {
        const updatedProfile = {
          ...profile,
          unit: u,
          squatPR: profile.squatPR ? Math.round(profile.squatPR * weightFactor) : 0,
          benchPR: profile.benchPR ? Math.round(profile.benchPR * weightFactor) : 0,
          deadliftPR: profile.deadliftPR ? Math.round(profile.deadliftPR * weightFactor) : 0,
          weight: profile.weight ? Math.round(profile.weight * weightFactor) : 0,
          height: profile.height ? Math.round(profile.height * heightFactor) : 0,
        };
        setProfile(updatedProfile);
      }

      try {
        // Update profile document
        const profileRef = doc(db, userDocPath);
        const profileUpdate = profile ? {
          unit: u,
          squatPR: profile.squatPR ? Math.round(profile.squatPR * weightFactor) : 0,
          benchPR: profile.benchPR ? Math.round(profile.benchPR * weightFactor) : 0,
          deadliftPR: profile.deadliftPR ? Math.round(profile.deadliftPR * weightFactor) : 0,
          weight: profile.weight ? Math.round(profile.weight * weightFactor) : 0,
          height: profile.height ? Math.round(profile.height * heightFactor) : 0,
        } : { unit: u };
        
        await setDoc(profileRef, profileUpdate, { merge: true });

        // Update all workout history documents in batches of 500
        const workoutsRef = collection(db, `${userDocPath}/workouts`);
        const workoutsSnap = await getDocs(workoutsRef);
        
        const docs = workoutsSnap.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          
          chunk.forEach(workoutDoc => {
            const data = workoutDoc.data();
            if (data.exercises) {
              const updatedExercises = data.exercises.map((ex: any) => ({
                ...ex,
                sets: ex.sets.map((set: any) => ({
                  ...set,
                  weight: set.weight ? String(Math.round(parseFloat(set.weight) * weightFactor)) : ''
                }))
              }));
              batch.update(workoutDoc.ref, { exercises: updatedExercises });
            }
          });
          
          await batch.commit();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    }
  };

  const setIsVoiceActive = async (active: boolean) => {
    setIsVoiceActiveState(active);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { isVoiceActive: active }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    }
  };

  const setImmersionMode = async (mode: ImmersionMode) => {
    setImmersionModeState(mode);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { immersionMode: mode }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    }
  };

  const setShowExperimentalMenus = async (show: boolean) => {
    setShowExperimentalMenusState(show);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { showExperimentalMenus: show }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    }
  };

  const setExperimentalFeatures = async (show: boolean) => {
    setExperimentalFeaturesState(show);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { experimentalFeatures: show }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    }
  };

  const setDashboardWidgets = async (widgets: WidgetId[]) => {
    setDashboardWidgetsState(widgets);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { dashboardWidgets: widgets }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    } else {
      if (profile) {
        const updated = { ...profile, dashboardWidgets: widgets };
        setProfile(updated);
        localStorage.setItem('volt_ghost_profile', JSON.stringify(updated));
      }
    }
  };

  const setPerformanceWidgets = async (widgets: PerformanceWidgetId[]) => {
    setPerformanceWidgetsState(widgets);
    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), { performanceWidgets: widgets }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    } else {
      if (profile) {
        const updated = { ...profile, performanceWidgets: widgets };
        setProfile(updated);
        localStorage.setItem('volt_ghost_profile', JSON.stringify(updated));
      }
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    // Dynamically route dashboard widgets if trainingGoal changes
    if (data.trainingGoal) {
      if (data.trainingGoal === 'longevity') {
        data.performanceWidgets = ['mobility-matrix', 'joint-stress', 'volume-trend', 'progression'];
      } else if (data.trainingGoal === 'tactical') {
        data.performanceWidgets = ['conditioning-tracker', 'tactical', 'progression', 'volume-trend'];
      } else {
        // Default strength/hypertrophy goals
        data.performanceWidgets = ['progression', 'volume-trend', 'growth', 'tactical'];
      }
      setPerformanceWidgetsState(data.performanceWidgets);
    }

    if (auth.currentUser) {
      const userDocPath = `users/${auth.currentUser.uid}`;
      try {
        await setDoc(doc(db, userDocPath), data, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      }
    } else {
      if (profile) {
        const updated = { ...profile, ...data };
        setProfile(updated);
        localStorage.setItem('volt_ghost_profile', JSON.stringify(updated));
      }
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('volt_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const setLightColorScheme = (sc: LightColorScheme) => {
    setLightColorSchemeState(sc);
    localStorage.setItem('volt_light_scheme', sc);
    document.documentElement.setAttribute('data-light-scheme', sc);
  };

  const setFantasyColorScheme = (sc: FantasyColorScheme) => {
    setFantasyColorSchemeState(sc);
    localStorage.setItem('volt_fantasy_scheme', sc);
    document.documentElement.setAttribute('data-fantasy-scheme', sc);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-light-scheme', lightColorScheme);
    document.documentElement.setAttribute('data-fantasy-scheme', fantasyColorScheme);
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => getTranslation(language as SupportedLanguage, key, params);

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      unit, setUnit, 
      theme, setTheme,
      lightColorScheme, setLightColorScheme,
      fantasyColorScheme, setFantasyColorScheme,
      isVoiceActive, setIsVoiceActive,
      immersionMode, setImmersionMode,
      showExperimentalMenus, setShowExperimentalMenus,
      experimentalFeatures, setExperimentalFeatures,
      dashboardWidgets, setDashboardWidgets,
      performanceWidgets, setPerformanceWidgets,
      lastVoiceCommand, setLastVoiceCommand,
      isCustomizeModalOpen, setIsCustomizeModalOpen,
      profile, updateProfile,
      isProfileLoading,
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
