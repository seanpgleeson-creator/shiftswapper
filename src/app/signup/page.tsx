"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ErrorIcon } from "@/components/ErrorIcon";

type FieldErrors = Record<string, string | undefined>;

export default function SignupPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    phone: "",
    password: "",
    sms_consent: false,
  });

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((data) => {
        setRoles(data.roles ?? []);
        if (data.roles?.length) setForm((p) => ({ ...p, position: data.roles[0] }));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          position: form.position,
          phone: form.phone.trim() || undefined,
          password: form.password,
          sms_consent: form.sms_consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields?.length) {
          const next: FieldErrors = {};
          data.fields.forEach((f: { field: string; message: string }) => {
            next[f.field] = f.message;
          });
          setErrors(next);
        }
        setToast(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const signInResult = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });
      if (signInResult?.ok) {
        const emailFailed = data.verification_email_sent === false;
        router.push(emailFailed ? "/check-email?email_failed=1" : "/check-email");
        router.refresh();
        return;
      }
      router.push("/login?signup=1");
      router.refresh();
    } catch {
      setToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Create an account</h1>
      {toast && (
        <div className="mb-6 flex gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm" role="alert">
          <ErrorIcon className="flex-shrink-0 mt-0.5" />
          <span>{toast}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-1">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              value={form.first_name}
              onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.first_name ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.first_name && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.first_name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-1">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              type="text"
              value={form.last_name}
              onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.last_name ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.last_name && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.last_name}
              </p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
              errors.email ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.email && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
              <ErrorIcon className="flex-shrink-0 mt-0.5" />
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">
            Position <span className="text-red-500">*</span>
          </label>
          <select
            id="position"
            value={form.position}
            onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
              errors.position ? "border-red-500" : "border-slate-300"
            }`}
          >
            <option value="">Select position</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.position && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
              <ErrorIcon className="flex-shrink-0 mt-0.5" />
              {errors.position}
            </p>
          )}
        </div>
        <div>
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              id="sms_consent"
              checked={form.sms_consent}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((p) => ({ ...p, sms_consent: checked, ...(!checked && { phone: "" }) }));
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Get text when your shift is covered? By providing your phone number, you consent to receive SMS notifications from ShiftSwap. Message &amp; data rates may apply. Reply STOP to opt out.
            </span>
          </label>
          {errors.sms_consent && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
              <ErrorIcon className="flex-shrink-0 mt-0.5" />
              {errors.sms_consent}
            </p>
          )}
        </div>
        {form.sms_consent && (
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Required for SMS"
            />
            {errors.phone && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.phone}
              </p>
            )}
          </div>
        )}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
              errors.password ? "border-red-500" : "border-slate-300"
            }`}
            minLength={8}
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          {errors.password && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600" role="alert">
              <ErrorIcon className="flex-shrink-0 mt-0.5" />
              {errors.password}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={
            submitting ||
            !form.first_name.trim() ||
            !form.last_name.trim() ||
            !form.email.trim() ||
            !form.position ||
            form.password.length < 8 ||
            (form.sms_consent && (form.phone.trim().length < 10 || !/^[\d\s\-+()]{10,}$/.test(form.phone.trim())))
          }
          className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-slate-600 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
