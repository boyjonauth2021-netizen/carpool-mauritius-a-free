export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  is_passenger INTEGER NOT NULL DEFAULT 1,
  is_driver INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS driver_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_color TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  vehicle_seats INTEGER NOT NULL,
  licence_number TEXT NOT NULL,
  status TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(id),
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES users(id),
  origin_label TEXT NOT NULL,
  origin_lat REAL NOT NULL,
  origin_lng REAL NOT NULL,
  destination_label TEXT NOT NULL,
  destination_lat REAL NOT NULL,
  destination_lng REAL NOT NULL,
  departure_at TEXT NOT NULL,
  seats_total INTEGER NOT NULL,
  seats_taken INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS rides_departure ON rides(departure_at);
CREATE INDEX IF NOT EXISTS rides_status ON rides(status);

CREATE TABLE IF NOT EXISTS seat_requests (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL REFERENCES rides(id),
  passenger_id TEXT NOT NULL REFERENCES users(id),
  seats INTEGER NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  decided_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS seat_requests_one_live
  ON seat_requests(ride_id, passenger_id)
  WHERE status IN ('pending', 'accepted');

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL REFERENCES rides(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  subject_id TEXT NOT NULL REFERENCES users(id),
  stars INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (ride_id, author_id, subject_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  body_key TEXT NOT NULL,
  params_json TEXT NOT NULL DEFAULT '{}',
  entity_id TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  ride_id TEXT,
  subject_user_id TEXT,
  category TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;
