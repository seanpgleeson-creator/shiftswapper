"use client";

import { useEffect, useState, useCallback } from "react";
import { Joyride, STATUS, type Step, type EventData } from "react-joyride";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const TOUR_KEY = "demo_tour_active";

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    title: "Welcome to ShiftSwap",
    content:
      "This is a quick tour of how ShiftSwap works. You can skip at any time.",
  },
  {
    target: '[data-tour="calendar-grid"]',
    placement: "bottom",
    skipBeacon: true,
    title: "The shift calendar",
    content:
      "This calendar shows every day in the month. Days with open shifts display a blue badge with the count.",
  },
  {
    target: '[data-tour="calendar-nav"]',
    placement: "bottom",
    skipBeacon: true,
    title: "Navigate months",
    content:
      "Use the arrows to move between months. Hit Today to jump back to the current date.",
  },
  {
    target: '[data-tour="location-filters"]',
    placement: "bottom",
    skipBeacon: true,
    title: "Filter by location",
    content:
      "Tap a pharmacy name to show only shifts at that location. Tap again to include it back.",
  },
  {
    target: '[data-tour="shift-list"]',
    placement: "left",
    skipBeacon: true,
    title: "Shift details",
    content:
      "Click any day to see its shifts here. Each card shows the time, location, role, and who posted it.",
  },
  {
    target: '[data-tour="post-nav-link"]',
    placement: "bottom",
    skipBeacon: true,
    title: "Post a shift",
    content:
      "Need someone to cover your shift? Click here to post it — your teammates will see it on the calendar instantly.",
  },
];

export function DemoTour() {
  const [run, setRun] = useState(false);
  const [showSignupCta, setShowSignupCta] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = false;
    try {
      active = sessionStorage.getItem(TOUR_KEY) === "true";
    } catch {
      // sessionStorage unavailable in some WebViews
    }

    // Also check for ?tour=1 query param (set by server-side demo login
    // fallback when sessionStorage is unavailable)
    if (!active && searchParams.get("tour") === "1") {
      active = true;
      // Clean the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    }

    if (active) {
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const handleEvent = useCallback((data: EventData) => {
    const { status } = data;
    const finished = ([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status);
    if (finished) {
      sessionStorage.removeItem(TOUR_KEY);
      setRun(false);
      if (status === STATUS.FINISHED) {
        setShowSignupCta(true);
      }
    }
  }, []);

  if (!isDemo && !run && !showSignupCta) return null;

  return (
    <>
      <Joyride
        steps={STEPS}
        run={run}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        options={{
          buttons: ["back", "primary", "skip"],
          showProgress: true,
          overlayClickAction: false,
          primaryColor: "#2563eb",
          zIndex: 10000,
        }}
        styles={{
          tooltip: {
            borderRadius: "12px",
            padding: "20px 24px",
          },
          tooltipTitle: {
            fontSize: "15px",
            fontWeight: 600,
            color: "#1e293b",
          },
          tooltipContent: {
            fontSize: "14px",
            color: "#475569",
            paddingTop: "6px",
          },
          buttonPrimary: {
            backgroundColor: "#2563eb",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
          },
          buttonBack: {
            color: "#64748b",
            marginRight: "8px",
            fontSize: "14px",
          },
          buttonSkip: {
            color: "#94a3b8",
            fontSize: "13px",
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip tour",
        }}
      />

      {showSignupCta && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSignupCta(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl mb-3">👋</p>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Ready to get started?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Create a free account to post shifts, claim coverage, and keep your
              team in sync.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSignupCta(false);
                  router.push("/signup");
                }}
                className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => setShowSignupCta(false)}
                className="w-full min-h-[44px] rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50 text-sm"
              >
                Keep exploring the demo
              </button>
            </div>
          </div>
        </div>
      )}

      {isDemo && !showSignupCta && (
        <div className="fixed bottom-6 right-6 z-[9998]">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.547A.75.75 0 0 0 2.75 16.5h9.5a.75.75 0 0 0 .704-.953A5.002 5.002 0 0 0 8 11a5.002 5.002 0 0 0-4.954 4.047ZM13.75 7.5a.75.75 0 0 0 0 1.5h1.19l-.47.47a.75.75 0 1 0 1.06 1.06l1.75-1.75a.75.75 0 0 0 0-1.06l-1.75-1.75a.75.75 0 1 0-1.06 1.06l.47.47H13.75Z" />
            </svg>
            Sign up
          </Link>
        </div>
      )}
    </>
  );
}
