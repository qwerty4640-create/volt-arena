import * as fs from 'fs';
const content = fs.readFileSync('src/contexts/WorkoutContext.tsx', 'utf8');
const lines = content.split('\n');
const funcLines = lines.slice(918, 2160);
fs.appendFileSync('src/logic/sessionGeneratorEngine.ts', '\nexport ' + funcLines.join('\n') + '\n');
