import { haversineKm, type LatLng } from "@/domain/geo";

export type RouteEstimate = {
  mode: "mock-estimate";
  distanceKm: number;
  durationMin: number;
  assumedKmh: 40;
};

/** Straight-line estimate. This is not a driving route from Google. */
export function estimateRoute(origin: LatLng, destination: LatLng): RouteEstimate {
  const distanceKm = Math.round(haversineKm(origin, destination) * 10) / 10;
  const durationMin = Math.max(5, Math.round((distanceKm / 40) * 60));
  return { mode: "mock-estimate", distanceKm, durationMin, assumedKmh: 40 };
}
