import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const LOCATIONS = [
  "Red Pharmacy",
  "CSC Pharmacy",
  "Shapiro Pharmacy",
  "Whittier Pharmacy",
  "Enhanced Care",
  "Speciality Pharmacy",
  "Brooklyn Park Pharmacy",
  "St. Anthony Pharmacy",
  "Richfield Pharmacy",
  "North Loop Pharmacy",
];

const ROLES = ["Pharmacist", "Technician", "Intern"] as const;

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function pick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SHIFT_TIMES = [
  { startTime: "07:00", endTime: "15:30" },
  { startTime: "08:00", endTime: "16:30" },
  { startTime: "09:00", endTime: "17:30" },
  { startTime: "11:30", endTime: "20:00" },
  { startTime: "14:00", endTime: "22:30" },
];

const DEMO_USERS = [
  {
    firstName: "Demo",
    lastName: "User",
    email: "demo@shiftswapper.app",
    password: "demo1234",
    position: "Pharmacist",
    role: "member" as const,
  },
  {
    firstName: "Admin",
    lastName: "Demo",
    email: "admin@shiftswapper.app",
    password: "admin1234",
    position: "Pharmacist",
    role: "admin" as const,
  },
  {
    firstName: "Jamie",
    lastName: "Rivera",
    email: "jamie.rivera@shiftswapper.app",
    password: "demo1234",
    position: "Technician",
    role: "member" as const,
  },
  {
    firstName: "Morgan",
    lastName: "Chen",
    email: "morgan.chen@shiftswapper.app",
    password: "demo1234",
    position: "Intern",
    role: "member" as const,
  },
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

async function main() {
  // Settings — always seed if missing
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        schedulerEmail: process.env.SCHEDULER_EMAIL ?? "scheduler@example.com",
        timezone: "America/Chicago",
      },
    });
    console.log("Seeded settings.");
  } else {
    console.log("Settings already exist, skipping.");
  }

  // Demo users and shifts only in demo mode
  if (process.env.DEMO_MODE !== "true") {
    console.log("DEMO_MODE is not set — skipping demo users and shifts.");
    return;
  }

  const createdUsers: { id: string; firstName: string; lastName: string; email: string }[] = [];

  for (const u of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`User ${u.email} already exists, skipping.`);
      createdUsers.push(existing);
      continue;
    }
    const passwordHash = await hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
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
    createdUsers.push(user);
    console.log(`Created user: ${u.email}`);
  }

  const existingShiftCount = await prisma.shift.count();
  if (existingShiftCount > 0) {
    console.log(`${existingShiftCount} shifts already exist, skipping shift seed.`);
    return;
  }

  for (const def of SHIFT_DEFS) {
    const poster = pick(createdUsers);
    const times  = pick(SHIFT_TIMES);
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
        coveredAt:      isCovered ? new Date()          : null,
      },
    });
  }

  console.log(`Seeded ${SHIFT_DEFS.length} demo shifts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
