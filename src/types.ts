import { LucideIcon } from "lucide-react";

export type ViewType = 'analysis' | 'safety' | 'analytics' | 'berserker' | 'training' | 'settings' | 'workout-log' | 'post-workout' | 'workout-history' | 'profile';
export type ImmersionMode = 'immersive' | 'ar';

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
