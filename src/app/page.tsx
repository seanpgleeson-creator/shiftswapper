import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <section className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800 mb-4">
          Need a shift covered? Post it. Looking for hours? Browse open shifts.
        </h1>
      </section>
      <section className="grid sm:grid-cols-2 gap-6 mb-16">
        <Link
          href="/post"
          className="block p-6 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:shadow transition min-h-[120px]"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Post a Shift</h2>
          <p className="text-slate-600 text-sm">
            Have a shift you can&apos;t work? Post it here so a teammate can pick it up.
          </p>
        </Link>
        <Link
          href="/calendar"
          className="block p-6 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:shadow transition min-h-[120px]"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Browse Shifts</h2>
          <p className="text-slate-600 text-sm">
            See open shifts on the calendar and claim one that works for you.
          </p>
        </Link>
      </section>
      <section className="text-center py-6 border-t border-slate-200">
        <Link
          href="/upcoming-features"
          className="inline-flex items-center min-h-[44px] text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          We&apos;re building more — see what&apos;s coming.
        </Link>
      </section>
    </div>
  );
}
