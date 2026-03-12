import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — ShiftSwapper",
  description: "ShiftSwapper privacy policy: how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: February 2025. This is draft text — review and customize for your organization.</p>

      <div className="prose prose-slate text-slate-700 space-y-6 text-sm">
        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">1. Introduction</h2>
          <p>
            ShiftSwapper (&quot;we,&quot; &quot;our,&quot; or &quot;the service&quot;) is a web application that lets pharmacy team members post shifts they need covered and browse and claim open shifts. This Privacy Policy describes how we collect, use, and protect your information when you use ShiftSwapper.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">2. Information we collect</h2>
          <p>We collect information you provide when you:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Create an account:</strong> First name, last name, email address, position (role), and password. You may optionally provide a <strong>phone number</strong> if you choose to receive SMS notifications.</li>
            <li><strong>Post or cover shifts:</strong> Shift details (date, time, location, role) and, when you cover a shift, your name and contact information (from your account or as entered) so the poster and scheduler can be notified.</li>
          </ul>
          <p className="mt-2">
            We also store technical information such as your session state and, when you verify your email or phone, verification status and (for SMS) a time-limited verification code.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">3. How we use your information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To operate the service: display shifts, match posters and coverers, and send <strong>email</strong> and <strong>SMS (text) notifications</strong> when your shift is covered or when you need to verify your phone number.</li>
            <li>Phone numbers are used only for SMS notifications (e.g., &quot;Your shift has been covered&quot;) and for sending verification codes when you opt in to SMS. We do not sell or share your phone number with third parties for marketing.</li>
            <li>To send transactional emails (e.g., verification links, shift coverage alerts) and, if configured, to notify an administrator when new users sign up.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">4. Data retention and security</h2>
          <p>
            We retain your account and shift data as long as your account is active and as needed to operate the service and comply with legal obligations. You can update or correct your profile (including phone number and SMS preferences) at any time in your Account settings. You may request deletion of your account or data by contacting us.
          </p>
          <p className="mt-2">
            We use industry-standard practices to protect your data (e.g., encryption, access controls). Email and SMS are delivered via third-party providers (e.g., Resend, Twilio); their privacy practices apply to the transmission and delivery of those messages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">5. SMS and phone numbers</h2>
          <p>
            If you provide your phone number and opt in to SMS notifications, we will use it to send you text messages about shift coverage and, when required, verification codes. Message and data rates may apply. You can opt out at any time by replying <strong>STOP</strong> to any SMS or by turning off SMS in your Account settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-800 mt-6 mb-2">6. Contact</h2>
          <p>
            For questions about this Privacy Policy or to request access, correction, or deletion of your data, contact us at{" "}
            <a href="mailto:SeanPGleeson@gmail.com" className="text-blue-600 hover:text-blue-800">
              SeanPGleeson@gmail.com
            </a>.
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
