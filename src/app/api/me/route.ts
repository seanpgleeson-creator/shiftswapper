import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const u = session.user as {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    phone?: string;
    role?: string;
  };

  return NextResponse.json({
    id: u.id,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    position: u.position,
    phone: u.phone,
    role: u.role,
  });
}
