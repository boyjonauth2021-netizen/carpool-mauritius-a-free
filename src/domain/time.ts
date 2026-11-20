const MAURITIUS_OFFSET = "+04:00";

export function mauritiusToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Mauritius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function mauritiusInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${MAURITIUS_OFFSET}`);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isHm(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Search window in absolute time. A clock time narrows the Mauritius day. */
export function searchWindow(input: {
  date: string;
  time?: string;
  flexMinutes?: number;
}): { start: Date; end: Date } {
  if (!isIsoDate(input.date)) {
    throw new Error("BAD_DATE");
  }
  if (input.time) {
    if (!isHm(input.time)) throw new Error("BAD_TIME");
    const flex = input.flexMinutes ?? 90;
    const center = mauritiusInstant(input.date, input.time).getTime();
    return {
      start: new Date(center - flex * 60_000),
      end: new Date(center + flex * 60_000),
    };
  }
  return {
    start: new Date(`${input.date}T00:00:00${MAURITIUS_OFFSET}`),
    end: new Date(`${input.date}T23:59:59${MAURITIUS_OFFSET}`),
  };
}

export function formatMauritius(iso: string, locale: "en" | "fr"): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-MU" : "en-MU", {
    timeZone: "Indian/Mauritius",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
