import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // So NextAuth works on any Vercel deployment URL when NEXTAUTH_URL is not set (e.g. preview *.vercel.app URLs)
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  },
};

export default nextConfig;
