import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createShiftAuthenticatedSchema, createShiftAdminSchema } from "@/lib/validation";

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
  postedByUserId: string | null;
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
    posted_by_user_id: shift.postedByUserId ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to view shifts", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const locations = searchParams.getAll("location").filter(Boolean);
  let role = searchParams.get("role");
  const statusParam = searchParams.get("status");
  const adminParam = searchParams.get("admin");

  const userRole = (session.user as { role?: string }).role;
  const isAdmin = userRole === "admin";
  const showAllStatuses = isAdmin && (statusParam === "all" || adminParam === "true");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = from ? new Date(from + "T12:00:00.000Z") : new Date(today.getFullYear(), today.getMonth(), 1);
  const end = to ? new Date(to + "T12:00:00.000Z") : new Date(today.getFullYear(), today.getMonth() + 1, 0);

  if (!isAdmin && userRole === "member") {
    const position = (session.user as { position?: string }).position;
    if (position) role = role || position;
  }

  const shifts = await prisma.shift.findMany({
    where: {
      ...(showAllStatuses ? {} : { status: "open" }),
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
      covererName: true,
      createdAt: true,
      postedByUserId: true,
    },
    orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ shifts: shifts.map(shiftToJson) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to post a shift", code: "UNAUTHORIZED" },
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

  // Normalize request body for validation: trim location, accept legacy location name.
  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    if (typeof b.location === "string") {
      const loc = b.location.trim();
      b.location = loc === "Green Pharmacy" ? "Enhanced Care" : loc;
    }
  }

  const u = session.user as { id?: string; email?: string; name?: string; firstName?: string; lastName?: string; position?: string; phone?: string; role?: string };
  const isAdmin = u.role === "admin";
  const bodyHasPosterDetails =
    typeof body === "object" && body !== null && "poster_name" in body && typeof (body as Record<string, unknown>).poster_name === "string";

  // Use admin schema only when posting on behalf of someone (full poster details in body).
  // Otherwise authenticated users (including admins) post their own shift with the short form.
  if (isAdmin && bodyHasPosterDetails) {
    const parsed = createShiftAdminSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const fieldList = Object.entries(fields).map(([field, messages]) => ({
        field,
        message: (Array.isArray(messages) ? messages[0] : messages) ?? "Invalid value",
      }));
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", fields: fieldList },
        { status: 422 }
      );
    }
    const data = parsed.data;
    const shiftDate = new Date(data.shift_date + "T12:00:00.000Z");
    try {
      const shift = await prisma.shift.create({
        data: {
          posterName: data.poster_name.trim(),
          posterEmail: data.poster_email.trim(),
          posterPhone: data.poster_phone.trim(),
          location: data.location,
          role: data.role,
          shiftDate,
          startTime: data.start_time,
          endTime: data.end_time,
          status: "open",
          postedByUserId: null,
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
    } catch (err) {
      console.error("POST /api/shifts error:", err);
      return NextResponse.json(
        { error: "Failed to create shift. Please try again.", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }

  const parsed = createShiftAuthenticatedSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const fieldList = Object.entries(fields).map(([field, messages]) => ({
      field,
      message: (Array.isArray(messages) ? messages[0] : messages) ?? "Invalid value",
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
  const posterPhone = (data.poster_phone?.trim() || u.phone?.trim() || "").trim() || null;
  if (!posterPhone) {
    return NextResponse.json(
      {
        error: "Phone is required for posting (for SMS notifications). Add it in your account or enter it when posting.",
        code: "VALIDATION_ERROR",
        fields: [{ field: "poster_phone", message: "Phone is required for SMS notifications" }],
      },
      { status: 422 }
    );
  }
  const posterName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.name || "User";
  const role = (u.position ?? "").trim() || "Pharmacist";
  try {
    const shift = await prisma.shift.create({
      data: {
        posterName,
        posterEmail: u.email ?? "",
        posterPhone,
        location: data.location,
        role,
        shiftDate,
        startTime: data.start_time,
        endTime: data.end_time,
        status: "open",
        postedByUserId: u.id ?? null,
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
  } catch (err) {
    console.error("POST /api/shifts error:", err);
    return NextResponse.json(
      {
        error: "Failed to create shift. Please try again. If this persists, check that the database is set up and migrations have been run.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
