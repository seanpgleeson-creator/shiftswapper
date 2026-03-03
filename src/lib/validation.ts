import { z } from "zod";
import { LOCATIONS, ROLES } from "./constants";

const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const createShiftSchema = z
  .object({
    poster_name: z.string().min(1, "Name is required"),
    poster_email: z.string().email("Invalid email"),
    poster_phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[\d\s\-+()]{10,}$/.test(v), "Invalid phone format"),
    location: z.enum(LOCATIONS as unknown as [string, ...string[]]),
    role: z.enum(ROLES as unknown as [string, ...string[]]),
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    start_time: z.string().regex(HHMM, "Use HH:MM format"),
    end_time: z.string().regex(HHMM, "Use HH:MM format"),
  })
  .refine(
    (data) => {
      const d = new Date(data.shift_date + "T12:00:00.000Z");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    },
    { message: "Shift date must be today or in the future", path: ["shift_date"] }
  )
  .refine(
    (data) => timeToMinutes(data.start_time) < timeToMinutes(data.end_time),
    { message: "End time must be after start time", path: ["end_time"] }
  );

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const coverShiftSchema = z.object({
  coverer_name: z.string().min(1, "Name is required"),
  coverer_email: z.string().email("Invalid email"),
});

export type CoverShiftInput = z.infer<typeof coverShiftSchema>;

export const coverShiftAuthenticatedSchema = z.object({
  coverer_name: z.string().optional(),
  coverer_email: z.string().email().optional(),
});

export const signupSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    position: z.enum(ROLES as unknown as [string, ...string[]]),
    phone: z
      .string()
      .min(1, "Phone is required for SMS notifications")
      .refine((v) => /^[\d\s\-+()]{10,}$/.test(v), "Invalid phone format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export type SignupInput = z.infer<typeof signupSchema>;

const createShiftAuthenticatedBase = z
  .object({
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    start_time: z.string().regex(HHMM, "Use HH:MM format"),
    end_time: z.string().regex(HHMM, "Use HH:MM format"),
    location: z.enum(LOCATIONS as unknown as [string, ...string[]]),
    poster_phone: z
      .string()
      .optional()
      .refine((v) => !v || /^[\d\s\-+()]{10,}$/.test(v), "Invalid phone format"),
  })
  .refine(
    (data) => {
      const d = new Date(data.shift_date + "T12:00:00.000Z");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    },
    { message: "Shift date must be today or in the future", path: ["shift_date"] }
  )
  .refine(
    (data) => timeToMinutes(data.start_time) < timeToMinutes(data.end_time),
    { message: "End time must be after start time", path: ["end_time"] }
  );

export const createShiftAuthenticatedSchema = createShiftAuthenticatedBase;
export type CreateShiftAuthenticatedInput = z.infer<typeof createShiftAuthenticatedSchema>;
