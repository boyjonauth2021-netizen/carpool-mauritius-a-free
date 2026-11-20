import { addDays, mauritiusInstant, mauritiusToday } from "@/domain/time";
import { placeByLabel } from "@/maps/places";
import { demoPasswordHash } from "./password";
import type { AppState, Ride, SeatRequest, User } from "./types";

export const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@demo.local",
    password: "demo-admin-pass",
    name: "Demo Admin",
  },
  driver: {
    email: "asha@demo.local",
    password: "demo-driver-pass",
    name: "Asha Ramtohul",
  },
  pending: {
    email: "dev@demo.local",
    password: "demo-pending-pass",
    name: "Dev Boolaky",
  },
  passenger: {
    email: "liam@demo.local",
    password: "demo-passenger-pass",
    name: "Liam Baptiste",
  },
} as const;

function user(partial: Omit<User, "passwordHash" | "createdAt" | "updatedAt" | "phoneDemoConfirmed" | "locale"> & {
  password: string;
  createdAt: string;
}): User {
  return {
    id: partial.id,
    email: partial.email,
    passwordHash: demoPasswordHash(partial.password),
    name: partial.name,
    phone: partial.phone,
    phoneDemoConfirmed: false,
    locale: "en",
    isPassenger: partial.isPassenger,
    isDriver: partial.isDriver,
    isAdmin: partial.isAdmin,
    status: partial.status,
    createdAt: partial.createdAt,
    updatedAt: partial.createdAt,
  };
}

export function createSeed(now = new Date()): AppState {
  const stamp = now.toISOString();
  const today = mauritiusToday(now);
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  const curepipe = placeByLabel("Curepipe");
  const ebene = placeByLabel("Ebène Cybercity");
  const grandBaie = placeByLabel("Grand Baie");
  const portLouis = placeByLabel("Port Louis");
  const quatreBornes = placeByLabel("Quatre Bornes");

  const users: User[] = [
    user({
      id: "demo-admin",
      email: DEMO_ACCOUNTS.admin.email,
      password: DEMO_ACCOUNTS.admin.password,
      name: DEMO_ACCOUNTS.admin.name,
      phone: "+23059001001",
      isPassenger: true,
      isDriver: false,
      isAdmin: true,
      status: "active",
      createdAt: stamp,
    }),
    user({
      id: "demo-asha",
      email: DEMO_ACCOUNTS.driver.email,
      password: DEMO_ACCOUNTS.driver.password,
      name: DEMO_ACCOUNTS.driver.name,
      phone: "+23057110002",
      isPassenger: true,
      isDriver: true,
      isAdmin: false,
      status: "active",
      createdAt: stamp,
    }),
    user({
      id: "demo-dev",
      email: DEMO_ACCOUNTS.pending.email,
      password: DEMO_ACCOUNTS.pending.password,
      name: DEMO_ACCOUNTS.pending.name,
      phone: "+23057110003",
      isPassenger: false,
      isDriver: true,
      isAdmin: false,
      status: "active",
      createdAt: stamp,
    }),
    user({
      id: "demo-liam",
      email: DEMO_ACCOUNTS.passenger.email,
      password: DEMO_ACCOUNTS.passenger.password,
      name: DEMO_ACCOUNTS.passenger.name,
      phone: "+23057110004",
      isPassenger: true,
      isDriver: false,
      isAdmin: false,
      status: "active",
      createdAt: stamp,
    }),
  ];

  const rides: Ride[] = [
    {
      id: "demo-ride-curepipe",
      driverId: "demo-asha",
      originLabel: curepipe.label,
      originLat: curepipe.lat,
      originLng: curepipe.lng,
      destinationLabel: ebene.label,
      destinationLat: ebene.lat,
      destinationLng: ebene.lng,
      departureAt: mauritiusInstant(tomorrow, "07:30").toISOString(),
      seatsTotal: 3,
      seatsTaken: 0,
      notes: "Leaving from the Jan Palach bus stop side. Small bag is fine.",
      status: "open",
      demo: true,
      createdAt: stamp,
    },
    {
      id: "demo-ride-grand-baie",
      driverId: "demo-asha",
      originLabel: grandBaie.label,
      originLat: grandBaie.lat,
      originLng: grandBaie.lng,
      destinationLabel: portLouis.label,
      destinationLat: portLouis.lat,
      destinationLng: portLouis.lng,
      departureAt: mauritiusInstant(tomorrow, "08:15").toISOString(),
      seatsTotal: 2,
      seatsTaken: 0,
      notes: "I stop at the Super U car park entrance.",
      status: "open",
      demo: true,
      createdAt: stamp,
    },
    {
      id: "demo-ride-quatre-bornes",
      driverId: "demo-asha",
      originLabel: quatreBornes.label,
      originLat: quatreBornes.lat,
      originLng: quatreBornes.lng,
      destinationLabel: portLouis.label,
      destinationLat: portLouis.lat,
      destinationLng: portLouis.lng,
      departureAt: mauritiusInstant(dayAfter, "17:45").toISOString(),
      seatsTotal: 2,
      seatsTaken: 0,
      notes: "Evening return. No smoking.",
      status: "open",
      demo: true,
      createdAt: stamp,
    },
  ];

  const requests: SeatRequest[] = [
    {
      id: "demo-request-liam",
      rideId: "demo-ride-curepipe",
      passengerId: "demo-liam",
      seats: 1,
      message: "I can be at the bus stop five minutes early.",
      status: "pending",
      createdAt: stamp,
      decidedAt: null,
    },
  ];

  return {
    version: 1,
    users,
    profiles: [
      {
        id: "demo-profile-asha",
        userId: "demo-asha",
        vehicleMake: "Toyota",
        vehicleModel: "Vitz",
        vehicleYear: 2018,
        vehicleColor: "Silver",
        plateNumber: "DEMO 1001",
        vehicleSeats: 5,
        licenceNumber: "DEMO-LIC-1001",
        status: "approved",
        submittedAt: stamp,
        reviewedAt: stamp,
        reviewedBy: "demo-admin",
        rejectionReason: null,
      },
      {
        id: "demo-profile-dev",
        userId: "demo-dev",
        vehicleMake: "Nissan",
        vehicleModel: "March",
        vehicleYear: 2016,
        vehicleColor: "Blue",
        plateNumber: "DEMO 1002",
        vehicleSeats: 5,
        licenceNumber: "DEMO-LIC-1002",
        status: "pending",
        submittedAt: stamp,
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      },
    ],
    rides,
    requests,
    ratings: [],
    notifications: [
      {
        id: "demo-note-asha",
        userId: "demo-asha",
        kind: "request_received",
        bodyKey: "requestReceived",
        params: { name: "Liam", seats: 1, from: curepipe.label, to: ebene.label },
        entityId: "demo-request-liam",
        email: { delivered: false, channel: "stub", reason: "NO_MAIL_PROVIDER" },
        readAt: null,
        createdAt: stamp,
      },
    ],
    reports: [],
    audit: [
      {
        id: "demo-audit-asha",
        actorId: "demo-admin",
        action: "driver.approve",
        entityType: "driver_profile",
        entityId: "demo-asha",
        createdAt: stamp,
      },
    ],
    sessionUserId: null,
  };
}

export function refreshDemoRides(state: AppState, now = new Date()): AppState {
  const demoRides = state.rides.filter((ride) => ride.demo);
  const latest = demoRides.reduce((max, ride) => Math.max(max, Date.parse(ride.departureAt)), 0);
  if (demoRides.length > 0 && latest > now.getTime()) return state;
  const fresh = createSeed(now);
  const demoIds = new Set(demoRides.map((ride) => ride.id));
  return {
    ...state,
    rides: [...state.rides.filter((ride) => !ride.demo), ...fresh.rides],
    requests: [...state.requests.filter((request) => !demoIds.has(request.rideId)), ...fresh.requests],
  };
}
