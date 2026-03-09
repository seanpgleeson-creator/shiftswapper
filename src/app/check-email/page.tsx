"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const emailFailed = searchParams.get("email_failed") === "1";
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleResend() {
    setResendMessage(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification-email", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResendMessage({ type: "success", text: "Verification email sent. Check your inbox (and spam folder)." });
      } else {
        setResendMessage({ type: "error", text: data.error ?? "Failed to send. Try again later." });
      }
    } catch {
      setResendMessage({ type: "error", text: "Something went wrong. Try again later." });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-4">Check your email</h1>

      {emailFailed && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          <p className="font-medium">We couldn&apos;t send the verification email.</p>
          <p className="mt-1">
            This can happen if your inbox blocks messages from our sender, or due to a temporary issue. You can try
            &quot;Resend verification email&quot; below, or try again later. Emails are sent from ShiftSwapper
            (onboarding@resend.dev).
          </p>
        </div>
      )}

      {!emailFailed && (
        <p className="text-slate-600 mb-6">
          We sent you a verification link. Click the link in the email to verify your address, then you can verify your
          phone and use the app.
        </p>
      )}

      <p className="text-sm text-slate-500 mb-6">
        If you don&apos;t see the email, check your spam folder. The link expires in 24 hours.
      </p>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="min-h-[44px] rounded-md bg-slate-700 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
        {resendMessage && (
          <p
            className={`mt-2 text-sm ${resendMessage.type === "success" ? "text-green-700" : "text-red-600"}`}
            role="alert"
          >
            {resendMessage.text}
          </p>
        )}
      </div>

      <p className="text-slate-600 text-sm">
        Already verified?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12">
          <p className="text-slate-600">Loading…</p>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
