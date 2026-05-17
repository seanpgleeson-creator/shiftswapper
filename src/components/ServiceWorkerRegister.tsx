"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

interface Props {
  children: React.ReactNode;
}

/**
 * Provides Serwist context and auto-registers the service worker.
 * The SW is compiled and served by the route handler at /serwist/sw.js.
 * Wraps the app in layout.tsx so all pages have access.
 */
export function ServiceWorkerProvider({ children }: Props) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      register
      reloadOnOnline
      cacheOnNavigation
    >
      {children}
    </SerwistProvider>
  );
}
