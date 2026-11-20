import { createSeed, refreshDemoRides } from "./seed";
import type { AppState } from "./types";

export const STORAGE_KEY = "carpool-mauritius-a-v1";

export function loadPersisted(now = new Date()): AppState {
  if (typeof localStorage === "undefined") return createSeed(now);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeed(now);
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.users)) return createSeed(now);
    return refreshDemoRides(parsed, now);
  } catch {
    return createSeed(now);
  }
}

export function savePersisted(state: AppState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
