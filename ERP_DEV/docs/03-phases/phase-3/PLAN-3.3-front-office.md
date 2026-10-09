# Unit 3.3 Plan — Front-office + Housekeeping (reception daily work)

- Purpose: turn confirmed bookings into stays — allocate real rooms, check in/out, track cleaning so reception always knows what is sellable. Audience: user (approver), developers. Last verified: 2026-10-09. Owner: project team.
- Entry: 3.2 merged green on `develop`. No code until this plan is approved (Rule 3).

## Goal
`V5__front_office` (stay, room_transfer, housekeeping_task), check-in (gated) / check-out (settlement-gated) / transfer (folio follows), walk-in flow, arrivals/departures/occupancy endpoints, housekeeping board (assign → doing → inspect → done, room flips feed reception), settlement stub for 3.4, reception screens + board UI.

## SOW / REQ references
REQ-ERP03-001…007 (SOW §6), REQ-HSK-001 (SOW §19); module docs `erp-03-front-office.md`, `housekeeping.md`; data-model.md (stay/transfer/task); api.md; screens.md §§2–5, 12.

## In scope
1. `V5__front_office` migration: `stay` (reservation FK, room FK, checkin/out timestamps, status), `room_transfer` (stay, from/to, actor, reason, at — append-only), `housekeeping_task` (room FK, assignee, status, notes) + demo data (none bookable — reference rows only where FK-safe; tasks created by flow, not seed).
2. Check-in `POST /stays/check-in {reservationId, roomId?}`: requires reservation confirmed + room ready + same category + no overlapping stay on that room; auto-assign first free ready room if roomId omitted; sets reservation checked-in + room occupied (room.status: ready→occupied) + audit. Walk-in `POST /walk-ins {guest..., categoryId, roomId?, dates=today→tomorrow}` = book + confirm + check-in in one audited chain.
3. Check-out `POST /stays/{id}/check-out`: requires folio settled — 3.4 not built, so rule = outstanding must be zero per folio stub (folio returns 0 now; enforcement real, stub returns zero — documented); sets booking checked-out + room dirty + auto-creates housekeeping task (todo) + audit.
4. Transfer `POST /stays/{id}/transfer {toRoomId, reason}`: target free + ready + same category; old room → dirty (+task), new → occupied; folio follows guest (folio link stubbed for 3.4 with TODO); audit both legs.
5. Housekeeping: `GET /housekeeping/board` (rooms with status + open task), `POST /housekeeping/tasks` (manual), `PATCH /tasks/{id}` (todo→doing→inspect→done; done → room ready + audit); supervisor = any manager; staff updates own tasks (assignee field, no strict ownership in MVP — documented).
6. Queries: arrivals/departures for business date (Asia/Kolkata), occupancy overview (per category: total/occupied/available), activity log = audit filtered (booking/stay/hsk actions).
7. Shell: reception dashboard (arrivals, departures, in-house, room grid with status, balances stub 0 until 3.4) + check-in/out/transfer actions + housekeeping board with status buttons.
8. Tests: gates (dirty-room check-in blocked, unpaid override rule, double-assign same room → 409, transfer moves folio ref, checkout creates task, task-done flips ready, walk-in chain, RBAC reception vs manager override, date-boundary arrivals).

## Out of scope
Payment collection/refund + real folio balances (3.4 — stub returns zero, gates enforced against the stub interface so 3.4 just fills it), ID-verification depth (checklist field only), night-audit (3.7), staff-task ownership strictness (documented simplification).

## Design decisions (locked here, all `[ASSUMED]` → config)
- Check-in/out times 12:00/11:00 (config, from V2 seed); arrivals date = Asia/Kolkata business date.
- Physical-room overlap guard: same room cannot host overlapping stays (DB is category-pool; room-level guard is a query + 409, same pattern as 3.2, with its own concurrency test).
- Room status single-writer rule: front-office writes occupied/dirty-on-exit; housekeeping writes cleaning→ready; enforced by code review + tests, not DB roles.

## Config vs code
Times, verification checklist, override reasons in config; state machines + guards in code (tested).

## Tests to write (tests-first where logic matters)
Gate matrix, double-assign race (2 threads, same room → exactly one stay), transfer integrity, checkout→task→ready chain, walk-in end-to-end, arrivals boundary (midnight IST), RBAC.

## Docs to update
`erp-03` + `housekeeping` modules as-built, TRACEABILITY REQ-ERP03/HSK-001 code/tests, openapi regen, DEVLOG/STATE.

## Risks
- Room-level race differs on Postgres vs H2 — same pessimistic pattern as 3.2 (lock room row), race test proves.
- Folio stub (zero balances) could mask settlement bugs → gates coded against interface + stub clearly marked; 3.4 fills without API change.

## Open questions
None new.

## Definition of done
- [ ] V4→V5 clean; gate/race/chain tests green; full suite green; web builds; live re-verified.
- [ ] Docs + traceability in same change; user approves commit; merge separate.

## Estimated slices
1. V5 + entities + room guard. 2. Check-in/out/transfer/walk-in + audit. 3. Housekeeping tasks + board. 4. Queries + gates tests + race. 5. Shell screens. 6. Docs + present.

## Approval
- Requested at presentation. Branch `feature/3.3-front-office` created only after approval.
