"use client";

import { useEffect, useState } from "react";
import { DM_Sans, Fraunces } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const STORAGE_KEY = "shiftswap-ios-banner-dismissed";

/**
 * Detects whether the current device is iOS Safari (not Chrome or other iOS
 * browsers, not Android, not desktop).
 */
function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  // Chrome on iOS contains "CriOS"; Firefox contains "FxiOS"; Safari does not
  const isSafariBrowser = /safari/i.test(ua) && !/chrome|crios|fxios|opios|edgios/i.test(ua);
  return isIos && isSafariBrowser;
}

/**
 * Returns true when the app is already running as an installed PWA in
 * standalone mode (already added to the home screen).
 */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function IosBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafari()) return;
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so the banner doesn't flash during hydration
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className={`${dmSans.variable} ${fraunces.variable}`}
      role="dialog"
      aria-label="Install ShiftSwap on your iPhone"
      aria-live="polite"
    >
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
        aria-hidden="true"
        onClick={dismiss}
      />

      {/* Banner — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom,16px)]"
        style={{ animation: "ios-banner-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div
          className="mx-auto max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1a4a3a 0%, #0f2d23 100%)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              {/* Teal circle icon */}
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192x192.png"
                  alt=""
                  className="w-8 h-8 rounded-lg"
                />
              </div>
              <div>
                <p
                  className="text-xs font-medium text-teal-300 uppercase tracking-widest leading-none mb-0.5"
                  style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}
                >
                  Install App
                </p>
                <p
                  className="text-base font-semibold text-white leading-tight"
                  style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontStyle: "italic" }}
                >
                  ShiftSwap
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss install banner"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mx-5" />

          {/* Description */}
          <p
            className="px-5 py-3 text-sm text-white/75 leading-relaxed"
            style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}
          >
            Add to your home screen for quick access — no App Store needed.
          </p>

          {/* Steps */}
          <div className="px-5 pb-2 space-y-3">
            <Step number={1}>
              Tap the{" "}
              <span className="inline-flex items-center gap-1 mx-0.5">
                <ShareIcon />
                <strong className="text-white font-semibold">Share</strong>
              </span>{" "}
              button at the bottom of Safari.
            </Step>
            <Step number={2}>
              Scroll down and tap{" "}
              <span className="inline-flex items-center gap-1.5 mx-0.5">
                <AddToHomeIcon />
                <strong className="text-white font-semibold">Add to Home Screen</strong>
              </span>
            </Step>
            <Step number={3}>
              Tap{" "}
              <strong className="text-white font-semibold">Add</strong>{" "}
              in the top-right corner.
            </Step>
          </div>

          {/* Footer CTA */}
          <div className="px-5 pt-3 pb-5">
            <button
              type="button"
              onClick={dismiss}
              className="w-full min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-semibold text-sm transition-colors"
              style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ios-banner-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 text-xs font-bold flex items-center justify-center mt-0.5"
        style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}
        aria-hidden="true"
      >
        {number}
      </span>
      <p
        className="text-sm text-white/70 leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}
      >
        {children}
      </p>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      aria-hidden="true"
      className="inline-block align-middle text-blue-300"
    >
      <path
        d="M8 1V12M8 1L5 4M8 1L11 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 8.5V15.5C2 16.05 2.45 16.5 3 16.5H13C13.55 16.5 14 16.05 14 15.5V8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddToHomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="inline-block align-middle text-teal-300"
    >
      <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 5.5V12.5M5.5 9H12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  );
}
