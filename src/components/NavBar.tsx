import Link from "next/link";

export function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-xl font-semibold text-slate-800">
          ShiftSwapper
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
        </ul>
      </nav>
    </header>
  );
}
