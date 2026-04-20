'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface TranslationFormProps {
  onTranslate: (data: { context: string; targetLanguage: string }) => void;
  isLoading?: boolean;
}

const COMMON_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

export function TranslationForm({ onTranslate, isLoading = false }: TranslationFormProps) {
  const [context, setContext] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const { t } = useLocale();

  const CONTEXT_TEMPLATES = [
    {
      labelKey: 'form.templates.casualGame',
      value: 'This is a casual mobile game for entertainment',
    },
    {
      labelKey: 'form.templates.b2b',
      value: 'This is professional B2B enterprise software for business operations',
    },
    {
      labelKey: 'form.templates.educational',
      value: 'This is an educational app designed to help users learn new skills',
    },
    {
      labelKey: 'form.templates.health',
      value: 'This is a health and fitness tracking application',
    },
    {
      labelKey: 'form.templates.ecommerce',
      value: 'This is an e-commerce platform for buying and selling products',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.trim() || !targetLanguage) {
      alert(t('form.fillFields'));
      return;
    }
    onTranslate({ context, targetLanguage });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('form.contextLabel')}
          <span className="text-blue-400 ml-1">{t('form.contextHint')}</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t('form.contextPlaceholder')}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {context === '' && (
        <div>
          <p className="text-xs text-slate-400 mb-2">{t('form.quickTemplates')}</p>
          <div className="grid grid-cols-2 gap-2">
            {CONTEXT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.labelKey}
                type="button"
                onClick={() => setContext(tmpl.value)}
                disabled={isLoading}
                className="text-left text-xs px-3 py-2 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-600 rounded transition disabled:cursor-not-allowed"
              >
                {t(tmpl.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">{t('form.languageLabel')}</label>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {COMMON_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
          isLoading
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Send size={18} />
        {isLoading ? t('form.translatingButton') : t('form.translateButton')}
      </button>
    </form>
  );
}
