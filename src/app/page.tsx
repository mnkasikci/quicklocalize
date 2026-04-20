'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { TranslationForm } from '@/components/TranslationForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { useLocale } from '@/context/LocaleContext';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { t } = useLocale();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setError(null);
    setTranslationResult(null);
    setHasSubmitted(false);
  };

  const handleTranslate = async (formData: { context: string; targetLanguage: string }) => {
    if (!uploadedFile) {
      setError(t('errors.uploadFirst'));
      return;
    }

    setIsLoading(true);
    setHasSubmitted(true);
    setError(null);

    try {
      const text = await uploadedFile.text();
      const fileContent = JSON.parse(text);

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: fileContent,
          context: formData.context,
          targetLanguage: formData.targetLanguage,
          fileFormat: uploadedFile.name.endsWith('.json') ? 'json' : 'yaml',
        }),
      });

      if (!response.ok) throw new Error(t('errors.translationFailed'));

      const result = await response.json();
      setTranslationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.translationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text">{t('hero.title')}</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">{t('hero.description')}</p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="https://github.com/mnkasikci/quicklocalize"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
          >
            {t('hero.githubButton')}
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-start">
        <div
          className={`space-y-6 transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">{t('steps.upload')}</h2>
            <FileUploader onFileUpload={handleFileUpload} />
            {uploadedFile && (
              <p className="text-sm text-green-400 mt-4">
                {t('upload.fileUploaded', { filename: uploadedFile.name })}
              </p>
            )}
          </div>

          {uploadedFile && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">{t('steps.translate')}</h2>
              <TranslationForm onTranslate={handleTranslate} isLoading={isLoading} />
            </div>
          )}

          {error && (
            <div className="card p-4 border-red-500/30 bg-red-500/10">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {translationResult && (
            <div className="card p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">{t('results.title')}</h2>
              <ResultsDisplay result={translationResult} />
            </div>
          )}
          {!translationResult && isLoading && (
            <div className="card p-6 text-center text-slate-400">
              <p>{t('status.awaitingTitle')}</p>
              <p className="text-sm mt-2">{t('status.awaitingHint')}</p>
            </div>
          )}
          {!uploadedFile && (
            <div className="card p-6 text-center text-slate-400">
              <p>{t('status.uploadTitle')}</p>
              <p className="text-sm mt-2">{t('status.uploadHint')}</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">{t('features.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎯',
              titleKey: 'features.contextAware.title',
              descKey: 'features.contextAware.description',
            },
            { icon: '💰', titleKey: 'features.free.title', descKey: 'features.free.description' },
            { icon: '⚡', titleKey: 'features.fast.title', descKey: 'features.fast.description' },
          ].map((f) => (
            <div key={f.titleKey} className="card p-6 text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{t(f.titleKey)}</h3>
              <p className="text-sm text-slate-400">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
