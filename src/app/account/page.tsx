"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Me = {
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  phone?: string | null;
  sms_consent?: boolean;
  phone_verified?: boolean;
};


export default function AccountPage() {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setMe(null);
      setLoadingMe(false);
      return;
    }
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setMe(data);
      })
      .finally(() => setLoadingMe(false));
  }, [status, codeSuccess]);
  useEffect(() => {
    if (me?.phone) setPhoneInput(me.phone);
    else setPhoneInput("");
  }, [me?.phone]);

  async function handleSmsConsentChange(checked: boolean) {
    setSmsError(null);
    setSmsSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sms_consent: checked }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSmsError(data.error ?? "Failed to update.");
        return;
      }
      setMe((prev) => (prev ? { ...prev, sms_consent: data.sms_consent } : null));
    } catch {
      setSmsError("Something went wrong.");
    } finally {
      setSmsSaving(false);
    }
  }

  async function handleSendCode() {
    setCodeError(null);
    setCodeSending(true);
    try {
      const res = await fetch("/api/auth/send-phone-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setCodeError(data.error ?? "Failed to send code.");
    } catch {
      setCodeError("Something went wrong.");
    } finally {
      setCodeSending(false);
    }
  }

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phoneInput.trim();
    if (trimmed.length < 10 || !/^[\d\s\-+()]{10,}$/.test(trimmed)) {
      setPhoneError("Enter a valid phone number (at least 10 digits).");
      return;
    }
    setPhoneError(null);
    setPhoneSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error ?? data.fields?.phone?.[0] ?? "Failed to update phone.");
        return;
      }
      setMe((prev) => (prev ? { ...prev, phone: data.phone, phone_verified: data.phone_verified } : null));
    } catch {
      setPhoneError("Something went wrong.");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) return;
    setCodeError(null);
    setCodeVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error ?? "Verification failed.");
        return;
      }
      setCodeSuccess(true);
      setMe((prev) => (prev ? { ...prev, phone_verified: true } : null));
      setCode("");
    } catch {
      setCodeError("Something went wrong.");
    } finally {
      setCodeVerifying(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to update password.");
        return;
      }
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (status === "loading" || loadingMe) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <p className="text-slate-600 mb-4">You are not signed in.</p>
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Log in
        </Link>
      </div>
    );
  }

  const name = [me?.first_name, me?.last_name].filter(Boolean).join(" ").trim() || "User";
  const hasPhone = (me?.phone ?? "").trim().length >= 10;
  const needsVerification = hasPhone && me?.sms_consent && !me?.phone_verified;

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Account</h1>
      <dl className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <dt className="text-sm text-slate-500">Name</dt>
          <dd className="font-medium text-slate-800">{name}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Email</dt>
          <dd className="font-medium text-slate-800">{me?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Position</dt>
          <dd className="font-medium text-slate-800">{me?.position ?? "—"}</dd>
        </div>
        {(me?.phone || !hasPhone) && (
          <div>
            <dt className="text-sm text-slate-500">Phone</dt>
            {hasPhone ? (
              <dd className="font-medium text-slate-800">{me?.phone}</dd>
            ) : (
              <dd>
                <form onSubmit={handleSavePhone} className="flex flex-wrap items-end gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Add phone number"
                    className="flex-1 min-w-[140px] rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={phoneSaving}
                    className="min-h-[44px] rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {phoneSaving ? "Saving…" : "Add phone"}
                  </button>
                </form>
                {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
              </dd>
            )}
          </div>
        )}
      </dl>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-800 mb-2">SMS notifications</h2>
        <p className="text-sm text-slate-600 mb-4">
          Receive a text when someone covers your shift. By providing your phone number, you consent to receive SMS notifications from ShiftSwap. Message &amp; data rates may apply. Reply STOP to unsubscribe. You can change this anytime in Account.
        </p>
        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            checked={me?.sms_consent ?? false}
            onChange={(e) => handleSmsConsentChange(e.target.checked)}
            disabled={smsSaving}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
          <span className="text-sm text-slate-700">Receive SMS when my shift is covered</span>
        </label>
        {smsError && <p className="mt-2 text-sm text-red-600">{smsError}</p>}
        {hasPhone && me?.sms_consent && me?.phone_verified && (
          <p className="mt-2 text-sm text-green-700">Phone verified. You&apos;ll receive SMS when your shift is covered.</p>
        )}
        {needsVerification && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Verify your phone to start receiving SMS.</p>
            <form onSubmit={handleVerifyCode} className="flex flex-wrap items-end gap-2">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 text-center tracking-widest w-28"
                />
              </div>
              <button
                type="submit"
                disabled={codeVerifying || code.length !== 6}
                className="min-h-[44px] rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {codeVerifying ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={codeSending}
                className="min-h-[44px] rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {codeSending ? "Sending…" : "Send code"}
              </button>
            </form>
            {codeError && <p className="mt-2 text-sm text-red-600">{codeError}</p>}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Change password</h2>
        {passwordSuccess && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
            Password updated successfully.
          </div>
        )}
        {passwordError && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 text-sm">
            {passwordError}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 mb-1">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
              autoComplete="current-password"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
              autoComplete="new-password"
              minLength={8}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              autoComplete="new-password"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
          >
            {passwordSaving ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <p className="mt-6 text-slate-600 text-sm">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          Back to home
        </Link>
      </p>
    </div>
  );
}
