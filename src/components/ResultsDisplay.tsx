'use client';

import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface ResultsDisplayProps {
  result: {
    success: boolean;
    targetLanguage: string;
    translated: Record<string, any>;
    format: string;
  };
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  const jsonString = JSON.stringify(result.translated, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([jsonString], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `translated-${result.targetLanguage.toLowerCase()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-slate-400">{t('results.targetLanguage')}</p>
          <p className="font-medium">{result.targetLanguage}</p>
        </div>
        <div>
          <p className="text-slate-400">{t('results.format')}</p>
          <p className="font-medium">{result.format.toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm text-slate-300 font-mono">{jsonString}</pre>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
            copied
              ? 'bg-green-600/30 text-green-400 border border-green-600'
              : 'bg-slate-700/50 hover:bg-slate-700 text-white'
          }`}
        >
          <Copy size={18} />
          {copied ? t('results.copied') : t('results.copy')}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 border border-blue-600"
        >
          <Download size={18} />
          {t('results.download')}
        </button>
      </div>

      <p className="text-xs text-slate-400 bg-slate-800/30 p-3 rounded">
        💡 {t('results.note')}
      </p>
    </div>
  );
}
