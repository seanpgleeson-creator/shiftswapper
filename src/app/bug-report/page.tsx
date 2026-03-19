"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

const CATEGORIES = [
  { value: "", label: "Select one (optional)" },
  { value: "posting", label: "Posting a shift" },
  { value: "calendar", label: "Browsing the calendar" },
  { value: "account_sms", label: "Account / SMS settings" },
  { value: "other", label: "Other" },
];

export default function BugReportPage() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          category: category || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      Sentry.addBreadcrumb({
        category: "bug-report",
        message: description.trim().slice(0, 200),
        level: "info",
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Thanks for your report!</h2>
          <p className="text-sm text-green-700">
            We&apos;ve received your bug report and will look into it.
          </p>
        </div>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Report a Bug</h1>
      <p className="text-sm text-slate-600 mb-6">
        Found something that doesn&apos;t look right? Let us know and we&apos;ll fix it.
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            What were you doing?
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Describe the issue <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What happened? What did you expect to happen?"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">At least 10 characters.</p>
        </div>

        <button
          type="submit"
          disabled={submitting || description.trim().length < 10}
          className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Sending..." : "Submit Report"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          Back to home
        </Link>
      </p>
    </div>
  );
}
