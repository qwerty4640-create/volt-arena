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
  Eye,
  Box,
  LayoutDashboard,
  Mic,
  MicOff,
  Volume2,
  Flame,
  Skull,
  Medal,
  LogIn,
  LogOut,
  Loader2
} from 'lucide-react';
import { ViewType, NavItem, ImmersionMode } from './types';
import { AnalysisView } from './components/AnalysisView';
import { SafetyHUD } from './components/SafetyHUD';
import { AnalyticsView } from './components/AnalyticsView';
import { StageView } from './components/StageView';
import { TrainingView } from './components/TrainingView';
import { BerserkerHUD } from './components/BerserkerHUD';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { WorkoutLog } from './components/WorkoutLog';
import { PostWorkoutSummary } from './components/PostWorkoutSummary';
import { WorkoutHistory } from './components/WorkoutHistory';
import { ActiveRecoveryModal } from './components/ActiveRecoveryModal';
import { cn } from './lib/utils';

import { useSettings } from './contexts/SettingsContext';
import { WorkoutProvider, useWorkout } from './contexts/WorkoutContext';
import { auth, signInWithGoogle, logout, signInWithEmail, signUpWithEmail } from './firebase';
import { calculateTier } from './lib/strength';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Mail, Lock, UserPlus, Languages } from 'lucide-react';

import { ReadinessCheck } from './components/ReadinessCheck';
import { ReflectionModal } from './components/ReflectionModal';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const NAV_ITEMS: NavItem[] = [
  { id: 'analysis', label: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'training', label: 'nav.training', icon: Dumbbell },
  { id: 'analytics', label: 'nav.analytics', icon: BarChart3 },
];

const SHOW_EXPERIMENTAL_FEATURES = false;

export default function App() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}

const VoltLogo = ({ className, size = 40 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M50 5L90 25V75L50 95L10 75V25L50 5Z" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeOpacity="0.2"
    />
    <path 
      d="M25 25H40L50 55L60 25H75L55 85H45L25 25Z" 
      fill="currentColor" 
    />
    <circle cx="50" cy="55" r="4" fill="white" className="animate-pulse" />
    <path d="M42 40H58" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
    <path d="M46 45H54" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
    <path d="M15 30L5 35M15 70L5 65M85 30L95 35M85 70L95 65" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
  </svg>
);

function AppContent() {
  const { 
    t, language, setLanguage, 
    isVoiceActive, setIsVoiceActive, 
    immersionMode, setImmersionMode, 
    showExperimentalMenus, 
    experimentalFeatures,
    profile, updateProfile, isProfileLoading, 
    setLastVoiceCommand, lastVoiceCommand 
  } = useSettings();
  const { 
    currentSession, 
    startNewSession, 
    completeSession, 
    discardSession, 
    history, 
    mockWorkoutCount, 
    isLoading: isWorkoutLoading,
    pendingReflection,
    saveReflection
  } = useWorkout();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volt_active_view');
      if (saved && ['analysis', 'training', 'analytics', 'settings', 'profile', 'workout-log', 'post-workout', 'berserker', 'workout-history'].includes(saved)) {
        return saved as ViewType;
      }
    }
    return 'analysis';
  });

  useEffect(() => {
    localStorage.setItem('volt_active_view', activeView);
  }, [activeView]);
  const [selectedHistoryWorkoutId, setSelectedHistoryWorkoutId] = useState<string | null>(null);
  const [isSafetyActive, setIsSafetyActive] = useState(false);
  const [isLifting, setIsLifting] = useState(false);
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
          color: 'text-[#FFD700]', 
          glow: 'drop-shadow-[0_0_15px_#ff4500]', 
          animation: '',
          bgGlow: 'bg-[#FFD700]'
        };
      case 'elite': 
        return { 
          icon: Skull, 
          color: 'text-[#9333EA]', 
          glow: 'drop-shadow-[0_0_20px_#3b82f6]', 
          animation: '',
          bgGlow: 'bg-[#9333EA]'
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
      } else if (transcript.includes('go to competition') || transcript.includes('show competition') || transcript.includes('arena')) {
        setActiveView('stage');
      } else if (transcript.includes('go to analytics') || transcript.includes('show analytics')) {
        setActiveView('analytics');
      } else if (transcript.includes('go to training') || transcript.includes('show training') || transcript.includes('workout')) {
        setActiveView('training');
      } else if (transcript.includes('arnold') || transcript.includes('classic') || transcript.includes('gym') || transcript.includes('uspl') || transcript.includes('nationals') || transcript.includes('competition') || transcript.includes('desert') || transcript.includes('dust bowl') || transcript.includes('dust') || transcript.includes('space') || transcript.includes('lunar') || transcript.includes('station')) {
        setActiveView('stage');
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

  if (isAuthChecking || (user && (isProfileLoading || isWorkoutLoading))) {
    return (
      <div className="h-screen w-screen bg-void flex flex-col items-center justify-center gap-6">
        <Loader2 className="text-volt animate-spin" size={48} />
        <div className="font-headline text-xs font-black uppercase tracking-[0.3em] text-volt animate-pulse">
          {t('app.loading')}...
        </div>
      </div>
    );
  }

  if (!user) {
    const languages: { code: any; label: string }[] = [
      { code: 'en', label: 'English' },
      { code: 'zh', label: '中文' },
      { code: 'ko', label: '한국어' },
      { code: 'ja', label: '日本語' },
      { code: 'es', label: 'Español' },
      { code: 'hi', label: 'हिन्दी' },
      { code: 'nl', label: 'Nederlands' },
    ];

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
        } else {
          await signInWithEmail(email, password);
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

    return (
      <div className="h-screen w-screen bg-void flex justify-center p-2 md:p-8 relative overflow-y-auto custom-scrollbar">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md w-full glass-panel px-4 py-10 md:p-10 border border-white/10 flex flex-col items-center text-center my-auto"
        >
          <div className="w-24 h-24 bg-surface-container-highest flex items-center justify-center mb-6 border border-volt/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-volt/5 animate-pulse" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-volt" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-volt" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-volt" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-volt" />
            <VoltLogo size={64} className="text-volt relative z-10" />
          </div>
          
          <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase font-headline mb-1">
            {t('app.title')}
          </h1>
          <p className="font-headline text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8">
            {t('auth.trainingSystem')}
          </p>

          <form onSubmit={handleAuth} className="w-full space-y-4 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border-b-2 border-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-volt outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border-b-2 border-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-volt outline-none transition-all"
              />
            </div>

            {isSigningUp && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-lowest border-b-2 border-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-volt outline-none transition-all"
                />
              </div>
            )}
            
            {authError && (
              <p className="text-crimson text-[10px] font-bold uppercase tracking-widest animate-shake">
                {authError}
              </p>
            )}

            <button 
              type="submit"
              disabled={isEmailAuthLoading || isGoogleAuthLoading}
              className="w-full bg-volt text-void py-4 font-headline text-xs font-black uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-xl disabled:opacity-50"
            >
              {isEmailAuthLoading ? (
                <Loader2 className="animate-spin mx-auto" size={18} />
              ) : (
                isSigningUp ? t('auth.next') : t('auth.signIn')
              )}
            </button>
          </form>

          <div className="w-full flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{t('auth.or')}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isEmailAuthLoading || isGoogleAuthLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-4 font-headline text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
          >
            {isGoogleAuthLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <LogIn size={16} />
            )}
            {t('auth.signInWithGoogle')}
          </button>

          <button 
            type="button"
            onClick={() => {
              if (isEmailAuthLoading || isGoogleAuthLoading) return;
              setIsSigningUp(!isSigningUp);
              setAuthError(null);
            }}
            className="mt-6 w-full py-4 border border-volt/30 text-[10px] font-black text-volt uppercase tracking-widest hover:bg-volt/5 hover:border-volt transition-all duration-300"
          >
            {isSigningUp ? t('auth.signInPrompt') : t('auth.signUpPrompt')}
          </button>

          {/* Language Selector */}
          <div className="mt-8 w-full space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <Languages size={12} className="text-zinc-600" />
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{t('auth.systemLanguage')}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 w-full">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "py-2 border transition-all text-[8px] font-black",
                    language === lang.code 
                      ? "bg-volt border-volt text-void" 
                      : "border-white/5 text-zinc-500 hover:text-white hover:border-white/20"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-[8px] text-zinc-600 font-medium leading-relaxed max-w-[280px]">
            {t('auth.privacyNotice')}
          </p>
        </motion.div>

        {/* Background Ambience */}
        <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-crimson/5 blur-[120px] pointer-events-none -z-10" />
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
        onViewHistory={(sessionId) => {
          setSelectedHistoryWorkoutId(sessionId || null);
          setActiveView('workout-history');
        }}
      />;
      case 'workout-history': return <WorkoutHistory 
        onBack={() => {
          setSelectedHistoryWorkoutId(null);
          setActiveView('analysis');
        }} 
        initialSelectedWorkoutId={selectedHistoryWorkoutId}
      />;
      case 'training': return <TrainingView 
        isLifting={isLifting}
        onViewHistory={(sessionId) => {
          setSelectedHistoryWorkoutId(sessionId || null);
          setActiveView('workout-history');
        }}
        onAddActivity={() => setIsRecoveryModalOpen(true)}
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
      case 'settings': return <SettingsView onExit={() => setIsExitModalOpen(true)} />;
      case 'profile': return <ProfileView />;
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
      />;
    }
  };

  return (
    <div className={cn(
      "relative h-screen w-screen bg-void text-white font-sans overflow-hidden flex transition-colors duration-1000",
      `tier-${lifterLevel.tier}`
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
            <span className="font-headline text-[10px] font-black uppercase tracking-widest text-white">
              {t('app.recognized')}: <span className="text-volt">"{voiceFeedback}"</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top App Bar Shell */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center md:justify-between items-center px-4 md:px-10 py-4 md:py-8 bg-void/50 backdrop-blur-md md:bg-transparent">
        <div className="flex-1 hidden md:block" />
        
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <VoltLogo size={32} className="text-volt hidden md:block" />
            <div className="text-2xl md:text-5xl font-black italic text-volt tracking-tighter uppercase font-headline text-glow-volt leading-none">
              {t('app.title')}
            </div>
          </div>
          <div className="font-headline text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-1">
            {profile?.trainingGoal ? t(`goal.${profile.trainingGoal}`) : t('auth.trainingSystem')}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 md:gap-6 flex-1 justify-end">
          <div className="hidden md:flex gap-2 md:gap-4">
            {experimentalFeatures && (
              <>
                <button 
                  onClick={() => {
                    setIsLifting(true);
                    setActiveView('berserker');
                  }}
                  className="group relative flex items-center gap-2 bg-volt/10 text-volt px-3 md:px-4 py-1.5 md:py-2 border border-volt/20 hover:bg-volt hover:text-void transition-all"
                >
                  <Zap size={14} className="group-hover:animate-bounce md:w-4 md:h-4" />
                  <span className="font-headline text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t('app.detectLift')}</span>
                  <span className="absolute -top-2 -right-2 bg-volt text-void text-[6px] font-black px-1 py-0.5 uppercase tracking-widest border border-void">EXP</span>
                </button>
              </>
            )}
            <button className="text-zinc-500 hover:text-volt transition-colors p-1"><Bell size={18} className="md:w-5 md:h-5" /></button>
            <button onClick={() => setActiveView('settings')} className={cn("transition-colors p-1", activeView === 'settings' ? "text-volt" : "text-zinc-500 hover:text-volt")}><Settings size={18} className="md:w-5 md:h-5" /></button>
          </div>
          <button 
            onClick={() => setActiveView('profile')}
            className={cn(
              "hidden md:block w-8 h-8 md:w-10 md:h-10 border-2 overflow-hidden bg-surface-high transition-all",
              activeView === 'profile' ? "border-volt scale-110 shadow-[0_0_15px_var(--primary-glow)]" : "border-volt/30 hover:border-volt/60"
            )}
          >
            <img 
              src={user.photoURL || "https://picsum.photos/seed/athlete/100/100"} 
              alt={user.displayName || "Athlete"} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </header>

      {/* Side Navigation Rail (Spatial) - Hidden on Mobile */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col items-center gap-4 glass-panel py-4 px-3 shadow-2xl transition-all duration-500 my-auto h-fit ml-4",
        (activeView === 'berserker') ? "opacity-0 -translate-x-20 pointer-events-none" : "opacity-100 translate-x-0"
      )}>
        <div className="flex flex-col items-center gap-1 mb-1">
          <div className="w-14 h-14 bg-surface-variant/20 flex items-center justify-center border border-white/10 shadow-2xl p-1 relative overflow-hidden">
            <div className="flex items-center justify-center relative z-10">
              <motion.div
                key={lifterLevel.tier}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "flex items-center justify-center",
                  trophyStyle.animation
                )}
              >
                <trophyStyle.icon 
                  size={32} 
                  className={cn(trophyStyle.color, trophyStyle.glow, "transition-all duration-500")} 
                />
              </motion.div>
            </div>
          </div>
          <span className={cn(
            "font-headline text-[8px] font-black tracking-widest uppercase mt-0.5",
            trophyStyle.color
          )}>
            {t(lifterLevel.label)}
          </span>
        </div>
        
        <div className="w-8 h-px bg-white/10" />

        <div className="flex flex-col gap-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id || 
              (item.id === 'training' && ['workout-log', 'post-workout', 'berserker'].includes(activeView)) ||
              (item.id === 'analysis' && activeView === 'workout-history');
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group",
                  isActive ? "scale-110" : "opacity-50 hover:opacity-100 hover:scale-105"
                )}
              >
                <div className={cn(
                  "p-3 transition-all duration-500",
                  isActive ? "bg-volt text-void shadow-[0_0_20px_var(--primary-glow)]" : "text-zinc-400 group-hover:text-white"
                )}>
                  <Icon size={22} strokeWidth={isActive ? 3 : 2} />
                </div>
                <span className={cn(
                  "font-headline text-[7px] font-black uppercase tracking-[0.2em] transition-colors",
                  isActive ? "text-volt" : "text-zinc-500 group-hover:text-zinc-300"
                )}>
                  {t(item.label).split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden bg-void/80 backdrop-blur-xl border-t border-white/5 px-3 py-4 flex justify-between items-center transition-all duration-500",
        (activeView === 'berserker') ? "translate-y-full" : "translate-y-0"
      )}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id || 
            (item.id === 'training' && ['workout-log', 'post-workout', 'berserker'].includes(activeView)) ||
            (item.id === 'analysis' && activeView === 'workout-history');
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-volt" : "text-zinc-500"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[8px] font-black uppercase tracking-widest">{t(item.label).split(' ')[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setActiveView('settings')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeView === 'settings' ? "text-volt" : "text-zinc-500"
          )}
        >
          <Settings size={20} strokeWidth={activeView === 'settings' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">SETTINGS</span>
        </button>
        <button
          onClick={() => setActiveView('profile')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeView === 'profile' ? "text-volt" : "text-zinc-500"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full overflow-hidden border transition-all",
            activeView === 'profile' ? "border-volt" : "border-zinc-500"
          )}>
            <img 
              src={user?.photoURL || "https://picsum.photos/seed/athlete/100/100"} 
              alt={user?.displayName || "Athlete"} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">PROFILE</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main 
        ref={mainRef}
        className="flex-1 relative h-full flex flex-col items-center mx-auto pt-24 md:pt-32 pb-24 md:pb-12 px-0 sm:px-6 overflow-y-auto custom-scrollbar w-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center justify-start max-w-none sm:max-w-full m-0 sm:mx-auto px-0 md:px-12"
          >
            {renderView()}
          </motion.div>
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
            <SafetyHUD onDismiss={() => setIsSafetyActive(false)} />
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
            onComplete={(score, modifier, targetRpe) => {
              startNewSession(undefined, score, modifier, targetRpe);
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
            session={pendingReflection}
            onSave={(actualRpe) => saveReflection(pendingReflection.id, actualRpe)}
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
      <ActiveRecoveryModal 
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />
      <div id="a11y-live-region" className="sr-only" aria-live="polite" aria-atomic="true"></div>
    </div>
  );
}
