import { haversineKm, projectOntoSegment, type LatLng } from "./geo";

export const ORIGIN_RADIUS_KM = 10;
export const DESTINATION_RADIUS_KM = 10;
export const CORRIDOR_KM = 4;

export type RideCandidate = {
  id: string;
  driverId: string;
  origin: LatLng;
  destination: LatLng;
  departureAt: Date;
  seatsTotal: number;
  seatsTaken: number;
  status: string;
  driverApproved: boolean;
  driverActive: boolean;
};

export type MatchQuery = {
  origin: LatLng;
  destination: LatLng;
  start: Date;
  end: Date;
  seats: number;
  excludeDriverId?: string;
  originRadiusKm?: number;
  destinationRadiusKm?: number;
  corridorKm?: number;
};

export type MatchHit = {
  originKm: number;
  destinationKm: number;
  via: "ends" | "corridor";
  score: number;
};

export function seatsRemaining(ride: { seatsTotal: number; seatsTaken: number }): number {
  return ride.seatsTotal - ride.seatsTaken;
}

export function evaluateMatch(ride: RideCandidate, query: MatchQuery): MatchHit | null {
  if (ride.status !== "open") return null;
  if (!ride.driverApproved || !ride.driverActive) return null;
  if (query.excludeDriverId && ride.driverId === query.excludeDriverId) return null;
  if (ride.departureAt < query.start || ride.departureAt > query.end) return null;
  if (seatsRemaining(ride) < query.seats) return null;

  const originRadius = query.originRadiusKm ?? ORIGIN_RADIUS_KM;
  const destinationRadius = query.destinationRadiusKm ?? DESTINATION_RADIUS_KM;
  const corridorKm = query.corridorKm ?? CORRIDOR_KM;

  const originKm = haversineKm(query.origin, ride.origin);
  const destinationKm = haversineKm(query.destination, ride.destination);
  const endsMatch = originKm <= originRadius && destinationKm <= destinationRadius;

  const pickup = projectOntoSegment(query.origin, ride.origin, ride.destination);
  const dropoff = projectOntoSegment(query.destination, ride.origin, ride.destination);
  const corridorMatch =
    pickup.distanceKm <= corridorKm &&
    dropoff.distanceKm <= corridorKm &&
    pickup.t <= 0.98 &&
    dropoff.t >= 0.02 &&
    pickup.t + 0.05 < dropoff.t;

  if (!endsMatch && !corridorMatch) return null;

  const score = originKm * 2 + destinationKm + (endsMatch ? 0 : 3);
  return {
    originKm,
    destinationKm,
    via: endsMatch ? "ends" : "corridor",
    score,
  };
}
