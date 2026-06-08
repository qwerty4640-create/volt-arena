import { Activity, Star, Utensils, ShieldCheck, LucideIcon, TrendingUp, BarChart3, Timer, Bone, Zap } from 'lucide-react';
import { WidgetId, PerformanceWidgetId } from '../types';

export interface Widget {
    id: WidgetId;
    label: string;
    icon: LucideIcon;
    span: string;
}

export const ALL_WIDGETS: Widget[] = [
    { id: 'recovery-analysis', label: 'analysis.recoveryAnalysis', icon: Activity, span: 'col-span-1 md:col-span-2 xl:col-span-3' },
    { id: 'active-recovery', label: 'recovery.title', icon: Zap, span: 'col-span-1 md:col-span-2 xl:col-span-3' },
    { id: 'readiness-trend', label: 'analysis.readinessTrend', icon: TrendingUp, span: 'col-span-1 md:col-span-2 xl:col-span-3' },
];

export interface PerformanceWidget {
    id: PerformanceWidgetId;
    label: string;
    icon: LucideIcon;
}

export const ALL_PERFORMANCE_WIDGETS: PerformanceWidget[] = [
    { id: 'progression', label: 'analytics.progression', icon: TrendingUp },
    { id: 'growth', label: 'analysis.est1rmGrowth', icon: Star },
    { id: 'tactical', label: 'analysis.tacticalIntegration', icon: Activity },
    { id: 'conditioning-tracker', label: 'Conditioning Tracker', icon: Timer },
    { id: 'mobility-matrix', label: 'Mobility Matrix', icon: Bone },
    { id: 'joint-stress', label: 'Joint Stress', icon: ShieldCheck },
];
