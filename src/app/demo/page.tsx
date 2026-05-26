"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";

function setTourFlag() {
  try {
    sessionStorage.setItem("demo_tour_active", "true");
  } catch {
    // sessionStorage may be unavailable in some WebViews
  }
}

// LinkedIn / Facebook / Instagram / other social in-app browsers whose
// WKWebView reliably breaks the client-side NextAuth CSRF flow.
const IN_APP_BROWSER_RE =
  /\b(LinkedInApp|FBAN|FBAV|FB_IAB|Instagram|Twitter|Line\/|MicroMessenger)\b/i;

function isInAppBrowser() {
  return (
    typeof navigator !== "undefined" &&
    IN_APP_BROWSER_RE.test(navigator.userAgent)
  );
}

function fallbackToServerAuth() {
  setTourFlag();
  // Use /demo-start (not /api/demo/login) — LinkedIn iOS blocks navigation to
  // any /api/* URL at the policy layer regardless of response Content-Type.
  window.location.href = "/demo-start";
}

export default function DemoPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    notFound();
  }
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // For known in-app browsers, skip session resolution entirely and go
    // straight to the server-side auth page. /demo-start is a plain page path
    // so LinkedIn iOS won't intercept it as it does with /api/* routes.
    if (isInAppBrowser()) {
      fallbackToServerAuth();
      return;
    }

    if (status === "authenticated") {
      setTourFlag();
      router.replace("/calendar");
      return;
    }

    if (status === "unauthenticated") {
      signIn("credentials", {
        email: "demo@shiftswapper.app",
        password: "demo1234",
        redirect: false,
      })
        .then((result) => {
          if (result?.ok) {
            setTourFlag();
            router.replace("/calendar");
          } else {
            // Client-side signIn failed (likely WebView cookie/CSRF issue).
            // Fall back to server-side auth which sets the cookie via HTTP
            // response headers, bypassing fetch-based cookie restrictions.
            fallbackToServerAuth();
          }
        })
        .catch(() => {
          // fetch itself failed (strict WebView restrictions)
          fallbackToServerAuth();
        });
    }
  }, [status, router]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-slate-500 text-sm">Loading demo…</p>
    </div>
  );
}
