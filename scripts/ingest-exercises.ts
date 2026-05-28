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
  
  // Index remote exercises by lowercased, trimmed name for exact matching
  const remoteMap = new Map<string, any>();
  for (const rx of remoteExercises) {
    const cleanName = rx.name.toLowerCase().trim();
    remoteMap.set(cleanName, rx);
  }
  
  console.log(`Created lookup map with ${remoteMap.size} unique exercise names.`);
  
  let matchCount = 0;
  let skipCount = 0;
  
  // Map local exercises and add extra properties if names match exactly
  const updatedDatabase = EXERCISE_DATABASE.map((localEx: any) => {
    const cleanLocalName = localEx.name.toLowerCase().trim();
    const match = remoteMap.get(cleanLocalName);
    
    if (match) {
      matchCount++;
      console.log(`[MATCH] "${localEx.name}" -> Ingesting details from remote ID: ${match.exerciseId}`);
      
      // Return a merged object with additional remote elements
      return {
        ...localEx,
        gifUrl: match.gifUrl || undefined,
        bodyPart: (match.bodyParts && match.bodyParts[0]) || undefined,
        equipment: (match.equipments && match.equipments[0]) || undefined,
        targetMuscle: (match.targetMuscles && match.targetMuscles[0]) || undefined,
        secondaryMuscles: match.secondaryMuscles || undefined,
      };
    } else {
      skipCount++;
      console.log(`[SKIP]  "${localEx.name}" -> No exact match in remote DB`);
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
