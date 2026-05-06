import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

const DEMO_USER_EMAILS = [
  "demo@shiftswapper.app",
  "admin@shiftswapper.app",
  "jamie.rivera@shiftswapper.app",
  "morgan.chen@shiftswapper.app",
];

const DEMO_USERS = [
  { firstName: "Demo",   lastName: "User",   email: "demo@shiftswapper.app",          password: "demo1234",  position: "Pharmacist",  role: "member" as const },
  { firstName: "Admin",  lastName: "Demo",   email: "admin@shiftswapper.app",         password: "admin1234", position: "Pharmacist",  role: "admin"  as const },
  { firstName: "Jamie",  lastName: "Rivera", email: "jamie.rivera@shiftswapper.app",  password: "demo1234",  position: "Technician",  role: "member" as const },
  { firstName: "Morgan", lastName: "Chen",   email: "morgan.chen@shiftswapper.app",   password: "demo1234",  position: "Intern",      role: "member" as const },
];

const LOCATIONS = [
  "Red Pharmacy", "CSC Pharmacy", "Shapiro Pharmacy", "Whittier Pharmacy",
  "Enhanced Care", "Speciality Pharmacy", "Brooklyn Park Pharmacy",
  "St. Anthony Pharmacy", "Richfield Pharmacy", "North Loop Pharmacy",
];

const ROLES = ["Pharmacist", "Technician", "Intern"] as const;

const SHIFT_TIMES = [
  { startTime: "07:00", endTime: "15:30" },
  { startTime: "08:00", endTime: "16:30" },
  { startTime: "09:00", endTime: "17:30" },
  { startTime: "11:30", endTime: "20:00" },
  { startTime: "14:00", endTime: "22:30" },
];

const SHIFT_DEFS: Array<{
  daysOut: number;
  status: "open" | "covered";
  coverer?: { name: string; email: string };
}> = [
  { daysOut: 1,  status: "open" },
  { daysOut: 2,  status: "open" },
  { daysOut: 3,  status: "open" },
  { daysOut: 4,  status: "open" },
  { daysOut: 5,  status: "open" },
  { daysOut: 6,  status: "open" },
  { daysOut: 7,  status: "open" },
  { daysOut: 8,  status: "open" },
  { daysOut: 9,  status: "open" },
  { daysOut: 10, status: "open" },
  { daysOut: 11, status: "open" },
  { daysOut: 12, status: "open" },
  { daysOut: 14, status: "open" },
  { daysOut: 16, status: "open" },
  { daysOut: 18, status: "open" },
  { daysOut: 21, status: "open" },
  { daysOut: 24, status: "open" },
  { daysOut: 28, status: "open" },
  { daysOut: -5, status: "covered", coverer: { name: "Alex Torres",  email: "alex.torres@shiftswapper.app"  } },
  { daysOut: -3, status: "covered", coverer: { name: "Sam Patel",    email: "sam.patel@shiftswapper.app"    } },
  { daysOut: -1, status: "covered", coverer: { name: "Jamie Rivera", email: "jamie.rivera@shiftswapper.app" } },
];

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function pick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Vercel cron triggers via GET; also accept POST for manual resets.
export async function GET(request: NextRequest) {
  return handleReset(request);
}

export async function POST(request: NextRequest) {
  return handleReset(request);
}

// Hostname allowlist: the reset endpoint must only run when the request host matches
// one of these known demo hostnames. This provides defense-in-depth so that even if
// DEMO_MODE=true is accidentally set on production, the route refuses to execute.
const DEMO_HOSTNAMES = ["shiftswapper-demo.vercel.app"];

async function handleReset(request: NextRequest) {
  // Only active on the demo deployment
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Block execution unless the host is a known demo hostname
  const host = request.headers.get("host") ?? "";
  const isAllowedHost = DEMO_HOSTNAMES.some((h) => host === h || host.startsWith(h));
  if (!isAllowedHost) {
    console.error("[DemoReset] Blocked: host", host, "is not in the demo allowlist");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify Vercel cron secret (set CRON_SECRET in demo Vercel env vars)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[DemoReset] CRON_SECRET is not set; refusing to run without auth");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Delete all shifts
    const { count: shiftsDeleted } = await prisma.shift.deleteMany({});

    // 2. Delete all non-demo users (visitors who signed up during the session)
    const { count: usersDeleted } = await prisma.user.deleteMany({
      where: { email: { notIn: DEMO_USER_EMAILS } },
    });

    // 3. Upsert demo users (re-create any that were deleted, update passwords)
    const seededUsers: { id: string; firstName: string; lastName: string; email: string }[] = [];
    for (const u of DEMO_USERS) {
      const passwordHash = await hash(u.password, 10);
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { passwordHash, role: u.role, emailVerified: true, smsConsent: false },
        create: {
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          passwordHash,
          position: u.position,
          role: u.role,
          emailVerified: true,
          smsConsent: false,
        },
      });
      seededUsers.push(user);
    }

    // 4. Re-seed shifts
    for (const def of SHIFT_DEFS) {
      const poster = pick(seededUsers);
      const times = pick(SHIFT_TIMES);
      const isCovered = def.status === "covered";
      await prisma.shift.create({
        data: {
          posterName:     `${poster.firstName} ${poster.lastName}`,
          posterEmail:    poster.email,
          location:       pick(LOCATIONS),
          role:           pick(ROLES),
          shiftDate:      daysFromNow(def.daysOut),
          startTime:      times.startTime,
          endTime:        times.endTime,
          status:         def.status,
          postedByUserId: poster.id,
          covererName:    isCovered ? def.coverer!.name  : null,
          covererEmail:   isCovered ? def.coverer!.email : null,
          coveredAt:      isCovered ? new Date()         : null,
        },
      });
    }

    console.info("[DemoReset] Complete", {
      shiftsDeleted,
      usersDeleted,
      shiftsCreated: SHIFT_DEFS.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      shiftsDeleted,
      usersDeleted,
      shiftsCreated: SHIFT_DEFS.length,
    });
  } catch (err) {
    console.error("[DemoReset] Failed", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
