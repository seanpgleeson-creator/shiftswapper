import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g;

function scrubPii(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  if (event.request?.cookies) event.request.cookies = {};
  if (event.request?.headers?.cookie) delete event.request.headers.cookie;
  if (event.request?.headers?.authorization) delete event.request.headers.authorization;
  if (event.message) {
    event.message = event.message.replace(EMAIL_RE, "[email]").replace(PHONE_RE, "[phone]");
  }
  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  beforeSend: scrubPii,
});
