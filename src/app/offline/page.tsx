import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "You're offline — ShiftSwap",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Image
        src="/shift-swapper-logo.svg"
        alt="ShiftSwap"
        width={200}
        height={58}
        className="mb-8 opacity-50"
        priority
      />
      <h1 className="text-2xl font-semibold text-slate-800 mb-3">
        You&apos;re offline
      </h1>
      <p className="text-slate-500 max-w-xs mb-8">
        Check your connection and try again. Pages you&apos;ve already visited
        may still be available.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center min-h-[44px] rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
      >
        Try again
      </Link>
    </div>
  );
}
