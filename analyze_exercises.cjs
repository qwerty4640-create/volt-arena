const fs = require('fs');

// We'll read the file and try to extract the exercises. 
// Since it's a TS file, we can't easily require it, so we'll just read the raw text.
const content = fs.readFileSync('src/constants/exercises.ts', 'utf8');

// This is a rough regex to find the exercise objects
const exerciseMatches = content.match(/\{[^}]*"name":\s*"[^"]*"[^}]*\}/g);

if (!exerciseMatches) {
  console.log("No exercises found");
  process.exit(0);
}

const exercises = [];
exerciseMatches.forEach(match => {
  try {
    // This is a naive way to parse the objects
    const nameMatch = match.match(/"name":\s*"([^"]*)"/);
    const idMatch = match.match(/"id":\s*"([^"]*)"/);
    const hasGif = match.includes('"gifUrl"');
    
    if (nameMatch) {
      exercises.push({
        id: idMatch ? idMatch[1] : 'unknown',
        name: nameMatch[1],
        normalizedName: nameMatch[1].toLowerCase().replace(/\s+/g, ' ').trim(),
        hasGif: hasGif,
        raw: match
      });
    }
  } catch (e) {
    // Ignore malformed
  }
});

const grouped = {};
exercises.forEach(ex => {
  if (!grouped[ex.normalizedName]) {
    grouped[ex.normalizedName] = [];
  }
  grouped[ex.normalizedName].push(ex);
});

console.log("--- Duplicate Exercises (normalized name) ---");
Object.keys(grouped).forEach(name => {
  if (grouped[name].length > 1) {
    console.log(`\nName: "${name}"`);
    grouped[name].forEach(ex => {
      console.log(` - ID: ${ex.id}, HasGif: ${ex.hasGif}`);
    });
  }
});
