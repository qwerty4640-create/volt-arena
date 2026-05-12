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
  Loader2
} from 'lucide-react';
import { DeploymentIcon } from './components/DeploymentIcon';
import { MissionIcon } from './components/MissionIcon';
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
import { DeploymentView } from './components/DeploymentView';
import { UpcomingMissionsView } from './components/UpcomingMissionsView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { WelcomeCarousel } from './components/WelcomeCarousel';
import { WorkoutLog } from './components/WorkoutLog';
import { PostWorkoutSummary } from './components/PostWorkoutSummary';
import { WorkoutHistory } from './components/WorkoutHistory';
import { NonProgramActivityModal } from './components/NonProgramActivityModal';
import { cn } from './lib/utils';

import { useSettings } from './contexts/SettingsContext';
import { WorkoutProvider, useWorkout } from './contexts/WorkoutContext';
import { auth, signInWithGoogle, logout, signInWithEmail, signUpWithEmail } from './firebase';
import { calculateTier } from './lib/strength';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Mail, Lock, UserPlus, ChevronLeft } from 'lucide-react';

import { ReadinessCheck } from './components/ReadinessCheck';
import { ReflectionModal } from './components/ReflectionModal';
import { InstallPrompt } from './components/InstallPrompt';
import { PwaUpdater } from './components/PwaUpdater';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const RecoveryIcon = ({ size = 24, strokeWidth = 2, className }: { size?: number, strokeWidth?: number, className?: string }) => (
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
  { id: 'analysis', label: 'nav.dashboard', icon: RecoveryIcon },
  { id: 'analytics', label: 'nav.analytics', icon: BarChart3 },
  { id: 'training', label: 'nav.training', icon: DeploymentIcon },
  { id: 'deployment', label: 'nav.deployment', icon: MissionIcon },
  { id: 'settings', label: 'nav.settings', icon: Settings },
];

const SHOW_EXPERIMENTAL_FEATURES = false;

import { DataRedundancyManager } from './components/DataRedundancyManager';

export default function App() {
  return (
    <WorkoutProvider>
      <DataRedundancyManager />
      <PwaUpdater />
      <AppContent />
    </WorkoutProvider>
  );
}

const VanguardLogo = ({ className }: { className?: string }) => {
  const gradientId = React.useId().replace(/:/g, "");
  return (
  <svg 
    viewBox="0 0 134 26" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-full h-auto", className)}
  >
    <path d="M0.999999 6.98218L1.5 6.69312L10.5937 1.44312L11.0937 1.15503L11.5937 1.44312L20.6875 6.69312L21.1875 6.98218L21.1875 18.6365L20.6875 18.9255L11.5938 24.1755L11.0938 24.4636L10.5938 24.1755L1.5 18.9255L1 18.6365L0.999999 6.98218Z" fill={`url(#vanguard_gradient_${gradientId})`} stroke="white" strokeWidth="2"/>
    <path d="M11.0937 18.0587C13.9931 18.0587 16.3436 15.7084 16.3436 12.809C16.3436 9.9097 13.9931 7.55933 11.0937 7.55933C8.19421 7.55933 5.84375 9.9097 5.84375 12.809C5.84375 15.7084 8.19421 18.0587 11.0937 18.0587Z" stroke="white" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.3438 12.8093L13.7188 12.8093" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M8.46875 12.8091H5.84375" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M11.0938 10.1843V7.55933" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M11.0938 18.0593L11.0938 15.4343" stroke="white" strokeWidth="0.75" strokeLinejoin="round"/>
    <path d="M32.7159 2.21826L34.804 9.39724H34.8835L36.9716 2.21826H40.0938L36.733 12.4001H32.9545L29.5938 2.21826H32.7159Z" fill="white"/>
    <path d="M47.0767 12.4001H44.0938L47.4545 2.21826H51.233L54.5938 12.4001H51.6108L49.3835 5.02224H49.304L47.0767 12.4001ZM46.5199 8.38304H52.1278V10.4512H46.5199V8.38304Z" fill="white"/>
    <path d="M67.4034 2.21826V12.4001H65.0966L61.4176 7.05065H61.358V12.4001H58.5938V2.21826H60.9403L64.5597 7.54781H64.6392V2.21826H67.4034Z" fill="white"/>
    <path d="M78.0553 5.5791C78.0122 5.40344 77.9443 5.24932 77.8515 5.11674C77.7587 4.98085 77.6427 4.86651 77.5035 4.7737C77.3676 4.67759 77.2085 4.60633 77.0262 4.55993C76.8472 4.51021 76.65 4.48535 76.4346 4.48535C75.9706 4.48535 75.5745 4.59638 75.2464 4.81845C74.9216 5.04051 74.673 5.36035 74.5006 5.77797C74.3316 6.19558 74.2471 6.69937 74.2471 7.28933C74.2471 7.88592 74.3283 8.39634 74.4907 8.82058C74.6531 9.24482 74.895 9.56963 75.2165 9.79501C75.538 10.0204 75.9374 10.1331 76.4147 10.1331C76.8356 10.1331 77.1853 10.0718 77.4637 9.94913C77.7454 9.8265 77.9559 9.65249 78.0951 9.42711C78.2343 9.20173 78.3039 8.93658 78.3039 8.63166L78.7812 8.68137H76.4545V6.71262H80.9687V8.12456C80.9687 9.05259 80.7715 9.84638 80.377 10.5059C79.9859 11.1622 79.4457 11.666 78.7563 12.0173C78.0702 12.3653 77.2831 12.5393 76.3948 12.5393C75.4038 12.5393 74.5338 12.3289 73.7847 11.9079C73.0357 11.487 72.4507 10.8871 72.0297 10.1082C71.6121 9.32934 71.4033 8.40297 71.4033 7.3291C71.4033 6.48725 71.5309 5.74151 71.7861 5.09189C72.0447 4.44226 72.4026 3.89373 72.86 3.44629C73.3174 2.99553 73.846 2.65581 74.4459 2.42711C75.0458 2.19511 75.6888 2.0791 76.3749 2.0791C76.9781 2.0791 77.5383 2.16528 78.0553 2.33762C78.5757 2.50666 79.0347 2.74861 79.4324 3.06348C79.8335 3.37503 80.1566 3.74458 80.4019 4.17214C80.6472 4.5997 80.7963 5.06868 80.8493 5.5791H78.0553Z" fill="white"/>
    <path d="M90.9943 2.15869H93.7585V8.68142C93.7585 9.45699 93.5729 10.1282 93.2017 10.6949C92.8338 11.2584 92.3201 11.6942 91.6605 12.0024C91.0009 12.3074 90.2353 12.4598 89.3636 12.4598C88.4853 12.4598 87.7164 12.3074 87.0568 12.0024C86.3973 11.6942 85.8835 11.2584 85.5156 10.6949C85.151 10.1282 84.9688 9.45699 84.9688 8.68142V2.15869H87.733V8.44278C87.733 8.75765 87.8026 9.03937 87.9418 9.28795C88.081 9.53322 88.2732 9.72545 88.5185 9.86466C88.767 10.0039 89.0488 10.0735 89.3636 10.0735C89.6818 10.0735 89.9635 10.0039 90.2088 9.86466C90.4541 9.72545 90.6463 9.53322 90.7855 9.28795C90.9247 9.03937 90.9943 8.75765 90.9943 8.44278V2.15869Z" fill="white"/>
    <path d="M100.742 12.4001H97.7588L101.12 2.21826H104.898L108.259 12.4001H105.276L103.049 5.02224H102.969L100.742 12.4001ZM100.185 8.38304H105.793V10.4512H100.185V8.38304Z" fill="white"/>
    <path d="M112.259 12.4001V2.21826H116.654C117.409 2.21826 118.071 2.35581 118.637 2.6309C119.204 2.906 119.645 3.30207 119.96 3.81911C120.275 4.33616 120.432 4.95595 120.432 5.67849C120.432 6.40766 120.27 7.02248 119.945 7.52295C119.623 8.02342 119.171 8.40126 118.588 8.65647C118.008 8.91168 117.33 9.03928 116.554 9.03928H113.929V6.89156H115.997C116.322 6.89156 116.599 6.85178 116.828 6.77224C117.06 6.68938 117.237 6.55846 117.36 6.37948C117.486 6.20051 117.549 5.96684 117.549 5.67849C117.549 5.38682 117.486 5.14984 117.36 4.96755C117.237 4.78195 117.06 4.64606 116.828 4.55988C116.599 4.47039 116.322 4.42565 115.997 4.42565H115.023V12.4001H112.259ZM118.225 7.72678L120.77 12.4001H117.767L115.282 7.72678H118.225Z" fill="white"/>
    <path d="M128.687 12.4001H124.77V2.21826H128.647C129.695 2.21826 130.6 2.4221 131.362 2.82977C132.127 3.23412 132.717 3.81746 133.132 4.57977C133.549 5.33876 133.758 6.24857 133.758 7.30917C133.758 8.36978 133.551 9.28124 133.137 10.0435C132.722 10.8025 132.136 11.3859 131.377 11.7935C130.618 12.1979 129.721 12.4001 128.687 12.4001ZM127.534 10.0535H128.588C129.092 10.0535 129.521 9.97229 129.875 9.80988C130.233 9.64748 130.505 9.36741 130.691 8.96968C130.88 8.57195 130.974 8.01845 130.974 7.30917C130.974 6.59989 130.878 6.04639 130.686 5.64866C130.497 5.25093 130.218 4.97087 129.85 4.80846C129.486 4.64605 129.038 4.56485 128.508 4.56485H127.534V10.0535Z" fill="white"/>
    <path d="M61.9834 23.097V18.645H62.6551V22.5187H64.6724V23.097H61.9834Z" fill="white"/>
    <path d="M57.4034 23.097H56.6904L58.2925 18.645H59.0686L60.6706 23.097H59.9576L58.699 19.4537H58.6642L57.4034 23.097ZM57.523 21.3536H59.8359V21.9188H57.523V21.3536Z" fill="white"/>
    <path d="M55.3792 20.1536H54.701C54.6749 20.0087 54.6263 19.8812 54.5553 19.771C54.4843 19.6609 54.3973 19.5674 54.2945 19.4906C54.1916 19.4138 54.0764 19.3559 53.9488 19.3167C53.8227 19.2776 53.6887 19.258 53.5467 19.258C53.2902 19.258 53.0605 19.3225 52.8576 19.4515C52.6561 19.5805 52.4967 19.7696 52.3793 20.0189C52.2634 20.2681 52.2054 20.5725 52.2054 20.9319C52.2054 21.2942 52.2634 21.5999 52.3793 21.8492C52.4967 22.0985 52.6569 22.2869 52.8598 22.4144C53.0626 22.5419 53.2909 22.6057 53.5445 22.6057C53.6851 22.6057 53.8184 22.5868 53.9445 22.5492C54.072 22.51 54.1872 22.4528 54.2901 22.3774C54.393 22.3021 54.48 22.2101 54.551 22.1014C54.6234 21.9912 54.6734 21.8651 54.701 21.7231L55.3792 21.7253C55.3429 21.9441 55.2727 22.1456 55.1683 22.3296C55.0654 22.5122 54.9328 22.6702 54.7705 22.8035C54.6097 22.9354 54.4256 23.0376 54.2184 23.11C54.0111 23.1825 53.7851 23.2187 53.5401 23.2187C53.1547 23.2187 52.8112 23.1274 52.5098 22.9448C52.2083 22.7608 51.9707 22.4977 51.7968 22.1557C51.6243 21.8137 51.5381 21.4057 51.5381 20.9319C51.5381 20.4565 51.625 20.0486 51.7989 19.708C51.9728 19.366 52.2105 19.1037 52.5119 18.9211C52.8134 18.737 53.1561 18.645 53.5401 18.645C53.7764 18.645 53.9966 18.6791 54.201 18.7472C54.4068 18.8139 54.5915 18.9124 54.7553 19.0428C54.9191 19.1718 55.0546 19.3298 55.1618 19.5167C55.269 19.7022 55.3415 19.9145 55.3792 20.1536Z" fill="white"/>
    <path d="M50.2254 18.645V23.097H49.5537V18.645H50.2254Z" fill="white"/>
    <path d="M44.7959 19.2233V18.645H48.2414V19.2233H46.8523V23.097H46.1828V19.2233H44.7959Z" fill="white"/>
    <path d="M43.4846 20.1536H42.8064C42.7803 20.0087 42.7318 19.8812 42.6608 19.771C42.5898 19.6609 42.5028 19.5674 42.3999 19.4906C42.297 19.4138 42.1818 19.3559 42.0543 19.3167C41.9282 19.2776 41.7942 19.258 41.6521 19.258C41.3956 19.258 41.1659 19.3225 40.963 19.4515C40.7616 19.5805 40.6022 19.7696 40.4848 20.0189C40.3689 20.2681 40.3109 20.5725 40.3109 20.9319C40.3109 21.2942 40.3689 21.5999 40.4848 21.8492C40.6022 22.0985 40.7623 22.2869 40.9652 22.4144C41.1681 22.5419 41.3964 22.6057 41.65 22.6057C41.7905 22.6057 41.9239 22.5868 42.0499 22.5492C42.1775 22.51 42.2927 22.4528 42.3956 22.3774C42.4985 22.3021 42.5854 22.2101 42.6564 22.1014C42.7289 21.9912 42.7789 21.8651 42.8064 21.7231L43.4846 21.7253C43.4484 21.9441 43.3781 22.1456 43.2738 22.3296C43.1709 22.5122 43.0383 22.6702 42.876 22.8035C42.7151 22.9354 42.5311 23.0376 42.3238 23.11C42.1166 23.1825 41.8905 23.2187 41.6456 23.2187C41.2601 23.2187 40.9167 23.1274 40.6152 22.9448C40.3138 22.7608 40.0761 22.4977 39.9022 22.1557C39.7298 21.8137 39.6436 21.4057 39.6436 20.9319C39.6436 20.4565 39.7305 20.0486 39.9044 19.708C40.0783 19.366 40.316 19.1037 40.6174 18.9211C40.9188 18.737 41.2616 18.645 41.6456 18.645C41.8818 18.645 42.1021 18.6791 42.3064 18.7472C42.5122 18.8139 42.697 18.9124 42.8608 19.0428C43.0245 19.1718 43.16 19.3298 43.2673 19.5167C43.3745 19.7022 43.447 19.9145 43.4846 20.1536Z" fill="white"/>
    <path d="M35.0646 23.097H34.3516L35.9536 18.645H36.7297L38.3318 23.097H37.6188L36.3601 19.4537H36.3254L35.0646 23.097ZM35.1841 21.3536H37.497V21.9188H35.1841V21.3536Z" fill="white"/>
    <path d="M29.5938 19.2233V18.645H33.0392V19.2233H31.6502V23.097H30.9806V19.2233H29.5938Z" fill="white"/>
    <path d="M100.638 20.1123C100.596 19.9804 100.539 19.8623 100.468 19.758C100.399 19.6522 100.315 19.5624 100.218 19.4884C100.121 19.4131 100.01 19.3558 99.8857 19.3167C99.7625 19.2776 99.627 19.258 99.4792 19.258C99.2285 19.258 99.0024 19.3225 98.801 19.4515C98.5995 19.5805 98.4401 19.7696 98.3227 20.0188C98.2068 20.2667 98.1488 20.5703 98.1488 20.9297C98.1488 21.2905 98.2075 21.5956 98.3249 21.8448C98.4423 22.0941 98.6031 22.2832 98.8075 22.4122C99.0118 22.5412 99.2444 22.6056 99.5053 22.6056C99.7473 22.6056 99.9582 22.5564 100.138 22.4578C100.319 22.3593 100.459 22.2202 100.557 22.0405C100.657 21.8593 100.707 21.6463 100.707 21.4014L100.881 21.434H99.6075V20.8797H101.357V21.3862C101.357 21.76 101.278 22.0847 101.118 22.36C100.96 22.6339 100.741 22.8455 100.462 22.9947C100.184 23.144 99.8647 23.2186 99.5053 23.2186C99.1024 23.2186 98.7488 23.1259 98.4445 22.9404C98.1416 22.7549 97.9053 22.4919 97.7358 22.1513C97.5662 21.8093 97.4814 21.4035 97.4814 20.934C97.4814 20.579 97.5307 20.2601 97.6293 19.9775C97.7278 19.695 97.8662 19.4551 98.0445 19.258C98.2242 19.0595 98.435 18.908 98.6771 18.8037C98.9205 18.6979 99.1865 18.645 99.4749 18.645C99.7154 18.645 99.9393 18.6805 100.147 18.7515C100.355 18.8225 100.541 18.9233 100.703 19.0537C100.867 19.1841 101.002 19.3392 101.11 19.5189C101.217 19.6971 101.289 19.8949 101.327 20.1123H100.638Z" fill="white"/>
    <path d="M96.1705 18.7058V23.1577H95.5531L93.2902 19.8927H93.2489V23.1577H92.5771V18.7058H93.1989L95.464 21.9752H95.5053V18.7058H96.1705Z" fill="white"/>
    <path d="M91.2655 18.7058V23.1577H90.5938V18.7058H91.2655Z" fill="white"/>
    <path d="M89.2809 18.7058V23.1577H88.6635L86.4005 19.8927H86.3592V23.1577H85.6875V18.7058H86.3092L88.5744 21.9752H88.6157V18.7058H89.2809Z" fill="white"/>
    <path d="M84.3748 18.7058V23.1577H83.7031V18.7058H84.3748Z" fill="white"/>
    <path d="M79.1242 23.1577H78.4111L80.0133 18.7058H80.7893L82.3914 23.1577H81.6784L80.4198 19.5145H80.385L79.1242 23.1577ZM79.2437 21.4143H81.5567V21.9795H79.2437V21.4143Z" fill="white"/>
    <path d="M73.8018 23.1577V18.7058H75.3887C75.7336 18.7058 76.0198 18.7652 76.2473 18.8841C76.4763 19.0029 76.6473 19.1674 76.7604 19.3775C76.8734 19.5862 76.9299 19.8275 76.9299 20.1014C76.9299 20.3738 76.8727 20.6137 76.7582 20.8209C76.6451 21.0267 76.4741 21.1868 76.2452 21.3013C76.0176 21.4158 75.7314 21.473 75.3865 21.473H74.1844V20.8948H75.3256C75.543 20.8948 75.7198 20.8636 75.856 20.8013C75.9937 20.739 76.0944 20.6484 76.1582 20.5296C76.222 20.4108 76.2539 20.268 76.2539 20.1014C76.2539 19.9333 76.2212 19.7876 76.156 19.6644C76.0923 19.5413 75.9915 19.4471 75.8539 19.3819C75.7176 19.3152 75.5387 19.2819 75.3169 19.2819H74.4735V23.1577H73.8018ZM75.9995 21.1491L77.0995 23.1577H76.3343L75.2561 21.1491H75.9995Z" fill="white"/>
    <path d="M69.0449 19.284V18.7058H72.4905V19.284H71.1014V23.1577H70.4318V19.284H69.0449Z" fill="white"/>
    <path d="M129.076 18.6997H129.891L131.309 22.1604H131.361L132.778 18.6997H133.593V23.1516H132.954V19.9301H132.913L131.6 23.1451H131.07L129.757 19.9279H129.715V23.1516H129.076V18.6997Z" fill="white"/>
    <path d="M124.946 23.1516V18.6997H127.737V19.2779H125.618V20.6344H127.592V21.2104H125.618V22.5734H127.764V23.1516H124.946Z" fill="white"/>
    <path d="M120.19 19.2779V18.6997H123.636V19.2779H122.247V23.1516H121.577V19.2779H120.19Z" fill="white"/>
    <path d="M118.17 19.8688C118.146 19.663 118.051 19.5036 117.883 19.3906C117.715 19.2761 117.503 19.2188 117.248 19.2188C117.065 19.2188 116.907 19.2478 116.774 19.3058C116.641 19.3623 116.537 19.4406 116.463 19.5406C116.391 19.6391 116.355 19.7514 116.355 19.8775C116.355 19.9833 116.379 20.0746 116.428 20.1514C116.479 20.2282 116.545 20.2927 116.626 20.3449C116.709 20.3956 116.797 20.4383 116.891 20.4731C116.986 20.5064 117.076 20.534 117.163 20.5557L117.598 20.6687C117.74 20.7035 117.886 20.7506 118.035 20.81C118.184 20.8695 118.323 20.9477 118.45 21.0448C118.578 21.1419 118.68 21.2622 118.759 21.4057C118.838 21.5491 118.878 21.7209 118.878 21.9209C118.878 22.173 118.813 22.3969 118.683 22.5926C118.554 22.7882 118.366 22.9425 118.12 23.0556C117.875 23.1686 117.578 23.2251 117.231 23.2251C116.897 23.2251 116.609 23.1722 116.365 23.0664C116.122 22.9606 115.931 22.8107 115.794 22.6165C115.656 22.4208 115.58 22.189 115.565 21.9209H116.239C116.252 22.0817 116.305 22.2158 116.396 22.323C116.489 22.4288 116.607 22.5078 116.75 22.5599C116.895 22.6107 117.054 22.636 117.226 22.636C117.416 22.636 117.585 22.6063 117.733 22.5469C117.882 22.486 117.999 22.402 118.085 22.2947C118.17 22.1861 118.213 22.0592 118.213 21.9143C118.213 21.7825 118.175 21.6745 118.1 21.5904C118.026 21.5064 117.925 21.4368 117.798 21.3818C117.672 21.3267 117.529 21.2781 117.37 21.2361L116.844 21.0926C116.487 20.9955 116.205 20.8528 115.996 20.6644C115.789 20.476 115.685 20.2267 115.685 19.9166C115.685 19.6601 115.755 19.4362 115.894 19.2449C116.033 19.0536 116.221 18.9051 116.459 18.7993C116.697 18.692 116.965 18.6384 117.263 18.6384C117.565 18.6384 117.831 18.6913 118.061 18.7971C118.293 18.9029 118.475 19.0485 118.609 19.234C118.742 19.4181 118.812 19.6297 118.817 19.8688H118.17Z" fill="white"/>
    <path d="M110.353 18.6997H111.116L112.279 20.7235H112.326L113.489 18.6997H114.252L112.637 21.4039V23.1516H111.968V21.4039L110.353 18.6997Z" fill="white"/>
    <path d="M108.333 19.8688C108.31 19.663 108.214 19.5036 108.046 19.3906C107.878 19.2761 107.666 19.2188 107.411 19.2188C107.228 19.2188 107.07 19.2478 106.937 19.3058C106.804 19.3623 106.7 19.4406 106.626 19.5406C106.554 19.6391 106.518 19.7514 106.518 19.8775C106.518 19.9833 106.542 20.0746 106.592 20.1514C106.642 20.2282 106.708 20.2927 106.789 20.3449C106.872 20.3956 106.96 20.4383 107.055 20.4731C107.149 20.5064 107.239 20.534 107.326 20.5557L107.761 20.6687C107.903 20.7035 108.049 20.7506 108.198 20.81C108.347 20.8695 108.486 20.9477 108.613 21.0448C108.741 21.1419 108.844 21.2622 108.922 21.4057C109.002 21.5491 109.041 21.7209 109.041 21.9209C109.041 22.173 108.976 22.3969 108.846 22.5926C108.717 22.7882 108.529 22.9425 108.283 23.0556C108.038 23.1686 107.741 23.2251 107.394 23.2251C107.06 23.2251 106.772 23.1722 106.528 23.0664C106.285 22.9606 106.094 22.8107 105.957 22.6165C105.819 22.4208 105.743 22.189 105.729 21.9209H106.402C106.415 22.0817 106.468 22.2158 106.559 22.323C106.652 22.4288 106.77 22.5078 106.913 22.5599C107.058 22.6107 107.217 22.636 107.389 22.636C107.579 22.636 107.748 22.6063 107.896 22.5469C108.045 22.486 108.162 22.402 108.248 22.2947C108.333 22.1861 108.376 22.0592 108.376 21.9143C108.376 21.7825 108.339 21.6745 108.263 21.5904C108.189 21.5064 108.089 21.4368 107.961 21.3818C107.835 21.3267 107.692 21.2781 107.533 21.2361L107.007 21.0926C106.65 20.9955 106.368 20.8528 106.159 20.6644C105.952 20.476 105.848 20.2267 105.848 19.9166C105.848 19.6601 105.918 19.4362 106.057 19.2449C106.196 19.0536 106.384 18.9051 106.622 18.7993C106.86 18.692 107.128 18.6384 107.426 18.6384C107.728 18.6384 107.994 18.6913 108.224 18.7971C108.456 18.9029 108.639 19.0485 108.772 19.234C108.905 19.4181 108.975 19.6297 108.981 19.8688H108.333Z" fill="white"/>
    <defs>
      <linearGradient id={`vanguard_gradient_${gradientId}`} x1="0.927734" y1="3.37599" x2="13.7277" y2="16.176" gradientUnits="userSpaceOnUse">
        <stop offset="0.373835" stopColor="#E70000"/>
        <stop offset="1" stopColor="#810000"/>
      </linearGradient>
    </defs>
  </svg>
  );
};

import { PageHeader } from './components/PageHeader';

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
    saveReflection
  } = useWorkout();
  
  const calibration = getCalibrationStatus();
  const readinessValue = calibration.readiness;
  const isCriticalReadiness = readinessValue < 20;

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(() => localStorage.getItem('volt_guest_mode') === 'true');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSafetyActive, setIsSafetyActive] = useState(false);
  const [preAuthStep, setPreAuthStep] = useState<'carousel' | 'questionnaire' | 'auth'>('carousel');
  
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
      const validViews: ViewType[] = ['analysis', 'training', 'analytics', 'settings', 'profile', 'workout-log', 'post-workout', 'berserker', 'workout-history', 'upcoming-missions'];
      if (saved && validViews.includes(saved as ViewType)) {
        return saved as ViewType;
      }
    }
    return 'analysis';
  });

  const [lastView, setLastView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volt_last_main_view');
      const mainViews: ViewType[] = ['analysis', 'training', 'analytics', 'settings', 'profile', 'deployment'];
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
    const mainViews: ViewType[] = ['analysis', 'training', 'analytics', 'settings', 'profile', 'deployment'];
    if (mainViews.includes(activeView)) {
      setLastView(activeView);
    }
  }, [activeView, lastView]);

  const [selectedHistoryWorkoutId, setSelectedHistoryWorkoutId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLifting, setIsLifting] = useState(false);

  // Search logic: check if query matches main labels or known subpages
  const getFilteredNavItems = () => {
    if (!searchQuery.trim()) return NAV_ITEMS;
    const query = searchQuery.toLowerCase();
    
    return NAV_ITEMS.filter(item => {
      const label = t(item.label).toLowerCase();
      if (label.includes(query)) return true;
      
      // Check subpages for highlighting parent
      if (item.id === 'training') {
        const subpages = ['workout', 'log', 'history', 'mission', 'berserker', 'upcoming'];
        return subpages.some(sub => sub.includes(query));
      }
      if (item.id === 'settings') {
        const subpages = ['profile', 'account', 'language', 'reset'];
        return subpages.some(sub => sub.includes(query));
      }
      if (item.id === 'analytics') {
        const subpages = ['performance', 'charts', 'data', 'metrics'];
        return subpages.some(sub => sub.includes(query));
      }
      if (item.id === 'analysis') {
        const subpages = ['recovery', 'readiness', 'dashboard', 'status'];
        return subpages.some(sub => sub.includes(query));
      }
      return false;
    });
  };

  const filteredNavItems = getFilteredNavItems();
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
        <div className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-volt animate-pulse">
          {t('app.loading')}...
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
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

    if (preAuthStep === 'carousel') {
      return (
        <WelcomeCarousel
          onSkip={() => {
            setIsSigningUp(true);
            if (localStorage.getItem('volt_pending_onboarding')) {
              setPreAuthStep('auth');
            } else {
              setPreAuthStep('questionnaire');
            }
          }}
          onSignUp={() => {
            setIsSigningUp(true);
            setPreAuthStep('auth');
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
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md w-full glass-panel px-4 py-10 md:p-10 border border-white/10 flex flex-col items-center text-center my-auto"
        >

          <h1 className="font-sans font-black tracking-tighter uppercase text-4xl text-white mb-1">
            {t('app.title')}
          </h1>
          <p className="font-sans font-bold text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-8">
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
              className="w-full bg-volt text-void py-4 font-sans font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-xl disabled:opacity-50"
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
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{t('auth.or')}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isEmailAuthLoading || isGoogleAuthLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-4 font-sans text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
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
            onClick={() => setPreAuthStep('carousel')}
            className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={12} /> Back to onboarding
          </button>

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
      case 'deployment': return <DeploymentView />;
      case 'upcoming-missions': return <UpcomingMissionsView onBack={() => setActiveView('training')} />;
      case 'settings': return <SettingsView onExit={() => setIsExitModalOpen(true)} onNavigateToProfile={() => setActiveView('profile')} />;
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
        "fixed top-0 left-0 right-0 z-50 flex md:hidden justify-center items-center px-4 md:px-10 pb-4 md:pb-8 bg-void/50 backdrop-blur-md md:bg-transparent pointer-events-none pt-safe"
      )}>
        <div className="flex flex-col items-center justify-center w-[40vw] mt-2 sm:mt-4 md:mt-8">
          <VanguardLogo className="drop-shadow-[0_0_10px_var(--primary-glow)]" />
        </div>
      </header>

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 hidden md:flex transition-all duration-500",
        (activeView === 'berserker') ? "opacity-0 -translate-x-full pointer-events-none" : "opacity-100 translate-x-0"
      )}>
        {/* Navigation Content Pane */}
        <div className="w-[260px] h-full flex flex-col justify-between py-8 px-6 border-r border-white/5 bg-void/90 backdrop-blur-3xl shadow-2xl overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-8">
            <div 
              onClick={() => setActiveView('analysis')}
              className="flex flex-col gap-1 mb-4 cursor-pointer group"
            >
              <VanguardLogo className="drop-shadow-[0_0_15px_var(--primary-glow)] group-hover:scale-105 transition-transform origin-left" />
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
                  <Box size={10} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id || 
                  (item.id === 'training' && ['workout-log', 'post-workout', 'berserker', 'workout-history', 'upcoming-missions'].includes(activeView));
                
                return (
                  <button
                    key={`pane-${item.id}`}
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "flex items-center gap-3 group transition-all duration-300 px-3 py-3 rounded-xl border border-transparent",
                      isActive ? "bg-white/[0.05] text-white border-white/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                    )}
                  >
                    <div 
                      className={cn(
                        "p-1.5 transition-colors flex items-center justify-center",
                        item.id === 'training' ? "" : "rounded-lg",
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
                      "font-sans text-[10px] uppercase tracking-[0.2em] transition-colors",
                      isActive ? "text-white font-black" : "text-zinc-500 font-bold group-hover:text-zinc-300"
                    )}>
                      {t(item.label)}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="pane-active-indicator" 
                        className="ml-auto w-1 h-3 rounded-full bg-volt shadow-[0_0_8px_var(--primary-glow)]" 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Metrics Area */}
          <div className="space-y-6">
            <div 
              onClick={() => setActiveView('profile')}
              className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
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
        (activeView === 'berserker') ? "translate-y-full" : "translate-y-0"
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
                className="relative group flex flex-col items-center gap-1 focus:outline-none"
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
          <button
            onClick={() => setActiveView('settings')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeView === 'settings' ? "text-volt" : "text-zinc-500"
            )}
          >
            <Settings size={20} strokeWidth={activeView === 'settings' ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{t('nav.settings').split(' ')[0] || 'SETTINGS'}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main 
        ref={mainRef}
        className="flex-1 w-full md:w-[calc(100%-260px)] max-w-none ml-0 md:ml-[260px] px-4 md:px-[var(--app-gutter)] relative h-full flex flex-col items-center pt-[calc(6rem+env(safe-area-inset-top))] md:pt-0 pb-24 md:pb-12 overflow-x-hidden overflow-y-auto custom-scrollbar hud-widget-grid"
      >
        <div className={cn(
          "hidden md:flex flex-col w-full md:sticky md:top-0 md:z-30 bg-void border-b border-white/5 md:mb-8 md:-mx-[var(--app-gutter)] md:px-[var(--app-gutter)] md:w-[calc(100%+2*var(--app-gutter))]",
          (activeView === 'post-workout' || activeView === 'berserker') && "md:hidden"
        )}>
          <PageHeader activeView={activeView} onBack={handlePageBack} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, scale: 0.95, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            animate={{ opacity: 1, scale: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(5px)' }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="w-full flex flex-col items-center justify-start min-w-0"
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
          localStorage.removeItem('volt_guest_mode');
          setIsGuestMode(false);
        }}
        onCancel={() => setIsExitModalOpen(false)}
      />
      <NonProgramActivityModal 
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />
      <InstallPrompt />
      <div id="a11y-live-region" className="sr-only" aria-live="polite" aria-atomic="true"></div>
    </div>
  );
}
