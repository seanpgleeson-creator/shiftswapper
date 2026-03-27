"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorIcon } from "@/components/ErrorIcon";

type Method = "sms" | "email";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<Method>("email");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(
        `/reset-password?email=${encodeURIComponent(email.trim())}&method=${method}`
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Forgot password</h1>
      <p className="text-slate-600 text-sm mb-6">
        Enter your email address and choose how you&apos;d like to receive your reset code.
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 mb-2">
            How would you like to receive your reset code?
          </legend>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input
                type="radio"
                name="method"
                value="email"
                checked={method === "email"}
                onChange={() => setMethod("email")}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <span className="block text-sm font-medium text-slate-800">Email link</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  We&apos;ll send a reset link to your email address.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input
                type="radio"
                name="method"
                value="sms"
                checked={method === "sms"}
                onChange={() => setMethod("sms")}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <span className="block text-sm font-medium text-slate-800">Text message (SMS)</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  We&apos;ll send a 6-digit code to your verified phone number.
                </span>
              </div>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-600 text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
