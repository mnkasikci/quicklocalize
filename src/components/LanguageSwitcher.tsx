'use client';

import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { useLocale } from '@/context/LocaleContext';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLocale();

  if (SUPPORTED_LANGUAGES.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 text-slate-300">
      <Globe size={15} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as typeof language)}
        className="bg-transparent text-sm text-slate-300 hover:text-white focus:outline-none cursor-pointer"
        aria-label={t('language.select')}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-800 text-white">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
