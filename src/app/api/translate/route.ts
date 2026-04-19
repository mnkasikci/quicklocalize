import * as Sentry from '@sentry/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { createAiGateway } from 'ai-gateway-provider';
import { createUnified } from 'ai-gateway-provider/providers/unified';
import { breakdown, runBatches, combine } from '@/lib/translate';
import { withSentryHandler } from '@/lib/sentry';

export const runtime = 'edge';

interface TranslateRequest {
  file: Record<string, any>;
  context: string;
  targetLanguage: string;
  fileFormat: 'json' | 'yaml';
}

export function POST(request: NextRequest) {
  let stepsCompleted = "";
  const allBatches: Array<Record<string, any>> = [];
  return withSentryHandler(request, async () => { try {
    const body: TranslateRequest = await request.json();
    const { file, context, targetLanguage, fileFormat } = body;

    if (!file || !context || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accountId = process.env.CF_ACCOUNT_ID;
    const aigToken = process.env.CF_AIG_TOKEN;
    const gatewayId = process.env.CF_AI_GATEWAY_ID;
    if (!accountId || !aigToken || !gatewayId) {
      return NextResponse.json({ error: 'Missing AI configuration env vars' }, { status: 500 });
    }

    const aigateway = createAiGateway({ accountId, gateway: gatewayId, apiKey: aigToken });
    const model = aigateway(createUnified()('workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast'));

    const systemPrompt = `You are a professional localization expert. Translate the JSON values to ${targetLanguage}.

App context: ${context}

Rules:
- Return ONLY a valid JSON object — no explanation, no markdown, no code fences
- Preserve all keys exactly as-is
- Only translate string values
- Maintain the exact same nested structure`;
    const batches = breakdown(file);
    allBatches.push(...batches);
    stepsCompleted += `Breakdown: ${batches.length} batches`;
    const results = await runBatches(batches, model, systemPrompt, targetLanguage);
    stepsCompleted += `Run batches: ${results.length} results`;
    const translated = combine(results);
    stepsCompleted += `Combine: ${translated.length} keys`;
    return NextResponse.json({
      success: true,
      originalLanguage: 'auto-detected',
      targetLanguage,
      translated,
      format: fileFormat,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Translation failed. ' + stepsCompleted,"batches": JSON.stringify(allBatches), details: String(error) }, { status: 500 });
  }
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
