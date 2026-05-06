"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      sessionStorage.setItem("demo_tour_active", "true");
      router.replace("/calendar");
      return;
    }

    if (status === "unauthenticated") {
      signIn("credentials", {
        email: "demo@shiftswapper.app",
        password: "demo1234",
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          sessionStorage.setItem("demo_tour_active", "true");
          router.replace("/calendar");
        } else {
          setError(true);
        }
      });
    }
  }, [status, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium mb-2">Demo unavailable</p>
        <p className="text-slate-500 text-sm">
          The demo account could not be loaded. Please try again later or{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            log in
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-slate-500 text-sm">Loading demo…</p>
    </div>
  );
}
