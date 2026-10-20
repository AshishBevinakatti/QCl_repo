# ERP-03 — Front Office

- Purpose: reception daily operations — arrivals/departures, check-in/out, allocation/transfer, occupancy, activity logs. Audience: architects, ERP-03 builders. Last verified: 2026-10-18. Owner: project team.
- SOW: §6 (CORE). REQs: REQ-ERP03-001…007. Phase: 3.3 + UI dashboard (2026-10-10). Status: built, live-verified; departures/alerts endpoints still missing (see limits).

## Actors/roles
Reception (primary), Manager (approvals/overrides), Housekeeping (status feed), Accounts (balances). Guest verification per SOW §6.

## Business rules
1. Check-in requires booking confirmed + room Ready + ID verification; otherwise blocked with reason (SOW §6 workflow).
2. Walk-in = guest + booking (source=walk-in) + allocate + check-in in one audited flow (REQ-ERP03-003).
3. Transfer moves folio with guest; old room → dirty, new room → occupied (REQ-ERP03-004).
4. Check-out requires folio settled; override needs approve permission + reason (REQ-ERP03-005).
5. Business date = Asia/Kolkata; arrivals/departures computed on it. WHY: midnight confusion causes wrong room counts.
6. All writes audited; outstanding balances visible where billing integrated (SOW §6).

## Data model (entities)
Uses `reservation`, `room`, `guest` (ERP-02/04) + `stay` (reservation_id, room_id, checkin_at, checkout_at, status) + `room_transfer` (stay_id, from_room, to_room, actor, reason).

## State machine
Stay: `expected → checked-in → checked-out`; Room (reception view): `vacant-ready → occupied → dirty → cleaning → ready` (housekeeping owns dirty→ready transitions).

## API endpoints
`GET /api/v1/front-office/dashboard?date=` · `POST /api/v1/stays/check-in` · `POST /api/v1/stays/{id}/transfer` · `POST /api/v1/stays/{id}/check-out` · `POST /api/v1/walk-ins` · `GET /api/v1/arrivals?date=` · `GET /api/v1/departures?date=` (3.6) · `GET /api/v1/in-house` (3.6) · `GET /api/v1/alerts` (3.6, computed).
Correction 2026-10-10: earlier text listed `GET /api/v1/departures?date=` — that endpoint does **not** exist (verified in `StayController`); departures, alerts/service-requests, and stay-detail GET are all missing, hence the coming-soon cards below.

## Screens
Reception dashboard (arrivals/departures/in-house/room grid/balances), check-in form (verification checklist), transfer dialog, check-out + settlement view, activity log.

## Permissions
Reception: check-in/out/transfer/walk-in. Manager: overrides + reservation modification approval. Housekeeping: status updates only. Accounts: balance adjustments only.

## Configuration options
Check-in/out times `[ASSUMED: 12:00 in / 11:00 out, configurable]`, verification checklist, override reasons.

## Integrations/adapters
Room-status feed (housekeeping), folio/billing (balances + settlement), guest CRM (verification + history), notification adapter (arrival reminders where configured).

## Events/audit entries
`stay.checked-in/checked-out/transferred`, `walk-in.created`, `override.applied` — actor + before/after + reason mandatory.

## Tests
Check-in gate tests (dirty/unpaid blocked), transfer folio-follow test, settlement-block test, RBAC test, arrivals-date-boundary test.

## Reception dashboard UI (as-built 2026-10-10, `web/src/dashboard.tsx`)
Reference-image layout, theme palette kept: icon side nav (Dashboard, Reservations, Guests, Room Management, Check-in/out, Billing & Payments, Service Requests, Housekeeping, Reports + Settings/Logout + staff card), topbar search (guest name/phone, booking UUID, room number matched client-side), live clock, greeting banner with the user-supplied pool photo (`web/src/assets/banner.jpg`, source logged in RESOURCES_LOG), 5 KPI cards, arrivals table with working Check-In, SVG room-status donut, recent bookings, Manage-Rooms promo. Members screens live under Guests (no Members entry in the reference nav).
Live vs coming-soon (verified against `StayController`): live = KPIs (except Departures), arrivals enrichment (`GET /reservations/{id}` + `GET /guests/{id}` per row, failures degrade to "—"), donut, recent bookings, room grid; coming-soon = Departures table, Alerts & Tasks, In-House Guests table, Service Requests / Reports / Settings views, row "…" menus, bell badge.
Update 2026-10-10 (3.6): Departures table, In-House Guests table, Alerts feed, and the Departures KPI are now live (endpoints above). Still coming-soon: guest requests / maintenance issues / walk-in queue (no entities), Service Requests / Reports / Settings views, arrivals Time/Guests "—" columns.
Update 2026-10-18 (3.8): arrivals = confirmed bookings whose check-in IS the business date (the overlap window stays only for the bookings-on-date list; mid-stay confirmeds are in-house, not arrivals); `/front-office/dashboard` returns arrivals fully enriched in one batch (guest name, category, dates, status, advance — no per-row refetch); UI business date = Asia/Kolkata via one `businessToday()` helper (UTC bug gone); dashboard shows a loading panel and 401 handling instead of blank/zero metrics; topbar search is debounced (300ms, Enter immediate) with a stale-response guard, short booking-ref prefix lookup (`GET /reservations/search?ref=`, erp-02), and an honest "search unavailable — log in" message when signed out; View-all on arrivals/departures/recent-bookings preloads the check desk's today list (confirmed / checked-in / all); recent bookings reuse list DTOs (one guest lookup per row, ≤8). No visual redesign.
Donut mapping: `ready`→Available, `occupied`→Occupied, `dirty`/`cleaning`/`inspect`/`out_of_order`→Maintenance, anything else→Available; Reserved shows "—" (rooms carry no reserved status). Arrival Time and Guests-count columns show "—" (backend stores dates, not times; reservations carry no party size). Fonts: SF Pro system stack (Apple-licensed, not bundlable) + Material Symbols CDN (user-approved 2026-10-10). No guest names invented anywhere: Preview shows layout/empty states only (standing user rule).

## Known limits
ID-verification depth pending client process answers; biometric beyond scope (SOW §30).

## Change history
- 2026-10-09: Phase 1 baseline from SOW §6 + assumed times.
- 2026-10-09 (3.3, as-built): `V5__front_office_housekeeping` (stay/room_transfer/housekeeping_task); StayService (gated check-in with auto-assign, settlement-gated check-out + auto task, transfer with folio-follows stub, walk-in chain); room-level overlap guard + pessimistic lock + race test; dashboard/arrivals/occupancy; folio stub `FolioBalance` (3.4 fills, no API change); shell reception screens. Code: `services/erp-app/.../erp03/`, `web/src/{App.tsx (FrontOffice/WalkIn), api.ts}`.
- 2026-10-10 (UI dashboard, as-built): reference-image reception dashboard (`dashboard.tsx`: Sidebar/Topbar/DashboardView/RoomsView), enrichment helpers in `api.ts` (`reservationById`, `enrichReservations`), shared blocks in `ui.tsx` (Icon/Soon/Kpi/Donut), SF Pro stack + Material Symbols CDN in `index.html`, banner photo asset, Preview extended without guest names. No backend change. Verified: `npm run build` green, preview 200 + banner 200.
- 2026-10-10 (3.6, as-built): `GET /departures` (folio-driven Ready/Pending Payment), `GET /in-house`, `GET /alerts` (open tasks + pending payments + overstays; no stored alerts); `Payment.getCreatedAt` getter (no migration); `FrontOfficeListsApiTest` (6 tests); dashboard cards + Departures KPI + Billing folio-jump wired. Suite green 56/0/0. Lesson: shared-H2 global footprint — new tests use free phones (09xx) and the untouched Suite pool (Deluxe pool exhaustion + phone collision broke StayRaceTest/BillingApiTest first run).
- 2026-10-18 (3.8, as-built): arrivals semantics (checkin-date query `arrivingOn`) + dashboard `ArrivalDto` batch enrichment (one guest query; category names shared with occupancy); frontend business-date helper (`businessToday`), loading/401 hardening, debounced short-ref search, View-all prefill (`Jump.bookingStatus`), recent-bookings reuse of list DTOs; `enrichReservations`/`reservationById` removed (dead per-row tail). Suite green 58/0/0; live smoke: ref search `a611c4bc` found, junk → empty, dashboard OK. Code: `services/erp-app/.../erp03/StayController.java`, `web/src/{dashboard.tsx,App.tsx,api.ts,demo.ts}`.
