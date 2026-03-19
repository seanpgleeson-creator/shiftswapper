import { DateTime } from "luxon";

export type ShiftForCalendar = {
  shiftDate: Date;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  location: string;
  role: string;
  posterName: string;
};

/**
 * Build a Google Calendar "Add event" URL for a shift.
 * Converts shift date/time from the given timezone to UTC for the URL.
 */
export function buildGoogleCalendarUrl(
  shift: ShiftForCalendar,
  timezone: string = "America/Chicago"
): string {
  const [startH, startM] = shift.startTime.split(":").map(Number);
  const [endH, endM] = shift.endTime.split(":").map(Number);
  const d = shift.shiftDate;
  const startDt = DateTime.fromObject(
    {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: startH,
      minute: startM,
      second: 0,
    },
    { zone: timezone }
  );
  const endDt = DateTime.fromObject(
    {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: endH,
      minute: endM,
      second: 0,
    },
    { zone: timezone }
  );
  const startUtc = startDt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const endUtc = endDt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");

  const base = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Pharmacy Shift - ${shift.location} (${shift.role})`,
    dates: `${startUtc}/${endUtc}`,
    details: `Covered via ShiftSwap. Originally posted by ${shift.posterName}.`,
    location: shift.location,
  });
  return `${base}?${params.toString()}`;
}
