import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Scale, Ruler, Trophy, Dumbbell, Calendar, BadgeCheck, Edit3, Info, X, Crown, Zap, Medal, Skull, CheckCircle2, BarChart3, AlertTriangle, Activity, ChevronDown, ChevronUp, ChevronLeft, MoveDown, Target, ListOrdered, Camera, Loader2, ArrowRight } from 'lucide-react';
import { useSettings, TrainingGoal } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';
import { ProgramDetailModal } from './ProgramDetailModal';
import { calculateTier, getTierStyle } from '../lib/strength';

const formatDigitsToMask = (digits: string, format: 'MM:SS' | 'HH:MM:SS'): string => {
  if (digits.length === 0) return '';
  
  if (format === 'MM:SS') {
    let formatted = '';
    for (let i = 0; i < 4; i++) {
      if (i === 2) formatted += ':';
      if (i < digits.length) {
        formatted += digits[i];
      } else {
        formatted += '_';
      }
    }
    return formatted;
  } else {
    let formatted = '';
    for (let i = 0; i < 6; i++) {
      if (i === 2 || i === 4) formatted += ':';
      if (i < digits.length) {
        formatted += digits[i];
      } else {
        formatted += '_';
      }
    }
    return formatted;
  }
};

const handleTimeMaskChange = (
  newVal: string, 
  currentVal: string, 
  format: 'MM:SS' | 'HH:MM:SS'
): string => {
  if (!newVal) return '';
  
  // If user deleted character(s)
  if (newVal.length < currentVal.length) {
    const currentDigits = currentVal.replace(/\D/g, '');
    if (currentDigits.length > 0) {
      const newDigits = currentDigits.slice(0, -1);
      return formatDigitsToMask(newDigits, format);
    }
    return '';
  }
  
  const maxDigits = format === 'MM:SS' ? 4 : 6;
  const digits = newVal.replace(/\D/g, '').slice(0, maxDigits);
  return formatDigitsToMask(digits, format);
};

export const ProfileView = ({ onBack }: { onBack?: () => void }) => {
  const { profile, updateProfile, t, unit } = useSettings();
  const { history, resetProgram } = useWorkout();
  const { showToast } = useToast();
  const [showTierInfo, setShowTierInfo] = React.useState(false);
  const [showProgramDetail, setShowProgramDetail] = React.useState(false);
  const [show1RMModal, setShow1RMModal] = React.useState(false);
  const [showBiometricsModal, setShowBiometricsModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ageError, setAgeError] = React.useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Standard restrictions
    // 1. File Type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast(t('settings.invalidFileType') || 'Only JPG, PNG and WebP are allowed', 3000, 'error');
      return;
    }

    // 2. File Size (200KB limit for Firestore storage)
    const MAX_SIZE = 200 * 1024; // 200KB
    if (file.size > MAX_SIZE) {
      showToast(t('settings.fileTooLarge') || 'Image must be less than 200KB', 3000, 'error');
      return;
    }

    setUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateProfile({ photoURL: base64String });
        showToast(t('toast.actionSuccessful'), 3000, 'success');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload failed:", error);
      showToast(t('settings.uploadFailed') || 'Failed to upload image', 3000, 'error');
    } finally {
      setUploadLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [edit1RMData, setEdit1RMData] = React.useState({
    squatPR: profile?.squatPR || 0,
    benchPR: profile?.benchPR || 0,
    deadliftPR: profile?.deadliftPR || 0,
  });

  const [showEnduranceModal, setShowEnduranceModal] = React.useState(false);
  const [editEnduranceData, setEditEnduranceData] = React.useState({
    oneMileTime: profile?.oneMileTime || '',
    fiveMileTime: profile?.fiveMileTime || '',
    halfMarathonTime: profile?.halfMarathonTime || '',
    fullMarathonTime: profile?.fullMarathonTime || '',
  });

  // Calculate current training week
  const lastWorkout = (history?.length || 0) > 0 ? history[0] : null;

  const handleUpdate1RM = async () => {
    setLoading(true);
    try {
      const newTier = calculateTier(
        edit1RMData.squatPR,
        edit1RMData.benchPR,
        edit1RMData.deadliftPR,
        profile?.weight || 0,
        profile?.gender || 'male'
      );

      await updateProfile({
        squatPR: edit1RMData.squatPR,
        benchPR: edit1RMData.benchPR,
        deadliftPR: edit1RMData.deadliftPR,
        level: newTier as any,
      });
      showToast(t('toast.actionSuccessful'), 3000, 'success');
      setShow1RMModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEndurance = async () => {
    setLoading(true);
    try {
      await updateProfile({
        oneMileTime: editEnduranceData.oneMileTime,
        fiveMileTime: editEnduranceData.fiveMileTime,
        halfMarathonTime: editEnduranceData.halfMarathonTime,
        fullMarathonTime: editEnduranceData.fullMarathonTime,
      });
      showToast(t('toast.actionSuccessful'), 3000, 'success');
      setShowEnduranceModal(false);
    } finally {
      setLoading(false);
    }
  };

  const [editData, setEditData] = React.useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    gender: profile?.gender || 'male',
    age: profile?.age || 30,
    height: profile?.height || 0,
    weight: profile?.weight || 0,
    heightFeet: Math.floor((profile?.height || 0) / 12),
    heightInches: Math.round((profile?.height || 0) % 12),
    trainingGoal: profile?.trainingGoal || 'powerbuilding' as TrainingGoal,
    trainingObjectives: profile?.trainingObjectives || (profile?.trainingGoal ? [profile.trainingGoal] : ['powerbuilding']),
    trainingDurationMonths: profile?.trainingDurationMonths || 3,
  });

  React.useEffect(() => {
    if (profile) {
      setEditData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        gender: profile.gender || 'male',
        age: profile.age || 30,
        height: profile.height || 0,
        weight: profile.weight || 0,
        heightFeet: Math.floor((profile.height || 0) / 12),
        heightInches: Math.round((profile.height || 0) % 12),
        trainingGoal: profile.trainingGoal || 'powerbuilding',
        trainingObjectives: profile.trainingObjectives || (profile.trainingGoal ? [profile.trainingGoal] : ['powerbuilding']),
        trainingDurationMonths: profile.trainingDurationMonths || 3,
      });
      setEditEnduranceData({
        oneMileTime: profile.oneMileTime || '',
        fiveMileTime: profile.fiveMileTime || '',
        halfMarathonTime: profile.halfMarathonTime || '',
        fullMarathonTime: profile.fullMarathonTime || '',
      });
    }
  }, [profile]);

  if (!profile) return null;

  const formatHeight = (h: number) => {
    if (unit === 'metric') return `${h} cm`;
    const feet = Math.floor(h / 12);
    const inches = Math.round(h % 12);
    return `${feet} ft ${inches} in`;
  };

  const handleSave = async () => {
    // Validate age
    if (editData.age % 1 !== 0) {
      setAgeError('Age must be a whole number');
      return;
    }
    setAgeError(null);

    setLoading(true);
    try {
      const heightVal = unit === 'metric'
        ? editData.height
        : (editData.heightFeet * 12) + editData.heightInches;

      const newTier = calculateTier(
        profile.squatPR || 0,
        profile.benchPR || 0,
        profile.deadliftPR || 0,
        editData.weight,
        editData.gender
      );

      const currentGoal = profile?.trainingGoal || 'powerbuilding';
      const currentDuration = profile?.trainingDurationMonths || 3;
      // Reset program if goal or duration has changed to start fresh cycle
      if (editData.trainingGoal !== currentGoal || editData.trainingDurationMonths !== currentDuration) {
        await resetProgram();
      }

      await updateProfile({
        firstName: editData.firstName,
        lastName: editData.lastName,
        gender: editData.gender as any,
        age: editData.age,
        height: heightVal,
        weight: editData.weight,
        trainingGoal: editData.trainingObjectives[0] || 'powerbuilding',
        trainingObjectives: editData.trainingObjectives,
        trainingDurationMonths: editData.trainingDurationMonths,
        level: newTier as any,
      });
      showToast(t('toast.actionSuccessful'), 3000, 'success');
      setShowBiometricsModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getTierStyleLocal = (tier: string) => {
    const style = getTierStyle(tier);
    return {
      ...style,
      icon: (tier === 'elite' ? Skull : (['advanced', 'intermediate'].includes(tier) ? Trophy : Medal)),
      animation: ''
    };
  };

  const tierStyle = getTierStyleLocal(profile?.level || 'untrained');
  const isElite = profile.level === 'elite';

  const stats = [
    { label: t('onboarding.squat'), value: profile.squatPR || 0, icon: Dumbbell, color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]', animation: '' },
    { label: t('onboarding.bench'), value: profile.benchPR || 0, icon: Dumbbell, color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]', animation: '' },
    { label: t('onboarding.deadlift'), value: profile.deadliftPR || 0, icon: Dumbbell, color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]', animation: '' },
    { label: t('analysis.total'), value: (profile.squatPR || 0) + (profile.benchPR || 0) + (profile.deadliftPR || 0), icon: tierStyle.icon, color: tierStyle.color, glow: tierStyle.glow, animation: tierStyle.animation },
  ];

  return (
    <div className="w-full max-w-7xl space-y-6 md:space-y-8 md:px-0 relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {onBack && (
        <div className="flex items-center mb-6 md:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
          </button>
        </div>
      )}
      {/* Header Section */}
      <div className="relative border border-white/5 bg-surface-high p-6 md:p-8 mb-8 md:mb-12 shadow-2xl overflow-hidden group">
        {/* Decorative corner elements for tactical feel */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

        <div className="absolute top-0 right-0 w-64 h-64 bg-volt/5 blur-3xl -z-10 rounded-full group-hover:bg-volt/10 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-volt/20 to-transparent" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <User className="text-volt" size={20} />
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">Profile</h3>
          </div>
          <button
            onClick={() => setShowBiometricsModal(true)}
            className="p-2 bg-volt/10 border border-volt/30 text-volt hover:bg-volt/20 hover:border-volt transition-all shadow-[0_0_10px_rgba(0,182,255,0.1)]"
          >
            <Edit3 size={14} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-30 h-30 md:w-30 md:h-30 border border-white/10 p-1 bg-void shadow-xl relative">
                <div className="w-full h-full overflow-hidden bg-zinc-900 border border-white/5 aspect-square">
                  <img
                    src={profile.photoURL || "https://picsum.photos/seed/athlete/200/200"}
                    alt={profile.displayName || "Athlete"}
                    className={cn(
                      "w-full h-full object-cover",
                      uploadLoading && "opacity-30 grayscale"
                    )}
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Upload indicator */}
                {uploadLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="text-volt animate-spin" size={24} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4 pt-1">
            <div className="space-y-1">
              <div className="flex flex-col md:flex-row items-center justify-start gap-3">
                <div className="flex flex-col md:items-start items-center gap-1">
                  <h2 className="font-sans text-3xl md:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <div className="flex flex-col md:items-start items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-widest",
                      profile.level === 'elite' ? "bg-[#9333EA]/10 border-[#9333EA]/50 text-[#9333EA] shadow-[0_0_10px_rgba(147,51,234,0.2)]" :
                        profile.level === 'advanced' ? "bg-[#FFD700]/10 border-[#FFD700]/50 text-[#FFD700]" :
                          profile.level === 'intermediate' ? "bg-white/10 border-white/50 text-white" :
                            "bg-volt/10 border-volt/50 text-volt shadow-[0_0_10px_rgba(204,255,0,0.1)]"
                    )}>
                      <tierStyle.icon size={10} className={cn(tierStyle.glow, "mb-px")} />
                      {profile.level}
                      <button
                        onClick={() => setShowTierInfo(true)}
                        className="ml-1 p-0.5 hover:bg-white/10 transition-colors opacity-80 hover:opacity-100"
                      >
                        <Info size={10} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 px-1 opacity-60">
                      <Calendar size={8} className="text-volt" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                        Active since {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2026'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent my-4 hidden md:block" />

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-8 md:pt-2">
              <div className="flex flex-col gap-1 items-center md:items-start text-zinc-500">
                <span className="text-xs font-black uppercase tracking-widest mb-0.5 opacity-60">Age</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">{profile.age || 'N/A'}</span>
              </div>

              <div className="hidden md:block w-px h-6 bg-white/10" />

              <div className="flex flex-col gap-1 items-center md:items-start text-zinc-500">
                <span className="text-xs font-black uppercase tracking-widest mb-0.5 opacity-60">Gender</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">{t(`gender.${profile.gender}` || 'gender.other')}</span>
              </div>

              <div className="hidden md:block w-px h-6 bg-white/10" />

              <div className="flex flex-col gap-1 items-center md:items-start text-zinc-500">
                <span className="text-xs font-black uppercase tracking-widest mb-0.5 opacity-60">Height / Wt</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {formatHeight(profile.height || 0)} / {profile.weight || 0} {unit === 'metric' ? 'kg' : 'LBS'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5 opacity-60 relative z-10">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            SYS_STATUS: ACTIVE
          </span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            REF_ID: OPERATOR_DOSSIER
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel px-4 py-8 md:p-6 space-y-6 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Decorative corner elements for tactical feel */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="text-volt" size={20} />
                <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('analysis.performanceMetrics')}</h3>
              </div>
              <button
                onClick={() => {
                  setEdit1RMData({
                    squatPR: profile.squatPR || 0,
                    benchPR: profile.benchPR || 0,
                    deadliftPR: profile.deadliftPR || 0,
                  });
                  setShow1RMModal(true);
                }}
                className="p-2 bg-volt/10 border border-volt/30 text-volt hover:bg-volt/20 hover:border-volt transition-all shadow-[0_0_10px_rgba(0,182,255,0.1)]"
              >
                <Edit3 size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-8 bg-void/60 border-l-4 border-volt relative overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4 relative z-10">{t('analysis.totalLiftWeight')}</p>
                <div className="flex items-baseline gap-4 relative z-10">
                  <span className="text-7xl font-sans font-black text-volt tracking-tighter drop-shadow-[0_0_30px_var(--primary-glow)]">
                    {(profile.squatPR || 0) + (profile.benchPR || 0) + (profile.deadliftPR || 0)}
                  </span>
                  <span className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">{unit === 'metric' ? 'kg' : 'LBS'}</span>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-volt/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {stats.filter(s => s.label !== 'Total').map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-4 bg-void/40 border border-white/5 hover:border-volt/20 transition-colors group/item">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 bg-white/5 transition-all group-hover/item:bg-volt/10", stat.color)}>
                        <stat.icon size={14} strokeWidth={3} className={cn(stat.glow)} />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-volt transition-colors">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-sans font-black text-white">{stat.value}</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase">{unit === 'metric' ? 'kg' : 'LBS'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5 opacity-60">
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
              SYS_STATUS: ACTIVE
            </span>
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
              REF_ID: STRENGTH_1RM
            </span>
          </div>
        </motion.div>

        {/* Endurance Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel px-4 py-8 md:p-6 space-y-6 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Decorative corner elements for tactical feel */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="text-volt" size={20} />
                <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white">{t('settings.endurancePRs') || 'Endurance PRs'}</h3>
              </div>
              <button
                onClick={() => {
                  setEditEnduranceData({
                    oneMileTime: profile.oneMileTime || '',
                    fiveMileTime: profile.fiveMileTime || '',
                    halfMarathonTime: profile.halfMarathonTime || '',
                    fullMarathonTime: profile.fullMarathonTime || '',
                  });
                  setShowEnduranceModal(true);
                }}
                className="p-2 bg-volt/10 border border-volt/30 text-volt hover:bg-volt/20 hover:border-volt transition-all shadow-[0_0_10px_rgba(0,182,255,0.1)]"
              >
                <Edit3 size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-8 bg-void/60 border-l-4 border-volt relative overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4 relative z-10">{t('settings.aerobicClassification') || 'Aerobic Classification'}</p>
                <div className="flex items-baseline gap-4 relative z-10">
                  <span className="text-7xl font-sans font-black text-volt tracking-tighter drop-shadow-[0_0_30px_var(--primary-glow)] uppercase">
                    {profile.oneMileTime || profile.fiveMileTime || profile.halfMarathonTime || profile.fullMarathonTime ? 'ACTIVE' : 'BASELINE'}
                  </span>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-volt/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: t('settings.oneMileGoal') || '1 Mile Time', value: profile.oneMileTime || '--:--', color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]' },
                  { label: t('settings.fiveMileGoal') || '5 Mile Time', value: profile.fiveMileTime || '--:--', color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]' },
                  { label: t('settings.halfMarathon') || 'Half Marathon', value: profile.halfMarathonTime || '--:--', color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]' },
                  { label: t('settings.fullMarathon') || 'Full Marathon', value: profile.fullMarathonTime || '--:--', color: 'text-volt', glow: 'drop-shadow-[0_0_5px_var(--primary-glow)]' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-void/40 border border-white/5 hover:border-volt/20 transition-colors group/item">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 bg-white/5 transition-all group-hover/item:bg-volt/10", item.color)}>
                        <Activity size={14} strokeWidth={3} className={cn(item.glow)} />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-volt transition-colors">{item.label}</span>
                    </div>
                    <span className="text-lg font-sans font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5 opacity-60">
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
              SYS_STATUS: ACTIVE
            </span>
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
              REF_ID: ENDURANCE_PERF
            </span>
          </div>
        </motion.div>
      </div>

      <ProgramDetailModal
        isOpen={showProgramDetail}
        onClose={() => setShowProgramDetail(false)}
        missionPeriod={profile.missionPeriod || '3M'}
        trainingObjectives={profile.trainingObjectives || (profile.trainingGoal ? [profile.trainingGoal] : ['powerbuilding'])}
        customProgramBlocks={profile.customProgramBlocks || []}
      />

      {/* Biometrics Adjustment Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showBiometricsModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowBiometricsModal(false);
                  setAgeError(null);
                }}
                className="fixed inset-0 bg-void/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/30 shadow-2xl my-auto"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 md:p-4 bg-volt/10 text-volt">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="font-sans text-2xl font-black uppercase tracking-tight text-white">Update Profile</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Edit your Operator Dossier</p>
                  </div>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group cursor-pointer" onClick={handleImageClick}>
                        <div className="w-20 h-20 border border-white/10 p-1 bg-void shadow-xl relative">
                          <div className="w-full h-full overflow-hidden bg-zinc-900 border border-white/5">
                            <img
                              src={profile.photoURL || "https://picsum.photos/seed/athlete/200/200"}
                              alt={profile.displayName || "Athlete"}
                              className={cn(
                                "w-full h-full object-cover transition-all group-hover:scale-110",
                                uploadLoading && "opacity-30 grayscale"
                              )}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-void/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-volt" size={20} />
                          </div>
                          {/* Upload indicator */}
                          {uploadLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="text-volt animate-spin" size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleImageClick}
                        disabled={uploadLoading}
                        className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-volt transition-colors flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900 border border-white/5 hover:border-volt/30"
                      >
                        <Camera size={10} />
                        Change Picture
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* First Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.firstName')}</label>
                        <input
                          type="text"
                          value={editData.firstName}
                          onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all"
                        />
                      </div>
                      {/* Last Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('onboarding.lastName')}</label>
                        <input
                          type="text"
                          value={editData.lastName}
                          onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                          placeholder="Doe"
                          className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Gender */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settings.gender')}</label>
                        <select
                          value={editData.gender}
                          onChange={(e) => setEditData({ ...editData, gender: e.target.value as any })}
                          className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all"
                        >
                          <option value="male">{t('gender.male')}</option>
                          <option value="female">{t('gender.female')}</option>
                          <option value="other">{t('gender.other')}</option>
                        </select>
                      </div>

                      {/* Age */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settings.age')}</label>
                        <input
                          type="number"
                          step="1"
                          value={editData.age === 0 ? '' : editData.age}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEditData({ ...editData, age: isNaN(val) ? 0 : val });
                            if (val % 1 !== 0) {
                              setAgeError(t('auth.invalidAgeWholeNumber') || 'Age must be a whole number');
                            } else {
                              setAgeError(null);
                            }
                          }}
                          className={cn(
                            "w-full bg-surface-container-lowest border-b-2 p-4 text-white font-sans text-xl font-black  outline-none transition-all text-center",
                            ageError ? "border-crimson text-crimson" : "border-white/5 focus:border-volt"
                          )}
                        />
                        {ageError && (
                          <p className="text-[8px] font-bold uppercase tracking-widest text-crimson mt-1 text-center">{ageError}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Height */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settings.height')}</label>
                        {unit === 'metric' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editData.height === 0 ? '' : editData.height}
                              onChange={(e) => setEditData({ ...editData, height: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                            />
                            <span className="text-xs font-bold text-zinc-500">CM</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <input
                                type="number"
                                value={editData.heightFeet === 0 ? '' : editData.heightFeet}
                                onChange={(e) => setEditData({ ...editData, heightFeet: parseInt(e.target.value) || 0 })}
                                className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <input
                                type="number"
                                value={editData.heightInches === 0 ? '' : editData.heightInches}
                                onChange={(e) => setEditData({ ...editData, heightInches: parseInt(e.target.value) || 0 })}
                                className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                              />
                            </div>
                          </div>
                        )}
                        {!(unit === 'metric') && (
                          <div className="flex gap-2">
                            <p className="flex-1 text-[8px] font-bold text-zinc-500 text-center uppercase">{t('settings.feet')}</p>
                            <p className="flex-1 text-[8px] font-bold text-zinc-500 text-center uppercase">{t('settings.inches')}</p>
                          </div>
                        )}
                      </div>

                      {/* Weight */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settings.weight')} ({unit === 'metric' ? 'kg' : 'LBS'})</label>
                        <input
                          type="number"
                          value={editData.weight === 0 ? '' : editData.weight}
                          onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setShowBiometricsModal(false);
                      setAgeError(null);
                    }}
                    className="btn-secondary flex-1 py-4"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || !!ageError}
                    className="btn-primary flex-2 py-4"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 1RM Adjustment Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {show1RMModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShow1RMModal(false)}
                className="fixed inset-0 bg-void/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/30 shadow-2xl my-auto"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 md:p-4 bg-volt/10 text-volt">
                    <Dumbbell size={32} />
                  </div>
                  <div>
                    <h3 className="font-sans text-2xl font-black uppercase tracking-tight text-white">{t('settings.update1rm')}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('settings.currentMaxes')}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">Squat ({unit === 'metric' ? 'kg' : 'LBS'})</label>
                      <input
                        type="number"
                        value={edit1RMData.squatPR === 0 ? '' : edit1RMData.squatPR}
                        onChange={(e) => setEdit1RMData({ ...edit1RMData, squatPR: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">Bench ({unit === 'metric' ? 'kg' : 'LBS'})</label>
                      <input
                        type="number"
                        value={edit1RMData.benchPR === 0 ? '' : edit1RMData.benchPR}
                        onChange={(e) => setEdit1RMData({ ...edit1RMData, benchPR: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">Deadlift ({unit === 'metric' ? 'kg' : 'LBS'})</label>
                      <input
                        type="number"
                        value={edit1RMData.deadliftPR === 0 ? '' : edit1RMData.deadliftPR}
                        onChange={(e) => setEdit1RMData({ ...edit1RMData, deadliftPR: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-sans text-xl font-black focus:border-volt outline-none transition-all text-center"
                      />
                    </div>
                  </div>

                  {/* Tier Preview */}
                  {/*}
                  <div className="p-4 bg-void/40 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('settings.projectedTier') || "Projected Tier"}</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                        getTierStyleLocal(calculateTier(
                          edit1RMData.squatPR,
                          edit1RMData.benchPR,
                          edit1RMData.deadliftPR,
                          profile?.weight || 0,
                          profile?.gender || 'male'
                        )).bg,
                        getTierStyleLocal(calculateTier(
                          edit1RMData.squatPR,
                          edit1RMData.benchPR,
                          edit1RMData.deadliftPR,
                          profile?.weight || 0,
                          profile?.gender || 'male'
                        )).color
                      )}>
                        {calculateTier(
                          edit1RMData.squatPR,
                          edit1RMData.benchPR,
                          edit1RMData.deadliftPR,
                          profile.weight || 0,
                          profile.gender || 'male'
                        )}
                      </span>
                    </div>
                    <p className="text-[8px] text-zinc-500 font-medium uppercase tracking-widest leading-relaxed">
                      {t('settings.tierRecalibrationNote')} <span className="text-white font-bold">{calculateTier(
                        edit1RMData.squatPR,
                        edit1RMData.benchPR,
                        edit1RMData.deadliftPR,
                        profile.weight || 0,
                        profile.gender || 'male'
                      )}</span>.
                    </p>
                  </div>
                  {*/}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShow1RMModal(false)}
                      className="btn-secondary flex-1 py-4"
                    >
                      {t('common.close')}
                    </button>
                    <button
                      onClick={handleUpdate1RM}
                      disabled={loading}
                      className="btn-primary flex-2 py-4"
                    >
                      {loading ? t('settings.recalculate') : t('coach.confirm')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Endurance PRs Adjustment Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showEnduranceModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEnduranceModal(false)}
                className="fixed inset-0 bg-void/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md glass-panel p-4 md:p-8 border-volt/30 shadow-2xl my-auto"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 md:p-4 bg-volt/10 text-volt">
                    <Activity size={32} />
                  </div>
                  <div>
                    <h3 className="font-sans text-2xl font-black uppercase tracking-tight text-white">{t('settings.updateEndurance') || 'Update Endurance'}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('settings.endurancePRs') || 'Endurance Personal Records'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">{t('settings.oneMileGoal') || '1 Mile Time'}</label>
                      <input
                        type="text"
                        placeholder="__:__"
                        value={editEnduranceData.oneMileTime}
                        onChange={(e) => setEditEnduranceData({ 
                          ...editEnduranceData, 
                          oneMileTime: handleTimeMaskChange(e.target.value, editEnduranceData.oneMileTime, 'MM:SS') 
                        })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-mono text-xl font-black focus:border-volt outline-none transition-all text-center tracking-[0.15em] placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">{t('settings.fiveMileGoal') || '5 Mile Time'}</label>
                      <input
                        type="text"
                        placeholder="__:__"
                        value={editEnduranceData.fiveMileTime}
                        onChange={(e) => setEditEnduranceData({ 
                          ...editEnduranceData, 
                          fiveMileTime: handleTimeMaskChange(e.target.value, editEnduranceData.fiveMileTime, 'MM:SS') 
                        })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-mono text-xl font-black focus:border-volt outline-none transition-all text-center tracking-[0.15em] placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">{t('settings.halfMarathon') || 'Half Marathon'}</label>
                      <input
                        type="text"
                        placeholder="__:__:__"
                        value={editEnduranceData.halfMarathonTime}
                        onChange={(e) => setEditEnduranceData({ 
                          ...editEnduranceData, 
                          halfMarathonTime: handleTimeMaskChange(e.target.value, editEnduranceData.halfMarathonTime, 'HH:MM:SS') 
                        })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-mono text-xl font-black focus:border-volt outline-none transition-all text-center tracking-[0.15em] placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white">{t('settings.fullMarathon') || 'Full Marathon'}</label>
                      <input
                        type="text"
                        placeholder="__:__:__"
                        value={editEnduranceData.fullMarathonTime}
                        onChange={(e) => setEditEnduranceData({ 
                          ...editEnduranceData, 
                          fullMarathonTime: handleTimeMaskChange(e.target.value, editEnduranceData.fullMarathonTime, 'HH:MM:SS') 
                        })}
                        className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-mono text-xl font-black focus:border-volt outline-none transition-all text-center tracking-[0.15em] placeholder-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowEnduranceModal(false)}
                      className="btn-secondary flex-1 py-4"
                    >
                      {t('common.close') || 'Close'}
                    </button>
                    <button
                      onClick={handleUpdateEndurance}
                      disabled={loading}
                      className="btn-primary flex-2 py-4"
                    >
                      {loading ? t('settings.recalculate') || 'Saving...' : t('coach.confirm') || 'Confirm'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Tier Info Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showTierInfo && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTierInfo(false)}
                className="fixed inset-0 bg-void/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-panel p-3 md:p-6 border-volt/30 shadow-2xl my-auto"
              >

                <div className="absolute top-0 right-0 p-6">
                  <button
                    onClick={() => setShowTierInfo(false)}
                    className="p-2 bg-white/5 text-zinc-500 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  {/*}
                  <div className="p-2 md:p-4 bg-volt/10 text-volt">
                    <ListOrdered size={32} />
                  </div>
                  {*/}
                  <div>
                    <h3 className="font-sans text-2xl font-black uppercase tracking-tight text-white">Strength Standards</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tier Designation Logic</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Your tier is calculated based on your <span className="text-white font-bold uppercase">Strength-to-Bodyweight Ratio</span>.
                    This is the sum of your Squat, Bench, and Deadlift PRs divided by your bodyweight.
                  </p>

                  <div className="space-y-4">
                    {[
                      { name: 'Elite', male: '> 5.8x', female: '> 3.8x', icon: Skull, color: 'text-[#9333EA]', bg: 'bg-[#9333EA]/10', glow: 'drop-shadow-[0_0_20px_#3b82f6]', animation: '' },
                      { name: 'Advanced', male: '> 4.5x', female: '> 2.9x', icon: Trophy, color: 'text-[#8B8000]', bg: 'bg-[#8B8000]/10', glow: 'drop-shadow-[0_0_15px_#8B8000]', animation: '' },
                      { name: 'Intermediate', male: '> 3.6x', female: '> 2.3x', icon: Trophy, color: 'text-white', bg: 'bg-white/10', glow: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]', animation: '' },
                      { name: 'Novice', male: '> 2.4x', female: '> 1.5x', icon: Medal, color: 'text-volt', bg: 'bg-volt/10', glow: '', animation: '' },
                      { name: 'Untrained', male: 'Baseline', female: 'Baseline', icon: Medal, color: 'text-zinc-500', bg: 'bg-zinc-500/10', glow: '', animation: '' },
                    ].map((tier) => (
                      <div key={tier.name} className={cn(
                        "flex items-center justify-between p-4 border transition-all",
                        profile.level === tier.name.toLowerCase() ? `bg-white/5 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]` : "bg-void/40 border-white/5"
                      )}
                        style={profile.level === tier.name.toLowerCase() ? { borderColor: tier.color.includes('[') ? tier.color.split('[')[1].split(']')[0] : 'var(--primary-color)' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 relative overflow-hidden", tier.bg)}>
                            <div className={cn("flex items-center justify-center", tier.animation)}>
                              <tier.icon size={16} className={cn(tier.color, tier.glow)} />
                            </div>
                          </div>
                          <span className={cn("font-sans text-sm font-black uppercase tracking-widest", tier.color)}>
                            {tier.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Ratio (M/F)</p>
                          <p className="text-xs font-bold text-white uppercase tracking-tighter">{tier.male} / {tier.female}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
