import { LucideIcon } from "lucide-react";

export type ViewType = 'analysis' | 'safety' | 'analytics' | 'berserker' | 'training' | 'settings' | 'workout-log' | 'post-workout' | 'workout-history' | 'profile' | 'deployment' | 'upcoming-missions' | 'fitness-test' | 'library';
export type ImmersionMode = 'immersive' | 'ar';

export type WidgetId = 'recovery-analysis' | 'active-recovery' | 'readiness-trend' | 'pr' | 'macros';
export type PerformanceWidgetId = 'progression' | 'growth' | 'tactical' | 'conditioning-tracker' | 'mobility-matrix' | 'joint-stress';

export interface NavItem {
  id: ViewType;
  label: string;
  icon: any;
  isExperimental?: boolean;
}

export interface TelemetryData {
  verticality: number;
  depth: number;
  velocity: number;
  force: number;
  heartRate: number;
  cnsFatigue: 'Low' | 'Moderate' | 'High' | 'Critical';
}
