import { DomainError } from "./errors";

const FARE_LANGUAGE =
  /(\d[\d\s.,]{0,8}\s*(rs\.?|mur|rupees?|roupies?))|((rs\.?|mur|₨)\s*\d)|\b(fares?|tarifs?|prix|payment|paiement)\b/i;

const MONEY_KEYS = new Set([
  "price",
  "fare",
  "amount",
  "currency",
  "costshare",
  "cost_share",
  "payment",
  "payout",
  "tip",
  "wallet",
]);

export function notesContainFare(notes: string): boolean {
  return FARE_LANGUAGE.test(notes);
}

export function assertNoFareLanguage(notes: string): void {
  if (notesContainFare(notes)) {
    throw new DomainError("FARE_LANGUAGE");
  }
}

/** Version A rejects any payload that tries to carry a price. */
export function assertNoPaymentPayload(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertNoPaymentPayload(item);
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalised = key.toLowerCase().replace(/[^a-z_]/g, "");
    if (MONEY_KEYS.has(normalised)) {
      throw new DomainError("PAYMENT_NOT_SUPPORTED");
    }
    if (child && typeof child === "object") assertNoPaymentPayload(child);
  }
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

export function normalizePhone(value: string): string | null {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (/^\+230\d{8}$/.test(compact)) return compact;
  if (/^\d{8}$/.test(compact)) return `+230${compact}`;
  return null;
}

export function normalizePlate(value: string): string | null {
  const plate = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!/^[A-Z0-9][A-Z0-9 ]{1,11}$/.test(plate)) return null;
  return plate;
}

export function normalizeLicence(value: string): string | null {
  const licence = value.trim().toUpperCase();
  if (licence.length < 4 || licence.length > 30) return null;
  if (!/^[A-Z0-9\-/ ]+$/.test(licence)) return null;
  return licence;
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name.trim();
}

export function assertPersonName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!/^[\p{L}][\p{L}\s'.-]{1,79}$/u.test(trimmed)) {
    throw new DomainError("INVALID_NAME");
  }
  return trimmed;
}
