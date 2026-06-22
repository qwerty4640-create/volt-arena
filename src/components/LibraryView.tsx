import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "../contexts/SettingsContext";
import { EXERCISE_DATABASE, ExerciseDefinition } from "../constants/exercises";
import { TRAINING_TERMS } from "../data/trainingTerms";
import { Search, Info, Settings2, X, AlertOctagon, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { ExerciseInfoModal } from "./ExerciseInfoModal";
import { LibraryDropdown } from "./LibraryDropdown";
import { useWorkout } from "../contexts/WorkoutContext";
import { getExerciseName } from "../utils/workoutUtils";

interface LibraryViewProps {
  onViewHistory?: (sessionId?: string) => void;
}

export const LibraryView = ({ onViewHistory }: LibraryViewProps) => {
  const { t } = useSettings();
  const { history } = useWorkout();
  const hasHistory = (history?.length || 0) > 0;

  const recentSevenDaysMissions = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return (history || [])
      .filter((log) => log.completedAt && log.completedAt >= sevenDaysAgo)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [history]);

  const hasRecentHistory = recentSevenDaysMissions.length > 0;

  // Mission Library states & filter computations
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("All");
  const [libraryMuscle, setLibraryMuscle] = useState("All");
  const [libraryPattern, setLibraryPattern] = useState("All");
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'pattern' | 'muscle' | null>(null);
  const [libraryInfoExercise, setLibraryInfoExercise] =
    useState<ExerciseDefinition | null>(null);

  const libraryCategories = useMemo(() => {
    const cats = new Set<string>();
    EXERCISE_DATABASE.forEach((ex: any) => {
      if (ex.category) cats.add(ex.category);
    });
    return Array.from(cats).sort();
  }, []);

  const libraryMuscles = useMemo(() => {
    const m = new Set<string>();
    EXERCISE_DATABASE.forEach((ex: any) => {
      if (ex.muscles) {
        ex.muscles.forEach((muscle: any) => m.add(muscle));
      }
    });
    return Array.from(m).sort();
  }, []);

  const libraryPatterns = useMemo(() => {
    const p = new Set<string>();
    EXERCISE_DATABASE.forEach((ex: any) => {
      if (ex.pattern) p.add(ex.pattern);
    });
    return Array.from(p).sort();
  }, []);

  const filteredLibrary = useMemo(() => {
    const searchTerms = librarySearch
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return EXERCISE_DATABASE.filter((ex: any) => {
      const matchSearch =
        searchTerms.length === 0 ||
        searchTerms.every((term) => {
          const searchableString = [
            ex.name.toLowerCase(),
            ex.category.toLowerCase(),
            ex.pattern.toLowerCase(),
            ...(ex.muscles?.map((m: any) => m.toLowerCase()) || []),
            ...(ex.description ? [ex.description.toLowerCase()] : []),
          ].join(" ");
          return searchableString.includes(term);
        });

      const matchCategory =
        libraryCategory === "All" || ex.category === libraryCategory;
      const matchPattern =
        libraryPattern === "All" || ex.pattern === libraryPattern;
      const matchMuscle =
        libraryMuscle === "All" ||
        (ex.muscles && ex.muscles.includes(libraryMuscle));

      return matchSearch && matchCategory && matchPattern && matchMuscle;
    }).sort((a: any, b: any) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [librarySearch, libraryCategory, libraryPattern, libraryMuscle]);

  // Tactical Field Manual states & filter computations
  const [manualSearch, setManualSearch] = useState("");
  const [selectedManualKey, setSelectedManualKey] = useState<string | null>(null);

  const filteredManualTerms = useMemo(() => {
    const searchTerms = manualSearch.toLowerCase().split(/\s+/).filter(Boolean);
    const allTerms = Object.entries(TRAINING_TERMS);

    return allTerms.filter(([key]) => {
      if (searchTerms.length === 0) return true;
      const titleTrans = t(`tooltip.${key}.title`);
      const shortTrans = t(`tooltip.${key}.short`);
      const longTrans = t(`tooltip.${key}.long`);

      const searchableString = [
        key.toLowerCase(),
        titleTrans.toLowerCase(),
        shortTrans.toLowerCase(),
        longTrans.toLowerCase(),
      ].join(" ");

      return searchTerms.every((term) => searchableString.includes(term));
    });
  }, [manualSearch, t]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-12">
      <div className="grid grid-cols-1 gap-6 md:gap-12 pb-24 lg:pb-12">
        {/* Recent Logs Module / Past Missions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden vanguard-tour-past-missions"
        >
          <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white mb-2 relative z-10">{t('analysis.missionLogs')}</h2>
          <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">{t('analysis.missionLogsDesc')}</p>

          {hasRecentHistory ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {recentSevenDaysMissions.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => onViewHistory?.(log.id)}
                    className="bg-void/40 p-3 md:p-6 border border-white/5 relative group overflow-hidden transition-all duration-300 hover:bg-white/5 hover:border-volt/30 flex flex-col h-full text-left cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10 w-full">
                       <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{log.date}</span>
                        <h3 className="font-headline text-xs md:text-sm font-semibold uppercase tracking-widest text-white group-hover:text-volt transition-colors">{log.title}</h3>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex flex-wrap gap-1.5">
                        {log.exercises?.slice(0, 3).map((ex, idx) => (
                          <span key={idx} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 bg-white/5 px-1.5 py-0.5 whitespace-nowrap">
                            {getExerciseName(ex, t)}
                          </span>
                        ))}
                        {(log.exercises?.length || 0) > 3 && <span className="text-[8px] font-black text-zinc-600">+{log.exercises.length - 3}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onViewHistory?.()}
                className="w-full btn-secondary py-4"
              >
                <span>{t('analysis.viewFullHistory')}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-volt" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-none bg-void/20 p-8 md:p-12 text-center">
              <span className="text-4xl md:text-6xl font-black text-zinc-800 mb-4">–</span>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2 text-zinc-500">
                {hasHistory ? "No Missions in Past 7 Days" : t('analysis.noHistory')}
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed text-zinc-500">
                {hasHistory ? "Your recent operations are quiet. Log a workout or view your full history below." : t('analysis.completeFirstWorkout')}
              </p>
              {hasHistory && (
                <button
                  onClick={() => onViewHistory?.()}
                  className="mt-6 btn-secondary px-6 py-3 max-w-xs mx-auto"
                >
                  <span>{t('analysis.viewFullHistory')}</span>
                  <ArrowRight size={14} className="text-volt" />
                </button>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-between items-center px-1 opacity-40">
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">{t('analysis.logStreamActive')}</span>
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">{t('analysis.totalRecordsCount', { count: history.length })}</span>
          </div>
        </motion.div>

        {/* Mission Library Module */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="col-span-1 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden"
        >
          <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white mb-2 relative z-10">
            {t("analysis.missionLibrary")}
          </h2>
          <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">
            {t("analysis.missionLibraryDesc")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-surface-container-low/50 p-4 border border-white/5">
            {/* Advanced Search Input */}
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-volt transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="SEARCH DIRECTORY..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full bg-surface p-3 pl-10 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-all placeholder:text-zinc-600 tracking-wider"
                style={{ borderRadius: 0 }}
              />
              {librarySearch && (
                <button
                  onClick={() => setLibrarySearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <LibraryDropdown
              label="ALL CATEGORIES"
              value={libraryCategory}
              onChange={setLibraryCategory}
              options={libraryCategories}
              isOpen={activeDropdown === 'category'}
              onToggle={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              onClose={() => setActiveDropdown(null)}
            />

            {/* Pattern Filter Dropdown */}
            <LibraryDropdown
              label="ALL PATTERNS"
              value={libraryPattern}
              onChange={setLibraryPattern}
              options={libraryPatterns}
              isOpen={activeDropdown === 'pattern'}
              onToggle={() => setActiveDropdown(activeDropdown === 'pattern' ? null : 'pattern')}
              onClose={() => setActiveDropdown(null)}
            />

            {/* Muscles Filter Dropdown */}
            <LibraryDropdown
              label="ALL MUSCLES"
              value={libraryMuscle}
              onChange={setLibraryMuscle}
              options={libraryMuscles}
              isOpen={activeDropdown === 'muscle'}
              onToggle={() => setActiveDropdown(activeDropdown === 'muscle' ? null : 'muscle')}
              onClose={() => setActiveDropdown(null)}
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {filteredLibrary.map((ex: any, index: number) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(index * 0.02, 0.2),
                    }}
                    className="bg-surface-container-lowest/80 border border-white/5 p-4 flex flex-col group hover:bg-white/5 hover:border-volt/30 transition-all duration-300 cursor-pointer"
                    onClick={() => setLibraryInfoExercise(ex)}
                  >
                    <div className="mb-3">
                      <h3 className="font-headline text-sm md:text-base font-black uppercase tracking-tight text-white group-hover:text-volt transition-colors">
                        {ex.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <span className="px-1.5 py-0.5 bg-white/5 text-zinc-400 text-[8px] font-black uppercase tracking-widest border border-white/5">
                        {ex.category}
                      </span>
                      <span className="px-1.5 py-0.5 bg-white/5 text-zinc-400 text-[8px] font-black uppercase tracking-widest border border-white/5">
                        {ex.pattern}
                      </span>
                      {ex.muscles && ex.muscles.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-volt/10 text-volt text-[8px] font-black uppercase tracking-widest border border-volt/20">
                          {ex.muscles[0]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {filteredLibrary.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center justify-center opacity-70">
              <AlertOctagon size={48} className="text-zinc-800 mb-4" />
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-500">
                No matching search results
              </h3>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed mt-1">
                Refine your filters or queries to locate available exercise
                entries
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center px-1 opacity-40">
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
              ENCYCLOPEDIA INDEXING TERMINATION
            </span>
            <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
              RECORDS RENDERED: {filteredLibrary.length} /{" "}
              {EXERCISE_DATABASE.length}
            </span>
          </div>
        </motion.div>

        {/* Tactical Field Manual Module */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 shrink-0 glass-panel dot-grid-bg p-4 md:p-8 flex flex-col w-full relative overflow-hidden"
        >
          <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white mb-2 relative z-10">
            {t("settings.fieldManual")}
          </h2>
          <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-8">
            {t("analysis.fieldManualDesc")}
          </p>

          <div className="grid grid-cols-1 gap-4 mb-6 bg-surface-container-low/50 p-4 border border-white/5">
            {/* Search Input */}
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-volt transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="SEARCH TERMINOLOGY..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="w-full bg-surface p-3 pl-10 border border-white/5 text-white font-mono text-xs uppercase focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-all placeholder:text-zinc-600 tracking-wider"
                style={{ borderRadius: 0 }}
              />
              {manualSearch && (
                <button
                  onClick={() => setManualSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredManualTerms.map(([key, term]: any, index: number) => {
                  const titleTrans = t(`tooltip.${key}.title`);
                  const longTrans = t(`tooltip.${key}.long`);
                  const shortTrans = t(`tooltip.${key}.short`);

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(index * 0.02, 0.2),
                      }}
                      className="bg-surface-container-lowest/80 p-4 border border-white/5 hover:border-volt/30 hover:bg-white/5 transition-all duration-300 flex flex-col justify-between min-h-[140px] group cursor-pointer"
                      onClick={() => setSelectedManualKey(key)}
                    >
                      <div className="mb-3 flex justify-between items-start">
                        <h3 className="font-headline text-sm font-black uppercase tracking-tight text-white group-hover:text-volt transition-colors">
                          {titleTrans}
                        </h3>
                        <div className="px-1.5 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500 rounded-none">
                          {key.toUpperCase()}
                        </div>
                      </div>

                      <div className="flex-grow flex items-end">
                        <p className="text-zinc-200 text-[11.5px] leading-relaxed font-medium pl-2.5 border-l border-volt/20">
                          {shortTrans}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {filteredManualTerms.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center justify-center opacity-70">
              <AlertOctagon size={48} className="text-zinc-800 mb-4" />
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-500">
                No terminologies match your query
              </h3>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed mt-1">
                Try modifying search parameters
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals from Library */}
      {libraryInfoExercise && (
        <ExerciseInfoModal
          exercise={libraryInfoExercise}
          isOpen={!!libraryInfoExercise}
          onClose={() => setLibraryInfoExercise(null)}
        />
      )}

      {/* Field Manual Detail Modal Overlay */}
      <AnimatePresence>
        {selectedManualKey && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedManualKey(null)}
              className="absolute inset-0 bg-void/98 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md glass-panel border-volt/40 bg-void p-6 md:p-8 space-y-6 shadow-[0_0_80px_rgba(0,182,255,0.15)] rounded-none z-[3001]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close trigger top-right */}
              <button
                onClick={() => setSelectedManualKey(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors animate-none"
              >
                <X size={20} />
              </button>

              {/* Header/Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-volt" />
                  <h3 className="font-headline text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                    {t(`tooltip.${selectedManualKey}.title`)}
                  </h3>
                </div>
                <div className="inline-block px-2 py-0.5 bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 rounded-none">
                  {selectedManualKey.toUpperCase()}
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-6">
                {/* Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-black text-volt uppercase tracking-[0.2em]">
                    {t('fieldManual.summary')}
                  </h4>
                  <p className="text-zinc-100 text-sm md:text-base leading-relaxed font-semibold pl-4 border-l-2 border-volt">
                    {t(`tooltip.${selectedManualKey}.short`)}
                  </p>
                </div>

                {/* Detailed Doctrine */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                    {t('fieldManual.doctrine')}
                  </h4>
                  {selectedManualKey.toLowerCase() === 'deploymentobjectives' ? (
                    <ul className="space-y-2 pl-4 border-l border-zinc-800 text-zinc-300 text-xs md:text-sm font-medium list-none">
                      {t(`tooltip.${selectedManualKey}.long`)
                        .split('.')
                        .map((item: string) => item.trim())
                        .filter(Boolean)
                        .map((item: string, idx: number) => {
                          const parts = item.split(':');
                          if (parts.length > 1) {
                            return (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-volt shrink-0 mt-1">▪</span>
                                <span>
                                  <strong className="text-white uppercase tracking-wider text-[11px] md:text-xs">{parts[0].trim()}:</strong>
                                  <span className="text-zinc-300"> {parts.slice(1).join(':').trim()}</span>
                                </span>
                              </li>
                            );
                          }
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-volt shrink-0 mt-1">▪</span>
                              <span>{item}</span>
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p className="text-zinc-300 text-xs md:text-sm leading-relaxed pl-4 border-l border-zinc-800 font-medium">
                      {t(`tooltip.${selectedManualKey}.long`)}
                    </p>
                  )}
                </div>
              </div>

              {/* Close button action */}
              <div className="pt-4">
                <button
                  onClick={() => setSelectedManualKey(null)}
                  className="w-full btn-secondary py-3.5 text-xs font-black uppercase tracking-widest"
                >
                  CLOSE DETAILS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
