# Carpool Mauritius — version A

Free ride matching for **Bojo Solutions** in Mauritius. Drivers post trips they are already taking. Passengers ask for a seat. The driver accepts or declines. Phone numbers appear only after a yes.

This repository is **only version A**. It does not set a fare, take a payment, split costs, or include a paid-ride or regulated cost-sharing mode.

The demo is a fully static site. It runs in the browser with sample accounts. Maps, SMS, and email are stubs. Nothing in the build is a secret.

## Run it locally

```bash
npm ci
npm test
npm run dev
```

Open [http://127.0.0.1:41731/carpool-mauritius-a-free/](http://127.0.0.1:41731/carpool-mauritius-a-free/).

The sign-in screen lists the sample accounts (passenger, approved driver, driver waiting for review, and administrator). They are fake people for the demo. Use **Reset demo data** in the footer to restore the sample trips.

Copy `.env.example` to `.env` only if you want to try a Google Maps browser key. The app works with the file missing.

## Build the static site

```bash
npm test
npm run build
```

The static output folder is **`dist/`**. `npm run build` also copies `dist/index.html` to `dist/404.html`.

Preview that folder:

```bash
npm run preview
```

Same URL as dev: [http://127.0.0.1:41731/carpool-mauritius-a-free/](http://127.0.0.1:41731/carpool-mauritius-a-free/).

The build is fully static. There is no Node server in production, no database, and no secret. Routes are hash URLs (`#/rides`, `#/admin`, …) so GitHub Pages does not need a rewrite. The base path is `/carpool-mauritius-a-free/`.

## Deploy to GitHub Pages

The live demo target is:

https://boyjonauth2021-netizen.github.io/carpool-mauritius-a-free/

1. Push this project to the GitHub repository `boyjonauth2021-netizen/carpool-mauritius-a-free` on branch `main`.
2. In that repository, open **Settings → Pages → Build and deployment**, and set **Source** to **GitHub Actions**.
3. `.github/workflows/pages.yml` runs on every push to `main`. It installs dependencies, runs `npm test`, runs `npm run build`, and deploys the `dist/` folder.

The workflow does not set `VITE_GOOGLE_MAPS_API_KEY`, so the published demo keeps the stub map.

## What you can do in the demo

- Switch English and French.
- Sign in with one click as a passenger, an approved driver, a driver waiting for review, or the administrator.
- Search mainland Mauritius places and see matching trips.
- Ask for a seat, accept or decline, and see the phone and plate only after acceptance.
- Submit driver details and approve or send them back. Approval is labelled as an internal demo check, not an NLTA licence and not insurance.
- Post a trip. Notes that mention a fare are rejected. There is no price field.
- Save a report, rate a completed trip, and confirm a phone with the stub code `000000`. No SMS is sent.

## What is stubbed

| Piece | Demo behaviour |
| --- | --- |
| Accounts and trips | Stored in this browser only (`localStorage`). |
| Maps | A list of Mauritius localities and a schematic island. Straight-line distance, not a driving route. |
| Google Maps | Used only if `VITE_GOOGLE_MAPS_API_KEY` is set at build time. The key would be visible in the JavaScript, so it must be a referrer-restricted browser key. |
| SMS | Stub code `000000`, shown on the account page. |
| Email | Notices stay on screen and say that mail was not sent. |
| Payments | Not implemented. Version A has no payment code. |

## Keys

See `.env.example` and `docs/OPEN_QUESTIONS.md`. The only optional key is `VITE_GOOGLE_MAPS_API_KEY`. No SMS, email, database, or payment key is required, and none is invented here.

## Tests

```bash
npm test
```

Vitest covers matching geometry, seat acceptance, the ban on fare language and payment fields, the demo request-and-accept flow, and the mail, SMS, and map stubs.

## Layout

- `src/domain` — rules with no browser and no network.
- `src/data` — sample seed and the browser store. The store calls the domain.
- `src/maps` and `src/adapters` — mock places, the optional Google script, and the mail and SMS stubs.
- `src/db/schema.ts` — the same records, written as SQL, for a future server. The demo does not open a database.
- `docs/PLAN.md` — the implementation plan.
- `docs/OPEN_QUESTIONS.md` — legal questions, product questions, and keys.

Draft terms and a draft privacy note are inside the app. They are marked as drafts. They are not legal advice, and they do not claim a licence or a company registration number.
