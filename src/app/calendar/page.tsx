"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

type Shift = {
  id: string;
  status: string;
  location: string;
  role: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  poster_name: string;
  posted_by_user_id?: string;
};

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function getMonthRange(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const total = startPad + daysInMonth;
  const rows = Math.ceil(total / 7);
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length < rows * 7) days.push(null);
  return days;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { data: session } = useSession();
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [showCoverConfirm, setShowCoverConfirm] = useState(false);
  const [covererName, setCovererName] = useState("");
  const [covererEmail, setCovererEmail] = useState("");
  const isAuthenticated = !!session?.user;
  const sessionName = isAuthenticated ? (session?.user?.name ?? "You") : "";
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canRemoveShift = (shift: Shift) =>
    isAuthenticated &&
    (shift.posted_by_user_id === userId || userRole === "admin");
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverSuccess, setCoverSuccess] = useState(false);
  const [coverGoogleCalendarUrl, setCoverGoogleCalendarUrl] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [locations, setLocations] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(
    () => getMonthRange(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/roles").then((r) => r.json()),
    ]).then(([locRes, roleRes]) => {
      setLocations(locRes.locations ?? []);
      setRoles(roleRes.roles ?? []);
    });
  }, []);

  function refetchShifts() {
    const params = new URLSearchParams({ from, to });
    if (locationFilter.length > 0) locationFilter.forEach((l) => params.append("location", l));
    if (!isAuthenticated && roleFilter) params.set("role", roleFilter);
    return fetch(`/api/shifts?${params}`)
      .then((r) => r.json())
      .then((data) => setShifts(data.shifts ?? []));
  }

  useEffect(() => {
    setLoading(true);
    refetchShifts().finally(() => setLoading(false));
  }, [from, to, locationFilter, roleFilter, isAuthenticated, session?.user]);

  useEffect(() => {
    if (!detailShift) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailShift(null);
        setShowCoverConfirm(false);
        setCoverSuccess(false);
        setCoverGoogleCalendarUrl(null);
        setCoverError(null);
        setCovererName("");
        setCovererEmail("");
        setShowRemoveConfirm(false);
        setRemoveError(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detailShift]);

  const shiftsByDay = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    shifts.forEach((s) => {
      if (!map[s.shift_date]) map[s.shift_date] = [];
      map[s.shift_date].push(s);
    });
    return map;
  }, [shifts]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const selectedShifts = selectedDay ? shiftsByDay[selectedDay] ?? [] : [];
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  function goPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function goNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(null);
  }

  function toggleLocation(loc: string) {
    setLocationFilter((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  }

  const noShiftsInMonth = !loading && shifts.length === 0;
  const noShiftsMatchFilters =
    !loading &&
    shifts.length === 0 &&
    (locationFilter.length > 0 || roleFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Browse Shifts</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="min-h-[44px] min-w-[44px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="min-w-[160px] text-center font-medium text-slate-800">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="min-h-[44px] min-w-[44px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            aria-label="Next month"
          >
            →
          </button>
          <button
            type="button"
            onClick={goToday}
            className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">Location:</span>
          {locations.map((loc) => {
            const on = locationFilter.length === 0 || locationFilter.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                onClick={() => toggleLocation(loc)}
                className={`min-h-[44px] rounded-full px-3 py-1 text-sm ${
                  on
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {loc.replace(" Pharmacy", "")}
              </button>
            );
          })}
        </div>
        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            <label htmlFor="role-filter" className="text-sm text-slate-600">
              Role:
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="min-h-[44px] rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800"
            >
              <option value="">All</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
        {isAuthenticated && (session?.user as { position?: string })?.position && (
          <p className="text-sm text-slate-600">
            Showing shifts for your position ({(session.user as { position: string }).position})
          </p>
        )}
      </div>

      {noShiftsInMonth && !noShiftsMatchFilters && (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-slate-600">
          No shifts posted for {monthLabel}. Check back soon!
        </p>
      )}
      {noShiftsMatchFilters && (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-slate-600">
          No shifts match your filters. Try broadening your search.
        </p>
      )}

      {!noShiftsInMonth && (
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          <div className="flex-shrink-0">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-slate-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                if (d === null)
                  return <div key={`empty-${i}`} className="aspect-square" />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const dayShifts = shiftsByDay[dateStr] ?? [];
                const isSelected = selectedDay === dateStr;
                const isToday =
                  today.getFullYear() === viewYear &&
                  today.getMonth() === viewMonth &&
                  today.getDate() === d;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDay(dateStr)}
                    className={`aspect-square min-w-[44px] rounded-md border text-sm ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } ${isToday ? "font-semibold text-blue-600" : "text-slate-800"}`}
                  >
                    <span>{d}</span>
                    {dayShifts.length > 0 && (
                      <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1 text-xs text-blue-800">
                        {dayShifts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="md:min-w-[280px] md:flex-1 md:border-l md:border-slate-200 md:pl-8 md:pt-0 mt-6 md:mt-0">
            {selectedDay ? (
              selectedShifts.length > 0 ? (
                <>
                  <h2 className="text-lg font-semibold text-slate-800 mb-3">
                    Shifts on {selectedDay}
                  </h2>
                  <ul className="space-y-3">
                    {selectedShifts.map((shift) => (
                      <li key={shift.id}>
                        <button
                          type="button"
                          onClick={() => setDetailShift(shift)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200 hover:shadow transition"
                        >
                          <div className="font-medium text-slate-800">
                            {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                          </div>
                          <div className="text-sm text-slate-600">{shift.location}</div>
                          <div className="text-sm text-slate-600">{shift.role}</div>
                          <div className="text-sm text-slate-500">
                            Posted by {shift.poster_name}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-slate-600">No shifts on this day.</p>
              )
            ) : (
              <p className="text-slate-500 text-sm">Select a day to view shifts.</p>
            )}
          </section>
        </div>
      )}

      {detailShift && (
        <div
          className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setDetailShift(null);
            setShowCoverConfirm(false);
            setCoverSuccess(false);
            setCoverGoogleCalendarUrl(null);
            setCoverError(null);
            setCovererName("");
            setCovererEmail("");
            setShowRemoveConfirm(false);
            setRemoveError(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-detail-title"
        >
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {showRemoveConfirm ? (
              <>
                <h2 id="shift-detail-title" className="text-xl font-semibold text-slate-800 mb-2">
                  Remove this shift?
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  This will cancel the shift so it no longer appears as available. You can&apos;t undo this.
                </p>
                {removeError && (
                  <p className="mb-3 flex items-start gap-1.5 text-sm text-red-600" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" aria-hidden>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {removeError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowRemoveConfirm(false);
                      setRemoveError(null);
                    }}
                    disabled={removeLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 min-h-[44px] rounded-md bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    disabled={removeLoading}
                    onClick={async () => {
                      if (!detailShift) return;
                      setRemoveError(null);
                      setRemoveLoading(true);
                      try {
                        const res = await fetch(`/api/shifts/${detailShift.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "cancelled" }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setRemoveError(data.error ?? "Something went wrong. Please try again.");
                          return;
                        }
                        refetchShifts();
                        setDetailShift(null);
                        setShowRemoveConfirm(false);
                      } catch {
                        setRemoveError("Something went wrong. Please try again.");
                      } finally {
                        setRemoveLoading(false);
                      }
                    }}
                  >
                    {removeLoading ? "Removing…" : "Remove shift"}
                  </button>
                </div>
              </>
            ) : coverSuccess ? (
              <>
                <h2 id="shift-detail-title" className="text-xl font-semibold text-slate-800 mb-2">
                  You&apos;re covering this shift!
                </h2>
                <dl className="space-y-2 text-slate-700 mb-4">
                  <div>
                    <dt className="text-sm text-slate-500">Date</dt>
                    <dd>{detailShift.shift_date}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Time</dt>
                    <dd>
                      {formatTime(detailShift.start_time)} – {formatTime(detailShift.end_time)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Location</dt>
                    <dd>{detailShift.location}</dd>
                  </div>
                </dl>
                <p className="text-sm font-medium text-slate-700 mb-2">Add to calendar</p>
                <div className="flex flex-col gap-2 mb-6">
                  {coverGoogleCalendarUrl && (
                    <a
                      href={coverGoogleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]"
                    >
                      Add to Google Calendar
                    </a>
                  )}
                  <a
                    href={`/api/shifts/${detailShift.id}/calendar`}
                    download
                    className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]"
                  >
                    Add to Outlook / Apple Calendar
                  </a>
                </div>
                <button
                  type="button"
                  className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 min-h-[44px]"
                  onClick={() => {
                    setDetailShift(null);
                    setCoverSuccess(false);
                    setCoverGoogleCalendarUrl(null);
                  }}
                >
                  Back to Calendar
                </button>
              </>
            ) : showCoverConfirm ? (
              <>
                <h2 id="shift-detail-title" className="text-xl font-semibold text-slate-800 mb-2">
                  Cover this shift
                </h2>
                {isAuthenticated ? (
                  <p className="text-slate-600 text-sm mb-4">
                    You&apos;re covering as <strong>{sessionName}</strong>. The poster and scheduler will be notified.
                  </p>
                ) : (
                  <p className="text-slate-600 text-sm mb-4">
                    The poster and scheduler will be notified. Enter your details below.
                  </p>
                )}
                {coverError && (
                  <p className="mb-3 flex items-start gap-1.5 text-sm text-red-600" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" aria-hidden>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {coverError}
                  </p>
                )}
                {!isAuthenticated && (
                  <div className="space-y-3 mb-6">
                    <div>
                      <label htmlFor="coverer-name" className="block text-sm font-medium text-slate-700 mb-1">
                        Your name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="coverer-name"
                        type="text"
                        value={covererName}
                        onChange={(e) => setCovererName(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label htmlFor="coverer-email" className="block text-sm font-medium text-slate-700 mb-1">
                        Your email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="coverer-email"
                        type="email"
                        value={covererEmail}
                        onChange={(e) => setCovererEmail(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowCoverConfirm(false);
                      setCoverError(null);
                    }}
                    disabled={coverLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={!isAuthenticated && (coverLoading || !covererName.trim() || !covererEmail.trim())}
                    onClick={async () => {
                      setCoverError(null);
                      setCoverLoading(true);
                      try {
                        const res = await fetch(`/api/shifts/${detailShift.id}/cover`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(
                            isAuthenticated ? {} : { coverer_name: covererName.trim(), coverer_email: covererEmail.trim() }
                          ),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setCoverError(data.error ?? "Something went wrong. Please try again.");
                          return;
                        }
                        setCoverSuccess(true);
                        setCoverGoogleCalendarUrl(data.google_calendar_url ?? null);
                        refetchShifts();
                      } catch {
                        setCoverError("Something went wrong. Please try again.");
                      } finally {
                        setCoverLoading(false);
                      }
                    }}
                  >
                    {coverLoading ? "Submitting…" : "Confirm"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="shift-detail-title" className="text-xl font-semibold text-slate-800 mb-4">
                  Shift details
                </h2>
                <dl className="space-y-2 text-slate-700">
                  <div>
                    <dt className="text-sm text-slate-500">Date</dt>
                    <dd>{detailShift.shift_date}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Time</dt>
                    <dd>
                      {formatTime(detailShift.start_time)} –{" "}
                      {formatTime(detailShift.end_time)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Location</dt>
                    <dd>{detailShift.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Role</dt>
                    <dd>{detailShift.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Posted by</dt>
                    <dd>{detailShift.poster_name}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex-1 min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => setDetailShift(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="flex-1 min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
                      onClick={() => setShowCoverConfirm(true)}
                    >
                      Cover This Shift
                    </button>
                  </div>
                  {detailShift && canRemoveShift(detailShift) && (
                    <button
                      type="button"
                      className="min-h-[44px] rounded-md border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                      onClick={() => setShowRemoveConfirm(true)}
                    >
                      Remove my shift
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
