'use client';

import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import { CookieBanner } from './CookieBanner';
import { FeatureConsentToast } from './FeatureConsentToast';
import { LanguageSwitcher } from './LanguageSwitcher';

function LayoutShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              QuickLocalize
            </span>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-4 md:flex">
                <a
                  href="https://github.com/mnkasikci/quicklocalize"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-300 hover:text-white transition"
                >
                  {t('nav.github')}
                </a>
                <a
                  href="https://github.com/mnkasikci/quicklocalize/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-300 hover:text-white transition"
                >
                  {t('nav.issues')}
                </a>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-slate-700 bg-slate-800/50 backdrop-blur mt-12">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div>
              <p className="text-sm text-slate-400">{t('footer.copyright')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('footer.madeWith')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('footer.selfTranslated')}</p>
            </div>
            <div className="flex gap-4">
              <a
                href="https://github.com/mnkasikci/quicklocalize/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 hover:text-white transition"
              >
                {t('footer.license')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <LocaleProvider>
        <CookieBanner />
        <FeatureConsentToast />
        <LayoutShell>{children}</LayoutShell>
      </LocaleProvider>
    </CookieConsentProvider>
  );
}
