import { LucideIcon } from "lucide-react";

export type ActivityCategory = 'Cardio' | 'Combat' | 'Strength' | 'Sport' | 'Recovery';

export interface ActivityType {
  id: string;
  label: string;
  baseMET: number;
  category: ActivityCategory;
  icon: string; // Lucide icon name or type
}

export const ACTIVITY_LIBRARY: ActivityType[] = [
  // Combat
  { id: 'combat_muay_thai', label: 'Muay Thai', baseMET: 10.5, category: 'Combat', icon: 'Flame' },
  { id: 'combat_bjj', label: 'BJJ', baseMET: 11.0, category: 'Combat', icon: 'User' },
  { id: 'combat_boxing', label: 'Boxing', baseMET: 12.0, category: 'Combat', icon: 'Flame' },
  { id: 'combat_wrestling', label: 'Wrestling', baseMET: 12.0, category: 'Combat', icon: 'User' },
  { id: 'combat_mma', label: 'MMA', baseMET: 11.5, category: 'Combat', icon: 'Flame' },
  { id: 'combat_kickboxing', label: 'Kickboxing', baseMET: 10.5, category: 'Combat', icon: 'Zap' },
  { id: 'combat_judo', label: 'Judo', baseMET: 10.0, category: 'Combat', icon: 'User' },

  // Cardio
  { id: 'cardio_running', label: 'Running', baseMET: 9.8, category: 'Cardio', icon: 'Activity' },
  { id: 'cardio_swimming', label: 'Swimming', baseMET: 8.0, category: 'Cardio', icon: 'Activity' },
  { id: 'cardio_cycling', label: 'Cycling', baseMET: 8.5, category: 'Cardio', icon: 'Zap' },
  { id: 'cardio_rucking', label: 'Rucking', baseMET: 9.0, category: 'Cardio', icon: 'Box' },
  { id: 'cardio_rowing', label: 'Rowing', baseMET: 8.5, category: 'Cardio', icon: 'Activity' },
  { id: 'cardio_sprinting', label: 'Sprinting', baseMET: 15.0, category: 'Cardio', icon: 'Zap' },
  { id: 'cardio_stairmaster', label: 'Stair climbing', baseMET: 9.0, category: 'Cardio', icon: 'Activity' },
  { id: 'cardio_jumprope', label: 'Jump Rope', baseMET: 11.0, category: 'Cardio', icon: 'Activity' },

  // Strength / Skill
  { id: 'strength_bouldering', label: 'Bouldering', baseMET: 7.5, category: 'Strength', icon: 'Dumbbell' },
  { id: 'strength_kettlebell', label: 'Kettlebell Flow', baseMET: 6.5, category: 'Strength', icon: 'Dumbbell' },
  { id: 'strength_hiit', label: 'HIIT', baseMET: 12.0, category: 'Strength', icon: 'Zap' },
  { id: 'strength_calisthenics', label: 'Calisthenics', baseMET: 8.0, category: 'Strength', icon: 'Dumbbell' },
  { id: 'strength_crossfit', label: 'CrossFit', baseMET: 11.0, category: 'Strength', icon: 'Flame' },
  { id: 'strength_powerlifting', label: 'Powerlifting', baseMET: 6.0, category: 'Strength', icon: 'Dumbbell' },
  { id: 'strength_weightlifting', label: 'Olympic Weightlifting', baseMET: 8.0, category: 'Strength', icon: 'Dumbbell' },
  
  // Sport
  { id: 'sport_basketball', label: 'Basketball', baseMET: 8.0, category: 'Sport', icon: 'Activity' },
  { id: 'sport_soccer', label: 'Soccer', baseMET: 10.0, category: 'Sport', icon: 'Activity' },
  { id: 'sport_tennis', label: 'Tennis', baseMET: 7.3, category: 'Sport', icon: 'Zap' },
  { id: 'sport_hockey', label: 'Hockey', baseMET: 9.0, category: 'Sport', icon: 'Activity' },
  { id: 'sport_parkour', label: 'Parkour', baseMET: 9.5, category: 'Sport', icon: 'Zap' },

  // Recovery
  { id: 'recovery_yoga', label: 'Yoga', baseMET: 3.0, category: 'Recovery', icon: 'Activity' },
  { id: 'recovery_mobility', label: 'Mobility', baseMET: 2.5, category: 'Recovery', icon: 'Activity' },
  { id: 'recovery_walking', label: 'Walking', baseMET: 3.5, category: 'Recovery', icon: 'Activity' },
  { id: 'recovery_pilates', label: 'Pilates', baseMET: 3.0, category: 'Recovery', icon: 'Activity' },
  { id: 'recovery_stretching', label: 'Stretching', baseMET: 2.3, category: 'Recovery', icon: 'Activity' },
];
