import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { VerificationGate } from "@/components/VerificationGate";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerRegister";
import { IosBanner } from "@/components/IosBanner";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PostHogPageView } from "@/components/PostHogPageView";

export const metadata: Metadata = {
  title: "ShiftSwap",
  description: "Post and pick up pharmacy shifts — no group texts, no spreadsheets.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftSwap",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// themeColor lives in viewport (not metadata) in Next.js 15+
export const viewport: Viewport = {
  themeColor: "#1a4a3a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <ServiceWorkerProvider>
            <SessionProvider>
              <VerificationGate>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-600 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Skip to content
                </a>
                <NavBar />
                <main id="main-content" className="flex-1">{children}</main>
                <Footer />
              </VerificationGate>
            </SessionProvider>
          </ServiceWorkerProvider>
        </PostHogProvider>
        <Analytics />
        <IosBanner />
      </body>
    </html>
  );
}
