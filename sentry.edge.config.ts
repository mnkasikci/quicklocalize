import * as Sentry from "@sentry/cloudflare";

export const onRequest = [
  Sentry.sentryPagesPlugin((context) => ({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  })),
  // Add more middlewares here
];
