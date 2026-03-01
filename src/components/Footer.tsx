import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/upcoming-features"
          className="text-slate-600 hover:text-slate-900 text-sm"
        >
          Upcoming Features
        </Link>
      </div>
    </footer>
  );
}
