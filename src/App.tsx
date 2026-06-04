import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ShieldAlert, 
  BarChart3, 
  Trophy, 
  Zap, 
  Settings, 
  Bell, 
  User,
  Power,
  Dumbbell,
  History,
  Box,
  Mic,
  MicOff,
  Volume2,
  Flame,
  Skull,
  Medal,
  LogIn,
  LogOut,
  Search,
  Loader2,
  Lock,
  Mail,
  UserPlus,
  ChevronLeft,
  Eye,
  EyeOff,
  X,
  SunMoon,
  Scale,
  Target,
  BookSearch
} from 'lucide-react';
import { DeploymentIcon } from './components/DeploymentIcon';
import { VanguardLogo } from './components/VanguardLogo';
import { MissionIcon } from './components/MissionIcon';
import { ViewType, NavItem, ImmersionMode } from './types';
import { AnalysisView } from './components/AnalysisView';
import { SafetyHUD } from './components/SafetyHUD';
import { AnalyticsView } from './components/AnalyticsView';
import { FitnessTestView } from './components/FitnessTestView';
import { getFitnessTestInfo } from './utils/fitnessTestUtils';
import { SportShoeIcon } from './components/SportShoeIcon';
import { TrainingView } from './components/TrainingView';
import { LibraryView } from './components/LibraryView';
import { BerserkerHUD } from './components/BerserkerHUD';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { DeploymentView } from './components/DeploymentView';
import { UpcomingMissionsView } from './components/UpcomingMissionsView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PageHeader } from './components/PageHeader';
import { WelcomeCarousel } from './components/WelcomeCarousel';
import { WorkoutLog } from './components/WorkoutLog';
import { PostWorkoutSummary } from './components/PostWorkoutSummary';
import { WorkoutHistory } from './components/WorkoutHistory';
import { NonProgramActivityModal } from './components/NonProgramActivityModal';
import { FloatingRestTimer } from './components/FloatingRestTimer';
import { cn } from './lib/utils';
import { ALL_WIDGETS, ALL_PERFORMANCE_WIDGETS } from './constants/widgets';

import { 
  useSettings 
} from './contexts/SettingsContext';
import { WorkoutProvider, useWorkout } from './contexts/WorkoutContext';
import { auth, signInWithGoogle, logout, signInWithEmail, signUpWithEmail } from './firebase';
import { calculateTier } from './lib/strength';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { ReadinessCheck } from './components/ReadinessCheck';
import { ReflectionModal } from './components/ReflectionModal';
import { InstallPrompt } from './components/InstallPrompt';
import { PwaUpdater } from './components/PwaUpdater';
import { UserTour } from './components/UserTour';
import { DataRedundancyManager } from './components/DataRedundancyManager';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ReadinessIcon = ({ size = 24, strokeWidth = 2, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-battery-charging", className)}
  >
    <path d="m11 7-3 5h4l-3 5"/>
    <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935"/>
    <path d="M22 14v-4"/>
    <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { id: 'analysis', label: 'nav.dashboard', icon: ReadinessIcon },
  { id: 'analytics', label: 'nav.analytics', icon: BarChart3 },
  { id: 'training', label: 'nav.training', icon: DeploymentIcon },
  { id: 'deployment', label: 'nav.deployment', icon: MissionIcon },
  { id: 'fitness-test', label: 'nav.fitnessTest', icon: SportShoeIcon, isExperimental: true },
  { id: 'library', label: 'nav.library', icon: BookSearch },
  { id: 'settings', label: 'nav.settings', icon: Settings },
];

const SHOW_EXPERIMENTAL_FEATURES = false;

export default function App() {
  return (
    <WorkoutProvider>
      <DataRedundancyManager />
      <PwaUpdater />
      <AppContent />
    </WorkoutProvider>
  );
}

function AppContent() {
  const { 
    t, language, setLanguage, 
    isVoiceActive, setIsVoiceActive, 
    immersionMode, setImmersionMode, 
    isHeaderHidden,
    showExperimentalMenus, 
    experimentalFeatures,
    profile, updateProfile, isProfileLoading, 
    setLastVoiceCommand, lastVoiceCommand,
    theme
  } = useSettings();


  const { 
    getCalibrationStatus,
    currentSession, 
    startNewSession, 
    completeSession, 
    discardSession, 
    history, 
    mockWorkoutCount, 
    isLoading: isWorkoutLoading,
    pendingReflection,
    setPendingReflection,
    saveReflection,
    getNextWorkoutTemplate
  } = useWorkout();
  
  const nextWorkoutForTest = getNextWorkoutTemplate();
  
  const calibration = getCalibrationStatus();
  const readinessValue = calibration.readiness;
  const isCriticalReadiness = readinessValue < 20;

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSafetyActive, setIsSafetyActive] = useState(false);
  const [preAuthStep, setPreAuthStep] = useState<'carousel' | 'questionnaire' | 'auth'>('carousel');
  const [showPassword, setShowPassword] = useState(false);
  
  // Lock orientation to portrait
  useEffect(() => {
    const orientation = screen.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      orientation.lock('portrait').catch((err: any) => {
        console.warn('Orientation lock failed:', err);
      });
    }
    
    return () => {
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      }
    };
  }, []);
  
  const [hasAcknowledgedCritical, setHasAcknowledgedCritical] = useState(false);
  
  useEffect(() => {
    if (isCriticalReadiness) {
      if (!isSafetyActive && !hasAcknowledgedCritical) {
        setIsSafetyActive(true);
      }
    } else {
      // Reset acknowledgement when state is no longer critical
      if (hasAcknowledgedCritical) {
        setHasAcknowledgedCritical(false);
      }
    }
  }, [isCriticalReadiness, isSafetyActive, hasAcknowledgedCritical]);
  
  const [activeView, setActiveView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volt_active_view');
      const validViews: ViewType[] = ['analysis', 'training', 'analytics', 'settings', 'profile', 'workout-log', 'post-workout', 'berserker', 'workout-history', 'upcoming-missions', 'fitness-test'];
      if (saved && validViews.includes(saved as ViewType)) {
        return saved as ViewType;
      }
    }
    return 'analysis';
  });

  const [lastView, setLastView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volt_last_main_view');
      const mainViews: ViewType[] = ['analysis', 'training', 'analytics', 'settings', 'profile', 'deployment', 'fitness-test'];
      if (saved && mainViews.includes(saved as ViewType)) {
        return saved as ViewType;
      }
    }
    return 'analysis';
  });

  useEffect(() => {
    localStorage.setItem('volt_active_view', activeView);
    localStorage.setItem('volt_last_main_view', lastView);
    
    // Track the last "main" view to support intelligent back-navigation from sub-views like History
    const mainViews: ViewType[] = ['analysis', 'training', 'analytics', 'settings', 'profile', 'deployment', 'fitness-test'];
    if (mainViews.includes(activeView)) {
      setLastView(activeView);
    }
  }, [activeView, lastView]);

  const [selectedHistoryWorkoutId, setSelectedHistoryWorkoutId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLifting, setIsLifting] = useState(false);
  const [isCompetitionActive, setIsCompetitionActive] = useState(false);

  useEffect(() => {
    if (activeView !== 'fitness-test') {
      setIsCompetitionActive(false);
    }
  }, [activeView]);

  const [viewStateOverride, setViewStateOverride] = useState<{view: ViewType, state: any} | null>(null);

  const navigateTo = (view: ViewType, state?: any) => {
    if (state) {
      setViewStateOverride({ view, state });
    } else {
      setViewStateOverride(null);
    }
    setActiveView(view);
    setSearchQuery('');
  };

  const getSearchResults = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    const results: any[] = [];
    const nextWorkoutForTest = getNextWorkoutTemplate();
    const fitnessTestState = getFitnessTestInfo(profile, nextWorkoutForTest?.title);
    const isFitnessTestUnlocked = showExperimentalMenus && fitnessTestState.isUnlocked;

    // 1. Check NAV_ITEMS (excluding locked views)
    NAV_ITEMS.forEach(item => {
      if (!showExperimentalMenus && item.isExperimental) return;
      if (item.id === 'fitness-test' && !isFitnessTestUnlocked) return;

      const label = t(item.label).toLowerCase();
      if (label.includes(query)) {
        results.push({ 
          id: item.id, 
          type: 'navigation', 
          label: t(item.label), 
          icon: item.icon,
          onSelect: () => navigateTo(item.id)
        });
      }
    });

    // 2. Check Deep Features (structured as Parent > Feature)
    const deepFeatures = [
      { id: 'phases', label: 'Operational Phases', parentKey: 'nav.training', alias: ['phases', 'blocks', 'upcoming', 'strategy'], view: 'upcoming-missions', state: { level: 'phases', blockIndex: 0, phaseIndex: null }, icon: MissionIcon },
      { id: 'history', label: 'Past Missions', parentKey: 'nav.training', alias: ['history', 'logs', 'past'], view: 'workout-history', icon: History },
    ];

    deepFeatures.forEach(feature => {
      const parentLabel = t(feature.parentKey);
      const displayLabel = `${parentLabel} > ${feature.label}`;
      const match = feature.label.toLowerCase().includes(query) || 
                    displayLabel.toLowerCase().includes(query) ||
                    feature.alias.some(a => a.toLowerCase().includes(query));
      
      if (match && !results.find(r => r.id === feature.id)) {
        results.push({
          id: feature.id,
          type: 'feature',
          label: displayLabel,
          icon: feature.icon,
          onSelect: () => {
            if (feature.view) navigateTo(feature.view as any, feature.state);
            setSearchQuery('');
          }
        });
      }
    });

    // 3. Check All Widgets on Dashboard (Readiness) Page
    ALL_WIDGETS.forEach(widget => {
      const parentLabel = t('nav.dashboard'); // "Readiness"
      const widgetLabel = t(widget.label);
      const displayLabel = `${parentLabel} > ${widgetLabel}`;
      
      const match = widgetLabel.toLowerCase().includes(query) || 
                    displayLabel.toLowerCase().includes(query) ||
                    widget.id.toLowerCase().includes(query);
                    
      if (match && !results.find(r => r.id === `widget-${widget.id}`)) {
        results.push({
          id: `widget-${widget.id}`,
          type: 'widget',
          label: displayLabel,
          icon: widget.icon,
          onSelect: () => {
            navigateTo('analysis');
          }
        });
      }
    });

    // 4. Check All Widgets on Performance (Analytics) Page
    ALL_PERFORMANCE_WIDGETS.forEach(widget => {
      const parentLabel = t('nav.analytics'); // "Performance"
      const widgetLabel = t(widget.label);
      const displayLabel = `${parentLabel} > ${widgetLabel}`;
      
      const match = widgetLabel.toLowerCase().includes(query) || 
                    displayLabel.toLowerCase().includes(query) ||
                    widget.id.toLowerCase().includes(query);
                    
      if (match && !results.find(r => r.id === `widget-${widget.id}`)) {
        results.push({
          id: `widget-${widget.id}`,
          type: 'widget',
          label: displayLabel,
          icon: widget.icon,
          onSelect: () => {
            navigateTo('analytics');
          }
        });
      }
    });

    // 5. Check All Settings Page Subsections
    const settingsWidgets = [
      { id: 'settings-visual', label: 'Visual Output', parentKey: 'nav.settings', alias: ['theme', 'dark mode', 'color scheme', 'visual'], view: 'settings', icon: SunMoon },
      { id: 'settings-unit', label: t('settings.unit') || 'Unit of Measure', parentKey: 'nav.settings', alias: ['unit', 'unit of measure', 'metric', 'imperial', 'kg', 'lbs'], view: 'settings', icon: Scale },
      { id: 'settings-program', label: t('settings.programManagement') || 'Program Management', parentKey: 'nav.settings', alias: ['reset', 'program', 'schedule', 'program management'], view: 'settings', icon: Target },
      { id: 'settings-system', label: t('settings.systemOps') || 'System Operations', parentKey: 'nav.settings', alias: ['operations', 'induction', 'session', 'sign out', 'system operations'], view: 'settings', icon: Settings },
      { id: 'settings-profile', label: 'Operator Profile', parentKey: 'nav.settings', alias: ['profile', 'biometrics', 'stats', 'operator profile'], view: 'profile', icon: User },
    ];

    settingsWidgets.forEach(widget => {
      const parentLabel = t(widget.parentKey); // "Settings"
      const displayLabel = `${parentLabel} > ${widget.label}`;
      
      const match = widget.label.toLowerCase().includes(query) || 
                    displayLabel.toLowerCase().includes(query) ||
                    widget.alias.some(a => a.toLowerCase().includes(query));
                    
      if (match && !results.find(r => r.id === widget.id)) {
        results.push({
          id: widget.id,
          type: 'widget',
          label: displayLabel,
          icon: widget.icon,
          onSelect: () => {
            navigateTo(widget.view as any);
          }
        });
      }
    });

    return results;
  };
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [sessionRpe, setSessionRpe] = useState(8.0);
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const mainRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeView]);
  
  useEffect(() => {
    if (currentSession) {
      setIsLifting(true);
    }
  }, [currentSession]);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);

  useEffect(() => {
    console.log("Auth: Initializing App auth listeners...");
    
    // Check if user is already logged in (persistence check)
    if (auth.currentUser) {
      console.log("Auth: Found existing user session:", auth.currentUser.email);
      setUser(auth.currentUser);
      setIsAuthChecking(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth: Global state changed. User:", user ? user.email : "NULL");
      setUser(user);
      setIsAuthChecking(false);
      
      // If user logs out, reset the onboarding view to carousel
      if (!user) {
        setPreAuthStep('carousel');
      }
    });
    
    return () => unsubscribe();
  }, []);

  const getLifterLevel = () => {
    // If mockWorkoutCount is set, it MUST take precedence for QA/testing
    if (mockWorkoutCount !== null) {
      if (mockWorkoutCount <= 5) return { label: 'nav.untrained', tier: 'untrained' };
      if (mockWorkoutCount <= 15) return { label: 'nav.novice', tier: 'novice' };
      if (mockWorkoutCount <= 30) return { label: 'nav.intermediate', tier: 'intermediate' };
      if (mockWorkoutCount <= 50) return { label: 'nav.advanced', tier: 'advanced' };
      return { label: 'nav.elite', tier: 'elite' };
    }

    // Otherwise, calculate dynamic tier from PRs
    if (profile) {
      const dynamicTier = calculateTier(
        profile.squatPR || 0,
        profile.benchPR || 0,
        profile.deadliftPR || 0,
        profile.weight || 0,
        profile.gender || 'male'
      );
      return { label: `nav.${dynamicTier}`, tier: dynamicTier };
    }

    // Fallback to history count
    const count = history?.length || 0;
    if (count <= 5) return { label: 'nav.untrained', tier: 'untrained' };
    if (count <= 15) return { label: 'nav.novice', tier: 'novice' };
    if (count <= 30) return { label: 'nav.intermediate', tier: 'intermediate' };
    if (count <= 50) return { label: 'nav.advanced', tier: 'advanced' };
    return { label: 'nav.elite', tier: 'elite' };
  };

  const lifterLevel = getLifterLevel();

  useEffect(() => {
    document.documentElement.setAttribute('data-tier', lifterLevel.tier);
  }, [lifterLevel.tier]);

  const getTrophyStyle = (tier: string) => {
    switch (tier) {
      case 'untrained': 
      case 'novice': 
        return { 
          icon: Medal, 
          color: 'text-volt', 
          glow: '', 
          animation: '',
          bgGlow: 'bg-volt'
        };
      case 'intermediate': 
        return { 
          icon: Trophy, 
          color: 'text-white', 
          glow: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]', 
          animation: '',
          bgGlow: 'bg-white'
        };
      case 'advanced': 
        return { 
          icon: Trophy, 
          color: 'text-tier-advanced', 
          glow: 'drop-shadow-[0_0_15px_var(--theme-tier-advanced)]', 
          animation: '',
          bgGlow: 'bg-tier-advanced'
        };
      case 'elite': 
        return { 
          icon: Skull, 
          color: 'text-tier-elite', 
          glow: 'drop-shadow-[0_0_20px_var(--theme-tier-elite)]', 
          animation: '',
          bgGlow: 'bg-tier-elite'
        };
      default: 
        return { 
          icon: Trophy, 
          color: 'text-volt', 
          glow: '', 
          animation: '',
          bgGlow: 'bg-volt'
        };
    }
  };

  const trophyStyle = getTrophyStyle(lifterLevel.tier);

  // Global Voice Recognition Logic
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      if (!event.results || event.results.length === 0) return;
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      setVoiceFeedback(transcript);
      setLastVoiceCommand({ text: transcript, timestamp: Date.now() });
      setTimeout(() => setVoiceFeedback(null), 3000);

      // Global Navigation Commands
      if (transcript.includes('go to dashboard') || transcript.includes('show dashboard')) {
        setActiveView('analysis');
      } else if (transcript.includes('go to fitness test') || transcript.includes('show fitness test') || transcript.includes('test')) {
        setActiveView('fitness-test');
      } else if (transcript.includes('go to analytics') || transcript.includes('show analytics')) {
        setActiveView('analytics');
      } else if (transcript.includes('go to training') || transcript.includes('show training') || transcript.includes('workout')) {
        setActiveView('training');
      } else if (transcript.includes('arnold') || transcript.includes('classic') || transcript.includes('gym') || transcript.includes('uspl') || transcript.includes('nationals') || transcript.includes('fitness test') || transcript.includes('desert') || transcript.includes('dust bowl') || transcript.includes('dust') || transcript.includes('space') || transcript.includes('lunar') || transcript.includes('station')) {
        setActiveView('fitness-test');
      } else if (transcript.includes('detect lift') || transcript.includes('berserker')) {
        setIsLifting(true);
        setActiveView('berserker');
      } else if (transcript.includes('simulate danger')) {
        setIsSafetyActive(true);
      } else if (transcript.includes('ar mode')) {
        setImmersionMode('ar');
      } else if (transcript.includes('immersive mode')) {
        setImmersionMode('immersive');
      } else if (transcript.includes('voice off')) {
        setIsVoiceActive(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsVoiceActive(false);
      }
    };

    recognition.onend = () => {
      if (isVoiceActive) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    if (isVoiceActive && experimentalFeatures) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => recognition.stop();
  }, [isVoiceActive]);

  const [isLargeScreen, setIsLargeScreen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isAuthChecking || (user && (isProfileLoading || isWorkoutLoading))) {
    return (
      <div className="h-screen w-screen bg-void flex flex-col items-center justify-center gap-6">
        <Loader2 className="text-volt animate-spin" size={48} />
        <div className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-volt animate-pulse">
          {t('app.loading')}...
        </div>
      </div>
    );
  }

  if (!user) {
    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isEmailAuthLoading || isGoogleAuthLoading) return;
      
      console.log("Auth: Starting Email/Password flow. Mode:", isSigningUp ? "Sign Up" : "Sign In");
      setAuthError(null);
      setIsEmailAuthLoading(true);
      try {
        if (isSigningUp) {
          // Frontend validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error(t('auth.invalidEmail'));
          }
          if (password !== confirmPassword) {
            throw new Error(t('auth.passwordsMismatch'));
          }
          if (password.length < 6) {
            throw new Error(t('auth.passwordTooShort'));
          }
          await signUpWithEmail(email, password);
          setActiveView('analysis');
        } else {
          await signInWithEmail(email, password);
          setActiveView('analysis');
        }
      } catch (error: any) {
        console.error("Auth: Email/Password flow failed:", error);
        setAuthError(error.message || t('auth.failed'));
      } finally {
        setIsEmailAuthLoading(false);
      }
    };

    const handleGoogleSignIn = async () => {
      if (isEmailAuthLoading || isGoogleAuthLoading) return;

      setAuthError(null);
      setIsGoogleAuthLoading(true);
      console.log("SSO: Button clicked, starting flow...");
      try {
        const user = await signInWithGoogle();
        if (user) {
          console.log("SSO: Flow completed, user returned:", user.email);
          // Manually update state just in case the listener is slow
          setUser(user);
          setActiveView('analysis');
        } else {
          console.warn("SSO: Flow completed but no user returned");
        }
      } catch (error: any) {
        console.error("SSO: Flow failed with error:", error);
        // Ignore errors where the user cancelled or closed the popup
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          return;
        }

        if (error.code === 'auth/unauthorized-domain') {
          setAuthError(t('auth.googleUnauthorized'));
        } else {
          setAuthError(`${error.code}: ${error.message || t('auth.googleFailed')}`);
        }
      } finally {
        setIsGoogleAuthLoading(false);
      }
    };

    const renderAuthForm = () => (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full flex flex-col items-center text-center ${
          isLargeScreen 
            ? 'py-12 px-8 md:px-12 bg-void' 
            : 'my-auto max-w-md glass-panel px-4 py-10 md:p-10 border border-white/10'
        }`}
      >
        <VanguardLogo theme={theme} className={`mb-8 ${isLargeScreen ? 'w-[60%]' : ''}`} />
        <div className="w-full space-y-6">
          <form onSubmit={handleAuth} className="w-full space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-volt transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder') || "EMAIL ADDRESS"}
                  required
                  className="w-full bg-zinc-900/50 border border-white/10 py-4 pl-12 pr-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt/50 transition-all"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-volt transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder') || "PASSWORD"}
                  required
                  className="w-full bg-zinc-900/50 border border-white/10 py-4 pl-12 pr-12 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-volt transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isSigningUp && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-volt transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder') || "CONFIRM PASSWORD"}
                    required
                    className="w-full bg-zinc-900/50 border border-white/10 py-4 pl-12 pr-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt/50 transition-all"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isEmailAuthLoading || isGoogleAuthLoading}
              className="w-full btn-primary py-4 text-xs uppercase font-black tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isEmailAuthLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoaWVsZC1jaGVjay1pY29uIGx1Y2lkZS1zaGllbGQtY2hlY2siPjxwYXRoIGQ9Ik0yMCAxM2MwIDUtMy41IDcuNS03LjY2IDguOTVhMSAxIDAgMCAxLS42Ny0uMDFDNy41IDIwLjUgNCAxOCA0IDEzVjZhMSAxIDAgMCAxIDEtMWMyIDAgNC41LTEuMiA2LjI0LTIuNzJhMS4xNyAxLjE3IDAgMCAxIDEuNTIgMEMxNC41MSAzLjgxIDE3IDUgMTkgNWExIDEgMCAwIDEgMSAxeiIvPjxwYXRoIGQ9Im05IDEyIDIgMiA0LTQiLz48L3N2Zz4=" 
                    alt="Secure" 
                    className="size-4" 
                  />
                  {isSigningUp ? t('auth.signUp') || "INITIALIZE DEPLOYMENT" : t('auth.signIn') || "AUTHORIZE LOGIN"}
                </>
              )}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]">
              <span className="bg-void px-4 text-zinc-600 font-sans">{t('auth.orSecureSso') || "OR SECURE SSO"}</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleAuthLoading || isEmailAuthLoading}
            className={
              isLargeScreen 
                ? "w-full btn-secondary py-4" 
                : "w-full flex items-center justify-center gap-4 bg-white/5 text-white border border-white/10 py-4 font-sans font-black uppercase tracking-widest hover:bg-white hover:text-void transition-all duration-300 disabled:opacity-50"
            }
          >
            {isGoogleAuthLoading ? (
              <Loader2 className="animate-spin text-white" size={18} />
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{t('auth.signInWithGoogle')}</span>
              </div>
            )}
          </button>

          {authError && (
            <p className="text-crimson text-[10px] font-bold uppercase tracking-widest animate-shake">
              {authError}
            </p>
          )}

          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={() => setIsSigningUp(!isSigningUp)}
              className="text-[10px] font-bold uppercase tracking-widest text-volt hover:underline"
            >
              {isSigningUp ? t('auth.alreadyHaveAccount') || "ALREADY REGISTERED? LOG IN" : t('auth.noAccount') || "NO DEPLOYMENT ID? REGISTER"}
            </button>

            {!isLargeScreen && (
              <button 
                type="button"
                onClick={() => setPreAuthStep('carousel')}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                <ChevronLeft size={12} /> {t('auth.backToBriefing') || "BACK TO BRIEFING"}
              </button>
            )}
          </div>
        </div>
        <p className="mt-12 text-[8px] text-zinc-600 font-medium leading-relaxed max-w-[280px] uppercase tracking-[0.2em]">
          {t('auth.privacyNotice')}
        </p>
      </motion.div>
    );

    if (isLargeScreen) {
      return (
        <div className="h-screen w-screen bg-void flex overflow-hidden">
          {/* Left Side: Carousel */}
          <div className="flex-1 hidden lg:block overflow-hidden relative border-r border-white/5">
            <WelcomeCarousel 
              hideLogo={true} 
              isRelative={true}
              onSignUp={() => {
                setIsSigningUp(true);
                setPreAuthStep('questionnaire');
              }}
              onSignIn={() => {
                setIsSigningUp(false);
                setPreAuthStep('auth');
              }}
            />
          </div>

          {/* Right Side: Auth or Onboarding */}
          <div className="w-full lg:w-[450px] xl:w-[500px] h-screen overflow-y-auto custom-scrollbar relative bg-void flex flex-col">
            {preAuthStep === 'questionnaire' ? (
              <OnboardingFlow 
                onBack={() => setPreAuthStep('carousel')}
                onCompleteHandler={(data) => {
                  localStorage.setItem('volt_pending_onboarding', JSON.stringify(data));
                  setIsSigningUp(true);
                  setPreAuthStep('auth');
                }}
              />
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center ${!isLargeScreen ? 'p-4 md:p-8' : ''}`}>
                {renderAuthForm()}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (preAuthStep === 'carousel') {
      return (
        <WelcomeCarousel
          onSignUp={() => {
            setIsSigningUp(true);
            setPreAuthStep('questionnaire');
          }}
          onSignIn={() => {
            setIsSigningUp(false);
            setPreAuthStep('auth');
          }}
        />
      );
    }

    if (preAuthStep === 'questionnaire') {
      return (
        <OnboardingFlow 
          onBack={() => setPreAuthStep('carousel')}
          onCompleteHandler={(data) => {
            localStorage.setItem('volt_pending_onboarding', JSON.stringify(data));
            setIsSigningUp(true);
            setPreAuthStep('auth');
          }}
        />
      );
    }

    return (
      <div className="h-screen w-screen bg-void flex justify-center p-2 md:p-8 relative overflow-y-auto custom-scrollbar">
        {renderAuthForm()}
        
        {/* Background Ambience */}
        <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-volt/5 blur-[120px] pointer-events-none -z-10" />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'analysis': return <AnalysisView 
        isLifting={isLifting} 
        onContinueSession={() => {
          if (!currentSession) {
            setShowReadinessCheck(true);
          } else {
            setIsLifting(true);
            const exercises = currentSession.exercises || [];
            const allCompleted = exercises.length > 0 && 
                               exercises.every(ex => (ex.sets || []).every(s => s.isCompleted));
            setActiveView(allCompleted ? 'post-workout' : 'workout-log');
          }
        }} 
        onViewBriefing={() => setActiveView('training')}
        onViewHistory={(sessionId) => {
          setLastView('analysis');
          setSelectedHistoryWorkoutId(sessionId || null);
          setActiveView('workout-history');
        }}
      />;
      case 'workout-history': return <WorkoutHistory 
        onBack={() => {
          setSelectedHistoryWorkoutId(null);
          setActiveView(lastView);
        }} 
        initialSelectedWorkoutId={selectedHistoryWorkoutId}
      />;
      case 'training': return <TrainingView 
        isLifting={isLifting}
        onViewHistory={(sessionId) => {
          setLastView('training');
          setSelectedHistoryWorkoutId(sessionId || null);
          setActiveView('workout-history');
        }}
        onAddActivity={() => setIsRecoveryModalOpen(true)}
        onViewUpcomingMissions={() => setActiveView('upcoming-missions')}
        onNavigateToFitnessTest={() => setActiveView('fitness-test')}
        onStartCustomSession={() => {
          setIsLifting(true);
          setActiveView('workout-log');
        }}
        onContinueSession={() => {
          if (!currentSession) {
            setShowReadinessCheck(true);
          } else {
            setIsLifting(true);
            const exercises = currentSession.exercises || [];
            const allCompleted = exercises.length > 0 && 
                               exercises.every(ex => (ex.sets || []).every(s => s.isCompleted));
            setActiveView(allCompleted ? 'post-workout' : 'workout-log');
          }
        }} 
      />;
      case 'analytics': return <AnalyticsView />;
      case 'library': return <LibraryView />;
      case 'deployment': return <DeploymentView />;
      case 'upcoming-missions': return <UpcomingMissionsView 
        onBack={() => {
          setViewStateOverride(null);
          setActiveView('training');
        }} 
        initialViewState={viewStateOverride?.view === 'upcoming-missions' ? viewStateOverride.state : undefined}
      />;
      case 'settings': return <SettingsView onExit={() => setIsExitModalOpen(true)} onNavigateToProfile={() => setActiveView('profile')} />;
      case 'fitness-test': return <FitnessTestView 
        immersionMode={immersionMode}
        isVoiceActive={isVoiceActive}
        lastVoiceCommand={lastVoiceCommand}
        onReadyChange={setIsCompetitionActive}
      />;
      case 'profile': return <ProfileView onBack={() => setActiveView('settings')} />;
      case 'workout-log': return <WorkoutLog 
        onBack={() => setActiveView('training')}
        onComplete={(avgRpe) => {
          setSessionRpe(avgRpe);
          setActiveView('post-workout');
        }}
        onEndSession={async () => {
          try {
            await discardSession();
          } finally {
            setIsLifting(false);
            setActiveView('training');
          }
        }}
      />;
      case 'post-workout': return <PostWorkoutSummary 
        initialRpe={sessionRpe}
        onFinish={async (data) => {
          try {
            await completeSession(data);
          } catch (e) {
            console.error("Failed to complete session:", e);
          } finally {
            setIsLifting(false);
            setActiveView('analysis');
          }
        }}
      />;
      case 'berserker': return <BerserkerHUD 
        viewType="training"
        onAddActivity={() => setIsRecoveryModalOpen(true)}
        onComplete={() => {
        setIsLifting(false);
        setActiveView('analysis');
      }} />;
      default: return <AnalysisView 
        isLifting={isLifting} 
        onContinueSession={() => {
          setActiveView('workout-log');
        }} 
        onViewBriefing={() => setActiveView('training')}
      />;
    }
  };

  const handlePageBack = () => {
    switch (activeView) {
      case 'profile': setActiveView('settings'); break;
      case 'workout-history': {
        setSelectedHistoryWorkoutId(null);
        setActiveView(lastView);
        break;
      }
      case 'upcoming-missions': setActiveView('training'); break;
      case 'workout-log': setActiveView('training'); break;
      default: break;
    }
  };

  return (
    <div className={cn(
      "relative h-screen w-screen bg-void text-white font-sans overflow-hidden flex transition-colors duration-1000",
      `tier-${lifterLevel.tier}`,
      isCriticalReadiness && "glitch-active"
    )}>
      {/* Surroundings / Pass-through Simulation Layer */}
      <AnimatePresence>
        {immersionMode === 'ar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0"
          >
            <img 
              src="https://picsum.photos/seed/gym-surroundings/1920/1080?grayscale" 
              alt="Surrounding Environment" 
              className="w-full h-full object-cover opacity-40 brightness-50 contrast-125"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-void/40 to-void/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Feedback Overlay */}
      <AnimatePresence>
        {voiceFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-3 sm:px-6 py-3 bg-void/80 backdrop-blur-xl border border-volt/30 shadow-2xl"
          >
            <Volume2 size={16} className="text-volt" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-white">
              {t('app.recognized')}: <span className="text-volt">"{voiceFeedback}"</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top App Bar Shell - Hidden on Desktop/Tablet */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[60] flex md:hidden items-center justify-between px-6 bg-void/60 backdrop-blur-lg pt-safe pb-4 h-24 transition-all duration-500",
        ((activeView === 'fitness-test' && isCompetitionActive) || isHeaderHidden) ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
      )}>
        <div className="w-10" />
        <div className="flex items-center justify-center w-[40vw]">
          <VanguardLogo theme={theme} className="drop-shadow-[0_0_10px_var(--primary-glow)]" />
        </div>
        <button 
          onClick={() => setActiveView('settings')}
          className={cn(
            "p-2 pointer-events-auto transition-all",
            activeView === 'settings' ? "text-volt" : "text-zinc-500"
          )}
        >
          <Settings 
            size={20} 
            className={cn("transition-all", activeView === 'settings' && "drop-shadow-[0_0_8px_var(--primary-glow)]")} 
            strokeWidth={activeView === 'settings' ? 3 : 2} 
          />
        </button>
      </header>

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 hidden md:flex transition-all duration-500",
        (activeView === 'berserker' || (activeView === 'fitness-test' && isCompetitionActive)) ? "opacity-0 -translate-x-full pointer-events-none" : "opacity-100 translate-x-0"
      )}>
        {/* Navigation Content Pane */}
        <div className="w-[260px] h-full flex flex-col justify-between py-8 px-6 border-r border-white/5 bg-void/90 backdrop-blur-3xl shadow-2xl overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-8">
            <div 
              onClick={() => setActiveView('analysis')}
              className="flex flex-col gap-1 mt-6 mb-4 cursor-pointer group"
            >
              <VanguardLogo theme={theme} className="drop-shadow-[0_0_15px_var(--primary-glow)] group-hover:scale-105 transition-transform origin-left" />
            </div>

            {/* Search Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={12} className={cn("transition-colors", searchQuery ? "text-volt" : "text-zinc-500 group-focus-within:text-volt")} />
              </div>
              <input 
                type="text" 
                placeholder="SEARCH MENU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 py-2.5 pl-9 pr-3 text-[9px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt/30 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-volt"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {searchQuery ? (
                getSearchResults().length > 0 ? (
                  getSearchResults().map((result) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={`search-${result.id}`}
                        onClick={result.onSelect}
                        className="flex items-center gap-3 text-left w-full group transition-all duration-300 px-3 py-3 rounded-none border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-white"
                      >
                        <div className="p-1.5 bg-volt/10 text-volt rounded-none">
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col items-start leading-tight text-left">
                          <span className="font-sans text-[10px] uppercase font-black tracking-[0.2em] text-left">{result.label}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No signals detected</p>
                  </div>
                )
              ) : (
                NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id || 
                    (item.id === 'training' && ['workout-log', 'post-workout', 'berserker', 'workout-history', 'upcoming-missions'].includes(activeView));
                  
                  if (!showExperimentalMenus && item.isExperimental) return null;

                  return (
                    <button
                      key={`pane-${item.id}`}
                      onClick={() => setActiveView(item.id)}
                      className={cn(
                        "flex items-center gap-3 text-left w-full group transition-all duration-300 px-3 py-3 rounded-none border border-transparent",
                        `vanguard-tour-nav-${item.id}`,
                        isActive ? "bg-white/[0.05] text-white border-white/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                      )}
                    >
                      <div 
                        className={cn(
                          "p-1.5 transition-colors flex items-center justify-center",
                          item.id === 'training' ? "" : "rounded-none",
                          isActive ? "bg-volt/10 text-volt" : "text-zinc-600 group-hover:text-zinc-300"
                        )}
                        style={item.id === 'training' ? {
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                          minWidth: '28px',
                          minHeight: '28px'
                        } : {}}
                      >
                        <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                      </div>
                      <span className={cn(
                        "font-sans text-[10px] uppercase tracking-[0.2em] transition-colors flex text-left",
                        item.id === 'fitness-test' ? "flex-col items-start leading-none gap-1" : "items-center gap-2",
                        isActive ? "text-white font-black" : "text-zinc-500 font-bold group-hover:text-zinc-300"
                      )}>
                        <span>{t(item.label)}</span>
                        {item.id === 'fitness-test' && (
                          <span className="text-[8px] opacity-70 text-zinc-500 font-bold whitespace-nowrap text-left">
                            {(() => {
                              const info = getFitnessTestInfo(profile, nextWorkoutForTest?.title);
                              if (info.isUnlocked) return 'UNLOCKED';
                              return `D-${info.daysRemaining} | M-${info.missionsRemaining}`;
                            })()}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <motion.div 
                          layoutId="pane-active-indicator" 
                          className="ml-auto w-1 h-3 rounded-none bg-volt shadow-[0_0_8px_var(--primary-glow)]" 
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* User Metrics Area */}
          <div className="space-y-6">
            <div 
              onClick={() => setActiveView('profile')}
              className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-none hover:bg-white/[0.04] transition-colors cursor-pointer group text-left w-full"
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0 border border-white/10 relative overflow-hidden bg-zinc-900">
                {profile?.photoURL || user?.photoURL ? (
                  <img 
                    src={profile?.photoURL || user?.photoURL || ''} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={20} className="text-zinc-500 group-hover:text-volt transition-colors" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="min-w-0 pr-2">
                <p className="text-[12px] font-black uppercase tracking-wider text-white leading-tight">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <span className={cn("text-[9px] font-black uppercase tracking-widest block mt-1", trophyStyle.color)}>
                  {t(lifterLevel.label)}
                </span>
              </div>
            </div>

            <div className="px-1 space-y-1">
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden bg-void/80 backdrop-blur-xl border-t border-white/5 flex items-center transition-all duration-500 pb-safe",
        (activeView === 'berserker' || (activeView === 'fitness-test' && isCompetitionActive)) ? "translate-y-full" : "translate-y-0"
      )}>
        <div className="flex-1 flex justify-evenly items-center py-5">
          {[
            NAV_ITEMS.find(i => i.id === 'analysis'),
            NAV_ITEMS.find(i => i.id === 'analytics'),
          ].map((item) => {
            if (!item) return null;
            
            const Icon = item.icon;
            const isActive = activeView === item.id || 
              (item.id === 'training' && ['workout-log', 'post-workout', 'berserker', 'workout-history', 'upcoming-missions'].includes(activeView));
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  `vanguard-tour-nav-${item.id}`,
                  isActive ? "text-volt" : "text-zinc-500"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[8px] font-black uppercase tracking-widest">{t(item.label).split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-shrink-0 flex justify-center -mt-8">
          {(() => {
            const item = NAV_ITEMS.find(i => i.id === 'training');
            if (!item) return null;
            
            const Icon = item.icon;
            const isActive = activeView === item.id || 
              ['workout-log', 'post-workout', 'berserker', 'workout-history', 'upcoming-missions'].includes(activeView);
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "relative group flex flex-col items-center gap-1 focus:outline-none",
                  `vanguard-tour-nav-${item.id}`
                )}
              >
                <motion.div
                  animate={isActive ? {
                    boxShadow: ['0 0 15px var(--primary-glow)', '0 0 30px var(--primary-glow)', '0 0 15px var(--primary-glow)']
                  } : {
                    boxShadow: 'none'
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-300 overflow-hidden",
                    isActive 
                      ? "w-14 h-14 text-void scale-110" 
                      : "w-12 h-12 bg-void text-zinc-500 group-hover:text-void scale-105"
                  )}
                  style={{ 
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    background: isActive ? "var(--primary-gradient)" : undefined
                  }}
                >
                  {!isActive && (
                    <svg 
                      className="absolute inset-0 w-full h-full text-zinc-500 transition-opacity duration-300 group-hover:opacity-0" 
                      viewBox="0 0 48 48" 
                      preserveAspectRatio="none"
                      style={{ zIndex: -1 }}
                    >
                      <polygon 
                        points="24,1.5 46.5,12.5 46.5,35.5 24,46.5 1.5,35.5 1.5,12.5" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    style={{ background: "var(--primary-gradient)", zIndex: -1 }} 
                  />
                  <DeploymentIcon size={24} strokeWidth={isActive ? 3 : 2} />
                </motion.div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest mt-1 transition-colors",
                  isActive ? "text-volt drop-shadow-[0_0_5px_var(--primary-glow)]" : "text-zinc-500"
                )}>{t(item.label).split(' ')[0]}</span>
              </button>
            );
          })()}
        </div>

        <div className="flex-1 flex justify-evenly items-center py-5">
          <button
            onClick={() => setActiveView('deployment')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeView === 'deployment' ? "text-volt" : "text-zinc-500"
            )}
          >
            <MissionIcon 
              size={20} 
              strokeWidth={activeView === 'deployment' ? 3 : 2}
              className={activeView === 'deployment' ? "text-volt" : "text-zinc-500"}
            />
            <span className="text-[8px] font-black uppercase tracking-widest">{t('nav.deployment').split(' ')[0]}</span>
          </button>
          
          {showExperimentalMenus && (
            <button
              onClick={() => setActiveView('fitness-test')}
              className={cn(
                "flex flex-col items-center gap-1 transition-all relative",
                activeView === 'fitness-test' ? "text-volt" : "text-zinc-500"
              )}
            >
              <SportShoeIcon size={20} strokeWidth={activeView === 'fitness-test' ? 3 : 2} />
              <span className="text-[8px] font-black uppercase tracking-widest">{t('nav.fitnessTest').split(' ')[0] || "TEST"}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 w-full max-w-none relative h-full flex flex-col items-center transition-all duration-500",
          (activeView === 'berserker' || (activeView === 'fitness-test' && isCompetitionActive))
            ? "w-full ml-0 md:ml-0 md:w-full md:px-0 pb-0 pt-0 h-screen h-[100vh] overflow-hidden" 
            : activeView === 'workout-log'
              ? "px-4 md:px-[var(--app-gutter)] pt-0 pb-24 md:pb-12 overflow-x-hidden overflow-y-auto custom-scrollbar hud-widget-grid md:w-[calc(100%-260px)] ml-0 md:ml-[260px]"
              : "px-4 md:px-[var(--app-gutter)] pt-[calc(6rem+env(safe-area-inset-top))] md:pt-0 pb-24 md:pb-12 overflow-x-hidden overflow-y-auto custom-scrollbar hud-widget-grid md:w-[calc(100%-260px)] ml-0 md:ml-[260px]"
        )}
      >
        <div className={cn(
          "hidden md:flex flex-col w-full md:sticky md:top-0 md:z-30 bg-void border-b border-white/5 md:mb-8 md:-mx-[var(--app-gutter)] md:px-[var(--app-gutter)] md:w-[calc(100%+2*var(--app-gutter))]",
          (activeView === 'post-workout' || activeView === 'berserker' || activeView === 'workout-log' || (activeView === 'fitness-test' && isCompetitionActive)) && "md:hidden"
        )}>
          <PageHeader 
            activeView={activeView} 
            onBack={handlePageBack} 
            subtitle={activeView === 'training' ? (currentSession?.title || getNextWorkoutTemplate()?.title) : currentSession?.title} 
          />
        </div>
        <AnimatePresence mode="wait">
          {activeView === 'workout-log' ? (
            <div
              key="workout-log"
              className="w-full flex flex-col items-center min-w-0 justify-start"
            >
              {renderView()}
            </div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.95, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
              animate={{ opacity: 1, scale: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(5px)' }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className={cn(
                "w-full flex flex-col items-center min-w-0",
                (activeView === 'fitness-test' && isCompetitionActive) ? "h-screen h-[100vh] justify-between" : "justify-start"
              )}
            >
              {renderView()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Safety Overlay */}
      <AnimatePresence>
        {isSafetyActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-void/90 backdrop-blur-xl"
          >
            <SafetyHUD onDismiss={() => {
              setIsSafetyActive(false);
              setHasAcknowledgedCritical(true);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Flow Overlay */}
      <AnimatePresence>
        {user && profile && !profile.onboardingCompleted && history.length === 0 && !isProfileLoading && (
          <OnboardingFlow />
        )}
      </AnimatePresence>

      {/* Background Ambience Glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-volt/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-crimson/5 blur-[120px] pointer-events-none -z-10" />

      {/* Readiness Check Overlay */}
      <AnimatePresence>
        {showReadinessCheck && (
          <ReadinessCheck
            key="readiness-check"
            onComplete={(score, modifier, targetRpe, biometrics) => {
              startNewSession(undefined, score, modifier, targetRpe, biometrics);
              setShowReadinessCheck(false);
              setIsLifting(true);
              setActiveView('workout-log');
            }}
            onCancel={() => setShowReadinessCheck(false)}
          />
        )}
      </AnimatePresence>

      {/* Reflection Modal */}
      <AnimatePresence>
        {pendingReflection && (
          <ReflectionModal 
            key="reflection-modal"
            session={pendingReflection}
            onSave={(actualRpe) => saveReflection(pendingReflection.id, actualRpe)}
            onClose={() => setPendingReflection(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={isExitModalOpen}
        title={t('app.exitSession')}
        message={t('app.exitSessionMessage')}
        confirmLabel={t('app.exitSessionConfirm')}
        cancelLabel={t('app.stay')}
        onConfirm={() => {
          setIsExitModalOpen(false);
          logout();
        }}
        onCancel={() => setIsExitModalOpen(false)}
      />
      <NonProgramActivityModal 
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />
      <FloatingRestTimer />
      <InstallPrompt />
      <UserTour activeView={activeView} />
      <div id="a11y-live-region" className="sr-only" aria-live="polite" aria-atomic="true"></div>
    </div>
  );
}
