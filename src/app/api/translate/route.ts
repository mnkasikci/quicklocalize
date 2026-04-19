import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CF_AI_MODEL = '@cf/meta/llama-3-8b-instruct';

interface TranslateRequest {
  file: Record<string, any>;
  context: string;
  targetLanguage: string;
  fileFormat: 'json' | 'yaml';
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { file, context, targetLanguage, fileFormat } = body;

    if (!file || !context || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiToken = process.env.CF_AI_TOKEN;
    const accountId = process.env.CF_ACCOUNT_ID;
    if (!apiToken || !accountId) {
      return NextResponse.json({ error: 'CF_AI_TOKEN or CF_ACCOUNT_ID not configured' }, { status: 500 });
    }

    const fileContent = JSON.stringify(file, null, 2);

    const messages = [
      {
        role: 'system',
        content: `You are a professional localization expert. Translate the JSON values to ${targetLanguage}.

App context: ${context}

Rules:
- Return ONLY a valid JSON object — no explanation, no markdown, no code fences
- Preserve all keys exactly as-is
- Only translate string values
- Maintain the exact same nested structure`,
      },
      {
        role: 'user',
        content: `Translate this JSON to ${targetLanguage}:\n${fileContent}`,
      },
    ];

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_AI_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`CF AI error ${response.status}: ${err}`);
    }

    const aiResult = await response.json();
    const rawText: string = aiResult.result?.response ?? '';

    let translated: Record<string, any>;
    try {
      translated = JSON.parse(rawText);
    } catch {
      // Strip markdown code fences if present, then retry
      const match =
        rawText.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? rawText.match(/(\{[\s\S]+\})/);
      if (!match) throw new Error(`AI returned non-JSON response: ${rawText.slice(0, 200)}`);
      translated = JSON.parse(match[1] ?? '{}');
    }

    return NextResponse.json({
      success: true,
      originalLanguage: 'auto-detected',
      targetLanguage,
      translated,
      format: fileFormat,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Translation failed', details: String(error) }, { status: 500 });
  }
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
