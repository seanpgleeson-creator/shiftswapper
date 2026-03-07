"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 text-red-600 ${className ?? ""}`} aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const emailVerifiedParam = searchParams.get("email_verified");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/verify-phone");
      return;
    }
  }, [status, router]);

  async function handleSendCode() {
    if (status !== "authenticated") return;
    setError(null);
    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-phone-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code.");
        return;
      }
      setCodeSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim() || code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      router.push("/calendar");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Verify your phone</h1>
      {emailVerifiedParam === "1" && (
        <p className="text-green-700 text-sm mb-4">Email verified. Now enter the code we sent to your phone.</p>
      )}
      <p className="text-slate-600 mb-6">
        We sent a 6-digit code to your phone. Enter it below.
      </p>
      {error && (
        <div className="mb-6 flex gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm" role="alert">
          <ErrorIcon className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
            6-digit code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 text-center text-lg tracking-widest shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Verifying…" : "Verify"}
        </button>
      </form>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleSendCode}
          disabled={sendingCode}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
        >
          {sendingCode ? "Sending…" : codeSent ? "Resend code" : "Send code"}
        </button>
      </div>
      <p className="mt-6 text-center text-slate-600 text-sm">
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    }>
      <VerifyPhoneContent />
    </Suspense>
  );
}
