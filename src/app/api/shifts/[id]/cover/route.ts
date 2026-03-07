import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { coverShiftAuthenticatedSchema } from "@/lib/validation";
import { sendCoverEmails } from "@/lib/email";
import { sendCoverSms } from "@/lib/sms";
import { buildGoogleCalendarUrl } from "@/lib/calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to pick up a shift", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: { postedByUser: true },
  });
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

  const u = session.user as { name?: string; email?: string; firstName?: string; lastName?: string; phone?: string };
  let covererName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.name || "User";
  let covererEmail = u.email ?? "";
  let covererPhone = u.phone?.trim() ?? null;
  const body = await request.json().catch(() => ({}));
  const parsed = coverShiftAuthenticatedSchema.safeParse(body);
  if (parsed.success && parsed.data.coverer_name && parsed.data.coverer_email) {
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
      covererPhone,
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

  let smsOk = true;
  const posterConsented =
    shift.postedByUserId &&
    shift.postedByUser?.smsConsent === true &&
    (shift.posterPhone?.trim() ?? "").length > 0;
  if (posterConsented) {
    const smsResult = await sendCoverSms({
      posterPhone: shift.posterPhone!,
      covererName,
      covererPhone: updated.covererPhone,
    });
    smsOk = smsResult.ok;
    if (!smsResult.ok) {
      console.error("[Cover] SMS failed:", smsResult.error);
    }
  } else if (shift.posterPhone?.trim()) {
    console.warn("[Cover] SMS skipped: poster has not opted in or shift has no posted_by_user_id", shift.id);
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
    coverer_phone: updated.covererPhone ?? undefined,
    created_at: updated.createdAt.toISOString(),
    google_calendar_url: googleCalendarUrl,
  };
  if (!emailResult.posterOk || !emailResult.schedulerOk) {
    response.email_warning = "One or more notifications could not be sent.";
  }
  if (!smsOk) {
    response.sms_warning = "SMS could not be sent to the poster.";
  }

  return NextResponse.json(response);
}
