import { NextRequest, NextResponse } from "next/server";
import ical, { ICalEventStatus } from "ical-generator";
import { DateTime } from "luxon";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      shiftDate: true,
      startTime: true,
      endTime: true,
      location: true,
      role: true,
      posterName: true,
    },
  });

  if (!shift) {
    return NextResponse.json(
      { error: "Shift not found", code: "SHIFT_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (shift.status !== "covered") {
    return NextResponse.json(
      { error: "Shift is not covered", code: "SHIFT_NOT_COVERED" },
      { status: 400 }
    );
  }

  const settings = await prisma.settings.findFirst();
  const timezone = settings?.timezone ?? "America/Chicago";

  const [startH, startM] = shift.startTime.split(":").map(Number);
  const [endH, endM] = shift.endTime.split(":").map(Number);
  const d = shift.shiftDate;
  const startDt = DateTime.fromObject(
    {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: startH,
      minute: startM,
      second: 0,
    },
    { zone: timezone }
  );
  const endDt = DateTime.fromObject(
    {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: endH,
      minute: endM,
      second: 0,
    },
    { zone: timezone }
  );
  const startDate = startDt.toUTC().toJSDate();
  const endDate = endDt.toUTC().toJSDate();

  const cal = ical({ name: "ShiftSwap" });
  cal.createEvent({
    start: startDate,
    end: endDate,
    summary: `Pharmacy Shift - ${shift.location} (${shift.role})`,
    description: `Covered via ShiftSwap. Originally posted by ${shift.posterName}.`,
    location: shift.location,
    status: ICalEventStatus.CONFIRMED,
  });

  const dateStr = shift.shiftDate.toISOString().slice(0, 10);
  const filename = `shift-${dateStr}.ics`;

  return new NextResponse(cal.toString(), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
