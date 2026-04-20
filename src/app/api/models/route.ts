import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  supportsJson: boolean;
}

// OpenAI doesn't return context windows in their API response — use a lookup table
const OPENAI_CONTEXT: Record<string, number> = {
  'chatgpt-4o-latest': 128000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4-turbo-preview': 128000,
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-3.5-turbo': 16385,
  'gpt-3.5-turbo-16k': 16385,
  'o1': 200000,
  'o1-mini': 128000,
  'o1-preview': 128000,
  'o3': 200000,
  'o3-mini': 200000,
  'o4-mini': 200000,
};

// o1-series models don't reliably support JSON/structured output mode
const OPENAI_NO_JSON = new Set(['o1', 'o1-mini', 'o1-preview']);

function isOpenAIChatModel(id: string): boolean {
  const l = id.toLowerCase();
  if (
    l.includes('embedding') || l.includes('whisper') || l.includes('tts') ||
    l.includes('dall-e') || l.includes('moderation') || l.includes('realtime') ||
    l.includes('babbage') || l.includes('davinci') || l.includes('curie') ||
    l.includes('audio') || l.endsWith('-instruct')
  ) return false;
  return (
    l.startsWith('gpt-') || l.startsWith('o1') || l.startsWith('o3') ||
    l.startsWith('o4') || l.startsWith('chatgpt-')
  );
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }
  const data = await res.json() as { data: { id: string }[] };
  return data.data
    .filter(m => isOpenAIChatModel(m.id))
    .map(m => ({
      id: m.id,
      name: m.id,
      contextLength: OPENAI_CONTEXT[m.id] ?? 128000,
      supportsJson: !OPENAI_NO_JSON.has(m.id),
    }))
    .sort((a, b) => b.contextLength - a.contextLength || a.id.localeCompare(b.id));
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json() as { data: { id: string; display_name?: string; max_input_tokens?: number; capabilities?: { structured_outputs?: { supported?: boolean } } }[] };
  return data.data
    .map(m => ({
      id: m.id,
      name: m.display_name ?? m.id,
      contextLength: m.max_input_tokens ?? 200000,
      supportsJson: m.capabilities?.structured_outputs?.supported ?? true,
    }))
    .sort((a, b) => b.contextLength - a.contextLength || a.name.localeCompare(b.name));
}

async function fetchGroqModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
  }
  const data = await res.json() as { data: { id: string; active?: boolean; context_window?: number }[] };
  return data.data
    .filter(m => m.active !== false && !m.id.toLowerCase().includes('whisper'))
    .map(m => ({
      id: m.id,
      name: m.id,
      contextLength: m.context_window ?? 128000,
      supportsJson: true,
    }))
    .sort((a, b) => b.contextLength - a.contextLength || a.id.localeCompare(b.id));
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json() as { provider: string; apiKey: string };

    if (!provider || !apiKey) {
      return Response.json({ error: 'Missing provider or apiKey' }, { status: 400 });
    }

    let models: ModelInfo[];
    switch (provider) {
      case 'openai':     models = await fetchOpenAIModels(apiKey); break;
      case 'anthropic':  models = await fetchAnthropicModels(apiKey); break;
      case 'groq':       models = await fetchGroqModels(apiKey); break;
      default: return Response.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return Response.json({ models });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
