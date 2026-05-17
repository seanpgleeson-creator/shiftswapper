import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// A revision scoped to the current git commit ensures the precache
// is busted on every deployment so users never see stale app-shell.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/offline", revision },
      { url: "/", revision },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
