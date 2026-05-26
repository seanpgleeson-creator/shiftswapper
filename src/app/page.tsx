"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { status } = useSession();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
      <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800 mb-4 leading-tight">
        Need a shift covered?<br className="hidden sm:block" /> Post it. Looking for hours? Browse open shifts.
      </h1>
      <p className="text-slate-500 text-base sm:text-lg mb-10">
        ShiftSwap makes it easy for pharmacy staff to swap shifts — no group texts, no spreadsheets.
      </p>

      <div
        className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-opacity duration-150 ${
          status === "loading" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {status === "authenticated" ? (
          <>
            <Link
              href="/calendar"
              className="inline-flex items-center justify-center min-h-[48px] w-full sm:w-auto rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Browse Shifts
            </Link>
            <Link
              href="/post"
              className="inline-flex items-center justify-center min-h-[48px] w-full sm:w-auto rounded-md border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              Post a Shift
            </Link>
          </>
        ) : (
          <>
            <a
              href="https://shiftswapper-demo.vercel.app/demo-start"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[48px] w-full sm:w-auto rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Try the Demo
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center min-h-[48px] w-full sm:w-auto rounded-md border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              Log in
            </Link>
          </>
        )}
      </div>

      {status !== "authenticated" && status !== "loading" && (
        <p className="mt-6 text-sm text-slate-400">
          No account needed to try the demo.
        </p>
      )}
    </div>
  );
}
