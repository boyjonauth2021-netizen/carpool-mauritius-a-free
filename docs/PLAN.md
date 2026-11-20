# Carpool Mauritius — Version A implementation plan

Product: **Carpool Mauritius**, a free ride-matching web app for **Bojo Solutions** (Kevin Boyjonauth), Mauritius.

Scope lock: this repository is **version A only**. It matches drivers who are already travelling with passengers who want a seat. It does not sell rides, set fares, collect money, split costs, or run a paid or regulated mode. There is no payment code and no feature flag for versions B (paid rides) or C (regulated cost sharing).

## Shipped demo

The demo that builds and deploys is a **fully static** single-page app. Routes live in the URL hash. The public base path is `/carpool-mauritius-a-free/`. Trip data stays in `localStorage`. Matching, seats, verification, and the no-payment rule still live in `src/domain` and are covered by Vitest. GitHub Actions uploads the `dist/` folder to GitHub Pages. There is no server in the demo and no secret in the build.

`src/db/schema.ts` is the record shape a future server would store. The static demo does not open SQLite. Open legal questions and key names are in `docs/OPEN_QUESTIONS.md`.

## Spec source

The task pointed at an attached file, `Project_A_No_Payment.txt` (`/workspace/uploads/Project_A_No_Payment_8634.txt`). That file was not on disk when implementation started (no `/workspace` mount, and the text was not in Drive, Gmail, or the connected GitHub account). This plan follows the task message itself:

- Start with this plan: schema, external services, unresolved legal and product decisions.
- Build in small phases, with tests after each significant change.
- Keep business rules in a domain layer. Persistence and HTTP call that layer.
- Secrets stay out of git. `.env.example` has placeholder names only. No invented credentials and no invented legal permissions.
- MVP: English and French, driver and passenger roles, admin verification, ride posting and matching, Google Maps behind a key placeholder.
- Deployable on its own. Deploy steps live in the README.

Anything the missing file required beyond that list is recorded under open questions rather than guessed into the product.

## What version A is

A person posts a trip they are already taking. Another person asks for a seat. The driver accepts or declines. Phone numbers are shown only after acceptance. Bojo Solutions does not take a fee, because there is no fee.

The app must not:

- Store or display a price, fare, tip, wallet, payout, or cost share.
- Integrate a payment provider.
- Tell users they are licensed, insured, or approved by the National Land Transport Authority (NLTA) or any other authority.
- Claim that an admin click is a government identity check.

## Implementation choices (pending Kevin's confirmation)

These are product choices made so the MVP can run. They are not legal conclusions.

| Topic | Choice in this codebase |
| --- | --- |
| One account, two hats | A user may be a passenger and a driver. Admin is a separate role. |
| Who may post | Only an active user whose driver profile is `approved`. |
| Booking | No instant book. Passenger requests, driver accepts. |
| Seats | 1 to 6 offered seats. Offered seats must be less than the vehicle's seat count (one seat is the driver). |
| Match shape | Same-day window in `Indian/Mauritius` (UTC+4). Ends within 10 km, or both the passenger's origin and destination lie within 4 km of the driver's straight-line corridor and in order. |
| Identity shown early | First name, vehicle make, model, and colour. Phone and plate after acceptance. |
| Documents | Text fields only (licence number, plate, vehicle). No upload of identity scans in the MVP. |
| Ratings | One optional 1–5 rating after the ride is marked completed. No written public review wall. |
| Language | English and French. Kreol Morisien is not in this slice. |
| Data store | SQLite file on one node. Postgres is a later swap, not a second runtime. |
| Maps | Google when a key is present. Otherwise a built-in list of Mauritius localities and straight-line distance, labelled as approximate. |

## Phases

1. **Plan** — this document.
2. **Domain** — pure rules for verification, posting, matching, seat acceptance, cancellation, and the no-payment invariant. Vitest covers them before UI work.
3. **Data and auth** — SQLite schema, repositories, session cookie, password hashing.
4. **Services and HTTP** — ride, request, verification, admin, and report services. Route handlers validate input and call services.
5. **Maps** — `MapsProvider` with a Google implementation and a Mauritius fallback.
6. **UI** — EN/FR screens for search, post, request, driver verification, and admin review.
7. **Run and deploy** — seed, Dockerfile, README, tests, and a local dev server.

## Database schema

SQLite. Timestamps are ISO-8601 UTC text. Coordinates are decimal degrees (WGS84).

### `users`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | cuid-like random id |
| email | text unique | stored lowercased |
| password_hash | text | bcrypt |
| name | text | display name |
| phone | text | E.164-ish, Mauritius numbers expected |
| locale | text | `en` or `fr` |
| is_passenger | integer | 0/1 |
| is_driver | integer | 0/1 |
| is_admin | integer | 0/1 |
| status | text | `active` or `suspended` |
| created_at | text | |
| updated_at | text | |

### `driver_profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| user_id | text unique fk users | |
| vehicle_make | text | |
| vehicle_model | text | |
| vehicle_year | integer | |
| vehicle_color | text | |
| plate_number | text | free text; official format is an open question |
| vehicle_seats | integer | including the driver, 2–7 |
| licence_number | text | sensitive; not a verified government id |
| status | text | `pending`, `approved`, `rejected` |
| submitted_at | text | |
| reviewed_at | text nullable | |
| reviewed_by | text nullable fk users | |
| rejection_reason | text nullable | |

### `rides`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| driver_id | text fk users | |
| origin_label | text | |
| origin_lat, origin_lng | real | |
| destination_label | text | |
| destination_lat, destination_lng | real | |
| departure_at | text | UTC instant |
| seats_total | integer | |
| seats_taken | integer | accepted seats only |
| notes | text | no price language enforced in the service |
| status | text | `open`, `full`, `cancelled`, `completed`, `hidden` |
| created_at | text | |

There is no price column. A test fails if a later migration adds one named like fare, price, amount, or currency.

### `seat_requests`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| ride_id | text fk rides | |
| passenger_id | text fk users | |
| seats | integer | |
| message | text | |
| status | text | `pending`, `accepted`, `declined`, `withdrawn`, `cancelled` |
| created_at | text | |
| decided_at | text nullable | |

Unique partial index: one live (`pending` or `accepted`) request per passenger per ride.

### `ratings`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| ride_id | text | |
| author_id | text | |
| subject_id | text | |
| stars | integer | 1–5 |
| created_at | text | |

Unique (`ride_id`, `author_id`, `subject_id`).

### `notifications`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| user_id | text | |
| kind | text | `request_received`, `request_accepted`, `request_declined`, `request_withdrawn`, `ride_cancelled`, `ride_completed` |
| body_key | text | i18n key, not a free-form sentence, so both languages work |
| entity_id | text | |
| read_at | text nullable | |
| created_at | text | |

### `reports`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| reporter_id | text | |
| ride_id | text nullable | |
| subject_user_id | text nullable | |
| category | text | `safety`, `no_show`, `behaviour`, `other` |
| details | text | |
| status | text | `open` or `closed` |
| created_at | text | |

### `audit_log`

| Column | Type | Notes |
| --- | --- | --- |
| id | text pk | |
| actor_id | text nullable | |
| action | text | |
| entity_type | text | |
| entity_id | text | |
| created_at | text | |

## Domain rules

Module: `src/domain`. No database and no `fetch`.

- **Verification.** Posting requires `user.status = active` and `driver_profiles.status = approved`. A rejected driver may resubmit, which returns the profile to `pending`. Suspended users cannot request or post.
- **Posting.** Departure is in the future and at most 60 days ahead. Seats are 1–6 and strictly less than `vehicle_seats`. Coordinates must fall inside a bounding box around Mauritius (including Rodrigues is **not** required; see open questions). Notes are rejected if they contain currency amounts or fare words (`Rs`, `MUR`, `rupee`, `roupie`, `fare`, `tarif`, `prix`, `payment`).
- **Matching.** A ride is a candidate when it is `open`, the driver is approved and active, departure is inside the search window, remaining seats are enough, and the geometry rule above passes. The passenger's own rides are excluded. Sort by departure, then by origin distance.
- **Acceptance.** Only the driver, only from `pending`, only while the ride is `open`, only if remaining seats cover the request. Acceptance increases `seats_taken`. The ride becomes `full` when none remain. Other pending requests that no longer fit stay pending until someone acts, and accept then fails with `NOT_ENOUGH_SEATS`.
- **Withdrawal.** A passenger may withdraw a `pending` request, or cancel an `accepted` one before the driver completes the ride. Accepted seats return to the pool and a `full` ride reopens.
- **Driver cancel.** Sets the ride to `cancelled`. Accepted and pending requests are cancelled. No seat math survives.
- **Complete.** The driver may mark an `open` or `full` ride completed at or after departure. Both sides may then rate the other once.
- **No payment.** The ride input type has no money fields. `assertNoPaymentPayload` rejects objects that carry `price`, `fare`, `amount`, `currency`, `costShare`, or `payment`.

## HTTP surface

Cookie session (`cm_session`), httpOnly, HMAC with `AUTH_SECRET`. JSON bodies validated with zod.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | session |
| GET | `/api/auth/me` | session |
| PUT | `/api/account` | session, locale and phone |
| POST | `/api/driver-profile` | driver role |
| GET | `/api/driver-profile` | self |
| GET | `/api/places?q=` | public |
| POST | `/api/routes/preview` | public, returns distance and a maps-mode flag |
| POST | `/api/rides` | approved driver |
| GET | `/api/rides/search` | public |
| GET | `/api/rides/mine` | driver |
| GET | `/api/rides/:id` | public; contact fields depend on relationship |
| POST | `/api/rides/:id/cancel` | driver |
| POST | `/api/rides/:id/complete` | driver |
| POST | `/api/rides/:id/requests` | active passenger |
| GET | `/api/requests/mine` | passenger or driver |
| POST | `/api/requests/:id/accept` | driver |
| POST | `/api/requests/:id/decline` | driver |
| POST | `/api/requests/:id/cancel` | passenger |
| POST | `/api/ratings` | participant after completion |
| GET | `/api/notifications` | session |
| POST | `/api/notifications/read` | session |
| POST | `/api/reports` | session |
| GET | `/api/admin/overview` | admin |
| GET | `/api/admin/drivers?status=` | admin |
| POST | `/api/admin/drivers/:userId/approve` | admin |
| POST | `/api/admin/drivers/:userId/reject` | admin |
| POST | `/api/admin/users/:userId/suspend` | admin |
| POST | `/api/admin/users/:userId/restore` | admin |
| POST | `/api/admin/rides/:id/hide` | admin |
| GET | `/api/admin/reports` | admin |
| POST | `/api/admin/reports/:id/close` | admin |

## Screens

- `/` — what the service is, a search, open rides, and the free-matching promise.
- `/rides` — search results.
- `/rides/new` — post a trip (approved drivers).
- `/rides/[id]` — detail, request, accept.
- `/trips` — my posted trips and my seat requests.
- `/drive` — driver profile submission and status.
- `/login`, `/register`.
- `/safety` — practical safety notes, without insurance claims.
- `/legal/terms`, `/legal/privacy` — drafts marked as drafts.
- `/admin` — queue, users, reports.

English and French share one route tree. The locale is a cookie (`cm_locale`) plus the user's saved locale. A header switch sets both.

Empty, loading, and error states are real copy in both languages.

## External services and keys

| Env name | Used for | Required for MVP? |
| --- | --- | --- |
| `AUTH_SECRET` | Sign session cookies | Yes. Generate locally. Never commit. |
| `GOOGLE_MAPS_API_KEY` | Server Geocoding, Places Autocomplete, and Directions, biased to Mauritius (`country:mu`) | No. Fallback localities work without it. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript API in the browser. Restrict by HTTP referrer. | No. A schematic island map is shown instead. |
| `ADMIN_EMAIL` | Bootstrap admin email | Yes for a real deploy. |
| `ADMIN_PASSWORD` | Bootstrap admin password | Yes for a real deploy. |
| `DATABASE_PATH` | SQLite file path | Defaults to `data/carpool.sqlite`. |
| `SEED_DEMO` | When `1`, loads sample rides on an empty database | Local only. |
| `SEED_DEMO_PASSWORD` | Password for the demo driver and passenger | Only if `SEED_DEMO=1`. |
| `APP_URL` | Public origin, used in cookie security notes and README | Recommended in production. |

Not wired, and not pretend-wired:

- SMTP or SMS. Notifications are in-app only. A later provider would use something like `SMTP_URL`. No account is assumed.
- Object storage for licence photos.
- Sentry or any error vendor.
- NLTA, police, or insurance APIs. None are called.

Google Cloud setup, when Kevin is ready:

1. Create a GCP project and enable Maps JavaScript API, Places API, Geocoding API, and Directions API.
2. Create a server key (`GOOGLE_MAPS_API_KEY`) restricted to those APIs and to the server IP.
3. Create a browser key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) restricted to Maps JavaScript API and to the site referrer.
4. Billing must be enabled on the GCP project or Google will reject calls. This app does not store a card or a key.

## Deploy shape

One Node process serves the Next.js app and opens the SQLite file on a persistent disk. See the README for Docker and bare-process steps. No Redis, no separate worker, no payment webhook.

## Tests

Vitest, run with `npm test`.

- Matching geometry: near ends match, far ends do not, corridor order is respected, full rides do not match, past rides do not match.
- Seat acceptance and cancellation restore seats.
- Unapproved drivers cannot post. Suspended users cannot request.
- Fare-like notes and payment-shaped payloads are rejected.
- Schema SQL does not contain payment columns.

Service tests use a temporary SQLite file for register → approve → post → search → accept.

## Unresolved legal questions

Do not treat this software as permission to operate. A Mauritius lawyer should answer these before a public launch.

1. Does unpaid carpool matching need an NLTA licence, a public-service-vehicle licence, a contract-car permit, or another authorisation? Version A assumes it is a noticeboard. That assumption is unchecked.
2. Do ordinary motor insurance policies in Mauritius cover carrying a carpool passenger, even with no payment? The app must not tell users they are covered.
3. If drivers and passengers later exchange cash outside the app, does the product still count as unpaid? The software cannot see that. Counsel should decide what the terms forbid.
4. Who is the data controller: Kevin as a sole trader, or a company named Bojo Solutions? The registered name, BRN, and address are not in this repo and are not invented.
5. Data Protection Act 2017: does this processing need registration with the Data Protection Office? What is the lawful basis for storing a driving-licence number? How long are phones, plates, and ride history kept? Where is the server hosted, and is that a cross-border transfer?
6. Is 18 the right minimum age for both roles?
7. Are gender-filtered rides lawful? They are not built.
8. What duty arises if a user reports a safety incident? Who is told, and is there a duty to keep records for the police?
9. English and French drafts in `/legal` need counsel. Kreol may be expected by passengers even if it is not an official language of the terms.
10. Rodrigues and outer islands: are they in scope, and do the same transport rules apply?

## Unresolved product questions

1. Confirm the match radii (10 km ends, 4 km corridor) and whether detours should use real driving time once Google is connected.
2. Recurring commute templates (weekday 07:30) are not in the MVP. Want them next?
3. Should a request expire automatically a few hours before departure?
4. Phone verification (SMS) before showing a number?
5. Should passengers see the plate only when they meet, or after acceptance, as built?
6. Official Mauritius plate pattern, if one should be validated.
7. File upload of the licence and insurance certificate: which documents, who may view them, and where the files live.
8. May an admin be blocked from approving themselves? Currently an admin with a driver profile can be approved by any admin, including themselves. A second admin is safer.
9. Demo seed stays off unless `SEED_DEMO=1`. Confirm that production boot must refuse `SEED_DEMO`.
10. Brand: the UI says "Carpool Mauritius" with a Bojo Solutions byline. A shorter trade name was not specified.
11. Is passenger identity verification required, or only drivers?
12. Should completed rides stay searchable for people who shared them, or disappear from public search only (current behaviour: public search shows `open` rides only)?
