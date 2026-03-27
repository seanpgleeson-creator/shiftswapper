import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const resetSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  code: z.string().optional(),
  token: z.string().optional(),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password, code, token } = parsed.data;

  if (!code && !token) {
    return NextResponse.json(
      { error: "A reset code or token is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      passwordResetToken: true,
      passwordResetExpiresAt: true,
      passwordResetMethod: true,
    },
  });

  const invalid = () =>
    NextResponse.json(
      { error: "Invalid or expired reset code. Please request a new one." },
      { status: 400 }
    );

  if (!user || !user.passwordResetToken || !user.passwordResetExpiresAt) {
    return invalid();
  }

  if (user.passwordResetExpiresAt.getTime() < Date.now()) {
    return invalid();
  }

  let tokenValid = false;

  if (user.passwordResetMethod === "sms" && code) {
    tokenValid = code.trim() === user.passwordResetToken;
  } else if (user.passwordResetMethod === "email" && token) {
    tokenValid = hashToken(token) === user.passwordResetToken;
  }

  if (!tokenValid) {
    return invalid();
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      passwordResetMethod: null,
    },
  });

  return NextResponse.json({ ok: true });
}
