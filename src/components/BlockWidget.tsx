import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Zap, Info, ChevronDown, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { InfoTooltip } from "./InfoTooltip";
import { cn } from "../lib/utils";
import { useSettings } from "../contexts/SettingsContext";
import { useWorkout } from "../contexts/WorkoutContext";
import {
  BlockType,
  getPlanForDuration,
  getPlanFromCustomBlocks,
  expandPlan,
  GOAL_EXPANSIONS,
  BLOCK_TEMPLATES,
} from "../constants/periodization";

interface BlockWidgetProps {}

export const BlockWidget = ({}: BlockWidgetProps) => {
  const { t, profile, setIsDeploymentModalOpen } = useSettings();
  const { history, getNextWorkoutTemplate } = useWorkout();
  const nextWorkout = getNextWorkoutTemplate();
  const currentBlock = nextWorkout.blockType || BlockType.HYPERTROPHY;
  const weekInBlock = nextWorkout.weekInBlock || 1;
  const totalWeek = nextWorkout.totalWeek || 1;

  const basicPlan = useMemo(() => {
    return profile?.customProgramBlocks &&
      profile.customProgramBlocks.length > 0
      ? getPlanFromCustomBlocks(profile.customProgramBlocks)
      : getPlanForDuration(
          (profile?.trainingDurationMonths || 3) * 4,
          profile?.trainingObjectives ||
            (profile?.trainingGoal
              ? [profile.trainingGoal]
              : ["powerbuilding"]),
        );
  }, [profile]);

  const plan = expandPlan(basicPlan, !!(profile?.customProgramBlocks && profile.customProgramBlocks.length > 0));
  const blockDef = plan.find((b) => b.type === currentBlock);
  const totalWeeks = blockDef?.durationWeeks || 4;
  const cycleLength = plan.reduce((acc, b) => acc + b.durationWeeks, 0) || 4;
  const hasHistory = (history?.length || 0) > 0;

  const [hoveredWeekData, setHoveredWeekData] = React.useState<any>(null);

  // Only show progress if they've actually started lifting
  // And calculate based on completed weeks (e.g., Week 1 = 0% complete)
  const programProgress = hasHistory
    ? ((totalWeek - 1) / cycleLength) * 100
    : 0;

  const currentCycleWeek = ((totalWeek - 1) % cycleLength) + 1;

  const cycleGroups = useMemo(() => {
    const groups: {
      id: string;
      label: string;
      type: string;
      startWeek: number;
      endWeek: number;
      isCurrent: boolean;
      subBlocks: {
        type: string;
        label: string;
        durationWeeks: number;
        startWeek: number;
        endWeek: number;
        isCurrent: boolean;
        weekInBlock: number;
      }[];
    }[] = [];

    let currentWeekAcc = 1;

    basicPlan.forEach((parentBlock, pIdx) => {
      const subBlocksForThisParent: any[] = [];
      const expansion = GOAL_EXPANSIONS[parentBlock.type];

      let parentStartWeek = currentWeekAcc;
      let parentIsCurrent = false;

      if (expansion) {
        let remainingWeeks = parentBlock.durationWeeks;
        expansion.forEach((sub, sIdx) => {
          const isLast = sIdx === expansion.length - 1;
          const subWeeks = isLast
            ? remainingWeeks
            : Math.max(1, Math.round(parentBlock.durationWeeks * sub.ratio));

          if (subWeeks > 0) {
            const template =
              BLOCK_TEMPLATES[sub.type] ||
              BLOCK_TEMPLATES[BlockType.FOUNDATION];
            const subStart = currentWeekAcc;
            const subEnd = currentWeekAcc + subWeeks - 1;

            const isSubCurrent =
              currentCycleWeek >= subStart && currentCycleWeek <= subEnd;
            if (isSubCurrent) parentIsCurrent = true;

            subBlocksForThisParent.push({
              type: sub.type,
              label: template.label || sub.type,
              durationWeeks: subWeeks,
              startWeek: subStart,
              endWeek: subEnd,
              isCurrent: isSubCurrent,
              weekInBlock: isSubCurrent ? currentCycleWeek - subStart + 1 : 0,
            });

            currentWeekAcc += subWeeks;
            remainingWeeks -= subWeeks;
          }
        });
      } else {
        const subStart = currentWeekAcc;
        const subEnd = currentWeekAcc + parentBlock.durationWeeks - 1;
        const isSubCurrent =
          currentCycleWeek >= subStart && currentCycleWeek <= subEnd;
        if (isSubCurrent) parentIsCurrent = true;

        subBlocksForThisParent.push({
          type: parentBlock.type,
          label: parentBlock.label || parentBlock.type,
          durationWeeks: parentBlock.durationWeeks,
          startWeek: subStart,
          endWeek: subEnd,
          isCurrent: isSubCurrent,
          weekInBlock: isSubCurrent ? currentCycleWeek - subStart + 1 : 0,
        });
        currentWeekAcc += parentBlock.durationWeeks;
      }

      groups.push({
        id: `${parentBlock.type}-${pIdx}`,
        label: parentBlock.label || parentBlock.type,
        type: parentBlock.type,
        startWeek: parentStartWeek,
        endWeek: currentWeekAcc - 1,
        subBlocks: subBlocksForThisParent,
        isCurrent: parentIsCurrent,
      });
    });

    return groups;
  }, [basicPlan, currentCycleWeek]);

  const [expandedObjectiveId, setExpandedObjectiveId] = useState<string | null>(
    null,
  );

  // Initialize expandedObjectiveId to the current objective ONLY ONCE or when cycleGroups change significantly
  useEffect(() => {
    if (!expandedObjectiveId) {
      const current = cycleGroups.find((g) => g.isCurrent);
      if (current) {
        setExpandedObjectiveId(current.id);
      }
    }
  }, [cycleGroups]);

  const graphData = useMemo(() => {
    const data = [];
    let weekAcc = 0;
    for (const block of plan) {
      for (let w = 1; w <= block.durationWeeks; w++) {
        weekAcc++;
        const intensity =
          block.baseIntensity + (w - 1) * block.intensityIncrementPerWeek;
        data.push({
          week: weekAcc,
          intensity: Math.round(intensity * 100),
          block: block.label || block.type,
          blockType: block.type,
          isCurrent: weekAcc === currentCycleWeek,
        });
      }
    }
    return data;
  }, [currentCycleWeek, plan]);

  const actualIntensityData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const weekMap: {
      [week: number]: {
        rpeSum: number;
        targetRpeSum: number;
        weightRatioSum: number;
        count: number;
      };
    } = {};

    history.forEach((session) => {
      if (session.totalWeek && session.completedAt) {
        const week = ((session.totalWeek - 1) % cycleLength) + 1;
        const rpe = session.actualRpe || session.rpe || 0;
        const targetRpe = session.targetRpe || 8.0;

        // Calculate weight ratio
        let weightRatioSum = 0;
        let weightSetCount = 0;
        if (session.exercises) {
          session.exercises.forEach((ex) => {
            // Only aggregate intensity based on main lifts, 
            // as accessory baseWeights are often stored as RPE strings (e.g. "8.5") 
            // causing major math errors if the user inputs actual weights (e.g. 30 lbs / 8.5 ratio = 3.53).
            if (ex.isPrimaryMainLift || ex.isSquat || ex.isBench || ex.isDeadlift) {
              (ex.sets || []).forEach((s) => {
                if (s.isCompleted && !s.isWarmup) {
                  const actW = parseFloat(s.weight) || 0;
                  // Handle history records that might not have baseWeight yet
                  const fallbackWeight = typeof s.weight === "string" && s.weight.includes("RPE") ? "0" : s.weight;
                  const prsW = parseFloat(s.baseWeight || fallbackWeight) || 0;
                  
                  if (prsW > 10) {
                    weightRatioSum += actW / prsW;
                    weightSetCount += 1;
                  }
                }
              });
            }
          });
        }
        const weightRatio =
          weightSetCount > 0 ? weightRatioSum / weightSetCount : 1.0;

        if (!weekMap[week]) {
          weekMap[week] = {
            rpeSum: 0,
            targetRpeSum: 0,
            weightRatioSum: 0,
            count: 0,
          };
        }
        weekMap[week].rpeSum += rpe;
        weekMap[week].targetRpeSum += targetRpe;
        weekMap[week].weightRatioSum += weightRatio;
        weekMap[week].count += 1;
      }
    });

    return graphData.map((d) => {
      const stats = weekMap[d.week];
      if (!stats) return { ...d, intensity: null };

      const avgActual = stats.rpeSum / stats.count;
      const avgTarget = stats.targetRpeSum / stats.count;
      const avgWeightRatio = stats.weightRatioSum / stats.count;

      // Intensity ratio is based on weight ratio and RPE deviation.
      // Since sRPE is a ceiling, undershooting it shouldn't drastically penalize the "actual" effort,
      // as it might be a deliberate recovery pace. Overshooting it adds impact.
      let rpeDiff = avgActual - avgTarget;
      if (rpeDiff < 0) {
        // Halve the visual drop when resting below ceiling to prevent "punishing" users for smart recovery
        rpeDiff = rpeDiff * 0.5;
      }

      // A standard scientific model: 1 RPE point difference ~ 3% intensity change
      const rpeMultiplier = 1 + rpeDiff * 0.03;
      const ratio = avgWeightRatio * rpeMultiplier;

      let actualIntensity = Math.round(d.intensity * ratio);
      actualIntensity = Math.max(0, Math.min(100, actualIntensity));

      return {
        ...d,
        intensity: actualIntensity,
      };
    });
  }, [history, graphData, cycleLength]);

  const combinedGraphData = useMemo(() => {
    return graphData.map((d, index) => {
      return {
        ...d,
        plannedIntensity: d.intensity,
        actualIntensity: actualIntensityData[index]?.intensity,
      };
    });
  }, [graphData, actualIntensityData]);

  const intensityCurveTicks = useMemo(() => {
    if (!graphData.length) return [];
    return graphData.map((d) => d.week).filter((w) => w === 1 || w % 5 === 0);
  }, [graphData]);

  const activeFocus = hoveredWeekData || {
    block: nextWorkout.blockLabel || currentBlock,
    blockType: nextWorkout.blockType || currentBlock,
    week: totalWeek,
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 border-volt/30 shadow-xl bg-void/90 backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-volt mb-1">
            {data.block}
          </p>
          <p className="text-xs font-bold text-white">Week {data.week}</p>
          <div className="space-y-1 mt-1">
            <p className="text-[10px] font-bold text-zinc-400">
              Planned:{" "}
              <span className="text-volt">{data.plannedIntensity}%</span>
            </p>
            {data.actualIntensity !== null && (
              <p className="text-[10px] font-bold text-zinc-400">
                Actual:{" "}
                <span className="text-[#FF7162]">{data.actualIntensity}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel dot-grid-bg px-4 py-6 md:p-8 border-none flex flex-col justify-between h-full relative overflow-hidden min-w-0">
      {/* Decorative corner elements for tactical feel */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-volt/40 px-0 py-0" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-volt/40 px-0 py-0" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-volt/40 px-0 py-0" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-volt/40 px-0 py-0" />

      <div className="absolute top-0 right-0 w-24 h-24 bg-volt/5 blur-[40px] -z-10" />

      <div className="flex flex-col mb-6 md:mb-8 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest text-white vanguard-tour-deployment-progress">
            {t("Deployment Progress")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
              Deployment Plan
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-white">
              {profile?.trainingObjectives &&
              profile.trainingObjectives.length > 0
                ? profile.trainingObjectives
                    .map((g) => t(`goal.${g}`))
                    .join(" + ")
                : t(`goal.${profile?.trainingGoal || "powerbuilding"}`)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
              Mission Frequency
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-white">
              {profile?.trainingFrequency || 3}x Sessions / Week
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8 flex-1">
        {/* Detailed Block Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {t("analysis.trainingCycle")}
            </span>
            <div className="space-y-2">
              {cycleGroups.map((objective, idx) => {
                const isExpanded = expandedObjectiveId === objective.id;
                const isGoalCurrent = objective.isCurrent;
                const goalKey = `goal.${objective.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
                const translatedGoal = t(goalKey);
                const goalLabel =
                  translatedGoal !== goalKey ? translatedGoal : objective.label;

                return (
                  <div key={objective.id} className="space-y-1">
                    <button
                      onClick={() =>
                        setExpandedObjectiveId(isExpanded ? null : objective.id)
                      }
                      className={cn(
                        "w-full p-3 flex justify-between items-center transition-all duration-300 vanguard-tour-deployment-cycle",
                        isGoalCurrent
                          ? "bg-white/10 ring-1 ring-volt/30"
                          : "bg-white/5 opacity-60 hover:opacity-100",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-sm md:text-base font-black uppercase tracking-tight",
                            isGoalCurrent ? "text-volt" : "text-zinc-500",
                          )}
                        >
                          {cycleGroups.length > 1
                            ? `Objective ${idx + 1}: `
                            : ""}
                          {goalLabel}
                        </span>
                        {isGoalCurrent && (
                          <Zap size={10} className="text-volt animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          Weeks {objective.startWeek}-{objective.endWeek}
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-zinc-500" />
                        ) : (
                          <ChevronRight size={14} className="text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 pl-4 border-l border-white/5 ml-2 mt-1 py-1">
                        {objective.subBlocks.map((sub, sIdx) => {
                          const subKey = `block.${sub.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
                          const translatedSub = t(subKey);
                          const subLabel =
                            translatedSub !== subKey
                              ? translatedSub
                              : sub.label;

                          return (
                            <div
                              key={`${objective.id}-${sIdx}`}
                              className={cn(
                                "p-3 border-none transition-all duration-300",
                                sub.isCurrent
                                  ? "bg-volt/10 ring-1 ring-volt/30"
                                  : "bg-surface/30 opacity-40 hover:opacity-60",
                              )}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span
                                  className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    sub.isCurrent
                                      ? "text-volt"
                                      : "text-zinc-400",
                                  )}
                                >
                                  {subLabel}
                                </span>
                                {sub.isCurrent && (
                                  <span className="text-[10px] font-black text-white">
                                    WK {sub.weekInBlock} / {sub.durationWeeks}
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  Weeks {sub.startWeek}-{sub.endWeek}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full h-2 bg-void overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${programProgress}%` }}
                className="h-full bg-volt shadow-[0_0_10px_var(--primary-glow)]"
              />
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
              <span>{t("analysis.start")}</span>
              <span>
                {Math.round(programProgress)}% {t("analysis.complete")}
              </span>
              <span>{t("analysis.peak")}</span>
            </div>
          </div>
        </div>
        
        {/* Intensity & Performance Graph */}
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-4 vanguard-tour-intensity-curve">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {t("analysis.intensityCurve")}
                <InfoTooltip term="RPE" />
              </span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5 items-center">
                    <div className="w-1.5 h-0.5 bg-volt" />
                    <div className="w-1.5 h-0.5 bg-volt" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Planned
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-0.5 bg-[#FF7162]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Actual
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-volt">
              {cycleLength}-Week Cycle
            </span>
          </div>

          <div className="h-[220px] md:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={combinedGraphData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload) {
                    setHoveredWeekData(e.activePayload[0].payload);
                  }
                }}
                onMouseLeave={() => setHoveredWeekData(null)}
              >
                <defs>
                  <linearGradient
                    id="intensity-grad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--primary-color)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary-color)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="actual-intensity-grad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FF7162" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF7162" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#71717a",
                    fontSize: 9,
                    fontWeight: 900,
                    fontFamily: "Inter",
                  }}
                  ticks={intensityCurveTicks}
                  tickFormatter={(val) =>
                    `${t("workout.week").toUpperCase()} ${val}`
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#71717a",
                    fontSize: 10,
                    fontWeight: 900,
                    fontFamily: "Inter",
                  }}
                  domain={[40, 100]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "var(--primary-color)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="linear"
                  dataKey="plannedIntensity"
                  stroke="var(--primary-color)"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#intensity-grad)"
                  animationDuration={1500}
                />
                <Area
                  type="linear"
                  dataKey="actualIntensity"
                  stroke="#FF7162"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#actual-intensity-grad)"
                  animationDuration={1500}
                  connectNulls={true}
                />
                <ReferenceLine
                  x={currentCycleWeek}
                  stroke="var(--primary-color)"
                  strokeDasharray="3 3"
                  label={{
                    position: "top",
                    value: t("analysis.now").toUpperCase(),
                    fill: "var(--primary-color)",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5 opacity-60">
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            SYS_STATUS: ACTIVE
          </span>
          <span className="font-headline text-[6px] font-black uppercase tracking-[0.3em]">
            REF_ID: DEP_PROG
          </span>
        </div>

        <button
          onClick={() => setIsDeploymentModalOpen(true)}
          className="mt-6 md:hidden w-full flex items-center justify-center gap-2 px-6 py-4 btn-primary font-headline text-[10px] font-black uppercase tracking-widest transition-all group rounded-none"
        >
          <Zap size={14} />
          <span>Recalibrate Deployment</span>
        </button>
      </div>
    </div>
  );
};
