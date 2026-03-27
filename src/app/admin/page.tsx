"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatTime, getMonthRange } from "@/lib/time";
import { ROLES } from "@/lib/constants";

type Shift = {
  id: string;
  status: string;
  location: string;
  role: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  poster_name: string;
  coverer_name?: string;
  created_at: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
};


export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<"shifts" | "users">("shifts");

  // Shifts state
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<Shift | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", position: "", role: "", password: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({
    poster_name: "",
    poster_email: "",
    poster_phone: "",
    location: "",
    role: "",
    shift_date: new Date().toISOString().slice(0, 10),
    start_time: "07:00",
    end_time: "15:00",
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addSubmitting, setAddSubmitting] = useState(false);

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && !isAdmin) {
      router.replace("/");
      return;
    }
  }, [status, isAdmin, router]);

  const { from, to } = useMemo(() => getMonthRange(viewYear, viewMonth), [viewYear, viewMonth]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
    ]).then(([locRes, roleRes]) => {
      setLocations(locRes.locations ?? []);
      setRoles(roleRes.roles ?? []);
      if (locRes.locations?.length && !addForm.location)
        setAddForm((f) => ({ ...f, location: locRes.locations[0], role: roleRes.roles?.[0] ?? "" }));
    });
  }, [isAdmin]);

  function refetch() {
    if (!isAdmin) return;
    setLoading(true);
    fetch(`/api/shifts?from=${from}&to=${to}&status=all`)
      .then((r) => r.json())
      .then((data) => setShifts(data.shifts ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!isAdmin) return;
    refetch();
  }, [isAdmin, from, to]);

  function fetchUsers() {
    if (!isAdmin) return;
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setUsersLoading(false));
  }

  useEffect(() => {
    if (!isAdmin || activeTab !== "users") return;
    fetchUsers();
  }, [isAdmin, activeTab]);

  function openEditUser(user: User) {
    setEditUser(user);
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? "", position: user.position, role: user.role, password: "" });
    setEditErrors({});
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    const err: Record<string, string> = {};
    if (!editForm.firstName.trim()) err.firstName = "Required";
    if (!editForm.lastName.trim()) err.lastName = "Required";
    if (!editForm.email.trim()) err.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) err.email = "Invalid email";
    setEditErrors(err);
    if (Object.keys(err).length > 0) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          position: editForm.position,
          role: editForm.role,
          ...(editForm.password ? { password: editForm.password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditErrors({ submit: data.error ?? "Failed to update user" });
        return;
      }
      setEditUser(null);
      fetchUsers();
    } finally {
      setEditSubmitting(false);
    }
  }

  async function confirmDeleteUser() {
    if (!deleteConfirmUser) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteConfirmUser.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError((data as { error?: string }).error ?? "Failed to delete user");
        return;
      }
      setDeleteConfirmUser(null);
      fetchUsers();
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!addForm.poster_name.trim()) err.poster_name = "Name is required";
    if (!addForm.poster_email.trim()) err.poster_email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.poster_email)) err.poster_email = "Invalid email";
    if (!addForm.poster_phone.trim()) err.poster_phone = "Phone is required";
    else if (!/^[\d\s\-+()]{10,}$/.test(addForm.poster_phone)) err.poster_phone = "Invalid phone format";
    if (!addForm.location) err.location = "Select a location";
    if (!addForm.role) err.role = "Select a role";
    const [sh, sm] = addForm.start_time.split(":").map(Number);
    const [eh, em] = addForm.end_time.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) err.end_time = "End time must be after start time";
    setAddErrors(err);
    if (Object.keys(err).length > 0) return;

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poster_name: addForm.poster_name.trim(),
          poster_email: addForm.poster_email.trim(),
          poster_phone: addForm.poster_phone.trim(),
          location: addForm.location,
          role: addForm.role,
          shift_date: addForm.shift_date,
          start_time: addForm.start_time,
          end_time: addForm.end_time,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddErrors(data.fields?.reduce((acc: Record<string, string>, f: { field: string; message: string }) => ({ ...acc, [f.field]: f.message }), {}) ?? { submit: data.error ?? "Failed to add shift" });
        return;
      }
      setShowAddForm(false);
      setAddForm({
        poster_name: "",
        poster_email: "",
        poster_phone: "",
        location: locations[0] ?? "",
        role: roles[0] ?? "",
        shift_date: new Date().toISOString().slice(0, 10),
        start_time: "07:00",
        end_time: "15:00",
      });
      setAddErrors({});
      refetch();
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleCancelShift(shift: Shift) {
    setRemoveConfirm(shift);
    setRemoveError(null);
  }

  async function confirmRemove(cancelOnly: boolean) {
    if (!removeConfirm) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      if (cancelOnly) {
        const res = await fetch(`/api/shifts/${removeConfirm.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setRemoveError(data.error ?? "Failed to cancel");
          return;
        }
      } else {
        const res = await fetch(`/api/shifts/${removeConfirm.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setRemoveError((data as { error?: string }).error ?? "Failed to remove");
          return;
        }
      }
      setRemoveConfirm(null);
      refetch();
    } finally {
      setRemoveLoading(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && !isAdmin)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (!session?.user) return null;

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Admin</h1>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("shifts")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "shifts" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Shifts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "users" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Users
        </button>
      </div>

      {activeTab === "users" && (
        <div>
          {usersLoading ? (
            <p className="text-slate-600">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-slate-600">No users found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Position</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Verified</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-sm text-slate-800">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{u.position}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.emailVerified ? "✓ Email" : "✗ Email"}
                      </td>
                      <td className="px-4 py-3 text-right flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditUser(u)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 min-h-[44px] flex items-center"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeleteConfirmUser(u); setDeleteError(null); }}
                          className="text-sm font-medium text-red-600 hover:text-red-800 min-h-[44px] flex items-center"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit User Modal */}
          {editUser && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-user-dialog-title">
              <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 id="edit-user-dialog-title" className="text-lg font-semibold text-slate-800 mb-4">Edit User</h2>
                <form onSubmit={handleEditSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                      className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${editErrors.firstName ? "border-red-500" : "border-slate-300"}`}
                    />
                    {editErrors.firstName && <p className="mt-1 text-sm text-red-600">{editErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                      className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${editErrors.lastName ? "border-red-500" : "border-slate-300"}`}
                    />
                    {editErrors.lastName && <p className="mt-1 text-sm text-red-600">{editErrors.lastName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${editErrors.email ? "border-red-500" : "border-slate-300"}`}
                    />
                    {editErrors.email && <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                    <select
                      value={editForm.position}
                      onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 min-h-[44px]"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">App role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 min-h-[44px]"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New password <span className="text-slate-400 font-normal">(leave blank to keep)</span></label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 min-h-[44px]"
                    />
                  </div>
                  {editErrors.submit && <p className="sm:col-span-2 text-sm text-red-600">{editErrors.submit}</p>}
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editSubmitting ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      className="min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete User Confirm Modal */}
          {deleteConfirmUser && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-user-dialog-title">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 id="delete-user-dialog-title" className="text-lg font-semibold text-slate-800 mb-2">Delete this user?</h2>
                <p className="text-slate-600 text-sm mb-4">
                  {deleteConfirmUser.firstName} {deleteConfirmUser.lastName} ({deleteConfirmUser.email}) will be permanently deleted. This cannot be undone.
                </p>
                {deleteError && <p className="mb-3 text-sm text-red-600">{deleteError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={confirmDeleteUser}
                    disabled={deleteLoading}
                    className="flex-1 min-h-[44px] rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? "Deleting…" : "Delete user"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteConfirmUser(null); setDeleteError(null); }}
                    disabled={deleteLoading}
                    className="flex-1 min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "shifts" && (
      <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (viewMonth === 0) {
                setViewMonth(11);
                setViewYear((y) => y - 1);
              } else setViewMonth((m) => m - 1);
            }}
            className="min-h-[44px] min-w-[44px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="min-w-[160px] text-center font-medium text-slate-800">{monthLabel}</span>
          <button
            type="button"
            onClick={() => {
              if (viewMonth === 11) {
                setViewMonth(0);
                setViewYear((y) => y + 1);
              } else setViewMonth((m) => m + 1);
            }}
            className="min-h-[44px] min-w-[44px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add shift
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Add shift (on behalf of poster)</h2>
          <form onSubmit={handleAddSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin_poster_name" className="block text-sm font-medium text-slate-700 mb-1">Poster name</label>
              <input
                id="admin_poster_name"
                type="text"
                value={addForm.poster_name}
                onChange={(e) => setAddForm((f) => ({ ...f, poster_name: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${addErrors.poster_name ? "border-red-500" : "border-slate-300"}`}
              />
              {addErrors.poster_name && <p className="mt-1 text-sm text-red-600">{addErrors.poster_name}</p>}
            </div>
            <div>
              <label htmlFor="admin_poster_email" className="block text-sm font-medium text-slate-700 mb-1">Poster email</label>
              <input
                id="admin_poster_email"
                type="email"
                value={addForm.poster_email}
                onChange={(e) => setAddForm((f) => ({ ...f, poster_email: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${addErrors.poster_email ? "border-red-500" : "border-slate-300"}`}
              />
              {addErrors.poster_email && <p className="mt-1 text-sm text-red-600">{addErrors.poster_email}</p>}
            </div>
            <div>
              <label htmlFor="admin_poster_phone" className="block text-sm font-medium text-slate-700 mb-1">Poster phone</label>
              <input
                id="admin_poster_phone"
                type="tel"
                value={addForm.poster_phone}
                onChange={(e) => setAddForm((f) => ({ ...f, poster_phone: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${addErrors.poster_phone ? "border-red-500" : "border-slate-300"}`}
              />
              {addErrors.poster_phone && <p className="mt-1 text-sm text-red-600">{addErrors.poster_phone}</p>}
            </div>
            <div>
              <label htmlFor="admin_location" className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <select
                id="admin_location"
                value={addForm.location}
                onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${addErrors.location ? "border-red-500" : "border-slate-300"}`}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin_role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                id="admin_role"
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${addErrors.role ? "border-red-500" : "border-slate-300"}`}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin_shift_date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                id="admin_shift_date"
                type="date"
                value={addForm.shift_date}
                onChange={(e) => setAddForm((f) => ({ ...f, shift_date: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="admin_start_time" className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
              <input
                id="admin_start_time"
                type="time"
                value={addForm.start_time}
                onChange={(e) => setAddForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="admin_end_time" className="block text-sm font-medium text-slate-700 mb-1">End time</label>
              <input
                id="admin_end_time"
                type="time"
                value={addForm.end_time}
                onChange={(e) => setAddForm((f) => ({ ...f, end_time: e.target.value }))}
                className={`w-full rounded-md border px-3 py-2 text-slate-800 min-h-[44px] ${addErrors.end_time ? "border-red-500" : "border-slate-300"}`}
              />
              {addErrors.end_time && <p className="mt-1 text-sm text-red-600">{addErrors.end_time}</p>}
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={addSubmitting}
                className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addSubmitting ? "Adding…" : "Add shift"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddErrors({}); }}
                className="min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            {addErrors.submit && <p className="sm:col-span-2 text-sm text-red-600">{addErrors.submit}</p>}
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-slate-600">Loading shifts…</p>
      ) : shifts.length === 0 ? (
        <p className="text-slate-600">No shifts in this month.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Poster</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Coverer</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {shifts.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.shift_date}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{formatTime(s.start_time)} – {formatTime(s.end_time)}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.location}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.role}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.poster_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "open" ? "bg-green-100 text-green-800" :
                      s.status === "covered" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.coverer_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "open" && (
                      <button
                        type="button"
                        onClick={() => handleCancelShift(s)}
                        className="text-sm font-medium text-red-600 hover:text-red-800 min-h-[44px] flex items-center justify-end"
                      >
                        Cancel shift
                      </button>
                    )}
                    {s.status !== "open" && (
                      <button
                        type="button"
                        onClick={() => handleCancelShift(s)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 min-h-[44px] flex items-center justify-end"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removeConfirm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-remove-dialog-title">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="admin-remove-dialog-title" className="text-lg font-semibold text-slate-800 mb-2">
              {removeConfirm.status === "open" ? "Cancel this shift?" : "Remove this shift from the list?"}
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              {removeConfirm.shift_date} at {removeConfirm.location} – {removeConfirm.poster_name}. This cannot be undone.
            </p>
            {removeError && <p className="mb-3 text-sm text-red-600">{removeError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => confirmRemove(removeConfirm.status === "open")}
                disabled={removeLoading}
                className="flex-1 min-h-[44px] rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removeLoading ? "…" : removeConfirm.status === "open" ? "Cancel shift" : "Remove"}
              </button>
              <button
                type="button"
                onClick={() => { setRemoveConfirm(null); setRemoveError(null); }}
                disabled={removeLoading}
                className="flex-1 min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
