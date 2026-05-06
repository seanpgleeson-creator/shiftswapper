import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow indexing only the public-facing marketing/compliance pages
        userAgent: "*",
        allow: ["/", "/about", "/privacy", "/terms", "/upcoming-features"],
        disallow: [
          "/api/",
          "/account",
          "/admin",
          "/calendar",
          "/post",
          "/login",
          "/signup",
          "/check-email",
          "/verify-phone",
          "/forgot-password",
          "/reset-password",
          "/bug-report",
          "/demo",
          "/settings",
        ],
      },
    ],
  };
}
