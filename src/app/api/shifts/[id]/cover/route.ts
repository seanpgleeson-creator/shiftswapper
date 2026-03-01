import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { coverShiftSchema } from "@/lib/validation";
import { sendCoverEmails } from "@/lib/email";
import { buildGoogleCalendarUrl } from "@/lib/calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const { coverer_name, coverer_email } = parsed.data;
  const coveredAt = new Date();

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      status: "covered",
      covererName: coverer_name,
      covererEmail: coverer_email,
      coveredAt,
    },
  });

  const settings = await prisma.settings.findFirst();
  const schedulerEmail = settings?.schedulerEmail ?? "";

  const emailPayload = {
    posterEmail: shift.posterEmail,
    posterName: shift.posterName,
    covererName: coverer_name,
    covererEmail: coverer_email,
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
