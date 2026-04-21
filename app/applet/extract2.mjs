import fs from 'fs';
import path from 'path';

const code = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf-8');

// Find the start of translations
const startIndex = code.indexOf('const translations: Record<Language, Record<string, string>> = {');
// Find the end by looking for "export interface SettingsContextType" or "type LanguageState"
const endIndex = code.indexOf('\ninterface SettingsContextType', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    let dictStr = code.substring(startIndex, endIndex);
    // strip the leading part so it's just the object
    dictStr = dictStr.replace('const translations: Record<Language, Record<string, string>> = ', '');
    // remove the trailing semicolon
    dictStr = dictStr.trim();
    if (dictStr.endsWith(';')) dictStr = dictStr.slice(0, -1);
    
    // We can evaluate it inside a function
    const evaluate = new Function(`return ${dictStr}`);
    const translations = evaluate();
    
    fs.mkdirSync('src/locales', { recursive: true });
    
    const langs = ['en', 'hi', 'ja', 'es', 'ko', 'zh', 'nl'];
    for (const lang of langs) {
        if (translations[lang]) {
            fs.writeFileSync(`src/locales/${lang}.json`, JSON.stringify(translations[lang], null, 2));
            console.log(`Extracted ${lang}.json - ${Object.keys(translations[lang]).length} keys`);
        }
    }
} else {
    console.error("Could not parse");
}
