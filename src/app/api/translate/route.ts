import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format file content for translation
    const fileContent = JSON.stringify(file, null, 2);

    // Build the prompt with context
    const systemPrompt = `You are a professional localization expert. Your task is to translate app localization files while maintaining the original structure and respecting the app's context and tone.

Context about the app:
${context}

Instructions:
1. Preserve the exact structure of the input file (JSON keys, nesting, arrays)
2. Only translate the text values, never the keys
3. Maintain the tone and style appropriate for the described app context
4. Keep terminology consistent with the app's purpose
5. Return ONLY valid JSON/YAML with no additional text or explanation`;

    const userPrompt = `Please translate this ${fileFormat.toUpperCase()} localization file to ${targetLanguage}. Return only the translated file in valid ${fileFormat.toUpperCase()} format:

${fileContent}`;

    // Mock LLM service — replace with real AI call (e.g. Cloudflare Workers AI) when ready
    function mockTranslate(obj: Record<string, any>): Record<string, any> {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
          if (typeof v === 'string') return [k, 'sample-translation'];
          if (v && typeof v === 'object' && !Array.isArray(v)) return [k, mockTranslate(v)];
          if (Array.isArray(v)) return [k, v.map(item => (typeof item === 'string' ? 'sample-translation' : item))];
          return [k, v];
        })
      );
    }

    const translatedContent = mockTranslate(file);

    return NextResponse.json({
      success: true,
      originalLanguage: 'auto-detected',
      targetLanguage,
      translated: translatedContent,
      format: fileFormat,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
