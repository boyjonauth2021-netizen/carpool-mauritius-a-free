export type LatLng = { lat: number; lng: number };

/** Mainland Mauritius. Rodrigues is outside this box on purpose. */
export const MAURITIUS_BOX = {
  minLat: -20.6,
  maxLat: -19.9,
  minLng: 57.25,
  maxLng: 57.85,
} as const;

const EARTH_KM = 6371;

export function inMauritius(point: LatLng): boolean {
  return (
    point.lat >= MAURITIUS_BOX.minLat &&
    point.lat <= MAURITIUS_BOX.maxLat &&
    point.lng >= MAURITIUS_BOX.minLng &&
    point.lng <= MAURITIUS_BOX.maxLng
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toLocalKm(point: LatLng, origin: LatLng): { x: number; y: number } {
  const lat0 = toRadians(origin.lat);
  return {
    x: toRadians(point.lng - origin.lng) * Math.cos(lat0) * EARTH_KM,
    y: toRadians(point.lat - origin.lat) * EARTH_KM,
  };
}

/**
 * Project `point` onto the straight segment from `start` to `end`.
 * `t` is 0 at the start and 1 at the end, and is not clamped.
 * `distanceKm` is the distance to the closest point on the segment.
 */
export function projectOntoSegment(
  point: LatLng,
  start: LatLng,
  end: LatLng,
): { t: number; distanceKm: number } {
  const origin = start;
  const p = toLocalKm(point, origin);
  const b = toLocalKm(end, origin);
  const ab2 = b.x * b.x + b.y * b.y;
  const t = ab2 === 0 ? 0 : (p.x * b.x + p.y * b.y) / ab2;
  const clamped = Math.max(0, Math.min(1, t));
  const dx = p.x - b.x * clamped;
  const dy = p.y - b.y * clamped;
  return { t, distanceKm: Math.sqrt(dx * dx + dy * dy) };
}
