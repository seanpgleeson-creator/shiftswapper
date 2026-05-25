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

function fallbackToServerAuth() {
  setTourFlag();
  window.location.href = "/api/demo/login";
}

export default function DemoPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    notFound();
  }
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
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
