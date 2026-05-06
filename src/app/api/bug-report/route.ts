import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authOptions } from "@/lib/auth";

const bugReportSchema = z.object({
  description: z.string().min(10, "Please provide at least 10 characters."),
  category: z.enum(["posting", "calendar", "account_sms", "other"]).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const parsed = bugReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const user = session.user as { id?: string; email?: string; name?: string };
  const { description, category } = parsed.data;

  // Log without email to avoid PII in server logs
  console.info("[BugReport]", {
    userId: user.id,
    category: category ?? "none",
    descriptionLength: description.length,
    timestamp: new Date().toISOString(),
  });

  Sentry.withScope((scope) => {
    // Pass user ID only; email is handled by Sentry's built-in scrubbing + beforeSend
    scope.setUser({ id: user.id });
    scope.setTag("bug_report_category", category ?? "none");
    scope.setLevel("info");
    Sentry.captureMessage(`Bug report [${category ?? "none"}]: ${description.slice(0, 100)}`);
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
