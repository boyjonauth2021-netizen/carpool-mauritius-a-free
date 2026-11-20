import { describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import {
  assertCanComplete,
  assertCanPostRide,
  assertCanRequest,
  planAcceptance,
  planRelease,
} from "@/domain/rides";
import { assertNoPaymentPayload, notesContainFare } from "@/domain/text";
import { parseRegister } from "@/domain/accounts";

const now = new Date("2026-11-20T08:00:00.000Z");
const later = new Date("2026-11-21T04:00:00.000Z");

const basePost = {
  userStatus: "active",
  driverStatus: "approved",
  vehicleSeats: 5,
  seatsTotal: 3,
  departureAt: later,
  now,
  origin: { lat: -20.161, lng: 57.501 },
  destination: { lat: -20.316, lng: 57.526 },
  notes: "Small bag is fine",
};

function code(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
  return "";
}

describe("posting rules", () => {
  it("allows an approved driver to post a future trip", () => {
    expect(() => assertCanPostRide(basePost)).not.toThrow();
  });

  it("blocks unapproved drivers, past trips, and fare language", () => {
    expect(code(() => assertCanPostRide({ ...basePost, driverStatus: "pending" }))).toBe(
      "DRIVER_NOT_APPROVED",
    );
    expect(code(() => assertCanPostRide({ ...basePost, userStatus: "suspended" }))).toBe(
      "USER_SUSPENDED",
    );
    expect(
      code(() => assertCanPostRide({ ...basePost, departureAt: new Date("2026-11-19T00:00:00.000Z") })),
    ).toBe("DEPARTURE_IN_PAST");
    expect(code(() => assertCanPostRide({ ...basePost, notes: "Rs 200 per seat" }))).toBe(
      "FARE_LANGUAGE",
    );
    expect(code(() => assertCanPostRide({ ...basePost, seatsTotal: 5 }))).toBe("SEATS_EXCEED_VEHICLE");
    expect(
      code(() =>
        assertCanPostRide({
          ...basePost,
          destination: { lat: -19.72, lng: 63.42 },
        }),
      ),
    ).toBe("OUTSIDE_MAURITIUS");
  });
});

describe("seats", () => {
  it("fills a ride when the last seat is accepted", () => {
    expect(planAcceptance({ status: "open", seatsTotal: 2, seatsTaken: 1 }, { status: "pending", seats: 1 })).toEqual({
      seatsTaken: 2,
      rideStatus: "full",
    });
  });

  it("refuses an acceptance that would overbook", () => {
    expect(
      code(() => planAcceptance({ status: "open", seatsTotal: 2, seatsTaken: 1 }, { status: "pending", seats: 2 })),
    ).toBe("NOT_ENOUGH_SEATS");
  });

  it("returns seats when an accepted passenger withdraws, and reopens a full ride", () => {
    expect(
      planRelease({ status: "full", seatsTotal: 2, seatsTaken: 2 }, { status: "accepted", seats: 1 }),
    ).toEqual({ seatsTaken: 1, rideStatus: "open", requestStatus: "cancelled" });
  });

  it("does not change seats when a pending request is withdrawn", () => {
    expect(
      planRelease({ status: "open", seatsTotal: 3, seatsTaken: 1 }, { status: "pending", seats: 2 }),
    ).toMatchObject({ seatsTaken: 1, requestStatus: "withdrawn" });
  });
});

describe("requests and completion", () => {
  it("blocks a passenger from booking their own ride or a suspended account", () => {
    const request = {
      userStatus: "active",
      isPassenger: true,
      passengerId: "p",
      driverId: "d",
      rideStatus: "open",
      seatsTotal: 3,
      seatsTaken: 0,
      seats: 1,
      departureAt: later,
      now,
    };
    expect(code(() => assertCanRequest({ ...request, passengerId: "d" }))).toBe("OWN_RIDE");
    expect(code(() => assertCanRequest({ ...request, userStatus: "suspended" }))).toBe("USER_SUSPENDED");
    expect(() => assertCanRequest(request)).not.toThrow();
  });

  it("allows completion only at or after departure", () => {
    expect(code(() => assertCanComplete("open", later, now))).toBe("TOO_EARLY");
    expect(() => assertCanComplete("full", later, later)).not.toThrow();
  });
});

describe("version A payment boundary", () => {
  it("rejects money-shaped payloads and fare wording", () => {
    expect(code(() => assertNoPaymentPayload({ price: 0 }))).toBe("PAYMENT_NOT_SUPPORTED");
    expect(code(() => assertNoPaymentPayload({ nested: { costShare: 10 } }))).toBe("PAYMENT_NOT_SUPPORTED");
    expect(() => assertNoPaymentPayload({ notes: "quiet ride" })).not.toThrow();
    expect(notesContainFare("See you at the cybercity")).toBe(false);
    expect(notesContainFare("tarif 150")).toBe(true);
  });
});

describe("registration", () => {
  it("normalises a Mauritius mobile and requires a role", () => {
    const parsed = parseRegister({
      name: "Asha Ramtohul",
      email: "Asha@Example.com",
      password: "a-long-password",
      phone: "5712 3344",
      isPassenger: true,
      isDriver: false,
    });
    expect(parsed.email).toBe("asha@example.com");
    expect(parsed.phone).toBe("+23057123344");
    expect(code(() => parseRegister({ ...parsed, isPassenger: false, isDriver: false, password: "a-long-password" }))).toBe(
      "ROLE_REQUIRED",
    );
  });
});
