import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createShiftSchema } from "@/lib/validation";

function shiftToJson(shift: {
  id: string;
  status: string;
  location: string;
  role: string;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  posterName: string;
  createdAt: Date;
}) {
  return {
    id: shift.id,
    status: shift.status,
    location: shift.location,
    role: shift.role,
    shift_date: shift.shiftDate.toISOString().slice(0, 10),
    start_time: shift.startTime,
    end_time: shift.endTime,
    poster_name: shift.posterName,
    created_at: shift.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const locations = searchParams.getAll("location").filter(Boolean);
  const role = searchParams.get("role");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = from ? new Date(from + "T12:00:00.000Z") : new Date(today.getFullYear(), today.getMonth(), 1);
  const end = to ? new Date(to + "T12:00:00.000Z") : new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const shifts = await prisma.shift.findMany({
    where: {
      status: "open",
      shiftDate: { gte: start, lte: end },
      ...(locations.length > 0 ? { location: { in: locations } } : {}),
      ...(role ? { role } : {}),
    },
    select: {
      id: true,
      status: true,
      location: true,
      role: true,
      shiftDate: true,
      startTime: true,
      endTime: true,
      posterName: true,
      createdAt: true,
    },
    orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ shifts: shifts.map(shiftToJson) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const parsed = createShiftSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const fieldList = Object.entries(fields).map(([field, messages]) => ({
      field,
      message: Array.isArray(messages) ? messages[0] : messages,
    }));
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        fields: fieldList,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const shiftDate = new Date(data.shift_date + "T12:00:00.000Z");

  const shift = await prisma.shift.create({
    data: {
      posterName: data.poster_name,
      posterEmail: data.poster_email,
      posterPhone: data.poster_phone || null,
      location: data.location,
      role: data.role,
      shiftDate,
      startTime: data.start_time,
      endTime: data.end_time,
      status: "open",
    },
  });

  return NextResponse.json(
    {
      id: shift.id,
      status: shift.status,
      location: shift.location,
      role: shift.role,
      shift_date: shift.shiftDate.toISOString().slice(0, 10),
      start_time: shift.startTime,
      end_time: shift.endTime,
      poster_name: shift.posterName,
      created_at: shift.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
