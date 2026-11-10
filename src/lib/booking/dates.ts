import { rentalDays } from "@/lib/booking/platform-fee";

export const DEFAULT_PICKUP_HOUR = 10;
export const DEFAULT_PICKUP_TIME = "10:00";
export const DEFAULT_RETURN_TIME = "10:00";
export const DEFAULT_RENTAL_DAYS = 3;

export function timeSlots(stepMinutes = 30, fromHour = 6, toHour = 22): string[] {
  const slots: string[] = [];
  for (let hour = fromHour; hour <= toHour; hour++) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      if (hour === toHour && minute > 0) break;
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return slots;
}

export const BOOKING_TIME_SLOTS = timeSlots();
/** Opening hours in the office. Full day, 30-minute steps, 24-hour labels. */
export const OFFICE_TIME_SLOTS = [...timeSlots(30, 0, 23), "23:30"];

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
    return null;
  }
  return dt;
}

export function addDaysYmd(value: string, days: number): string {
  const dt = parseYmd(value);
  if (!dt) return value;
  dt.setDate(dt.getDate() + days);
  return ymd(dt);
}

export function defaultPickupYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return ymd(d);
}

export function defaultReturnYmd(pickup = defaultPickupYmd()): string {
  return addDaysYmd(pickup, DEFAULT_RENTAL_DAYS);
}

export function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function combineDateTime(ymdStr: string, time: string): Date | null {
  const dt = parseYmd(ymdStr);
  const tm = parseTime(time);
  if (!dt || !tm) return null;
  dt.setHours(tm.hours, tm.minutes, 0, 0);
  return dt;
}

/** Calendar date + time in the caller's local timezone. */
export function ymdToIso(
  value: string,
  timeOrHour: string | number = DEFAULT_PICKUP_TIME,
): string {
  const time =
    typeof timeOrHour === "number"
      ? `${String(timeOrHour).padStart(2, "0")}:00`
      : timeOrHour;
  const dt = combineDateTime(value, time);
  if (!dt) throw new RangeError(`Invalid date ${value}`);
  return dt.toISOString();
}

export function isoToYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return ymd(d);
}

export function isoToTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DEFAULT_PICKUP_TIME;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayYmd(): string {
  return ymd(new Date());
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatYmdLabel(value: string, withYear: boolean): string {
  const dt = parseYmd(value);
  if (!dt) return value;
  const label = `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
  return withYear ? `${label} ${dt.getFullYear()}` : label;
}

export function formatDateRange(startYmd: string, endYmd: string): string {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) return `${startYmd} – ${endYmd}`;
  const withYear = start.getFullYear() !== end.getFullYear();
  return `${formatYmdLabel(startYmd, withYear)} – ${formatYmdLabel(endYmd, withYear)}`;
}

export function isValidRange(pickup: string, returnDate: string): boolean {
  const start = parseYmd(pickup);
  const end = parseYmd(returnDate);
  return Boolean(start && end && end >= start);
}

export function isValidDateTimeRange(
  pickup: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
): boolean {
  const start = combineDateTime(pickup, pickupTime);
  const end = combineDateTime(returnDate, returnTime);
  return Boolean(start && end && end > start);
}

export function formatDateTimeLabel(ymdStr: string, time: string): string {
  const dt = parseYmd(ymdStr);
  if (!dt) return `${ymdStr} ${time}`;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}, ${time}`;
}

export type BookedDuration = {
  billedDays: number;
  label: string;
};

export function bookedDuration(start: Date, end: Date): BookedDuration {
  if (!(start instanceof Date) || !(end instanceof Date) || end <= start) {
    return { billedDays: 0, label: "Choose return after pickup" };
  }
  const billedDays = rentalDays(start, end);
  const ms = end.getTime() - start.getTime();
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const elapsed =
    days > 0 && hours > 0
      ? `${days} ${days === 1 ? "day" : "days"} ${hours} ${hours === 1 ? "hour" : "hours"}`
      : days > 0
        ? `${days} ${days === 1 ? "day" : "days"}`
        : `${Math.max(totalHours, 1)} ${totalHours === 1 ? "hour" : "hours"}`;
  const billed = `${billedDays} ${billedDays === 1 ? "day" : "days"}`;
  if (hours === 0 && days === billedDays) {
    return { billedDays, label: `${billed} booked` };
  }
  return { billedDays, label: `${elapsed} booked · billed as ${billed}` };
}

export function bookedDurationFromFields(
  pickup: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
): BookedDuration {
  const start = combineDateTime(pickup, pickupTime);
  const end = combineDateTime(returnDate, returnTime);
  if (!start || !end) return { billedDays: 0, label: "Choose return after pickup" };
  return bookedDuration(start, end);
}
