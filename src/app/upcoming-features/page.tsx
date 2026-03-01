export default function UpcomingFeaturesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Upcoming Features</h1>
      <p className="text-slate-600 mb-8">
        We&apos;re building more. Here&apos;s what&apos;s on the roadmap.
      </p>
      <ul className="space-y-4 text-slate-700">
        <li>
          <strong>User Accounts</strong> — Sign in to manage your posted and covered shifts.
        </li>
        <li>
          <strong>Role and Location Restrictions</strong> — Only approved team members can pick up certain shifts.
        </li>
        <li>
          <strong>SMS/Text Notifications</strong> — Get text alerts when your shift is covered.
        </li>
        <li>
          <strong>Shift History</strong> — View past shift swaps.
        </li>
        <li>
          <strong>Admin Dashboard</strong> — Schedulers manage locations, roles, and permissions.
        </li>
      </ul>
    </div>
  );
}
