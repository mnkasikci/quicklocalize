'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import enFallback from '../../public/locales/en.json';
import {
  type LanguageCode,
  SUPPORTED_LANGUAGES,
  detectLanguage,
  loadTranslations,
  persistLanguage,
} from '@/lib/i18n';

type Translations = Record<string, unknown>;

interface LocaleContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolve(obj: unknown, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((cur, k) => {
    if (cur && typeof cur === 'object') return (cur as Record<string, unknown>)[k];
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : undefined;
}

function interpolate(str: string, vars: Record<string, string>): string {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [translations, setTranslations] = useState<Translations>(enFallback);

  useEffect(() => {
    const detected = detectLanguage();
    setLanguageState(detected);
    if (detected !== 'en') {
      loadTranslations(detected).then(setTranslations);
    }
  }, []);

  function setLanguage(code: LanguageCode) {
    persistLanguage(code);
    window.location.reload();
  }

  function t(key: string, vars?: Record<string, string>): string {
    const value = resolve(translations, key) ?? key;
    return vars ? interpolate(value, vars) : value;
  }

  return (
    <LocaleContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
