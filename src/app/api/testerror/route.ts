import * as Sentry from '@sentry/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { withSentryHandler } from '@/lib/sentry';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  return withSentryHandler(request, async () => {
    Sentry.captureException(new Error('Sentry test error from /api/testerror'));
    return NextResponse.json({ triggered: true });
  });
}
