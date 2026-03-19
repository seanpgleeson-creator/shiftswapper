"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function NavBar() {
  const { data: session, status } = useSession();

  const linkClass =
    "text-sm font-medium text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center py-2 px-3 rounded-md";
  const ctaClass =
    "text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 min-h-[44px] flex items-center py-2 px-4 rounded-md";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/shift-swapper-logo.svg"
            alt="ShiftSwap"
            className="h-12 w-auto"
          />
        </Link>
        <ul className="flex flex-wrap items-center justify-end gap-1 sm:gap-4">
          <li>
            <Link href="/" className={linkClass}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/post" className={linkClass}>
              Post a Shift
            </Link>
          </li>
          <li>
            <Link href="/calendar" className={linkClass}>
              Browse Shifts
            </Link>
          </li>
          {status === "loading" ? (
            <li className="text-slate-500 text-sm min-h-[44px] flex items-center">…</li>
          ) : session ? (
            <>
              {(session.user as { role?: string }).role === "admin" && (
                <li>
                  <Link href="/admin" className={linkClass}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <Link href="/account" className={linkClass}>
                  Account
                </Link>
              </li>
              <li>
                <Link href="/bug-report" className={linkClass}>
                  Report a Bug
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={`${linkClass} bg-transparent border-0 cursor-pointer`}
                >
                  Log out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/signup" className={ctaClass}>
                  Sign up
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
