import { LucideIcon } from "lucide-react";

export type ViewType = 'analysis' | 'safety' | 'analytics' | 'berserker' | 'training' | 'settings' | 'workout-log' | 'post-workout' | 'workout-history' | 'profile' | 'deployment';
export type ImmersionMode = 'immersive' | 'ar';

export type WidgetId = 'recovery-analysis' | 'pr' | 'macros';
export type PerformanceWidgetId = 'progression' | 'volume-trend' | 'growth' | 'tactical';

export interface NavItem {
  id: ViewType;
  label: string;
  icon: LucideIcon;
}

export interface TelemetryData {
  verticality: number;
  depth: number;
  velocity: number;
  force: number;
  heartRate: number;
  cnsFatigue: 'Low' | 'Moderate' | 'High' | 'Critical';
}
