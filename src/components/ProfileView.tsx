import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Scale, Ruler, Trophy, Dumbbell, Calendar, BadgeCheck, Edit3, Info, X, Crown, Zap, Medal, Skull, CheckCircle2, BarChart3, AlertTriangle, Activity, ChevronDown, ChevronUp, MoveDown, Target, ListOrdered } from 'lucide-react';
import { useSettings, TrainingGoal } from '../contexts/SettingsContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { getBlockForWeek, getPlanForDuration } from '../constants/periodization';
import { calculateTier } from '../lib/strength';

export const ProfileView = () => {
  const { profile, updateProfile, t, unit } = useSettings();
  const { history, resetProgram } = useWorkout();
  const [showTierInfo, setShowTierInfo] = React.useState(false);
  const [showProtocolModal, setShowProtocolModal] = React.useState(false);
  const [show1RMModal, setShow1RMModal] = React.useState(false);
  const [showBiometricsModal, setShowBiometricsModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ageError, setAgeError] = React.useState<string | null>(null);
  const [adjustingDuration, setAdjustingDuration] = React.useState(profile?.trainingDurationMonths || 3);
  const [adjustingFrequency, setAdjustingFrequency] = React.useState(profile?.trainingFrequency || 3);
  const [edit1RMData, setEdit1RMData] = React.useState({
    squatPR: profile?.squatPR || 0,
    benchPR: profile?.benchPR || 0,
    deadliftPR: profile?.deadliftPR || 0,
  });

  // Calculate current training week
  const lastWorkout = (history?.length || 0) > 0 ? history[0] : null;
  const lastWeekMatch = lastWorkout?.title.match(/W(\d+)/);
  const lastWeek = lastWeekMatch ? parseInt(lastWeekMatch[1]) : 1;
  const currentWeek = lastWeek + (profile?.trainingWeekOffset || 0);
  const { block, weekInBlock, plan } = getBlockForWeek(currentWeek, (profile?.trainingDurationMonths || 3) * 4, profile?.trainingGoal || 'powerbuilding');

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
      setShow1RMModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustProtocol = async () => {
    setLoading(true);
    try {
      // Calculate new competition date based on duration from now
      const newCompetitionDate = Date.now() + (adjustingDuration * 30 * 24 * 60 * 60 * 1000);
      
      // If duration changed, we reset the program cycle
      if (adjustingDuration !== profile?.trainingDurationMonths) {
        await resetProgram();
      }
      
      await updateProfile({ 
        trainingDurationMonths: adjustingDuration,
        trainingFrequency: adjustingFrequency,
        competitionDate: newCompetitionDate,
        trainingWeekOffset: 0
      });
      setShowProtocolModal(false);
    } finally {
      setLoading(false);
    }
  };
  const [editData, setEditData] = React.useState({
    gender: profile?.gender || 'male',
    age: profile?.age || 30,
    height: profile?.height || 0,
    weight: profile?.weight || 0,
    heightFeet: Math.floor((profile?.height || 0) / 12),
    heightInches: Math.round((profile?.height || 0) % 12),
    trainingGoal: profile?.trainingGoal || 'powerbuilding' as TrainingGoal,
    trainingDurationMonths: profile?.trainingDurationMonths || 3,
  });

  React.useEffect(() => {
    if (profile) {
      setEditData({
        gender: profile.gender || 'male',
        age: profile.age || 30,
        height: profile.height || 0,
        weight: profile.weight || 0,
        heightFeet: Math.floor((profile.height || 0) / 12),
        heightInches: Math.round((profile.height || 0) % 12),
        trainingGoal: profile.trainingGoal || 'powerbuilding',
        trainingDurationMonths: profile.trainingDurationMonths || 3,
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

      // Reset program if goal or duration has changed to start fresh cycle
      if (editData.trainingGoal !== profile?.trainingGoal || editData.trainingDurationMonths !== profile?.trainingDurationMonths) {
        await resetProgram();
      }

      await updateProfile({
        gender: editData.gender as any,
        age: editData.age,
        height: heightVal,
        weight: editData.weight,
        trainingGoal: editData.trainingGoal,
        trainingDurationMonths: editData.trainingDurationMonths,
        level: newTier as any,
      });
      setShowBiometricsModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'untrained': 
      case 'novice': 
      case 'newbie': 
        return { 
          icon: Medal, 
          color: 'text-volt', 
          bg: 'bg-volt/10',
          glow: '',
          animation: ''
        };
      case 'intermediate': 
        return { 
          icon: Trophy, 
          color: 'text-white', 
          bg: 'bg-white/10',
          glow: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]',
          animation: ''
        };
      case 'advanced': 
        return { 
          icon: Trophy, 
          color: 'text-[#FFD700]', 
          bg: 'bg-[#FFD700]/10',
          glow: 'drop-shadow-[0_0_15px_#ff4500]',
          animation: ''
        };
      case 'elite': 
        return { 
          icon: Skull, 
          color: 'text-[#9333EA]', 
          bg: 'bg-[#9333EA]/10',
          glow: 'drop-shadow-[0_0_20px_#3b82f6]',
          animation: ''
        };
      default: 
        return { 
          icon: Trophy, 
          color: 'text-volt', 
          bg: 'bg-volt/10',
          glow: '',
          animation: ''
        };
    }
  };

  const tierStyle = getTierStyle(profile.level);
  const isElite = profile.level === 'elite';

  const stats = [
    { label: 'Squat', value: profile.squatPR || 0, icon: Dumbbell, color: 'text-volt', glow: 'drop-shadow-[0_0_5px_rgba(0,182,255,0.5)]', animation: '' },
    { label: 'Bench', value: profile.benchPR || 0, icon: Dumbbell, color: 'text-volt', glow: 'drop-shadow-[0_0_5px_rgba(0,182,255,0.5)]', animation: '' },
    { label: 'Deadlift', value: profile.deadliftPR || 0, icon: Dumbbell, color: 'text-volt', glow: 'drop-shadow-[0_0_5px_rgba(0,182,255,0.5)]', animation: '' },
    { label: 'Total', value: (profile.squatPR || 0) + (profile.benchPR || 0) + (profile.deadliftPR || 0), icon: tierStyle.icon, color: tierStyle.color, glow: tierStyle.glow, animation: tierStyle.animation },
  ];

  return (
    <div className="w-full max-w-7xl space-y-6 md:space-y-8 px-2 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8 md:mb-12">
        <div className="relative group">
          <div className="w-24 h-24 md:w-32 md:h-32 border-none overflow-hidden bg-surface-high shadow-2xl">
            <img 
              src={profile.photoURL || "https://picsum.photos/seed/athlete/200/200"} 
              alt={profile.displayName || "Athlete"} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-volt flex items-center justify-center text-void shadow-lg">
            <BadgeCheck size={16} md:size={20} />
          </div>
        </div>

        <div className="text-left space-y-2">
          <div className="flex flex-col md:flex-row items-center justify-start gap-2 md:gap-3">
            <h2 className="font-headline text-3xl md:text-5xl font-black uppercase italic tracking-tight text-white">
              {profile.firstName} {profile.lastName}
            </h2>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 border text-[10px] font-black uppercase tracking-widest transition-all",
              profile.level === 'elite' ? "bg-[#9333EA]/20 border-[#9333EA] text-[#9333EA] shadow-[0_0_15px_rgba(147,51,234,0.3)]" : 
              profile.level === 'advanced' ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]" :
              profile.level === 'intermediate' ? "bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" :
              "bg-volt/20 border-volt text-volt"
            )}>
              <div className={cn("flex items-center justify-center", tierStyle.animation)}>
                <tierStyle.icon size={10} className={cn(tierStyle.glow)} />
              </div>
              {profile.level}
              <button 
                onClick={() => setShowTierInfo(true)}
                className="ml-1 p-0.5 hover:bg-white/10 transition-colors"
              >
                <Info size={10} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-zinc-500">
            <div className="flex items-center gap-2">
              <Mail size={14} md:size={16} />
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} md:size={16} />
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel px-4 py-8 md:p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-volt" size={20} />
              <h3 className="font-headline text-sm font-black uppercase tracking-widest text-white">Performance Metrics</h3>
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
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 relative z-10">Total Lift Weight</p>
              <div className="flex items-baseline gap-4 relative z-10">
                <span className="text-7xl font-headline font-black text-volt italic tracking-tighter drop-shadow-[0_0_30px_rgba(0,182,255,0.4)]">
                  {(profile.squatPR || 0) + (profile.benchPR || 0) + (profile.deadliftPR || 0)}
                </span>
                <span className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">{unit === 'metric' ? 'kg' : 'lb'}</span>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover/item:text-zinc-300">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-headline font-black text-white italic">{stat.value}</span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">{unit === 'metric' ? 'kg' : 'lb'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Biometrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel px-4 py-8 md:p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-volt" size={20} />
              <h3 className="font-headline text-sm font-black uppercase tracking-widest text-white">Biometrics</h3>
            </div>
            <button 
              onClick={() => setShowBiometricsModal(true)}
              className="p-2 bg-volt/10 border border-volt/30 text-volt hover:bg-volt/20 hover:border-volt transition-all shadow-[0_0_10px_rgba(0,182,255,0.1)]"
            >
              <Edit3 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-4 p-4 bg-void/40 border border-white/5">
              <Target size={18} className="text-zinc-500" />
              <div className="flex-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Objective</p>
                <p className="text-xs font-bold text-white uppercase tracking-widest">{t(`goal.${profile.trainingGoal}`)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-void/40 border border-white/5">
              <User size={18} className="text-zinc-500" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Gender</p>
                <p className="text-xs font-bold text-white uppercase">{profile.gender || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-void/40 border border-white/5">
              <User size={18} className="text-zinc-500" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Age</p>
                <p className="text-xs font-bold text-white uppercase">{profile.age || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-void/40 border border-white/5">
              <Ruler size={18} className="text-zinc-500" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Height</p>
                <p className="text-xs font-bold text-white uppercase">{formatHeight(profile.height || 0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-void/40 border border-white/5">
              <Scale size={18} className="text-zinc-500" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Weight</p>
                <p className="text-xs font-bold text-white uppercase">{profile.weight || 0} {unit === 'metric' ? 'kg' : 'lb'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline & Frequency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel px-4 py-8 md:p-6 border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-volt/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <Zap className="text-volt" size={20} />
              <h3 className="font-headline text-sm font-black uppercase tracking-widest text-white">Timeline & Frequency</h3>
            </div>
            <button 
              onClick={() => setShowProtocolModal(true)}
              className="p-2 bg-volt/10 border border-volt/30 text-volt hover:bg-volt/20 hover:border-volt transition-all shadow-[0_0_10px_rgba(0,182,255,0.1)]"
            >
              <Edit3 size={14} />
            </button>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-void/40 border border-white/5">
                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-1">Current Block</p>
                <p className="text-xl font-headline font-black text-white italic uppercase truncate">{block.label || block.type}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[8px] font-black italic text-zinc-400">Week {weekInBlock} / {block.durationWeeks}</span>
                  <span className="text-[10px] font-black uppercase text-volt">Week {currentWeek}</span>
                </div>
              </div>

              <div className="p-4 bg-void/40 border border-white/5">
                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-1">Training Load</p>
                <p className="text-xl font-headline font-black text-white italic uppercase">{profile.trainingFrequency || 3} Sessions / Wk</p>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[6px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Weekly Distribution</span>
                    <span>{Math.round(((profile.trainingFrequency || 3) / 7) * 100)}%</span>
                  </div>
                  <div className="h-0.5 bg-white/5 overflow-hidden">
                    <motion.div 
                      animate={{ width: `${((profile.trainingFrequency || 3) / 7) * 100}%` }}
                      className="h-full bg-volt shadow-[0_0_5px_var(--primary-glow)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-void/40 border border-white/5 text-left">
                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-1">To Competition</p>
                <p className="text-base font-headline font-black text-volt italic uppercase">
                  {profile.competitionDate ? Math.max(0, Math.ceil((profile.competitionDate - Date.now()) / (7 * 24 * 60 * 60 * 1000))) : (profile.trainingDurationMonths || 3) * 4} WKS
                </p>
              </div>
              <div className="p-3 bg-void/40 border border-white/5 text-left">
                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Duration</p>
                <p className="text-base font-headline font-black text-white italic uppercase">
                  {profile.trainingDurationMonths || 3} MONTHS
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Biometrics Adjustment Modal */}
      <AnimatePresence>
        {showBiometricsModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
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
              className="relative w-full max-w-md glass-panel p-8 border-volt/30 shadow-2xl my-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-volt/10 text-volt">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-black uppercase italic tracking-tight text-white">Biometrics</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Update Physical Data</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Gender</label>
                    <select
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value as any })}
                      className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Age</label>
                    <input
                      type="number"
                      step="1"
                      value={editData.age}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEditData({ ...editData, age: isNaN(val) ? 0 : val });
                        if (val % 1 !== 0) {
                          setAgeError('Age must be a whole number');
                        } else {
                          setAgeError(null);
                        }
                      }}
                      className={cn(
                        "w-full bg-surface-container-lowest border-b-2 p-4 text-white font-headline text-xl font-black italic outline-none transition-all text-center",
                        ageError ? "border-crimson text-crimson" : "border-white/5 focus:border-volt"
                      )}
                    />
                    {ageError && (
                      <p className="text-[8px] font-black uppercase tracking-widest text-crimson mt-1 text-center">{ageError}</p>
                    )}
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Height</label>
                    {unit === 'metric' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editData.height}
                          onChange={(e) => setEditData({ ...editData, height: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                        />
                        <span className="text-xs font-black text-zinc-500">CM</span>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                          <input
                            type="number"
                            value={editData.heightFeet}
                            onChange={(e) => setEditData({ ...editData, heightFeet: parseInt(e.target.value) || 0 })}
                            className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                          />
                          <p className="text-[8px] font-black text-zinc-500 text-center uppercase">Feet</p>
                        </div>
                        <div className="flex-1 space-y-1">
                          <input
                            type="number"
                            value={editData.heightInches}
                            onChange={(e) => setEditData({ ...editData, heightInches: parseInt(e.target.value) || 0 })}
                            className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                          />
                          <p className="text-[8px] font-black text-zinc-500 text-center uppercase">Inches</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Weight ({unit === 'metric' ? 'kg' : 'lb'})</label>
                    <input
                      type="number"
                      value={editData.weight}
                      onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                    />
                  </div>

                  {/* Training Goal */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Training Objective</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['pure_strength', 'powerbuilding', 'hypertrophy', 'peaking', 'longevity'] as TrainingGoal[]).map(goal => (
                        <button
                          key={goal}
                          onClick={() => setEditData({ ...editData, trainingGoal: goal })}
                          className={cn(
                            "flex flex-col gap-1 p-3 border-none transition-all text-left relative group",
                            editData.trainingGoal === goal 
                              ? "bg-volt/10 text-white ring-1 ring-volt/30" 
                              : "bg-surface-variant text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-headline text-[10px] font-black uppercase tracking-widest">{t(`goal.${goal}`)}</span>
                            {editData.trainingGoal === goal && (
                              <CheckCircle2 size={12} className="text-volt" />
                            )}
                          </div>
                          <p className="text-[8px] text-zinc-500 font-medium uppercase tracking-widest leading-tight">
                            {t(`goal.${goal}.desc`)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowBiometricsModal(false);
                      setAgeError(null);
                    }}
                    className="flex-1 py-4 bg-white/5 text-zinc-500 font-headline text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading || !!ageError}
                    className="flex-1 py-4 bg-volt text-void font-headline text-xs font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_var(--primary-glow)] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Protocol Adjustment Modal */}
      <AnimatePresence>
        {showProtocolModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProtocolModal(false)}
              className="fixed inset-0 bg-void/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-panel p-8 border-volt/30 shadow-2xl my-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-volt/10 text-volt">
                  <Zap size={32} />
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-black uppercase italic tracking-tight text-white">Full Protocol</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recalibrate Timeline & Frequency</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Timeline Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Months until Competition</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 6, 9, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setAdjustingDuration(m)}
                          className={cn(
                            "py-3 border font-headline text-xs font-black uppercase tracking-widest transition-all",
                            adjustingDuration === m ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                          )}
                        >
                          {m}M
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-void/40 border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">Block Redistribution ({adjustingDuration * 4} Weeks)</p>
                    <div className="space-y-2">
                      {getPlanForDuration(adjustingDuration * 4, profile?.trainingGoal || 'powerbuilding').map((b, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px]">
                          <span className="font-black uppercase text-zinc-400">{b.label || b.type}</span>
                          <span className="font-bold text-volt">{b.durationWeeks} Weeks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frequency Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Training Frequency</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[3, 4, 5, 6, 7].map((f) => (
                        <button
                          key={f}
                          onClick={() => setAdjustingFrequency(f)}
                          className={cn(
                            "py-3 border font-headline text-xs font-black uppercase tracking-widest transition-all",
                            adjustingFrequency === f ? "bg-volt/10 border-volt text-white" : "bg-surface-variant border-white/5 text-zinc-500"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-void/40 border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">Weekly Volume Preview</p>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">
                      {adjustingFrequency} Sessions / Week
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">
                      Total Monthly Sessions: {adjustingFrequency * 4}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-volt/10 border border-volt/30 mb-8">
                <div className="flex items-start gap-3 text-left">
                  <Info size={16} className="text-volt shrink-0 mt-0.5" />
                  <p className="text-[10px] text-volt font-black uppercase tracking-widest leading-relaxed">
                    Adjusting your protocol will recalibrate your training cycle. 
                    {adjustingDuration !== profile.trainingDurationMonths && " Changing duration will restart your cycle from Week 1."}
                    History and PRs are always preserved.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowProtocolModal(false)}
                  className="flex-1 py-4 bg-white/5 text-zinc-500 font-headline text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdjustProtocol}
                  disabled={loading}
                  className="flex-1 py-4 bg-volt text-void font-headline text-xs font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_var(--primary-glow)] transition-all disabled:opacity-50"
                >
                  {loading ? 'Recalculating...' : 'Confirm Protocol'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1RM Adjustment Modal */}
      <AnimatePresence>
        {show1RMModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
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
              className="relative w-full max-w-md glass-panel p-8 border-volt/30 shadow-2xl my-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-volt/10 text-volt">
                  <Dumbbell size={32} />
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-black uppercase italic tracking-tight text-white">Update 1RM</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Maxes</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Squat ({unit === 'metric' ? 'kg' : 'lb'})</label>
                    <input
                      type="number"
                      value={edit1RMData.squatPR || ''}
                      onChange={(e) => setEdit1RMData({ ...edit1RMData, squatPR: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Bench ({unit === 'metric' ? 'kg' : 'lb'})</label>
                    <input
                      type="number"
                      value={edit1RMData.benchPR || ''}
                      onChange={(e) => setEdit1RMData({ ...edit1RMData, benchPR: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Deadlift ({unit === 'metric' ? 'kg' : 'lb'})</label>
                    <input
                      type="number"
                      value={edit1RMData.deadliftPR || ''}
                      onChange={(e) => setEdit1RMData({ ...edit1RMData, deadliftPR: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-container-lowest border-b-2 border-white/5 p-4 text-white font-headline text-xl font-black italic focus:border-volt outline-none transition-all text-center"
                    />
                  </div>
                </div>

                {/* Tier Preview */}
                <div className="p-4 bg-void/40 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Projected Tier</span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                      getTierStyle(calculateTier(
                        edit1RMData.squatPR,
                        edit1RMData.benchPR,
                        edit1RMData.deadliftPR,
                        profile.weight || 0,
                        profile.gender || 'male'
                      )).bg,
                      getTierStyle(calculateTier(
                        edit1RMData.squatPR,
                        edit1RMData.benchPR,
                        edit1RMData.deadliftPR,
                        profile.weight || 0,
                        profile.gender || 'male'
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
                    Based on these PRs and your current biometrics, 
                    your tier will be recalibrated to <span className="text-white font-bold">{calculateTier(
                      edit1RMData.squatPR,
                      edit1RMData.benchPR,
                      edit1RMData.deadliftPR,
                      profile.weight || 0,
                      profile.gender || 'male'
                    )}</span>.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShow1RMModal(false)}
                    className="flex-1 py-4 bg-white/5 text-zinc-500 font-headline text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate1RM}
                    disabled={loading}
                    className="flex-1 py-4 bg-volt text-void font-headline text-xs font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_var(--primary-glow)] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tier Info Modal */}
      <AnimatePresence>
        {showTierInfo && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
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
              className="relative w-full max-w-lg glass-panel p-8 border-volt/30 shadow-2xl my-auto"
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
                <div className="p-4 bg-volt/10 text-volt">
                  <ListOrdered size={32} />
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-black uppercase italic tracking-tight text-white">Strength Standards</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tier Designation Logic</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your tier is calculated based on your <span className="text-white font-bold italic uppercase">Strength-to-Bodyweight Ratio</span>. 
                  This is the sum of your Squat, Bench, and Deadlift PRs divided by your bodyweight.
                </p>

                <div className="space-y-4">
                  {[
                    { name: 'Elite', male: '> 5.8x', female: '> 3.8x', icon: Skull, color: 'text-[#9333EA]', bg: 'bg-[#9333EA]/10', glow: 'drop-shadow-[0_0_20px_#3b82f6]', animation: '' },
                    { name: 'Advanced', male: '> 4.5x', female: '> 2.9x', icon: Trophy, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10', glow: 'drop-shadow-[0_0_15px_#ff4500]', animation: 'animate-flaming' },
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
                        <span className={cn("font-headline text-sm font-black uppercase tracking-widest", tier.color)}>
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
      </AnimatePresence>
    </div>
  );
};
