"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorIcon } from "@/components/ErrorIcon";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") ?? "";
  const methodParam = searchParams.get("method") ?? "email";
  const tokenParam = searchParams.get("token") ?? "";

  const isSms = methodParam === "sms";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // For email flow, token comes from URL; for SMS flow, user enters a code
  useEffect(() => {
    if (!isSms && !tokenParam) {
      setError("This reset link is invalid or has expired. Please request a new one.");
    }
  }, [isSms, tokenParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (isSms && code.trim().length !== 6) {
      setError("Enter the 6-digit code sent to your phone.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        email: emailParam,
        password,
      };
      if (isSms) {
        body.code = code.trim();
      } else {
        body.token = tokenParam;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-4 text-green-800 text-sm">
          <p className="font-medium mb-1">Password updated</p>
          <p>Your password has been reset successfully. Redirecting you to log in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Set a new password</h1>
      <p className="text-slate-600 text-sm mb-6">
        {isSms
          ? "Enter the 6-digit code sent to your phone and choose a new password."
          : "Choose a new password for your account."}
      </p>

      {error && (
        <div
          className="mb-6 flex gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm"
          role="alert"
        >
          <ErrorIcon className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSms && (
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
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || (isSms && code.length !== 6)}
          className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-slate-600">
          <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
            Request a new code
          </Link>
        </p>
        <p className="text-slate-600">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12">
          <p className="text-slate-600">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
