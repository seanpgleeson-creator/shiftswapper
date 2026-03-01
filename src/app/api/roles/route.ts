import { NextResponse } from "next/server";
import { ROLES } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({ roles: [...ROLES] });
}
