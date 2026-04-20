'use client';

import { X } from 'lucide-react';
import { type ConsentFeature, useCookieConsent } from '@/context/CookieConsentContext';
import { useLocale } from '@/context/LocaleContext';

const NOTICE_KEY: Record<ConsentFeature, string> = {
  recentFiles: 'cookies.featureConsent.recentFiles',
  apiKey: 'cookies.featureConsent.apiKey',
  language: 'cookies.featureConsent.language',
};

export function FeatureConsentToast() {
  const { activeNotice, dismissNotice } = useCookieConsent();
  const { t } = useLocale();

  if (!activeNotice) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full sm:w-auto animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl px-4 py-3 flex items-start gap-3">
        <p className="text-xs text-slate-300 leading-relaxed flex-1">
          {t(NOTICE_KEY[activeNotice])}
        </p>
        <button
          type="button"
          onClick={dismissNotice}
          aria-label="Dismiss"
          className="shrink-0 text-slate-500 hover:text-slate-300 transition mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
