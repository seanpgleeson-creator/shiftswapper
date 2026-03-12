import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-slate-600 text-sm font-medium">ShiftSwapper</span>
        <Link
          href="/privacy"
          className="inline-flex items-center min-h-[44px] text-slate-600 hover:text-slate-900 text-sm"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="inline-flex items-center min-h-[44px] text-slate-600 hover:text-slate-900 text-sm"
        >
          Terms of Service
        </Link>
        <Link
          href="/upcoming-features"
          className="inline-flex items-center min-h-[44px] text-slate-600 hover:text-slate-900 text-sm"
        >
          Upcoming Features
        </Link>
      </div>
    </footer>
  );
}
