import fs from 'fs';

const code = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf-8');

const match = code.match(/const translations: Record<Language, Record<string, string>> = (\{[\s\S]*?\});\n\ninterface/);
if (match) {
  const objStr = match[1];
  const fn = new Function(`return ${objStr}`);
  const dict = fn();
  
  fs.mkdirSync('src/locales', { recursive: true });
  fs.writeFileSync('src/locales/en.json', JSON.stringify(dict.en, null, 2));
  fs.writeFileSync('src/locales/es.json', JSON.stringify(dict.es, null, 2));
  fs.writeFileSync('src/locales/ko.json', JSON.stringify(dict.ko, null, 2));
  fs.writeFileSync('src/locales/zh.json', JSON.stringify(dict.zh, null, 2));
  console.log("Extracted dict length:", Object.keys(dict.en).length);
} else {
  console.log("Could not find translations dictionary in SettingsContext.tsx");
}
