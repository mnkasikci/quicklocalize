'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { TranslationForm } from '@/components/TranslationForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { ApiKeyConfig, DEFAULT_BYOAK, type BYOAKConfig } from '@/components/ApiKeyConfig';
import { RecentFilesPanel, type RecentFile, getPreviewLines, ONE_WEEK_MS } from '@/components/RecentFilesPanel';
import { useLocale } from '@/context/LocaleContext';

const LS_RECENT = 'ql_recent_files';
const LS_HISTORY = 'ql_history_enabled';
const MAX_RECENT = 10;

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [byoakConfig, setByoakConfig] = useState<BYOAKConfig>(DEFAULT_BYOAK);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_RECENT);
      if (stored) {
        const parsed: RecentFile[] = JSON.parse(stored);
        const live = parsed.filter((f) => f.expiresAt > Date.now());
        if (live.length !== parsed.length) {
          localStorage.setItem(LS_RECENT, JSON.stringify(live));
        }
        setRecentFiles(live);
      }
      setHistoryEnabled(localStorage.getItem(LS_HISTORY) !== 'false');
    } catch {}
  }, []);

  const handleToggleHistory = (enabled: boolean) => {
    setHistoryEnabled(enabled);
    localStorage.setItem(LS_HISTORY, String(enabled));
  };

  const handleDeleteRecentFile = (id: string) => {
    setRecentFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem(LS_RECENT, JSON.stringify(updated));
      return updated;
    });
  };

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
    setProgress(null);

    try {
      const text = await uploadedFile.text();
      const fileContent = JSON.parse(text);

      const byoak =
        byoakConfig.enabled && byoakConfig.apiKey && byoakConfig.modelId
          ? {
              provider: byoakConfig.provider,
              apiKey: byoakConfig.apiKey,
              modelId: byoakConfig.modelId,
              contextLength: byoakConfig.contextLength,
            }
          : undefined;

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: fileContent,
          context: formData.context,
          targetLanguage: formData.targetLanguage,
          fileFormat: 'json',
          byoak,
        }),
      });

      if (!response.ok || !response.body) throw new Error(t('errors.translationFailed'));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === 'start') {
            setProgress({ completed: 0, total: event.total });
          } else if (event.type === 'progress') {
            setProgress({ completed: event.completed, total: event.total });
          } else if (event.type === 'complete') {
            setTranslationResult({
              success: true,
              translated: event.translated,
              targetLanguage: event.targetLanguage,
              format: event.format,
            });
            if (historyEnabled) {
              const now = Date.now();
              const newEntry: RecentFile = {
                id: crypto.randomUUID(),
                sourceFileName: uploadedFile.name,
                targetLanguage: event.targetLanguage,
                timestamp: now,
                expiresAt: now + ONE_WEEK_MS,
                preview: getPreviewLines(event.translated),
                sourceContent: fileContent,
                translatedContent: event.translated,
              };
              setRecentFiles((prev) => {
                const updated = [newEntry, ...prev].slice(0, MAX_RECENT);
                try {
                  localStorage.setItem(LS_RECENT, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          } else if (event.type === 'error') {
            throw new Error(event.error || t('errors.translationFailed'));
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.translationFailed'));
    } finally {
      setIsLoading(false);
      setProgress(null);
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

          <ApiKeyConfig value={byoakConfig} onChange={setByoakConfig} disabled={isLoading} />

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
              {progress ? (
                <>
                  <p className="font-medium text-slate-300">
                    {t('progress.processing', {
                      current: String(progress.completed),
                      total: String(progress.total),
                    })}
                  </p>
                  <div className="mt-4 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((progress.completed / progress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-slate-500">
                    {Math.round((progress.completed / progress.total) * 100)}%
                  </p>
                </>
              ) : (
                <>
                  <p>{t('progress.preparing')}</p>
                  <p className="text-sm mt-2">{t('status.awaitingHint')}</p>
                </>
              )}
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

      <RecentFilesPanel
        files={recentFiles}
        historyEnabled={historyEnabled}
        onDelete={handleDeleteRecentFile}
        onToggleHistory={handleToggleHistory}
      />

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
