import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
      postedByUserId: true,
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
    posted_by_user_id: shift.postedByUserId ?? undefined,
  });
}

function shiftToJson(shift: {
  id: string;
  status: string;
  location: string;
  role: string;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  posterName: string;
  covererName: string | null;
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
    coverer_name: shift.covererName ?? undefined,
    created_at: shift.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  const { id } = await params;
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) {
    return NextResponse.json(
      { error: "Shift not found", code: "SHIFT_NOT_FOUND" },
      { status: 404 }
    );
  }
  const u = session.user as { id?: string; role?: string };
  const isPoster = shift.postedByUserId === u.id;
  const isAdmin = u.role === "admin";
  if (!isPoster && !isAdmin) {
    return NextResponse.json(
      { error: "Only the poster or an admin can remove this shift", code: "FORBIDDEN" },
      { status: 403 }
    );
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }
  if (body.status === "cancelled") {
    const updated = await prisma.shift.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return NextResponse.json(shiftToJson(updated));
  }
  return NextResponse.json(
    { error: "Expected status: cancelled", code: "VALIDATION_ERROR" },
    { status: 422 }
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  const { id } = await params;
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) {
    return NextResponse.json(
      { error: "Shift not found", code: "SHIFT_NOT_FOUND" },
      { status: 404 }
    );
  const u = session.user as { id?: string; role?: string };
  const isPoster = shift.postedByUserId === u.id;
  const isAdmin = u.role === "admin";
  if (!isPoster && !isAdmin) {
    return NextResponse.json(
      { error: "Only the poster or an admin can remove this shift", code: "FORBIDDEN" },
      { status: 403 }
    }
  await prisma.shift.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
