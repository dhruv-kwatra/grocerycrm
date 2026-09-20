// Date/time rendering for every retail screen.
//
// These MUST pass an explicit timeZone. Most retail pages are server
// components, so `toLocale*` runs in Node on the server — which deploys in UTC.
// Without a timeZone it renders the store's timestamps in UTC: a day closed at
// 2:05pm IST displayed as "08:35 am". The instant in the DB is right; only the
// formatting was wrong.
//
// Note "en-IN" is the LOCALE (₹, day-month order, am/pm) — it does not imply a
// timezone. That's the trap this module exists to close.
export const STORE_TZ = "Asia/Kolkata";

const parse = (s: string | Date | null | undefined) => {
  if (!s) return null;
  const d = s instanceof Date ? s : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "15 Jul" — a timestamp or "YYYY-MM-DD" as the store's calendar day. */
export function fmtDate(s: string | Date | null | undefined, fallback = "—"): string {
  const d = parse(s);
  return d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: STORE_TZ }) : fallback;
}

/** "15 Jul 2026" — where the year matters (purchase history, last visit). */
export function fmtDateFull(s: string | Date | null | undefined, fallback = "—"): string {
  const d = parse(s);
  return d
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: STORE_TZ })
    : fallback;
}

/** "Wed, 15 Jul" — a day header where the year is obvious from context. */
export function fmtDateWeekday(s: string | Date | null | undefined, fallback = "—"): string {
  const d = parse(s);
  return d
    ? d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: STORE_TZ })
    : fallback;
}

/** "Wed, 15 Jul 2026" — for page headers. */
export function fmtDateLong(s: string | Date | null | undefined, fallback = "—"): string {
  const d = parse(s);
  return d
    ? d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: STORE_TZ })
    : fallback;
}

/** "02:05 pm" — store-local wall clock. */
export function fmtTime(s: string | Date | null | undefined, fallback = "—"): string {
  const d = parse(s);
  return d ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: STORE_TZ }) : fallback;
}

/** "15 Jul, 02:05 pm" — for feeds where the day alone is ambiguous. */
export function fmtDateTime(s: string | Date | null | undefined, fallback = "—"): string {
  const d = parse(s);
  return d
    ? d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: STORE_TZ })
    : fallback;
}
