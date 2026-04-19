import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { createAiGateway } from 'ai-gateway-provider';
import { createUnified } from 'ai-gateway-provider/providers/unified';
import { generateText } from 'ai';

export const runtime = 'edge';

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

    const accountId = process.env.CF_ACCOUNT_ID;
    const aigToken = process.env.CF_AIG_TOKEN;
    const gatewayId = process.env.CF_AI_GATEWAY_ID;
    const mask = (value:string) => {
      const firstthree = value.slice(0, 3);
      const lastthree = value.slice(-3);
      return `${firstthree}***${lastthree}`;
    }
    if (!accountId || !aigToken || !gatewayId) {
      let errormessage = 'Missing AI configuration env vars';
      if (!accountId) errormessage += `\nCF_ACCOUNT_ID: ${mask(accountId ?? '')}`;
      if (!aigToken) errormessage += `\nCF_AIG_TOKEN: ${mask(aigToken ?? '')}`;
      if (!gatewayId) errormessage += `\nCF_AI_GATEWAY_ID: ${mask(gatewayId ?? '')}`;
      return NextResponse.json({ error: errormessage }, { status: 500 });
    }

    const aigateway = createAiGateway({
      accountId,
      gateway: gatewayId,
      apiKey: aigToken,
    });
    const unified = createUnified();

    const { text } = await generateText({
      model: aigateway(unified('workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast')),
      system: `You are a professional localization expert. Translate the JSON values to ${targetLanguage}.

App context: ${context}

Rules:
- Return ONLY a valid JSON object — no explanation, no markdown, no code fences
- Preserve all keys exactly as-is
- Only translate string values
- Maintain the exact same nested structure`,
      prompt: `Translate this JSON to ${targetLanguage}:\n${JSON.stringify(file, null, 2)}`,
    });

    let translated: Record<string, any>;
    try {
      translated = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? text.match(/(\{[\s\S]+\})/);
      if (!match) throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
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
