import { describe, expect, it } from "vitest";
import { evaluateMatch, type RideCandidate } from "@/domain/matching";

const grandBaie = { lat: -20.013, lng: 57.58 };
const souillac = { lat: -20.517, lng: 57.525 };
const portLouis = { lat: -20.161, lng: 57.501 };
const curepipe = { lat: -20.316, lng: 57.526 };

function ride(overrides: Partial<RideCandidate> = {}): RideCandidate {
  return {
    id: "ride",
    driverId: "driver",
    origin: portLouis,
    destination: curepipe,
    departureAt: new Date("2026-11-21T04:00:00.000Z"),
    seatsTotal: 3,
    seatsTaken: 0,
    status: "open",
    driverApproved: true,
    driverActive: true,
    ...overrides,
  };
}

const window = {
  start: new Date("2026-11-21T00:00:00.000Z"),
  end: new Date("2026-11-21T20:00:00.000Z"),
};

describe("evaluateMatch", () => {
  it("matches trips whose ends are near the search", () => {
    const hit = evaluateMatch(ride(), {
      origin: { lat: -20.17, lng: 57.5 },
      destination: { lat: -20.31, lng: 57.53 },
      seats: 1,
      ...window,
    });
    expect(hit?.via).toBe("ends");
  });

  it("matches a pickup and drop-off along the corridor, in order", () => {
    const hit = evaluateMatch(
      ride({ origin: grandBaie, destination: souillac }),
      {
        origin: { lat: -20.265, lng: 57.552 },
        destination: { lat: -20.45, lng: 57.535 },
        seats: 1,
        ...window,
      },
    );
    expect(hit?.via).toBe("corridor");
  });

  it("rejects a corridor travelled backwards", () => {
    const hit = evaluateMatch(
      ride({ origin: grandBaie, destination: souillac }),
      {
        origin: { lat: -20.45, lng: 57.535 },
        destination: { lat: -20.265, lng: 57.552 },
        seats: 1,
        ...window,
      },
    );
    expect(hit).toBeNull();
  });

  it("rejects a trip that is far from both the ends and the line", () => {
    const hit = evaluateMatch(ride(), {
      origin: grandBaie,
      destination: { lat: -20.274, lng: 57.363 },
      seats: 1,
      ...window,
    });
    expect(hit).toBeNull();
  });

  it("rejects rides that are full, closed, unapproved, or outside the window", () => {
    const query = {
      origin: portLouis,
      destination: curepipe,
      seats: 1,
      ...window,
    };
    expect(evaluateMatch(ride({ seatsTaken: 3 }), query)).toBeNull();
    expect(evaluateMatch(ride({ status: "cancelled" }), query)).toBeNull();
    expect(evaluateMatch(ride({ driverApproved: false }), query)).toBeNull();
    expect(evaluateMatch(ride({ driverActive: false }), query)).toBeNull();
    expect(
      evaluateMatch(ride({ departureAt: new Date("2026-11-22T04:00:00.000Z") }), query),
    ).toBeNull();
    expect(evaluateMatch(ride(), { ...query, excludeDriverId: "driver" })).toBeNull();
  });
});
