const fs = require('fs');

const content = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf8');

let lines = content.split('\n');
let newLines = [];
let inTranslations = false;
let currentLang = null;
let seenKeys = new Set();

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  if (line.includes('const translations: Record<Language, Record<string, string>> = {')) {
    inTranslations = true;
    newLines.push(line);
    continue;
  }
  
  if (inTranslations) {
    if (line.match(/^  [a-z]{2}: \{/)) {
      currentLang = line.trim().split(':')[0];
      seenKeys = new Set();
      newLines.push(line);
      continue;
    }
    
    if (line.match(/^  \},?/)) {
      currentLang = null;
      newLines.push(line);
      continue;
    }
    
    if (line.match(/^};/)) {
      inTranslations = false;
      newLines.push(line);
      continue;
    }
    
    if (currentLang) {
      let match = line.match(/^\s*'([^']+)'\s*:/);
      if (match) {
        let key = match[1];
        if (seenKeys.has(key)) {
          console.log(`Removing duplicate key ${key} in ${currentLang}`);
          continue; // Skip this line
        }
        seenKeys.add(key);
      }
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync('src/contexts/SettingsContext.tsx', newLines.join('\n'));
console.log('Done');
