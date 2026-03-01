import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { coverShiftSchema, coverShiftAuthenticatedSchema } from "@/lib/validation";
import { sendCoverEmails } from "@/lib/email";
import { buildGoogleCalendarUrl } from "@/lib/calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) {
    return NextResponse.json(
      { error: "Shift not found", code: "SHIFT_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (shift.status !== "open") {
    return NextResponse.json(
      { error: "Shift is already covered or cancelled", code: "SHIFT_ALREADY_COVERED" },
      { status: 409 }
    );
  }

  let covererName: string;
  let covererEmail: string;

  if (session?.user) {
    const u = session.user as { name?: string; email?: string; firstName?: string; lastName?: string };
    covererName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.name || "User";
    covererEmail = u.email ?? "";
    const body = await request.json().catch(() => ({}));
    const parsed = coverShiftAuthenticatedSchema.safeParse(body);
    if (parsed.success && parsed.data.coverer_name && parsed.data.coverer_email) {
      covererName = parsed.data.coverer_name;
      covererEmail = parsed.data.coverer_email;
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }
    const parsed = coverShiftSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const fieldList = Object.entries(fields).map(([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages[0] : messages,
      }));
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", fields: fieldList },
        { status: 422 }
      );
    }
    covererName = parsed.data.coverer_name;
    covererEmail = parsed.data.coverer_email;
  }

  const coveredAt = new Date();

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      status: "covered",
      covererName,
      covererEmail,
      coveredAt,
    },
  });

  const settings = await prisma.settings.findFirst();
  const schedulerEmail = settings?.schedulerEmail ?? "";

  const emailPayload = {
    posterEmail: shift.posterEmail,
    posterName: shift.posterName,
    covererName,
    covererEmail,
    shiftDate: shift.shiftDate.toISOString().slice(0, 10),
    startTime: shift.startTime,
    endTime: shift.endTime,
    location: shift.location,
    role: shift.role,
  };

  const emailResult = await sendCoverEmails(emailPayload, schedulerEmail);
  if (emailResult.error) {
    console.error("Cover emails failed:", emailResult.error);
  }

  const timezone = settings?.timezone ?? "America/Chicago";
  const googleCalendarUrl = buildGoogleCalendarUrl(
    {
      shiftDate: updated.shiftDate,
      startTime: updated.startTime,
      endTime: updated.endTime,
      location: updated.location,
      role: updated.role,
      posterName: updated.posterName,
    },
    timezone
  );

  const response: Record<string, unknown> = {
    id: updated.id,
    status: updated.status,
    location: updated.location,
    role: updated.role,
    shift_date: updated.shiftDate.toISOString().slice(0, 10),
    start_time: updated.startTime,
    end_time: updated.endTime,
    poster_name: updated.posterName,
    coverer_name: updated.covererName,
    created_at: updated.createdAt.toISOString(),
    google_calendar_url: googleCalendarUrl,
  };
  if (!emailResult.posterOk || !emailResult.schedulerOk) {
    response.email_warning = "One or more notifications could not be sent.";
  }

  return NextResponse.json(response);
}
