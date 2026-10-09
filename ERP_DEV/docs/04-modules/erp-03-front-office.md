# ERP-03 — Front Office

- Purpose: reception daily operations — arrivals/departures, check-in/out, allocation/transfer, occupancy, activity logs. Audience: architects, ERP-03 builders. Last verified: 2026-10-09. Owner: project team.
- SOW: §6 (CORE). REQs: REQ-ERP03-001…007. Phase: 3.3 (with housekeeping). Status: baselined; design/code pending.

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
`GET /api/v1/front-office/dashboard?date=` · `POST /api/v1/stays/check-in` · `POST /api/v1/stays/{id}/transfer` · `POST /api/v1/stays/{id}/check-out` · `POST /api/v1/walk-ins` · `GET /api/v1/arrivals?date=` · `GET /api/v1/departures?date=`.

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

## Known limits
ID-verification depth pending client process answers; biometric beyond scope (SOW §30).

## Change history
- 2026-10-09: Phase 1 baseline from SOW §6 + assumed times.
- 2026-10-09 (3.3, as-built): `V5__front_office_housekeeping` (stay/room_transfer/housekeeping_task); StayService (gated check-in with auto-assign, settlement-gated check-out + auto task, transfer with folio-follows stub, walk-in chain); room-level overlap guard + pessimistic lock + race test; dashboard/arrivals/occupancy; folio stub `FolioBalance` (3.4 fills, no API change); shell reception screens. Code: `services/erp-app/.../erp03/`, `web/src/{App.tsx (FrontOffice/WalkIn), api.ts}`.
