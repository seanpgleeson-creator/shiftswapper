import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { ROLES } from "@/lib/constants";

const patchUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(/^[\d\s\-+()]{10,}$/, "Invalid phone format").or(z.literal("")).optional(),
  position: z.enum(ROLES as unknown as [string, ...string[]]).optional(),
  role: z.enum(["member", "admin"]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { firstName, lastName, email, phone, position, role, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (email && email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (conflict) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (firstName !== undefined) updateData.firstName = firstName.trim();
  if (lastName !== undefined) updateData.lastName = lastName.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (phone !== undefined) updateData.phone = phone.trim() || null;
  if (position !== undefined) updateData.position = position.trim();
  if (role !== undefined) updateData.role = role;
  if (password) updateData.passwordHash = await hash(password, 12);

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      position: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const currentUserId = (session.user as { id?: string }).id;

  if (id === currentUserId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
