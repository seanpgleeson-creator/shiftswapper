import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM ?? "ShiftSwapper <onboarding@resend.dev>";

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

-- ShiftSwapper`;

  const schedulerBody = `Hi,

A shift has been picked up via ShiftSwapper. Please update the schedule.

  Date:      ${payload.shiftDate}
  Time:      ${payload.startTime} - ${payload.endTime}
  Location:  ${payload.location}
  Role:      ${payload.role}
  Originally posted by: ${payload.posterName}
  Covered by:           ${payload.covererName} (${payload.covererEmail})

-- ShiftSwapper`;

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
