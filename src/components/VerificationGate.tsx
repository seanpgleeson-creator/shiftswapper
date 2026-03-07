"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const ALLOWED_PATHS = ["/login", "/signup", "/check-email", "/verify-phone"];

function isAllowed(path: string) {
  return ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + "?"));
}

export function VerificationGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ email_verified?: boolean; phone_verified?: boolean } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setMe(null);
      setChecking(false);
      return;
    }
    if (isAllowed(pathname ?? "")) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, pathname]);

  useEffect(() => {
    if (checking || !me || isAllowed(pathname ?? "")) return;
    if (me.email_verified === false) {
      router.replace("/check-email");
      return;
    }
    if (me.phone_verified === false) {
      router.replace("/verify-phone");
    }
  }, [me, checking, pathname, router]);

  const path = pathname ?? "";
  const needCheck = status === "authenticated" && !isAllowed(path);
  if (needCheck && checking) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
