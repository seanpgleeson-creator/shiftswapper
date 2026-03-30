import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { VerificationGate } from "@/components/VerificationGate";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ShiftSwap",
  description: "Post and pick up pharmacy shifts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
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
        <Analytics />
      </body>
    </html>
  );
}
