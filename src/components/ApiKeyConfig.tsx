'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Key, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { useCookieConsent } from '@/context/CookieConsentContext';

export interface BYOAKConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'groq';
  apiKey: string;
  modelId: string;
  contextLength: number;
}

interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  supportsJson: boolean;
}

interface ApiKeyConfigProps {
  value: BYOAKConfig;
  onChange: (val: BYOAKConfig) => void;
  disabled?: boolean;
}

const PROVIDERS = [
  { id: 'openai' as const, label: 'OpenAI' },
  { id: 'anthropic' as const, label: 'Anthropic' },
  { id: 'groq' as const, label: 'Groq' },
];

const DEFAULT_CONTEXT: Record<string, number> = {
  openai: 128000,
  anthropic: 200000,
  groq: 128000,
};

const STORAGE_KEY = 'ql_byoak';

export const DEFAULT_BYOAK: BYOAKConfig = {
  enabled: false,
  provider: 'openai',
  apiKey: '',
  modelId: '',
  contextLength: 128000,
};

export function ApiKeyConfig({ value, onChange, disabled = false }: ApiKeyConfigProps) {
  const { t } = useLocale();
  const { isAllowed, grantFeatureConsent } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsStatus, setModelsStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [modelsError, setModelsError] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customModelText, setCustomModelText] = useState('');
  const [contextChangedHigher, setContextChangedHigher] = useState(false);
  const [contextChangedLower, setContextChangedLower] = useState(false);
  const defaultContextRef = useRef<number>(DEFAULT_CONTEXT[value.provider] ?? 128000);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    if (!isAllowed('apiKey')) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as BYOAKConfig;
        setRememberKey(true);
        setExpanded(true);
        onChange(parsed);
        if (parsed.apiKey) scheduleModelFetch(parsed.provider, parsed.apiKey, parsed, false);
      } catch {}
    }
  }, [isAllowed]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (config: BYOAKConfig) => localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  const fetchModels = async (
    provider: string,
    apiKey: string,
    currentConfig: BYOAKConfig,
    remember: boolean
  ) => {
    if (!apiKey.trim()) {
      setModels([]);
      setModelsStatus('idle');
      return;
    }
    setModelsStatus('loading');
    setModelsError('');
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = (await res.json()) as { models?: ModelInfo[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load models');
      const list = data.models ?? [];
      setModels(list);
      setModelsStatus('loaded');
      // Auto-select first model if nothing valid is selected
      const validSelection = list.find((m) => m.id === currentConfig.modelId);
      if (!validSelection && list.length > 0 && !isCustom) {
        const first = list[0]!;
        const updated = { ...currentConfig, modelId: first.id, contextLength: first.contextLength };
        onChange(updated);
        if (remember) save(updated);
      }
    } catch (err) {
      setModelsStatus('error');
      setModelsError(err instanceof Error ? err.message : t('byoak.modelError'));
    }
  };

  const scheduleModelFetch = (
    provider: string,
    apiKey: string,
    config: BYOAKConfig,
    remember: boolean,
    delay = 800
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!apiKey.trim()) {
      setModels([]);
      setModelsStatus('idle');
      return;
    }
    debounceRef.current = setTimeout(() => fetchModels(provider, apiKey, config, remember), delay);
  };

  const handleToggle = () => {
    const updated = { ...value, enabled: !value.enabled };
    setExpanded(!value.enabled);
    onChange(updated);
    if (rememberKey) save(updated);
  };

  const handleProviderChange = (provider: BYOAKConfig['provider']) => {
    const newCtx = DEFAULT_CONTEXT[provider] ?? 128000;
    defaultContextRef.current = newCtx;
    setContextChangedHigher(false);
    setContextChangedLower(false);
    setModels([]);
    setModelsStatus('idle');
    setIsCustom(false);
    const updated = { ...value, provider, modelId: '', contextLength: newCtx };
    onChange(updated);
    if (rememberKey) save(updated);
    scheduleModelFetch(provider, value.apiKey, updated, rememberKey, 0);
  };

  const handleApiKeyChange = (apiKey: string) => {
    const updated = { ...value, apiKey };
    onChange(updated);
    if (rememberKey) save(updated);
    scheduleModelFetch(value.provider, apiKey, updated, rememberKey);
  };

  const handleModelSelect = (modelId: string) => {
    if (modelId === 'custom') {
      setIsCustom(true);
      const updated = { ...value, modelId: customModelText };
      onChange(updated);
      if (rememberKey) save(updated);
    } else {
      setIsCustom(false);
      const model = models.find((m) => m.id === modelId);
      const ctx = model?.contextLength ?? DEFAULT_CONTEXT[value.provider] ?? 128000;
      defaultContextRef.current = ctx;
      setContextChangedHigher(false);
      setContextChangedLower(false);
      const updated = { ...value, modelId, contextLength: ctx };
      onChange(updated);
      if (rememberKey) save(updated);
    }
  };

  const handleCustomModelChange = (text: string) => {
    setCustomModelText(text);
    const updated = { ...value, modelId: text };
    onChange(updated);
    if (rememberKey) save(updated);
  };

  const handleContextChange = (contextLength: number) => {
    setContextChangedHigher(contextLength > defaultContextRef.current);
    setContextChangedLower(contextLength < defaultContextRef.current);
    const updated = { ...value, contextLength };
    onChange(updated);
    if (rememberKey) save(updated);
  };

  const handleRememberChange = (remember: boolean) => {
    setRememberKey(remember);
    if (remember) {
      if (!isAllowed('apiKey')) grantFeatureConsent('apiKey');
      save(value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedModel = models.find((m) => m.id === value.modelId);
  const dropdownValue = isCustom ? 'custom' : value.modelId || '';

  return (
    <div className="card p-4">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between text-left disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Key
            size={15}
            className={value.enabled ? 'text-blue-400 shrink-0' : 'text-slate-400 shrink-0'}
          />
          <span
            className={`text-sm font-medium ${value.enabled ? 'text-white' : 'text-slate-300'}`}
          >
            {t('byoak.toggle')}
          </span>
          {!value.enabled && (
            <span className="text-xs text-slate-500 truncate hidden sm:block">
              {t('byoak.toggleHint')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {value.enabled && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
              {t('byoak.active')}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={15} className="text-slate-400" />
          ) : (
            <ChevronDown size={15} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
          {/* Provider tabs */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">{t('byoak.provider')}</p>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleProviderChange(p.id)}
                  className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition ${
                    value.provider === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">{t('byoak.apiKey')}</p>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={value.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={t('byoak.apiKeyPlaceholder')}
                disabled={disabled}
                autoComplete="off"
                className="flex-1 min-w-0 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? t('byoak.hideKey') : t('byoak.showKey')}
                className="shrink-0 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:text-white transition"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Model selector */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">{t('byoak.model')}</p>

            {modelsStatus === 'idle' && (
              <p className="text-xs text-slate-500 py-1">{t('byoak.modelHint')}</p>
            )}

            {modelsStatus === 'loading' && (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-1.5">
                <Loader2 size={13} className="animate-spin shrink-0" />
                {t('byoak.modelLoading')}
              </div>
            )}

            {modelsStatus === 'error' && (
              <div className="space-y-2">
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertTriangle size={12} className="shrink-0" />
                  {modelsError}
                </p>
                <p className="text-xs text-slate-500">{t('byoak.modelErrorFallback')}</p>
                <input
                  type="text"
                  value={customModelText}
                  onChange={(e) => handleCustomModelChange(e.target.value)}
                  placeholder={t('byoak.customModelPlaceholder')}
                  disabled={disabled}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {modelsStatus === 'loaded' && (
              <div className="space-y-2">
                <select
                  value={dropdownValue}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  disabled={disabled}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {!dropdownValue && <option value="">{t('byoak.selectModel')}</option>}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({Math.round(m.contextLength / 1000)}k{!m.supportsJson ? ' · ⚠' : ''}
                      )
                    </option>
                  ))}
                  <option value="custom">{t('byoak.modelCustom')}</option>
                </select>

                {isCustom && (
                  <input
                    type="text"
                    value={customModelText}
                    onChange={(e) => handleCustomModelChange(e.target.value)}
                    placeholder={t('byoak.customModelPlaceholder')}
                    disabled={disabled}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {selectedModel && !selectedModel.supportsJson && (
                  <p className="text-yellow-400 text-xs flex items-center gap-1">
                    <AlertTriangle size={11} className="shrink-0" />
                    {t('byoak.jsonNotSupported')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Context length — only show once a model is picked */}
          {(modelsStatus === 'loaded' || modelsStatus === 'error') && value.modelId && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2 flex-wrap">
                {t('byoak.contextLength')}
                {contextChangedHigher && (
                  <span className="text-yellow-400 text-xs inline-flex items-center gap-1 flex-wrap">
                    <AlertTriangle size={10} className="shrink-0" />
                    {t('byoak.contextHigherWarning')}
                    <button
                      type="button"
                      onClick={() => handleContextChange(defaultContextRef.current)}
                      className="underline underline-offset-2 hover:text-yellow-300 transition-colors"
                    >
                      {t('byoak.contextReset')}
                    </button>
                  </span>
                )}
                {contextChangedLower && (
                  <span className="text-yellow-400 text-xs inline-flex items-center gap-1 flex-wrap">
                    <AlertTriangle size={10} className="shrink-0" />
                    {t('byoak.contextLowerWarning')}
                    <button
                      type="button"
                      onClick={() => handleContextChange(defaultContextRef.current)}
                      className="underline underline-offset-2 hover:text-yellow-300 transition-colors"
                    >
                      {t('byoak.contextReset')}
                    </button>
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={value.contextLength}
                  onChange={(e) => handleContextChange(Number(e.target.value))}
                  disabled={disabled}
                  min={4096}
                  step={1024}
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 shrink-0">
                  {t('byoak.contextLengthUnit')}
                </span>
              </div>
            </div>
          )}

          {/* Remember key */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(e) => handleRememberChange(e.target.checked)}
                disabled={disabled}
                className="mt-0.5 w-3.5 h-3.5 accent-blue-500"
              />
              <div>
                <span className="text-xs text-slate-400">{t('byoak.rememberKey')}</span>
                {rememberKey && (
                  <p className="text-xs text-slate-500 mt-0.5">{t('byoak.rememberKeyNote')}</p>
                )}
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
