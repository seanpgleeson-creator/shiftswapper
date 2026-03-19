import Link from "next/link";

export const metadata = {
  title: "Terms of Service — ShiftSwap",
  description: "ShiftSwap terms of service and SMS program terms.",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 2026.</p>

      <div className="prose prose-slate text-slate-700 space-y-6 text-sm">
        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">1. Acceptance of terms</h2>
          <p>
            By accessing or using ShiftSwap ("the Service"), you agree to these Terms of Service. If you do not agree,
            do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">2. Description of the service</h2>
          <p>
            ShiftSwap is a web application that lets pharmacy team members post shifts they need covered and browse and
            claim open shifts. The Service facilitates communication between posters and coverers and sends email and SMS
            notifications in connection with shift coverage. ShiftSwap operates separately from your employer&apos;s scheduling
            system (e.g., UKG); any formal transfer of shifts must be completed through your organization&apos;s processes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">3. Your account and conduct</h2>
          <p>
            You must provide accurate information when signing up and keep your account secure. You are responsible for
            activity under your account. Do not use the Service for any unlawful purpose or in a way that harms others or
            the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">4. SMS program terms</h2>
          <p>If you opt in to SMS notifications, the following terms apply:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              You may receive text messages from ShiftSwap about shift coverage (e.g., when someone covers your shift)
              and, when applicable, verification codes.
            </li>
            <li><strong>Message and data rates may apply</strong> depending on your carrier.</li>
            <li>
              You can <strong>opt out at any time</strong> by replying <strong>STOP</strong> to any SMS or by turning off
              SMS notifications in your Account settings.
            </li>
            <li>By providing your phone number and opting in, you consent to receive SMS notifications from ShiftSwap.</li>
          </ul>
          <p className="mt-2">
            Carriers are not liable for delayed or undelivered messages. Support for SMS (e.g., HELP) may be available;
            see in-app or contact information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">5. Disclaimer</h2>
          <p>
            The Service is provided "as is." ShiftSwap does not guarantee uninterrupted or error-free operation. Shift
            posting and coverage are agreements between users; ShiftSwap is not a party to those arrangements. Your use of
            the Service is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">6. Operator and contact</h2>
          <p>ShiftSwap is built and operated by Sean Gleeson.</p>
          <p className="mt-2">
            Questions about these terms can be sent to{" "}
            <a href="mailto:sean@hcmcshiftswap.com" className="text-blue-600 hover:text-blue-800">
              sean@hcmcshiftswap.com
            </a>
            .
          </p>
          <p className="mt-2">
            Mailing address:
            <br />
            20475 Summerville Road
            <br />
            Deephaven, MN 55331
          </p>
          <p className="mt-2">
            Phone: <a href="tel:+19523936886" className="text-blue-600 hover:text-blue-800">952-393-6886</a>
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
