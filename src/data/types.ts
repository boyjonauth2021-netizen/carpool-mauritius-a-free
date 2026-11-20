export type Locale = "en" | "fr";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  phoneDemoConfirmed: boolean;
  locale: Locale;
  isPassenger: boolean;
  isDriver: boolean;
  isAdmin: boolean;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
};

export type DriverProfile = {
  id: string;
  userId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  plateNumber: string;
  vehicleSeats: number;
  licenceNumber: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
};

export type RideStatus = "open" | "full" | "cancelled" | "completed" | "hidden";

export type Ride = {
  id: string;
  driverId: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  departureAt: string;
  seatsTotal: number;
  seatsTaken: number;
  notes: string;
  status: RideStatus;
  demo: boolean;
  createdAt: string;
};

export type RequestStatus = "pending" | "accepted" | "declined" | "withdrawn" | "cancelled";

export type SeatRequest = {
  id: string;
  rideId: string;
  passengerId: string;
  seats: number;
  message: string;
  status: RequestStatus;
  createdAt: string;
  decidedAt: string | null;
};

export type Rating = {
  id: string;
  rideId: string;
  authorId: string;
  subjectId: string;
  stars: number;
  createdAt: string;
};

export type MailReceipt = {
  delivered: false;
  channel: "stub";
  reason: "NO_MAIL_PROVIDER";
};

export type Notification = {
  id: string;
  userId: string;
  kind: string;
  bodyKey: string;
  params: Record<string, string | number>;
  entityId: string;
  email: MailReceipt;
  readAt: string | null;
  createdAt: string;
};

export type Report = {
  id: string;
  reporterId: string;
  rideId: string | null;
  subjectUserId: string | null;
  category: "safety" | "no_show" | "behaviour" | "other";
  details: string;
  status: "open" | "closed";
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type AppState = {
  version: 1;
  users: User[];
  profiles: DriverProfile[];
  rides: Ride[];
  requests: SeatRequest[];
  ratings: Rating[];
  notifications: Notification[];
  reports: Report[];
  audit: AuditEntry[];
  sessionUserId: string | null;
};
