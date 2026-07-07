export interface ExerciseDefinition {
  id: string;
  name: string;
  category: string;
  description?: string;
  tips?: string[];
  instructions?: string[];
  muscles?: string[];
  jointStress?: string[];
  // Phase 1 Tags
  pattern: 'squat' | 'hinge' | 'push_horizontal' | 'push_vertical' | 'pull_horizontal' | 'pull_vertical' | 'core' | 'accessory' | 'impact' | 'plyometric' | 'mobility';
  impact: 'low' | 'medium' | 'high';
  velocity: 'slow' | 'medium' | 'fast';
  energySystem?: 'anaerobic_alactic' | 'anaerobic_lactic' | 'aerobic' | 'mixed';
  axialFatigueScore?: number;
  connectiveTissueStressScore?: number;
  gymRequired?: boolean;
  isUnilateral?: boolean;
  isCalisthenics?: boolean;
  isDumbbell?: boolean;
  // Ingested properties from ExerciseDB
  gifUrl?: string;
  bodyPart?: string;
  equipment?: string;
  targetMuscle?: string;
  secondaryMuscles?: string[];
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [

  {
    "id": "sissy_squat",
    "name": "Sissy Squat",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation movement for the quadriceps without external weight.",
    "instructions": [
      "Stand with feet shoulder-width.",
      "Keep knees tight, push them forward.",
      "Lean back, keeping torso aligned with thighs.",
      "Return to upright."
    ],
    "tips": [
      "Hold on to support.",
      "Keep knees forward.",
      "Maintain upright torso alignment."
    ],
    "muscles": [
      "Quads"
    ],
    "isCalisthenics": true,
    "gifUrl": "https://static.exercisedb.dev/media/xdYPUtE.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "calves",
      "glutes"
    ]
  },
  {
    "id": "reverse_nordic_curl",
    "name": "Reverse Nordic Curl",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Bodyweight isolation for the quadriceps using a reverse knee-dominant movement.",
    "instructions": [
      "Kneel on a soft surface.",
      "Keep torso, hips, and thighs aligned.",
      "Lean backward slowly while keeping core braced.",
      "Use quads to return to upright position."
    ],
    "tips": [
      "Brace core tightly.",
      "Keep movement slow and controlled.",
      "Don't hyper-extend the lower back."
    ],
    "muscles": [
      "Quads"
    ],
    "isCalisthenics": true,
    "gifUrl": "https://static.exercisedb.dev/media/E4PwJqI.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "calves"
    ]
  },
  {
    "id": "box_jumps",
    "name": "Box Jumps",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "high",
    "velocity": "fast",
    "description": "Explosive jump onto a raised platform to improve power and athletic performance.",
    "instructions": [
      "Stand in front of a sturdy box.",
      "Hinge slightly and swing arms back.",
      "Explosively jump onto the center of the box.",
      "Land softly in a partial squat.",
      "Step down carefully."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Calves",
      "Core"
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 7,
    "gifUrl": "https://static.exercisedb.dev/media/iPm26QU.gif",
    "bodyPart": "lower legs",
    "equipment": "body weight",
    "targetMuscle": "calves",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "med_ball_slams",
    "name": "Med Ball Slams",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "medium",
    "velocity": "fast",
    "description": "Throwing a medicine ball forcefully to the ground to develop explosive power in the core and upper back.",
    "instructions": [
      "Hold med ball overhead.",
      "Slam the ball down to the floor.",
      "Inhale and repeat."
    ],
    "muscles": [
      "Core",
      "Shoulders",
      "Lats",
      "Triceps"
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 3,
    "gifUrl": "https://static.exercisedb.dev/media/ktf3nvW.gif",
    "bodyPart": "chest",
    "equipment": "kettlebell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders",
      "core"
    ]
  },
  {
    "id": "kettlebell_swings",
    "name": "Kettlebell Swings",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "medium",
    "velocity": "fast",
    "description": "A hip-hinge movement that targets the posterior chain and improves explosive strength.",
    "instructions": [
      "Stand with kettlebell in front.",
      "Hinge at hips.",
      "Swing bell back.",
      "Explosively drive hips forward.",
      "Repeat."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower Back",
      "Core"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 4,
    "connectiveTissueStressScore": 4,
    "gifUrl": "https://static.exercisedb.dev/media/UHJlbu3.gif",
    "bodyPart": "upper legs",
    "equipment": "kettlebell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "core"
    ]
  },
  {
    "id": "90_90_hip_flow",
    "name": "90/90 Hip Flow",
    "category": "Mobility",
    "pattern": "mobility",
    "impact": "low",
    "velocity": "slow",
    "description": "Mobility exercise to improve hip internal and external rotation.",
    "instructions": [
      "Sit with one leg at 90 degrees forward, other leg at 90 degrees to side.",
      "Switch positions side to side.",
      "Keep chest tall."
    ],
    "muscles": [
      "Hips",
      "Glutes"
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/VO2qeJg.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "adductors",
    "secondaryMuscles": [
      "obliques",
      "glutes"
    ]
  },
  {
    "id": "cat_cow",
    "name": "Cat-Cow",
    "category": "Mobility",
    "pattern": "mobility",
    "impact": "low",
    "velocity": "slow",
    "description": "Yoga/mobility exercise to improve spinal flexibility and core awareness.",
    "instructions": [
      "Get on all fours.",
      "Inhale and arch back (cow).",
      "Exhale and round spine (cat).",
      "Move fluidly."
    ],
    "muscles": [
      "Spine",
      "Core",
      "Shoulders"
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/CosupLu.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "obliques",
      "shoulders"
    ]
  },
  {
    "id": "worlds_greatest_stretch",
    "name": "World's Greatest Stretch",
    "category": "Mobility",
    "pattern": "mobility",
    "impact": "low",
    "velocity": "slow",
    "description": "A comprehensive mobility stretch targeting hips, hamstrings, and thoracic spine.",
    "instructions": [
      "Lunge forward.",
      "Place inside arm on floor.",
      "Rotate upper body toward sky.",
      "Switch sides."
    ],
    "muscles": [
      "Hips",
      "Hamstrings",
      "Spine",
      "Shoulders"
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/DFGXwZr.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "quadriceps",
      "calves"
    ]
  },
  {
    "id": "squat_conventional",
    "name": "Barbell Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "high",
    "velocity": "medium",
    "description": "A foundational lower-body compound exercise that builds strength in the quads, glutes, core, and hamstrings.",
    "instructions": [
      "Position a barbell on the upper back (traps/rear delts).",
      "Stand with feet shoulder-width apart, toes slightly turned out.",
      "Brace your core and inhale deeply.",
      "Hinge at the hips and bend knees to lower down, keeping chest up and back straight.",
      "Go down until thighs are at least parallel to the floor (or deeper if mobility allows).",
      "Drive through your entire foot (heels and forefoot) to stand back up to the starting position.",
      "Exhale as you return to the start."
    ],
    "tips": [
      "Keep your chest up.",
      "Drive knees outward to avoid collapse.",
      "Break parallel at the hip crease."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core",
      "Hamstrings"
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 9,
    "connectiveTissueStressScore": 8,
    "gifUrl": "https://static.exercisedb.dev/media/qXTaZnJ.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "core"
    ]
  },
  {
    "id": "squat_safety_bar",
    "name": "Safety Bar Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "medium",
    "description": "Squat variation using a specialized bar to reduce shoulder stress while focusing on quads.",
    "instructions": [
      "Position the safety bar on your upper back.",
      "Step back, feet shoulder-width.",
      "Brace your core and hinge at hips.",
      "Lower until thighs parallel to floor.",
      "Drive up through heels."
    ],
    "tips": [
      "Keep the chest up.",
      "Drive through heels.",
      "Ideal for those with limited mobility."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 7,
    "connectiveTissueStressScore": 6,
    "gifUrl": "https://static.exercisedb.dev/media/Gnfo4FM.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "core"
    ]
  },
  {
    "id": "squat_high_bar",
    "name": "Front Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "high",
    "velocity": "medium",
    "description": "Front-loaded squat that emphasizes quads and core stability.",
    "instructions": [
      "Rest bar across front delts, elbows high.",
      "Maintain upright torso.",
      "Lower until thighs parallel.",
      "Drive through feet."
    ],
    "tips": [
      "Keep elbows high.",
      "Maintain upright torso.",
      "Depth is key."
    ],
    "muscles": [
      "Quads",
      "Core",
      "Glutes"
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 8,
    "connectiveTissueStressScore": 7,
    "gifUrl": "https://static.exercisedb.dev/media/zG0zs85.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "core"
    ]
  },
  {
    "id": "bodyweight_squat",
    "isCalisthenics": true,
    "name": "Bodyweight Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "low",
    "velocity": "medium",
    "description": "Fundamental lower body movement.",
    "instructions": [
      "Stand feet shoulder-width apart.",
      "Lower hips down and back.",
      "Push through feet to stand."
    ],
    "tips": [
      "Keep chest up.",
      "Knees track over toes.",
      "Sink to at least parallel."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 2,
    "gifUrl": "https://static.exercisedb.dev/media/75Bgtjy.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "quadriceps",
      "glutes"
    ]
  },
  {
    "id": "goblet_squat",
    "name": "Goblet Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "low",
    "velocity": "medium",
    "description": "Holding a weight at chest height to improve squat mechanics and depth.",
    "instructions": [
      "Hold weight at chest.",
      "Keep feet shoulder-width.",
      "Lower to squat.",
      "Drive through heels."
    ],
    "tips": [
      "Keep chest up.",
      "Drive knees out.",
      "Keep weight against chest."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 3,
    "connectiveTissueStressScore": 3,
    "gifUrl": "https://static.exercisedb.dev/media/yn8yg1r.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "glutes",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "leg_press",
    "name": "Leg Press",
    "category": "Squat",
    "pattern": "squat",
    "impact": "low",
    "velocity": "slow",
    "description": "Machine exercise for legs, allowing high volume for hypertrophy.",
    "instructions": [
      "Seat on machine.",
      "Place feet on platform.",
      "Lower platform toward you.",
      "Push platform away."
    ],
    "tips": [
      "Full range of motion.",
      "Keep feet shoulder-width.",
      "Do not lock out knees."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Hamstrings"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 4,
    "gifUrl": "https://static.exercisedb.dev/media/10Z2DXU.gif",
    "bodyPart": "upper legs",
    "equipment": "sled machine",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "hack_squat",
    "name": "Hack Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "slow",
    "description": "A stable squat variation that targets quads extensively.",
    "instructions": [
      "Get into hack squat machine.",
      "Push back against pad.",
      "Lower until depth is reached.",
      "Push through platform."
    ],
    "tips": [
      "Maintain neutral spine.",
      "Push through heels.",
      "Control the eccentric phase."
    ],
    "muscles": [
      "Quads",
      "Glutes"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 5,
    "gifUrl": "https://static.exercisedb.dev/media/Qa55kX1.gif",
    "bodyPart": "upper legs",
    "equipment": "sled machine",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "landmine_squat",
    "name": "Landmine Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "low",
    "velocity": "medium",
    "description": "A safe, functional squat variation using a landmine setup.",
    "instructions": [
      "Get into landmine position.",
      "Hold barbell.",
      "Squat down.",
      "Stand back up."
    ],
    "tips": [
      "Keep back straight.",
      "Push back through hips.",
      "Engage core."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 3,
    "connectiveTissueStressScore": 3,
    "gifUrl": "https://static.exercisedb.dev/media/pkSoCW9.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "landmine_goblet_squat",
    "name": "Landmine Goblet Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "low",
    "velocity": "medium",
    "description": "Squat variation using landmine for increased stability and focus on quads.",
    "instructions": [
      "Hold weight at your chest.",
      "Perform squat descent.",
      "Return to standing."
    ],
    "tips": [
      "Keep weight close.",
      "Maintain posture.",
      "Controlled movement."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 3,
    "connectiveTissueStressScore": 3,
    "gifUrl": "https://static.exercisedb.dev/media/yn8yg1r.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "glutes",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "pistol_squat",
    "isCalisthenics": true,
    "name": "Pistol Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Single-leg squat requiring balance and significant strength.",
    "instructions": [
      "Balance on one leg.",
      "Extend other leg.",
      "Lower into squat.",
      "Push up."
    ],
    "tips": [
      "Use counter-balance.",
      "Keep heel down.",
      "Ensure knee alignment."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 6,
    "gifUrl": "https://static.exercisedb.dev/media/nqs5HGV.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "standing_calf_raise",
    "isCalisthenics": true,
    "name": "Standing Calf Raise",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation exercise for calves.",
    "instructions": [
      "Stand on edge of block.",
      "Raise up on toes.",
      "Lower heels below block."
    ],
    "tips": [
      "Full range of motion.",
      "Paused contraction at top.",
      "Controlled tempo."
    ],
    "muscles": [
      "Calves"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/8ozhUIZ.gif",
    "bodyPart": "lower legs",
    "equipment": "barbell",
    "targetMuscle": "calves",
    "secondaryMuscles": [
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "db_lunges",
    "name": "Dumbbell Lunges",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Traditional lunge variation targeting legs, glutes, and balance.",
    "instructions": [
      "Hold dumbbells at sides.",
      "Step forward with one leg.",
      "Lower until both knees at 90 degrees.",
      "Push back to standing."
    ],
    "tips": [
      "Keep torso upright.",
      "Stride long enough.",
      "Control the descent."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/RRWFUcw.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "bench_flat",
    "name": "Bench Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "high",
    "velocity": "medium",
    "description": "A classic upper-body exercise that targets the chest, shoulders, and triceps.",
    "instructions": [
      "Lie on flat bench.",
      "Grip barbell wider than shoulder-width.",
      "Lower bar to mid-chest.",
      "Push bar back up until arms are locked."
    ],
    "tips": [
      "Keep your shoulder blades retracted.",
      "Maintain a stable base with feet.",
      "Lower the bar to your lower chest."
    ],
    "muscles": [
      "Chest",
      "Shoulders (Anterior)",
      "Triceps"
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 5,
    "gifUrl": "https://static.exercisedb.dev/media/EIeI8Vf.gif",
    "bodyPart": "chest",
    "equipment": "barbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ]
  },
  {
    "id": "bicep_cable_curl",
    "name": "Cable Bicep Curl",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "A constant tension curl variation using a cable machine.",
    "instructions": [
      "Attach straight bar to low pulley.",
      "Stand facing machine.",
      "Curl up while keeping elbows tucked.",
      "Lower with control."
    ],
    "tips": [
      "Keep elbows glued to sides.",
      "Squeeze biceps at the top.",
      "Avoid using lower back momentum."
    ],
    "muscles": [
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/G08RZcQ.gif",
    "bodyPart": "upper arms",
    "equipment": "cable",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "lateral_raise_db",
    "name": "Dumbbell Lateral Raise",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation exercise targeting the medial deltoid.",
    "instructions": [
      "Stand holding dumbbells at sides.",
      "Raise arms laterally until shoulder height.",
      "Lower slowly."
    ],
    "tips": [
      "Lead with elbows.",
      "Don't shrug.",
      "Keep a slight bend in elbows."
    ],
    "muscles": [
      "Side Delts"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/DsgkuIt.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ]
  },
  {
    "id": "cable_tricep_overhead",
    "name": "Cable Overhead Tricep Extension",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Tricep extension with cable for constant tension on the long head.",
    "instructions": [
      "Attach rope to low pulley.",
      "Face away from machine.",
      "Extend arms overhead.",
      "Lower behind head."
    ],
    "tips": [
      "Keep elbows close to head.",
      "Full stretch.",
      "Controlled tempo."
    ],
    "muscles": [
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/KWdF2JI.gif",
    "bodyPart": "upper arms",
    "equipment": "cable",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "shoulders"
    ]
  },
  {
    "id": "leg_extension",
    "name": "Leg Extension",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation exercise for quadriceps.",
    "instructions": [
      "Sit in leg extension machine.",
      "Extend legs until straight.",
      "Lower slowly."
    ],
    "tips": [
      "Controlled movement.",
      "Squeeze at top.",
      "Don't let weights touch at bottom."
    ],
    "muscles": [
      "Quads"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/my33uHU.gif",
    "bodyPart": "upper legs",
    "equipment": "leverage machine",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "hamstrings"
    ]
  },
  {
    "id": "leg_curl_seated",
    "name": "Seated Leg Curl",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation exercise for hamstrings using a seated machine.",
    "instructions": [
      "Sit in machine.",
      "Curl legs back.",
      "Control return."
    ],
    "tips": [
      "Keep back pressed against seat.",
      "Focus on hamstrings.",
      "Don't use momentum."
    ],
    "muscles": [
      "Hamstrings"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/Zg3XY7P.gif",
    "bodyPart": "upper legs",
    "equipment": "leverage machine",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "calves"
    ]
  },
  {
    "id": "leg_curl_standing",
    "name": "Standing Leg Curl",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation exercise for hamstrings using a standing cable.",
    "instructions": [
      "Stand facing the machine.",
      "Attach cable to ankle.",
      "Curl leg back.",
      "Control return."
    ],
    "tips": [
      "Keep torso upright.",
      "Focus on hamstrings.",
      "Don't use momentum."
    ],
    "muscles": [
      "Hamstrings"
    ],
    "gifUrl": "",
    "bodyPart": "upper legs",
    "equipment": "cable",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes"
    ]
  },
  {
    "id": "chest_press_machine",
    "name": "Chest Press Machine",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Controlled chest pressing using a machine.",
    "instructions": [
      "Sit in machine.",
      "Adjust handles to chest height.",
      "Push forward.",
      "Control return."
    ],
    "tips": [
      "Keep shoulder blades retracted.",
      "Stable posture.",
      "Full range of motion."
    ],
    "muscles": [
      "Chest",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/DOoWcnA.gif",
    "bodyPart": "chest",
    "equipment": "leverage machine",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ]
  },
  {
    "id": "cable_crossover",
    "name": "Cable Crossover",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation exercise targeting chest through full range of motion.",
    "instructions": [
      "Stand between cable stacks.",
      "Bring handles together in front of chest.",
      "Control return to stretch position."
    ],
    "tips": [
      "Keep upright torso.",
      "Focus on squeeze.",
      "Controlled tempo."
    ],
    "muscles": [
      "Chest"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/0CXGHya.gif",
    "bodyPart": "chest",
    "equipment": "cable",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "deltoids",
      "triceps"
    ]
  },
  {
    "id": "db_flys",
    "name": "Dumbbell Flys",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "slow",
    "description": "Isolation exercise for chest width and stretch.",
    "instructions": [
      "Lie on bench.",
      "Dumbbells together overhead.",
      "Lower arms wide to sides.",
      "Bring back together."
    ],
    "tips": [
      "Keep slight bend in elbows.",
      "Focus on chest stretch.",
      "Control descent."
    ],
    "muscles": [
      "Chest"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/yz9nUhF.gif",
    "bodyPart": "chest",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "shoulders"
    ]
  },
  {
    "id": "incline_bench_press",
    "name": "Incline Bench Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "medium",
    "velocity": "medium",
    "description": "Targets the upper portion of the chest.",
    "instructions": [
      "Lie on incline bench.",
      "Grip barbell.",
      "Lower to upper chest.",
      "Push back up."
    ],
    "tips": [
      "Retract shoulder blades.",
      "Control bar path.",
      "Keep feet flat."
    ],
    "muscles": [
      "Upper Chest",
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/3TZduzM.gif",
    "bodyPart": "chest",
    "equipment": "barbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "dumbbell_press",
    "name": "Dumbbell Bench Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Allows for a greater range of motion compared to the barbell bench.",
    "instructions": [
      "Lie on flat bench.",
      "Press dumbbells up.",
      "Lower until chest level.",
      "Push back up."
    ],
    "tips": [
      "Control eccentric movement.",
      "Maintain stability.",
      "Use full range."
    ],
    "muscles": [
      "Chest",
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/SpYC0Kp.gif",
    "bodyPart": "chest",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ]
  },
  {
    "id": "floor_press",
    "name": "Floor Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "medium",
    "velocity": "slow",
    "description": "Limits range of motion to build strength at the sticking point.",
    "instructions": [
      "Lie on floor.",
      "Lower bar until elbows touch floor.",
      "Push back up."
    ],
    "tips": [
      "Control descent.",
      "Maintain tension.",
      "Pause shortly at bottom."
    ],
    "muscles": [
      "Chest",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/neonEDL.gif",
    "bodyPart": "chest",
    "equipment": "barbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "deltoids",
      "triceps"
    ]
  },
  {
    "id": "close_grip_bench_press",
    "name": "Close Grip Bench Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "medium",
    "velocity": "medium",
    "description": "Targets triceps more specifically while benching.",
    "instructions": [
      "Grip close.",
      "Lower to chest.",
      "Push back up."
    ],
    "tips": [
      "Keep elbows tucked.",
      "Retract scapula.",
      "Control bar."
    ],
    "muscles": [
      "Triceps",
      "Chest"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/yB9SvIF.gif",
    "bodyPart": "upper arms",
    "equipment": "smith machine",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "chest",
      "shoulders"
    ]
  },
  {
    "id": "incline_dumbbell_press",
    "name": "Incline DB Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Targets upper chest with dumbbells for better unilateral control.",
    "instructions": [
      "Lie on incline.",
      "Press up.",
      "Lower to chest.",
      "Push back."
    ],
    "tips": [
      "Retract shoulders.",
      "Slow lower.",
      "Controlled tempo."
    ],
    "muscles": [
      "Upper Chest",
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/ns0SIbU.gif",
    "bodyPart": "chest",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "push_ups",
    "isCalisthenics": true,
    "name": "Push Ups",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Standard bodyweight chest pressing movement.",
    "instructions": [
      "Plank position.",
      "Lower chest to floor.",
      "Push back up."
    ],
    "tips": [
      "Keep body straight.",
      "Full range of motion.",
      "Engage core."
    ],
    "muscles": [
      "Chest",
      "Triceps",
      "Shoulders",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/I4hDWkc.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "deltoids",
      "core"
    ]
  },
  {
    "id": "ring_pushups",
    "isCalisthenics": true,
    "name": "Ring Pushups",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Pushups using instability of gymnastic rings.",
    "instructions": [
      "Hold rings.",
      "Lower down.",
      "Push up."
    ],
    "tips": [
      "Keep core engaged.",
      "Control movement.",
      "Focus on stability."
    ],
    "muscles": [
      "Chest",
      "Core",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/I4hDWkc.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "deltoids",
      "core"
    ]
  },
  {
    "id": "archer_pushups",
    "isCalisthenics": true,
    "name": "Archer Pushups",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Challenging pushup variation loading one side more.",
    "instructions": [
      "Pushup position.",
      "Shift to one side.",
      "Push up.",
      "Repeat."
    ],
    "tips": [
      "Keep core braced.",
      "Control movement.",
      "Full extension."
    ],
    "muscles": [
      "Chest",
      "Triceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/A9qxk2F.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders",
      "core"
    ]
  },
  {
    "id": "pseudo_planche_pushups",
    "isCalisthenics": true,
    "name": "Pseudo Planche Pushups",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Advanced pushup targeting shoulders and chest.",
    "instructions": [
      "Lean forward.",
      "Pushup.",
      "Push up."
    ],
    "tips": [
      "Lean forward.",
      "Engage core.",
      "Retract scapula."
    ],
    "muscles": [
      "Chest",
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/mAYqY4M.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "shoulders",
      "triceps",
      "core"
    ]
  },
  {
    "id": "deadlift_conventional",
    "name": "Deadlift",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "high",
    "velocity": "medium",
    "description": "A fundamental compound lift that targets the entire posterior chain.",
    "instructions": [
      "Stand with mid-foot under barbell.",
      "Bend at hips and knees to grip bar.",
      "Keep back straight and spine neutral.",
      "Drive through heels and lift until standing.",
      "Lower carefully."
    ],
    "tips": [
      "Keep your spine neutral.",
      "Drive through your heels.",
      "Keep the bar close to your shins."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower Back",
      "Traps",
      "Forearms"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lower back"
    ]
  },
  {
    "id": "deadlift_sumo",
    "name": "Sumo Deadlift",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "high",
    "velocity": "medium",
    "description": "Wide-stance deadlift variation that shifts focus more towards quads.",
    "instructions": [
      "Set wide stance.",
      "Grip bar low.",
      "Drive hips.",
      "Pull up."
    ],
    "tips": [
      "Keep back straight.",
      "Wide foot stance.",
      "Drive through hips."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Quads",
      "Lower Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/KgI0tqW.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "quadriceps",
      "lower back"
    ]
  },
  {
    "id": "deadlift_hex_bar",
    "name": "Trap Bar Deadlift",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "medium",
    "velocity": "medium",
    "description": "Deadlift variation that is more upright, reducing lumbar stress.",
    "instructions": [
      "Step inside bar.",
      "Grip handles.",
      "Drive up.",
      "Back down."
    ],
    "tips": [
      "Keep back neutral.",
      "Drive through heels.",
      "Use neutral grip."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Quads",
      "Traps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/jQGwmxN.gif",
    "bodyPart": "upper legs",
    "equipment": "trap bar",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "quadriceps",
      "lower back"
    ]
  },
  {
    "id": "rdl",
    "name": "RDL",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "medium",
    "velocity": "slow",
    "description": "Deadlift starting from the top, focusing on the eccentric hinge.",
    "instructions": [
      "Start standing.",
      "Hinge down.",
      "Stretch hamstrings.",
      "Pull back up."
    ],
    "tips": [
      "Hinge at hips.",
      "Keep back straight.",
      "Maintain light knee bend."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/wQ2c4XD.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lower back"
    ]
  },
  {
    "id": "stiff_leg_deadlift",
    "name": "Stiff Leg Deadlift",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "medium",
    "velocity": "slow",
    "description": "Deadlift variation with minimal knee flexion to target hamstrings.",
    "instructions": [
      "Keep legs nearly straight.",
      "Hinge deep.",
      "Pull back."
    ],
    "tips": [
      "Keep back flat.",
      "Hinge deep.",
      "Controlled movement."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/hrVQWvE.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "lower back"
    ]
  },
  {
    "id": "db_rdl",
    "name": "Dumbbell Romanian Deadlift",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "medium",
    "velocity": "slow",
    "description": "Hinge exercise for hamstrings using dumbbells for increased range.",
    "instructions": [
      "Hold dumbbells.",
      "Hinge at hips.",
      "Lower until stretch.",
      "Pull back up."
    ],
    "tips": [
      "Keep back flat.",
      "Hinge at hips.",
      "Controlled tempo."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/rR0LJzx.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lower back"
    ]
  },
  {
    "id": "overhead_press",
    "name": "Overhead Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "high",
    "velocity": "medium",
    "description": "A compound push exercise that builds strength in the shoulders and triceps.",
    "instructions": [
      "Stand with feet shoulder-width.",
      "Hold bar at shoulders.",
      "Press bar overhead until lockout.",
      "Lower back to shoulders."
    ],
    "tips": [
      "Keep your core tight.",
      "Don't arch your lower back excessively.",
      "Press the bar in a straight line."
    ],
    "muscles": [
      "Shoulders (Deltoids)",
      "Triceps",
      "Upper Chest"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/wdRZISl.gif",
    "bodyPart": "shoulders",
    "equipment": "barbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "push_press",
    "name": "Push Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "high",
    "velocity": "fast",
    "description": "Overhead press with leg drive for explosive power.",
    "instructions": [
      "Start bar at shoulders.",
      "Initiate slight leg drive.",
      "Explosively press overhead.",
      "Lock out."
    ],
    "tips": [
      "Tight core.",
      "Leg drive initiated.",
      "Fast lock-out."
    ],
    "muscles": [
      "Shoulders",
      "Triceps",
      "Quads",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/FS63wTN.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "core"
    ]
  },
  {
    "id": "seated_db_press",
    "name": "Seated DB Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Shoulder press variation that eliminates leg drive.",
    "instructions": [
      "Sit on bench.",
      "Dumbbells at shoulders.",
      "Press overhead.",
      "Back down."
    ],
    "tips": [
      "Keep back supported.",
      "Control tempo.",
      "Lower to shoulder level."
    ],
    "muscles": [
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/84RyJf8.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "z_press",
    "name": "Z Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "Press performed seated on the floor, extreme core focus.",
    "instructions": [
      "Sit on floor, feet forward.",
      "Press weight overhead.",
      "Lower to shoulders."
    ],
    "tips": [
      "Keep back straight.",
      "Engage core.",
      "Stable seated position."
    ],
    "muscles": [
      "Shoulders",
      "Triceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/A6wtbuL.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "db_shoulder_press",
    "name": "Dumbbell Shoulder Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Press with dumbbells for unilateral balance.",
    "instructions": [
      "Stand or sit.",
      "Press dumbbells up.",
      "Lower to shoulders."
    ],
    "tips": [
      "Controlled descent.",
      "Keep core tight.",
      "Don't lock out too abruptly."
    ],
    "muscles": [
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/znQUdHY.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "arnold_press",
    "name": "Arnold Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Rotational press targeting all deltoid heads.",
    "instructions": [
      "Start low.",
      "Press up and rotate.",
      "Return down."
    ],
    "tips": [
      "Rotate throughout.",
      "Keep controlled.",
      "Don't rush."
    ],
    "muscles": [
      "Shoulders"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/Xy4jlWA.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper chest"
    ]
  },
  {
    "id": "landmine_press",
    "name": "Landmine Press",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "low",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Functional pressing movement using landmine.",
    "instructions": [
      "Stand at landmine.",
      "Press forward.",
      "Return."
    ],
    "tips": [
      "Engage core.",
      "Drive through hips.",
      "Maintain posture."
    ],
    "muscles": [
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/wdRZISl.gif",
    "bodyPart": "shoulders",
    "equipment": "barbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "landmine_thruster",
    "name": "Landmine Thruster",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "medium",
    "velocity": "fast",
    "isUnilateral": true,
    "description": "Full body movement combining squat and press.",
    "instructions": [
      "Hold weight.",
      "Squat down.",
      "Drive up and press."
    ],
    "tips": [
      "Coordination.",
      "Explosive drive.",
      "Keep heels down."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Shoulders",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/1gFNTZV.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "handstand_pushups",
    "isCalisthenics": true,
    "name": "Handstand Pushups",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Advanced bodyweight shoulder exercise.",
    "instructions": [
      "Handstand against wall.",
      "Lower down.",
      "Push up."
    ],
    "tips": [
      "Engage core.",
      "Maintain balance.",
      "Control descent."
    ],
    "muscles": [
      "Shoulders",
      "Triceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/XooAdhl.gif",
    "bodyPart": "upper arms",
    "equipment": "body weight",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "shoulders",
      "core"
    ]
  },
  {
    "id": "pike_pushups",
    "isCalisthenics": true,
    "name": "Pike Pushups",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Shoulder-focused pushup variation.",
    "instructions": [
      "Pike position.",
      "Lower head down.",
      "Push up."
    ],
    "tips": [
      "Keep hips high.",
      "Maintain stable base.",
      "Control motion."
    ],
    "muscles": [
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/XPUDTt7.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "core",
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "handstand_hold",
    "isCalisthenics": true,
    "name": "Handstand Hold",
    "category": "Press",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Static shoulder endurance exercise.",
    "instructions": [
      "Handstand against wall.",
      "Hold position."
    ],
    "tips": [
      "Keep core tight.",
      "Find balance.",
      "Breath control."
    ],
    "muscles": [
      "Shoulders",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/rQxwMxO.gif",
    "bodyPart": "upper arms",
    "equipment": "body weight",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "shoulders",
      "chest",
      "core"
    ]
  },
  {
    "id": "pull_ups",
    "isCalisthenics": true,
    "name": "Pull Ups",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "A challenging back exercise that targets the latissimus dorsi.",
    "instructions": [
      "Grab bar.",
      "Pull chest up to bar.",
      "Return down."
    ],
    "tips": [
      "Start from a full hang.",
      "Drive your elbows down to bring chest to the bar.",
      "Control the eccentric portion."
    ],
    "muscles": [
      "Lats",
      "Back",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/lBDjFxJ.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "lat_pulldowns",
    "name": "Lat Pulldowns",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Machine-based pull exercise targeting lats.",
    "instructions": [
      "Sit at machine.",
      "Pull bar down.",
      "Return up."
    ],
    "tips": [
      "Control the bar.",
      "Retract scapula.",
      "Full range of motion."
    ],
    "muscles": [
      "Lats",
      "Back",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/LEprlgG.gif",
    "bodyPart": "back",
    "equipment": "cable",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "rhomboids",
      "rear deltoids"
    ]
  },
  {
    "id": "chin_ups",
    "isCalisthenics": true,
    "name": "Chin Ups",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "Pull up variation using supinated grip, focusing on biceps.",
    "instructions": [
      "Grab bar underhand.",
      "Pull up.",
      "Return down."
    ],
    "tips": [
      "Full range.",
      "Control descent.",
      "Squeeze at top."
    ],
    "muscles": [
      "Lats",
      "Biceps",
      "Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/T2mxWqc.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "neutral_grip_pull_ups",
    "isCalisthenics": true,
    "name": "Neutral Grip Pull Ups",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "Pull up variation that is easier on shoulders.",
    "instructions": [
      "Grab neutral handles.",
      "Pull up.",
      "Return."
    ],
    "tips": [
      "Engage core.",
      "Control descent.",
      "Full range."
    ],
    "muscles": [
      "Lats",
      "Back",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/VnfUNW7.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "ring_pull_ups",
    "isCalisthenics": true,
    "name": "Ring Pull Ups",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Pull ups on gymnastics rings for stability.",
    "instructions": [
      "Grab rings.",
      "Pull up.",
      "Return down."
    ],
    "tips": [
      "Control wobbling.",
      "Full range.",
      "Keep core tight."
    ],
    "muscles": [
      "Lats",
      "Back",
      "Biceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/I4hDWkc.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "deltoids",
      "core"
    ]
  },
  {
    "id": "ring_chin_ups",
    "isCalisthenics": true,
    "name": "Ring Chin Ups",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "low",
    "velocity": "medium",
    "description": "Chin ups on gymnastics rings.",
    "instructions": [
      "Grab rings underhand.",
      "Pull up.",
      "Return down."
    ],
    "tips": [
      "Control movement.",
      "Full range.",
      "Engage biceps."
    ],
    "muscles": [
      "Lats",
      "Biceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/T2mxWqc.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "archer_pull_ups",
    "isCalisthenics": true,
    "name": "Archer Pull Ups",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "low",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Advanced pull up variation loading one side.",
    "instructions": [
      "Pull toward one side.",
      "Repeat other side."
    ],
    "tips": [
      "Full range.",
      "Control side-to-side.",
      "Core engagement."
    ],
    "muscles": [
      "Lats",
      "Back",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/72BC5Za.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "muscle_up",
    "isCalisthenics": true,
    "name": "Muscle Up",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "high",
    "velocity": "fast",
    "description": "Advanced combination movement.",
    "instructions": [
      "Explosive pull up.",
      "Transition.",
      "Press out."
    ],
    "tips": [
      "Explosive pull.",
      "Transition transition.",
      "Press out."
    ],
    "muscles": [
      "Lats",
      "Chest",
      "Triceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/yJUHKTn.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "triceps",
      "shoulders",
      "chest"
    ]
  },
  {
    "id": "ring_muscle_up",
    "isCalisthenics": true,
    "name": "Ring Muscle Up",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "high",
    "velocity": "fast",
    "description": "Advanced muscle up on rings.",
    "instructions": [
      "Explosive pull up.",
      "Transition.",
      "Press out."
    ],
    "tips": [
      "Explosive pull.",
      "Clean transition.",
      "Lock out."
    ],
    "muscles": [
      "Lats",
      "Chest",
      "Triceps",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/yJUHKTn.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "triceps",
      "shoulders",
      "chest"
    ]
  },
  {
    "id": "skin_the_cat",
    "isCalisthenics": true,
    "name": "Skin the Cat",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "low",
    "velocity": "slow",
    "description": "Advanced shoulder mobility/back exercise.",
    "instructions": [
      "Hang from rings.",
      "Tuck knees to chest.",
      "Rotate body through arms.",
      "Return to start controlled."
    ],
    "tips": [
      "Control move.",
      "Mobility focus.",
      "Keep core tight."
    ],
    "muscles": [
      "Shoulders",
      "Lats",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/MSfvriJ.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "shoulders",
      "core"
    ]
  },
  {
    "id": "front_lever_tuck",
    "isCalisthenics": true,
    "name": "Front Lever Tuck",
    "category": "Pull",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Static back exercise.",
    "instructions": [
      "Hang from bar.",
      "Tuck knees to chest.",
      "Pull body horizontal.",
      "Hold position."
    ],
    "tips": [
      "Keep core braced.",
      "Retract scapula.",
      "Hold tight."
    ],
    "muscles": [
      "Lats",
      "Core",
      "Shoulders"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/d1GgzTU.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "barbell_row",
    "name": "Barbell Row",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "medium",
    "velocity": "medium",
    "description": "Compound row for back thickness.",
    "instructions": [
      "Grip barbell.",
      "Hinge forward.",
      "Pull bar to stomach.",
      "Lower controlled."
    ],
    "tips": [
      "Keep back parallel to floor.",
      "Pull with elbows.",
      "Full range of motion."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/eZyBC3j.gif",
    "bodyPart": "back",
    "equipment": "barbell",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "seated_cable_rows",
    "name": "Seated Cable Rows",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Row variation with constant tension.",
    "instructions": [
      "Sit at machine.",
      "Pull handle to stomach.",
      "Control return."
    ],
    "tips": [
      "Retract scapula.",
      "Pause at contraction.",
      "Controlled tempo."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/fUBheHs.gif",
    "bodyPart": "back",
    "equipment": "cable",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "one_arm_db_rows",
    "name": "One Arm DB Rows",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Unilateral row for back thickness.",
    "instructions": [
      "One hand on bench.",
      "Pull dumbbell to hip.",
      "Slowly lower."
    ],
    "tips": [
      "Keep flat back.",
      "Pull with elbow.",
      "Don't rotate torso."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/EIsE3u8.gif",
    "bodyPart": "back",
    "equipment": "cable",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "db_pullover",
    "name": "Dumbbell Pullover",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "slow",
    "description": "Exercise focusing on lats and chest stretch.",
    "instructions": [
      "Lie on bench.",
      "Dumbbell overhead.",
      "Lower behind head.",
      "Pull back over chest."
    ],
    "tips": [
      "Keep slight elbow bend.",
      "Feel the stretch.",
      "Control tempo."
    ],
    "muscles": [
      "Lats",
      "Chest"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/9XjtHvS.gif",
    "bodyPart": "chest",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "latissimus dorsi",
      "triceps"
    ]
  },
  {
    "id": "barbell_shrug",
    "name": "Barbell Shrug",
    "category": "Row",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Targets traps.",
    "instructions": [
      "Stand holding barbell.",
      "Shrug shoulders.",
      "Lower."
    ],
    "tips": [
      "Don't roll shoulders.",
      "Hold at top.",
      "Control."
    ],
    "muscles": [
      "Traps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/dG7tG5y.gif",
    "bodyPart": "back",
    "equipment": "barbell",
    "targetMuscle": "traps",
    "secondaryMuscles": [
      "shoulders"
    ]
  },
  {
    "id": "t_bar_rows",
    "name": "T-Bar Rows",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "medium",
    "velocity": "medium",
    "description": "Compound row for back width and thickness.",
    "instructions": [
      "Hinge over T-bar.",
      "Pull handles to chest.",
      "Lower carefully."
    ],
    "tips": [
      "Hinge at hips.",
      "Keep posture.",
      "Controlled pull."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/LuBEORI.gif",
    "bodyPart": "back",
    "equipment": "leverage machine",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "chest_supported_rows",
    "name": "Chest Supported Rows",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Rowing with chest support eliminating lower back load.",
    "instructions": [
      "Lie on incline bench.",
      "Pull dumbbells up.",
      "Lower slowly."
    ],
    "tips": [
      "Pull with elbows.",
      "Controlled motion.",
      "Squeeze back."
    ],
    "muscles": [
      "Back",
      "Lats"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/7I6LNUG.gif",
    "bodyPart": "back",
    "equipment": "leverage machine",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "seal_rows",
    "name": "Seal Rows",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Row performed on a bench for strict movement.",
    "instructions": [
      "Lie flat on high bench.",
      "Pull weight to bench.",
      "Lower controlled."
    ],
    "tips": [
      "Strict form.",
      "No momentum.",
      "Squeeze shoulder blades."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/eZyBC3j.gif",
    "bodyPart": "back",
    "equipment": "barbell",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "landmine_row",
    "name": "Landmine Row",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Functional row using landmine.",
    "instructions": [
      "Stand at landmine.",
      "Pull bar up side.",
      "Return."
    ],
    "tips": [
      "Stable stance.",
      "Pull with elbow.",
      "Control tempo."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/LuBEORI.gif",
    "bodyPart": "back",
    "equipment": "leverage machine",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "meadows_row",
    "name": "Meadows Row",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "low",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Advanced landmine row variation.",
    "instructions": [
      "Staggered stance.",
      "Overhand grip.",
      "Pull elbow high.",
      "Return."
    ],
    "tips": [
      "Staggered stance.",
      "Controlled pullback.",
      "Hinge deep."
    ],
    "muscles": [
      "Back",
      "Lats",
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/Fhdtwf3.gif",
    "bodyPart": "back",
    "equipment": "barbell",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "db_bicep_curl",
    "name": "Dumbbell Bicep Curl",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation curl for biceps.",
    "instructions": [
      "Hold dumbbells.",
      "Curl up.",
      "Lower controlled."
    ],
    "tips": [
      "Avoid momentum.",
      "Full range.",
      "Squeeze at top."
    ],
    "muscles": [
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/uSkDMYl.gif",
    "bodyPart": "upper arms",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "incline_dumbbell_curls",
    "name": "Incline Dumbbell Curls",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Bicep curls performed on an incline bench to emphasize the long head.",
    "instructions": [
      "Lie on incline bench.",
      "Curl dumbbells up.",
      "Lower with control."
    ],
    "tips": [
      "Full stretch at bottom.",
      "Keep elbows back.",
      "No swinging."
    ],
    "muscles": [
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/ByX0WxV.gif",
    "bodyPart": "upper arms",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "hammer_curls",
    "name": "Hammer Curls",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Targets brachialis and brachioradialis.",
    "instructions": [
      "Hold dumbbells neutral.",
      "Curl up.",
      "Lower slowly."
    ],
    "tips": [
      "Neutral grip.",
      "Control tempo.",
      "Minimize swing."
    ],
    "muscles": [
      "Biceps",
      "Brachialis",
      "Forearms"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/slDvUAU.gif",
    "bodyPart": "upper arms",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "preacher_curls",
    "name": "Preacher Curls",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation curl using a preacher bench.",
    "instructions": [
      "Rest arms on pad.",
      "Curl bar up.",
      "Lower slowly."
    ],
    "tips": [
      "Don't lock out elbows.",
      "Full squeeze at top.",
      "Avoid momentum."
    ],
    "muscles": [
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/hacCyUv.gif",
    "bodyPart": "upper arms",
    "equipment": "ez barbell",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "concentration_curls",
    "name": "Concentration Curls",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "isUnilateral": true,
    "description": "Seated bicep curls using the leg as a brace for maximum isolation.",
    "instructions": [
      "Sit on bench, feet wide.",
      "Rest elbow against inner thigh.",
      "Concentration curl dumbbell up.",
      "Lower slowly."
    ],
    "tips": [
      "Keep arm fixed.",
      "Focus on peak contraction.",
      "Full extension."
    ],
    "muscles": [
      "Biceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/7inpWch.gif",
    "bodyPart": "upper arms",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "zottman_curls",
    "name": "Zottman Curls",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Variation that targets both biceps and forearms through rotation.",
    "instructions": [
      "Curl dumbbells with palms up.",
      "Rotate palms down at top.",
      "Lower with palms down.",
      "Rotate back at bottom."
    ],
    "tips": [
      "Controlled rotation.",
      "Strict form.",
      "Feel the forearms."
    ],
    "muscles": [
      "Biceps",
      "Forearms"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/kXaIn5A.gif",
    "bodyPart": "upper arms",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "triceps_pushdowns",
    "name": "Triceps Pushdowns",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Cable pushdown targeting triceps.",
    "instructions": [
      "Push handle down.",
      "Squeeze triceps.",
      "Control return."
    ],
    "tips": [
      "Keep elbows tucked.",
      "Focus on triceps extension.",
      "Controlled tempo."
    ],
    "muscles": [
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/dU605di.gif",
    "bodyPart": "upper arms",
    "equipment": "cable",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "forearms"
    ]
  },
  {
    "id": "barbell_skullcrushers",
    "name": "Barbell Skullcrushers",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Triceps extension performed lying down.",
    "instructions": [
      "Lie on bench.",
      "Lower bar to forehead.",
      "Extend up."
    ],
    "tips": [
      "Keep elbows fixed.",
      "Control speed.",
      "Full lock out."
    ],
    "muscles": [
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/h8LFzo9.gif",
    "bodyPart": "upper arms",
    "equipment": "barbell",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "shoulders"
    ]
  },
  {
    "id": "dips",
    "isCalisthenics": true,
    "name": "Dips",
    "category": "Accessory",
    "pattern": "push_horizontal",
    "impact": "medium",
    "velocity": "medium",
    "description": "Bodyweight or weighted dip targeting chest and triceps.",
    "instructions": [
      "Hold over bars.",
      "Lower down.",
      "Push up."
    ],
    "tips": [
      "Full range.",
      "Keep upright for triceps.",
      "Control descent."
    ],
    "muscles": [
      "Triceps",
      "Chest"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/9WTm7dq.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ]
  },
  {
    "id": "overhead_db_extension",
    "name": "Overhead DB Extension",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Overhead extension focusing on the long head of the triceps.",
    "instructions": [
      "Hold dumbbell overhead.",
      "Lower behind head.",
      "Extend back up."
    ],
    "tips": [
      "Keep elbows close to head.",
      "Full stretch.",
      "Don't arch back."
    ],
    "muscles": [
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/5fKX7wi.gif",
    "bodyPart": "upper arms",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "shoulders"
    ]
  },
  {
    "id": "tricep_bench_dips",
    "isCalisthenics": true,
    "name": "Bench Dips",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "medium",
    "description": "Scaleable triceps exercise using a bench or chair.",
    "instructions": [
      "Feet on floor or bench.",
      "Hands on edge of bench.",
      "Lower hips.",
      "Push back up."
    ],
    "tips": [
      "Keep back close to bench.",
      "Full extension.",
      "Controlled tempo."
    ],
    "muscles": [
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/Wgbn9qo.gif",
    "bodyPart": "upper arms",
    "equipment": "body weight",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "chest",
      "shoulders"
    ]
  },
  {
    "id": "plank",
    "isCalisthenics": true,
    "name": "Plank",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Static hold for core stability.",
    "instructions": [
      "Hold pushup position on elbows.",
      "Keep back flat.",
      "Maintain tension."
    ],
    "tips": [
      "Keep body straight.",
      "Squeeze core.",
      "Hold tight."
    ],
    "muscles": [
      "Core"
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/hCjGsRQ.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "shoulders",
      "triceps",
      "glutes"
    ]
  },
  {
    "id": "hanging_leg_raises",
    "isCalisthenics": true,
    "name": "Hanging Leg Raises",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "medium",
    "description": "Hanging leg raise for lower abs.",
    "instructions": [
      "Hang from bar.",
      "Raise legs forward.",
      "Lower carefully."
    ],
    "tips": [
      "Control movement.",
      "Avoid swinging.",
      "Full range."
    ],
    "muscles": [
      "Core (Abs)",
      "Hip Flexors"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 2,
    "gifUrl": "https://static.exercisedb.dev/media/I3tsCnC.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors"
    ]
  },
  {
    "id": "bicycle_crunch",
    "isCalisthenics": true,
    "name": "Bicycle Crunches",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "fast",
    "description": "Core exercise targeting obliques and abs.",
    "instructions": [
      "Lie on back.",
      "Bring opposite elbow to knee.",
      "Alternate sides."
    ],
    "tips": [
      "Twist with your core.",
      "Control the movement.",
      "Keep lower back down."
    ],
    "muscles": [
      "Core",
      "Obliques"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/tZkGYZ9.gif",
    "bodyPart": "waist",
    "equipment": "band",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors",
      "obliques"
    ]
  },
  {
    "id": "reverse_crunch",
    "isCalisthenics": true,
    "name": "Reverse Crunches",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Lower abdominal focus.",
    "instructions": [
      "Lie on back.",
      "Lift legs toward ceiling.",
      "Curl hips off floor."
    ],
    "tips": [
      "Use slow controlled motion.",
      "Keep neck relaxed.",
      "Lower slowly."
    ],
    "muscles": [
      "Core",
      "Abs"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/nCU1Ekp.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors"
    ]
  },
  {
    "id": "mountain_climbers",
    "isCalisthenics": true,
    "name": "Mountain Climbers",
    "category": "Core",
    "pattern": "core",
    "impact": "medium",
    "velocity": "fast",
    "description": "Dynamic core exercise.",
    "instructions": [
      "Plank position.",
      "Drive knees to chest alternately.",
      "Maintain steady pace."
    ],
    "tips": [
      "Keep back flat.",
      "Brace core.",
      "Fast rhythm."
    ],
    "muscles": [
      "Core",
      "Quads",
      "Shoulders"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 2,
    "gifUrl": "https://static.exercisedb.dev/media/RJgzwny.gif",
    "bodyPart": "cardio",
    "equipment": "body weight",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "core",
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "russian_twists",
    "name": "Russian Twists",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "medium",
    "description": "Rotational core exercise.",
    "instructions": [
      "Sit holding weight.",
      "Twist torso side to side.",
      "Touch weight to floor."
    ],
    "tips": [
      "Rotate from shoulders.",
      "Keep heels elevated.",
      "Engage core."
    ],
    "muscles": [
      "Core",
      "Obliques"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/d9Xaxq6.gif",
    "bodyPart": "waist",
    "equipment": "cable",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "obliques",
      "lower back"
    ]
  },
  {
    "id": "ab_wheel_rollout",
    "isCalisthenics": true,
    "name": "Ab Wheel Rollouts",
    "category": "Core",
    "pattern": "core",
    "impact": "medium",
    "velocity": "slow",
    "description": "An intense anti-extension core exercise rolling forward on a wheel from a kneeling position.",
    "instructions": [
      "Kneel on a soft pad and grip the handles of the ab wheel.",
      "Roll the wheel forward, extending your body as far as you can without letting your back sag.",
      "Engage your abs and pull yourself back to the starting kneeling position."
    ],
    "tips": [
      "Do not let your hips sag or your lower back arch; keep a slight hollow body position.",
      "Pull back with your core, not your hips.",
      "Initiate the movement slowly."
    ],
    "muscles": [
      "Core",
      "Lats",
      "Shoulders"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 3,
    "connectiveTissueStressScore": 2,
    "gifUrl": "https://static.exercisedb.dev/media/NAgVB3t.gif",
    "bodyPart": "waist",
    "equipment": "wheel roller",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "lower back"
    ]
  },
  {
    "id": "v_ups",
    "isCalisthenics": true,
    "name": "V-Ups",
    "category": "Core",
    "pattern": "core",
    "impact": "medium",
    "velocity": "fast",
    "description": "Combined upper and lower ab exercise.",
    "instructions": [
      "Lie on back.",
      "Lift legs and torso simultaneously to meet.",
      "Lower."
    ],
    "tips": [
      "Exhale on lift.",
      "Keep legs straight.",
      "Reach for toes."
    ],
    "muscles": [
      "Core",
      "Abs"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 2,
    "gifUrl": "https://static.exercisedb.dev/media/qcNN2FN.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors",
      "lower back"
    ]
  },
  {
    "id": "flutter_kicks",
    "isCalisthenics": true,
    "name": "Flutter Kicks",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "fast",
    "description": "Lower abdominal endurance.",
    "instructions": [
      "Lie on back, hands under hips.",
      "Flutter legs up and down.",
      "Keep lower back down."
    ],
    "tips": [
      "Keep core engaged.",
      "Full range of kick.",
      "Control motion."
    ],
    "muscles": [
      "Core",
      "Abs"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/UVo2Qs2.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hip flexors",
      "lower abs"
    ]
  },
  {
    "id": "leg_raises_floor",
    "isCalisthenics": true,
    "name": "Leg Raises (Floor)",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Lower abdominal isolation.",
    "instructions": [
      "Lie on back.",
      "Raise legs to 90 degrees.",
      "Lower slowly without touching floor."
    ],
    "tips": [
      "Back pressed into floor.",
      "Control tempo.",
      "Full extension."
    ],
    "muscles": [
      "Core",
      "Abs"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/WhuFnR7.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors"
    ]
  },
  {
    "id": "toe_touches",
    "isCalisthenics": true,
    "name": "Toe Touches",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "medium",
    "description": "Isolation for upper abs.",
    "instructions": [
      "Lie on back.",
      "Legs straight in air.",
      "Lift shoulders toward toes."
    ],
    "tips": [
      "Reach high.",
      "Exhale on lift.",
      "Controlled lowering."
    ],
    "muscles": [
      "Core",
      "Abs"
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/p195zsJ.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "spine",
    "secondaryMuscles": [
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "side_plank",
    "isCalisthenics": true,
    "name": "Side Plank",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Lateral core stabilization.",
    "instructions": [
      "Side plank position.",
      "Hold position.",
      "Switch sides."
    ],
    "tips": [
      "Keep hips up.",
      "Maintain alignment.",
      "Breathe."
    ],
    "muscles": [
      "Core",
      "Obliques"
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 1,
    "gifUrl": "https://static.exercisedb.dev/media/VO2qeJg.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "adductors",
    "secondaryMuscles": [
      "obliques",
      "glutes"
    ]
  },
  {
    "id": "sandbag_zercher_carry",
    "name": "Sandbag Zercher Carry",
    "category": "Tactical",
    "pattern": "impact",
    "impact": "high",
    "velocity": "slow",
    "description": "Carrying a sandbag in the crooks of the elbows.",
    "instructions": [
      "Hook elbows under sandbag.",
      "Hold bag tight to chest.",
      "Walk for distance or time."
    ],
    "energySystem": "mixed",
    "axialFatigueScore": 8,
    "connectiveTissueStressScore": 6,
    "muscles": [
      "Upper Back",
      "Core",
      "Biceps",
      "Forearms"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/LSTChY9.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "core"
    ]
  },
  {
    "id": "ruck_march",
    "name": "Ruck March",
    "category": "Tactical",
    "pattern": "impact",
    "impact": "medium",
    "velocity": "medium",
    "description": "Weighted walking for endurance and structural strength.",
    "instructions": [
      "Wear a weighted rucksack.",
      "Walk at a brisk pace.",
      "Keep upright posture."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 5,
    "connectiveTissueStressScore": 7,
    "muscles": [
      "Quads",
      "Glutes",
      "Calves",
      "Core",
      "Shoulders"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/sVQCCeG.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "ammo_can_press",
    "name": "Ammo Can Press",
    "category": "Tactical",
    "pattern": "push_vertical",
    "impact": "medium",
    "velocity": "fast",
    "description": "Rapid overhead pressing of a weighted can.",
    "instructions": [
      "Hold ammo can at chest.",
      "Rapidly press overhead.",
      "Lower and repeat quickly."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 4,
    "connectiveTissueStressScore": 4,
    "muscles": [
      "Shoulders",
      "Triceps",
      "Upper Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/A6wtbuL.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "farmer_carry",
    "name": "Farmer Carry",
    "category": "Tactical",
    "pattern": "impact",
    "impact": "high",
    "velocity": "slow",
    "description": "Walking with maximal weight in both hands.",
    "instructions": [
      "Pick up heavy weights.",
      "Walk with short, quick steps.",
      "Keep shoulders back."
    ],
    "energySystem": "mixed",
    "axialFatigueScore": 7,
    "connectiveTissueStressScore": 5,
    "muscles": [
      "Forearms",
      "Traps",
      "Core",
      "Glutes"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/qPEzJjA.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "calves",
      "forearms",
      "core"
    ]
  },
  {
    "id": "bear_crawl",
    "isCalisthenics": true,
    "name": "Bear Crawl",
    "category": "Tactical",
    "pattern": "core",
    "impact": "low",
    "velocity": "medium",
    "description": "Quadrupedal movement for core and shoulder stability.",
    "instructions": [
      "Get on all fours, knees off floor.",
      "Move forward using opposite hand and foot.",
      "Keep hips low."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 3,
    "muscles": [
      "Shoulders",
      "Core",
      "Hips",
      "Quads"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/0Yz8WdV.gif",
    "bodyPart": "cardio",
    "equipment": "body weight",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "core",
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "burpee_over_bar",
    "name": "Burpee Over Bar",
    "category": "Tactical",
    "pattern": "impact",
    "impact": "high",
    "velocity": "fast",
    "description": "High-intensity burpee with a lateral jump over a barbell.",
    "instructions": [
      "Perform a burpee.",
      "Jump laterally over the bar.",
      "Repeat on other side."
    ],
    "energySystem": "mixed",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 8,
    "muscles": [
      "Full Body",
      "Cardio"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/dK9394r.gif",
    "bodyPart": "cardio",
    "equipment": "body weight",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "shoulders",
      "chest"
    ]
  },
  {
    "id": "log_clean_press",
    "name": "Log Clean & Press",
    "category": "Tactical",
    "pattern": "push_vertical",
    "impact": "high",
    "velocity": "fast",
    "description": "Lifting a log from ground to overhead.",
    "instructions": [
      "Clean log to shoulders.",
      "Press log overhead.",
      "Lower and repeat."
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 9,
    "connectiveTissueStressScore": 9,
    "muscles": [
      "Full Body",
      "Shoulders",
      "Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/SGY8Zui.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "hamstrings",
      "glutes",
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "depth_jumps",
    "name": "Depth Jumps",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "high",
    "velocity": "fast",
    "description": "Jumping off a box and immediately jumping up upon landing.",
    "instructions": [
      "Step off box.",
      "Land on both feet.",
      "Immediately jump as high as possible."
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 10,
    "muscles": [
      "Quads",
      "Calves",
      "Glutes"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/CB8WET1.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders",
      "core"
    ]
  },
  {
    "id": "broad_jump",
    "name": "Broad Jump",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "high",
    "velocity": "fast",
    "description": "Max distance horizontal jump.",
    "instructions": [
      "Hinge back.",
      "Explosively jump forward.",
      "Land softly."
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 9,
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Quads",
      "Calves"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/uZKq7lo.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "calves",
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "single_arm_snatch_db",
    "name": "Single Arm Snatch (DB)",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "medium",
    "velocity": "fast",
    "isUnilateral": true,
    "description": "Pulling a dumbbell from floor to overhead in one motion.",
    "instructions": [
      "Dumbbell between feet.",
      "Pull weight up rapidly.",
      "Punch toward sky.",
      "Lower and repeat."
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 5,
    "connectiveTissueStressScore": 6,
    "muscles": [
      "Glutes",
      "Lower Back",
      "Shoulders",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/6pTkI99.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "quadriceps",
      "core"
    ]
  },
  {
    "id": "broad_jump_to_sprint",
    "name": "Broad Jump to Sprint",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "high",
    "velocity": "fast",
    "description": "Explosive jump into an immediate sprint start.",
    "instructions": [
      "Perform broad jump.",
      "Upon landing, transition into a sprint.",
      "Maintain speed."
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 9,
    "muscles": [
      "Full Body",
      "Cardio"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/uZKq7lo.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "calves",
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "bounding",
    "name": "Bounding",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "high",
    "velocity": "fast",
    "description": "Max distance single leg bounds.",
    "instructions": [
      "Run with exaggerated long steps.",
      "Drive knees up and forward.",
      "Maintain horizontal velocity."
    ],
    "energySystem": "anaerobic_alactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 9,
    "muscles": [
      "Glutes",
      "Quads",
      "Hamstrings"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/uZKq7lo.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "calves",
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "running_steady_state",
    "name": "Running (Steady State)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "medium",
    "velocity": "medium",
    "description": "Long duration aerobic running.",
    "instructions": [
      "Maintain a steady pace.",
      "Focus on rhythmic breathing.",
      "Keep upright posture."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 4,
    "connectiveTissueStressScore": 6,
    "muscles": [
      "Quads",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/rjtuP6X.gif",
    "bodyPart": "cardio",
    "equipment": "elliptical machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves"
    ]
  },
  {
    "id": "running_intervals",
    "name": "Running (Intervals)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "medium",
    "velocity": "fast",
    "description": "High-intensity aerobic intervals.",
    "instructions": [
      "Push pace during work intervals.",
      "Recover during rest intervals."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 2,
    "connectiveTissueStressScore": 3,
    "muscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ],
    "jointStress": [
      "knee",
      "ankle"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/rjiM4L3.gif",
    "bodyPart": "cardio",
    "equipment": "leverage machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "rowing_intervals",
    "name": "Rowing (Intervals)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "fast",
    "description": "High-intensity rowing intervals.",
    "instructions": [
      "Push pace during work intervals.",
      "Recover during rest intervals."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 2,
    "muscles": [
      "latissimus_dorsi",
      "quadriceps",
      "hamstrings"
    ],
    "jointStress": [
      "knee",
      "hip"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/a8VDgLw.gif",
    "bodyPart": "cardio",
    "equipment": "leverage machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "cycling_intervals",
    "name": "Cycling (Intervals)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "fast",
    "description": "High-intensity cycling intervals.",
    "instructions": [
      "Maintain high RPM during work intervals.",
      "Recover during rest intervals."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "muscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ],
    "jointStress": [
      "knee"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/a8VDgLw.gif",
    "bodyPart": "cardio",
    "equipment": "leverage machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "cycling_steady_state",
    "name": "Cycling (Steady State)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "medium",
    "description": "Long duration aerobic cycling.",
    "instructions": [
      "Maintain consistent RPM.",
      "Keep core engaged.",
      "Focus on fluid pedal strokes."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 2,
    "muscles": [
      "Quads",
      "Glutes",
      "Calves"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/a8VDgLw.gif",
    "bodyPart": "cardio",
    "equipment": "leverage machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "rucking_steady_state",
    "name": "Rucking (Steady State)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "medium",
    "velocity": "medium",
    "description": "Long duration weighted walk.",
    "instructions": [
      "Weight rucksack.",
      "Maintain brisk walking pace.",
      "Focus on endurance."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 6,
    "connectiveTissueStressScore": 7,
    "muscles": [
      "Quads",
      "Glutes",
      "Calves",
      "Core",
      "Traps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/rjiM4L3.gif",
    "bodyPart": "cardio",
    "equipment": "leverage machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "assault_bike_intervals",
    "name": "Assault Bike Intervals",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "fast",
    "description": "Max effort sprints on the fan bike.",
    "instructions": [
      "Pedal and push arms as fast as possible.",
      "Complete for set time.",
      "Rest and repeat."
    ],
    "energySystem": "mixed",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 2,
    "muscles": [
      "Full Body",
      "Cardio"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/1ZFqTDN.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors"
    ]
  },
  {
    "id": "rowing_steady_state",
    "name": "Rowing (Steady State)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "medium",
    "description": "Long duration rhythmic rowing.",
    "instructions": [
      "Drive with legs.",
      "Finish with arms.",
      "Maintain steady stroke rate."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 3,
    "muscles": [
      "Lats",
      "Legs",
      "Core",
      "Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/a8VDgLw.gif",
    "bodyPart": "cardio",
    "equipment": "leverage machine",
    "targetMuscle": "cardiovascular system",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "hill_sprints",
    "name": "Hill Sprints",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "medium",
    "velocity": "fast",
    "description": "Short, high-intensity sprints up an incline.",
    "instructions": [
      "Sprint up a steep hill.",
      "Walk back down for recovery.",
      "Repeat explosively."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 6,
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Calves",
      "Quads"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/Qoujh3Q.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "battle_rope_waves",
    "name": "Battle Rope Waves",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "fast",
    "description": "Rhythmic arm waves for metabolic conditioning.",
    "instructions": [
      "Hold rope ends.",
      "Alternating waves with arms.",
      "Keep core tight."
    ],
    "energySystem": "anaerobic_lactic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 2,
    "muscles": [
      "Shoulders",
      "Core",
      "Arms"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/yaAxcQr.gif",
    "bodyPart": "back",
    "equipment": "rope",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "forearms",
      "biceps",
      "shoulders"
    ]
  },
  {
    "id": "swimming_freestyle",
    "name": "Swimming (Freestyle)",
    "category": "Endurance",
    "pattern": "impact",
    "impact": "low",
    "velocity": "medium",
    "description": "Low impact full body conditioning.",
    "instructions": [
      "Maintain streamlined body.",
      "Consistent kick and stroke.",
      "Focus on breathing."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "muscles": [
      "Lats",
      "Shoulders",
      "Core",
      "Full Body"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/SP3hUez.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "quadriceps",
      "calves"
    ]
  },
  {
    "id": "band_pull_aparts",
    "name": "Band Pull-Aparts",
    "category": "Prehab",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Horizontal band abduction for scapular health.",
    "instructions": [
      "Hold band at arms length.",
      "Pull band apart to chest.",
      "Squeeze shoulder blades."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "muscles": [
      "Rear Delts",
      "Traps",
      "Rhomboids"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/VtTbiP3.gif",
    "bodyPart": "shoulders",
    "equipment": "band",
    "targetMuscle": "rear delts",
    "secondaryMuscles": [
      "traps",
      "rhomboids"
    ]
  },
  {
    "id": "dead_bug",
    "name": "Dead Bug",
    "category": "Prehab",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Core stabilization with alternating limb movement.",
    "instructions": [
      "Lie on back, arms/legs up.",
      "Lower opposite arm and leg.",
      "Keep low back pinned to floor."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "muscles": [
      "Core",
      "Abs"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/iny3m5y.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors",
      "lower back"
    ]
  },
  {
    "id": "monster_walk",
    "name": "Monster Walk",
    "category": "Prehab",
    "pattern": "mobility",
    "impact": "low",
    "velocity": "slow",
    "description": "Banded lateral walk for glute medius activation.",
    "instructions": [
      "Band around ankles/knees.",
      "Step laterally in squat.",
      "Maintain tension."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 2,
    "muscles": [
      "Glute Medius",
      "Hips"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/O95afRA.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "quadriceps"
    ]
  },
  {
    "id": "wall_slides",
    "name": "Wall Slides",
    "category": "Prehab",
    "pattern": "mobility",
    "impact": "low",
    "velocity": "slow",
    "description": "Scapular control exercise against a wall.",
    "instructions": [
      "Back against wall.",
      "Slide arms up and down wall.",
      "Maintain contact throughout."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "muscles": [
      "Traps",
      "Shoulders",
      "Scapula"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/ZZTGMKh.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ]
  },
  {
    "id": "bird_dog",
    "name": "Bird-Dog",
    "category": "Prehab",
    "pattern": "core",
    "impact": "low",
    "velocity": "slow",
    "description": "Quadrupedal balance for spinal stabilization.",
    "instructions": [
      "On all fours.",
      "Extend opposite arm and leg.",
      "Maintain neutral spine."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 1,
    "muscles": [
      "Core",
      "Glutes",
      "Spine"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/01qpYSe.gif",
    "bodyPart": "back",
    "equipment": "body weight",
    "targetMuscle": "spine",
    "secondaryMuscles": [
      "shoulders",
      "chest"
    ]
  },
  {
    "id": "eccentric_calf_raise",
    "isCalisthenics": true,
    "name": "Eccentric Calf Raise",
    "category": "Prehab",
    "pattern": "mobility",
    "impact": "low",
    "velocity": "slow",
    "description": "Slow lowering for Achilles tendon health.",
    "instructions": [
      "Stand on step edge.",
      "Raise up on toes.",
      "Lower very slowly (3-5 sec)."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 5,
    "muscles": [
      "Calves",
      "Achilles"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/2ORFMoR.gif",
    "bodyPart": "lower legs",
    "equipment": "sled machine",
    "targetMuscle": "calves",
    "secondaryMuscles": [
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "face_pulls",
    "name": "Face Pulls",
    "category": "Prehab",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Cable pull for rear deltoid and rotator cuff health.",
    "instructions": [
      "Pull rope toward face.",
      "Flout elbows and rotate out.",
      "Squeeze rear delts."
    ],
    "energySystem": "aerobic",
    "axialFatigueScore": 0,
    "connectiveTissueStressScore": 2,
    "muscles": [
      "Rear Delts",
      "Shoulders",
      "Upper Back"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/ZfyAGhK.gif",
    "bodyPart": "shoulders",
    "equipment": "cable",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "trapezius",
      "rhomboids",
      "biceps"
    ]
  },
  {
    "id": "good_mornings",
    "name": "Good Mornings",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "medium",
    "velocity": "slow",
    "description": "Hinge movement targeting lower back and hamstrings.",
    "instructions": [
      "Bar on back.",
      "Hinge forward.",
      "Return to standing."
    ],
    "tips": [
      "Keep back straight.",
      "Feel stretch in hamstrings.",
      "Control the movement."
    ],
    "muscles": [
      "Hamstrings",
      "Lower Back",
      "Glutes"
    ],
    "axialFatigueScore": 8,
    "gifUrl": "https://static.exercisedb.dev/media/XlZ4lAC.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "lower back"
    ]
  },
  {
    "id": "db_step_ups",
    "name": "Dumbbell Step Ups",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Single leg exercise targeting quads and glutes.",
    "instructions": [
      "Hold dumbbells.",
      "Step up onto box.",
      "Step down."
    ],
    "tips": [
      "Drive through heel.",
      "Control descent.",
      "Keep posture."
    ],
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/aXtJhlg.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "db_overhead_press",
    "name": "Dumbbell Overhead Press",
    "category": "Shoulder",
    "pattern": "push_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "Overhead press with dumbbells for shoulder hypertrophy.",
    "instructions": [
      "Sit or stand.",
      "Press dumbbells overhead.",
      "Lower back to shoulders."
    ],
    "tips": [
      "Keep core engaged.",
      "Full range of motion.",
      "Do not arch back."
    ],
    "muscles": [
      "Shoulders",
      "Triceps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/A6wtbuL.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps",
      "upper back"
    ]
  },
  {
    "id": "db_lateral_raise",
    "name": "Dumbbell Lateral Raise",
    "category": "Shoulder",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Isolation exercise for the lateral deltoids.",
    "instructions": [
      "Hold dumbbells at sides.",
      "Raise arms to shoulder height.",
      "Lower slowly."
    ],
    "tips": [
      "Lead with elbows.",
      "Avoid swinging.",
      "Control the eccentric."
    ],
    "muscles": [
      "Lateral Delts",
      "Traps"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/DsgkuIt.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ]
  },
  {
    "id": "db_front_raise",
    "name": "Dumbbell Front Raise",
    "category": "Shoulder",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Isolation exercise targeting anterior deltoids.",
    "instructions": [
      "Hold dumbbells in front.",
      "Raise to shoulder level.",
      "Lower slowly."
    ],
    "tips": [
      "Avoid momentum.",
      "Keep arms straight.",
      "Don't shrug."
    ],
    "muscles": [
      "Anterior Delts"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/3eGE2JC.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "biceps",
      "trapezius"
    ]
  },
  {
    "id": "db_rear_delt_fly",
    "name": "Dumbbell Rear Delt Fly",
    "category": "Shoulder",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Isolation exercise targeting rear deltoids.",
    "instructions": [
      "Bend forward at hips.",
      "Raise dumbbells out to sides.",
      "Squeeze shoulder blades."
    ],
    "tips": [
      "Keep back straight.",
      "Slight bend in elbows.",
      "Control movement."
    ],
    "muscles": [
      "Rear Delts",
      "Traps",
      "Rhomboids"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/mu5Guxt.gif",
    "bodyPart": "shoulders",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "trapezius",
      "rhomboids"
    ]
  },
  {
    "id": "db_bulgarian_split_squats",
    "name": "DB Bulgarian Split Squats",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Single-leg squat variation with back leg elevated.",
    "instructions": [
      "Place back foot on bench.",
      "Lower into lunge.",
      "Push up."
    ],
    "tips": [
      "Keep chest up.",
      "Drive through front heel.",
      "Maintain balance."
    ],
    "muscles": [
      "Quads",
      "Glutes"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/9E25EOx.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "glutes",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "cable_face_pulls",
    "name": "Cable Face Pulls",
    "category": "Accessory",
    "pattern": "accessory",
    "impact": "low",
    "velocity": "slow",
    "description": "Rear delt isolation.",
    "instructions": [
      "Pull toward face.",
      "Rotate externally.",
      "Squeeze blades."
    ],
    "tips": [
      "Lead with elbows.",
      "Controlled.",
      "Full range."
    ],
    "muscles": [
      "Rear Delts",
      "Traps",
      "Rotator Cuff"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/ZfyAGhK.gif",
    "bodyPart": "shoulders",
    "equipment": "cable",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "trapezius",
      "rhomboids",
      "biceps"
    ]
  },
  {
    "id": "hanging_knee_raises",
    "isCalisthenics": true,
    "name": "Hanging Knee Raises",
    "category": "Core",
    "pattern": "core",
    "impact": "low",
    "velocity": "medium",
    "description": "Lower ab focus.",
    "instructions": [
      "Hang.",
      "Lift knees to chest.",
      "Lower."
    ],
    "tips": [
      "Minimize swing.",
      "Engage abs.",
      "Control."
    ],
    "muscles": [
      "Core",
      "Abs"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/I3tsCnC.gif",
    "bodyPart": "waist",
    "equipment": "body weight",
    "targetMuscle": "abs",
    "secondaryMuscles": [
      "hip flexors"
    ]
  },
  {
    "id": "leg_press_unilateral",
    "name": "Unilateral Leg Press",
    "category": "Accessory",
    "pattern": "squat",
    "impact": "low",
    "velocity": "slow",
    "isUnilateral": true,
    "description": "Single-leg leg press.",
    "instructions": [
      "Place one foot on platform.",
      "Press with one leg."
    ],
    "tips": [
      "Keep knee aligned.",
      "Controlled.",
      "Full range."
    ],
    "muscles": [
      "Quads",
      "Glutes"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/V07qpXy.gif",
    "bodyPart": "upper legs",
    "equipment": "leverage machine",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "hamstrings",
      "glutes"
    ]
  },
  {
    "id": "walking_lunges",
    "name": "Walking Lunges",
    "category": "Squat",
    "pattern": "squat",
    "impact": "medium",
    "velocity": "medium",
    "isUnilateral": true,
    "description": "Lunge while moving forward.",
    "instructions": [
      "Step forward.",
      "Lower hips.",
      "Push to next step."
    ],
    "tips": [
      "Keep torso upright.",
      "Stride long.",
      "Controlled."
    ],
    "muscles": [
      "Quads",
      "Glutes"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/IZVHb27.gif",
    "bodyPart": "upper legs",
    "equipment": "body weight",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves"
    ]
  },
  {
    "id": "t_pushups",
    "isCalisthenics": true,
    "name": "T-Pushups",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "Pushup with rotation.",
    "instructions": [
      "Pushup.",
      "Rotate to T-position."
    ],
    "tips": [
      "Stable board.",
      "Controlled rotation.",
      "Engage core."
    ],
    "muscles": [
      "Chest",
      "Core",
      "Shoulders"
    ],
    "gifUrl": "https://static.exercisedb.dev/media/I4hDWkc.gif",
    "bodyPart": "chest",
    "equipment": "body weight",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "deltoids",
      "core"
    ]
  },
  {
    "id": "front_squat",
    "name": "Barbell Front Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "high",
    "velocity": "medium",
    "description": "A high-bar squat variation that shifts load to the anterior chain (quads) and demands intense upper back extension.",
    "instructions": [
      "Rest the bar on the front of your shoulders, high on the clavicles and deltoids.",
      "Keep elbows high, pointing forward, parallel to the ground.",
      "Squat deeply while maintaining an upright, vertical torso.",
      "Drive upward through the mid-foot back to the starting position."
    ],
    "tips": [
      "Keep elbows pointing up throughout the movement.",
      "Stay highly upright to prevent forward tipping.",
      "Brace the core aggressively."
    ],
    "muscles": [
      "Quads",
      "Upper Back",
      "Core",
      "Glutes"
    ],
    "axialFatigueScore": 8,
    "connectiveTissueStressScore": 7,
    "gifUrl": "https://static.exercisedb.dev/media/zG0zs85.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "core"
    ]
  },
  {
    "id": "deficit_deadlift",
    "name": "Deficit Deadlift",
    "category": "Deadlift",
    "pattern": "hinge",
    "impact": "high",
    "velocity": "medium",
    "description": "Deadlifting while standing on a small platform or plates, increasing the range of motion and leg drive off the floor.",
    "instructions": [
      "Stand on a 1-3 inch platform or bumper plate.",
      "Set your feet under the bar and hinge down.",
      "Keep your back flat, brace, and pull tension out of the bar.",
      "Drive aggressively with your legs to break the bar off the floor."
    ],
    "tips": [
      "Do not allow your lower back to round due to the lower starting position.",
      "Focus on initial quad leg drive to get the bar moving.",
      "Keep the bar tight to your shins."
    ],
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower Back",
      "Lats",
      "Core"
    ],
    "axialFatigueScore": 10,
    "connectiveTissueStressScore": 9,
    "gifUrl": "https://static.exercisedb.dev/media/ila4NZS.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lower back"
    ]
  },
  {
    "id": "weighted_dips",
    "name": "Weighted Tricep Dips",
    "category": "Press",
    "pattern": "push_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "A classic upper-body compound movement performed on parallel bars with added external weight.",
    "instructions": [
      "Mount parallel bars and suspend yourself with straight arms.",
      "Lower your body by bending the elbows until shoulders are below the elbow crease.",
      "Press back up to lock out using the triceps and chest."
    ],
    "tips": [
      "Avoid excessive forward lean to balance triceps and chest recruitment.",
      "Control the eccentric phase to protect the shoulder joint.",
      "Keep your neck neutral."
    ],
    "muscles": [
      "Triceps",
      "Chest",
      "Shoulders"
    ],
    "axialFatigueScore": 4,
    "connectiveTissueStressScore": 6,
    "gifUrl": "https://static.exercisedb.dev/media/bZq4bwK.gif",
    "bodyPart": "upper arms",
    "equipment": "weighted",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "chest",
      "shoulders"
    ]
  },
  {
    "id": "weighted_pull_ups",
    "name": "Weighted Pull-Up",
    "category": "Pull",
    "pattern": "pull_vertical",
    "impact": "medium",
    "velocity": "medium",
    "description": "Pull-ups performed with extra load attached via a dip belt or holding a dumbbell.",
    "instructions": [
      "Grip the pull-up bar with an overhand grip slightly wider than shoulder-width.",
      "Hang with fully extended arms, keeping core engaged.",
      "Pull yourself up by driving elbows down until your chin clears the bar.",
      "Lower with control back to a dead hang."
    ],
    "tips": [
      "Do not use momentum or leg swing.",
      "Ensure a full range of motion from dead hang to chin-over-bar.",
      "Engage the shoulder blades first."
    ],
    "muscles": [
      "Lats",
      "Upper Back",
      "Biceps",
      "Forearms"
    ],
    "axialFatigueScore": 3,
    "connectiveTissueStressScore": 4,
    "gifUrl": "https://static.exercisedb.dev/media/HMzLjXx.gif",
    "bodyPart": "back",
    "equipment": "weighted",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "pendlay_row",
    "name": "Barbell Pendlay Row",
    "category": "Row",
    "pattern": "pull_horizontal",
    "impact": "high",
    "velocity": "medium",
    "description": "A strict barbell row where each rep starts from a dead stop on the floor, with the torso completely parallel to the ground.",
    "instructions": [
      "Set up with a loaded barbell on the floor, feet shoulder-width apart.",
      "Hinge over until your torso is parallel to the floor.",
      "Grip the bar slightly wider than shoulder-width.",
      "Explosively row the bar to your lower chest/upper abdomen without changing torso angle.",
      "Return the bar to the floor and let it come to a dead stop."
    ],
    "tips": [
      "Ensure your torso does not rise as you pull.",
      "Each rep must start from a completely dead stop on the floor.",
      "Pull with your elbows."
    ],
    "muscles": [
      "Lats",
      "Upper Back",
      "Lower Back",
      "Rear Delts",
      "Biceps"
    ],
    "axialFatigueScore": 7,
    "connectiveTissueStressScore": 5,
    "gifUrl": "https://static.exercisedb.dev/media/r0z6xzQ.gif",
    "bodyPart": "back",
    "equipment": "barbell",
    "targetMuscle": "upper back",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ]
  },
  {
    "id": "yoke_walk",
    "name": "Yoke Walk",
    "category": "Tactical",
    "pattern": "impact",
    "impact": "high",
    "velocity": "slow",
    "description": "An intense strongman carry where a heavy metal yoke frame is placed on the upper back and walked for distance.",
    "instructions": [
      "Position yourself inside the yoke frame, resting the bar on your upper back/traps.",
      "Grip the uprights, brace your core deeply, and lift the yoke using your legs.",
      "Walk forward with short, rapid, high-frequency steps.",
      "Keep your core extremely rigid and maintain posture throughout the run."
    ],
    "tips": [
      "Keep steps small and fast to prevent the yoke from swinging.",
      "Do not look down; keep your eyes forward.",
      "Brace your abs like you are expecting a punch."
    ],
    "muscles": [
      "Core",
      "Quads",
      "Lower Back",
      "Traps",
      "Glutes",
      "Calves"
    ],
    "axialFatigueScore": 10,
    "connectiveTissueStressScore": 9,
    "gifUrl": "https://static.exercisedb.dev/media/qPEzJjA.gif",
    "bodyPart": "upper legs",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "calves",
      "forearms",
      "core"
    ]
  },
  {
    "id": "zercher_squat",
    "name": "Barbell Zercher Squat",
    "category": "Squat",
    "pattern": "squat",
    "impact": "high",
    "velocity": "medium",
    "description": "A squat variation where the barbell is cradled in the crooks of the elbows, requiring extreme core and upper back stability.",
    "instructions": [
      "Hold the barbell securely in the crooks of your elbows with arms crossed or hands clasped.",
      "Set your feet in a moderate to wide squat stance.",
      "Squat deeply while keeping the bar close to your torso and spine upright.",
      "Drive through your midfoot to stand up."
    ],
    "tips": [
      "Squeeze your shoulder blades together to create a solid base.",
      "Wrap a towel or pad around the bar to minimize elbow discomfort.",
      "Keep your core fully braced to prevent being pulled forward."
    ],
    "muscles": [
      "Quads",
      "Upper Back",
      "Core",
      "Glutes"
    ],
    "axialFatigueScore": 8,
    "connectiveTissueStressScore": 7,
    "gifUrl": "https://static.exercisedb.dev/media/LSTChY9.gif",
    "bodyPart": "upper legs",
    "equipment": "barbell",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "quadriceps",
      "hamstrings",
      "calves",
      "core"
    ]
  },
  {
    "id": "spoto_press",
    "name": "Spoto Press",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "high",
    "velocity": "medium",
    "description": "A bench press variation where you pause the barbell 1-2 inches above your chest to eliminate momentum and build supreme isometric strength.",
    "instructions": [
      "Set up on a flat bench and unrack the barbell.",
      "Lower the bar with control, stopping 1-2 inches above your chest.",
      "Hold a strict isometric pause for 1-2 seconds.",
      "Explosively press the bar back up to lockout."
    ],
    "tips": [
      "Keep your entire body extremely tight during the pause.",
      "Do not let the bar sink or rest; maintain active muscular tension.",
      "Squeeze the bar aggressively."
    ],
    "muscles": [
      "Chest",
      "Triceps",
      "Shoulders (Anterior)"
    ],
    "axialFatigueScore": 3,
    "connectiveTissueStressScore": 6,
    "gifUrl": "https://static.exercisedb.dev/media/EIeI8Vf.gif",
    "bodyPart": "chest",
    "equipment": "barbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ]
  },
  {
    "id": "kb_snatch",
    "name": "Kettlebell One Arm Snatch",
    "category": "Explosive",
    "pattern": "plyometric",
    "impact": "medium",
    "velocity": "fast",
    "description": "A dynamic ballistic movement lifting a kettlebell from between the knees to an overhead lockout position in one fluid motion.",
    "instructions": [
      "Hike the kettlebell back between your legs.",
      "Drive your hips forward explosively, snapping your glutes.",
      "Pull the bell up, keeping it close to your body.",
      "Punch your hand through the handle at the top to catch it overhead smoothly."
    ],
    "tips": [
      "The power comes from the hips, not a shoulder raise.",
      "Keep your grip loose to allow the handle to rotate freely.",
      "Tense your glutes and core at lock out."
    ],
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Shoulders",
      "Core",
      "Upper Back"
    ],
    "axialFatigueScore": 5,
    "connectiveTissueStressScore": 4,
    "gifUrl": "https://static.exercisedb.dev/media/aXcUyKb.gif",
    "bodyPart": "shoulders",
    "equipment": "kettlebell",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "trapezius",
      "forearms",
      "core"
    ]
  },
  {
    "id": "db_incline_flys",
    "name": "Dumbbell Incline Fly",
    "category": "Bench",
    "pattern": "push_horizontal",
    "impact": "low",
    "velocity": "medium",
    "description": "An isolation movement performed on an incline bench to stretch and isolate the upper fibers of the chest.",
    "instructions": [
      "Lie on an incline bench with dumbbells held over your chest.",
      "Lower the weights out to the sides in a wide arc with a slight bend in your elbows.",
      "Feel the stretch across your chest, then squeeze your pecs to bring the weights back together."
    ],
    "tips": [
      "Maintain a fixed angle at the elbow throughout the movement.",
      "Do not allow the dumbbells to touch at the top to keep constant tension.",
      "Focus on the contraction at the top."
    ],
    "muscles": [
      "Chest",
      "Shoulders"
    ],
    "axialFatigueScore": 1,
    "connectiveTissueStressScore": 3,
    "gifUrl": "https://static.exercisedb.dev/media/ESOd5Pl.gif",
    "bodyPart": "chest",
    "isDumbbell": true,
    "equipment": "dumbbell",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "shoulders"
    ]
  }

] as const;

export const EXERCISE_DATABASE_TYPED: ExerciseDefinition[] = EXERCISE_DATABASE as unknown as ExerciseDefinition[];

export const getExercisesByPattern = (pattern: ExerciseDefinition['pattern'], impact: ExerciseDefinition['impact'] = 'medium') => {
  const filtered = EXERCISE_DATABASE_TYPED.filter(e => e.pattern === pattern && (impact === 'high' ? true : e.impact === impact || e.impact === 'low'));
  
  return [...filtered].sort((a, b) => {
    // If pattern is 'core', show exercises belonging to 'Core' category first
    if (pattern === 'core') {
      const aIsCore = a.category.toLowerCase() === 'core';
      const bIsCore = b.category.toLowerCase() === 'core';
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;
    }
    // If pattern is 'accessory', show exercises belonging to 'Accessory' or 'Prehab' first
    if (pattern === 'accessory') {
      const aIsAcc = ['accessory', 'prehab'].includes(a.category.toLowerCase());
      const bIsAcc = ['accessory', 'prehab'].includes(b.category.toLowerCase());
      if (aIsAcc && !bIsAcc) return -1;
      if (!aIsAcc && bIsAcc) return 1;
    }
    return 0;
  });
};

export const getSwappableExercises = (exerciseId: string) => {
  if (!exerciseId || exerciseId === 'undefined') return [];
  
  const rawLower = exerciseId.toLowerCase().trim();
  const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normalizedId = clean(exerciseId);
  
  // 1. Try to find by exact ID or Name
  let current = EXERCISE_DATABASE_TYPED.find(e => 
    e.id.toLowerCase() === rawLower || 
    e.name.toLowerCase() === rawLower
  );

  // 2. Try by cleaned ID/Name (removes spaces, underscores, etc)
  if (!current) {
    current = EXERCISE_DATABASE_TYPED.find(e => 
      clean(e.id) === normalizedId || 
      clean(e.name) === normalizedId
    );
  }

  // 3. Fallback: Fuzzy Word Match (split by spaces/underscores)
  if (!current) {
    const inputWords = exerciseId.toLowerCase().split(/[\s_]+/).filter(w => w.length > 2);
    if (inputWords.length > 0) {
      current = EXERCISE_DATABASE_TYPED.find(e => {
        const targetWords = (e.name + ' ' + e.id).toLowerCase().split(/[\s_]+/);
        // Match if at least 2 significant words match, or all input words if less than 2
        const matchCount = inputWords.filter(w => targetWords.some(tw => tw.includes(w) || w.includes(tw))).length;
        return matchCount >= Math.min(inputWords.length, 2);
      });
    }
  }

  // 4. Last Ditch Guess: Category/Pattern keywords
  if (!current) {
    const lowerId = exerciseId.toLowerCase();
    if (lowerId.includes('bench') || lowerId.includes('chest')) {
      current = EXERCISE_DATABASE_TYPED.find(e => e.category === 'Bench');
    } else if (lowerId.includes('squat')) {
      current = EXERCISE_DATABASE_TYPED.find(e => e.category === 'Squat');
    } else if (lowerId.includes('deadlift') || lowerId.includes('hinge')) {
      current = EXERCISE_DATABASE_TYPED.find(e => e.category === 'Deadlift');
    } else if (lowerId.includes('press') || lowerId.includes('shoulder')) {
      current = EXERCISE_DATABASE_TYPED.find(e => e.category === 'Press');
    } else if (lowerId.includes('row') || lowerId.includes('back')) {
      current = EXERCISE_DATABASE_TYPED.find(e => e.category === 'Row');
    }
  }

  // 5. Still nothing? Return empty
  if (!current) return [];

  // Return all exercises in same category except the current one, sorted alphabetically
  return EXERCISE_DATABASE_TYPED
    .filter(e => e.category === current!.category && e.id !== current!.id)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
};
