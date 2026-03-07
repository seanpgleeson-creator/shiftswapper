"use client";

import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-4">Check your email</h1>
      <p className="text-slate-600 mb-6">
        We sent you a verification link. Click the link in the email to verify your address, then you can verify your phone and use the app.
      </p>
      <p className="text-sm text-slate-500 mb-6">
        If you don&apos;t see the email, check your spam folder. The link expires in 24 hours.
      </p>
      <p className="text-slate-600 text-sm">
        Already verified?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
