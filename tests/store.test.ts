import { describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import { searchWindow } from "@/domain/time";
import {
  acceptRequest,
  approveDriver,
  canSeeContact,
  login,
  postRide,
  requestSeat,
  searchRides,
  withdrawRequest,
} from "@/data/actions";
import { DEMO_ACCOUNTS, createSeed } from "@/data/seed";
import { placeByLabel } from "@/maps/places";

const now = new Date("2026-11-20T06:00:00.000Z");

function code(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
  return "";
}

describe("demo ride flow", () => {
  it("lets a passenger request a seat and a driver accept it", () => {
    let state = createSeed(now);
    state = login(state, DEMO_ACCOUNTS.passenger.email, DEMO_ACCOUNTS.passenger.password);
    const ride = state.rides.find((item) => item.id === "demo-ride-grand-baie");
    expect(ride).toBeTruthy();
    state = requestSeat(state, "demo-liam", ride!.id, 1, "I will wait by the entrance.", now);
    state = login(state, DEMO_ACCOUNTS.driver.email, DEMO_ACCOUNTS.driver.password);
    const request = state.requests.find((item) => item.rideId === ride!.id && item.status === "pending");
    state = acceptRequest(state, "demo-asha", request!.id, now);
    const updated = state.rides.find((item) => item.id === ride!.id)!;
    expect(updated.seatsTaken).toBe(1);
    expect(canSeeContact(state, updated, "demo-liam")).toBe(true);
    expect(canSeeContact(state, updated, "demo-admin")).toBe(false);
    const passengerNote = state.notifications.find((item) => item.userId === "demo-liam" && item.kind === "request_accepted");
    expect(passengerNote?.email.delivered).toBe(false);

    state = withdrawRequest(state, "demo-liam", request!.id, now);
    expect(state.rides.find((item) => item.id === ride!.id)?.seatsTaken).toBe(0);
  });

  it("blocks an unapproved driver, a fare, and a payment field", () => {
    let state = createSeed(now);
    const curepipe = placeByLabel("Curepipe");
    const portLouis = placeByLabel("Port Louis");
    const body = {
      originLabel: curepipe.label,
      originLat: curepipe.lat,
      originLng: curepipe.lng,
      destinationLabel: portLouis.label,
      destinationLat: portLouis.lat,
      destinationLng: portLouis.lng,
      departureAt: new Date("2026-11-21T04:00:00.000Z").toISOString(),
      seatsTotal: 2,
      notes: "Quiet car",
    };
    expect(code(() => postRide(state, "demo-dev", body, now))).toBe("DRIVER_NOT_APPROVED");
    state = login(state, DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
    expect(code(() => approveDriver(state, "demo-admin", "demo-admin", now))).toBe("CANNOT_REVIEW_SELF");
    state = approveDriver(state, "demo-admin", "demo-dev", now);
    expect(code(() => postRide(state, "demo-dev", { ...body, notes: "Rs 200" }, now))).toBe("FARE_LANGUAGE");
    expect(code(() => postRide(state, "demo-dev", { ...body, price: 0 } as typeof body, now))).toBe(
      "PAYMENT_NOT_SUPPORTED",
    );
    state = postRide(state, "demo-dev", body, now);
    expect(state.rides.some((ride) => ride.driverId === "demo-dev" && !("price" in ride))).toBe(true);
  });

  it("finds the seeded Curepipe to Ebène trip", () => {
    const state = createSeed(now);
    const ride = state.rides.find((item) => item.id === "demo-ride-curepipe")!;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Indian/Mauritius",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(ride.departureAt));
    const window = searchWindow({ date: day });
    const hits = searchRides(state, {
      origin: { lat: ride.originLat, lng: ride.originLng },
      destination: { lat: ride.destinationLat, lng: ride.destinationLng },
      start: window.start,
      end: window.end,
      seats: 1,
    });
    expect(hits.map((hit) => hit.ride.id)).toContain("demo-ride-curepipe");
  });
});
