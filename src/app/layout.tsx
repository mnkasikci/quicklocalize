import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'QuickLocalize - Free LLM-Powered Localization',
  description:
    'Upload your JSON files and get context-aware translations powered by Cloudflare Workers AI',
  keywords: ['localization', 'translation', 'i18n', 'JSON', 'LLM', 'free'],
  authors: [{ name: 'QuickLocalize Community' }],
  openGraph: {
    type: 'website',
    url: 'https://quicklocalize.pages.dev',
    title: 'QuickLocalize',
    description: 'Free, open-source localization tool powered by LLMs and Cloudflare Workers AI',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
