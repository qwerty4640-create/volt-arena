import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { InfoTooltip } from './InfoTooltip';
import {
    TrendingUp,
    Utensils,
    Star,
    Plus,
    GripVertical,
    X,

    Calendar,
    Clock,
    Weight,
    Activity,
    Zap,
    ShieldCheck,
    History,
    Dumbbell,
    Info,
    BarChart3,
    Edit2,
    Trash2,
    Waypoints,
    AlertTriangle
} from 'lucide-react';
import {
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    ReferenceLine
} from 'recharts';
import { ActiveRecoveryWidget } from './ActiveRecoveryWidget';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';

import { ConfirmationModal } from './ConfirmationModal';
import { NonProgramActivityModal } from './NonProgramActivityModal';
import { TacticalChart } from './TacticalChart';
import { getTacticalImpact } from '../utils/analyticsEngine';
import { getExerciseName } from '../utils/workoutUtils';

import { ViewType, ImmersionMode, WidgetId } from '../types';
import { ALL_WIDGETS, Widget } from '../constants/widgets';
import { CustomizeDashboardModal } from './CustomizeDashboardModal';

import { useWorkout, WorkoutSession, ActiveRecovery } from '../contexts/WorkoutContext';
import { auth } from '../firebase';
import { BlockType, getPlanForDuration, getPlanFromCustomBlocks, expandPlan } from '../constants/periodization';



// Removed local WidgetId, Widget, ALL_WIDGETS since they are in constants/types

// ─── Widgets ────────────────────────────────────────────────────────────────

// ─── Readiness Analysis Widget ──────────────────────────────────────────────────
const READINESS_STORAGE_KEY = 'volt_last_readiness';

function loadReadinessScores(): { sleep: number; stress: number; fatigue: number; timestamp: number } | null {
    try {
        const raw = localStorage.getItem(READINESS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Expire after 24 hours
        if (Date.now() - (parsed.timestamp || 0) > 24 * 60 * 60 * 1000) return null;
        return {
            sleep: parsed.sleep ?? 3,
            stress: parsed.stress ?? 3,
            fatigue: parsed.fatigue ?? 3,
            timestamp: parsed.timestamp ?? 0,
        };
    } catch { return null; }
}

function saveReadinessScores(scores: { sleep: number; stress: number; fatigue: number }) {
    try {
        const existing = (() => { try { return JSON.parse(localStorage.getItem(READINESS_STORAGE_KEY) || '{}'); } catch { return {}; } })();
        localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify({ ...existing, ...scores, timestamp: Date.now() }));
    } catch { /* noop */ }
}

const ReadinessTrendWidget = () => {
    const { t, unit } = useSettings();
    const { history } = useWorkout();
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Readiness', 'Fatigue', 'Sleep', 'Stress']);
    const [timeFrame, setTimeFrame] = useState<'1M' | '3M' | '6M' | 'ALL'>('6M');

    const weightUnit = unit === 'metric' ? 'kg' : 'lbs';

    const metricOptions = [
        { id: 'Readiness', label: 'Readiness', color: 'var(--primary-color)' },
        { id: 'Fatigue', label: t('analysis.fatigue'), color: '#ef4444' },
        { id: 'Sleep', label: t('analysis.sleep'), color: '#00b6ff' },
        { id: 'Stress', label: t('analysis.stress'), color: '#eab308' }
    ];

    const toggleMetric = (metricId: string) => {
        setSelectedMetrics(prev =>
            prev.includes(metricId)
                ? prev.filter(id => id !== metricId)
                : [...prev, metricId]
        );
    };

    const readinessTrendData = useMemo(() => {
        if (!history || history.length === 0) return [];

        const now = new Date();
        let startDate = new Date(0);
        if (timeFrame === '1M') startDate = new Date(now.setMonth(now.getMonth() - 1));
        else if (timeFrame === '3M') startDate = new Date(now.setMonth(now.getMonth() - 3));
        else if (timeFrame === '6M') startDate = new Date(now.setMonth(now.getMonth() - 6));

        const timeFilteredHistory = history.filter(session => {
            const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
            return sessionDate >= startDate;
        }).sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

        return timeFilteredHistory.map(session => {
            return {
                date: session.date,
                title: session.title,
                timestamp: session.completedAt || new Date(session.date).getTime(),
                displayDate: new Date(session.completedAt || session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: new Date(session.completedAt || session.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
                Readiness: session.readiness != null ? session.readiness : 0,
                Fatigue: session.fatigue != null ? session.fatigue * 20 : 0,
                Sleep: session.sleep != null ? session.sleep * 20 : 0,
                Stress: session.stress != null ? session.stress * 20 : 0
            };
        });
    }, [history, timeFrame]);

    const ReadinessTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-void/95 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[200px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-volt" />
                    <div className="space-y-4">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">{t('analysis.telemetryLog')}</p>
                            <p className="text-xs font-black italic uppercase text-white">{data.fullDate}</p>
                            <p className="text-[10px] font-black uppercase tracking-tight text-volt mt-1">{data.title}</p>
                        </div>
                        <div className="space-y-2 pt-3 border-t border-white/5">
                            {payload.filter((entry: any) => entry.value !== null && entry.value !== undefined).map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-black italic text-white">
                                        {entry.value}{['READINESS', 'SLEEP', 'FATIGUE', 'STRESS'].includes(entry.name?.toUpperCase()) ? '%' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel px-4 py-6 md:p-8 flex flex-col min-w-0 overflow-hidden border-none bg-void/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h2 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-2">{t('analysis.readinessTrend')}</h2>
                    <p className="text-zinc-400 text-xs font-medium max-w-md mb-8 leading-relaxed">
                        {t('analysis.readinessTrendDesc')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {metricOptions.map(metric => (
                            <button
                                key={metric.id}
                                onClick={() => toggleMetric(metric.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 border transition-all duration-300",
                                    selectedMetrics.includes(metric.id)
                                        ? "bg-white/5 border-white/20"
                                        : "bg-transparent border-transparent opacity-40 grayscale"
                                )}
                            >
                                <div className="w-3 h-3" style={{ backgroundColor: metric.color }} />
                                <span className="font-headline text-[10px] font-black uppercase tracking-widest text-white">{metric.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap md:flex-nowrap shrink-0">
                    {(['1M', '3M', '6M', 'ALL'] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={cn(
                                "px-4 py-2 font-headline text-[10px] font-black uppercase tracking-widest transition-all",
                                timeFrame === tf ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[250px] w-full mt-4 min-w-0">
                {readinessTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={readinessTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fontFamily: 'Inter' }}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
                            />
                            <Tooltip content={<ReadinessTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            {metricOptions.map(metric => selectedMetrics.includes(metric.id) && (
                                <Line
                                    key={metric.id}
                                    yAxisId="left"
                                    type="linear"
                                    dataKey={metric.id}
                                    stroke={metric.color}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: metric.color, strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: metric.color, strokeWidth: 2, fill: '#131313' }}
                                    animationDuration={1500}
                                    connectNulls
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                        <BarChart3 size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('analysis.insufficientData')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ReadinessAnalysisWidget = () => {
    const { t, unit } = useSettings();
    const { history, getCalibrationStatus } = useWorkout();

    const hasHistory = history && history.length > 0;
    const calibration = getCalibrationStatus();
    const readinessScore = calibration.readiness;

    const sleepScore = calibration.subjectiveScores?.sleepScore ?? 3;
    const stressScore = calibration.subjectiveScores?.stressScore ?? 3;
    const fatigueScore = calibration.subjectiveScores?.fatigueScore ?? 3;

    const hasSubjectiveData = calibration.subjectiveScores !== null;

    // ── Display values per factor (0-100% scale for bar) ──────────────────────
    const sleepDisplay = Math.round((sleepScore / 5) * 100);
    const stressDisplay = Math.round((5 - stressScore) * 20);

    // Fatigue: 0-18 scale. 0 is low fatigue, 18 is high fatigue.
    const rawFatigue = calibration.cumulativeFatigueScore || 0;
    const fatigueDisplay = hasHistory ? Math.round((rawFatigue / 18) * 100) : 0;
    const objectiveFatigueDisplay = fatigueDisplay;

    const getStatusColorText = (val: number) => {
        if (val >= 75) return 'text-emerald-500'; // High readiness = green
        if (val >= 40) return 'text-amber-500'; // Moderate readiness = amber
        return 'text-crimson'; // Low readiness = red
    };

    const statusColor = readinessScore !== null ? getStatusColorText(readinessScore) : 'text-zinc-500';

    // ── Volume data (unchanged logic) ─────────────────────────────────────────
    const volumeData = React.useMemo(() => {
        if (!hasHistory) return [];
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weekData = days.map(day => ({ day, val: 0, active: false, displayVal: 0 }));
        const today = now.toDateString();
        history.forEach(session => {
            const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
            if (sessionDate >= startOfWeek) {
                const dayIndex = sessionDate.getDay();
                let vol = 0;
                session.exercises?.forEach(ex => {
                    ex.sets?.forEach(s => {
                        if (s.isCompleted) vol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
                    });
                });
                weekData[dayIndex].val += vol;
                if (sessionDate.toDateString() === today) weekData[dayIndex].active = true;
            }
        });
        const maxVol = Math.max(...weekData.map(d => d.val), 1);
        return weekData.map(d => ({ ...d, displayVal: d.val, val: (d.val / maxVol) * 100 }));
    }, [history, hasHistory]);

    const orderedVolumeData = React.useMemo(() => {
        if (volumeData.length === 0) return [];
        return [...volumeData.slice(1), volumeData[0]];
    }, [volumeData]);

    const acwrData = useMemo(() => {
        if (!history || history.length === 0) return null;

        const weeks: Record<string, number> = {};
        const weekTimestamps: Record<string, number> = {};

        history.forEach(session => {
            const date = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const weekKey = startOfWeek.getTime().toString();

            let sessionVolume = 0;
            session.exercises?.forEach(ex => {
                ex.sets?.forEach(s => {
                    if (s.isCompleted) {
                        sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
                    }
                });
            });

            if (!weeks[weekKey]) {
                weeks[weekKey] = 0;
                weekTimestamps[weekKey] = startOfWeek.getTime();
            }
            weeks[weekKey] += sessionVolume;
        });

        const sortedWeeks = Object.keys(weeks)
            .map(k => ({ timestamp: weekTimestamps[k], volume: weeks[k] }))
            .sort((a, b) => a.timestamp - b.timestamp);

        if (sortedWeeks.length === 0) return null;

        const acuteWorkload = sortedWeeks[sortedWeeks.length - 1].volume;

        // Chronic workload: Average of the up to 4 weeks prior to the acute week
        const chronicWeeks = sortedWeeks.slice(Math.max(0, sortedWeeks.length - 5), sortedWeeks.length - 1);

        if (chronicWeeks.length === 0) {
            return { ratio: 1.0, acute: acuteWorkload, chronic: acuteWorkload };
        }

        const chronicWorkload = chronicWeeks.reduce((acc, w) => acc + w.volume, 0) / chronicWeeks.length;
        const ratio = chronicWorkload > 0 ? acuteWorkload / chronicWorkload : 1.0;

        return { ratio: Number(ratio.toFixed(2)), acute: acuteWorkload, chronic: chronicWorkload };
    }, [history]);

    // ── Single factor column ───────────────────────────────────────────────────
    const FactorColumn = ({
        label, displayVal, fillVal, goodness, tooltip, noData,
    }: {
        label: string; displayVal: string; fillVal: number; goodness: number; tooltip?: string; noData: boolean;
    }) => {
        const getGoodnessColor = (val: number) => {
            if (val >= 75) return 'bg-volt shadow-[0_0_20px_var(--primary-glow)]';
            if (val >= 40) return 'bg-amber-500';
            return 'bg-crimson';
        };

        const getStatusText = (val: number) => {
            if (val >= 75) return 'Optimal';
            if (val >= 40) return 'Moderate';
            return 'High Fatigue';
        };

        return (
            <div className="flex flex-col h-full text-left justify-start items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
                    {label}
                    {tooltip && <InfoTooltip term={tooltip as any} />}
                </span>
                <div className="flex items-baseline gap-2 mb-2 justify-start items-baseline w-full">
                    <span className="text-3xl md:text-4xl font-black italic tracking-tighter leading-none text-white">
                        {noData ? '–' : displayVal}
                    </span>
                    {!noData && <span className="text-lg font-black italic text-zinc-600 mb-0.5">%</span>}
                </div>
                <span className="font-headline text-[10px] font-black uppercase tracking-widest border-l-2 pl-3 block mb-4 text-zinc-600 border-zinc-800">
                    {noData ? t('analysis.awaitingData') : getStatusText(goodness)}
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="w-full glass-panel px-4 py-4 md:p-6 flex flex-col relative group/module overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700"
                    style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* Header: title + readiness score + recalibrate button */}
                <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10 w-full gap-4">
                    <div className="flex flex-col">
                        <h2 className="font-headline text-3xl md:text-4xl font-black uppercase italic tracking-tight">
                            {t('analysis.recoveryAnalysis')}
                        </h2>
                        <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed mb-6 md:mb-12">
                            Bio-mechanical readiness is system-managed based on historical training volume.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-2 items-start">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
                                    {t('analysis.readiness')}
                                    <InfoTooltip term="Readiness" />
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                        'text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-none',
                                        readinessScore !== null ? statusColor : 'text-zinc-600'
                                    )}>
                                        {readinessScore !== null ? readinessScore : '–'}
                                    </span>
                                    {readinessScore !== null && <span className="text-xl md:text-2xl font-black italic text-zinc-600"> %</span>}
                                </div>
                            </div>

                            {/* ACWR Widget */}
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
                                    ACWR
                                    <InfoTooltip term="ACWR" />
                                </span>
                                {acwrData ? (
                                    <div className="flex flex-col h-full items-start">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl md:text-4xl font-black italic tracking-tighter leading-none text-white">
                                                {acwrData.ratio.toFixed(2)}
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "font-headline text-[10px] font-black uppercase tracking-widest border-l-2 pl-3 block mb-4 text-zinc-600 border-zinc-800",
                                            acwrData.ratio > 1.5 ? "text-crimson" : acwrData.ratio >= 0.8 && acwrData.ratio <= 1.3 ? "text-volt" : "text-zinc-400"
                                        )}>
                                            {acwrData.ratio > 1.5 ? "Elevated" : acwrData.ratio >= 0.8 && acwrData.ratio <= 1.3 ? "Optimal" : "Monitor"}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-3xl md:text-4xl font-black italic tracking-tighter leading-none text-zinc-600">–</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {calibration.overtrainingRisk !== 'none' && (
                    <div className={cn(
                        "mb-6 p-4 border flex items-start gap-4 animate-pulse-slow relative z-10",
                        calibration.overtrainingRisk === 'critical' ? "bg-crimson/10 border-crimson/30" : "bg-amber-500/10 border-amber-500/30"
                    )}>
                        <AlertTriangle className={calibration.overtrainingRisk === 'critical' ? "text-crimson shrink-0" : "text-amber-500 shrink-0"} size={18} />
                        <div className="flex flex-col gap-1">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                calibration.overtrainingRisk === 'critical' ? "text-crimson" : "text-amber-500"
                            )}>
                                {calibration.overtrainingRisk === 'critical' ? "CRITICAL OVERTRAINING RISK" : "FATIGUE DECAY OUTPACED"}
                            </span>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 leading-[1.4]">
                                {calibration.overtrainingRisk === 'critical'
                                    ? "YOUR CURRENT ACUTE LOAD IS >1.6X CHRONIC BASELINE. RECOVERY FAIL RISK IS HIGH."
                                    : "DAILY STRAIN IS TRENDING ABOVE RECOVERY CAPACITY. MONITOR PERFORMANCE CLOSELY."}
                            </p>
                        </div>
                    </div>
                )}

                {/* 4-column grid: Fatigue | Sleep | Stress | Volume */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10 w-full flex-1">

                    {/* Fatigue */}
                    <FactorColumn
                        label={t('analysis.fatigue')}
                        displayVal={String(fatigueDisplay)}
                        fillVal={fatigueDisplay}
                        goodness={100 - fatigueDisplay}
                        tooltip="CNS"
                        noData={!hasSubjectiveData && !hasHistory}
                    />

                    {/* Sleep */}
                    <FactorColumn
                        label={t('analysis.sleep')}
                        displayVal={String(sleepDisplay)}
                        fillVal={sleepDisplay}
                        goodness={sleepDisplay}
                        tooltip="Sleep"
                        noData={!hasSubjectiveData}
                    />

                    {/* Stress */}
                    <FactorColumn
                        label={t('analysis.stress')}
                        displayVal={String(stressDisplay)}
                        fillVal={stressDisplay}
                        goodness={100 - stressDisplay}
                        tooltip="Stress"
                        noData={!hasSubjectiveData}
                    />

                    {/* Volume */}
                    <div className="flex flex-col h-full text-left justify-start items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 block w-full">
                            {t('Volume')}
                            <InfoTooltip term="Volume" />
                        </span>
                        <div className="flex items-baseline gap-2 mb-2 justify-start w-full">
                            <span className="text-3xl md:text-4xl font-black italic tracking-tighter leading-none text-white">
                                {hasHistory ? orderedVolumeData.reduce((a, d) => a + d.displayVal, 0).toLocaleString() : '–'}
                            </span>
                            {hasHistory && <span className="text-lg font-black italic text-zinc-600 mb-0.5">{unit === 'metric' ? 'kg' : 'lbs'}</span>}
                        </div>
                        <span className="font-headline text-[10px] font-black uppercase tracking-widest border-l-2 pl-3 block mb-4 text-zinc-600 border-zinc-800">
                            {hasHistory ? t('analysis.7dayLoad') : t('analysis.awaitingData')}
                        </span>
                    </div>
                </div>


            </div>

            <ActiveRecoveryWidget />
            <ReadinessTrendWidget />
        </div>
    );
};

export const RecoveryWidget = () => {
    const { t } = useSettings();
    const { history, getCalibrationStatus } = useWorkout();
    const hasHistory = history.length > 0;

    const calibration = getCalibrationStatus();
    const scoreValue = hasHistory ? calibration.readiness : 0;
    const score = hasHistory ? scoreValue : '–';

    const getStatusColor = (val: number) => {
        if (!hasHistory) return "text-zinc-500";
        if (val >= 85) return "text-emerald-500";
        if (val >= 60) return "text-amber-500";
        return "text-crimson";
    };

    const statusColor = getStatusColor(scoreValue);

    return (
        <div className="glass-panel px-4 py-6 md:p-8 border-none flex flex-col items-center justify-between text-center h-full">
            <div className="w-full flex justify-between items-center mb-2 xl:mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        {t('analysis.recoveryScore')}
                        <InfoTooltip term="CNS" />
                    </span>
                </div>
            </div>

            <div className="relative w-24 h-24 xl:w-32 xl:h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        className="text-zinc-800/50"
                        cx="50" cy="50" r="45"
                        stroke="currentColor" strokeWidth="6" fill="transparent"
                    />
                    {hasHistory && (
                        <motion.circle
                            initial={{ strokeDashoffset: 282.7 }}
                            animate={{ strokeDashoffset: 282.7 * (1 - scoreValue / 100) }}
                            className={statusColor}
                            cx="50" cy="50" r="45"
                            stroke="currentColor" strokeWidth="6" fill="transparent"
                            strokeDasharray="282.7"
                            strokeLinecap="round"
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl xl:text-4xl font-black italic text-white leading-none">{score}</span>
                    {hasHistory && <span className="text-sm font-black italic text-zinc-500 mb-1">%</span>}
                </div>
            </div>

            <div className="mt-4 xl:mt-6 space-y-1 xl:space-y-2">
                <span className={cn(
                    "block text-[10px] font-black uppercase tracking-[0.4em]",
                    statusColor
                )}>
                    {hasHistory ? t('analysis.optimalStrain') : t('analysis.awaitingData')}
                </span>
                <p className="text-[9px] xl:text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
                    {hasHistory ? t('analysis.cnsReady') : t('analysis.completeFirstWorkout')}
                </p>
            </div>
        </div>
    );
};










const PRWidget = () => {
    const { t, unit } = useSettings();
    const { history } = useWorkout();
    const hasHistory = (history?.length || 0) > 0;

    // Find the highest weight lifted in history
    let bestLift = { name: t('onboarding.deadlift'), weight: 0, date: '', rawEx: null as any };

    if (hasHistory) {
        history.forEach(session => {
            session.exercises?.forEach(ex => {
                ex.sets?.forEach(set => {
                    const w = parseFloat(set.weight) || 0;
                    if (w > bestLift.weight) {
                        bestLift = { name: getExerciseName(ex, t), weight: w, date: session.date, rawEx: ex };
                    }
                });
            });
        });
    }

    const prWeight = hasHistory ? bestLift.weight.toFixed(1) : '–';
    const prDiff = hasHistory ? (unit === 'metric' ? '+2.5' : '+5.0') : '0.0';
    const weightUnit = unit === 'metric' ? t('workout.kg') : t('workout.lbs');

    const getBackgroundImage = (liftName: string) => {
        const name = liftName.toLowerCase();
        if (name.includes('squat')) return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop";
        if (name.includes('bench')) return "https://images.unsplash.com/photo-1534367507873-d2d7e249a3f2?q=80&w=2070&auto=format&fit=crop";
        if (name.includes('deadlift')) return "https://images.unsplash.com/photo-1583454110551-21f2fa2943f3?q=80&w=2070&auto=format&fit=crop";
        return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop";
    };

    return (
        <div className="relative overflow-hidden group h-full">
            <div className={cn("absolute inset-0 transition-colors duration-500", hasHistory ? "bg-crimson/90" : "bg-zinc-900/90")} />
            <img
                src={hasHistory ? getBackgroundImage(bestLift.name) : "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"}
                alt="Personal Record"
                className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 px-4 py-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-2 xl:space-y-4">
                    <div className="flex items-center justify-between text-white/80">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                {hasHistory ? t('analysis.newPersonalRecord') : t('analysis.personalRecord')}
                            </span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white bg-white/10 px-1.5 py-0.5 border border-white/20">EXP</span>
                    </div>
                    <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight">
                        {hasHistory ? (
                            <>
                                {bestLift.name}: <br />
                                {prWeight} {weightUnit}
                            </>
                        ) : (
                            t('analysis.noRecordsYet')
                        )}
                    </h2>
                    <p className="text-[9px] xl:text-[10px] font-black uppercase tracking-widest text-white/60">
                        {hasHistory ? t('analysis.fromLastMissionPattern', { diff: prDiff, unit: weightUnit }) : t('analysis.startLiftingToTrack')}
                    </p>
                </div>
                {hasHistory && (
                    <button className="self-start bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 text-white px-6 py-3 font-headline text-[9px] xl:text-[10px] font-black uppercase tracking-widest transition-all">
                        {t('analysis.viewClip')}
                    </button>
                )}
            </div>
        </div>
    );
};

const VolumeWidget = () => {
    const { t, unit } = useSettings();
    const { history } = useWorkout();
    const hasHistory = (history?.length || 0) > 0;

    const volumeData = React.useMemo(() => {
        if (!hasHistory) return [];

        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const weekData = days.map(day => ({ day, val: 0, active: false }));
        const today = now.toDateString();

        history.forEach(session => {
            const sessionDate = session.completedAt ? new Date(session.completedAt) : new Date(session.date);
            if (sessionDate >= startOfWeek) {
                const dayIndex = sessionDate.getDay();
                let sessionVolume = 0;

                if (session.exercises) {
                    session.exercises.forEach(ex => {
                        ex.sets?.forEach(s => {
                            if (s.isCompleted) {
                                sessionVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
                            }
                        });
                    });
                }

                weekData[dayIndex].val += sessionVolume;

                if (sessionDate.toDateString() === today) {
                    weekData[dayIndex].active = true;
                }
            }
        });

        // Normalize values to percentages for the bars
        const maxVolume = Math.max(...weekData.map(d => d.val), 1);
        return weekData.map(d => ({
            ...d,
            val: (d.val / maxVolume) * 100,
            displayVal: d.val
        }));
    }, [history, hasHistory]);

    // Reorder to start from Monday if preferred, but the mock started from MON
    const orderedVolumeData = React.useMemo(() => {
        if (volumeData.length === 0) return [];
        const monToSun = [...volumeData.slice(1), volumeData[0]];
        return monToSun;
    }, [volumeData]);

    return (
        <div className="glass-panel px-4 py-6 md:p-8 border-none space-y-4 xl:space-y-8 h-full">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('analysis.weeklyAccumulatedVolume')}</span>
            </div>

            <div className="flex items-end justify-between h-32 xl:h-48 gap-2">
                {hasHistory ? (
                    orderedVolumeData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                            <div className="w-full relative flex items-end justify-center h-full">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(d.val, 5)}%` }}
                                    className={cn(
                                        "w-full max-w-[40px] transition-all duration-500",
                                        d.active ? "bg-volt shadow-[0_0_20px_var(--primary-glow)]" : "bg-zinc-800 group-hover/bar:bg-zinc-700"
                                    )}
                                />
                                {/* Tooltip on hover */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-void border border-white/10 px-2 py-1 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    <span className="text-[8px] font-black text-white">{d.displayVal.toLocaleString()} {unit === 'metric' ? 'kg' : 'LBS'}</span>
                                </div>
                            </div>
                            <span className={cn(
                                "text-[9px] font-black tracking-widest transition-colors",
                                d.active ? "text-volt" : "text-zinc-600"
                            )}>
                                {d.day}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/5 bg-void/20">
                        <span className="text-4xl font-black text-zinc-800 mb-2">–</span>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">
                            {t('analysis.awaitingData')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MacrosWidget = () => {
    const { t } = useSettings();
    const { history } = useWorkout();
    const hasHistory = (history?.length || 0) > 0;

    const macrosData = hasHistory ? [
        { label: t('analysis.protein'), current: 180 + ((history?.length || 0) * 5) % 50, target: 220, color: 'bg-volt' },
        { label: t('analysis.carbs'), current: 300 + ((history?.length || 0) * 10) % 100, target: 450, color: 'bg-white' },
        { label: t('analysis.fats'), current: 60 + ((history?.length || 0) * 2) % 20, target: 85, color: 'bg-white' },
    ] : [];

    return (
        <div className="glass-panel px-4 py-6 md:p-8 border-none space-y-4 xl:space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-volt drop-shadow-[0_0_8px_rgba(215,255,0,0.4)]">{t('analysis.macroDistribution')}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-volt bg-volt/10 px-1.5 py-0.5 border border-volt/20">EXP</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {hasHistory ? (
                    <div className="space-y-3 xl:space-y-6">
                        {macrosData.map((m, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-xs font-black", m.label === t('analysis.protein') ? 'text-volt' : 'text-white')}>{m.current}g</span>
                                        <span className="text-[9px] font-bold text-zinc-600">/ {m.target}g</span>
                                    </div>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(m.current / m.target) * 100}%` }}
                                        className={cn("h-full", m.color)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/5 bg-void/20 py-8">
                        <span className="text-2xl font-black text-zinc-800 mb-1">–</span>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">
                            {t('analysis.awaitingData')}
                        </p>
                    </div>
                )}
            </div>

            <div className="pt-2 xl:pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('analysis.totalCalories')}</span>
                <span className="text-xs xl:text-sm font-black italic">{hasHistory ? '2,815 Kcal' : '–'}</span>
            </div>
        </div>
    );
};


export const ExternalActivityWidget = () => {
    const { t } = useSettings();
    const { recoveryHistory, getCalibrationStatus } = useWorkout();
    const calibration = getCalibrationStatus();
    const [timeFrame, setTimeFrame] = useState<'1M' | '3M' | '6M' | 'ALL'>('1M');

    const filteredData = useMemo(() => {
        if (!recoveryHistory || recoveryHistory.length === 0) return [];

        const now = new Date();
        let startDate = new Date(0);
        if (timeFrame === '1M') startDate = new Date(now.setMonth(now.getMonth() - 1));
        else if (timeFrame === '3M') startDate = new Date(now.setMonth(now.getMonth() - 3));
        else if (timeFrame === '6M') startDate = new Date(now.setMonth(now.getMonth() - 6));

        return recoveryHistory.filter(r => r.timestamp > startDate.getTime());
    }, [recoveryHistory, timeFrame]);

    const totalHours = filteredData.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / 60;
    const avgRpe = filteredData.length > 0 ? (filteredData.reduce((acc, curr) => acc + curr.rpe, 0) / filteredData.length) : 0;

    const { weeklyCumulativeScore, chartData } = getTacticalImpact(filteredData);

    let impactColor = "text-volt";
    let impactLabel = "Optimal";
    if (weeklyCumulativeScore > 5 && weeklyCumulativeScore <= 12) {
        impactColor = "text-zinc-400";
        impactLabel = "Moderate";
    } else if (weeklyCumulativeScore > 12) {
        impactColor = "text-crimson";
        impactLabel = "High Interference";
    }

    return (
        <div className="glass-panel px-4 py-6 md:p-8 border-none h-full flex flex-col relative overflow-hidden group/module w-full min-w-0">
            {/* Tactical Grid Background overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.05] transition-opacity duration-700"
                style={{ backgroundImage: 'radial-gradient(var(--primary-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 relative z-10 w-full">
                <div>
                    <h2 className="font-headline text-2xl font-black uppercase italic tracking-tight">{t('analysis.tacticalIntegration')}</h2>
                </div>

                <div className="flex gap-1 bg-void p-1 border border-white/5 flex-wrap md:flex-nowrap shrink-0">
                    {(['1M', '3M', '6M', 'ALL'] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={cn(
                                "px-3 py-1.5 md:px-4 md:py-2 font-headline text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                                timeFrame === tf ? "bg-volt text-void" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 mb-6 relative z-10 w-full gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                        {timeFrame === '1M' ? t('analysis.monthly') :
                            timeFrame === '3M' ? '3 MONTHS' :
                                timeFrame === '6M' ? '6 MONTHS' : 'TOTAL'} HOURS
                    </span>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black italic">{totalHours.toFixed(1)}</span>
                        <span className="text-xs font-bold text-zinc-600 mb-1">hrs</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">AVG RPE</span>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black italic text-volt">{avgRpe > 0 ? avgRpe.toFixed(1) : '–'}</span>
                    </div>
                </div>
                <div className="flex flex-col col-span-2 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block relative">
                            Program Impact
                        </span>
                        <InfoTooltip term="ProgramImpact" />
                    </div>
                    <span className={`text-xl sm:text-2xl lg:text-3xl font-black uppercase ${impactColor}`}>
                        {impactLabel} <span className="text-white text-lg sm:text-xl lg:text-2xl ml-1">({weeklyCumulativeScore.toFixed(1)})</span>
                    </span>
                </div>
            </div>

            <div className="h-[200px] w-full relative z-10 mb-6 min-w-0">
                <TacticalChart data={chartData} />
            </div>

            <div className="mt-auto border-t border-volt/20 pt-4 relative z-10">
                <div className="flex items-start gap-3">
                    <Zap className="text-volt shrink-0 mt-0.5" size={16} />
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-volt mb-1">Volt Arena AI Tip</span>
                        <p className="text-xs text-zinc-400">
                            {calibration.hasAerobicInterference
                                ? "You're accumulating too much systemic fatigue from extracurricular activities. Consider lowering the RPE of your tactical missions or reducing duration to preserve force production for the barbell."
                                : "Keep tactical missions at an RPE of 7 or lower on days prior to lower-body training to prevent central nervous system fatigue."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WIDGET_COMPONENTS: Record<WidgetId, React.FC<any>> = {
    'recovery-analysis': ReadinessAnalysisWidget,
    pr: PRWidget,
    macros: MacrosWidget,
};

interface SortableWidgetProps {
    id: WidgetId;
    span: string;
    onRemove: (id: WidgetId) => void;
    onContinueSession?: () => void;
    onViewHistory?: (sessionId?: string) => void;
    isLifting?: boolean;
    experimentalFeatures?: boolean;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
    id, span, onRemove, onContinueSession, onViewHistory, isLifting, experimentalFeatures
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: !experimentalFeatures });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const Component = WIDGET_COMPONENTS[id];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                span,
                "relative group/widget transition-all duration-300",
                isDragging ? "opacity-20 scale-95 grayscale" : "opacity-100"
            )}
        >
            {/* Immersive Controls (Appear on Hover) */}
            {!isDragging && experimentalFeatures && (
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-300">
                    <div
                        {...attributes}
                        {...listeners}
                        className="w-10 h-10 bg-void/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-volt hover:border-volt/50 cursor-grab active:cursor-grabbing transition-all"
                    >
                        <GripVertical size={16} />
                    </div>
                    <button
                        onClick={() => onRemove(id)}
                        className="w-10 h-10 bg-crimson/10 backdrop-blur-xl border border-crimson/20 flex items-center justify-center text-crimson/50 hover:text-crimson hover:bg-crimson/20 transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* @ts-ignore */}
            <Component onContinueSession={onContinueSession} onViewHistory={onViewHistory} isLifting={isLifting} />
        </div>
    );
};

interface AnalysisViewProps {
    onContinueSession?: () => void;
    onViewBriefing?: () => void;
    onViewHistory?: (sessionId?: string) => void;
    isLifting?: boolean;
}

export const AnalysisView = ({ onContinueSession, onViewBriefing, onViewHistory, isLifting }: AnalysisViewProps) => {
    const { t, experimentalFeatures, dashboardWidgets, setDashboardWidgets } = useSettings();
    const [activeId, setActiveId] = useState<WidgetId | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [widgetToRemove, setWidgetToRemove] = useState<WidgetId | null>(null);

    const widgets = dashboardWidgets;
    const setWidgets = (newWidgets: WidgetId[] | ((prev: WidgetId[]) => WidgetId[])) => {
        if (typeof newWidgets === 'function') {
            setDashboardWidgets(newWidgets(widgets));
        } else {
            setDashboardWidgets(newWidgets);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id as WidgetId);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWidgets((items) => {
                const oldIndex = items.indexOf(active.id as WidgetId);
                const newIndex = items.indexOf(over.id as WidgetId);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const removeWidget = (id: WidgetId) => {
        setWidgetToRemove(id);
    };

    const confirmRemoveWidget = () => {
        if (widgetToRemove) {
            setWidgets(widgets.filter(w => w !== widgetToRemove));
            setWidgetToRemove(null);
        }
    };

    const cancelRemoveWidget = () => {
        setWidgetToRemove(null);
    };

    const addWidget = (id: WidgetId) => {
        if (!widgets.includes(id)) {
            setWidgets([...widgets, id]);
        }
        setIsLibraryOpen(false);
    };

    const availableWidgets = ALL_WIDGETS.filter(w => !widgets.includes(w.id));
    const visibleWidgets = widgets.filter(id => {
        if (id === 'macros' || id === 'pr') {
            return experimentalFeatures;
        }
        return true;
    });

    return (
        <>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 xl:gap-8 auto-rows-min w-full">
                    <SortableContext
                        items={visibleWidgets}
                        strategy={verticalListSortingStrategy}
                    >
                        {visibleWidgets.map((id) => {
                            const widget = ALL_WIDGETS.find(w => w.id === id);
                            if (!widget) return null;
                            return (
                                <SortableWidget
                                    key={id}
                                    id={id}
                                    span={widget.span}
                                    onRemove={removeWidget}
                                    onContinueSession={onContinueSession}
                                    onViewHistory={onViewHistory}
                                    isLifting={isLifting}
                                    experimentalFeatures={experimentalFeatures}
                                />
                            );
                        })}
                    </SortableContext>
                </div>

                <DragOverlay adjustScale={true} dropAnimation={{
                    duration: 400,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.4',
                            },
                        },
                    }),
                }}>
                    {activeId ? (
                        <div className="z-50 pointer-events-none w-full max-w-[calc(100vw-4rem)]">
                            <div className="scale-105 shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden ring-2 ring-volt/20">
                                {React.createElement(WIDGET_COMPONENTS[activeId])}
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <CustomizeDashboardModal
                isOpen={isCustomizeModalOpen}
                onClose={() => setIsCustomizeModalOpen(false)}
                currentWidgets={widgets}
                onSave={(newWidgets) => setWidgets(newWidgets)}
                type="dashboard"
            />

            <ConfirmationModal
                isOpen={!!widgetToRemove}
                title={t('analysis.removeModule')}
                message={t('analysis.removeModuleMessage', { module: widgetToRemove ? t(ALL_WIDGETS.find(w => w.id === widgetToRemove)?.label as any || '') : '' })}
                confirmLabel={t('analysis.remove')}
                cancelLabel={t('analysis.keep')}
                onConfirm={confirmRemoveWidget}
                onCancel={cancelRemoveWidget}
            />
        </>
    );
};


