import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { VerificationGate } from "@/components/VerificationGate";

export const metadata: Metadata = {
  title: "ShiftSwapper",
  description: "Post and pick up pharmacy shifts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <VerificationGate>
            <NavBar />
            <main className="flex-1">{children}</main>
            <Footer />
          </VerificationGate>
        </SessionProvider>
      </body>
    </html>
  );
}
