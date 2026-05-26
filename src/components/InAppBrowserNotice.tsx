"use client";

import { useEffect, useState } from "react";

const IN_APP_BROWSER_RE =
  /\b(LinkedInApp|FBAN|FBAV|FB_IAB|Instagram|Twitter|Line\/|MicroMessenger|Snapchat)\b/i;

const isIOS = (ua: string) => /iPhone|iPad|iPod/.test(ua);

type Detection = {
  isInApp: boolean;
  isIOS: boolean;
  appName: string | null;
};

function detect(): Detection {
  if (typeof navigator === "undefined") {
    return { isInApp: false, isIOS: false, appName: null };
  }
  const ua = navigator.userAgent;
  const match = ua.match(IN_APP_BROWSER_RE);
  if (!match) return { isInApp: false, isIOS: isIOS(ua), appName: null };

  const token = match[0];
  let appName: string | null = null;
  if (/LinkedInApp/i.test(token)) appName = "LinkedIn";
  else if (/FBAN|FBAV|FB_IAB/i.test(token)) appName = "Facebook";
  else if (/Instagram/i.test(token)) appName = "Instagram";
  else if (/Twitter/i.test(token)) appName = "X";
  else if (/Snapchat/i.test(token)) appName = "Snapchat";
  else if (/Line/i.test(token)) appName = "Line";
  else if (/MicroMessenger/i.test(token)) appName = "WeChat";

  return { isInApp: true, isIOS: isIOS(ua), appName };
}

/**
 * Shows a prominent notice when the page is being viewed inside a social-media
 * in-app browser (LinkedIn, Facebook, Instagram, etc.). Those browsers reliably
 * break cross-domain auth flows and downloads on iOS, so we direct the user to
 * open the page in their real browser instead.
 */
export function InAppBrowserNotice() {
  const [detection, setDetection] = useState<Detection>({
    isInApp: false,
    isIOS: false,
    appName: null,
  });

  useEffect(() => {
    setDetection(detect());
  }, []);

  if (!detection.isInApp) return null;

  const url =
    typeof window !== "undefined" ? window.location.href : "hcmcshiftswap.com";
  const appName = detection.appName ?? "this app";
  const instruction = detection.isIOS
    ? `Tap the \u22EF menu (top-right) and choose "Open in Safari"`
    : `Tap the \u22EE menu and choose "Open in browser"`;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="mx-auto max-w-2xl">
        <p className="font-medium">
          Open in your browser for the best experience
        </p>
        <p className="mt-1 text-amber-800">
          The demo and sign-up don't work inside {appName}'s in-app browser.{" "}
          {instruction}.
        </p>
      </div>
    </div>
  );
}
