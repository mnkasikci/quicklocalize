'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

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

const CONTEXT_TEMPLATES = [
  { label: 'Casual Mobile Game', value: 'This is a casual mobile game for entertainment' },
  { label: 'B2B Enterprise Software', value: 'This is professional B2B enterprise software for business operations' },
  { label: 'Educational App', value: 'This is an educational app designed to help users learn new skills' },
  { label: 'Health & Fitness', value: 'This is a health and fitness tracking application' },
  { label: 'E-Commerce Platform', value: 'This is an e-commerce platform for buying and selling products' },
];

export function TranslationForm({ onTranslate, isLoading = false }: TranslationFormProps) {
  const [context, setContext] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [useTemplate, setUseTemplate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.trim() || !targetLanguage) {
      alert('Please fill in all fields');
      return;
    }
    onTranslate({ context, targetLanguage });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Context Textarea */}
      <div>
        <label className="block text-sm font-medium mb-2">
          App Context
          <span className="text-blue-400 ml-1">(describe your app)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., This is a casual puzzle game for kids aged 6-10. Use friendly, playful language with emojis where appropriate."
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* Quick Templates */}
      {!useTemplate && context === '' && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Quick templates:</p>
          <div className="grid grid-cols-2 gap-2">
            {CONTEXT_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => setContext(template.value)}
                className="text-left text-xs px-3 py-2 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-600 rounded transition"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target Language */}
      <div>
        <label className="block text-sm font-medium mb-2">Target Language</label>
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

      {/* Submit Button */}
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
        {isLoading ? 'Translating...' : 'Translate'}
      </button>
    </form>
  );
}
