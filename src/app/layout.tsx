import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuickLocalize - Free LLM-Powered Localization',
  description:
    'Upload your JSON/YAML files and get context-aware translations powered by Cloudflare Workers AI',
  keywords: [
    'localization',
    'translation',
    'i18n',
    'JSON',
    'YAML',
    'LLM',
    'free',
  ],
  authors: [{ name: 'QuickLocalize Community' }],
  openGraph: {
    type: 'website',
    url: 'https://quicklocalize.pages.dev',
    title: 'QuickLocalize',
    description:
      'Free, open-source localization tool powered by LLMs and Cloudflare Workers AI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="min-h-screen">
          <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    QuickLocalize
                  </span>
                </div>
                <div className="hidden items-center gap-4 md:flex">
                  <a
                    href="https://github.com/quicklocalize/quicklocalize"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-300 hover:text-white transition"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://github.com/quicklocalize/quicklocalize/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-300 hover:text-white transition"
                  >
                    Issues
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-slate-700 bg-slate-800/50 backdrop-blur mt-12">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    © 2024 QuickLocalize. All rights reserved.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Made with ❤️ for developers worldwide
                  </p>
                </div>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/quicklocalize/quicklocalize/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    MIT License
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
