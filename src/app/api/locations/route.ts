import { NextResponse } from "next/server";
import { LOCATIONS } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({ locations: [...LOCATIONS] });
}
