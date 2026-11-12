# Unit 3.13 Plan — Guest 360° profile

- Purpose: give reception one coherent guest workspace showing identity, the real reservation/stay situation, authoritative folio/payment summary, membership state, preferences and honest unsupported areas. Audience: user (approver), developers, QA. Last verified: 2026-10-22. Owner: project team.
- Entry: branch `feature/3.13-guest-360-profile`, stacked on `feature/3.12-ui-design-system` at `59c2f35`. 3.11 and 3.12 are committed but unmerged, so starting from `develop` would omit the current Guests workspace and design system. No rebase/merge/push in this unit.
- Approval: the user supplied the master Guest 360° implementation brief on 2026-10-22 and instructed implementation to proceed after inspection. This plan records the inspected scope; the working tree is not committed until explicit commit authorization.
- SOW: ERP-04 Guest Management/CRM (§7), ERP-05 Membership (§8), ERP-03 Front Office (§2/§6), ERP-07 Billing (§9). No new loyalty/tier/benefit/refund behaviour.

## Goal
A receptionist can open a guest and understand who the guest is, whether a reservation or stay is active, which room/category is involved, what the authoritative balance is, whether the guest is a member, and what valid next action exists. All values come from existing records or a documented derived projection.

## Inspection and field-to-source mapping

| Profile field | Source of truth | Status |
|---|---|---|
| Full name, phone, record status | `guest.name`, `guest.phone`, `guest.status` | Exists |
| Guest internal identifier | `guest.id` (8-char display ref) | Exists |
| Email | `guest.email` | **Missing** — add nullable column |
| ID type | `guest.id_type` | Exists; no document number is stored or exposed |
| Verification status | none | Unsupported; do not invent |
| Preferences | `guest.preferences` TEXT JSON | Exists; parse into labelled key/value output, never render raw JSON |
| Membership number, tier, status, validity, points | `member.*` + `loyalty_ledger` derived balance | Exists |
| Current stay | `stay` checked-in for the guest's reservations | Exists; join through `reservation.guest_id` |
| Current/upcoming reservation | `reservation.guest_id`, status, dates | Exists; add bounded repository queries |
| Assigned room and category | `stay.room_id` → `room.room_no`, `reservation.category_id` → `room_category.name` | Exists; batch reads |
| Actual check-in/check-out | `stay.checkin_at`, `stay.checkout_at` | Exists; add entity getters |
| Reservation vs stay status | `reservation.status`, `stay.status` | Exists; keep distinct in the DTO/UI |
| Booking reference/source | `reservation.id` display ref, `reservation.source` | Exists |
| Guest count | none in `reservation` | Unsupported; omit rather than invent |
| Folio status, charges, payments, credits | `folio`, signed `folio_entry` rows | Exists |
| Outstanding balance | `FolioService.outstanding(folioId)` | Exists; canonical |
| Pending/failed payments | `payment.status`, bounded by folio/booking | Exists; expose indicators only, never card data |
| Invoice availability | `invoice` by folio | Exists; read-only, immutable |
| Advance paid/due | `payment` captured total + `reservation.advance_due_paise` | Exists |
| Operational alerts | derived from the above (overstay, departure balance, payment status) | Derived read model |
| Guest notes | none | Not implemented; no general-purpose table added |
| Service requests | planned in the design baseline, no table/endpoint | Not implemented; Requests & Notes shows honest unavailable states |
| Housekeeping tasks | room-scoped, not guest-scoped | Not part of the guest projection |
| Audit trail | `audit_event` for guest writes; no guest audit reader endpoint | Guest edits remain audited; no new audit UI invented |

## Data-gap decisions
1. **Schema change:** add nullable `guest.email VARCHAR(320)` in `V10__guest_email.sql` plus a non-unique `(property_id, email)` lookup index. Email is a normal profile contact field and the current `guest` table has no equivalent. Existing records are preserved; no defaults, no backfill, no delete. Rollback would drop the index and column (and the email values), so rollback is data-lossy and is not planned.
2. **No new notes table:** the brief forbids adding a general-purpose notes table before the required fields, visibility, retention and audit rules are agreed. The tab shows an honest unavailable state.
3. **No new service-request table:** the service-request module is still a later phase. No fake records or derived request counts.
4. **No verification model:** show the recorded ID type and state that verification is not tracked in this release.
5. **No guest count:** reservation rows do not capture adults/children; do not fabricate `1 guest`.
6. **No guest communication reader:** `guest_communication` exists but has no writer flow; leave it out of Guest 360 rather than expose an empty/incompatible history.

## Backend design
- New `GET /api/v1/guests/{id}/profile` on the existing guest route. Returns DTOs only:
  - guest header (id, name, phone, email, idType, status, memberId);
  - membership (number, tier, status, validFrom, validTo, points);
  - `currentStay` (active only) and `nextReservation` (confirmed/hold when no active stay);
  - a bounded latest-20 reservation history with batched stay/room/category data;
  - billing summary (folio, charges, payments, credits, canonical outstanding, advance due/paid, invoice, pending/failed payment indicators);
  - derived operational state and bounded operational alerts;
  - parsed, labelled preferences.
- New `GuestProfileService` uses existing repositories and `FolioService`; no cross-service/database access. Queries: one bounded reservation page, one stay batch, one room/category batch, one member read, one points balance, one folio read, entries, one invoice and bounded payment alerts. No per-row guest/reservation requests.
- History/page size is bounded at 20; no unbounded payment/folio line loading.
- Reuse `FolioService.outstanding` for the balance; the frontend never sums money.
- Add only the smallest supporting entity/repository getters: `Guest.email`, `Stay.checkinAt/checkoutAt`, `Member.validFrom`, `Invoice.issuedAt`, guest reservation queries, stay batch/active queries, folio latest lookup and bounded payment-alert queries.
- Keep `GET /guests/{id}/stays` unchanged for compatibility; Guest 360 uses the new profile projection.

## Authorization and privacy
- Existing authenticated reads stay aligned with the current guest workspace.
- Guest create/update become explicitly restricted to `RECEPTION`, `MANAGER`, `SUPERADMIN` (the same roles the UI offers edit/create to); membership enrolment keeps its existing allow-list. Manager-only merge stays unchanged.
- Profile returns only fields reception needs. No full identity document numbers, scans, card numbers, CVVs, gateway credentials or raw JSON.
- Guest edits remain audited with before/after plus reason; no sensitive payment/identity values are logged.
- Hiding an action is presentation only; every write remains server-authorised.

## Frontend design
- Keep the search-first master/detail workspace. When no guest is selected the results use the full width; when selected the results become a compact rail and the profile becomes the wide work surface (single column ≤1100px).
- Identity header: avatar, name, display guest ref, phone/email, active status, membership chip, Edit Guest (role-gated).
- Operational summary before the tabs: current stay / upcoming reservation / no active stay, dates, room and category, balance, member tier, and contextual navigation only when valid.
- Tabs: Overview, Reservations & Stays, Billing & Payments, Requests & Notes.
  - Overview: contact, record status, ID type (verification explicitly unsupported), preferences, membership with enrol/redeem actions.
  - Reservations & Stays: bounded history with booking ref, distinct reservation/stay status, dates, category, room, actual times and navigation to Front Office/Billing.
  - Billing & Payments: backend totals, pending/failed indicators, invoice availability, link to the existing Billing workspace. No refund/payment capability is invented.
  - Requests & Notes: operational alerts plus honest “not yet available” states; no fake notes/requests.
- Actions navigate to existing front-office/billing workspaces where check-in/out/payment rules already live. The profile does not duplicate booking/check-in/check-out/payment logic.
- Edit uses a modal with name, phone, optional email and ID type, validates client-side, sends PATCH, refreshes the authoritative profile and shows success/error feedback. Create gains the optional email field.
- Preserve the 3.12 tokens, typography, currency (`rupees`), date formatting, focus rings, loading/error/empty states, responsive rules and the existing user-facing copy style. No horizontal page/table overflow; history uses responsive rows, not a wide table.
- Preview remains honest: no invented guest/profile rows.

## Tests and verification
- Backend:
  - guest create/edit with email + invalid email validation + audit;
  - profile for a guest with no reservations (empty current/next/history, no billing);
  - confirmed upcoming reservation (current null, next populated);
  - active stay (real room/category/timestamps, canonical outstanding from `FolioService`);
  - historical checked-out stay (reservation and stay statuses distinct);
  - member and non-member profile states;
  - preferences parsed without exposing raw JSON;
  - unknown guest 404 and role-forbidden guest edit;
  - Flyway applies V10 on H2 and existing guest rows remain.
- Frontend:
  - search/selection/profile load, current stay and balance rendering;
  - no-reservation empty state and missing optional fields;
  - upcoming/confirmed vs active-stay actions;
  - historical reservations and membership/non-member states;
  - profile load error with retry;
  - no raw JSON/invented values;
  - create/duplicate/enrolment/edit flows preserved and role-gated.
- Commands: backend `mvn test`, frontend `npm test`, `npm run lint`, `npm run build`, `git diff --check`.
- Live verification with the running stack and real Keycloak/Postgres: search/open a demo guest with in-house stay, verify room/category/balance/membership/history; verify a guest with no bookings; verify non-member; exercise Edit and re-load; responsive screenshots at 1440/1366/1024/768/390; no horizontal overflow, no uncaught console errors; confirm existing check-in/out/billing/membership actions still open.

## Out of scope
- New booking, payment, refund, invoice, checkout or housekeeping actions inside the profile.
- Notes/service-request/verification persistence until their business rules are agreed.
- Fabricated guests, reservations, stays, rooms, balances, tiers, points, benefits or dates.
- Merge UI, loyalty renew/adjust UI, router, unrelated screens.
- Destructive migrations, database reset, commit/merge/push without explicit approval.

## Delivery slices
1. Plan/records + branch.
2. V10 nullable email and guest entity/DTO/create-update changes.
3. Profile DTO/service/repository queries + backend tests.
4. Frontend profile/tabs/edit + frontend tests.
5. Full test/lint/build run and live verification.
6. Docs/logs/STATE update; present for review, no commit.

## Definition of done
- A receptionist can understand identity, reservation/stay, room/category, billing, membership and operational alerts from one workspace.
- Every displayed value is from an existing record or documented derived projection; unsupported notes/requests/verification are labelled honestly.
- Existing business logic and permissions remain authoritative; no new table beyond the justified nullable email column.
- Backend/frontend tests, lint, build and responsive live checks are green; docs/logs updated.
- Commit awaits explicit user approval.

## As-built status (2026-10-22) — complete, uncommitted
- Backend: `V10__guest_email.sql` adds nullable `guest.email` and a non-unique `(property_id, email)` index. `GET /api/v1/guests/{id}/profile` returns a DTO-only projection: guest identity (including email), membership, current stay, next actionable reservation, latest-20 history, canonical folio billing, invoice, bounded payment indicators, derived alerts/state and parsed preferences. Existing PostgreSQL records were preserved; Flyway is at version 10.
- Backend rules: balance comes from `FolioService.outstanding`; history is bounded; stay/room/category reads are batched; no general notes/service-request/verification table was added. Guest create/update now require `RECEPTION`, `MANAGER` or `SUPERADMIN`; merge remains manager-only. Email is validated/optional and can be cleared with an empty string.
- Frontend: search-first master/detail kept; identity header, operational summary and four tabs (Overview, Reservations & stays, Billing & payments, Requests & notes) added. Edit supports optional email/ID type; create supports optional email. Profile actions only navigate to existing Front Office/Billing workflows; no booking/check-in/check-out/payment logic was duplicated. Alerts and unsupported areas are honest.
- Tests: backend full suite **78/78 green** (17 classes; `GuestApiTest` 11 and new `GuestProfileApiTest` 5); frontend **26/26** (16 Guests tests); `npm run build` green (2,227 modules; 374.31 kB JS / 110.55 kB gzip; 50.90 kB CSS / 9.74 kB gzip); lint exit 0 with only pre-existing warnings in unrelated shell files; `git diff --check` clean.
- Live: real Keycloak/Postgres checks covered in-house (`Demo Aarav Mehta`), upcoming (`Demo Ananya Verma`), member/no-active-stay (`Demo Rohan Iyer`), departed (`Demo Meera Nair`) and a no-booking guest; canonical folio totals, invoice, alerts, history and tabs rendered. Email set/clear on `Demo Meera Nair` worked and was restored to `null`; audit rows record the edit. Membership can read profiles (200) but guest writes return 403; unknown guest returns 404. CDP at 1440/1366/1024/768/390 showed no page horizontal overflow and no uncaught console errors.
- Data state: 8 guests retained; no reset or destructive migration. `QA Workspace Guest` remains from the earlier approved 3.11 create test; `Demo Meera Nair` final email is `null`.
- Still unsupported (honest gaps): address, DOB, nationality, ID document number, verification status, guest notes, service requests, communication history and merge UI. `GET /guests/{id}/stays` remains a compatibility stub; Guest 360 uses `/profile`. The published OpenAPI copy is still stale (runtime has 49 paths including `/guests/{id}/profile`).
- Commit status: **not committed**. No push/merge/tag. Awaiting explicit user approval.
