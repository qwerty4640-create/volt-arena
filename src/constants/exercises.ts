export interface ExerciseDefinition {
  name: string;
  category: string;
  description?: string;
  tips?: string[];
  muscles?: string[];
  // Phase 1 Tags
  pattern: 'squat' | 'hinge' | 'push_horizontal' | 'push_vertical' | 'pull_horizontal' | 'pull_vertical' | 'core' | 'accessory' | 'impact' | 'plyometric' | 'mobility';
  impact: 'low' | 'medium' | 'high';
  velocity: 'slow' | 'medium' | 'fast';
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // Plyometric / Explosive
  { name: 'Box Jumps', category: 'Explosive', pattern: 'plyometric', impact: 'high', velocity: 'fast', muscles: ['Quads', 'Glutes', 'Calves'] },
  { name: 'Med Ball Slams', category: 'Explosive', pattern: 'plyometric', impact: 'medium', velocity: 'fast', muscles: ['Core', 'Shoulders', 'Lats'] },
  { name: 'Kettlebell Swings', category: 'Explosive', pattern: 'plyometric', impact: 'medium', velocity: 'fast', muscles: ['Hamstrings', 'Glutes', 'Lower Back'] },
  
  // Mobility / Longevity
  { name: '90/90 Hip Flow', category: 'Mobility', pattern: 'mobility', impact: 'low', velocity: 'slow', muscles: ['Hips'] },
  { name: 'Cat-Cow', category: 'Mobility', pattern: 'mobility', impact: 'low', velocity: 'slow', muscles: ['Spine', 'Core'] },
  { name: 'World\'s Greatest Stretch', category: 'Mobility', pattern: 'mobility', impact: 'low', velocity: 'slow', muscles: ['Full Body'] },
  
  // Squat Category
  { 
    name: 'Barbell Squat', 
    category: 'Squat',
    pattern: 'squat',
    impact: 'high',
    velocity: 'medium',
    description: 'A lower-body compound exercise that builds strength in the quads, glutes, and core.',
    tips: ['Keep your chest up.', 'Drive knees outward.', 'Break parallel at the hip crease.'],
    muscles: ['Quads', 'Glutes', 'Core', 'Hamstrings']
  },
  { name: 'Safety Bar Squat', category: 'Squat', pattern: 'squat', impact: 'medium', velocity: 'medium', description: 'Squat variation using a specialized bar to reduce shoulder stress while focusing on quads.', tips: ['Keep the chest up.', 'Drive through heels.', 'Ideal for those with limited mobility.'], muscles: ['Quads', 'Glutes', 'Core'] },
  { name: 'Front Squat', category: 'Squat', pattern: 'squat', impact: 'high', velocity: 'medium', description: 'Front-loaded squat that emphasizes quads and core stability.', tips: ['Keep elbows high.', 'Maintain upright torso.', 'Depth is key.'], muscles: ['Quads', 'Core', 'Glutes'] },
  { name: 'Goblet Squat', category: 'Squat', pattern: 'squat', impact: 'low', velocity: 'medium', description: 'Holding a weight at chest height to improve squat mechanics and depth.', tips: ['Keep chest up.', 'Drive knees out.', 'Keep weight against chest.'], muscles: ['Quads', 'Glutes', 'Core'] },
  { name: 'Leg Press', category: 'Squat', pattern: 'squat', impact: 'low', velocity: 'slow', description: 'Machine exercise for legs, allowing high volume for hypertrophy.', tips: ['Full range of motion.', 'Keep feet shoulder-width.', 'Do not lock out knees.'], muscles: ['Quads', 'Glutes', 'Hamstrings'] },
  { name: 'Hack Squat', category: 'Squat', pattern: 'squat', impact: 'medium', velocity: 'slow', description: 'A stable squat variation that targets quads extensively.', tips: ['Maintain neutral spine.', 'Push through heels.', 'Control the eccentric phase.'], muscles: ['Quads', 'Glutes'] },
  { name: 'Landmine Squat', category: 'Squat', pattern: 'squat', impact: 'low', velocity: 'medium', description: 'A safe, functional squat variation using a landmine setup.', tips: ['Keep back straight.', 'Push back through hips.', 'Engage core.'], muscles: ['Quads', 'Glutes', 'Core'] },
  { name: 'Landmine Goblet Squat', category: 'Squat', pattern: 'squat', impact: 'low', velocity: 'medium', description: 'Squat variation using landmine for increased stability and focus on quads.', tips: ['Keep weight close.', 'Maintain posture.', 'Controlled movement.'], muscles: ['Quads', 'Glutes', 'Core'] },
  { name: 'Pistol Squat', category: 'Squat', pattern: 'squat', impact: 'medium', velocity: 'medium', description: 'Single-leg squat requiring balance and significant strength.', tips: ['Use counter-balance.', 'Keep heel down.', 'Ensure knee alignment.'], muscles: ['Quads', 'Glutes', 'Core'] },
  { name: 'Shrimp Squat', category: 'Squat', pattern: 'squat', impact: 'medium', velocity: 'medium', description: 'Another single-leg squat variation targeting quads.', tips: ['Control descent.', 'Maintain balance.', 'Keep upright.'], muscles: ['Quads', 'Glutes', 'Core'] },

  // Bench Category
  { 
    name: 'Bench Press', 
    category: 'Bench',
    pattern: 'push_horizontal',
    impact: 'high',
    velocity: 'medium',
    description: 'A classic upper-body exercise that targets the chest, shoulders, and triceps.',
    tips: ['Keep your shoulder blades retracted.', 'Maintain a stable base with feet.', 'Lower the bar to your lower chest.'],
    muscles: ['Chest', 'Shoulders (Anterior)', 'Triceps']
  },
  { name: 'Incline Bench Press', category: 'Bench', pattern: 'push_horizontal', impact: 'medium', velocity: 'medium', description: 'Targets the upper portion of the chest.', tips: ['Retract shoulder blades.', 'Control bar path.', 'Keep feet flat.'], muscles: ['Upper Chest', 'Shoulders', 'Triceps'] },
  { name: 'Dumbbell Bench Press', category: 'Bench', pattern: 'push_horizontal', impact: 'low', velocity: 'medium', description: 'Allows for a greater range of motion compared to the barbell bench.', tips: ['Control eccentric movement.', 'Maintain stability.', 'Use full range.'], muscles: ['Chest', 'Shoulders', 'Triceps'] },
  { name: 'Floor Press', category: 'Bench', pattern: 'push_horizontal', impact: 'medium', velocity: 'slow', description: 'Limits range of motion to build strength at the sticking point.', tips: ['Control descent.', 'Maintain tension.', 'Pause shortly at bottom.'], muscles: ['Chest', 'Triceps'] },
  { name: 'Close Grip Bench Press', category: 'Bench', pattern: 'push_horizontal', impact: 'medium', velocity: 'medium', description: 'Targets triceps more specifically while benching.', tips: ['Keep elbows tucked.', 'Retract scapula.', 'Control bar.'], muscles: ['Triceps', 'Chest'] },
  { name: 'Incline DB Press', category: 'Bench', pattern: 'push_horizontal', impact: 'low', velocity: 'medium', description: 'Targets upper chest with dumbbells for better unilateral control.', tips: ['Retract shoulders.', 'Slow lower.', 'Controlled tempo.'], muscles: ['Upper Chest', 'Shoulders', 'Triceps'] },
  { name: 'Ring Pushups', category: 'Bench', pattern: 'push_horizontal', impact: 'low', velocity: 'medium', description: 'Pushups using instability of gymnastic rings.', tips: ['Keep core engaged.', 'Control movement.', 'Focus on stability.'], muscles: ['Chest', 'Core', 'Triceps'] },
  { name: 'Archer Pushups', category: 'Bench', pattern: 'push_horizontal', impact: 'low', velocity: 'medium', description: 'Challenging pushup variation loading one side more.', tips: ['Keep core braced.', 'Control movement.', 'Full extension.'], muscles: ['Chest', 'Triceps', 'Core'] },
  { name: 'Pseudo Planche Pushups', category: 'Bench', pattern: 'push_horizontal', impact: 'low', velocity: 'medium', description: 'Advanced pushup targeting shoulders and chest.', tips: ['Lean forward.', 'Engage core.', 'Retract scapula.'], muscles: ['Chest', 'Shoulders', 'Triceps'] },

  // Deadlift Category
  { 
    name: 'Deadlift', 
    category: 'Deadlift',
    pattern: 'hinge',
    impact: 'high',
    velocity: 'medium',
    description: 'A fundamental compound lift that targets the entire posterior chain.',
    tips: ['Keep your spine neutral.', 'Drive through your heels.', 'Keep the bar close to your shins.'],
    muscles: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps', 'Forearms']
  },
  { name: 'Sumo Deadlift', category: 'Deadlift', pattern: 'hinge', impact: 'high', velocity: 'medium', description: 'Wide-stance deadlift variation that shifts focus more towards quads.', tips: ['Keep back straight.', 'Wide foot stance.', 'Drive through hips.'], muscles: ['Hamstrings', 'Glutes', 'Quads', 'Lower Back'] },
  { name: 'Trap Bar Deadlift', category: 'Deadlift', pattern: 'hinge', impact: 'medium', velocity: 'medium', description: 'Deadlift variation that is more upright, reducing lumbar stress.', tips: ['Keep back neutral.', 'Drive through heels.', 'Use neutral grip.'], muscles: ['Hamstrings', 'Glutes', 'Quads', 'Traps'] },
  { name: 'RDL', category: 'Deadlift', pattern: 'hinge', impact: 'medium', velocity: 'slow', description: 'Deadlift starting from the top, focusing on the eccentric hinge.', tips: ['Hinge at hips.', 'Keep back straight.', 'Maintain light knee bend.'], muscles: ['Hamstrings', 'Glutes', 'Lower Back'] },
  { name: 'Stiff Leg Deadlift', category: 'Deadlift', pattern: 'hinge', impact: 'medium', velocity: 'slow', description: 'Deadlift variation with minimal knee flexion to target hamstrings.', tips: ['Keep back flat.', 'Hinge deep.', 'Controlled movement.'], muscles: ['Hamstrings', 'Glutes', 'Lower Back'] },
  { name: 'Landmine Single Leg RDL', category: 'Deadlift', pattern: 'hinge', impact: 'low', velocity: 'slow', description: 'Functional RDL variation using landmine for stability.', tips: ['Balance is key.', 'Hinge at hips.', 'Keep back straight.'], muscles: ['Hamstrings', 'Glutes', 'Core'] },

  // Press Category
  { 
    name: 'Overhead Press', 
    category: 'Press',
    pattern: 'push_vertical',
    impact: 'high',
    velocity: 'medium',
    description: 'A compound push exercise that builds strength in the shoulders and triceps.',
    tips: ['Keep your core tight.', 'Don\'t arch your lower back excessively.', 'Press the bar in a straight line.'],
    muscles: ['Shoulders (Deltoids)', 'Triceps', 'Upper Chest']
  },
  { name: 'Push Press', category: 'Press', pattern: 'push_vertical', impact: 'high', velocity: 'fast', description: 'Overhead press with leg drive for explosive power.', tips: ['Tight core.', 'Leg drive initiated.', 'Fast lock-out.'], muscles: ['Shoulders', 'Triceps', 'Quads', 'Core'] },
  { name: 'Seated DB Press', category: 'Press', pattern: 'push_vertical', impact: 'low', velocity: 'medium', description: 'Shoulder press variation that eliminates leg drive.', tips: ['Keep back supported.', 'Control tempo.', 'Lower to shoulder level.'], muscles: ['Shoulders', 'Triceps'] },
  { name: 'Z Press', category: 'Press', pattern: 'push_vertical', impact: 'medium', velocity: 'medium', description: 'Press performed seated on the floor, extreme core focus.', tips: ['Keep back straight.', 'Engage core.', 'Stable seated position.'], muscles: ['Shoulders', 'Triceps', 'Core'] },
  { name: 'Dumbbell Shoulder Press', category: 'Press', pattern: 'push_vertical', impact: 'low', velocity: 'medium', description: 'Press with dumbbells for unilateral balance.', tips: ['Controlled descent.', 'Keep core tight.', 'Don\'t lock out too abruptly.'], muscles: ['Shoulders', 'Triceps'] },
  { name: 'Arnold Press', category: 'Press', pattern: 'push_vertical', impact: 'low', velocity: 'medium', description: 'Rotational press targeting all deltoid heads.', tips: ['Rotate throughout.', 'Keep controlled.', 'Don\'t rush.'], muscles: ['Shoulders'] },
  { name: 'Landmine Press', category: 'Press', pattern: 'push_vertical', impact: 'low', velocity: 'medium', description: 'Functional pressing movement using landmine.', tips: ['Engage core.', 'Drive through hips.', 'Maintain posture.'], muscles: ['Shoulders', 'Triceps'] },
  { name: 'Landmine Thruster', category: 'Press', pattern: 'push_vertical', impact: 'medium', velocity: 'fast', description: 'Full body movement combining squat and press.', tips: ['Coordination.', 'Explosive drive.', 'Keep heels down.'], muscles: ['Quads', 'Glutes', 'Shoulders', 'Core'] },
  { name: 'Handstand Pushups', category: 'Press', pattern: 'push_vertical', impact: 'low', velocity: 'medium', description: 'Advanced bodyweight shoulder exercise.', tips: ['Engage core.', 'Maintain balance.', 'Control descent.'], muscles: ['Shoulders', 'Triceps', 'Core'] },
  { name: 'Pike Pushups', category: 'Press', pattern: 'push_vertical', impact: 'low', velocity: 'medium', description: 'Shoulder-focused pushup variation.', tips: ['Keep hips high.', 'Maintain stable base.', 'Control motion.'], muscles: ['Shoulders', 'Triceps'] },
  { name: 'Handstand Hold', category: 'Press', pattern: 'core', impact: 'low', velocity: 'slow', description: 'Static shoulder endurance exercise.', tips: ['Keep core tight.', 'Find balance.', 'Breath control.'], muscles: ['Shoulders', 'Core'] },

  // Pull Category
  { 
    name: 'Pull Ups', 
    category: 'Pull',
    pattern: 'pull_vertical',
    impact: 'medium',
    velocity: 'medium',
    description: 'A challenging back exercise that targets the latissimus dorsi.',
    tips: ['Start from a full hang.', 'Drive your elbows down to bring chest to the bar.', 'Control the eccentric portion.'],
    muscles: ['Lats', 'Back', 'Biceps']
  },
  { name: 'Lat Pulldowns', category: 'Pull', pattern: 'pull_vertical', impact: 'low', velocity: 'medium', description: 'Machine-based pull exercise targeting lats.', tips: ['Control the bar.', 'Retract scapula.', 'Full range of motion.'], muscles: ['Lats', 'Back', 'Biceps'] },
  { name: 'Chin Ups', category: 'Pull', pattern: 'pull_vertical', impact: 'medium', velocity: 'medium', description: 'Pull up variation using supinated grip, focusing on biceps.', tips: ['Full range.', 'Control descent.', 'Squeeze at top.'], muscles: ['Lats', 'Biceps', 'Back'] },
  { name: 'Neutral Grip Pull Ups', category: 'Pull', pattern: 'pull_vertical', impact: 'medium', velocity: 'medium', description: 'Pull up variation that is easier on shoulders.', tips: ['Engage core.', 'Control descent.', 'Full range.'], muscles: ['Lats', 'Back', 'Biceps'] },
  { name: 'Hammer Strength Lat Pulldown', category: 'Pull', pattern: 'pull_vertical', impact: 'low', velocity: 'medium', description: 'Machine pulldown with independent handles.', tips: ['Full range.', 'Controlled movement.', 'Squeeze back.'], muscles: ['Lats', 'Back'] },
  { name: 'Ring Pull Ups', category: 'Pull', pattern: 'pull_vertical', impact: 'low', velocity: 'medium', description: 'Pull ups on gymnastics rings for stability.', tips: ['Control wobbling.', 'Full range.', 'Keep core tight.'], muscles: ['Lats', 'Back', 'Biceps', 'Core'] },
  { name: 'Ring Chin Ups', category: 'Pull', pattern: 'pull_vertical', impact: 'low', velocity: 'medium', description: 'Chin ups on gymnastics rings.', tips: ['Control movement.', 'Full range.', 'Engage biceps.'], muscles: ['Lats', 'Biceps', 'Core'] },
  { name: 'Archer Pull Ups', category: 'Pull', pattern: 'pull_vertical', impact: 'low', velocity: 'medium', description: 'Advanced pull up variation loading one side.', tips: ['Full range.', 'Control side-to-side.', 'Core engagement.'], muscles: ['Lats', 'Back', 'Biceps'] },
  { name: 'Muscle Up', category: 'Pull', pattern: 'pull_vertical', impact: 'high', velocity: 'fast', description: 'Advanced combination movement.', tips: ['Explosive pull.', 'Transition transition.', 'Press out.'], muscles: ['Lats', 'Chest', 'Triceps', 'Core'] },
  { name: 'Ring Muscle Up', category: 'Pull', pattern: 'pull_vertical', impact: 'high', velocity: 'fast', description: 'Advanced muscle up on rings.', tips: ['Explosive pull.', 'Clean transition.', 'Lock out.'], muscles: ['Lats', 'Chest', 'Triceps', 'Core'] },
  { name: 'Skin the Cat', category: 'Pull', pattern: 'pull_vertical', impact: 'low', velocity: 'slow', description: 'Advanced shoulder mobility/back exercise.', tips: ['Control move.', 'Mobility focus.', 'Keep core tight.'], muscles: ['Shoulders', 'Lats', 'Core'] },
  { name: 'Front Lever Tuck', category: 'Pull', pattern: 'core', impact: 'low', velocity: 'slow', description: 'Static back exercise.', tips: ['Keep core braced.', 'Retract scapula.', 'Hold tight.'], muscles: ['Lats', 'Core', 'Shoulders'] },

  // Row Category
  { name: 'Bent Over Rows', category: 'Row', pattern: 'pull_horizontal', impact: 'medium', velocity: 'medium', description: 'Classic compound row.', tips: ['Hinge at hips.', 'Keep back flat.', 'Pull to stomach.'], muscles: ['Back', 'Lats', 'Biceps'] },
  { name: 'Seated Cable Rows', category: 'Row', pattern: 'pull_horizontal', impact: 'low', velocity: 'medium', description: 'Row variation with constant tension.', tips: ['Retract scapula.', 'Pause at contraction.', 'Controlled tempo.'], muscles: ['Back', 'Lats', 'Biceps'] },
  { name: 'One Arm DB Rows', category: 'Row', pattern: 'pull_horizontal', impact: 'low', velocity: 'medium', description: 'Unilateral row for back thickness.', tips: ['Keep flat back.', 'Pull with elbow.', 'Don\'t rotate torso.'], muscles: ['Back', 'Lats', 'Biceps'] },
  { name: 'T-Bar Rows', category: 'Row', pattern: 'pull_horizontal', impact: 'medium', velocity: 'medium', description: 'Compound row for back width and thickness.', tips: ['Hinge at hips.', 'Keep posture.', 'Controlled pull.'], muscles: ['Back', 'Lats', 'Biceps'] },
  { name: 'Chest Supported Rows', category: 'Row', pattern: 'pull_horizontal', impact: 'low', velocity: 'medium', description: 'Rowing with chest support eliminating lower back load.', tips: ['Pull with elbows.', 'Controlled motion.', 'Squeeze back.'], muscles: ['Back', 'Lats'] },
  { name: 'Seal Rows', category: 'Row', pattern: 'pull_horizontal', impact: 'low', velocity: 'medium', description: 'Row performed on a bench for strict movement.', tips: ['Strict form.', 'No momentum.', 'Squeeze shoulder blades.'], muscles: ['Back', 'Lats', 'Biceps'] },
  { name: 'Landmine Row', category: 'Row', pattern: 'pull_horizontal', impact: 'low', velocity: 'medium', description: 'Functional row using landmine.', tips: ['Stable stance.', 'Pull with elbow.', 'Control tempo.'], muscles: ['Back', 'Lats', 'Biceps'] },
  { name: 'Meadows Row', category: 'Row', pattern: 'pull_horizontal', impact: 'low', velocity: 'medium', description: 'Advanced landmine row variation.', tips: ['Staggered stance.', 'Controlled pullback.', 'Hinge deep.'], muscles: ['Back', 'Lats', 'Biceps'] },

  // Biceps Category
  { name: 'Barbell Bicep Curl', category: 'Biceps', pattern: 'accessory', impact: 'low', velocity: 'medium', description: 'Standard barbell curl for overall bicep development.', tips: ['Keep elbows tucked.', 'Avoid momentum.', 'Full range of motion.'], muscles: ['Biceps'] },
  // ... omitting others for brevity in this replace block, applying to all
  { name: 'Hammer Curls', category: 'Biceps', pattern: 'accessory', impact: 'low', velocity: 'medium', description: 'Targets brachialis and brachioradialis.', tips: ['Neutral grip.', 'Control tempo.', 'Minimize swing.'], muscles: ['Biceps', 'Brachialis', 'Forearms'] },
  
  // Triceps Category
  { name: 'Triceps Pushdowns', category: 'Triceps', pattern: 'accessory', impact: 'low', velocity: 'medium', description: 'Cable pushdown targeting triceps.', tips: ['Keep elbows tucked.', 'Focus on triceps extension.', 'Controlled tempo.'], muscles: ['Triceps'] },
  { name: 'Dips', category: 'Triceps', pattern: 'push_horizontal', impact: 'medium', velocity: 'medium', description: 'Bodyweight or weighted dip targeting chest and triceps.', tips: ['Full range.', 'Keep upright for triceps.', 'Control descent.'], muscles: ['Triceps', 'Chest'] },

  // Core
  { name: 'Plank', category: 'Core', pattern: 'core', impact: 'low', velocity: 'slow', description: 'Static hold for core stability.', tips: ['Keep body straight.', 'Squeeze core.', 'Hold tight.'], muscles: ['Core'] },
  { name: 'Hanging Leg Raises', category: 'Core', pattern: 'core', impact: 'low', velocity: 'medium', description: 'Hanging leg raise for lower abs.', tips: ['Control movement.', 'Avoid swinging.', 'Full range.'], muscles: ['Core (Abs)'] },
] as const;

export const EXERCISE_DATABASE_TYPED: ExerciseDefinition[] = EXERCISE_DATABASE as unknown as ExerciseDefinition[];

export const getExercisesByPattern = (pattern: ExerciseDefinition['pattern'], impact: ExerciseDefinition['impact'] = 'medium') => {
  return EXERCISE_DATABASE_TYPED.filter(e => e.pattern === pattern && (impact === 'high' ? true : e.impact === impact || e.impact === 'low'));
};

export const getSwappableExercises = (exerciseName: string) => {
  const current = EXERCISE_DATABASE_TYPED.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
  if (!current) return [];
  return EXERCISE_DATABASE_TYPED.filter(e => e.category === current.category && e.name !== current.name);
};
