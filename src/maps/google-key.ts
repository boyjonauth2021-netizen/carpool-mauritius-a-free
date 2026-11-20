/** A blank or placeholder value means the mock map stays on. */
export function usableMapsKey(raw: string | undefined | null): string | null {
  const key = raw?.trim() ?? "";
  if (!key) return null;
  if (/^(your-|replace|changeme|placeholder|xxx+|todo|paste)/i.test(key)) return null;
  if (key.includes("YOUR_")) return null;
  return key;
}

export function browserMapsKey(): string | null {
  const raw = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  return usableMapsKey(raw);
}
