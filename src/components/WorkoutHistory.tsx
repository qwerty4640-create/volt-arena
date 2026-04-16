import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Search, 
  Calendar, 
  Filter, 
  ChevronRight,
  Zap,
  Clock,
  Dumbbell,
  TrendingUp,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { useWorkout, WorkoutSession } from '../contexts/WorkoutContext';

interface WorkoutHistoryProps {
  onBack: () => void;
  initialSelectedWorkoutId?: string | null;
}

export const WorkoutHistory = ({ onBack, initialSelectedWorkoutId }: WorkoutHistoryProps) => {
  const { t, unit } = useSettings();
  const { history, updateHistoryWorkout } = useWorkout();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editWorkout, setEditWorkout] = useState<WorkoutSession | null>(null);

  React.useEffect(() => {
    if (initialSelectedWorkoutId && (history?.length || 0) > 0) {
      const workout = history.find(w => w.id === initialSelectedWorkoutId);
      if (workout) {
        setSelectedWorkout(workout);
      }
    }
  }, [initialSelectedWorkoutId, history]);

  const filteredHistory = history.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.exercises && w.exercises.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={selectedWorkout && !window.matchMedia('(min-width: 1024px)').matches ? () => setSelectedWorkout(null) : onBack}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border-none flex items-center justify-center text-zinc-400 hover:text-volt transition-all"
          >
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div>
            <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">{t('analysis.workoutHistory')}</h1>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('analysis.reviewPerformance')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input 
              type="text"
              placeholder={t('analysis.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-none py-2.5 md:py-3 pl-10 md:pl-12 pr-4 md:pr-6 text-xs md:text-sm focus:outline-none transition-all w-full md:w-64"
            />
          </div>
          <button className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border-none flex items-center justify-center text-zinc-400 hover:text-volt transition-all shrink-0">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden px-4 md:px-0">
        {/* List View */}
        <div className={cn(
          "space-y-4 overflow-y-auto pr-2 custom-scrollbar",
          selectedWorkout ? "hidden lg:block" : "block"
        )}>
          {(history?.length || 0) > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((workout, i) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedWorkout(workout)}
                  className={cn(
                    "glass-panel p-6 border-white/5 cursor-pointer group transition-all duration-300",
                    selectedWorkout?.id === workout.id ? "border-volt/50 bg-volt/5" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{workout.date} • {workout.time}</span>
                      </div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight group-hover:text-volt transition-colors">
                        {workout.title}
                      </h3>
                      {workout.blockType && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-volt/10 text-volt border-none">
                            {workout.blockType}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                            {t('workout.week')} {workout.weekInBlock}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black italic text-volt">RPE {(workout.rpe || 0).toFixed(1)}</span>
                      <div className="flex items-center gap-1 text-zinc-600">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold">{workout.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {workout.exercises?.slice(0, 2).map((ex, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/5 border-none text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        {ex.name}
                      </span>
                    ))}
                    {workout.exercises && workout.exercises.length > 2 && (
                      <span className="px-3 py-1 bg-white/5 border-none text-[9px] font-black uppercase tracking-widest text-zinc-600">
                        +{workout.exercises.length - 2} {t('analysis.more')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
              {filteredHistory.length === 0 && searchQuery && (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-600 space-y-4 border-none bg-void/20">
                  <Search size={32} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('analysis.noWorkoutsMatch')}</p>
                </div>
              )}
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-6 border-none bg-void/20 p-12 text-center">
              <div className="w-20 h-20 bg-white/5 flex items-center justify-center text-zinc-500">
                <Dumbbell size={40} strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tight text-zinc-400">{t('analysis.noHistoryYet')}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 max-w-[240px] leading-relaxed">
                  {t('analysis.completeFirstWorkoutToTrack')}
                </p>
              </div>
              <button 
                onClick={onBack}
                className="px-8 py-3 bg-white/5 border-none text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-volt transition-all"
              >
                {t('analysis.goBackToTraining')}
              </button>
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className={cn(
          "h-full",
          selectedWorkout ? "block" : "hidden lg:block"
        )}>
          {(history?.length || 0) > 0 ? (
            <AnimatePresence mode="wait">
              {selectedWorkout ? (
                <motion.div
                  key={selectedWorkout.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-panel p-6 md:p-8 border-none h-full flex flex-col gap-6 md:gap-8 relative overflow-hidden"
                >
                  {/* Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-volt/5 blur-[60px] -z-10" />

                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 lg:hidden mb-2">
                        <button 
                          onClick={() => setSelectedWorkout(null)}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-volt transition-colors"
                        >
                          <ChevronLeft size={12} />
                          <span>{t('analysis.backToList')}</span>
                        </button>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-volt leading-tight">{selectedWorkout.title}</h2>
                      <div className="flex items-center gap-4 text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{selectedWorkout.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{selectedWorkout.time}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (selectedWorkout) {
                          setEditWorkout(JSON.parse(JSON.stringify(selectedWorkout)));
                          setIsEditing(true);
                        }
                      }}
                      className="w-10 h-10 bg-white/5 flex items-center justify-center text-zinc-600 hover:text-volt transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-void/40 p-3 md:p-4 border border-white/5">
                      <span className="block text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{t('analytics.volume')}</span>
                      <span className="text-xs md:text-sm font-black italic">{selectedWorkout.volume}</span>
                    </div>
                    <div className="bg-void/40 p-3 md:p-4 border border-white/5">
                      <span className="block text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{t('analysis.duration')}</span>
                      <span className="text-xs md:text-sm font-black italic">{selectedWorkout.duration}</span>
                    </div>
                    <div className="bg-void/40 p-3 md:p-4 border border-white/5 col-span-2 md:col-span-1">
                      <span className="block text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{t('analysis.avgRpe')}</span>
                      <span className="text-xs md:text-sm font-black italic text-volt">{(selectedWorkout.rpe || 0).toFixed(1)}</span>
                    </div>
                    {selectedWorkout.blockType && (
                      <div className="col-span-2 md:col-span-3 bg-volt/5 p-3 md:p-4 border-none flex justify-between items-center">
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-black uppercase tracking-widest text-volt/60 mb-1">{t('analysis.periodizationBlock')}</span>
                          <span className="text-xs md:text-sm font-black italic text-volt uppercase">{selectedWorkout.blockType}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[7px] md:text-[8px] font-black uppercase tracking-widest text-volt/60 mb-1">{t('analysis.progression')}</span>
                          <span className="text-xs md:text-sm font-black italic text-white uppercase tracking-tight">W{selectedWorkout.weekInBlock}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Dumbbell size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('analysis.exercises')}</span>
                      </div>
                      <div className="space-y-4">
                        {selectedWorkout.exercises?.map((ex, idx) => (
                          <div key={idx} className="p-4 bg-white/5 border-none">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-600 italic">
                                  {idx + 1}
                                </div>
                                <span className="text-sm font-black uppercase italic">{ex.name}</span>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{ex.sets?.length || 0} {t('analysis.sets')}</span>
                            </div>
                            <div className="space-y-2 pl-11">
                              {ex.sets?.map((set, sIdx) => (
                                <div key={sIdx} className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-zinc-500">{t('workout.set')} {sIdx + 1}</span>
                                  <span className="font-bold text-zinc-300">{set.weight}{unit === 'metric' ? 'kg' : 'lbs'} x {set.reps} @ RPE {set.rpe}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedWorkout.note && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <TrendingUp size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('analysis.sessionNotes')}</span>
                        </div>
                        <div className="p-6 bg-void/40 border-none text-sm text-zinc-400 italic font-sans leading-relaxed">
                          "{selectedWorkout.note}"
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="w-full py-4 bg-volt text-void font-black uppercase italic tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2">
                    <Zap size={16} />
                    <span>{t('analysis.repeatWorkout')}</span>
                  </button>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 border-none">
                  <Calendar size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('analysis.selectWorkoutToView')}</p>
                </div>
              )}
            </AnimatePresence>
          ) : (
            <div className="h-full glass-panel border-none flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-50">
              <TrendingUp size={48} className="text-zinc-800" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">{t('analysis.dataVisualizationWillAppear')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && editWorkout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-void/90 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] glass-panel border-none flex flex-col overflow-hidden shadow-[0_0_100px_var(--primary-glow)]"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 flex items-center justify-between bg-surface-container-high">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-volt/10 flex items-center justify-center text-volt">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">{t('analysis.editWorkout')}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{editWorkout.date} • {editWorkout.time}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="w-12 h-12 bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 bg-surface-container-low custom-scrollbar">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.workoutTitle')}</label>
                  <input 
                    type="text"
                    value={editWorkout.title}
                    onChange={(e) => setEditWorkout({ ...editWorkout, title: e.target.value })}
                    className="w-full bg-surface-container-lowest border-b-2 border-white/5 py-4 px-4 text-lg font-black italic uppercase tracking-tight text-volt focus:border-volt outline-none transition-all"
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Dumbbell size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('analysis.exercises')}</span>
                  </div>

                  <div className="space-y-8">
                    {editWorkout.exercises.map((ex, exIdx) => (
                      <div key={ex.id} className="p-6 bg-surface-container-lowest border-none space-y-6 relative overflow-hidden">
                        {/* Accent Line */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-volt/20" />
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center text-xs font-black text-zinc-500 italic">
                              {exIdx + 1}
                            </div>
                            <input 
                              type="text"
                              value={ex.name}
                              onChange={(e) => {
                                const newExercises = [...editWorkout.exercises];
                                newExercises[exIdx].name = e.target.value;
                                setEditWorkout({ ...editWorkout, exercises: newExercises });
                              }}
                              className="bg-transparent border-none text-lg font-black uppercase italic text-white focus:text-volt outline-none transition-all"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const newExercises = editWorkout.exercises.filter((_, i) => i !== exIdx);
                              setEditWorkout({ ...editWorkout, exercises: newExercises });
                            }}
                            className="text-zinc-700 hover:text-crimson transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-4 text-[8px] font-black uppercase tracking-widest text-zinc-600 px-4">
                            <div className="col-span-1">{t('workout.set')}</div>
                            <div className="col-span-1">{t('workout.weight')} ({unit === 'metric' ? 'kg' : 'lbs'})</div>
                            <div className="col-span-1">{t('workout.reps')}</div>
                            <div className="col-span-1">{t('workout.rpe')}</div>
                            <div className="col-span-1 text-right">{t('analysis.action')}</div>
                          </div>

                          {ex.sets.map((set, setIdx) => (
                            <div key={set.id} className="grid grid-cols-5 gap-4 items-center bg-surface-container-high/40 p-3 border-none">
                              <div className="text-[10px] font-black text-zinc-600 pl-1">#{setIdx + 1}</div>
                              <input 
                                type="number"
                                value={set.weight}
                                onChange={(e) => {
                                  const newExercises = [...editWorkout.exercises];
                                  newExercises[exIdx].sets[setIdx].weight = e.target.value;
                                  setEditWorkout({ ...editWorkout, exercises: newExercises });
                                }}
                                className="bg-transparent border-none text-sm font-black text-white focus:text-volt outline-none"
                              />
                              <input 
                                type="number"
                                value={set.reps}
                                onChange={(e) => {
                                  const newExercises = [...editWorkout.exercises];
                                  newExercises[exIdx].sets[setIdx].reps = e.target.value;
                                  setEditWorkout({ ...editWorkout, exercises: newExercises });
                                }}
                                className="bg-transparent border-none text-sm font-black text-white focus:text-volt outline-none"
                              />
                              <input 
                                type="number"
                                step="0.5"
                                value={set.rpe}
                                onChange={(e) => {
                                  const newExercises = [...editWorkout.exercises];
                                  newExercises[exIdx].sets[setIdx].rpe = e.target.value;
                                  setEditWorkout({ ...editWorkout, exercises: newExercises });
                                }}
                                className="bg-transparent border-none text-sm font-black text-volt outline-none"
                              />
                              <div className="flex justify-end">
                                <button 
                                  onClick={() => {
                                    const newExercises = [...editWorkout.exercises];
                                    newExercises[exIdx].sets = newExercises[exIdx].sets.filter((_, i) => i !== setIdx);
                                    setEditWorkout({ ...editWorkout, exercises: newExercises });
                                  }}
                                  className="text-zinc-700 hover:text-crimson transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}

                          <button 
                            onClick={() => {
                              const newExercises = [...editWorkout.exercises];
                              const lastSet = ex.sets[ex.sets.length - 1];
                              newExercises[exIdx].sets.push({
                                id: Math.random().toString(36).substr(2, 9),
                                weight: lastSet?.weight || '0',
                                reps: lastSet?.reps || '0',
                                rpe: lastSet?.rpe || '7',
                                isCompleted: true
                              });
                              setEditWorkout({ ...editWorkout, exercises: newExercises });
                            }}
                            className="w-full py-3 bg-surface-container-high/20 border border-dashed border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-volt hover:border-volt/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={12} />
                            <span>{t('workout.addSet')}</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    <button 
                      onClick={() => {
                        const newExercises = [...editWorkout.exercises, {
                          id: Math.random().toString(36).substr(2, 9),
                          name: 'New Exercise',
                          sets: [{
                            id: Math.random().toString(36).substr(2, 9),
                            weight: '0',
                            reps: '0',
                            rpe: '7',
                            isCompleted: true
                          }]
                        }];
                        setEditWorkout({ ...editWorkout, exercises: newExercises });
                      }}
                      className="w-full py-5 bg-surface-container-lowest border border-dashed border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-volt hover:border-volt/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      <span>{t('workout.addExercise')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.sessionNotes')}</label>
                  <textarea 
                    value={editWorkout.note || ''}
                    onChange={(e) => setEditWorkout({ ...editWorkout, note: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/5 p-6 text-sm text-zinc-400 italic font-sans leading-relaxed focus:border-volt outline-none transition-all min-h-[120px] resize-none"
                    placeholder={t('analysis.notesPlaceholder')}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 md:p-8 flex gap-4 bg-surface-container-high">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 bg-white/5 text-zinc-500 font-black uppercase italic tracking-widest hover:text-white transition-all"
                >
                  {t('analysis.discardChanges')}
                </button>
                <button 
                  onClick={async () => {
                    await updateHistoryWorkout(editWorkout);
                    setSelectedWorkout(editWorkout);
                    setIsEditing(false);
                  }}
                  className="flex-1 py-4 bg-volt text-void font-black uppercase italic tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_var(--primary-glow)]"
                >
                  <Save size={18} />
                  <span>{t('analysis.saveChanges')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
