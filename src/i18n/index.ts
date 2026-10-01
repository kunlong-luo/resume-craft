import { useResumeStore } from '../store/useResumeStore';
import { zh, TranslationSchema } from './locales/zh';
import { en } from './locales/en';

const locales: Record<string, TranslationSchema> = {
  zh,
  en,
};

export function getTranslation(lang: string = 'zh'): TranslationSchema {
  return locales[lang] || zh;
}

export function useTranslation() {
  const lang = useResumeStore((s) => s.uiLanguage || 'zh');
  const t = locales[lang] || zh;
  return { t, lang };
}

export function useResumeTranslation() {
  const lang = useResumeStore((s) => s.settings?.lang || 'zh');
  const t = locales[lang] || zh;
  return { t, lang };
}

export type { TranslationSchema };
