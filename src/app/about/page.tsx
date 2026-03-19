import Link from "next/link";

export const metadata = {
  title: "About — ShiftSwap",
  description: "About ShiftSwap and contact information.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">About ShiftSwap</h1>

      <div className="space-y-6 text-sm text-slate-700">
        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-2">What ShiftSwap does</h2>
          <p>
            ShiftSwap is a web application that helps pharmacy team members post shifts they need covered
            and lets coworkers browse and pick up open shifts.
          </p>
          <p className="mt-2">
            The service sends email and SMS notifications related to shift coverage and account verification.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-2">Business information</h2>
          <p>ShiftSwap is built and operated by Sean Gleeson.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-2">Contact</h2>
          <p>
            <strong>Address:</strong>
            <br />
            20475 Summerville Road
            <br />
            Deephaven, MN 55331
          </p>
          <p className="mt-3">
            <strong>Phone:</strong> <a href="tel:+19523936886" className="text-blue-600 hover:text-blue-800">952-393-6886</a>
          </p>
          <p className="mt-1">
            <strong>Email:</strong>{" "}
            <a href="mailto:sean@hcmcshiftswap.com" className="text-blue-600 hover:text-blue-800">
              sean@hcmcshiftswap.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-2">Policies</h2>
          <p>
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
              Privacy Policy
            </Link>
            {" "}
            and
            {" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
              Terms of Service
            </Link>
            {" "}
            are publicly available.
          </p>
        </section>
      </div>

      <p className="mt-10 text-slate-600 text-sm">
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          Back to home
        </Link>
      </p>
    </div>
  );
}
