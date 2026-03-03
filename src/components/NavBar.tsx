"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function NavBar() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/shift-swapper-logo.svg"
            alt="Shift Swapper"
            className="h-8 w-auto"
          />
        </Link>
        <ul className="flex items-center gap-4 sm:gap-6">
          <li>
            <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium">
              Home
            </Link>
          </li>
          <li>
            <Link href="/post" className="text-blue-600 hover:text-blue-800 font-semibold">
              Post a Shift
            </Link>
          </li>
          <li>
            <Link href="/calendar" className="text-slate-600 hover:text-slate-900 font-medium">
              Browse Shifts
            </Link>
          </li>
          {status === "loading" ? (
            <li className="text-slate-500 text-sm">…</li>
          ) : session ? (
            <>
              <li>
                <Link href="/account" className="text-slate-600 hover:text-slate-900 font-medium">
                  Account
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Log out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
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
