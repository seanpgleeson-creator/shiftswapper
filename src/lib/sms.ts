import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export type CoverSmsPayload = {
  posterPhone: string;
  covererName: string;
  covererPhone?: string | null;
};

/**
 * Send SMS to the poster when their shift is covered.
 * Message includes coverer name, coverer phone (if provided), and prompt to complete the swap in UKG.
 * If Twilio is not configured, skips send and returns { ok: false, error }.
 */
export async function sendCoverSms(
  payload: CoverSmsPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!client || !fromNumber) {
    const msg = "Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing); skipping SMS";
    console.warn("[CoverSMS]", msg);
    return { ok: false, error: "SMS not configured" };
  }

  const to = payload.posterPhone.trim();
  if (!to) {
    console.warn("[CoverSMS] No poster phone on shift; skipping SMS");
    return { ok: false, error: "No poster phone" };
  }

  const toE164 = to.includes("+") ? to : `+1${to.replace(/\D/g, "")}`;
  const phoneLine =
    payload.covererPhone?.trim() ?
      ` You can reach them at ${payload.covererPhone.trim()}.`
    : "";
  const body = `${payload.covererName} has covered your shift.${phoneLine} Please send this shift officially in UKG to complete the swap. — ShiftSwapper`;

  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to: toE164,
    });
    console.info("[CoverSMS] Sent to", toE164);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[CoverSMS] Twilio error sending to", toE164, ":", message);
    return { ok: false, error: message };
  }
}

/**
 * Send 6-digit verification code via SMS (e.g. for phone verification at signup).
 * If Twilio is not configured, skips send and returns { ok: false, error }.
 */
export async function sendPhoneVerificationCode(
  phone: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  if (!client || !fromNumber) {
    const msg = "Twilio not configured; skipping verification SMS";
    console.warn("[VerifySMS]", msg);
    return { ok: false, error: "SMS not configured" };
  }
  const to = phone.trim();
  if (!to) {
    return { ok: false, error: "No phone number" };
  }
  const toE164 = to.includes("+") ? to : `+1${to.replace(/\D/g, "")}`;
  const body = `Your ShiftSwapper verification code is: ${code}. It expires in 10 minutes.`;
  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to: toE164,
    });
    console.info("[VerifySMS] Sent code to", toE164);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[VerifySMS] Twilio error:", message);
    return { ok: false, error: message };
  }
}
