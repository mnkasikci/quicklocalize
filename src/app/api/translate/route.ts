import * as Sentry from '@sentry/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { breakdown, runBatches, combine } from '@/lib/translate';
import type { LanguageModel } from 'ai';

export const runtime = 'edge';

interface BYOAKPayload {
  provider: 'openai' | 'anthropic' | 'groq';
  apiKey: string;
  modelId: string;
  contextLength: number;
}

interface TranslateRequest {
  file: Record<string, any>;
  context: string;
  targetLanguage: string;
  fileFormat: 'json';
  byoak?: BYOAKPayload;
}

function resolveModel(byoak?: BYOAKPayload): LanguageModel {
  if (byoak?.apiKey && byoak?.modelId) {
    switch (byoak.provider) {
      case 'openai':     return createOpenAI({ apiKey: byoak.apiKey })(byoak.modelId);
      case 'anthropic':  return createAnthropic({ apiKey: byoak.apiKey })(byoak.modelId);
      case 'groq':       return createGroq({ apiKey: byoak.apiKey })(byoak.modelId);
    }
  }
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('Missing AI configuration env vars');
  return createGroq({ apiKey: groqApiKey })('llama-3.3-70b-versatile');
}

export function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = (data: object) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      const body: TranslateRequest = await request.json();
      const { file, context, targetLanguage, fileFormat, byoak } = body;

      if (!file || !context || !targetLanguage) {
        send({ type: 'error', error: 'Missing required fields', status: 400 });
        return;
      }

      let model: LanguageModel;
      try {
        model = resolveModel(byoak);
      } catch (e) {
        send({ type: 'error', error: String(e), status: 500 });
        return;
      }

      const systemPrompt = `You are a professional localization expert. Translate the JSON values to ${targetLanguage}.

App context: ${context}

Rules:
- Return ONLY a valid JSON object — no explanation, no markdown, no code fences
- Preserve all keys exactly as-is
- Only translate string values
- Maintain the exact same nested structure`;

      const batches = breakdown(file);
      send({ type: 'start', total: batches.length });

      const results = await runBatches(
        batches,
        model,
        systemPrompt,
        targetLanguage,
        (completed, total) => {
          send({ type: 'progress', completed, total });
        }
      );

      const translated = combine(results);
      send({
        type: 'complete',
        translated,
        targetLanguage,
        format: fileFormat,
      });
    } catch (error) {
      Sentry.captureException(error);
      send({ type: 'error', error: String(error) });
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
