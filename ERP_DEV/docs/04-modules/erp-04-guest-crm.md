# ERP-04 — Guest Management / CRM

- Purpose: single guest database — profiles, history, preferences, search, returning recognition, membership/service links. Audience: architects, ERP-04 builders. Last verified: 2026-10-22. Owner: project team.
- SOW: §7 (CORE). REQs: REQ-ERP04-001…005. Phase: 3.1 (first core unit — others depend on guest); 3.13 Guest 360. Status: baselined; 3.13 implemented (uncommitted as of 2026-10-22).

## Actors/roles
Reception (register/lookup), Manager (merge/admin), Membership desk (member link). Guests do not edit CRM directly.

## Business rules
1. Phone = identity key `[ASSUMED]`; duplicate phone warns/merges, never silent duplicates. WHY: one guest, one history.
2. Profiles: minimal data only (privacy rule); ID images encrypted + access-controlled; consent + retention documented (DPDP note — counsel confirms, we document).
3. Stay/booking history auto-attaches on reservation create (SOW §2.2 integrated principle).
4. Membership + enabled service activity linked on same profile (REQ-ERP04-004).
5. No hard deletes; merge keeps audit trail.

## Data model
`guest` (id, name, phone unique, email nullable, id_type, preferences json, status, merged_into nullable) · `guest_communication` (guest_id, channel, template, sent_at, status) · links to `reservation`, `member`, `folio`. `V10__guest_email.sql` adds the email column and a non-unique `(property_id, email)` lookup index; no backfill or destructive change.

## API endpoints
`POST /api/v1/guests` · `GET /api/v1/guests/{id}` · `PATCH /api/v1/guests/{id}` · `GET /api/v1/guests?search=` · `GET /api/v1/guests/{id}/profile` (3.13 bounded read model) · `GET /api/v1/guests/{id}/stays` (compatibility stub) · `POST /api/v1/guests/merge`.

## Screens
Guest search; Guest 360 profile (identity header, operational stay/booking summary, Overview, Reservations & stays, Billing & payments, Requests & notes); registration/edit modal with optional email; merge tool (manager only).

## Permissions
Any authenticated staff can read the existing guest workspace/profile projection. Reception/Manager/SuperAdmin: create/edit. Manager/SuperAdmin: merge + delete-request (soft). Membership: link/unlink member. All writes are audited; hiding an action in the UI is not the security boundary.

## Guest 360 read model (3.13)
`GET /api/v1/guests/{id}/profile` returns DTOs only — no entities, raw preference JSON, payment credentials or ID document values. It combines: guest identity (including optional `email`); membership number/tier/status/validity/points; active stay; next `hold`/`confirmed` reservation; latest 20 reservations with reservation/stay status, category and assigned room; canonical folio totals and outstanding; invoice metadata; bounded pending/failed payment indicators; derived operational state/alerts; and parsed, labelled preferences. The balance is always `FolioService.outstanding`; the frontend never sums money. Live actions navigate to the existing Front Office/Billing workspaces — the profile repeats no booking, check-in/out or payment rules.

## Configuration options
ID types, preference keys, duplicate-match thresholds `[ASSUMED]`, retention windows (counsel-confirmed later).

## Integrations/adapters
Booking (auto-create/update), membership (link), folio (charges view), notification history.

## Events/audit entries
`guest.created/updated/merged`, `preference.updated`, PII access where required.

## Tests
Duplicate-merge test, history-attach test, search test, RBAC test, soft-delete test.

## Change history
- 2026-10-09: Phase 1 baseline from SOW §7 + phone-key assumption.
- 2026-10-09 (3.1, as-built): `V3__guest_crm.sql` (`guest` + full `UNIQUE(property_id, phone)` — same script on Postgres and H2, which has no partial indexes; `guest_communication` table + mapping, writes in Phase 4); `erp04/` (entity with mergeInto, search repo, controller: create 201 / duplicate 409 / validation 400 / search / update + clash 409 / stays-hook `[]` / manager-only merge + audit); shell Guests screen (search + create; merge UI deferred to manager screens). Tests: 9 GuestApiTest green. Code: `services/erp-app/.../erp04/`, `web/src/{App.tsx (Guests), api.ts}`.
- 2026-10-10 (user rule: no customer/guest seed data): `V8__remove_demo_guests.sql` deletes the three V3 demo guests (forward-only fix — V3 untouched); all GuestApiTest cases now create their own data; preview sample guests removed from `web/src/demo.ts`.
- 2026-10-21 (Unit 3.10, local demo exception): user approved six fabricated `Demo` guests for **local-only** reception testing via `scripts/dev/reception-demo.sh` (no Flyway, no auto-seed, fixed IDs, reset supported). Production/UAT remain seed-free; the earlier rule still applies outside this explicit fixture. The E2E run also found `GET /guests/{id}/stays` still returns an empty history hook despite existing bookings (report: `docs/03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md`).
- 2026-10-21 (Unit 3.11, as-built): Guests shell rebuilt as a search-first master/detail workspace (`web/src/guests.tsx`): debounced name/phone search with clear/Enter and stale-response guard, selectable result rows, inspect profile (real fields only), contextual membership enrolment, retained points redemption, Add New Guest modal with duplicate-phone recovery via `GUEST_EXISTS`/`existingGuestId`, created-guest auto-open, global-search single-match auto-open, preview/no-auth/403/empty/error states, responsive single-column and 390px bottom-sheet. The standalone Find/New/Enroll cards and `MembersView` were removed; no backend/API change. Tests: 8 Guests tests (12 frontend total) + live Create 201/duplicate/enrolment/global-jump. Remaining backend gaps unchanged: no email/address, `GET /guests/{id}/stays` empty, reservations have no guest filter.

- 2026-10-21 (Unit 3.12, as-built): presentation-only alignment with the shared design system (`02-architecture/ui-design-system.md`) — `PageHeader`, search card, responsive master/detail, tokenised rows/profile/modal and a 560px bottom sheet, Inter + Lucide. Search/create/duplicate/enrol/redeem/global-jump handlers and API calls are unchanged; no backend change.
- 2026-10-22 (Unit 3.13, as-built — uncommitted): Guest 360 profile. Backend: `V10__guest_email.sql` nullable email + non-unique lookup index; bounded `GET /guests/{id}/profile` via `GuestProfileDto`/`GuestProfileService`; batched stay/room/category reads; latest-20 history; canonical `FolioService.outstanding`; invoice/payment indicators; derived alerts; parsed preferences; email create/edit validation; create/update RBAC restricted to RECEPTION/MANAGER/SUPERADMIN. Frontend: identity header, operational summary, Overview / Reservations & stays / Billing & payments / Requests & notes tabs, optional email on create/edit, profile navigation to Front Office/Billing, responsive rows and honest unsupported states; 3.12 tokens preserved. Tests: backend full suite 78/78 (GuestApiTest 11 + GuestProfileApiTest 5), frontend 26/26 (16 Guests), build/lint/diff checks green. Live: real Keycloak/Postgres in-house/upcoming/member/departed/no-booking profiles, canonical totals, set/clear email with audit, 403/404 boundaries, 1440/1366/1024/768/390 with no page overflow or uncaught errors. Gaps: address/DOB/nationality/ID number/verification, notes, service requests, communication history, merge UI; `GET /guests/{id}/stays` still a stub; published OpenAPI copy stale. No commit/merge/push.
