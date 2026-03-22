export default function UpcomingFeaturesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Upcoming Features</h1>
      <p className="text-slate-600 mb-8">
        We&apos;re building more. Here&apos;s what&apos;s on the roadmap.
      </p>
      <ul className="space-y-5 text-slate-700 mb-10">
        <li>
          <strong className="text-slate-800">Role and Location Restrictions</strong>
          <span className="block text-slate-600 text-sm mt-0.5">
            Ensure only team members approved for a specific role or location can pick up those shifts.
          </span>
        </li>
        <li>
          <strong className="text-slate-800">SMS/Text Notifications</strong>
          <span className="block text-slate-600 text-sm mt-0.5">
            Get text messages when your shift is covered or new shifts are posted at your location.
          </span>
        </li>
        <li>
          <strong className="text-slate-800">Shift History</strong>
          <span className="block text-slate-600 text-sm mt-0.5">
            View a log of past shift swaps for your records.
          </span>
        </li>
        <li>
          <strong className="text-slate-800">Admin Dashboard</strong>
          <span className="block text-slate-600 text-sm mt-0.5">
            Schedulers can manage locations, roles, and team member permissions.
          </span>
        </li>
      </ul>
      <p className="text-slate-600 text-sm border-t border-slate-200 pt-6">
        Have an idea?{" "}
        <a
          href="mailto:sean.gleeson@hcmcshiftswap.com?subject=ShiftSwap%20Feature%20Request"
          className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
        >
          Request a feature
        </a>
      </p>
    </div>
  );
}
