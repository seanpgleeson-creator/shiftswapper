"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function RootError({
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
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-slate-800 mb-3">Something went wrong</h2>
      <p className="text-sm text-slate-600 mb-6">
        An unexpected error occurred. Please try again or go back to the home page.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="min-h-[44px] rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
