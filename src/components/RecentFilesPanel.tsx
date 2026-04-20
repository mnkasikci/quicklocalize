'use client';

import { Download, Trash2 } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export interface RecentFile {
  id: string;
  sourceFileName: string;
  targetLanguage: string;
  timestamp: number;
  expiresAt: number;
  preview: string[];
  sourceContent: Record<string, unknown>;
  translatedContent: Record<string, unknown>;
}

export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getPreviewLines(obj: Record<string, unknown>): string[] {
  const lines: string[] = [];

  function extract(o: Record<string, unknown>) {
    for (const [key, val] of Object.entries(o)) {
      if (lines.length >= 3) return;
      if (typeof val === 'string') {
        const truncated = val.length > 48 ? val.slice(0, 48) + '…' : val;
        lines.push(`"${key}": "${truncated}"`);
      } else if (val && typeof val === 'object') {
        extract(val as Record<string, unknown>);
      }
    }
  }

  extract(obj);
  return lines;
}

interface RecentFilesPanelProps {
  files: RecentFile[];
  historyEnabled: boolean;
  onDelete: (id: string) => void;
  onToggleHistory: (enabled: boolean) => void;
}

export function RecentFilesPanel({
  files,
  historyEnabled,
  onDelete,
  onToggleHistory,
}: RecentFilesPanelProps) {
  const { t } = useLocale();

  const triggerDownload = (content: Record<string, unknown>, filename: string) => {
    const element = document.createElement('a');
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const daysLeft = (file: RecentFile) => {
    const ms = file.expiresAt - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('recentFiles.title')}</h2>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
          <span>{t('recentFiles.saveHistory')}</span>
          <div
            onClick={() => onToggleHistory(!historyEnabled)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              historyEnabled ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                historyEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {!historyEnabled && (
        <div className="card p-4 text-slate-400 text-sm text-center">
          {t('recentFiles.historyOffMessage')}
        </div>
      )}

      {historyEnabled && files.length === 0 && (
        <div className="card p-4 text-slate-400 text-sm text-center">{t('recentFiles.empty')}</div>
      )}

      {historyEnabled && files.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div key={file.id} className="card p-4 relative">
              <button
                onClick={() => onDelete(file.id)}
                className="absolute top-3 right-3 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                title={t('recentFiles.delete')}
              >
                <Trash2 size={14} />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="font-medium text-sm truncate" title={file.sourceFileName}>
                  {file.sourceFileName}
                </span>
                <span className="shrink-0 text-xs bg-blue-600/30 text-blue-400 border border-blue-600/40 px-2 py-0.5 rounded-full">
                  {file.targetLanguage}
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/50 rounded p-2 mb-3 font-mono text-xs text-slate-400 min-h-[54px]">
                {file.preview.map((line, i) => (
                  <div key={i} className="truncate">
                    {line}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-500" title={new Date(file.timestamp).toLocaleString()}>
                  {t('recentFiles.expiresIn', { days: String(daysLeft(file)) })}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => triggerDownload(file.sourceContent, file.sourceFileName)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50 transition"
                  >
                    <Download size={12} />
                    {t('recentFiles.downloadSource')}
                  </button>
                  <button
                    onClick={() =>
                      triggerDownload(
                        file.translatedContent,
                        `translated-${file.targetLanguage.toLowerCase()}.json`,
                      )
                    }
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 transition"
                  >
                    <Download size={12} />
                    {t('recentFiles.downloadTranslated')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
