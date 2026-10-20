# Unit 3.8 Plan — Dashboard functional completeness (user brief)

- Purpose: respond to the user's dashboard brief (2026-10-17, A–L checklist) with the smallest set of changes that makes the existing reception dashboard accurate, reliable and fully functional — **without changing the UI design**. Audience: user (approver), developers. Last verified: 2026-10-17. Owner: project team.
- Entry: branch `feature/dashboard-completeness` from `develop` (after 3.7 merges); 3.7 desk actions live on `feature/desk-confirm-flow`. No source code until this plan is approved (Rule 3).
- Baseline to preserve: current dashboard at 3.7 (screenshot is the user's visual acceptance reference).

## Goal
Every brief item (A–L) is either working off real data end-to-end with correct business rules, or is documented as not-yet-supported by the backend — never faked. Visual layout unchanged.

## Audit verdicts (evidence gathered 2026-10-17, file:line in DEVLOG entry)
- A stat cards: live off one `GET /front-office/dashboard` call; **arrivals semantics overlap window** (`ReservationRepository.java:38-41`); **UTC business-date bug** (`toISOString().slice(0,10)`: `dashboard.tsx:141/187/532`, `App.tsx:167`); no loading state (blank until data).
- B arrivals: live; check-in works (`StayService` auto-assign); but enrichment costs ≤25×2 HTTP calls per load (`dashboard.tsx:212-214` → `enrichReservations`, `api.ts:411`); View all unfiltered.
- C departures: live; check-out gated on Ready/outstanding 0; refresh after action works; View all unfiltered.
- D donut+legend+boxes: live SVG, zero-guarded; "Reserved" honestly shows "—" (no room-level reserved status exists — rooms belong to category pools until check-in).
- E alerts: live (readiness, pending-payment, overstays); no service-request/maintenance entities — already stated in UI; keep documented.
- F recent bookings: live + 3.7 actions; redundant per-row `reservationById` refetch (list already returns full DTOs).
- G in-house: live; refreshes after check-in/out.
- H search: guest/phone/full-UUID/room work; **8-char ref (what every row shows) silently fails**; submit-only (no debounce/stale guard); errors swallowed → "No matches".
- I bell: static, tooltip stale ("no alerts API yet" — false); no notification system exists.
- J Manage Rooms: navigates to Room Management view (works).
- K sidebar: all items navigate; Requests/Reports/Settings are honest "Soon" placeholders (future units ERP-11/08).
- L clock/identity: wired (Keycloak username/roles); business date bug (frontend UTC vs backend `BookingService.java:33` `Asia/Kolkata`).

## In scope (smallest set)
1. **Business date**: `businessToday()` helper (Asia/Kolkata — same zone the backend gates on) replacing every frontend `toISOString().slice(0,10)` business date (dashboard, search, rooms, availability, check-in desk).
2. **Arrivals semantics**: dashboard endpoint uses confirmed reservations with **checkin_date = business date** (new repository query); the overlap window stays for `GET /reservations?date=` (bookings-on-date list is correct). Late/no-show visibility becomes an alert category later (documented).
3. **Load UX hardening**: explicit loading panel instead of blank; 401 via `HttpError`/`isAuthError` (drop message regex); API failure never renders as zero metrics.
4. **Search**: 300ms debounce + Enter; sequence guard so stale responses never overwrite; **short-ref prefix lookup** on reservations (backend query, portable `cast(id as varchar)`); visible "cannot search — log in/backend down" feedback.
5. **Enrichment batching**: arrivals enriched server-side in the dashboard endpoint (single batch, `DashboardDto` extension); recent-bookings reuse of list DTOs (drop per-row refetch). Net: dashboard load loses the ≤50-call tail; UI identical.
6. **View all with filter**: arrivals/departures jump to the check-in desk with today's booking list preloaded (existing `Jump` + front-office bookings table).
7. **Docs**: erp-03/erp-08 module notes — Reserved limitation, alert categories, notifications gap, Requests/Reports/Settings placeholders = future units.

## Out of scope (deliberately — future units or declined)
- Real "Reserved" room status, service-request/maintenance entities, notification system/bell badge, reservations list view, Requests/Reports/Settings pages, RFID/OTA units. Brief items without backend support are documented, not fabricated (brief's own rule).
- Any UI redesign; only in-pattern additions (loading text, search behavior).
- Removing the `…` placeholder buttons in arrival/departure rows (existing UI; removal changes the design — parked).

## Design decisions
- One business-zone helper, single source of truth (WHY: UTC already caused a 00:00–05:30 IST wrong-day window).
- Server-side batch enrichment instead of client N+1 (WHY: brief forbids N+1; identical visuals; keeps role enforcement server-side).
- Prefix match for short refs server-side (WHY: every screen shows 8-char refs; users type them; no new UI).
- Keep honest "—"/empty states for unsupported categories (WHY: brief: document, never fabricate).

## Tests to write/update
- Backend: arrivals query (today-only confirmed; excludes in-house/cancelled/hold), short-ref prefix search (valid/invalid/no-match), dashboard DTO enrichment shape; keep portable SQL for H2 PG-mode.
- Frontend: `npm run build`; live smoke (dashboard loads, short-ref search, collect→confirm flow still green).
- User click-through: A–L spot checks against the brief; visual diff vs screenshot at same viewport.

## Docs to update
- `erp-03-front-office.md` (dashboard semantics: arrivals = checkin today; loading/error behavior), `erp-02` (prefix search), DEVLOG/STATE, TRACEABILITY (REQ-ERP03-001…006 rows).

## Risks
- `DashboardDto` shape change touches `api.ts`/`demo.ts`/tests — contained, one slice.
- Prefix `LIKE` on casted UUID must pass on Postgres **and** H2 PG-mode (slice gate).
- Arrivals no-show visibility change (late confirmeds with past check-in leave the panel) — documented; alert category considered later.

## Open questions
- None blocking. (Notifications: reuse `/alerts` later — separate unit.)

## Definition of done
- A–L: each verified-live with evidence or documented limitation; no silent zeros on API failure; short-ref search works; business date = resort zone; dashboard load has no N+1 tail.
- `mvn -B verify` green; `npm run build` green; user confirms visual preservation; docs + logs updated; commit on approval; merge separate.

## Estimated slices
1. Date helper. 2. Arrivals query + tests. 3. Loading/401 hardening. 4. Search (debounce/guard/prefix + tests). 5. Enrichment batching + tests. 6. View-all prefill. 7. Docs, verify, present.

## Approval
- Requested at presentation (2026-10-17). Code starts only after approval.
