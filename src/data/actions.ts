import { parseDriverApplication, parseRegister, assertCanReview } from "@/domain/accounts";
import { DomainError } from "@/domain/errors";
import { evaluateMatch, type MatchQuery } from "@/domain/matching";
import {
  assertCanCancelRide,
  assertCanComplete,
  assertCanPostRide,
  assertCanRate,
  assertCanRequest,
  planAcceptance,
  planRelease,
} from "@/domain/rides";
import { assertNoFareLanguage, assertNoPaymentPayload, firstName, normalizeEmail } from "@/domain/text";
import { sendMailStub } from "@/adapters/mail";
import { verifyOtpStub } from "@/adapters/otp";
import { createId } from "./ids";
import { demoPasswordHash } from "./password";
import type {
  AppState,
  DriverProfile,
  Locale,
  Notification,
  Report,
  Ride,
  SeatRequest,
  User,
} from "./types";

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  phone: string;
  isPassenger: boolean;
  isDriver: boolean;
  locale: Locale;
};

export type PostRideBody = {
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  departureAt: string;
  seatsTotal: number;
  notes: string;
};

function mustUser(state: AppState, userId: string): User {
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new DomainError("NOT_FOUND", 404);
  if (user.status !== "active") throw new DomainError("USER_SUSPENDED", 403);
  return user;
}

function mustRide(state: AppState, rideId: string): Ride {
  const ride = state.rides.find((item) => item.id === rideId);
  if (!ride) throw new DomainError("NOT_FOUND", 404);
  return ride;
}

function replaceUser(state: AppState, user: User): AppState {
  return { ...state, users: state.users.map((item) => (item.id === user.id ? user : item)) };
}

function replaceRide(state: AppState, ride: Ride): AppState {
  return { ...state, rides: state.rides.map((item) => (item.id === ride.id ? ride : item)) };
}

function replaceRequest(state: AppState, request: SeatRequest): AppState {
  return {
    ...state,
    requests: state.requests.map((item) => (item.id === request.id ? request : item)),
  };
}

function note(
  user: User,
  kind: string,
  bodyKey: string,
  params: Record<string, string | number>,
  entityId: string,
  now: Date,
): Notification {
  sendMailStub(user.email, bodyKey);
  return {
    id: createId("note"),
    userId: user.id,
    kind,
    bodyKey,
    params,
    entityId,
    email: { delivered: false, channel: "stub", reason: "NO_MAIL_PROVIDER" },
    readAt: null,
    createdAt: now.toISOString(),
  };
}

function audit(state: AppState, actorId: string, action: string, entityType: string, entityId: string, now: Date): AppState {
  return {
    ...state,
    audit: [
      {
        id: createId("audit"),
        actorId,
        action,
        entityType,
        entityId,
        createdAt: now.toISOString(),
      },
      ...state.audit,
    ].slice(0, 80),
  };
}

export function currentUser(state: AppState): User | null {
  if (!state.sessionUserId) return null;
  return state.users.find((user) => user.id === state.sessionUserId) ?? null;
}

export function login(state: AppState, email: string, password: string): AppState {
  const user = state.users.find((item) => item.email === normalizeEmail(email));
  if (!user || user.passwordHash !== demoPasswordHash(password)) {
    throw new DomainError("INVALID_LOGIN", 401);
  }
  if (user.status === "suspended") throw new DomainError("USER_SUSPENDED", 403);
  return { ...state, sessionUserId: user.id };
}

export function logout(state: AppState): AppState {
  return { ...state, sessionUserId: null };
}

export function register(state: AppState, input: RegisterBody, now = new Date()): AppState {
  const parsed = parseRegister(input);
  if (state.users.some((user) => user.email === parsed.email)) {
    throw new DomainError("EMAIL_TAKEN", 409);
  }
  const stamp = now.toISOString();
  const user: User = {
    id: createId("user"),
    email: parsed.email,
    passwordHash: demoPasswordHash(parsed.password),
    name: parsed.name,
    phone: parsed.phone,
    phoneDemoConfirmed: false,
    locale: input.locale,
    isPassenger: parsed.isPassenger,
    isDriver: parsed.isDriver,
    isAdmin: false,
    status: "active",
    createdAt: stamp,
    updatedAt: stamp,
  };
  return { ...state, users: [...state.users, user], sessionUserId: user.id };
}

export function updateLocale(state: AppState, userId: string, locale: Locale): AppState {
  const user = mustUser(state, userId);
  return replaceUser(state, { ...user, locale, updatedAt: new Date().toISOString() });
}

export function enableRole(state: AppState, userId: string, role: "driver" | "passenger"): AppState {
  const user = mustUser(state, userId);
  return replaceUser(state, {
    ...user,
    isDriver: role === "driver" ? true : user.isDriver,
    isPassenger: role === "passenger" ? true : user.isPassenger,
    updatedAt: new Date().toISOString(),
  });
}

export function confirmPhone(state: AppState, userId: string, code: string): AppState {
  const user = mustUser(state, userId);
  if (!verifyOtpStub(code)) throw new DomainError("OTP_INVALID");
  return replaceUser(state, {
    ...user,
    phoneDemoConfirmed: true,
    updatedAt: new Date().toISOString(),
  });
}

export function submitDriverProfile(
  state: AppState,
  userId: string,
  input: Parameters<typeof parseDriverApplication>[0],
  now = new Date(),
): AppState {
  const user = mustUser(state, userId);
  if (!user.isDriver) throw new DomainError("NOT_A_DRIVER", 403);
  const existing = state.profiles.find((profile) => profile.userId === userId);
  if (existing?.status === "pending") throw new DomainError("ALREADY_PENDING");
  if (existing?.status === "approved") throw new DomainError("ALREADY_APPROVED");
  const parsed = parseDriverApplication(input, now);
  const stamp = now.toISOString();
  const profile: DriverProfile = {
    id: existing?.id ?? createId("profile"),
    userId,
    ...parsed,
    status: "pending",
    submittedAt: stamp,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };
  const profiles = existing
    ? state.profiles.map((item) => (item.userId === userId ? profile : item))
    : [...state.profiles, profile];
  return audit({ ...state, profiles }, userId, "driver.submit", "driver_profile", userId, now);
}

function requireAdmin(state: AppState, adminId: string): User {
  const admin = mustUser(state, adminId);
  if (!admin.isAdmin) throw new DomainError("NOT_ADMIN", 403);
  return admin;
}

export function approveDriver(state: AppState, adminId: string, driverUserId: string, now = new Date()): AppState {
  requireAdmin(state, adminId);
  assertCanReview(adminId, driverUserId);
  const profile = state.profiles.find((item) => item.userId === driverUserId);
  if (!profile) throw new DomainError("NOT_FOUND", 404);
  if (profile.status !== "pending") throw new DomainError("PROFILE_NOT_PENDING");
  const stamp = now.toISOString();
  const next: DriverProfile = {
    ...profile,
    status: "approved",
    reviewedAt: stamp,
    reviewedBy: adminId,
    rejectionReason: null,
  };
  const driver = state.users.find((user) => user.id === driverUserId);
  let notifications = state.notifications;
  if (driver) {
    notifications = [
      note(driver, "driver_approved", "driverApproved", {}, driverUserId, now),
      ...notifications,
    ];
  }
  return audit(
    {
      ...state,
      notifications,
      profiles: state.profiles.map((item) => (item.userId === driverUserId ? next : item)),
    },
    adminId,
    "driver.approve",
    "driver_profile",
    driverUserId,
    now,
  );
}

export function rejectDriver(
  state: AppState,
  adminId: string,
  driverUserId: string,
  reason: string,
  now = new Date(),
): AppState {
  requireAdmin(state, adminId);
  assertCanReview(adminId, driverUserId);
  const trimmed = reason.trim();
  if (trimmed.length < 3 || trimmed.length > 400) throw new DomainError("INVALID_REASON");
  const profile = state.profiles.find((item) => item.userId === driverUserId);
  if (!profile) throw new DomainError("NOT_FOUND", 404);
  if (profile.status !== "pending") throw new DomainError("PROFILE_NOT_PENDING");
  const stamp = now.toISOString();
  const next: DriverProfile = {
    ...profile,
    status: "rejected",
    reviewedAt: stamp,
    reviewedBy: adminId,
    rejectionReason: trimmed,
  };
  const driver = state.users.find((user) => user.id === driverUserId);
  let notifications = state.notifications;
  if (driver) {
    notifications = [note(driver, "driver_rejected", "driverRejected", { reason: trimmed }, driverUserId, now), ...notifications];
  }
  return audit(
    {
      ...state,
      notifications,
      profiles: state.profiles.map((item) => (item.userId === driverUserId ? next : item)),
    },
    adminId,
    "driver.reject",
    "driver_profile",
    driverUserId,
    now,
  );
}

export function suspendUser(state: AppState, adminId: string, userId: string, now = new Date()): AppState {
  requireAdmin(state, adminId);
  if (adminId === userId) throw new DomainError("CANNOT_SUSPEND_SELF", 403);
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new DomainError("NOT_FOUND", 404);
  return audit(
    replaceUser(state, { ...user, status: "suspended", updatedAt: now.toISOString() }),
    adminId,
    "user.suspend",
    "user",
    userId,
    now,
  );
}

export function restoreUser(state: AppState, adminId: string, userId: string, now = new Date()): AppState {
  requireAdmin(state, adminId);
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new DomainError("NOT_FOUND", 404);
  return audit(
    replaceUser(state, { ...user, status: "active", updatedAt: now.toISOString() }),
    adminId,
    "user.restore",
    "user",
    userId,
    now,
  );
}

export function postRide(state: AppState, userId: string, input: PostRideBody, now = new Date()): AppState {
  assertNoPaymentPayload(input);
  const user = mustUser(state, userId);
  const profile = state.profiles.find((item) => item.userId === userId) ?? null;
  const notes = input.notes.trim();
  assertCanPostRide({
    userStatus: user.status,
    driverStatus: profile?.status ?? null,
    vehicleSeats: profile?.vehicleSeats ?? 0,
    seatsTotal: input.seatsTotal,
    departureAt: new Date(input.departureAt),
    now,
    origin: { lat: input.originLat, lng: input.originLng },
    destination: { lat: input.destinationLat, lng: input.destinationLng },
    notes,
  });
  if (input.originLabel.trim().length < 2 || input.destinationLabel.trim().length < 2) {
    throw new DomainError("INVALID_PLACE");
  }
  const ride: Ride = {
    id: createId("ride"),
    driverId: userId,
    originLabel: input.originLabel.trim(),
    originLat: input.originLat,
    originLng: input.originLng,
    destinationLabel: input.destinationLabel.trim(),
    destinationLat: input.destinationLat,
    destinationLng: input.destinationLng,
    departureAt: new Date(input.departureAt).toISOString(),
    seatsTotal: input.seatsTotal,
    seatsTaken: 0,
    notes,
    status: "open",
    demo: false,
    createdAt: now.toISOString(),
  };
  return { ...state, rides: [ride, ...state.rides] };
}

export function cancelRide(state: AppState, userId: string, rideId: string, now = new Date()): AppState {
  const ride = mustRide(state, rideId);
  if (ride.driverId !== userId) throw new DomainError("FORBIDDEN", 403);
  assertCanCancelRide(ride.status);
  const stamp = now.toISOString();
  const notifications = [...state.notifications];
  const requests = state.requests.map((request) => {
    if (request.rideId !== rideId || (request.status !== "pending" && request.status !== "accepted")) {
      return request;
    }
    const passenger = state.users.find((user) => user.id === request.passengerId);
    if (passenger) {
      notifications.unshift(
        note(
          passenger,
          "ride_cancelled",
          "rideCancelled",
          { from: ride.originLabel, to: ride.destinationLabel },
          rideId,
          now,
        ),
      );
    }
    return { ...request, status: "cancelled" as const, decidedAt: stamp };
  });
  return audit(
    { ...replaceRide(state, { ...ride, status: "cancelled" }), requests, notifications },
    userId,
    "ride.cancel",
    "ride",
    rideId,
    now,
  );
}

export function completeRide(state: AppState, userId: string, rideId: string, now = new Date()): AppState {
  const ride = mustRide(state, rideId);
  if (ride.driverId !== userId) throw new DomainError("FORBIDDEN", 403);
  assertCanComplete(ride.status, new Date(ride.departureAt), now);
  const notifications = [...state.notifications];
  for (const request of state.requests) {
    if (request.rideId !== rideId || request.status !== "accepted") continue;
    const passenger = state.users.find((user) => user.id === request.passengerId);
    if (!passenger) continue;
    notifications.unshift(
      note(passenger, "ride_completed", "rideCompleted", { from: ride.originLabel, to: ride.destinationLabel }, rideId, now),
    );
  }
  return { ...replaceRide(state, { ...ride, status: "completed" }), notifications };
}

export function hideRide(state: AppState, adminId: string, rideId: string, now = new Date()): AppState {
  requireAdmin(state, adminId);
  const ride = mustRide(state, rideId);
  if (ride.status !== "open" && ride.status !== "full") throw new DomainError("RIDE_CLOSED");
  return audit(replaceRide(state, { ...ride, status: "hidden" }), adminId, "ride.hide", "ride", rideId, now);
}

export function requestSeat(
  state: AppState,
  userId: string,
  rideId: string,
  seats: number,
  message: string,
  now = new Date(),
): AppState {
  assertNoPaymentPayload({ message });
  const user = mustUser(state, userId);
  const ride = mustRide(state, rideId);
  const trimmed = message.trim();
  if (trimmed.length > 400) throw new DomainError("INVALID_MESSAGE");
  assertNoFareLanguage(trimmed);
  assertCanRequest({
    userStatus: user.status,
    isPassenger: user.isPassenger,
    passengerId: userId,
    driverId: ride.driverId,
    rideStatus: ride.status,
    seatsTotal: ride.seatsTotal,
    seatsTaken: ride.seatsTaken,
    seats,
    departureAt: new Date(ride.departureAt),
    now,
  });
  const live = state.requests.some(
    (request) =>
      request.rideId === rideId &&
      request.passengerId === userId &&
      (request.status === "pending" || request.status === "accepted"),
  );
  if (live) throw new DomainError("ALREADY_REQUESTED", 409);
  const request: SeatRequest = {
    id: createId("request"),
    rideId,
    passengerId: userId,
    seats,
    message: trimmed,
    status: "pending",
    createdAt: now.toISOString(),
    decidedAt: null,
  };
  const driver = state.users.find((item) => item.id === ride.driverId);
  const notifications = driver
    ? [
        note(
          driver,
          "request_received",
          "requestReceived",
          { name: firstName(user.name), seats, from: ride.originLabel, to: ride.destinationLabel },
          request.id,
          now,
        ),
        ...state.notifications,
      ]
    : state.notifications;
  return { ...state, requests: [request, ...state.requests], notifications };
}

export function acceptRequest(state: AppState, userId: string, requestId: string, now = new Date()): AppState {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new DomainError("NOT_FOUND", 404);
  const ride = mustRide(state, request.rideId);
  if (ride.driverId !== userId) throw new DomainError("FORBIDDEN", 403);
  const plan = planAcceptance(ride, request);
  const stamp = now.toISOString();
  const passenger = state.users.find((item) => item.id === request.passengerId);
  const notifications = passenger
    ? [
        note(
          passenger,
          "request_accepted",
          "requestAccepted",
          { from: ride.originLabel, to: ride.destinationLabel },
          ride.id,
          now,
        ),
        ...state.notifications,
      ]
    : state.notifications;
  return {
    ...replaceRide(replaceRequest(state, { ...request, status: "accepted", decidedAt: stamp }), {
      ...ride,
      seatsTaken: plan.seatsTaken,
      status: plan.rideStatus,
    }),
    notifications,
  };
}

export function declineRequest(state: AppState, userId: string, requestId: string, now = new Date()): AppState {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new DomainError("NOT_FOUND", 404);
  const ride = mustRide(state, request.rideId);
  if (ride.driverId !== userId) throw new DomainError("FORBIDDEN", 403);
  if (request.status !== "pending") throw new DomainError("REQUEST_CLOSED");
  const passenger = state.users.find((item) => item.id === request.passengerId);
  const notifications = passenger
    ? [
        note(
          passenger,
          "request_declined",
          "requestDeclined",
          { from: ride.originLabel, to: ride.destinationLabel },
          ride.id,
          now,
        ),
        ...state.notifications,
      ]
    : state.notifications;
  return {
    ...replaceRequest(state, { ...request, status: "declined", decidedAt: now.toISOString() }),
    notifications,
  };
}

export function withdrawRequest(state: AppState, userId: string, requestId: string, now = new Date()): AppState {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new DomainError("NOT_FOUND", 404);
  if (request.passengerId !== userId) throw new DomainError("FORBIDDEN", 403);
  const ride = mustRide(state, request.rideId);
  const plan = planRelease(ride, request);
  const driver = state.users.find((item) => item.id === ride.driverId);
  const passenger = mustUser(state, userId);
  const notifications = driver
    ? [
        note(
          driver,
          "request_withdrawn",
          "requestWithdrawn",
          { name: firstName(passenger.name), from: ride.originLabel, to: ride.destinationLabel },
          ride.id,
          now,
        ),
        ...state.notifications,
      ]
    : state.notifications;
  return {
    ...replaceRide(
      replaceRequest(state, { ...request, status: plan.requestStatus, decidedAt: now.toISOString() }),
      { ...ride, seatsTaken: plan.seatsTaken, status: plan.rideStatus as Ride["status"] },
    ),
    notifications,
  };
}

export function rateRide(
  state: AppState,
  userId: string,
  rideId: string,
  subjectId: string,
  stars: number,
  now = new Date(),
): AppState {
  const ride = mustRide(state, rideId);
  const acceptedPassengerIds = state.requests
    .filter((request) => request.rideId === rideId && request.status === "accepted")
    .map((request) => request.passengerId);
  assertCanRate({
    rideStatus: ride.status,
    authorId: userId,
    subjectId,
    driverId: ride.driverId,
    acceptedPassengerIds,
    stars,
  });
  const exists = state.ratings.some(
    (rating) => rating.rideId === rideId && rating.authorId === userId && rating.subjectId === subjectId,
  );
  if (exists) throw new DomainError("ALREADY_RATED", 409);
  return {
    ...state,
    ratings: [
      {
        id: createId("rating"),
        rideId,
        authorId: userId,
        subjectId,
        stars,
        createdAt: now.toISOString(),
      },
      ...state.ratings,
    ],
  };
}

export function fileReport(
  state: AppState,
  userId: string,
  input: { rideId?: string; subjectUserId?: string; category: Report["category"]; details: string },
  now = new Date(),
): AppState {
  mustUser(state, userId);
  const details = input.details.trim();
  if (details.length < 10 || details.length > 1000) throw new DomainError("INVALID_REPORT");
  if (!["safety", "no_show", "behaviour", "other"].includes(input.category)) {
    throw new DomainError("INVALID_REPORT");
  }
  const report: Report = {
    id: createId("report"),
    reporterId: userId,
    rideId: input.rideId ?? null,
    subjectUserId: input.subjectUserId ?? null,
    category: input.category,
    details,
    status: "open",
    createdAt: now.toISOString(),
  };
  return { ...state, reports: [report, ...state.reports] };
}

export function closeReport(state: AppState, adminId: string, reportId: string, now = new Date()): AppState {
  requireAdmin(state, adminId);
  const report = state.reports.find((item) => item.id === reportId);
  if (!report) throw new DomainError("NOT_FOUND", 404);
  return audit(
    {
      ...state,
      reports: state.reports.map((item) => (item.id === reportId ? { ...item, status: "closed" as const } : item)),
    },
    adminId,
    "report.close",
    "report",
    reportId,
    now,
  );
}

export function markNotificationsRead(state: AppState, userId: string, now = new Date()): AppState {
  const stamp = now.toISOString();
  return {
    ...state,
    notifications: state.notifications.map((item) =>
      item.userId === userId && !item.readAt ? { ...item, readAt: stamp } : item,
    ),
  };
}

export function searchRides(state: AppState, query: MatchQuery) {
  const hits = [];
  for (const ride of state.rides) {
    const driver = state.users.find((user) => user.id === ride.driverId);
    const profile = state.profiles.find((item) => item.userId === ride.driverId);
    const hit = evaluateMatch(
      {
        id: ride.id,
        driverId: ride.driverId,
        origin: { lat: ride.originLat, lng: ride.originLng },
        destination: { lat: ride.destinationLat, lng: ride.destinationLng },
        departureAt: new Date(ride.departureAt),
        seatsTotal: ride.seatsTotal,
        seatsTaken: ride.seatsTaken,
        status: ride.status,
        driverApproved: profile?.status === "approved",
        driverActive: driver?.status === "active",
      },
      query,
    );
    if (!hit || !driver || !profile) continue;
    hits.push({ ride, hit, driver, profile });
  }
  hits.sort((a, b) => {
    const byTime = Date.parse(a.ride.departureAt) - Date.parse(b.ride.departureAt);
    if (byTime !== 0) return byTime;
    return a.hit.score - b.hit.score;
  });
  return hits;
}

export function canSeeContact(state: AppState, ride: Ride, viewerId: string | null): boolean {
  if (!viewerId) return false;
  if (ride.driverId === viewerId) return true;
  return state.requests.some(
    (request) => request.rideId === ride.id && request.passengerId === viewerId && request.status === "accepted",
  );
}

export function averageStars(state: AppState, userId: string): number | null {
  const stars = state.ratings.filter((rating) => rating.subjectId === userId).map((rating) => rating.stars);
  if (stars.length === 0) return null;
  return Math.round((stars.reduce((sum, value) => sum + value, 0) / stars.length) * 10) / 10;
}
