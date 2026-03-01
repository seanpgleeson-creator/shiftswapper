import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createShiftSchema } from "@/lib/validation";

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
