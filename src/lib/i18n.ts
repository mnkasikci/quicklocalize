export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  {code: 'de', name: 'German'},
  {code: 'it', name: 'Italian'},
  {code: 'ja', name: 'Japanese'},
  {code: 'ko', name: 'Korean'},
  {code: 'pt', name: 'Portuguese'},
  {code: 'ru', name: 'Russian'},
  {code: 'zh', name: 'Chinese'},
  {code: 'ar', name: 'Arabic'},
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const STORAGE_KEY = 'ql_language';

/** Returns the best matching supported language code for a browser locale string.
 *  e.g. 'en-BR' → 'en', 'pt-PT' → 'pt' (if 'pt' is supported), else 'en'. */
function matchLanguage(browserLang: string): LanguageCode | null {
  const normalized = browserLang.toLowerCase().replace('-', '_');
  const prefix = (browserLang.split('-')[0] ?? browserLang).toLowerCase() as LanguageCode;

  const exact = SUPPORTED_LANGUAGES.find((l) => l.code === normalized);
  if (exact) return exact.code;

  const base = SUPPORTED_LANGUAGES.find((l) => l.code === prefix);
  if (base) return base.code;

  return null;
}

export function detectLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) return stored;

  const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of browserLangs) {
    const match = matchLanguage(lang);
    if (match) return match;
  }

  return 'en';
}

export function persistLanguage(code: LanguageCode): void {
  localStorage.setItem(STORAGE_KEY, code);
}

export async function loadTranslations(code: LanguageCode): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`/locales/${code}.json`);
    if (res.ok) return res.json();
  } catch {}
  // Fallback: load English
  const fallback = await fetch('/locales/en.json');
  return fallback.json();
}
