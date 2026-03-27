import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM ?? "ShiftSwap <onboarding@resend.dev>";

export type CoverEmailPayload = {
  posterEmail: string;
  posterName: string;
  covererName: string;
  covererEmail: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  location: string;
  role: string;
};

export async function sendCoverEmails(
  payload: CoverEmailPayload,
  schedulerEmail: string
): Promise<{ posterOk: boolean; schedulerOk: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping email send");
    return { posterOk: false, schedulerOk: false, error: "Email not configured" };
  }

  const posterBody = `Hi ${payload.posterName},

Good news -- ${payload.covererName} will be covering your shift:

  Date:     ${payload.shiftDate}
  Time:     ${payload.startTime} - ${payload.endTime}
  Location: ${payload.location}
  Role:     ${payload.role}

Please confirm the change with your scheduler.

-- ShiftSwap`;

  const schedulerBody = `Hi,

A shift has been picked up via ShiftSwap. Please update the schedule.

  Date:      ${payload.shiftDate}
  Time:      ${payload.startTime} - ${payload.endTime}
  Location:  ${payload.location}
  Role:      ${payload.role}
  Originally posted by: ${payload.posterName}
  Covered by:           ${payload.covererName} (${payload.covererEmail})

-- ShiftSwap`;

  let posterOk = false;
  let schedulerOk = false;
  let lastError: string | undefined;

  try {
    const posterRes = await resend.emails.send({
      from: fromEmail,
      to: payload.posterEmail,
      subject: `Your shift on ${payload.shiftDate} at ${payload.location} has been covered`,
      text: posterBody,
    });
    posterOk = posterRes.data != null;
    if (posterRes.error) {
      lastError = posterRes.error.message;
      console.error("Resend poster email error:", posterRes.error);
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : "Failed to send poster email";
    console.error("Poster email send failed:", e);
  }

  try {
    const schedRes = await resend.emails.send({
      from: fromEmail,
      to: schedulerEmail,
      subject: `Shift coverage alert: ${payload.shiftDate} at ${payload.location}`,
      text: schedulerBody,
    });
    schedulerOk = schedRes.data != null;
    if (schedRes.error) {
      lastError = schedRes.error.message;
      console.error("Resend scheduler email error:", schedRes.error);
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : "Failed to send scheduler email";
    console.error("Scheduler email send failed:", e);
  }

  return { posterOk, schedulerOk, error: lastError };
}

/** Send verification email with link. verifyUrl should point to /api/auth/verify-email?token=... */
export async function sendVerificationEmail(
  to: string,
  verifyUrl: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping verification email");
    return { ok: false, error: "Email not configured" };
  }
  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Verify your email — ShiftSwap",
      text: `Please verify your email by clicking this link:\n\n${verifyUrl}\n\nIf you didn't create an account, you can ignore this email.\n\n— ShiftSwap`,
    });
    return { ok: res.data != null, error: res.error?.message };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send verification email";
    console.error("Verification email send failed:", e);
    return { ok: false, error: message };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping password reset email");
    return { ok: false, error: "Email not configured" };
  }
  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Reset your password — ShiftSwap",
      text: `You requested a password reset for your ShiftSwap account.\n\nClick the link below to set a new password. This link expires in 15 minutes.\n\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.\n\n— ShiftSwap`,
    });
    return { ok: res.data != null, error: res.error?.message };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send password reset email";
    console.error("Password reset email send failed:", e);
    return { ok: false, error: message };
  }
}

export async function sendSignupNotificationToAdmin(
  adminEmail: string,
  user: { firstName: string; lastName: string; email: string; position: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping signup notification");
    return { ok: false, error: "Email not configured" };
  }
  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `ShiftSwap: New signup – ${user.firstName} ${user.lastName}`,
      text: `A new user signed up for ShiftSwap:\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nPosition: ${user.position}\n\n-- ShiftSwap`,
    });
    return { ok: res.data != null, error: res.error?.message };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send signup notification";
    console.error("Signup notification send failed:", e);
    return { ok: false, error: message };
  }
}
