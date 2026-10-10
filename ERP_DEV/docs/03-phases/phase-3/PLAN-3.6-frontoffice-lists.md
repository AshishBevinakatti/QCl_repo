# Unit 3.6 Plan — Front-office lists (departures, in-house, alerts)

- Purpose: replace the three dashboard "coming soon" cards with live data from three new read-only endpoints. Audience: user (approver), developers. Last verified: 2026-10-10. Owner: project team.
- Entry: UI-dashboard merged (`31c675e`); branch `feature/frontoffice-lists` cut from `develop`. No source code until this plan is approved (Rule 3).

## Goal
`GET /api/v1/departures?date=`, `GET /api/v1/in-house`, `GET /api/v1/alerts` (all read-only, no migration — every field is joinable from existing tables), covered by MockMvc tests-first, wired into the dashboard cards + Departures KPI. Guest requests / maintenance issues / walk-in queue / alert ages stay out (no entities — Slice B declined for now).

## SOW / REQ references
ERP-03 (REQ-ERP03-001…007: departures, in-house, room grid); alerts derive from ERP-03 stays + HSK tasks + ERP-07 payments. TRACEABILITY REQ-ERP03 group (code/tests columns).

## In scope
1. `GET /api/v1/departures?date=` (default today IST): checked-in stays whose reservation `checkoutDate` = date → `{stayId, reservationId, ref8, guestName, roomNo, checkinDate, checkoutDate, nights, outstandingPaise, status: "Ready"|"Pending Payment"}` (`outstandingPaise` via existing `FolioService.outstandingForStay`; >0 → Pending Payment). Joins in code via `StayRepository.findCheckedIn` + `findById` lookups (small desk volumes; no N+1 risk at this scale, same pattern as occupancy()).
2. `GET /api/v1/in-house` → `{stayId, guestName, roomNo, checkoutDate, status: "In House"}` from the same stay set (no date filter — currently staying).
3. `GET /api/v1/alerts` → `{severity: "high"|"medium"|"info", text, ref}` derived only: (a) open housekeeping tasks (`todo`/`doing`/`inspect` via `findByPropertyIdAndStatus`) on rooms whose status is not ready → "Room {no} not ready"; (b) `Payment.status=pending` (via `findByPropertyId`, age from existing `createdAt`) → "Payment verification required — {ref}"; (c) checked-in stays with reservation checkout < today → "Overstay — Room {no}". No invented timestamps: items without age read "today".
4. Auth: same as sibling reads (`dashboard`, `arrivals`) — authenticated-only, 401 anonymous (verified in tests). No new roles.
5. Frontend (`dashboard.tsx` + `api.ts` only): departures table (Time "—" — no times stored; Check Out + View Folio actions wired to existing `checkOut`/`folioByStay`), in-house table, alerts feed with severity dots, Departures KPI live. Preview keeps empty-state text (no invented guest names — standing rule).

## Out of scope
Any migration or entity change; guest-request / maintenance-issue / walk-in-queue tracking (no entities — later unit); alert ages for tasks; arrivals Time/Guests "—" columns (needs reservation model change); theme/layout changes beyond the three cards + KPI.

## Design decisions
- Enrichment server-side in one round-trip per card (WHY: the dashboard already needs N+1 client fetches for arrivals; lists must not multiply that).
- "Ready" derives purely from folio outstanding (WHY: matches the check-out settlement gate — one definition of settled).
- Alerts are computed, not stored (WHY: no alert entity exists; stored alerts would need a migration + writer paths for zero current benefit).

## Tests to write (failing first)
`FrontOfficeListsApiTest` (MockMvc, `@WithMockUser(authorities="RECEPTION")`, own 2027 dates/rooms, containment assertions — shared-H2 lesson): departures row content + outstanding>0→Pending Payment + empty-date empty list; in-house contains fresh check-in; alerts contain the dirty-room + pending-payment items; 401 anonymous on all three; unknown-guest/room defensiveness (row degrades, never 500).

## Docs to update
This PLAN; `erp-03-front-office.md` (endpoints + coming-soon removals); `api.md`/`openapi` if the unit regenerates them (note current lag); TRACEABILITY REQ-ERP03; DEVLOG/STATE.

## Risks
- Outstanding=0 for folio-less stays reads "Ready" though nothing was ever charged — correct per gate definition, documented.
- Alerts recompute per load; at resort scale (tens of rows) this is trivial — no caching.
- Live Postgres has real checkouts; H2 tests use synthetic 2027 dates — same containment discipline as 3.3.

## Open questions
None new (Q-011 banner answered; Slice B declined).

## Definition of done
- [ ] Three endpoints return the contracted shapes; suite green (new tests + full `mvn verify`); `npm run build` green; preview 200.
- [ ] Dashboard cards + KPI live in Live mode post-login; Preview unchanged in honesty (no invented rows).
- [ ] Docs + traceability + logs in the same change; user approves commit; merge separate.

## Estimated slices
1. Departures endpoint + tests. 2. In-house + tests. 3. Alerts + tests. 4. Frontend wiring + docs + verify + present.

## Approval
- Requested at presentation. Code starts only after approval.
