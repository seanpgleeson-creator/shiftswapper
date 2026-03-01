"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 text-red-600 ${className ?? ""}`} aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

const LOCATIONS_STORAGE_KEY = "shiftswapper_last_location";
const ROLE_STORAGE_KEY = "shiftswapper_last_role";

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type FieldErrors = Record<string, string | undefined>;

export default function PostPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [locations, setLocations] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ date: string; location: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    poster_name: "",
    shift_date: tomorrowISO(),
    start_time: "07:00",
    end_time: "15:00",
    location: "",
    role: "",
    poster_email: "",
    poster_phone: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
    ])
      .then(([locRes, roleRes]) => {
        setLocations(locRes.locations ?? []);
        setRoles(roleRes.roles ?? []);
        const lastLoc = typeof window !== "undefined" ? localStorage.getItem(LOCATIONS_STORAGE_KEY) : null;
        const lastRole = typeof window !== "undefined" ? localStorage.getItem(ROLE_STORAGE_KEY) : null;
        setForm((prev) => ({
          ...prev,
          location: lastLoc && locRes.locations?.includes(lastLoc) ? lastLoc : locRes.locations?.[0] ?? "",
          role: lastRole && roleRes.roles?.includes(lastRole) ? lastRole : roleRes.roles?.[0] ?? "",
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  function validateField(name: string, value: string): string | null {
    switch (name) {
      case "poster_name":
        return value.trim() ? null : "Name is required";
      case "poster_email": {
        const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value ? (email.test(value) ? null : "Invalid email") : "Email is required";
      }
      case "shift_date":
        return value ? null : "Date is required";
      case "start_time":
      case "end_time":
        return /^([01]?\d|2[0-3]):[0-5]\d$/.test(value) ? null : "Use HH:MM";
      case "location":
        return value ? null : "Select a location";
      case "role":
        return value ? null : "Select a role";
      case "poster_phone":
        return value ? (/^[\d\s\-+()]{10,}$/.test(value) ? null : "Invalid phone format") : null;
      default:
        return null;
    }
  }

  function validateEndAfterStart(): boolean {
    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    return sh * 60 + sm < eh * 60 + em;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => (err ? { ...prev, [name]: err } : { ...prev, [name]: undefined }));
  }

  const endTimeError = form.start_time && form.end_time && !validateEndAfterStart() ? "End time must be after start time" : null;
  const isAuthenticated = !!session?.user;
  const allValid = isAuthenticated
    ? form.shift_date && form.location && validateEndAfterStart() && !errors.shift_date && !errors.start_time && !errors.end_time && !errors.location
    : form.poster_name.trim() &&
      form.poster_email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.poster_email) &&
      form.shift_date &&
      form.location &&
      form.role &&
      validateEndAfterStart() &&
      !Object.values(errors).some(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid || submitting) return;
    setSubmitting(true);
    setToast(null);
    try {
      const body = isAuthenticated
        ? {
            shift_date: form.shift_date,
            start_time: form.start_time,
            end_time: form.end_time,
            location: form.location,
          }
        : {
            poster_name: form.poster_name.trim(),
            poster_email: form.poster_email.trim(),
            poster_phone: form.poster_phone.trim() || undefined,
            location: form.location,
            role: form.role,
            shift_date: form.shift_date,
            start_time: form.start_time,
            end_time: form.end_time,
          };
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCATIONS_STORAGE_KEY, form.location);
        localStorage.setItem(ROLE_STORAGE_KEY, form.role);
      }
      setSuccess({ date: form.shift_date, location: form.location });
    } catch {
      setToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Shift posted</h2>
          <p className="text-slate-600 mb-6">
            Your shift on {success.date} at {success.location} has been posted. You&apos;ll be notified by email when someone picks it up.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/post" className="inline-flex items-center min-h-[44px] text-blue-600 hover:text-blue-800 font-medium" onClick={() => setSuccess(null)}>
              Post Another
            </Link>
            <Link href="/calendar" className="inline-flex items-center min-h-[44px] text-blue-600 hover:text-blue-800 font-medium">
              Browse Shifts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Post a Shift</h1>

      {toast && (
        <div className="mb-6 flex gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm" role="alert">
          <ErrorIcon className="flex-shrink-0 mt-0.5" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isAuthenticated && (
          <div>
            <label htmlFor="poster_name" className="block text-sm font-medium text-slate-700 mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="poster_name"
              name="poster_name"
              type="text"
              value={form.poster_name}
              onChange={(e) => setForm((p) => ({ ...p, poster_name: e.target.value }))}
              onBlur={handleBlur}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.poster_name ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.poster_name && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.poster_name}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shift_date" className="block text-sm font-medium text-slate-700 mb-1">
              Shift Date <span className="text-red-500">*</span>
            </label>
            <input
              id="shift_date"
              name="shift_date"
              type="date"
              value={form.shift_date}
              onChange={(e) => setForm((p) => ({ ...p, shift_date: e.target.value }))}
              onBlur={handleBlur}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.shift_date ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.shift_date && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.shift_date}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-slate-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
              onBlur={handleBlur}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.start_time ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.start_time && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.start_time}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-slate-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
              onBlur={handleBlur}
              className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                errors.end_time || endTimeError ? "border-red-500" : "border-slate-300"
              }`}
            />
            {(errors.end_time || endTimeError) && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                <ErrorIcon className="flex-shrink-0 mt-0.5" />
                {errors.end_time || endTimeError}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <select
            id="location"
            name="location"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            onBlur={handleBlur}
            className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
              errors.location ? "border-red-500" : "border-slate-300"
            }`}
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          {errors.location && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
              <ErrorIcon className="flex-shrink-0 mt-0.5" />
              {errors.location}
            </p>
          )}
        </div>

        {!isAuthenticated && (
          <>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                Title / Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                onBlur={handleBlur}
                className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? "border-red-500" : "border-slate-300"
                }`}
              >
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                  <ErrorIcon className="flex-shrink-0 mt-0.5" />
                  {errors.role}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="poster_email" className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="poster_email"
                name="poster_email"
                type="email"
                value={form.poster_email}
                onChange={(e) => setForm((p) => ({ ...p, poster_email: e.target.value }))}
                onBlur={handleBlur}
                className={`block w-full rounded-md border px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  errors.poster_email ? "border-red-500" : "border-slate-300"
                }`}
              />
              {errors.poster_email && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                  <ErrorIcon className="flex-shrink-0 mt-0.5" />
                  {errors.poster_email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="poster_phone" className="block text-sm font-medium text-slate-500 mb-1">
                Mobile Phone <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="poster_phone"
                name="poster_phone"
                type="tel"
                value={form.poster_phone}
                onChange={(e) => setForm((p) => ({ ...p, poster_phone: e.target.value }))}
                onBlur={handleBlur}
                placeholder="For future text notifications"
                className={`block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500`}
              />
              <p className="mt-1 text-xs text-slate-500">Optional — we&apos;ll add text notifications soon.</p>
              {errors.poster_phone && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600">
                  <ErrorIcon className="flex-shrink-0 mt-0.5" />
                  {errors.poster_phone}
                </p>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!allValid || submitting}
          className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Posting…" : "Post Shift"}
        </button>
      </form>
    </div>
  );
}
