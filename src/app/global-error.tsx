"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Something went wrong</h2>
          <p className="text-sm text-slate-600 mb-6">
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
