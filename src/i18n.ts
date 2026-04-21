import en from './locales/en.json';
import es from './locales/es.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';

export type SupportedLanguage = 'en' | 'es' | 'ko' | 'zh';

const resources: Record<SupportedLanguage, Record<string, string>> = {
  en,
  es,
  ko,
  zh
};

export function getTranslation(lang: SupportedLanguage, key: string, params?: Record<string, string | number>): string {
  const dictionary = resources[lang] || resources['en'];
  let text = dictionary[key] || resources['en'][key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
  }

  return text;
}
