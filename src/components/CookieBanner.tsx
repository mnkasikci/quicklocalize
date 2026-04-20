'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, ShieldOff } from 'lucide-react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useLocale } from '@/context/LocaleContext';

export function CookieBanner() {
  const { consentGiven, grantAll, grantRequired } = useCookieConsent();
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);

  if (consentGiven) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">{t('cookies.title')}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{t('cookies.description')}</p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {t('cookies.whatDoesThisMean')}
        </button>

        {expanded && (
          <div className="space-y-4 text-sm border-t border-slate-700 pt-4">
            <div>
              <p className="font-semibold text-slate-200 mb-1.5">{t('cookies.required.title')}</p>
              <ul className="space-y-1 text-slate-400 text-xs list-disc list-inside">
                <li>{t('cookies.required.items.session')}</li>
                <li>{t('cookies.required.items.security')}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-200 mb-1">{t('cookies.functional.title')}</p>
              <p className="text-slate-400 text-xs mb-1.5">{t('cookies.functional.description')}</p>
              <ul className="space-y-1 text-slate-400 text-xs list-disc list-inside">
                <li>{t('cookies.functional.items.language')}</li>
                <li>{t('cookies.functional.items.recentFiles')}</li>
                <li>{t('cookies.functional.items.apiKey')}</li>
              </ul>
            </div>
            <p className="text-xs text-slate-500 italic">{t('cookies.noTracking')}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={grantAll}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
          >
            <ShieldCheck size={16} />
            {t('cookies.allowAll')}
          </button>
          <button
            type="button"
            onClick={grantRequired}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-medium rounded-xl transition"
          >
            <ShieldOff size={16} />
            {t('cookies.onlyRequired')}
          </button>
        </div>
      </div>
    </div>
  );
}
