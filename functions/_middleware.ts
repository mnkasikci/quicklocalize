import * as Sentry from '@sentry/cloudflare';

export const onRequest = [
  Sentry.sentryPagesPlugin((context) => ({
    dsn: 'https://712afc836ecba7cb23727226bedeab0c@o4511246169997312.ingest.de.sentry.io/4511246173864016',
    sendDefaultPii: true,
  })),
];
