export interface ExerciseDefinition {
  name: string;
  category: string;
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // Squat Category
  { name: 'Barbell Squat', category: 'Squat' },
  { name: 'Safety Bar Squat', category: 'Squat' },
  { name: 'Front Squat', category: 'Squat' },
  { name: 'Goblet Squat', category: 'Squat' },
  { name: 'Leg Press', category: 'Squat' },
  { name: 'Hack Squat', category: 'Squat' },
  { name: 'Landmine Squat', category: 'Squat' },
  { name: 'Landmine Goblet Squat', category: 'Squat' },
  { name: 'Pistol Squat', category: 'Squat' },
  { name: 'Shrimp Squat', category: 'Squat' },

  // Bench Category
  { name: 'Bench Press', category: 'Bench' },
  { name: 'Incline Bench Press', category: 'Bench' },
  { name: 'Dumbbell Bench Press', category: 'Bench' },
  { name: 'Floor Press', category: 'Bench' },
  { name: 'Close Grip Bench Press', category: 'Bench' },
  { name: 'Incline DB Press', category: 'Bench' },
  { name: 'Ring Pushups', category: 'Bench' },
  { name: 'Archer Pushups', category: 'Bench' },
  { name: 'Pseudo Planche Pushups', category: 'Bench' },

  // Deadlift Category
  { name: 'Deadlift', category: 'Deadlift' },
  { name: 'Sumo Deadlift', category: 'Deadlift' },
  { name: 'Trap Bar Deadlift', category: 'Deadlift' },
  { name: 'RDL', category: 'Deadlift' },
  { name: 'Stiff Leg Deadlift', category: 'Deadlift' },
  { name: 'Landmine Single Leg RDL', category: 'Deadlift' },

  // Press Category
  { name: 'Overhead Press', category: 'Press' },
  { name: 'Push Press', category: 'Press' },
  { name: 'Seated DB Press', category: 'Press' },
  { name: 'Z Press', category: 'Press' },
  { name: 'Dumbbell Shoulder Press', category: 'Press' },
  { name: 'Arnold Press', category: 'Press' },
  { name: 'Landmine Press', category: 'Press' },
  { name: 'Landmine Thruster', category: 'Press' },
  { name: 'Handstand Pushups', category: 'Press' },
  { name: 'Pike Pushups', category: 'Press' },
  { name: 'Handstand Hold', category: 'Press' },

  // Pull Category
  { name: 'Pull Ups', category: 'Pull' },
  { name: 'Lat Pulldowns', category: 'Pull' },
  { name: 'Chin Ups', category: 'Pull' },
  { name: 'Neutral Grip Pull Ups', category: 'Pull' },
  { name: 'Hammer Strength Lat Pulldown', category: 'Pull' },
  { name: 'Ring Pull Ups', category: 'Pull' },
  { name: 'Ring Chin Ups', category: 'Pull' },
  { name: 'Archer Pull Ups', category: 'Pull' },
  { name: 'Muscle Up', category: 'Pull' },
  { name: 'Ring Muscle Up', category: 'Pull' },
  { name: 'Skin the Cat', category: 'Pull' },
  { name: 'Front Lever Tuck', category: 'Pull' },
  { name: 'Front Lever', category: 'Pull' },

  // Row Category
  { name: 'Bent Over Rows', category: 'Row' },
  { name: 'Seated Cable Rows', category: 'Row' },
  { name: 'One Arm DB Rows', category: 'Row' },
  { name: 'T-Bar Rows', category: 'Row' },
  { name: 'Chest Supported Rows', category: 'Row' },
  { name: 'Seal Rows', category: 'Row' },
  { name: 'Landmine Row', category: 'Row' },
  { name: 'Meadows Row', category: 'Row' },

  // Biceps Category
  { name: 'Barbell Bicep Curl', category: 'Biceps' },
  { name: 'EZ Bar Curl', category: 'Biceps' },
  { name: 'Dumbbell Bicep Curl', category: 'Biceps' },
  { name: 'Hammer Curls', category: 'Biceps' },
  { name: 'Preacher Curls', category: 'Biceps' },
  { name: 'Incline DB Curls', category: 'Biceps' },
  { name: 'Concentration Curls', category: 'Biceps' },
  { name: 'Spider Curls', category: 'Biceps' },
  { name: 'Zottman Curls', category: 'Biceps' },
  { name: 'Cable Bicep Curls', category: 'Biceps' },
  { name: 'Reverse Curls', category: 'Biceps' },
  { name: 'Drag Curls', category: 'Biceps' },
  { name: 'Incline Hammer Curls', category: 'Biceps' },

  // Triceps Category
  { name: 'Triceps Pushdowns', category: 'Triceps' },
  { name: 'Overhead Triceps Extension', category: 'Triceps' },
  { name: 'Skull Crushers', category: 'Triceps' },
  { name: 'Dips', category: 'Triceps' },
  { name: 'Triceps Rope Pushdown', category: 'Triceps' },
  { name: 'Single Arm Cable Pushdown', category: 'Triceps' },
  { name: 'French Press', category: 'Triceps' },
  { name: 'JM Press', category: 'Triceps' },
  { name: 'Diamond Pushups', category: 'Triceps' },
  { name: 'Triceps Kickbacks', category: 'Triceps' },
  { name: 'Close Grip Pushups', category: 'Triceps' },
  { name: 'Ring Dips', category: 'Triceps' },
  { name: 'Bodyweight Skull Crushers', category: 'Triceps' },

  // Shoulders (Isolation)
  { name: 'Lateral Raises', category: 'Shoulders' },
  { name: 'Front Raises', category: 'Shoulders' },
  { name: 'Rear Delt Flyes', category: 'Shoulders' },
  { name: 'Face Pulls', category: 'Shoulders' },

  // Legs (Isolation)
  { name: 'Leg Extensions', category: 'Legs' },
  { name: 'Leg Curls', category: 'Legs' },
  { name: 'Calf Raises', category: 'Legs' },
  { name: 'Seated Calf Raises', category: 'Legs' },
  { name: 'Adductor Machine', category: 'Legs' },
  { name: 'Abductor Machine', category: 'Legs' },

  // Core
  { name: 'Plank', category: 'Core' },
  { name: 'Hanging Leg Raises', category: 'Core' },
  { name: 'Ab Wheel Rollouts', category: 'Core' },
  { name: 'Cable Crunches', category: 'Core' },
  { name: 'Russian Twists', category: 'Core' },
  { name: 'Dead Bugs', category: 'Core' },
  { name: 'Bird Dog', category: 'Core' },
  { name: 'Hollow Body Hold', category: 'Core' },
  { name: 'Dragon Flags', category: 'Core' },
  { name: 'Pallof Press', category: 'Core' },
  { name: 'Side Plank', category: 'Core' },
  { name: 'Woodchoppers', category: 'Core' },
  { name: 'V-Ups', category: 'Core' },
  { name: 'Bicycle Crunches', category: 'Core' },
  { name: 'Reverse Crunches', category: 'Core' },
  { name: 'L-Sits', category: 'Core' },
  { name: 'Ring L-Sit', category: 'Core' },
  { name: 'Tuck L-Sit', category: 'Core' },
  { name: 'Toes to Bar', category: 'Core' },
  { name: 'Around the World', category: 'Core' },
  { name: 'Back Lever', category: 'Core' },
  { name: 'Landmine Rotation', category: 'Core' },
  { name: 'Landmine Anti-Rotation', category: 'Core' },
];

export const getSwappableExercises = (exerciseName: string) => {
  const current = EXERCISE_DATABASE.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
  if (!current) return [];
  return EXERCISE_DATABASE.filter(e => e.category === current.category && e.name !== current.name);
};
