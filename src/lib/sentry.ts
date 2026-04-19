import * as Sentry from '@sentry/cloudflare';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? '';

export function withSentryHandler(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  return Sentry.wrapRequestHandler(
    {
      options: { dsn: DSN, sendDefaultPii: true },
      request: request as Parameters<typeof Sentry.wrapRequestHandler>[0]['request'],
      context: undefined,
    },
    handler
  );
}
