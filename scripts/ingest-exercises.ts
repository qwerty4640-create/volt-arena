import * as fs from 'fs';
import * as path from 'path';

// Note: since this script is run via npx tsx, we can import existing typescript modules directly
import { EXERCISE_DATABASE } from '../src/constants/exercises';

async function ingest() {
  const remoteUrl = 'https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/main/src/data/exercises.json';
  
  console.log(`Downloading ExerciseDB exercises from ${remoteUrl}...`);
  const res = await fetch(remoteUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch remote DB: ${res.status} ${res.statusText}`);
  }
  
  const remoteExercises = await res.json() as any[];
  console.log(`Successfully downloaded ${remoteExercises.length} exercises from remote DB.`);
  
  // Custom manual mappings from local exercise IDs to remote exercise IDs or names
  const OVERRIDES: Record<string, string> = {
    // Squat variations
    "squat_conventional": "qXTaZnJ", // barbell full squat
    "squat_safety_bar": "Gnfo4FM", // barbell high bar squat
    "squat_high_bar": "zG0zs85", // barbell front squat
    "bodyweight_squat": "75Bgtjy", // potty squat
    "goblet_squat": "yn8yg1r", // dumbbell goblet squat
    "leg_press": "10Z2DXU", // sled 45° leg press
    "hack_squat": "Qa55kX1", // sled hack squat
    "landmine_squat": "pkSoCW9", // barbell jefferson squat
    "landmine_goblet_squat": "yn8yg1r", // dumbbell goblet squat
    "pistol_squat": "nqs5HGV", // single leg squat (pistol) male

    // Bench variations
    "bench_flat": "EIeI8Vf", // barbell bench press
    "chest_press_machine": "DOoWcnA", // lever chest press
    "cable_crossover": "0CXGHya", // cable cross-over variation
    "floor_press": "neonEDL", // floor fly (with barbell)
    "incline_dumbbell_press": "ns0SIbU", // dumbbell incline bench press
    "ring_pushups": "I4hDWkc", // push-up
    "pseudo_planche_pushups": "mAYqY4M", // stretched full planche push-up
    "t_pushups": "I4hDWkc", // push-up
    "spoto_press": "EIeI8Vf", // barbell bench press

    // Deadlift variations
    "deadlift_conventional": "ila4NZS", // barbell deadlift
    "deadlift_sumo": "KgI0tqW", // barbell sumo deadlift
    "rdl": "wQ2c4XD", // barbell romanian deadlift
    "stiff_leg_deadlift": "hrVQWvE", // barbell straight leg deadlift
    "deficit_deadlift": "ila4NZS", // barbell deadlift

    // Overhead & Shoulder
    "overhead_press": "wdRZISl", // barbell standing close grip military press
    "push_press": "FS63wTN", // dumbbell push press
    "seated_db_press": "84RyJf8", // dumbbell one arm shoulder press
    "z_press": "A6wtbuL", // dumbbell standing overhead press
    "arnold_press": "Xy4jlWA", // dumbbell arnold press
    "landmine_press": "wdRZISl", // barbell standing close grip military press
    "landmine_thruster": "1gFNTZV", // barbell jump squat
    "pike_pushups": "XPUDTt7", // pike-to-cobra push-up
    "handstand_hold": "rQxwMxO", // handstand push-up
    "db_overhead_press": "A6wtbuL", // dumbbell standing overhead press

    // Pull / Chin / Row variations
    "lat_pulldowns": "LEprlgG", // cable lat pulldown full range of motion
    "neutral_grip_pull_ups": "VnfUNW7", // close grip chin-up
    "ring_pull_ups": "I4hDWkc", // pull-up
    "ring_chin_ups": "T2mxWqc", // chin-up
    "ring_muscle_up": "yJUHKTn", // muscle up
    "front_lever_tuck": "d1GgzTU", // l-pull-up
    "barbell_row": "eZyBC3j", // barbell bent over row
    "seated_cable_rows": "fUBheHs", // cable seated row
    "one_arm_db_rows": "EIsE3u8", // cable one arm bent over row
    "t_bar_rows": "LuBEORI", // lever bent-over row with v-bar
    "chest_supported_rows": "7I6LNUG", // lever seated row
    "seal_rows": "eZyBC3j", // barbell bent over row
    "landmine_row": "LuBEORI", // lever bent-over row with v-bar
    "meadows_row": "Fhdtwf3", // lever one arm bent over row

    // Accessory
    "bicep_cable_curl": "G08RZcQ", // cable curl
    "cable_tricep_overhead": "KWdF2JI", // cable kneeling triceps extension
    "leg_extension": "my33uHU", // lever leg extension
    "leg_curl_seated": "Zg3XY7P", // lever seated leg curl
    "cable_face_pulls": "ZfyAGhK", // cable standing rear delt row (with rope)
    "leg_press_unilateral": "V07qpXy", // lever alternate leg press
    "incline_dumbbell_curls": "ByX0WxV", // dumbbell incline hammer curl
    "hammer_curls": "slDvUAU", // dumbbell hammer curl
    "preacher_curls": "hacCyUv", // ez barbell close grip preacher curl
    "concentration_curls": "7inpWch", // dumbbell standing concentration curl
    "zottman_curls": "kXaIn5A", // dumbbell zottman curl
    "triceps_pushdowns": "dU605di", // cable pushdown (with rope attachment)
    "barbell_skullcrushers": "h8LFzo9", // barbell lying triceps extension skull crusher
    "dips": "9WTm7dq", // chest dip
    "overhead_db_extension": "5fKX7wi", // dumbbell seated reverse grip one arm overhead tricep extension
    "tricep_bench_dips": "Wgbn9qo", // triceps dip (between benches)
    "reverse_nordic_curl": "E4PwJqI", // self assisted inverse leg curl

    // Core
    "plank": "hCjGsRQ", // power point plank
    "bicycle_crunch": "tZkGYZ9", // band bicycle crunch
    "ab_wheel_rollout": "NAgVB3t", // wheel rollerout
    "v_ups": "qcNN2FN", // butt-ups
    "leg_raises_floor": "WhuFnR7", // lying leg raise flat bench
    "toe_touches": "p195zsJ", // two toe touch (male)
    "side_plank": "VO2qeJg", // side plank hip adduction

    // Tactical / Strongman
    "sandbag_zercher_carry": "LSTChY9", // barbell zercher squat
    "ruck_march": "sVQCCeG", // march sit (wall)
    "ammo_can_press": "A6wtbuL", // dumbbell standing overhead press
    "farmer_carry": "qPEzJjA", // farmers walk
    "burpee_over_bar": "dK9394r", // burpee
    "log_clean_press": "SGY8Zui", // barbell clean and press
    "yoke_walk": "qPEzJjA", // farmers walk

    // Explosive
    "box_jumps": "iPm26QU", // box jump down with one leg stabilization
    "med_ball_slams": "ktf3nvW", // kettlebell plyo push-up
    "depth_jumps": "CB8WET1", // incline push up depth jump
    "broad_jump": "uZKq7lo", // forward jump
    "single_arm_snatch_db": "6pTkI99", // dumbbell one arm snatch
    "broad_jump_to_sprint": "uZKq7lo", // forward jump
    "bounding": "uZKq7lo", // forward jump

    // Endurance / Cardio
    "running_steady_state": "rjtuP6X", // walk elliptical cross trainer
    "running_intervals": "rjiM4L3", // walking on incline treadmill
    "rowing_intervals": "a8VDgLw", // stationary bike walk
    "cycling_intervals": "a8VDgLw", // stationary bike walk
    "cycling_steady_state": "a8VDgLw", // stationary bike walk
    "rucking_steady_state": "rjiM4L3", // walking on incline treadmill
    "assault_bike_intervals": "1ZFqTDN", // air bike
    "rowing_steady_state": "a8VDgLw", // stationary bike walk
    "hill_sprints": "Qoujh3Q", // wind sprints
    "battle_rope_waves": "yaAxcQr", // rope climb
    "swimming_freestyle": "SP3hUez", // swimmer kicks v. 2 (male)

    // Prehab & Mobility
    "band_pull_aparts": "VtTbiP3", // band pull through
    "wall_slides": "ZZTGMKh", // one arm against wall
    "bird_dog": "01qpYSe", // upward facing dog
    "eccentric_calf_raise": "2ORFMoR", // hack calf raise
    "face_pulls": "ZfyAGhK", // cable standing rear delt row (with rope)
    "good_mornings": "XlZ4lAC", // barbell good morning
    "db_bulgarian_split_squats": "9E25EOx", // split squats
    "90_90_hip_flow": "VO2qeJg", // side plank hip adduction
    "cat_cow": "CosupLu", // front plank with twist
  };

  // Index remote exercises by lowercased, trimmed name for exact matching
  const remoteMap = new Map<string, any>();
  for (const rx of remoteExercises) {
    const cleanName = rx.name.toLowerCase().trim();
    remoteMap.set(cleanName, rx);
  }
  
  console.log(`Created lookup map with ${remoteMap.size} unique exercise names.`);
  
  let matchCount = 0;
  let skipCount = 0;
  
  // Map local exercises and add extra properties if names match or override matches
  const updatedDatabase = EXERCISE_DATABASE.map((localEx: any) => {
    const cleanLocalName = localEx.name.toLowerCase().trim();
    
    // Check if there is an override mapped for this exercise ID
    const override = OVERRIDES[localEx.id];
    let match = null;
    
    if (override) {
      // First try to match by remote ID
      match = remoteExercises.find(rx => (rx.exerciseId || rx.id) === override);
      if (!match) {
        // Next try to match by remote name
        match = remoteMap.get(override.toLowerCase().trim());
      }
    }
    
    // Fall back to exact name matching
    if (!match) {
      match = remoteMap.get(cleanLocalName);
    }
    
    // Fall back to partial matching if exact match fails
    if (!match) {
        match = remoteExercises.find(rx => {
            const remoteName = rx.name.toLowerCase().trim();
            return cleanLocalName.includes(remoteName) || remoteName.includes(cleanLocalName);
        });
    }
    
    if (match) {
      matchCount++;
      if (localEx.name.includes("Archer Pull Ups")) {
        console.log(`[DEBUG] Archer Pull Ups match:`, JSON.stringify(match));
      }
      console.log(`[MATCH] "${localEx.name}" (ID: ${localEx.id}) -> Ingesting from remote ID: ${match.exerciseId || match.id} ("${match.name}")`);
      
      // Return a merged object with additional remote elements
      const merged = {
        ...localEx,
        gifUrl: match.gifUrl || match.gif || localEx.gifUrl || "https://static.exercisedb.dev/media/72BC5Za.gif",
        bodyPart: (match.bodyParts && match.bodyParts[0]) || localEx.bodyPart || "unknown",
        equipment: (match.equipments && match.equipments[0]) || localEx.equipment || "unknown",
        targetMuscle: (match.targetMuscles && match.targetMuscles[0]) || localEx.targetMuscle || "unknown",
        secondaryMuscles: match.secondaryMuscles || localEx.secondaryMuscles || [],
      };
      if (localEx.name.includes("Archer Pull Ups")) {
        console.log(`[DEBUG] Archer Pull Ups merged:`, JSON.stringify(merged));
      }
      return merged;
    } else {
      skipCount++;
      console.log(`[SKIP]  "${localEx.name}" (ID: ${localEx.id}) -> No match in remote DB`);
      return localEx;
    }
  });
  
  console.log(`\nIngestion complete: ${matchCount} matches found, ${skipCount} skipped.`);
  
  // Read existing file to preserve format, types, interfaces, and helper functions
  const filePath = path.resolve('src/constants/exercises.ts');
  const originalContent = fs.readFileSync(filePath, 'utf8');
  
  // Update the ExerciseDefinition interface if it doesn't already have the new properties
  let updatedContent = originalContent;
  
  // Let's see if we need to add the new optional properties to the interface
  const interfaceTarget = 'isCalisthenics?: boolean;\n}';
  const interfaceReplacement = `isCalisthenics?: boolean;
  // Ingested properties from ExerciseDB
  gifUrl?: string;
  bodyPart?: string;
  equipment?: string;
  targetMuscle?: string;
  secondaryMuscles?: string[];
}`;
  
  if (updatedContent.includes(interfaceTarget) && !updatedContent.includes('gifUrl?: string;')) {
    console.log("Updating ExerciseDefinition interface with new optional properties...");
    updatedContent = updatedContent.replace(interfaceTarget, interfaceReplacement);
  }
  
  // Now replace the EXERCISE_DATABASE array content
  const startDelimiter = 'export const EXERCISE_DATABASE: ExerciseDefinition[] = [';
  const endDelimiter = '] as const;';
  
  const startIndex = updatedContent.indexOf(startDelimiter);
  const endIndex = updatedContent.indexOf(endDelimiter);
  
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Could not locate the EXERCISE_DATABASE array range in exercises.ts");
  }
  
  console.log("Replacing the EXERCISE_DATABASE array with merged exercise objects...");
  
  // Format the updated exercises nicely
  const serializedDatabase = JSON.stringify(updatedDatabase, null, 2);
  
  updatedContent = 
    updatedContent.substring(0, startIndex + startDelimiter.length) +
    '\n' + serializedDatabase.substring(1, serializedDatabase.length - 1) +
    '\n' + updatedContent.substring(endIndex);
    
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Successfully updated exercises file at: ${filePath}`);
}

ingest().catch((err) => {
  console.error("Error during build-time ingestion:", err);
  process.exit(1);
});
