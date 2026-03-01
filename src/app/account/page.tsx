"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

  const u = session.user as { firstName?: string; lastName?: string; email?: string; position?: string; phone?: string };
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "User";

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
          <dd className="font-medium text-slate-800">{u.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Position</dt>
          <dd className="font-medium text-slate-800">{u.position ?? "—"}</dd>
        </div>
        {u.phone && (
          <div>
            <dt className="text-sm text-slate-500">Phone</dt>
            <dd className="font-medium text-slate-800">{u.phone}</dd>
          </div>
        )}
      </dl>
      <p className="mt-6 text-slate-600 text-sm">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          Back to home
        </Link>
      </p>
    </div>
  );
}
