import { NextRequest, NextResponse } from "next/server";
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
      location: true,
      role: true,
      shiftDate: true,
      startTime: true,
      endTime: true,
      posterName: true,
      covererName: true,
      createdAt: true,
    },
  });

  if (!shift) {
    return NextResponse.json(
      { error: "Shift not found", code: "SHIFT_NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: shift.id,
    status: shift.status,
    location: shift.location,
    role: shift.role,
    shift_date: shift.shiftDate.toISOString().slice(0, 10),
    start_time: shift.startTime,
    end_time: shift.endTime,
    poster_name: shift.posterName,
    coverer_name: shift.covererName,
    created_at: shift.createdAt.toISOString(),
  });
}
