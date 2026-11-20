import { DomainError } from "./errors";
import { inMauritius, haversineKm, type LatLng } from "./geo";
import { assertNoFareLanguage } from "./text";
import { seatsRemaining } from "./matching";

const MAX_HORIZON_MS = 60 * 24 * 60 * 60 * 1000;
const MIN_TRIP_KM = 1;

export type PostRideInput = {
  userStatus: string;
  driverStatus: string | null;
  vehicleSeats: number;
  seatsTotal: number;
  departureAt: Date;
  now: Date;
  origin: LatLng;
  destination: LatLng;
  notes: string;
};

export function assertCanPostRide(input: PostRideInput): void {
  if (input.userStatus !== "active") throw new DomainError("USER_SUSPENDED", 403);
  if (input.driverStatus !== "approved") throw new DomainError("DRIVER_NOT_APPROVED", 403);
  if (!Number.isInteger(input.seatsTotal) || input.seatsTotal < 1 || input.seatsTotal > 6) {
    throw new DomainError("INVALID_SEATS");
  }
  if (
    !Number.isInteger(input.vehicleSeats) ||
    input.vehicleSeats < 2 ||
    input.vehicleSeats > 7
  ) {
    throw new DomainError("INVALID_VEHICLE");
  }
  if (input.seatsTotal >= input.vehicleSeats) {
    throw new DomainError("SEATS_EXCEED_VEHICLE");
  }
  const delta = input.departureAt.getTime() - input.now.getTime();
  if (Number.isNaN(input.departureAt.getTime()) || delta <= 0) {
    throw new DomainError("DEPARTURE_IN_PAST");
  }
  if (delta > MAX_HORIZON_MS) throw new DomainError("DEPARTURE_TOO_FAR");
  if (!inMauritius(input.origin) || !inMauritius(input.destination)) {
    throw new DomainError("OUTSIDE_MAURITIUS");
  }
  if (haversineKm(input.origin, input.destination) < MIN_TRIP_KM) {
    throw new DomainError("TRIP_TOO_SHORT");
  }
  assertNoFareLanguage(input.notes);
}

export function assertCanRequest(input: {
  userStatus: string;
  isPassenger: boolean;
  passengerId: string;
  driverId: string;
  rideStatus: string;
  seatsTotal: number;
  seatsTaken: number;
  seats: number;
  departureAt: Date;
  now: Date;
}): void {
  if (input.userStatus !== "active") throw new DomainError("USER_SUSPENDED", 403);
  if (!input.isPassenger) throw new DomainError("NOT_A_PASSENGER", 403);
  if (input.passengerId === input.driverId) throw new DomainError("OWN_RIDE", 403);
  if (input.rideStatus !== "open") throw new DomainError("RIDE_CLOSED");
  if (input.departureAt.getTime() <= input.now.getTime()) {
    throw new DomainError("DEPARTURE_IN_PAST");
  }
  if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 6) {
    throw new DomainError("INVALID_SEATS");
  }
  if (input.seats > seatsRemaining(input)) throw new DomainError("NOT_ENOUGH_SEATS", 409);
}

export function planAcceptance(
  ride: { status: string; seatsTotal: number; seatsTaken: number },
  request: { status: string; seats: number },
): { seatsTaken: number; rideStatus: "open" | "full" } {
  if (request.status !== "pending") throw new DomainError("REQUEST_CLOSED");
  if (ride.status !== "open") throw new DomainError("RIDE_CLOSED");
  if (request.seats > seatsRemaining(ride)) throw new DomainError("NOT_ENOUGH_SEATS", 409);
  const seatsTaken = ride.seatsTaken + request.seats;
  return { seatsTaken, rideStatus: seatsTaken >= ride.seatsTotal ? "full" : "open" };
}

export function planRelease(
  ride: { status: string; seatsTotal: number; seatsTaken: number },
  request: { status: string; seats: number },
): { seatsTaken: number; rideStatus: string; requestStatus: "withdrawn" | "cancelled" } {
  if (request.status !== "pending" && request.status !== "accepted") {
    throw new DomainError("REQUEST_CLOSED");
  }
  if (ride.status === "completed" || ride.status === "cancelled") {
    throw new DomainError("RIDE_CLOSED");
  }
  if (request.status === "pending") {
    return { seatsTaken: ride.seatsTaken, rideStatus: ride.status, requestStatus: "withdrawn" };
  }
  const seatsTaken = ride.seatsTaken - request.seats;
  if (seatsTaken < 0) throw new DomainError("SEAT_MATH");
  if (ride.status === "hidden") {
    return { seatsTaken, rideStatus: "hidden", requestStatus: "cancelled" };
  }
  return {
    seatsTaken,
    rideStatus: seatsTaken >= ride.seatsTotal ? "full" : "open",
    requestStatus: "cancelled",
  };
}

export function assertCanCancelRide(status: string): void {
  if (status !== "open" && status !== "full") throw new DomainError("RIDE_CLOSED");
}

export function assertCanComplete(status: string, departureAt: Date, now: Date): void {
  if (status !== "open" && status !== "full") throw new DomainError("RIDE_CLOSED");
  if (now.getTime() < departureAt.getTime()) throw new DomainError("TOO_EARLY");
}

export function assertCanRate(input: {
  rideStatus: string;
  authorId: string;
  subjectId: string;
  driverId: string;
  acceptedPassengerIds: string[];
  stars: number;
}): void {
  if (input.rideStatus !== "completed") throw new DomainError("RIDE_NOT_COMPLETE");
  if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
    throw new DomainError("INVALID_STARS");
  }
  if (input.authorId === input.subjectId) throw new DomainError("INVALID_RATING");
  const participants = new Set([input.driverId, ...input.acceptedPassengerIds]);
  if (!participants.has(input.authorId) || !participants.has(input.subjectId)) {
    throw new DomainError("NOT_A_PARTICIPANT", 403);
  }
  const authorIsDriver = input.authorId === input.driverId;
  const subjectIsDriver = input.subjectId === input.driverId;
  if (authorIsDriver === subjectIsDriver) throw new DomainError("INVALID_RATING");
}

export function assertVehicleYear(year: number, now = new Date()): void {
  const max = now.getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1990 || year > max) {
    throw new DomainError("INVALID_VEHICLE");
  }
}
