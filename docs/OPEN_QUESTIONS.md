# Open questions — Carpool Mauritius, version A

This file is the list to resolve before a public launch. The software does not answer them, and it does not invent licences, registration numbers, or insurance cover.

The attached spec file named in the original task was not on disk when this repository was built. The legal and financial model implemented here is the version A model from that task: **free ride matching only**. There is no fare, no in-app payment, no cost sharing, and no mode for version B (paid rides) or version C (regulated cost sharing).

## Legal

1. Does unpaid carpool matching in Mauritius need an NLTA licence, a public-service-vehicle licence, a contract-car permit, or another authorisation? Version A is built as a noticeboard. That is an unchecked assumption, not a legal opinion.
2. Do ordinary motor policies in Mauritius cover a carpool passenger when no money changes hands? The app must not tell anyone they are insured.
3. If people later exchange cash outside the app, does the product still count as unpaid? The software cannot see that. Counsel should decide what the terms forbid.
4. Who is the data controller: a sole trader, or a company named Bojo Solutions? The registered name, BRN, and address are not in this repository and are not invented here.
5. Data Protection Act 2017: is registration with the Data Protection Office required? What is the lawful basis for storing a driving-licence number? How long are phones, plates, and trip history kept? If a future server sits outside Mauritius, is that a cross-border transfer?
6. Is 18 the right minimum age for both roles?
7. Are gender-filtered trips lawful? They are not built.
8. What must happen when someone reports a safety incident? Who is told, and what records must be kept? In this demo a report stays in the browser.
9. The English and French drafts need a Mauritius lawyer. Kreol Morisien is not provided.
10. Are Rodrigues and the outer islands in scope, and do the same transport rules apply? This demo only matches mainland Mauritius.

## Product

1. Are the match radii right: 10 km around each end, or 4 km from the straight-line corridor?
2. Should weekday commute templates be added next?
3. Should a request expire automatically before departure?
4. Should a real SMS check happen before a phone number is shown? The demo only has a stub code.
5. Should the plate stay hidden until people meet, instead of appearing after acceptance?
6. Is there an official plate pattern that should be validated? The demo only checks length and characters.
7. If licence or insurance files are uploaded later, who may view them and where are they stored?
8. Should a second administrator be required before anyone can be approved? Self-review is already blocked.
9. Is the public name “Carpool Mauritius”, or is there a shorter trade name?
10. Do passengers need the same style of review as drivers, or only drivers?

## API keys and services

| Name | Required for the demo? | What it is for |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Optional browser key for the Maps JavaScript API. Restrict it by HTTP referrer. Empty means the Mauritius place list and the schematic map. A real key is baked into the static JavaScript, so it must not be a secret server key. |
| SMS provider | Not used | Phone confirmation is a stub. No SMS vendor is called, and no account name is invented. |
| Email provider | Not used | Notices stay on screen. The mail adapter records that nothing was sent. |

No `AUTH_SECRET`, database password, or payment key exists, because the demo has no server and no payment.

## What stays mocked

- Place search: a built-in list of Mauritius localities.
- Distance: straight-line kilometres and a 40 km/h estimate, labelled as not a driving route.
- Map: an SVG of the island, unless `VITE_GOOGLE_MAPS_API_KEY` was set when the site was built.
- SMS: the code `000000` is shown on the account page. No message is sent.
- Email: every notice says mail was not sent.
- Accounts and trips: `localStorage` in the browser. Demo passwords are shown on the sign-in screen because they are sample data, not credentials for a real service.
