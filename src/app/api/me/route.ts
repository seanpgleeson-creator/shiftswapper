import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const uid = (session.user as { id?: string }).id;
  if (!uid) {
    return NextResponse.json(
      { error: "Session invalid", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      position: true,
      phone: true,
      role: true,
      smsConsent: true,
      smsConsentAt: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    position: user.position,
    phone: user.phone,
    role: user.role,
    sms_consent: user.smsConsent,
    sms_consent_at: user.smsConsentAt?.toISOString() ?? null,
    email_verified: user.emailVerified,
    phone_verified: user.phoneVerified,
  });
}
